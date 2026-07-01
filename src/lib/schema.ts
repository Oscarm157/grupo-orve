import { pgTable, uuid, text, boolean, timestamp, jsonb, integer, numeric } from "drizzle-orm/pg-core";

export type UserRole = "admin" | "agent" | "viewer";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().default("agent").notNull(),
  active: boolean("active").default(true).notNull(),
  mustChangePassword: boolean("must_change_password").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;

// ===== Dominio: catálogo de propiedades Grupo Orve (capa 3, bespoke) =====
// `developments` = el proyecto/desarrollo (ej. Xo'ok). `units` = unidad individual
// vendible (terreno/casa/depa) con precio y m2 reales — se llena con el Excel/PDF
// real de Oscar, NO con el scraping de marketing en content/grupoorve-raw/.

export type UnitType = "terreno" | "casa" | "departamento" | "townhouse" | "local_comercial";
export type UnitStatus = "disponible" | "apartado" | "vendido";
export type DevelopmentStatus = "preventa" | "en_construccion" | "entrega_inmediata" | "vendido";
export type DataSource = "grupoorve_scrape" | "oscar_manual" | "excel_import";
export type ImageKind = "hero" | "gallery" | "floorplan" | "logo";

export const developments = pgTable("developments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  country: text("country").default("MX").notNull(),
  propertyTypes: jsonb("property_types").$type<UnitType[]>(),
  statusMarketing: text("status_marketing").$type<DevelopmentStatus>(),
  descriptionEs: text("description_es"),
  descriptionEn: text("description_en"),
  amenities: jsonb("amenities").$type<string[]>(),
  sourceUrlEs: text("source_url_es"),
  sourceUrlEn: text("source_url_en"),
  dataSource: text("data_source").$type<DataSource>().default("grupoorve_scrape").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Development = typeof developments.$inferSelect;

export const developmentImages = pgTable("development_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  developmentId: uuid("development_id")
    .notNull()
    .references(() => developments.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  pathname: text("pathname"),
  sourceUrl: text("source_url"),
  alt: text("alt"),
  kind: text("kind").$type<ImageKind>().default("gallery").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type DevelopmentImage = typeof developmentImages.$inferSelect;

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  developmentId: uuid("development_id")
    .notNull()
    .references(() => developments.id, { onDelete: "cascade" }),
  unitCode: text("unit_code"),
  unitType: text("unit_type").$type<UnitType>().notNull(),
  status: text("status").$type<UnitStatus>().default("disponible").notNull(),
  areaM2: numeric("area_m2"),
  priceMxn: integer("price_mxn"),
  priceUsd: integer("price_usd"),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms"),
  levels: integer("levels"),
  reservationAmountMxn: integer("reservation_amount_mxn"),
  downPaymentPercent: numeric("down_payment_percent"),
  notes: text("notes"),
  dataSource: text("data_source").$type<DataSource>().default("oscar_manual").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Unit = typeof units.$inferSelect;
