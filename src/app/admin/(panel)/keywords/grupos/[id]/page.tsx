import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/crm/PageShell";
import { getGrupo } from "@/lib/keywords-data";
import { DetalleGrupo } from "./DetalleGrupo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Grupo", robots: { index: false } };

export default async function GrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await getGrupo(id);
  if (!datos) notFound();

  const { grupo, items } = datos;
  const keywords = items.map((i) => ({
    keyword: i.keyword,
    volumen: i.volumen,
    cpc: Number(i.cpc ?? 0),
    competencia: i.competencia,
  }));

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeader
        eyebrow={
          <Link href="/admin/keywords/grupos" className="hover:underline">
            Grupos
          </Link>
        }
        title={grupo.nombre}
        description={`${grupo.plaza} · ${grupo.mercado === "nacional_es" ? "Nacional" : "Extranjero"} · ${keywords.length} keywords`}
      />
      <DetalleGrupo
        grupo={{
          id: grupo.id,
          nombre: grupo.nombre,
          estado: grupo.estado,
          notas: grupo.notas ?? "",
        }}
        keywords={keywords}
      />
    </div>
  );
}
