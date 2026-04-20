import { and, eq, or } from "drizzle-orm";
import { db } from "../../../db";
import {
  employees,
  levels,
  partners,
  stationAttendances,
  userLocations,
  greenStationLocations,
  userLevels,
  users,
  type Employee,
  type GreenStationLocation,
  type NewEmployee,
  type NewGreenStationLocation,
  type NewPartner,
  type NewUserLocation,
  type NewUser,
  type Partner,
  type UserLocation,
  type User,
  type NewGreenStation,
  type GreenStation,
  type NewStationAttendance,
  type StationAttendance,
  greenStations,
} from "../../../db/schema/index";

export class ProfileRepo {
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalizedUsername = username.trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1);

    return user ?? null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    return user ?? null;
  }

  async findByUsernameOrPhone(identifier: string): Promise<User | null> {
    const normalizedIdentifier = identifier.trim();

    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, normalizedIdentifier),
          eq(users.phone, normalizedIdentifier),
        ),
      )
      .limit(1);

    return user ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }

  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();

    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  async createUserLocation(data: NewUserLocation): Promise<UserLocation> {
    const [location] = await db.insert(userLocations).values(data).returning();

    if (!location) {
      throw new Error("Failed to create user location");
    }

    return location;
  }

  async findEmployeeByUserId(userId: string): Promise<Employee | null> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId))
      .limit(1);
    return employee ?? null;
  }

  async findEmployeeActorByUserId(userId: string): Promise<{
    employee: Employee;
    partnerId: string;
  } | null> {
    const [result] = await db
      .select({
        employee: employees,
        partnerId: greenStations.partnerId,
      })
      .from(employees)
      .innerJoin(greenStations, eq(employees.stationId, greenStations.id))
      .where(eq(employees.userId, userId))
      .limit(1);

    return result ?? null;
  }

  async findOwnedPartnerByUserId(userId: string): Promise<Partner | null> {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.ownerUserId, userId))
      .limit(1);

    return partner ?? null;
  }

  async findPartnerById(id: string): Promise<Partner | null> {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, id))
      .limit(1);

    return partner ?? null;
  }

  async createPartner(data: NewPartner): Promise<Partner> {
    const [partner] = await db.insert(partners).values(data).returning();

    if (!partner) {
      throw new Error("Failed to create partner");
    }

    return partner;
  }

  async createPartnerOnboardingBundle(data: {
    ownerUserId: string;
    partnerStatus?: NewPartner["status"];
    stationName: string;
    stationCode: string;
    stationStatus?: NewGreenStation["status"];
    location: {
      latitude?: number | null;
      longitude?: number | null;
      street?: string | null;
      streetNumber?: string | null;
      formattedAddress: string;
    };
  }): Promise<{
    partner: Partner;
    station: GreenStation;
    location: GreenStationLocation;
  }> {
    return db.transaction(async (tx) => {
      const [partner] = await tx
        .insert(partners)
        .values({
          ownerUserId: data.ownerUserId,
          status: data.partnerStatus ?? "ACTIVE",
        })
        .returning();

      if (!partner) {
        throw new Error("Failed to create partner");
      }

      const [station] = await tx
        .insert(greenStations)
        .values({
          partnerId: partner.id,
          name: data.stationName,
          code: data.stationCode,
          status: data.stationStatus ?? "ACTIVE",
        })
        .returning();

      if (!station) {
        throw new Error("Failed to create green station");
      }

      const [location] = await tx
        .insert(greenStationLocations)
        .values({
          stationId: station.id,
          latitude: data.location.latitude ?? null,
          longitude: data.location.longitude ?? null,
          street: data.location.street ?? null,
          streetNumber: data.location.streetNumber ?? null,
          formattedAddress: data.location.formattedAddress,
        })
        .returning();

      if (!location) {
        throw new Error("Failed to create green station location");
      }

      return { partner, station, location };
    });
  }

  async createGreenStationLocation(data: NewGreenStationLocation): Promise<GreenStationLocation> {
    const [location] = await db.insert(greenStationLocations).values(data).returning();

    if (!location) {
      throw new Error("Failed to create green station location");
    }

    return location;
  }
  async createGreenStation(data: Omit<NewGreenStation, "id">): Promise<GreenStation> {
    const [station] = await db.insert(greenStations).values(data).returning();

    if (!station) {
      throw new Error("Failed to create green station");
    }

    return station;
  }

  async createEmployee(data: NewEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(data).returning();

    if (!employee) {
      throw new Error("Failed to create employee");
    }

    return employee;
  }

  async findEmployeeByUserAndStation(
    userId: string,
    stationId: string,
  ): Promise<Employee | null> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.userId, userId), eq(employees.stationId, stationId)))
      .limit(1);

    return employee ?? null;
  }

  async findStationByCode(code: string): Promise<GreenStation | null> {
    const [station] = await db
      .select()
      .from(greenStations)
      .where(eq(greenStations.code, code))
      .limit(1);

    return station ?? null;
  }

  async existsStationCode(code: string): Promise<boolean> {
    const station = await this.findStationByCode(code);
    return station !== null;
  }

  async findStationById(stationId: string): Promise<GreenStation | null> {
    const [station] = await db
      .select()
      .from(greenStations)
      .where(eq(greenStations.id, stationId))
      .limit(1);

    return station ?? null;
  }

  async findStationLocationByStationId(stationId: string): Promise<GreenStationLocation | null> {
    const [location] = await db
      .select()
      .from(greenStationLocations)
      .where(eq(greenStationLocations.stationId, stationId))
      .limit(1);

    return location ?? null;
  }

  async createStationAttendance(data: NewStationAttendance): Promise<StationAttendance> {
    const [attendance] = await db.insert(stationAttendances).values(data).returning();

    if (!attendance) {
      throw new Error("Failed to create station attendance request");
    }

    return attendance;
  }

  async findStationAttendanceByUserAndStation(
    userId: string,
    stationId: string,
  ): Promise<StationAttendance | null> {
    const [attendance] = await db
      .select()
      .from(stationAttendances)
      .where(
        and(
          eq(stationAttendances.userId, userId),
          eq(stationAttendances.stationId, stationId),
        ),
      )
      .limit(1);

    return attendance ?? null;
  }

  async listStationAttendancesByPartnerOwnerUserId(ownerUserId: string) {
    return db
      .select({
        attendance: stationAttendances,
        station: greenStations,
        user: users,
      })
      .from(stationAttendances)
      .innerJoin(greenStations, eq(stationAttendances.stationId, greenStations.id))
      .innerJoin(partners, eq(greenStations.partnerId, partners.id))
      .innerJoin(users, eq(stationAttendances.userId, users.id))
      .where(eq(partners.ownerUserId, ownerUserId));
  }

  async findStationAttendanceById(attendanceId: string): Promise<{
    attendance: StationAttendance;
    station: GreenStation;
  } | null> {
    const [result] = await db
      .select({
        attendance: stationAttendances,
        station: greenStations,
      })
      .from(stationAttendances)
      .innerJoin(greenStations, eq(stationAttendances.stationId, greenStations.id))
      .where(eq(stationAttendances.id, attendanceId))
      .limit(1);

    return result ?? null;
  }

  async deleteStationAttendanceById(attendanceId: string): Promise<void> {
    await db.delete(stationAttendances).where(eq(stationAttendances.id, attendanceId));
  }

  async getUserLevelSummary(userId: string): Promise<{
    levelId: string;
    currentExp: number;
    totalExp: number;
    levelNumber: number;
    levelName: string;
  } | null> {
    const [result] = await db
      .select({
        levelId: userLevels.levelId,
        currentExp: userLevels.currentExp,
        totalExp: userLevels.totalExp,
        levelNumber: levels.level,
        levelName: levels.name,
      })
      .from(userLevels)
      .innerJoin(levels, eq(userLevels.levelId, levels.id))
      .where(eq(userLevels.userId, userId))
      .limit(1);

    return result ?? null;
  }
}
