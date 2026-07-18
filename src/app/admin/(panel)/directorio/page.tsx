import { getAllPlacesForAdmin } from "@/lib/directory/queries";
import { CATEGORIES } from "@/lib/directory/filters";
import { PageHeader } from "@/components/crm/PageShell";
import { updatePlaceCuracion } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Directorio", robots: { index: false } };

export default async function DirectorioAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const places = await getAllPlacesForAdmin();
  const conNota = places.filter((p) => p.editorialNote).length;
  const publicados = places.filter((p) => p.published && !p.hidden).length;

  const kpis = [
    { label: "Lugares", value: String(places.length) },
    { label: "Con reseña", value: `${conNota}/${places.length}`, accent: true },
    { label: "Visibles", value: String(publicados) },
  ];

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow="Contenido"
        title="Directorio"
        description="La capa editorial de la guía. Los datos de Google (foto, rating, horarios) entran solos; aquí escribes tu reseña de por qué cada lugar entra y decides qué se destaca o se oculta."
      />

      {sp.error && (
        <div className="crm-card mb-4 border-l-2 p-3 text-[13px]" style={{ borderColor: "var(--crm-accent-strong)", color: "var(--crm-ink-soft)" }}>
          {sp.error}
        </div>
      )}
      {sp.ok && (
        <div className="crm-card mb-4 p-3 text-[13px]" style={{ color: "var(--crm-ink-soft)" }}>
          Guardado.
        </div>
      )}

      <div className="crm-card mb-6 overflow-hidden p-0">
        <div className="grid grid-cols-3 gap-px" style={{ background: "var(--crm-line)" }}>
          {kpis.map((k, i) => (
            <div key={k.label} className="crm-fade flex min-h-[92px] flex-col justify-between p-4" style={{ background: "var(--crm-surface-2)", animationDelay: `${i * 55}ms` }}>
              <p className="text-[12px] font-medium" style={{ color: "var(--crm-ink-mute)" }}>{k.label}</p>
              <span className="crm-num font-semibold text-[26px] leading-none tracking-[-0.025em]" style={{ color: k.accent ? "var(--crm-accent-strong)" : "var(--crm-ink)" }}>{k.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {places.map((p) => {
          const label = CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category;
          return (
            <form key={p.id} id={`p-${p.id}`} action={updatePlaceCuracion.bind(null, p.id)} className="crm-card scroll-mt-6 p-4">
              <div className="flex gap-4">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-display text-[17px] tracking-[-0.01em] text-[var(--crm-ink)]">{p.nombre}</span>
                    <span className="crm-num text-[12px] text-[var(--crm-ink-faint)]">
                      {label} · {p.zonaSlug} · ★ {p.rating !== null ? Number(p.rating).toFixed(1) : "—"} · {(p.reviewsCount ?? 0).toLocaleString("es-MX")} reseñas
                    </span>
                  </div>
                  <textarea
                    name="editorialNote"
                    defaultValue={p.editorialNote ?? ""}
                    rows={2}
                    maxLength={600}
                    placeholder="Por qué está aquí: tu criterio, qué esperar, para quién."
                    className="crm-textarea mt-2 w-full resize-y text-[14px]"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <label className="flex items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
                      <input type="checkbox" name="published" defaultChecked={p.published} className="h-4 w-4 accent-[var(--crm-accent-strong)]" /> Publicado
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
                      <input type="checkbox" name="featured" defaultChecked={p.featured} className="h-4 w-4 accent-[var(--crm-accent-strong)]" /> Destacar
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
                      <input type="checkbox" name="hidden" defaultChecked={p.hidden} className="h-4 w-4 accent-[var(--crm-accent-strong)]" /> Ocultar
                    </label>
                    <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm ml-auto">Guardar</button>
                  </div>
                </div>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
