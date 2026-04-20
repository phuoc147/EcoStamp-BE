import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "BANNED",
  "DELETED",
]);

export const userGenderEnum = pgEnum("user_gender", [
  "MALE",
  "FEMALE",
  "OTHER",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  male: userGenderEnum("male"),
  avatarUrl: text("avatar_url"),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  qrCode: text("qr_code").notNull().unique(),
  status: userStatusEnum("status").notNull().default("PENDING_VERIFICATION"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
