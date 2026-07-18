"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { places } from "@/lib/schema-directory";
import { requireAdmin } from "@/lib/session";
import { safeParseForm } from "@/lib/validate";

const schema = z.object({
  editorialNote: z.string().trim().max(600, "La reseña no debe pasar de 600 caracteres.").optional(),
});

// Guarda la curación de un lugar: la reseña "por qué está aquí" y los toggles editoriales.
// Los datos de Google (foto, rating, horarios) no se tocan aquí, solo la capa editorial.
export async function updatePlaceCuracion(id: string, formData: FormData) {
  await requireAdmin();
  const check = safeParseForm(schema, formData);
  if (!check.ok) redirect(`/admin/directorio?error=${encodeURIComponent(check.error)}`);

  const editorialNote = String(formData.get("editorialNote") ?? "").trim() || null;
  await db
    .update(places)
    .set({
      editorialNote,
      featured: formData.get("featured") === "on",
      hidden: formData.get("hidden") === "on",
      published: formData.get("published") === "on",
      updatedAt: new Date(),
    })
    .where(eq(places.id, id));

  revalidatePath("/admin/directorio");
  revalidatePath("/vivir-en-merida/directorio");
  revalidatePath("/vivir-en-merida/directorio/[slug]", "page");
  redirect(`/admin/directorio?ok=1#p-${id}`);
}
