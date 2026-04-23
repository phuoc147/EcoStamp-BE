import { z } from "zod";

const pagination = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const wasteTxStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const createWasteTxReq = z.object({
  stationId: z.string().uuid(),
  wasteTypeId: z.string().uuid(),
  userId: z.string().uuid(),
  weight: z.number().positive(),
  note: z.string().trim().max(2000).optional(),
});

export const updateWasteTxStatusReq = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(2000).optional(),
});

export const listWasteTxReq = pagination.extend({
  status: wasteTxStatus.optional(),
  stationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const wasteTxRes = z.object({
  id: z.string().uuid(),
  stationId: z.string().uuid(),
  wasteTypeId: z.string().uuid(),
  empId: z.string().uuid(),
  userId: z.string().uuid(),
  weight: z.number(),
  status: wasteTxStatus,
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const createWasteTxRes = z.object({
  transaction: wasteTxRes,
});

export const listWasteTxRes = z.object({
  transactions: z.array(wasteTxRes),
  total: z.number().int().nonnegative(),
});

export const getWasteTxRes = z.object({
  transaction: wasteTxRes,
});

export const updateWasteTxStatusRes = z.object({
  transaction: wasteTxRes,
  pointsAwarded: z.number().nonnegative().optional(),
});

export type WasteTxStatus = z.infer<typeof wasteTxStatus>;
export type CreateWasteTxReq = z.infer<typeof createWasteTxReq>;
export type UpdateWasteTxStatusReq = z.infer<typeof updateWasteTxStatusReq>;
export type ListWasteTxReq = z.infer<typeof listWasteTxReq>;
export type CreateWasteTxRes = z.infer<typeof createWasteTxRes>;
export type ListWasteTxRes = z.infer<typeof listWasteTxRes>;
export type GetWasteTxRes = z.infer<typeof getWasteTxRes>;
export type UpdateWasteTxStatusRes = z.infer<typeof updateWasteTxStatusRes>;
