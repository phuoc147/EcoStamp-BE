import type { NextFunction, Request, Response } from "express";
import { AuthRepo } from "../repository/auth-repo";
import { AuthService } from "../services/auth-service";
import { ProfileRepo } from "../../user/repository/profile-repo";
import { HttpError } from "../../../middlewares/error";
import { sendSuccess } from "../../../common/http/response";
import type {
  RegisterEmployeeReq,
  RegisterEmployeeRes,
  RegisterPartnerReq,
  RegisterPartnerRes,
  RegisterReq,
  RegisterRes,
} from "../dto/register-dto";

const profileRepo = new ProfileRepo();
const authRepo = new AuthRepo();
const authService = new AuthService(profileRepo, authRepo);

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username, name, location, email, phone, male, password } =
      req.body as Partial<RegisterReq>;

    if (!username || !location || !email || !phone || !male || !password) {
      throw new HttpError(
        400,
        "username, location object, email, phone, male and password are required",
      );
    }

    const user = await authService.register(
      username,
      name,
      location,
      email,
      phone,
      male,
      password,
    );

    sendSuccess<RegisterRes>(res, 201, { user }, "Register successfully");
  } catch (error) {
    next(error);
  }
};

export const registerPartnerOnProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.session_token as string | undefined;
    const payload = req.body as Partial<RegisterPartnerReq>;

    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!payload.stationName || !payload.location) {
      throw new HttpError(
        400,
        "stationName and location are required",
      );
    }

    const result = await authService.registerPartnerOnProfile(token, {
      stationName: payload.stationName,
      location: payload.location,
    });

    sendSuccess<RegisterPartnerRes>(
      res,
      201,
      {
        registered: true,
        partnerId: result.partner.id,
        stationId: result.station.id,
        stationCode: result.station.code,
        session: {
          expiresAt: result.auth.session.expiresAt.toISOString(),
          activeRole: result.auth.session.activeRole,
        },
        user: result.auth.user,
        actions: result.auth.actions,
      },
      "Partner and green station registered successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const registerEmployeeOnProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.session_token as string | undefined;
    const payload = req.body as Partial<RegisterEmployeeReq>;

    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!payload.stationCode) {
      throw new HttpError(400, "stationCode is required");
    }

    const result = await authService.registerEmployeeOnProfile(token, {
      stationCode: payload.stationCode,
      role: payload.role,
    });

    sendSuccess<RegisterEmployeeRes>(
      res,
      202,
      {
        requested: true,
        requestId: result.attendance.id,
        stationId: result.station.id,
        stationCode: result.station.code,
        session: {
          expiresAt: result.auth.session.expiresAt.toISOString(),
          activeRole: result.auth.session.activeRole,
        },
        user: result.auth.user,
        actions: result.auth.actions,
      },
      "Join request sent successfully",
    );
  } catch (error) {
    next(error);
  }
};
