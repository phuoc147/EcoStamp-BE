import { z } from "zod";
import { userRes } from "../../user/dto/profile-dto";

export const authRole = z.enum(["USER", "EMPLOYEE", "PARTNER"]);

export const actorContext = z.object({
  employeeId: z.string().uuid().nullable(),
  partnerId: z.string().uuid().nullable(),
});

export const authUser = userRes.extend({
  role: authRole,
  availableRoles: z.array(authRole),
  actor: actorContext,
});

export const authSession = z.object({
  expiresAt: z.string().datetime(),
  activeRole: authRole,
});

export const profileActions = z.object({
  canSwitchToEmployee: z.boolean(),
  canSwitchToPartner: z.boolean(),
  canRegisterEmployee: z.boolean(),
  canRegisterPartner: z.boolean(),
});

export const meRes = z.object({
  session: authSession,
  user: authUser,
  actions: profileActions,
});

export const switchRoleReq = z.object({
  targetRole: authRole,
});

export const switchRoleRes = z.object({
  switched: z.literal(true),
  session: authSession,
  user: authUser,
  actions: profileActions,
});

export const stationJoinRequestItem = z.object({
  requestId: z.string().uuid(),
  requestedRole: z.string(),
  requestedAt: z.string().datetime(),
  station: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
  }),
  requester: z.object({
    userId: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
  }),
});

export const listStationJoinRequestsRes = z.object({
  requests: z.array(stationJoinRequestItem),
  session: authSession,
  user: authUser,
  actions: profileActions,
});

export const approveStationJoinRequestRes = z.object({
  approved: z.literal(true),
  employeeId: z.string().uuid(),
  session: authSession,
  user: authUser,
  actions: profileActions,
});

export const rejectStationJoinRequestRes = z.object({
  rejected: z.literal(true),
  session: authSession,
  user: authUser,
  actions: profileActions,
});

export type AuthUser = z.infer<typeof authUser>;
export type MeRes = z.infer<typeof meRes>;
export type SwitchRoleReq = z.infer<typeof switchRoleReq>;
export type SwitchRoleRes = z.infer<typeof switchRoleRes>;
export type ListStationJoinRequestsRes = z.infer<typeof listStationJoinRequestsRes>;
export type ApproveStationJoinRequestRes = z.infer<typeof approveStationJoinRequestRes>;
export type RejectStationJoinRequestRes = z.infer<typeof rejectStationJoinRequestRes>;
