import { doublePrecision, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

export const levels = pgTable("level", {
  id: uuid("id").defaultRandom().primaryKey(),
  level: integer("level").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  minExp: doublePrecision("min_exp").notNull(),
  maxExp: doublePrecision("max_exp").notNull(),
  rewardPoints: doublePrecision("reward_points").notNull().default(0),
  iconUrl: text("icon_url"),
});

export type Level = typeof levels.$inferSelect;
export type NewLevel = typeof levels.$inferInsert;
