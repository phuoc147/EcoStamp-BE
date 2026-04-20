import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const wasteTypes = pgTable("waste_type", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  recyclable: boolean("recyclable").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WasteType = typeof wasteTypes.$inferSelect;
export type NewWasteType = typeof wasteTypes.$inferInsert;
