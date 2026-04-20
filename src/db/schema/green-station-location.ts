import { doublePrecision, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { administrativeUnits } from "./administrative-unit";
import { greenStations } from "./green-station";

export const greenStationLocations = pgTable("green_station_location", {
  id: uuid("id").defaultRandom().primaryKey(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  adminUnitId: uuid("admin_unit_id")
    .references(() => administrativeUnits.id, { onDelete: "restrict" }),
  stationId: uuid("station_id")
    .notNull()
    .references(() => greenStations.id, { onDelete: "cascade" }),
  street: text("street"),
  streetNumber: text("street_number"),
  formattedAddress: text("formatted_address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type GreenStationLocation = typeof greenStationLocations.$inferSelect;
export type NewGreenStationLocation = typeof greenStationLocations.$inferInsert;
