import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Clock, Phone, Globe, MapPin, ExternalLink } from "lucide-react";
import { SiteNav } from "@/components/vivir/site-nav";
import { SiteFooter } from "@/components/vivir/footer";
import { MiniMap } from "@/components/vivir/mini-map";
import { CATEGORIES } from "@/lib/directory/filters";
import { getDirectoryPlaces, getPlaceBySlug } from "@/lib/directory/queries";
import { getSampleZona } from "@/lib/directory/sample-data";

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export async function generateStaticParams() {
  return (await getDirectoryPlaces()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return { title: "Lugar" };
  const label = CATEGORIES.find((c) => c.value === place.category)?.label ?? place.category;
  return { title: `${place.nombre}`, description: `${label} en Mérida, Yucatán. ${place.rating} en Google con ${place.reviewsCount.toLocaleString("es-MX")} reseñas.` };
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const zona = getSampleZona(place.zonaSlug);
  const label = CATEGORIES.find((c) => c.value === place.category)?.label ?? place.category;
  const fotos = place.gallery?.length ? place.gallery : place.imageUrl ? [place.imageUrl] : [];
  const mapsUrl = place.placeId ? `https://www.google.com/maps/place/?q=place_id:${place.placeId}` : null;
  const waDigits = place.phone?.replace(/[^0-9]/g, "");

  return (
    <>
      <SiteNav overHero={false} />
      <main className="bg-canvas text-ink">
        <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-28 md:px-10 md:pt-32">
          <Link href="/vivir-en-merida/directorio" className="inline-flex items-center gap-2 text-sm text-ink-2 transition hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Directorio
          </Link>

          <header className="mt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-terracota">
              {label}
              {zona ? ` · ${zona.nombre}` : ""}
            </p>
            <h1 className="mt-3 font-display text-4xl font-light leading-[1.03] tracking-[-0.02em] md:text-6xl">
              {place.nombre}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-2">
              <span className="inline-flex items-center gap-1 text-ink">
                <Star className="h-4 w-4 fill-terracota text-terracota" />
                <span className="tabular-nums">{place.rating.toFixed(1)}</span>
              </span>
              <span className="tabular-nums">{place.reviewsCount.toLocaleString("es-MX")} reseñas en Google</span>
              <span>{"$".repeat(place.priceLevel)}</span>
            </div>
          </header>

          {/* Galería */}
          {fotos.length > 0 && (
            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotos[0]} alt={place.nombre} className="aspect-[16/10] w-full rounded-2xl object-cover md:col-span-4" />
              {fotos.slice(1, 5).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
              ))}
            </div>
          )}

          <div className="mt-12 grid gap-10 md:grid-cols-[1.35fr_1fr] md:gap-16">
            {/* Reseña editorial (curación de Oscar) */}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">Por qué está aquí</p>
              {place.editorialNote ? (
                <p className="mt-4 max-w-prose font-display text-xl leading-relaxed text-ink md:text-2xl">
                  {place.editorialNote}
                </p>
              ) : (
                <p className="mt-4 max-w-prose text-ink-2">
                  Reseña editorial pendiente. Aquí va tu criterio: por qué este lugar entra a la guía y
                  qué esperar. El dato de Google ya está; falta la curación.
                </p>
              )}
            </div>

            {/* Datos prácticos */}
            <aside className="rounded-2xl border border-hairline bg-surface p-6">
              <dl className="grid gap-4 text-sm">
                {place.hours && (
                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-2" />
                    <div className="grid flex-1 gap-1">
                      {DIAS.filter((d) => place.hours?.[d]).map((d) => (
                        <div key={d} className="flex justify-between gap-4">
                          <span className="capitalize text-ink-2">{d}</span>
                          <span className="text-right tabular-nums text-ink">{place.hours![d].join(", ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {place.address && (
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-2" />
                    <span className="text-ink-2">{place.address}</span>
                  </div>
                )}
                {place.phone && (
                  <div className="flex gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-2" />
                    <span className="flex flex-wrap gap-x-3">
                      <a href={`tel:${place.phone.replace(/\s/g, "")}`} className="text-ink underline underline-offset-2">{place.phone}</a>
                      {waDigits && <a href={`https://wa.me/${waDigits}`} className="text-terracota underline underline-offset-2">WhatsApp</a>}
                    </span>
                  </div>
                )}
                {place.website && (
                  <div className="flex gap-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-ink-2" />
                    <a href={place.website} target="_blank" rel="noopener noreferrer" className="break-all text-ink underline underline-offset-2">
                      {place.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  </div>
                )}
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-terracota underline underline-offset-2">
                    Ver en Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </dl>
            </aside>
          </div>

          <div className="mt-10">
            <MiniMap lat={place.lat} lng={place.lng} name={place.nombre} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
