import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./error";
import { AuthRepo } from "../modules/auth/repository/auth-repo";
import type { AuthUser } from "../modules/auth/dto/auth-dto";
import { AuthService } from "../modules/auth/services/auth-service";
import { ProfileRepo } from "../modules/user/repository/profile-repo";

const authRepo = new AuthRepo();
const authService = new AuthService(new ProfileRepo(), authRepo);

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionToken?: string;
      activeRole?: AuthUser["role"];
    }
  }
}

const withAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.session_token as string | undefined;

    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const authContext = await authService.getAuthContext(token);
    req.user = authContext.user;
    req.activeRole = authContext.session.activeRole;
    req.sessionToken = token;

    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (roles: Array<AuthUser["role"]>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }

    const activeRole = req.activeRole ?? req.user.role;

    if (!roles.includes(activeRole)) {
      next(new HttpError(403, "Forbidden"));
      return;
    }

    next();
  };
};

export const auth = withAuth;
export const authMiddleware = withAuth;
export const userAuth = [withAuth, requireRole(["USER"])] as const;
export const employeeAuth = [withAuth, requireRole(["EMPLOYEE"])] as const;
export const partnerAuth = [withAuth, requireRole(["PARTNER"])] as const;
export const employeeOrPartnerAuth = [
  withAuth,
  requireRole(["EMPLOYEE", "PARTNER"]),
] as const;
