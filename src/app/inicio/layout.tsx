import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { BRAND } from "@/lib/site";

// Sistema de diseño "Chukum V2" scopeado a /inicio: estuco mineral cálido + Fraunces
// (display) + Inter (cuerpo). Mismo patrón que .vivir: las variables de fuente se cuelgan
// del wrapper `.chukum`; los tokens de color viven en globals.css bajo `.chukum`, sin
// tocar el verde de /home-prototipo ni el terracota de /vivir. Ver DESIGN-chukum.md.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: "Chukum | Casas, terrenos y departamentos en Yucatán y el Caribe",
  description:
    "Casas, terrenos y departamentos en venta en Yucatán y Quintana Roo. Contesta unas preguntas rápidas y te digo cuáles te laten.",
  openGraph: {
    title: "Chukum | Casas, terrenos y departamentos en Yucatán y el Caribe",
    description:
      "Casas, terrenos y departamentos en venta en Yucatán y Quintana Roo. Contesta el test y te digo cuáles van contigo.",
    url: BRAND.url,
    siteName: BRAND.name,
    locale: "es_MX",
    type: "website",
  },
};

export default function InicioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`chukum ${fraunces.variable} ${inter.variable} min-h-dvh bg-canvas font-sans text-ink`}
    >
      {children}
    </div>
  );
}
