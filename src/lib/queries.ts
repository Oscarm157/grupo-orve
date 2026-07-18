import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  developments,
  developmentImages,
  zonas,
  type Development,
  type DevelopmentImage,
  type Zona,
} from "@/lib/schema";
import type {
  Development as HomeDevelopment,
  Zona as MacroZona,
  Tipo,
  Uso,
  Etapa,
} from "@/lib/developments";

// Capa de datos del sitio público. Todo se lee de Neon en build (SSG) vía
// generateStaticParams / render de servidor. Gate anti thin-content: solo
// zonas `publicada = true` salen al aire.

export async function getZonasPublicadas(): Promise<Zona[]> {
  return db
    .select()
    .from(zonas)
    .where(eq(zonas.publicada, true))
    .orderBy(asc(zonas.nombre));
}

export async function getZonaBySlug(slug: string): Promise<Zona | undefined> {
  const rows = await db
    .select()
    .from(zonas)
    .where(and(eq(zonas.slug, slug), eq(zonas.publicada, true)))
    .limit(1);
  return rows[0];
}

export async function getZonaById(id: string): Promise<Zona | undefined> {
  const rows = await db
    .select()
    .from(zonas)
    .where(and(eq(zonas.id, id), eq(zonas.publicada, true)))
    .limit(1);
  return rows[0];
}

export async function getAllDevelopmentSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: developments.slug }).from(developments);
  return rows.map((r) => r.slug);
}

export async function getDevelopmentsByZona(zonaId: string): Promise<Development[]> {
  return db
    .select()
    .from(developments)
    .where(eq(developments.zonaId, zonaId))
    .orderBy(asc(developments.name));
}

export async function getDevelopmentBySlug(slug: string): Promise<Development | undefined> {
  const rows = await db
    .select()
    .from(developments)
    .where(eq(developments.slug, slug))
    .limit(1);
  return rows[0];
}

export async function getDevelopmentImages(devId: string): Promise<DevelopmentImage[]> {
  return db
    .select()
    .from(developmentImages)
    .where(eq(developmentImages.developmentId, devId))
    .orderBy(asc(developmentImages.sortOrder));
}

// Catálogo del home /inicio (Opción A: la base gobierna el sitio). Devuelve la MISMA
// forma que el array `Development` que el home ya consumía, para que <Catalogo/> y
// <Quiz/> no cambien de contrato. Solo entran los desarrollos "curados para el home"
// (con `heading`); los que llegan por scraping sin heading no salen.
export async function getDevelopmentsForHome(): Promise<HomeDevelopment[]> {
  const rows = await db
    .select()
    .from(developments)
    .where(isNotNull(developments.heading))
    .orderBy(asc(developments.createdAt));
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const imgs = await db.select().from(developmentImages).where(inArray(developmentImages.developmentId, ids));

  // Una imagen por desarrollo: prefiere kind "hero", luego menor sortOrder.
  const heroByDev = new Map<string, DevelopmentImage>();
  for (const img of imgs) {
    const cur = heroByDev.get(img.developmentId);
    if (!cur) {
      heroByDev.set(img.developmentId, img);
      continue;
    }
    const better =
      (img.kind === "hero" && cur.kind !== "hero") ||
      (img.kind === cur.kind && (img.sortOrder ?? 0) < (cur.sortOrder ?? 0));
    if (better) heroByDev.set(img.developmentId, img);
  }

  return rows.map((r) => {
    const hero = heroByDev.get(r.id);
    return {
      slug: r.slug,
      heading: r.heading ?? "",
      place: [r.city, r.state].filter(Boolean).join(", "),
      ciudad: r.city ?? "",
      zona: (r.macroZona ?? "merida") as MacroZona,
      tipos: (r.propertyTypes ?? []) as Tipo[],
      usos: (r.usos ?? []) as Uso[],
      etapa: (r.statusMarketing ?? "preventa") as Etapa,
      image: hero?.url ?? "/hero/hero-poster.webp",
      alt: hero?.alt ?? r.heading ?? "",
      blurb: r.descriptionEs ?? "",
      specs: r.highlightSpecs ?? undefined,
    };
  });
}
