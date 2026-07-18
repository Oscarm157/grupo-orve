import { pgTable, uuid, text, boolean, timestamp, jsonb, integer, numeric } from "drizzle-orm/pg-core";

// ===== "Vivir en Yucatán": guía por perfil + guías editoriales + directorio curado =====
// Vive aparte de schema.ts a propósito, para no chocar en el merge con el trabajo del CRM que
// está tocando schema.ts en otra rama. drizzle.config.ts incluye este archivo en el schema.

// Los 4 perfiles son constante en código (ver perfiles.ts), no tabla. Aquí solo el tipo del slug.
export type PerfilSlug = "me-mudo" | "vacaciones" | "inversion" | "retiro";

// Categorías del directorio. Se empieza por Mérida; se amplía sin migración (es un text).
export type PlaceCategory =
  | "restaurante"
  | "cafe"
  | "bar"
  | "cocina-yucateca"
  | "brunch"
  | "mercado"
  | "coworking"
  | "gimnasio"
  | "hospital"
  | "colegio"
  | "supermercado"
  | "cenote-playa"
  | "cultura";

// De dónde salió el registro del lugar. `outscraper` = sembrado por el scrape; `curado`/`manual`
// = agregado o corregido a mano por Oscar. Misma convención dataSource/verified que schema.ts.
export type PlaceDataSource = "outscraper" | "curado" | "manual";

// ===== Guías editoriales y guías por perfil (long-form, markdown en columna) =====
// Patrón de la tabla `articles` de Vertice: el cuerpo es markdown y se renderiza con renderMarkdown.
export const guides = pgTable("guides", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  titulo: text("titulo").notNull(),
  // cluster SEO al que pertenece (ej. "costo-de-vida", "seguridad", "mejores-zonas").
  cluster: text("cluster"),
  // perfiles a los que la guía es relevante, para cruzar perfil ↔ guía.
  perfiles: jsonb("perfiles").$type<PerfilSlug[]>(),
  excerpt: text("excerpt"),
  bodyEs: text("body_es"), // markdown
  bodyEn: text("body_en"), // markdown
  coverUrl: text("cover_url"),
  coverAlt: text("cover_alt"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Guide = typeof guides.$inferSelect;

// ===== El directorio: datos de Outscraper + ranking computado + capa editorial =====
// Los datos de Google Maps entran por Outscraper (export propio, se guarda sin la restricción de
// caché de Places API). rankScore/rankInCategory los calcula lib/directory/rank.ts al importar.
// La capa editorial (featured/hidden/editorialNote/perfiles) es lo que Oscar controla a mano.
export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  category: text("category").$type<PlaceCategory>().notNull(),
  zonaSlug: text("zona_slug"), // zona aproximada del mapa (constante en front, no FK a la tabla zonas)

  // --- data de Outscraper / Google Maps ---
  // Llave natural del export: permanente y única. Permite upsert idempotente en cada refresh.
  // Nullable para lugares agregados a mano; Postgres permite varios NULL bajo unique.
  placeIdGoogle: text("place_id_google").unique(), // join con Google (link "ver en Maps")
  googleCid: text("google_cid"),
  address: text("address"),
  lat: numeric("lat"),
  lng: numeric("lng"),
  rating: numeric("rating"), // 0..5
  reviewsCount: integer("reviews_count"),
  priceLevel: integer("price_level"), // 1..4
  imageUrl: text("image_url"), // foto de portada (Blob)
  photoUrls: jsonb("photo_urls").$type<string[]>(), // galería (Blob)
  hours: jsonb("hours").$type<Record<string, string[]>>(),
  phone: text("phone"),
  website: text("website"),
  reservationUrl: text("reservation_url"),
  menuUrl: text("menu_url"),

  // --- ranking computado (una vez al importar; se recalcula en el refresh) ---
  rankScore: numeric("rank_score"),
  rankInCategory: integer("rank_in_category"),

  // --- capa editorial (Oscar) ---
  editorialNote: text("editorial_note"), // "por qué está aquí"
  perfiles: jsonb("perfiles").$type<PerfilSlug[]>(),
  featured: boolean("featured").default(false).notNull(), // fija arriba
  hidden: boolean("hidden").default(false).notNull(), // veta del listado

  published: boolean("published").default(false).notNull(),
  dataSource: text("data_source").$type<PlaceDataSource>().default("outscraper").notNull(),
  verified: boolean("verified").default(false).notNull(),
  sourceRefreshedAt: timestamp("source_refreshed_at", { withTimezone: true }), // último pull Outscraper
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Place = typeof places.$inferSelect;
