"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";
import { Star } from "lucide-react";
import { CATEGORIES } from "@/lib/directory/filters";
import type { RankedPlace, SampleZona } from "@/lib/directory/sample-data";
import type { PlaceCategory } from "@/lib/schema-directory";

// Estilo de tiles gratis (OpenFreeMap). Sin API key, sin costo por vista.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  places: RankedPlace[];
  zonas: SampleZona[];
  /** categorías a las que se restringe la vista (ej. desde una página de perfil) */
  soloCategorias?: PlaceCategory[];
};

export function DirectoryExplorer({ places, zonas, soloCategorias }: Props) {
  const [categoria, setCategoria] = useState<PlaceCategory | null>(null);
  const [zona, setZona] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  // Categorías disponibles (limitadas por soloCategorias si viene de un perfil).
  const categoriasDisponibles = useMemo(() => {
    const presentes = new Set(places.map((p) => p.category));
    return CATEGORIES.filter(
      (c) => presentes.has(c.value) && (!soloCategorias || soloCategorias.includes(c.value))
    );
  }, [places, soloCategorias]);

  const filtradas = useMemo(() => {
    return places
      .filter((p) => (!soloCategorias || soloCategorias.includes(p.category)))
      .filter((p) => (categoria ? p.category === categoria : true))
      .filter((p) => (zona ? p.zonaSlug === zona : true))
      .sort((a, b) => b.rankScore - a.rankScore);
  }, [places, categoria, zona, soloCategorias]);

  // --- Mapa ---
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const markerEls = useRef<Map<string, HTMLElement>>(new Map());
  const [ready, setReady] = useState(false);
  const mlRef = useRef<typeof import("maplibre-gl") | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !mapContainer.current || mapRef.current) return;
      mlRef.current = maplibregl;
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [-89.617, 20.99],
        zoom: 11.4,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        for (const z of zonas) {
          const src = `zona-${z.slug}`;
          map.addSource(src, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: { slug: z.slug },
              geometry: { type: "Polygon", coordinates: [z.polygon] },
            },
          });
          map.addLayer({
            id: `${src}-fill`,
            type: "fill",
            source: src,
            paint: { "fill-color": z.color, "fill-opacity": 0.14 },
          });
          map.addLayer({
            id: `${src}-line`,
            type: "line",
            source: src,
            paint: { "line-color": z.color, "line-width": 1.5, "line-opacity": 0.5 },
          });
          map.on("click", `${src}-fill`, () => setZona((prev) => (prev === z.slug ? null : z.slug)));
          map.on("mouseenter", `${src}-fill`, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", `${src}-fill`, () => (map.getCanvas().style.cursor = ""));
        }
        setReady(true);
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // zonas es estable (props de datos de muestra)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resalta la zona activa engrosando su borde.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const z of zonas) {
      const active = zona === z.slug;
      map.setPaintProperty(`zona-${z.slug}-fill`, "fill-opacity", active ? 0.28 : zona ? 0.06 : 0.14);
      map.setPaintProperty(`zona-${z.slug}-line`, "line-width", active ? 2.5 : 1.5);
    }
  }, [zona, ready, zonas]);

  // Marcadores: se rehacen cuando cambia la lista filtrada.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mlRef.current;
    if (!map || !maplibregl || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    markerEls.current.clear();

    for (const p of filtradas) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "vivir-pin";
      el.setAttribute("aria-label", p.nombre);
      el.addEventListener("mouseenter", () => setHover(p.slug));
      el.addEventListener("mouseleave", () => setHover(null));
      el.addEventListener("click", () => {
        const card = document.getElementById(`place-${p.slug}`);
        card?.scrollIntoView({ behavior: "smooth", block: "center" });
        setHover(p.slug);
      });
      const marker = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
      markersRef.current.set(p.slug, marker);
      markerEls.current.set(p.slug, el);
    }

    // Encuadra a lo filtrado.
    if (filtradas.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filtradas.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 70, maxZoom: 14.5, duration: 500 });
    }
  }, [filtradas, ready]);

  // Sincroniza el hover (card <-> pin).
  useEffect(() => {
    markerEls.current.forEach((el, slug) => {
      el.classList.toggle("is-active", slug === hover);
    });
  }, [hover]);

  const hayFiltro = categoria !== null || zona !== null;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Columna izquierda: filtros + lista */}
      <div className="order-2 lg:order-1">
        <div className="sticky top-0 z-10 border-b border-hairline bg-canvas/95 px-6 py-5 backdrop-blur md:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill active={categoria === null} onClick={() => setCategoria(null)}>
              Todo
            </FilterPill>
            {categoriasDisponibles.map((c) => (
              <FilterPill
                key={c.value}
                active={categoria === c.value}
                onClick={() => setCategoria((prev) => (prev === c.value ? null : c.value))}
              >
                {c.label}
              </FilterPill>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs uppercase tracking-[0.14em] text-ink-2">Zona</span>
            {zonas.map((z) => (
              <FilterPill
                key={z.slug}
                active={zona === z.slug}
                onClick={() => setZona((prev) => (prev === z.slug ? null : z.slug))}
                dot={z.color}
              >
                {z.nombre}
              </FilterPill>
            ))}
            {hayFiltro && (
              <button
                onClick={() => {
                  setCategoria(null);
                  setZona(null);
                }}
                className="ml-1 text-xs text-terracota underline underline-offset-2"
              >
                Limpiar
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-2">
            {filtradas.length} {filtradas.length === 1 ? "lugar" : "lugares"} · ratings de muestra,
            ilustrativos
          </p>
        </div>

        <ul className="divide-y divide-hairline px-6 md:px-10">
          {filtradas.map((p, i) => (
            <PlaceRow
              key={p.slug}
              place={p}
              rank={i + 1}
              zona={zonas.find((z) => z.slug === p.zonaSlug)}
              hovered={hover === p.slug}
              onHover={() => setHover(p.slug)}
              onLeave={() => setHover(null)}
            />
          ))}
          {filtradas.length === 0 && (
            <li className="py-16 text-center text-ink-2">
              No hay lugares con esos filtros.{" "}
              <button
                onClick={() => {
                  setCategoria(null);
                  setZona(null);
                }}
                className="text-terracota underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Columna derecha: mapa sticky */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-0 lg:h-[100dvh]">
        <div ref={mapContainer} className="h-[45vh] w-full lg:h-full" />
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-ink bg-ink text-canvas"
          : "border-hairline bg-surface text-ink-2 hover:border-ink/40 hover:text-ink"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </button>
  );
}

function PlaceRow({
  place,
  rank,
  zona,
  hovered,
  onHover,
  onLeave,
}: {
  place: RankedPlace;
  rank: number;
  zona?: SampleZona;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const label = CATEGORIES.find((c) => c.value === place.category)?.label ?? place.category;
  return (
    <li
      id={`place-${place.slug}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`flex scroll-mt-40 gap-4 py-5 transition-colors ${hovered ? "bg-surface-warm" : ""}`}
    >
      <span className="mt-0.5 font-display text-2xl leading-none text-terracota tabular-nums">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-xl tracking-[-0.01em] text-ink">{place.nombre}</h3>
          <span className="rounded border border-hairline px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-ink-2">
            {label}
          </span>
          {zona && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: zona.color }} />
              {zona.nombre}
            </span>
          )}
        </div>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-2">{place.editorialNote}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1 text-ink">
            <Star className="h-3.5 w-3.5 fill-terracota text-terracota" />
            <span className="tabular-nums">{place.rating.toFixed(1)}</span>
          </span>
          <span className="tabular-nums">{place.reviewsCount.toLocaleString("es-MX")} reseñas</span>
          <span>{"$".repeat(place.priceLevel)}</span>
        </div>
      </div>
    </li>
  );
}
