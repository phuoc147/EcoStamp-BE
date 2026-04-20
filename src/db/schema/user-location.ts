import { doublePrecision, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { administrativeUnits } from "./administrative-unit";
import { users } from "./user";

export const userLocations = pgTable("user_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  adminUnitId: uuid("admin_unit_id")
    .references(() => administrativeUnits.id, { onDelete: "restrict" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  street: text("street"),
  streetNumber: text("street_number"),
  formattedAddress: text("formatted_address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type UserLocation = typeof userLocations.$inferSelect;
export type NewUserLocation = typeof userLocations.$inferInsert;
