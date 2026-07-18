"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Map as MlMap } from "maplibre-gl";

// Mini-mapa de marca para la ficha de un lugar: un solo pin, misma cartografía cálida.
export function MiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !ref.current || mapRef.current) return;
      const map = new maplibregl.Map({
        container: ref.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [lng, lat],
        zoom: 14.5,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.on("load", () => {
        for (const l of map.getStyle().layers ?? []) {
          try {
            if (l.type === "background") map.setPaintProperty(l.id, "background-color", "#efe7d6");
            else if (l.type === "fill") map.setPaintProperty(l.id, "fill-color", /water|river|lake/i.test(l.id) ? "#dacdb6" : "#e9e0cf");
            else if (l.type === "line") map.setPaintProperty(l.id, "line-color", "#dccdb2");
            else if (l.type === "symbol") {
              map.setPaintProperty(l.id, "text-color", "#6b6258");
              map.setPaintProperty(l.id, "text-halo-color", "#f7f1e7");
            }
          } catch {
            // capa sin la propiedad
          }
        }
        const el = document.createElement("div");
        el.className = "vivir-pin-num";
        new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return <div ref={ref} className="h-64 w-full overflow-hidden rounded-2xl border border-hairline" aria-label={`Mapa de ${name}`} />;
}
