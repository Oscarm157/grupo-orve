"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { kwGrupoItems, kwGrupos } from "@/lib/schema";

// Grupos de keywords. Todo entra validado y los ids se verifican contra la DB:
// nunca se confía en lo que manda el cliente.

const TEMAS = ["terrenos", "casas", "departamentos", "otro"] as const;
const MERCADOS = ["nacional_es", "extranjero_en"] as const;
const ESTADOS = ["borrador", "listo", "lanzado"] as const;

const keywordSchema = z.object({
  keyword: z.string().min(1).max(200),
  volumen: z.number().int().min(0),
  cpc: z.number().min(0),
  competencia: z.string().min(1).max(20),
});

const crearSchema = z.object({
  nombre: z.string().min(1, "Ponle nombre al grupo.").max(80),
  plaza: z.string().min(1).max(80),
  tema: z.enum(TEMAS),
  mercado: z.enum(MERCADOS),
  keywords: z.array(keywordSchema).min(1, "Selecciona al menos una keyword."),
});

async function grupoDeMiCuenta(id: string) {
  const [grupo] = await db.select().from(kwGrupos).where(eq(kwGrupos.id, id));
  if (!grupo) throw new Error("El grupo no existe.");
  return grupo;
}

export async function crearGrupo(input: z.infer<typeof crearSchema>) {
  await requireAdmin();
  const datos = crearSchema.parse(input);

  const [grupo] = await db
    .insert(kwGrupos)
    .values({
      nombre: datos.nombre,
      plaza: datos.plaza,
      tema: datos.tema,
      mercado: datos.mercado,
    })
    .returning();

  await db.insert(kwGrupoItems).values(
    datos.keywords.map((k) => ({
      grupoId: grupo.id,
      keyword: k.keyword,
      volumen: k.volumen,
      cpc: k.cpc.toFixed(2),
      competencia: k.competencia,
    })),
  );

  revalidatePath("/admin/keywords");
  revalidatePath("/admin/keywords/grupos");
  return { ok: true as const, id: grupo.id, nombre: grupo.nombre };
}

const agregarSchema = z.object({
  grupoId: z.string().uuid(),
  keywords: z.array(keywordSchema).min(1),
});

export async function agregarKeywords(input: z.infer<typeof agregarSchema>) {
  await requireAdmin();
  const { grupoId, keywords } = agregarSchema.parse(input);
  await grupoDeMiCuenta(grupoId);

  // Las que ya están en el grupo se saltan: el índice único las rechazaría.
  const existentes = await db
    .select({ keyword: kwGrupoItems.keyword })
    .from(kwGrupoItems)
    .where(
      and(
        eq(kwGrupoItems.grupoId, grupoId),
        inArray(
          kwGrupoItems.keyword,
          keywords.map((k) => k.keyword),
        ),
      ),
    );
  const ya = new Set(existentes.map((e) => e.keyword));
  const nuevas = keywords.filter((k) => !ya.has(k.keyword));

  if (nuevas.length) {
    await db.insert(kwGrupoItems).values(
      nuevas.map((k) => ({
        grupoId,
        keyword: k.keyword,
        volumen: k.volumen,
        cpc: k.cpc.toFixed(2),
        competencia: k.competencia,
      })),
    );
    await db.update(kwGrupos).set({ updatedAt: new Date() }).where(eq(kwGrupos.id, grupoId));
  }

  revalidatePath("/admin/keywords");
  revalidatePath("/admin/keywords/grupos");
  return { ok: true as const, agregadas: nuevas.length, repetidas: keywords.length - nuevas.length };
}

export async function quitarKeyword(input: { grupoId: string; keyword: string }) {
  await requireAdmin();
  const { grupoId, keyword } = z
    .object({ grupoId: z.string().uuid(), keyword: z.string().min(1) })
    .parse(input);
  await grupoDeMiCuenta(grupoId);

  await db
    .delete(kwGrupoItems)
    .where(and(eq(kwGrupoItems.grupoId, grupoId), eq(kwGrupoItems.keyword, keyword)));

  revalidatePath(`/admin/keywords/grupos/${grupoId}`);
  revalidatePath("/admin/keywords/grupos");
}

export async function actualizarGrupo(input: {
  id: string;
  nombre?: string;
  estado?: (typeof ESTADOS)[number];
  notas?: string;
}) {
  await requireAdmin();
  const datos = z
    .object({
      id: z.string().uuid(),
      nombre: z.string().min(1).max(80).optional(),
      estado: z.enum(ESTADOS).optional(),
      notas: z.string().max(2000).optional(),
    })
    .parse(input);
  await grupoDeMiCuenta(datos.id);

  const { id, ...cambios } = datos;
  await db
    .update(kwGrupos)
    .set({ ...cambios, updatedAt: new Date() })
    .where(eq(kwGrupos.id, id));

  revalidatePath(`/admin/keywords/grupos/${id}`);
  revalidatePath("/admin/keywords/grupos");
}

export async function borrarGrupo(id: string) {
  await requireAdmin();
  const grupoId = z.string().uuid().parse(id);
  await grupoDeMiCuenta(grupoId);

  await db.delete(kwGrupos).where(eq(kwGrupos.id, grupoId)); // los items caen en cascada
  revalidatePath("/admin/keywords/grupos");
}
