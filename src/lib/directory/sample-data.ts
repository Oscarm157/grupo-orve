import { computeRankings } from "./rank";
import type { PerfilSlug, PlaceCategory } from "../schema-directory";

// Datos de MUESTRA para ver la guía navegable sin Neon. Lugares reales de Mérida, coords reales;
// los ratings/reseñas son ILUSTRATIVOS (se marcan como tal en la UI), no verificados. Cuando entre
// la rama Neon + el seed de Outscraper, esto se reemplaza por directory/queries.ts sin tocar la UI:
// el shape de SamplePlace es el subconjunto de `places` que la UI consume.

export type SampleZona = {
  slug: string;
  nombre: string;
  color: string; // color del polígono en el mapa
  center: [number, number]; // [lng, lat]
  polygon: [number, number][]; // anillo aproximado (no colonia real todavía)
};

export type SamplePlace = {
  slug: string;
  nombre: string;
  category: PlaceCategory;
  zonaSlug: string;
  lat: number;
  lng: number;
  rating: number; // ilustrativo
  reviewsCount: number; // ilustrativo
  priceLevel: number; // 1..4
  editorialNote: string;
  perfiles: PerfilSlug[];
};

// Polígono aproximado (rectángulo) alrededor de un centro, en grados. Marca zona, no colonia exacta.
function box(lng: number, lat: number, dx: number, dy: number): [number, number][] {
  return [
    [lng - dx, lat - dy],
    [lng + dx, lat - dy],
    [lng + dx, lat + dy],
    [lng - dx, lat + dy],
    [lng - dx, lat - dy],
  ];
}

export const SAMPLE_ZONAS: SampleZona[] = [
  {
    slug: "centro",
    nombre: "Centro",
    color: "#b5502e",
    center: [-89.6237, 20.9674],
    polygon: box(-89.6237, 20.9674, 0.014, 0.012),
  },
  {
    slug: "montejo-garcia-gineres",
    nombre: "Paseo de Montejo y García Ginerés",
    color: "#c77d3a",
    center: [-89.6215, 20.99],
    polygon: box(-89.6215, 20.99, 0.013, 0.013),
  },
  {
    slug: "norte-altabrisa",
    nombre: "Norte (Altabrisa y Temozón)",
    color: "#3f7d6b",
    center: [-89.606, 21.02],
    polygon: box(-89.606, 21.02, 0.018, 0.016),
  },
];

