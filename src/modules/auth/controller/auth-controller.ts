import type { NextFunction, Request, Response } from "express";
import { AuthRepo } from "../repository/auth-repo";
import { AuthService } from "../services/auth-service";
import { ProfileRepo } from "../../user/repository/profile-repo";
import { HttpError } from "../../../middlewares/error";
import { sendSuccess } from "../../../common/http/response";
import type {
  ApproveStationJoinRequestRes,
  ListStationJoinRequestsRes,
  MeRes,
  RejectStationJoinRequestRes,
  SwitchRoleReq,
  SwitchRoleRes,
} from "../dto/auth-dto";

const profileRepo = new ProfileRepo();
const authRepo = new AuthRepo();
const authService = new AuthService(profileRepo, authRepo);

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const token = req.cookies.session_token as string | undefined;

		if (!token) {
			throw new HttpError(401, "Unauthorized");
		}

		const authContext = await authService.getAuthContext(token);
    sendSuccess<MeRes>(
      res,
      200,
      {
        session: {
          expiresAt: authContext.session.expiresAt.toISOString(),
          activeRole: authContext.session.activeRole,
        },
        user: authContext.user,
        actions: authContext.actions,
      },
      "Current user fetched",
    );
	} catch (error) {
		next(error);
	}
};

export const switchRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.session_token as string | undefined;
    const { targetRole } = req.body as Partial<SwitchRoleReq>;

    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!targetRole) {
      throw new HttpError(400, "targetRole is required");
    }

    const authContext = await authService.switchRole(token, targetRole);

    sendSuccess<SwitchRoleRes>(
      res,
      200,
      {
        switched: true,
        session: {
          expiresAt: authContext.session.expiresAt.toISOString(),
          activeRole: authContext.session.activeRole,
        },
        user: authContext.user,
        actions: authContext.actions,
      },
      "Role switched successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const listStationJoinRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.session_token as string | undefined;

    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }

    const result = await authService.listStationAttendanceRequests(token);

    sendSuccess<ListStationJoinRequestsRes>(
      res,
      200,
      {
        requests: result.requests.map((entry) => ({
          requestId: entry.attendance.id,
          requestedRole: entry.attendance.role,
          requestedAt: entry.attendance.createdAt.toISOString(),
          station: {
            id: entry.station.id,
            name: entry.station.name,
            code: entry.station.code,
          },
          requester: {
            userId: entry.user.id,
            name: entry.user.name,
            email: entry.user.email,
            phone: entry.user.phone,
          },
        })),
        session: {
          expiresAt: result.auth.session.expiresAt.toISOString(),
          activeRole: result.auth.session.activeRole,
        },
        user: result.auth.user,
        actions: result.auth.actions,
      },
      "Station join requests fetched",
    );
  } catch (error) {
    next(error);
  }
};

export const approveStationJoinRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.session_token as string | undefined;
    const requestId = req.params.requestId;

    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!requestId || Array.isArray(requestId)) {
      throw new HttpError(400, "requestId is required");
    }

    const result = await authService.approveStationAttendance(token, requestId);

    sendSuccess<ApproveStationJoinRequestRes>(
      res,
      200,
      {
        approved: true,
        employeeId: result.employee.id,
        session: {
          expiresAt: result.auth.session.expiresAt.toISOString(),
          activeRole: result.auth.session.activeRole,
        },
        user: result.auth.user,
        actions: result.auth.actions,
      },
      "Station join request approved",
    );
  } catch (error) {
    next(error);
  }
};

export const rejectStationJoinRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.session_token as string | undefined;
    const requestId = req.params.requestId;

    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!requestId || Array.isArray(requestId)) {
      throw new HttpError(400, "requestId is required");
    }

    const result = await authService.rejectStationAttendance(token, requestId);

    sendSuccess<RejectStationJoinRequestRes>(
      res,
      200,
      {
        rejected: result.rejected,
        session: {
          expiresAt: result.auth.session.expiresAt.toISOString(),
          activeRole: result.auth.session.activeRole,
        },
        user: result.auth.user,
        actions: result.auth.actions,
      },
      "Station join request rejected",
    );
  } catch (error) {
    next(error);
  }
};
