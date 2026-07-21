// Contenido curado y verídico para la página de detalle de desarrollo (guía "Vivir en Yucatán").
// Fuente: investigación del material público del desarrollador + datos confirmados. NO inventar:
// solo se agrega aquí lo que se pudo verificar. REGLA DURA: prohibido el nombre comercial del
// desarrollo y del desarrollador; la identidad pública es el `heading` por ubicación.
//
// La DB gobierna los campos core (heading, ubicación, etapa, tipos, specs, imágenes). Este módulo
// añade las secciones ricas (por qué es opción ideal, amenidades, lugares cercanos) que aún no
// viven en la DB. Se cruza por slug. Piloto: solo "selva-maya"; el resto degrada elegante (sin secciones).

export type DevelopmentContent = {
  // Frase de una línea, factual, sin nombre comercial. Encabeza el hero.
  tagline: string;
  // Por qué es una opción ideal: bullets factuales, cada uno un motivo real.
  whyIdeal: string[];
  // Amenidades reales (sin nombres de marca de las amenidades).
  amenities: string[];
  // Lugares cercanos / entorno, a nivel región (lo verificable). Cada uno {label, hint}.
  nearby: { label: string; hint: string }[];
};

export const DEVELOPMENT_CONTENT: Record<string, DevelopmentContent> = {
  "selva-maya": {
    tagline:
      "Comunidad residencial en la selva maya, en preventa por etapas, con casa club, parque central y club de playa.",
    whyIdeal: [
      "En preventa: entras temprano, en las primeras de siete etapas residenciales.",
      "Aparta con $10,000 MXN y 25% de enganche.",
      "Casa club con alberca, parque central y club de playa incluidos.",
      "En la selva de Yucatán, con conectividad hacia Mérida.",
    ],
    amenities: [
      "Casa club con alberca y spa",
      "Parque central de 413 m con paisajismo de plantas endémicas",
      "Senderos, terraza de reuniones y área de grill",
      "Área infantil y pet park",
      "Caseta de acceso de 8 carriles",
      "Club de playa",
    ],
    nearby: [
      { label: "Mérida", hint: "Conectividad hacia la ciudad" },
      { label: "Cenotes", hint: "Cenotes y acuíferos naturales de la zona" },
      { label: "Costa", hint: "Playas de la costa yucateca" },
    ],
  },
};

export function getDevelopmentContent(slug: string): DevelopmentContent | undefined {
  return DEVELOPMENT_CONTENT[slug];
}
