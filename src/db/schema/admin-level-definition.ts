import { integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { countries } from "./country";

export const adminLevelDefinitions = pgTable(
  "admin_level_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    type: text("type").notNull(),
    nameLocal: text("name_local").notNull(),
    nameEn: text("name_en"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    countryLevelTypeUnique: unique("admin_level_definitions_country_level_type_unique").on(
      table.countryId,
      table.level,
      table.type,
    ),
  }),
);

export type AdminLevelDefinition = typeof adminLevelDefinitions.$inferSelect;
export type NewAdminLevelDefinition = typeof adminLevelDefinitions.$inferInsert;
