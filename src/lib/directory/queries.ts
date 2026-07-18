import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { guides, places, type PerfilSlug } from "../schema-directory";
import type { RankedPlace } from "./sample-data";

// Lectura del directorio y las guías desde la DB. Devuelve la MISMA shape que sample-data
// (RankedPlace) para que los componentes no cambien al pasar de mock a DB.

type PlaceRow = typeof places.$inferSelect;

function toRanked(row: PlaceRow): RankedPlace {
  return {
    slug: row.slug,
    nombre: row.nombre,
    category: row.category,
    zonaSlug: row.zonaSlug ?? "",
    lat: Number(row.lat),
    lng: Number(row.lng),
    rating: row.rating !== null ? Number(row.rating) : 0,
    reviewsCount: row.reviewsCount ?? 0,
    priceLevel: row.priceLevel ?? 2,
    editorialNote: row.editorialNote ?? undefined,
    perfiles: row.perfiles ?? [],
    imageUrl: row.imageUrl ?? undefined,
    gallery: row.photoUrls ?? undefined,
    placeId: row.placeIdGoogle ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    address: row.address ?? undefined,
    hours: row.hours ?? undefined,
    rankScore: row.rankScore !== null ? Number(row.rankScore) : 0,
  };
}

/** Todos los lugares publicados y no vetados, para el explorador del directorio. */
export async function getDirectoryPlaces(): Promise<RankedPlace[]> {
  const rows = await db
    .select()
    .from(places)
    .where(and(eq(places.published, true), eq(places.hidden, false)));
  return rows.map(toRanked);
}

/** Un lugar publicado por slug (para la ficha). */
export async function getPlaceBySlug(slug: string): Promise<RankedPlace | null> {
  const rows = await db
    .select()
    .from(places)
    .where(and(eq(places.slug, slug), eq(places.published, true)))
    .limit(1);
  return rows[0] ? toRanked(rows[0]) : null;
}

/** Guías publicadas, opcionalmente filtradas por perfil. */
export async function getPublishedGuides(perfil?: PerfilSlug) {
  const conds = [eq(guides.published, true)];
  if (perfil) conds.push(sql`${guides.perfiles} @> ${JSON.stringify([perfil])}::jsonb`);
  return db.select().from(guides).where(and(...conds)).orderBy(desc(guides.publishedAt));
}

/** Guía publicada por slug. */
export async function getGuideBySlug(slug: string) {
  const rows = await db
    .select()
    .from(guides)
    .where(and(eq(guides.slug, slug), eq(guides.published, true)))
    .limit(1);
  return rows[0] ?? null;
}
