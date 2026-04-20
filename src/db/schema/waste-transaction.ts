import { doublePrecision, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employee";
import { greenStations } from "./green-station";
import { users } from "./user";
import { wasteTypes } from "./waste-type";

export const wasteTransactions = pgTable("waste_transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  stationId: uuid("station_id")
    .notNull()
    .references(() => greenStations.id, { onDelete: "restrict" }),
  wasteTypeId: uuid("waste_type_id")
    .notNull()
    .references(() => wasteTypes.id, { onDelete: "restrict" }),
  empId: uuid("emp_id")
    .notNull()
    .references(() => employees.id, { onDelete: "restrict" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  weight: doublePrecision("weight").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  note: text("note"),
});

export type WasteTransactionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type WasteTransaction = typeof wasteTransactions.$inferSelect;
export type NewWasteTransaction = typeof wasteTransactions.$inferInsert;
