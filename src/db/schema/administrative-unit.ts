import { type AnyPgColumn, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { adminLevelDefinitions } from "./admin-level-definition";
import { countries } from "./country";

export const administrativeUnits = pgTable("administrative_units", {
  id: uuid("id").defaultRandom().primaryKey(),
  countryId: uuid("country_id")
    .notNull()
    .references(() => countries.id, { onDelete: "cascade" }),
  adminLevelDefinitionId: uuid("admin_level_definition_id")
    .notNull()
    .references(() => adminLevelDefinitions.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  type: text("type").notNull(),
  level: integer("level").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => administrativeUnits.id, {
    onDelete: "set null",
  }),
  code: text("code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AdministrativeUnit = typeof administrativeUnits.$inferSelect;
export type NewAdministrativeUnit = typeof administrativeUnits.$inferInsert;
