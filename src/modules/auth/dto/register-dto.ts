import { z } from "zod";
import { authSession, authUser, profileActions } from "./auth-dto";
import { userRes } from "../../user/dto/profile-dto";


// Binary image

export const registerLocation = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  street: z.string().trim().min(1).optional(),
  streetNumber: z.string().trim().min(1).optional(),
  formattedAddress: z.string().trim(),
});

export const registerReq = z.object({
  username: z.string().trim().min(3),
  name: z.string().trim().min(2),
  location: registerLocation,
  email: z.string().email(),
  phone: z.string().trim().min(8),
  male: z.enum(["MALE", "FEMALE", "OTHER"]),
  password: z.string().min(6),
});

export const registerRes = z.object({
  user: userRes,
});

export const registerPartnerReq = z.object({
  stationName: z.string().trim().min(2),
  location: registerLocation,
});

export const registerPartnerRes = z.object({
  registered: z.literal(true),
  partnerId: z.string().uuid(),
  stationId: z.string().uuid(),
  stationCode: z.string(),
  session: authSession,
  user: authUser,
  actions: profileActions,
});

export const registerEmployeeReq = z.object({
  stationCode: z.string().trim().min(10),
  role: z.string().trim().min(1).optional(),
});

export const registerEmployeeRes = z.object({
  requested: z.literal(true),
  requestId: z.string().uuid(),
  stationId: z.string().uuid(),
  stationCode: z.string(),
  session: authSession,
  user: authUser,
  actions: profileActions,
});

export type RegisterReq = z.infer<typeof registerReq>;
export type RegisterLocation = z.infer<typeof registerLocation>;
export type RegisterRes = z.infer<typeof registerRes>;
export type RegisterPartnerReq = z.infer<typeof registerPartnerReq>;
export type RegisterPartnerRes = z.infer<typeof registerPartnerRes>;
export type RegisterEmployeeReq = z.infer<typeof registerEmployeeReq>;
export type RegisterEmployeeRes = z.infer<typeof registerEmployeeRes>;
