import { doublePrecision, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { levels } from "./level";
import { users } from "./user";

export const userLevels = pgTable("user_level", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  levelId: uuid("level_id")
    .notNull()
    .references(() => levels.id, { onDelete: "restrict" }),
  currentExp: doublePrecision("current_exp").notNull().default(0),
  totalExp: doublePrecision("total_exp").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserLevel = typeof userLevels.$inferSelect;
export type NewUserLevel = typeof userLevels.$inferInsert;
