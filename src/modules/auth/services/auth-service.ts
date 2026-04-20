import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { HttpError } from "../../../middlewares/error";
import { comparePassword, hashPassword } from "../../../utils/hash";
import { ProfileRepo } from "../../user/repository/profile-repo";
import { toUserRes, type UserRes } from "../../user/dto/profile-dto";
import { AuthRepo } from "../repository/auth-repo";
import type {
  RegisterEmployeeReq,
  RegisterLocation,
  RegisterPartnerReq,
  RegisterReq,
} from "../dto/register-dto";
import type {
  AuthUser,
} from "../dto/auth-dto";

const SESSION_DURATION_IN_DAYS = 7;

export class AuthService {
  constructor(
    private readonly userRepo: ProfileRepo,
    private readonly authRepo: AuthRepo,
  ) {}

  private normalizeStationCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private encodeUserIdToStationSeed(userId: string): number {
    const normalized = userId.replace(/-/g, "").toLowerCase();
    const firstPart = normalized.slice(0, 12);
    const seed = Number.parseInt(firstPart, 16);

    if (Number.isNaN(seed)) {
      throw new HttpError(500, "Failed to derive station code seed");
    }

    return seed % 1_000_000;
  }

  private buildStationCode(value: number): string {
    return `ECOS${value.toString().padStart(6, "0")}`;
  }

  private async generateUniqueStationCode(partnerId: string): Promise<string> {
    const base = this.encodeUserIdToStationSeed(partnerId);
    const maxAttempts = 32;
    const step = 7919;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const value = (base + attempt * step) % 1_000_000;
      const candidate = this.buildStationCode(value);
      const exists = await this.userRepo.existsStationCode(candidate);

      if (!exists) {
        return candidate;
      }
    }

