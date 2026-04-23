import { pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { greenStations } from "./green-station";
import { wasteTypes } from "./waste-type";

export const stationWasteTypes = pgTable(
  "station_waste_type",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stationId: uuid("station_id")
      .notNull()
      .references(() => greenStations.id, { onDelete: "cascade" }),
    wasteTypeId: uuid("waste_type_id")
      .notNull()
      .references(() => wasteTypes.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uqStationWasteType: uniqueIndex("uq_station_waste_type").on(table.stationId, table.wasteTypeId),
  }),
);

export type StationWasteType = typeof stationWasteTypes.$inferSelect;
export type NewStationWasteType = typeof stationWasteTypes.$inferInsert;
