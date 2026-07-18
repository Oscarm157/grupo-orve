"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { zonas } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { safeParseForm } from "@/lib/validate";
import { str, int, csv, isUniqueViolation } from "@/lib/form-values";

// lat/lng admiten negativos, así que num se deja local (difiere del de desarrollos).
const num = (v: FormDataEntryValue | null): string | null => {
  const t = String(v ?? "").trim();
  return /^-?\d+(\.\d+)?$/.test(t) ? t : null;
};

const zonaScalar = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio.")
    .regex(/^[a-z0-9-]+$/, "El slug solo admite minúsculas, números y guiones."),
});

function zonaValues(f: FormData) {
  return {
    nombre: String(f.get("nombre") ?? "").trim(),
    slug: String(f.get("slug") ?? "").trim(),
    descripcionEs: str(f.get("descripcionEs")),
    descripcionEn: str(f.get("descripcionEn")),
    precioM2Mxn: int(f.get("precioM2Mxn")),
    plusvaliaAnual: num(f.get("plusvaliaAnual")),
    perfilComprador: str(f.get("perfilComprador")),
    amenidades: csv(f.get("amenidades")),
    lat: num(f.get("lat")),
    lng: num(f.get("lng")),
    publicada: f.get("publicada") === "on",
    verified: f.get("verified") === "on",
    dataSource: "curado" as const,
  };
}

export async function createZona(formData: FormData) {
  await requireAdmin();
  const check = safeParseForm(zonaScalar, formData);
  if (!check.ok) redirect(`/admin/zonas/nueva?error=${encodeURIComponent(check.error)}`);
  const v = zonaValues(formData);
  let newId: string;
  try {
    const rows = await db.insert(zonas).values(v).returning({ id: zonas.id });
    newId = rows[0].id;
  } catch (e) {
    if (isUniqueViolation(e)) redirect(`/admin/zonas/nueva?error=${encodeURIComponent("Ese slug ya existe, elige otro.")}`);
    throw e;
  }
  revalidatePath("/admin/zonas");
  redirect(`/admin/zonas/${newId}`);
}

export async function updateZona(id: string, formData: FormData) {
  await requireAdmin();
  const check = safeParseForm(zonaScalar, formData);
  if (!check.ok) redirect(`/admin/zonas/${id}?error=${encodeURIComponent(check.error)}`);
  const v = zonaValues(formData);
  try {
    await db.update(zonas).set({ ...v, updatedAt: new Date() }).where(eq(zonas.id, id));
  } catch (e) {
    if (isUniqueViolation(e)) redirect(`/admin/zonas/${id}?error=${encodeURIComponent("Ese slug ya existe, elige otro.")}`);
    throw e;
  }
  revalidatePath("/admin/zonas");
  revalidatePath(`/admin/zonas/${id}`);
  redirect("/admin/zonas");
}

export async function deleteZona(id: string) {
  await requireAdmin();
  // Los desarrollos enlazados quedan con zonaId = null (onDelete set null en el schema).
  await db.delete(zonas).where(eq(zonas.id, id));
  revalidatePath("/admin/zonas");
  redirect("/admin/zonas");
}