export const SAMPLE_PLACES: SamplePlace[] = [
  // --- Centro ---
  {
    slug: "la-chaya-maya",
    nombre: "La Chaya Maya",
    category: "cocina-yucateca",
    zonaSlug: "centro",
    lat: 20.9705,
    lng: -89.6235,
    rating: 4.5,
    reviewsCount: 24000,
    priceLevel: 2,
    editorialNote: "La puerta de entrada a la cocina yucateca: cochinita, papadzules y sopa de lima sin misterio.",
    perfiles: ["me-mudo", "vacaciones", "retiro"],
  },
  {
    slug: "apoala",
    nombre: "Apoala",
    category: "restaurante",
    zonaSlug: "centro",
    lat: 20.9715,
    lng: -89.6205,
    rating: 4.5,
    reviewsCount: 3400,
    priceLevel: 3,
    editorialNote: "En la Plaza Santa Lucía, cocina oaxaqueña y mezcal. La mesa de afuera al anochecer es el plan.",
    perfiles: ["vacaciones", "inversion"],
  },
  {
    slug: "micaela-mar-y-lena",
    nombre: "Micaela Mar y Leña",
    category: "restaurante",
    zonaSlug: "centro",
    lat: 20.9665,
    lng: -89.6185,
    rating: 4.6,
    reviewsCount: 5200,
    priceLevel: 3,
    editorialNote: "Mariscos del Golfo tratados con respeto. El pescado a la talla y el arroz son referencia.",
    perfiles: ["vacaciones", "inversion"],
  },
  {
    slug: "manjar-blanco",
    nombre: "Manjar Blanco",
    category: "cocina-yucateca",
    zonaSlug: "centro",
    lat: 20.965,
    lng: -89.624,
    rating: 4.5,
    reviewsCount: 3800,
    priceLevel: 2,
    editorialNote: "Recetas de casa yucateca, sin tono turístico. Buen relleno negro y queso relleno.",
    perfiles: ["me-mudo", "retiro"],
  },
  {
    slug: "manifesto-cafe",
    nombre: "Manifesto Café",
    category: "cafe",
    zonaSlug: "centro",
    lat: 20.967,
    lng: -89.622,
    rating: 4.6,
    reviewsCount: 1580,
    priceLevel: 2,
    editorialNote: "Grano cuidado y espacio de diseño en el Centro. Más de sobremesa que de laptop.",
    perfiles: ["me-mudo", "vacaciones"],
  },
  {
    slug: "bengala-kaffeehaus",
    nombre: "Bengala Kaffeehaus",
    category: "cafe",
    zonaSlug: "centro",
    lat: 20.973,
    lng: -89.617,
    rating: 4.6,
    reviewsCount: 900,
    priceLevel: 2,
    editorialNote: "En Santa Ana, tostador propio y pan de casa. Buen sitio para trabajar entre semana.",
    perfiles: ["me-mudo", "inversion"],
  },
  // --- Montejo / García Ginerés ---
  {
    slug: "marago-coffee",
    nombre: "Marago Coffee",
    category: "cafe",
    zonaSlug: "montejo-garcia-gineres",
    lat: 20.985,
    lng: -89.626,
    rating: 4.7,
    reviewsCount: 2140,
    priceLevel: 2,
    editorialNote: "El estándar de café de especialidad de la ciudad. Tueste propio y wifi que aguanta la jornada.",
    perfiles: ["me-mudo", "inversion"],
  },
  {
    slug: "kuuk",
    nombre: "Kuuk",
    category: "restaurante",
    zonaSlug: "montejo-garcia-gineres",
    lat: 20.99,
    lng: -89.611,
    rating: 4.6,
    reviewsCount: 2900,
    priceLevel: 4,
    editorialNote: "Alta cocina yucateca en una casona. El menú degustación es la ocasión especial de Mérida.",
    perfiles: ["vacaciones", "inversion"],
  },
  {
    slug: "rosas-xocolate",
    nombre: "Rosas & Xocolate",
    category: "restaurante",
    zonaSlug: "montejo-garcia-gineres",
    lat: 20.993,
    lng: -89.617,
    rating: 4.4,
    reviewsCount: 1900,
    priceLevel: 4,
    editorialNote: "Sobre el Paseo de Montejo, hotel boutique y cocina de autor. La terraza rosa es la postal.",
    perfiles: ["vacaciones"],
  },
  {
    slug: "cafe-crema",
    nombre: "Café Crema",
    category: "cafe",
    zonaSlug: "montejo-garcia-gineres",
    lat: 20.982,
    lng: -89.621,
    rating: 4.5,
    reviewsCount: 980,
    priceLevel: 1,
    editorialNote: "Clásico de barra, rápido y consistente. El pedido de siempre nunca falla.",
    perfiles: ["me-mudo", "retiro"],
  },
  // --- Norte (Altabrisa y Temozón) ---
  {
    slug: "nectar",
    nombre: "Néctar",
    category: "restaurante",
    zonaSlug: "norte-altabrisa",
    lat: 21.02,
    lng: -89.6,
    rating: 4.6,
    reviewsCount: 3100,
    priceLevel: 4,
    editorialNote: "Cocina yucateca contemporánea de Roberto Solís. Fija en las listas de mejores del país.",
    perfiles: ["inversion", "vacaciones"],
  },
  {
    slug: "trotters",
    nombre: "Trotter's",
    category: "restaurante",
    zonaSlug: "norte-altabrisa",
    lat: 21.018,
    lng: -89.607,
    rating: 4.5,
    reviewsCount: 2600,
    priceLevel: 4,
    editorialNote: "Parrilla y cortes en el norte. El clásico para la comida de negocios en Mérida.",
    perfiles: ["inversion"],
  },
  {
    slug: "latte-quattro-sette",
    nombre: "Latte Quattro Sette",
    category: "cafe",
    zonaSlug: "norte-altabrisa",
    lat: 21.01,
    lng: -89.61,
    rating: 4.5,
    reviewsCount: 1200,
    priceLevel: 2,
    editorialNote: "Café y brunch en el corredor norte, cerca de Altabrisa. Cómodo para ir con niños.",
    perfiles: ["me-mudo"],
  },
  {
    slug: "ixi-im",
    nombre: "Ixi'im",
    category: "cocina-yucateca",
    zonaSlug: "norte-altabrisa",
    lat: 21.025,
    lng: -89.605,
    rating: 4.7,
    reviewsCount: 1400,
    priceLevel: 4,
    editorialNote: "Cocina de raíz maya con una de las mayores colecciones de tequila del mundo. Destino en sí mismo.",
    perfiles: ["vacaciones", "retiro"],
  },
];

export type RankedPlace = SamplePlace & { rankScore: number };

// Adjunta rankScore (prior por categoría, ver rank.ts) a cada lugar. Se calcula una vez.
export function getRankedPlaces(): RankedPlace[] {
  const ranked = computeRankings(
    SAMPLE_PLACES.map((p) => ({
      key: p.slug,
      category: p.category,
      zonaId: p.zonaSlug,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
    }))
  );
  const scoreBySlug = new Map(ranked.map((r) => [r.key, r.rankScore]));
  return SAMPLE_PLACES.map((p) => ({ ...p, rankScore: scoreBySlug.get(p.slug) ?? 0 }));
}

export function getSampleZona(slug: string): SampleZona | undefined {
  return SAMPLE_ZONAS.find((z) => z.slug === slug);
}
