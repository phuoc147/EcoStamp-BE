import { doublePrecision, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./user";

export const pointTransactions = pgTable("point_transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 32 }).notNull(),
  sourceType: varchar("source_type", { length: 32 }).notNull(),
  sourceId: uuid("source_id").notNull(),
  points: doublePrecision("points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;
