import { doublePrecision, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./user";

export const userLevelLogs = pgTable("user_level_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fromLevel: integer("from_level").notNull(),
  toLevel: integer("to_level").notNull(),
  expGain: doublePrecision("exp_gain").notNull(),
  sourceType: varchar("source_type", { length: 32 }).notNull(),
  sourceId: uuid("source_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserLevelLog = typeof userLevelLogs.$inferSelect;
export type NewUserLevelLog = typeof userLevelLogs.$inferInsert;
