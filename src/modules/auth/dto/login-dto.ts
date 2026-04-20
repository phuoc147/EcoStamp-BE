import { z } from "zod";
import { authSession, authUser, profileActions } from "./auth-dto";

export const loginReq = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export const loginRes = z.object({
  loggedIn: z.literal(true),
  session: authSession,
  user: authUser,
  actions: profileActions,
});

export const logoutRes = z.object({
  loggedOut: z.literal(true),
});

export type LoginReq = z.infer<typeof loginReq>;
export type LoginRes = z.infer<typeof loginRes>;
export type LogoutRes = z.infer<typeof logoutRes>;
