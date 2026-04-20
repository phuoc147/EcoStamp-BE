import { integer, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./user";
import { wasteTransactions } from "./waste-transaction";

export const wasteTransactionEvents = pgTable("waste_transaction_event", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => wasteTransactions.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 32 }).notNull(),
  payload: jsonb("payload"),
  payloadVersion: integer("payload_version").notNull().default(1),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WasteTransactionEventType =
  | "CREATED"
  | "UPDATED"
  | "INVALID"
  | "REJECTED"
  | "APPROVED"
  | "CORRECTED";

export type WasteTransactionEvent = typeof wasteTransactionEvents.$inferSelect;
export type NewWasteTransactionEvent = typeof wasteTransactionEvents.$inferInsert;
