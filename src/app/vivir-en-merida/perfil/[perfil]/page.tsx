import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/vivir/site-nav";
import { SiteFooter } from "@/components/vivir/footer";
import { DirectoryExplorer } from "@/components/vivir/directory-explorer";
import { PERFILES, getPerfil } from "@/lib/directory/perfiles";
import { getDirectoryPlaces } from "@/lib/directory/queries";
import { SAMPLE_ZONAS } from "@/lib/directory/sample-data";

export function generateStaticParams() {
  return PERFILES.map((p) => ({ perfil: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ perfil: string }>;
}): Promise<Metadata> {
  const { perfil: slug } = await params;
  const perfil = getPerfil(slug);
  if (!perfil) return { title: "Perfil" };
  return {
    title: `${perfil.label} en Yucatán`,
    description: perfil.intro,
  };
}

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ perfil: string }>;
}) {
  const { perfil: slug } = await params;
  const perfil = getPerfil(slug);
  if (!perfil) notFound();

  const places = await getDirectoryPlaces();

  return (
    <>
      <SiteNav overHero={false} />
      <main className="bg-canvas text-ink">
        <section className="mx-auto max-w-[1440px] px-6 pb-10 pt-28 md:px-10 md:pt-32">
          <p className="text-xs uppercase tracking-[0.22em] text-terracota">Perfil</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-light leading-[1.03] tracking-[-0.02em] md:text-6xl">
            {perfil.label}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">{perfil.intro}</p>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-2">Lo que más pesa</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {perfil.importa.map((tema) => (
                <span
                  key={tema}
                  className="rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-sm text-ink-2"
                >
                  {tema}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 md:px-10">
          <div className="border-t border-hairline pt-10">
            <h2 className="font-display text-2xl tracking-[-0.01em] md:text-3xl">
              El directorio para este perfil
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
              Filtrado a las categorías que le importan a quien viene a {perfil.label.toLowerCase()}.
              Juega con los filtros y el mapa responde.
            </p>
          </div>
        </section>

        <DirectoryExplorer places={places} zonas={SAMPLE_ZONAS} soloCategorias={perfil.directorio} />
      </main>
      <SiteFooter />
    </>
  );
}
