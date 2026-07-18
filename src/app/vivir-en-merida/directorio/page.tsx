import type { Metadata } from "next";
import { SiteNav } from "@/components/vivir/site-nav";
import { SiteFooter } from "@/components/vivir/footer";
import { DirectoryExplorer } from "@/components/vivir/directory-explorer";
import { getDirectoryPlaces } from "@/lib/directory/queries";
import { SAMPLE_ZONAS } from "@/lib/directory/sample-data";

export const metadata: Metadata = {
  title: "El directorio de Mérida",
  description:
    "Los mejores cafés, restaurantes y cocina yucateca de Mérida, por zona, ordenados por un ranking que pondera las reseñas reales.",
};

export default async function DirectorioPage() {
  const places = await getDirectoryPlaces();

  return (
    <>
      <SiteNav overHero={false} />
      <main className="bg-canvas text-ink">
        <section className="mx-auto max-w-[1440px] px-6 pb-8 pt-28 md:px-10 md:pt-32">
          <p className="text-xs uppercase tracking-[0.22em] text-terracota">Vivir en Yucatán</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-light leading-[1.03] tracking-[-0.02em] md:text-6xl">
            El directorio de Mérida
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Los mejores lugares por categoría y zona, no un listado de todo. El orden sale de un
            ranking que pondera las reseñas reales, así un lugar nuevo con pocas reseñas no le gana a
            un favorito de años. Juega con los filtros y el mapa responde.
          </p>
        </section>

        <DirectoryExplorer places={places} zonas={SAMPLE_ZONAS} />
      </main>
      <SiteFooter />
    </>
  );
}
