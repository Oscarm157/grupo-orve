import { inArray } from "drizzle-orm";
import { db } from "../db";
import { places, type PlaceCategory } from "../schema-directory";
import { computeRankings, type RankInput, type RankOptions } from "./rank";

// Importador de Outscraper -> tabla `places`. El export de Google Maps es propio (se guarda sin
// la restricción de caché de Places API). El flujo: mapear filas -> upsert idempotente por
// place_id -> recalcular ranking sobre toda la categoría afectada.

// Fila cruda del export de Outscraper (Google Maps). Los nombres de campo varían entre exports,
// así que se leen de forma defensiva con varios alias. Solo declaramos lo que usamos.
export type OutscraperRow = {
  name?: string;
  full_address?: string;
  address?: string;
  rating?: number | string | null;
  reviews?: number | string | null;
  reviews_count?: number | string | null;
  photos_count?: number | string | null;
  photo?: string | null;
  photos?: string[] | null;
  working_hours?: Record<string, string> | null;
  hours?: Record<string, string> | null;
  phone?: string | null;
  phone_1?: string | null;
  site?: string | null;
  website?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  place_id?: string | null;
  google_id?: string | null;
  cid?: string | null;
  price_level?: number | string | null;
  range?: string | null;
  reservation_links?: string | string[] | null;
  menu_link?: string | null;
  [k: string]: unknown;
};

export type ImportContext = {
  category: PlaceCategory;
  zonaId?: string | null;
};

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function firstStr(...vals: unknown[]): string | null {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

// "$$" (Outscraper `range`) -> 1..4. Si viene numérico ya, se usa tal cual.
function priceLevel(row: OutscraperRow): number | null {
  const n = num(row.price_level);
  if (n !== null) return Math.min(4, Math.max(1, n));
  if (typeof row.range === "string") {
    const dollars = (row.range.match(/\$/g) || []).length;
    return dollars > 0 ? Math.min(4, dollars) : null;
  }
  return null;
}

function photoUrls(row: OutscraperRow): string[] | null {
  if (Array.isArray(row.photos) && row.photos.length) return row.photos.filter(Boolean);
  const one = firstStr(row.photo);
  return one ? [one] : null;
}

/** Mapea una fila de Outscraper a los valores de insert de `places`. Puro, sin DB. */
export function mapOutscraperRow(row: OutscraperRow, ctx: ImportContext) {
  const nombre = firstStr(row.name) ?? "Sin nombre";
  const placeId = firstStr(row.place_id);
  // slug estable: nombre + sufijo del place_id (mismo lugar -> mismo slug entre refreshes).
  const suffix = placeId ? placeId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toLowerCase() : "";
  const slug = [slugify(nombre), suffix].filter(Boolean).join("-");

  return {
    slug,
    nombre,
    category: ctx.category,
    zonaId: ctx.zonaId ?? null,
    placeIdGoogle: placeId,
    googleCid: firstStr(row.google_id, row.cid),
    address: firstStr(row.full_address, row.address),
    lat: num(row.latitude)?.toString() ?? null,
    lng: num(row.longitude)?.toString() ?? null,
    rating: num(row.rating)?.toString() ?? null,
    reviewsCount: num(row.reviews_count ?? row.reviews),
    priceLevel: priceLevel(row),
    photoUrls: photoUrls(row),
    hours: row.working_hours ?? row.hours ?? null,
    phone: firstStr(row.phone, row.phone_1),
    website: firstStr(row.site, row.website),
    reservationUrl: firstStr(Array.isArray(row.reservation_links) ? row.reservation_links[0] : row.reservation_links),
    menuUrl: firstStr(row.menu_link),
    dataSource: "outscraper" as const,
  };
}

/**
 * Upsert idempotente por place_id. Actualiza solo los campos que vienen de Outscraper; nunca pisa
 * la capa editorial (editorialNote, featured, hidden, perfiles, published) ni el ranking.
 * Devuelve cuántas filas se procesaron. Las filas sin place_id se saltan (no hay llave para upsert).
 */
export async function importPlaces(rows: OutscraperRow[], ctx: ImportContext): Promise<number> {
  const values = rows.map((r) => mapOutscraperRow(r, ctx)).filter((v) => v.placeIdGoogle);
  if (!values.length) return 0;

  const refreshedAt = new Date();
  for (const v of values) {
    await db
      .insert(places)
      .values({ ...v, sourceRefreshedAt: refreshedAt, updatedAt: refreshedAt })
      .onConflictDoUpdate({
        target: places.placeIdGoogle,
        set: {
          nombre: v.nombre,
          address: v.address,
          lat: v.lat,
          lng: v.lng,
          rating: v.rating,
          reviewsCount: v.reviewsCount,
          priceLevel: v.priceLevel,
          photoUrls: v.photoUrls,
          hours: v.hours,
          phone: v.phone,
          website: v.website,
          reservationUrl: v.reservationUrl,
          menuUrl: v.menuUrl,
          sourceRefreshedAt: refreshedAt,
          updatedAt: refreshedAt,
        },
      });
  }
  return values.length;
}

/**
 * Recalcula rankScore + rankInCategory sobre TODOS los lugares (agrupa por categoría+zona dentro
 * de rank.ts). Se corre después de importar y en el refresh mensual. Ignora los `hidden`.
 */
export async function recomputeRankings(opts: RankOptions = {}): Promise<number> {
  const all = await db
    .select({
      id: places.id,
      category: places.category,
      zonaId: places.zonaId,
      rating: places.rating,
      reviewsCount: places.reviewsCount,
      hidden: places.hidden,
    })
    .from(places);

  const visibles = all.filter((p) => !p.hidden);
  const inputs: RankInput[] = visibles.map((p) => ({
    key: p.id,
    category: p.category,
    zonaId: p.zonaId,
    rating: p.rating !== null ? Number(p.rating) : null,
    reviewsCount: p.reviewsCount,
  }));

  const ranked = computeRankings(inputs, opts);
  for (const r of ranked) {
    await db
      .update(places)
      .set({ rankScore: r.rankScore.toString(), rankInCategory: r.rankInCategory })
      .where(inArray(places.id, [r.key]));
  }
  return ranked.length;
}