    throw new HttpError(500, "Failed to generate a unique station code");
  }

  private normalizeDbError(error: unknown, fallbackMessage: string): HttpError {
    if (error instanceof HttpError) {
      return error;
    }

    const err = error as { code?: string; detail?: string; message?: string } | null;

    if (err?.code === "23505") {
      return new HttpError(
        409,
        "Cannot complete operation due to a unique constraint conflict",
      );
    }

    return new HttpError(500, fallbackMessage);
  }

  private async buildAuthenticatedUser(
    userId: string,
    activeRole: AuthUser["role"],
  ): Promise<AuthUser> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    const [employeeActor, ownedPartner] = await Promise.all([
      this.userRepo.findEmployeeActorByUserId(userId),
      this.userRepo.findOwnedPartnerByUserId(userId),
    ]);

    const availableRoles: AuthUser["role"][] = ["USER"];

    if (employeeActor) {
      availableRoles.push("EMPLOYEE");
    }

    if (ownedPartner) {
      availableRoles.push("PARTNER");
    }

    const resolvedActiveRole = availableRoles.includes(activeRole)
      ? activeRole
      : "USER";

    if (resolvedActiveRole === "PARTNER") {
      if (!ownedPartner) {
        throw new HttpError(403, "Partner role is not available for this account");
      }

      return {
        ...toUserRes(user),
        role: resolvedActiveRole,
        availableRoles,
        actor: {
          employeeId: employeeActor?.employee.id ?? null,
          partnerId: ownedPartner.id,
        },
      };
    }

    if (resolvedActiveRole === "EMPLOYEE") {
      if (!employeeActor) {
        throw new HttpError(403, "Employee role is not available for this account");
      }

      return {
        ...toUserRes(user),
        role: resolvedActiveRole,
        availableRoles,
        actor: {
          employeeId: employeeActor.employee.id,
          partnerId: employeeActor.partnerId,
        },
      };
    }

    return {
      ...toUserRes(user),
      role: "USER",
      availableRoles,
      actor: {
        employeeId: null,
        partnerId: null,
      },
    };
  }

  private buildProfileActions(user: AuthUser) {
    return {
      canSwitchToEmployee:
        user.availableRoles.includes("EMPLOYEE") && user.role !== "EMPLOYEE",
      canSwitchToPartner:
        user.availableRoles.includes("PARTNER") && user.role !== "PARTNER",
      canRegisterEmployee: !user.availableRoles.includes("EMPLOYEE"),
      canRegisterPartner: !user.availableRoles.includes("PARTNER"),
    };
  }

  async register(
    username: string,
    fullName: string | undefined,
    location: RegisterLocation,
    email: string,
    phone: string,
    male: RegisterReq["male"],
    password: string,
    avatarUrl?: string,
  ): Promise<UserRes> {
    const [existingUserByEmail, existingUserByUsername, existingUserByPhone] =
      await Promise.all([
        this.userRepo.findByEmail(email),
        this.userRepo.findByUsername(username),
        this.userRepo.findByPhone(phone),
      ]);

    if (existingUserByEmail) {
      throw new HttpError(409, "Email already exists");
    }

    if (existingUserByUsername) {
      throw new HttpError(409, "Username already exists");
    }

    if (existingUserByPhone) {
      throw new HttpError(409, "Phone already exists");
    }

    const hashedPassword = await hashPassword(password);
    const userId = randomUUID();
    const qrPayload = `${username}:${userId}`;
    const qrCode = await QRCode.toDataURL(qrPayload);
    const user = await this.userRepo.create({
      id: userId,
      username,
      name: fullName?.trim() || username,
      email,
      phone,
      male,
      avatarUrl,
      passwordHash: hashedPassword,
      qrCode,
    });

    await this.userRepo.createUserLocation({
      userId: user.id,
      latitude: location.latitude,
      longitude: location.longitude,
      street: location.street,
      streetNumber: location.streetNumber,
      formattedAddress: location.formattedAddress,
    });

    return toUserRes(user);
  }

  async login(
    identifier: string,
    password: string,
  ): Promise<{
    token: string;
    expiresAt: Date;
    activeRole: AuthUser["role"];
    user: AuthUser;
    actions: ReturnType<AuthService["buildProfileActions"]>;
  }> {
    const user = await this.userRepo.findByUsernameOrPhone(identifier);

    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_IN_DAYS);

    await this.authRepo.createSession({
      userId: user.id,
      token,
      activeRole: "USER",
      expiresAt,
    });

    const authUser = await this.buildAuthenticatedUser(user.id, "USER");
    const actions = this.buildProfileActions(authUser);

    return {
      token,
      expiresAt,
      activeRole: "USER",
      user: authUser,
      actions,
    };
  }

  async logout(token?: string): Promise<void> {
    if (!token) {
      return;
    }

    await this.authRepo.deleteSessionByToken(token);
  }

  async getCurrentUser(token: string): Promise<AuthUser> {
    const authContext = await this.getAuthContext(token);
    return authContext.user;
  }

  async getAuthContext(token: string): Promise<{
    session: {
      expiresAt: Date;
      activeRole: AuthUser["role"];
    };
    user: AuthUser;
    actions: ReturnType<AuthService["buildProfileActions"]>;
  }> {
    const result = await this.authRepo.findActiveSessionByToken(token);

    if (!result) {
      throw new HttpError(401, "Unauthorized");
    }

    const activeRole = (result.session.activeRole ?? "USER") as AuthUser["role"];
    const user = await this.buildAuthenticatedUser(result.user.id, activeRole);

    return {
      session: {
        expiresAt: result.session.expiresAt,
        activeRole: user.role,
      },
      user,
      actions: this.buildProfileActions(user),
    };
  }

  async switchRole(token: string, targetRole: AuthUser["role"]) {
    const current = await this.getAuthContext(token);

    if (!current.user.availableRoles.includes(targetRole)) {
      throw new HttpError(403, "Role is not available for this account");
    }

    await this.authRepo.updateSessionActiveRoleByToken(token, targetRole);
    return this.getAuthContext(token);
  }

  async registerPartnerOnProfile(token: string, payload: RegisterPartnerReq) {
    const current = await this.getAuthContext(token);
    const existingPartner = await this.userRepo.findOwnedPartnerByUserId(current.user.id);

    if (existingPartner) {
      throw new HttpError(409, "You already own a partner account");
    }

    let partner;
    let station;
    let location;

    try {
      const stationCode = await this.generateUniqueStationCode(current.user.id);
      const bundle = await this.userRepo.createPartnerOnboardingBundle({
        ownerUserId: current.user.id,
        stationName: payload.stationName,
        stationCode,
        location: {
          latitude: payload.location.latitude,
          longitude: payload.location.longitude,
          street: payload.location.street ?? null,
          streetNumber: payload.location.streetNumber ?? null,
          formattedAddress: payload.location.formattedAddress,
        },
      });

      partner = bundle.partner;
      station = bundle.station;
      location = bundle.location;
    } catch (error) {
      throw this.normalizeDbError(
        error,
        "Partner onboarding failed and all changes were rolled back",
      );
    }

    return {
      partner,
      station,
      location,
      auth: await this.getAuthContext(token),
    };
  }

  async registerEmployeeOnProfile(token: string, payload: RegisterEmployeeReq) {
    const current = await this.getAuthContext(token);

    const stationCode = this.normalizeStationCode(payload.stationCode);
    const station = await this.userRepo.findStationByCode(stationCode);

    if (!station) {
      throw new HttpError(404, "Station not found");
    }

    const existingEmployee = await this.userRepo.findEmployeeByUserAndStation(
      current.user.id,
      station.id,
    );

    if (existingEmployee) {
      throw new HttpError(409, "You are already an employee of this station");
    }

    const existingAttendance = await this.userRepo.findStationAttendanceByUserAndStation(
      current.user.id,
      station.id,
    );

    if (existingAttendance) {
      throw new HttpError(409, "Join request already exists for this station");
    }

    const attendance = await this.userRepo.createStationAttendance({
      userId: current.user.id,
      stationId: station.id,
      role: payload.role ?? "STAFF",
    });

    const location = await this.userRepo.findStationLocationByStationId(station.id);

    return {
      attendance,
      station,
      location,
      auth: await this.getAuthContext(token),
    };
  }

  async listStationAttendanceRequests(token: string) {
    const current = await this.getAuthContext(token);
    const partner = await this.userRepo.findOwnedPartnerByUserId(current.user.id);

    if (!partner) {
      throw new HttpError(403, "Only partner owner can view station requests");
    }

    const requests = await this.userRepo.listStationAttendancesByPartnerOwnerUserId(
      current.user.id,
    );

    return {
      requests,
      auth: await this.getAuthContext(token),
    };
  }

  async approveStationAttendance(token: string, attendanceId: string) {
    const current = await this.getAuthContext(token);
    const partner = await this.userRepo.findOwnedPartnerByUserId(current.user.id);

    if (!partner) {
      throw new HttpError(403, "Only partner owner can approve station requests");
    }

    const attendance = await this.userRepo.findStationAttendanceById(attendanceId);

    if (!attendance) {
      throw new HttpError(404, "Join request not found");
    }

    if (attendance.station.partnerId !== partner.id) {
      throw new HttpError(403, "You cannot approve requests for this station");
    }

    const existingEmployee = await this.userRepo.findEmployeeByUserAndStation(
      attendance.attendance.userId,
      attendance.attendance.stationId,
    );

    if (existingEmployee) {
      await this.userRepo.deleteStationAttendanceById(attendance.attendance.id);

      return {
        employee: existingEmployee,
        auth: await this.getAuthContext(token),
      };
    }

    const employee = await this.userRepo.createEmployee({
      userId: attendance.attendance.userId,
      stationId: attendance.attendance.stationId,
      status: "ACTIVE",
    });

    await this.userRepo.deleteStationAttendanceById(attendance.attendance.id);

    return {
      employee,
      auth: await this.getAuthContext(token),
    };
  }

  async rejectStationAttendance(token: string, attendanceId: string) {
    const current = await this.getAuthContext(token);
    const partner = await this.userRepo.findOwnedPartnerByUserId(current.user.id);

    if (!partner) {
      throw new HttpError(403, "Only partner owner can reject station requests");
    }

    const attendance = await this.userRepo.findStationAttendanceById(attendanceId);

    if (!attendance) {
      throw new HttpError(404, "Join request not found");
    }

    if (attendance.station.partnerId !== partner.id) {
      throw new HttpError(403, "You cannot reject requests for this station");
    }

    await this.userRepo.deleteStationAttendanceById(attendance.attendance.id);

    return {
      rejected: true as const,
      auth: await this.getAuthContext(token),
    };
  }
}
