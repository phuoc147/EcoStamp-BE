import type { User } from "../../../db/schema/index";
import { z } from "zod";

export const userStatus = z.enum([
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "BANNED",
  "DELETED",
]);

export const userGender = z.enum(["MALE", "FEMALE", "OTHER"]).nullable();

export const userRes = z.object({
  id: z.string().uuid(),
  username: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  status: userStatus,
  male: userGender,
  avatarUrl: z.string().nullable(),
  qrCode: z.string(),
  createdAt: z.string().datetime(),
});

export type UserRes = z.infer<typeof userRes>;

export const stationProfileRes = z.object({
  station: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    status: z.string(),
    partnerId: z.string().uuid(),
  }),
  partner: z.object({
    id: z.string().uuid(),
    ownerUserId: z.string().uuid(),
    status: z.string(),
  }),
  location: z.object({
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    street: z.string().nullable(),
    streetNumber: z.string().nullable(),
    formattedAddress: z.string(),
  }).nullable(),
});

export const myProfileRes = z.object({
  user: userRes,
});

export type StationProfileRes = z.infer<typeof stationProfileRes>;
export type MyProfileRes = z.infer<typeof myProfileRes>;

export const toUserRes = (user: User): UserRes => {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    male: user.male,
    avatarUrl: user.avatarUrl,
    qrCode: user.qrCode,
    createdAt: user.createdAt.toISOString(),
  };
};
