import { doublePrecision, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { wasteTypes } from "./waste-type";

export const wastePointRules = pgTable("waste_point_rule", {
  id: uuid("id").defaultRandom().primaryKey(),
  wasteTypeId: uuid("waste_type_id")
    .notNull()
    .references(() => wasteTypes.id, { onDelete: "cascade" }),
  pointsPerKg: doublePrecision("points_per_kg").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
});

export type WastePointRule = typeof wastePointRules.$inferSelect;
export type NewWastePointRule = typeof wastePointRules.$inferInsert;
