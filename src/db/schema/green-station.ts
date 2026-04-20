import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { partners } from "./partner";

export const greenStations = pgTable("green_station", {
  id: uuid("id").defaultRandom().primaryKey(),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type GreenStation = typeof greenStations.$inferSelect;
export type NewGreenStation = typeof greenStations.$inferInsert;
