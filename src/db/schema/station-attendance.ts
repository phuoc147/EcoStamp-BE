import { pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./user";
import { greenStations } from "./green-station";

export const stationAttendances = pgTable(
  "station_attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stationId: uuid("station_id")
      .notNull()
      .references(() => greenStations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull().default("STAFF"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uqUserStation: uniqueIndex("uq_station_attendance_user_station").on(table.userId, table.stationId),
  }),
);

export type StationAttendance = typeof stationAttendances.$inferSelect;
export type NewStationAttendance = typeof stationAttendances.$inferInsert;
