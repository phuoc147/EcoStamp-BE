import type { NextFunction, Request, Response } from "express";
import { AuthRepo } from "../repository/auth-repo";
import { AuthService } from "../services/auth-service";
import { ProfileRepo } from "../../user/repository/profile-repo";
import { HttpError } from "../../../middlewares/error";
import { sendSuccess } from "../../../common/http/response";
import type { LoginReq, LoginRes, LogoutRes } from "../dto/login-dto";

const profileRepo = new ProfileRepo();
const authRepo = new AuthRepo();
const authService = new AuthService(profileRepo, authRepo);

const COOKIE_NAME = "session_token";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_MS,
  path: "/",
});

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as Partial<LoginReq> & {
      username?: string;
      phone?: string;
    };
    const identifier = body.identifier ?? body.username ?? body.phone;
    const password = body.password;

    if (typeof identifier !== "string" || !identifier.trim() || !password) {
      throw new HttpError(400, "identifier and password are required");
    }

    const { token, expiresAt, activeRole, user, actions } = await authService.login(
      identifier.trim(),
      password,
    );

    res.cookie(COOKIE_NAME, token, getCookieOptions());
    sendSuccess<LoginRes>(
      res,
      200,
      {
        loggedIn: true,
        session: {
          expiresAt: expiresAt.toISOString(),
          activeRole,
        },
        user,
        actions,
      },
      "Login successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.session_token as string | undefined;
    await authService.logout(token);

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    sendSuccess<LogoutRes>(res, 200, { loggedOut: true }, "Logout successfully");
  } catch (error) {
    next(error);
  }
};
