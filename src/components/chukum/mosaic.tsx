"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

interface MosaicPhoto {
  src: string;
  alt: string;
  label: string; // chip de zona: comunica el abanico de opciones, sin nombrar proyectos
}

// Fotos de desarrollos por zona (sin nombrar proyectos). Comunican "hay opciones en
// distintas zonas" alrededor de la imagen de estilo de vida.
const PHOTOS: MosaicPhoto[] = [
  { src: "/hero/ccm-foodtrucks.webp", alt: "Zona comercial de un desarrollo en el norte de Mérida", label: "Mérida" },
  { src: "/hero/progreso-aereo.webp", alt: "Vista aérea de la costa de Progreso, Yucatán", label: "Costa" },
  { src: "/hero/xook-spa-xenotikal.webp", alt: "Casa club de un desarrollo en la selva de Yucatán", label: "Selva" },
  { src: "/hero/ukana-pdc-gym.webp", alt: "Amenidad de un desarrollo de departamentos en el Caribe", label: "Caribe" },
];

function Chip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-2 left-2 rounded-full bg-espresso/70 px-3 py-1 text-xs text-crema backdrop-blur-sm">
      {label}
    </span>
  );
}

// Composición fija tipo bento: imagen de estilo de vida grande + 4 fotos de zona alrededor.
// Se revela con un stagger sutil y SE QUEDA (contenido normal, no una sección pineada que
// desaparece al hacer scroll). Respeta prefers-reduced-motion.
export function Mosaic({ heroSrc, heroAlt }: { heroSrc: string; heroAlt: string }) {
  const reduce = useReducedMotion();
  const anim = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-10% 0px" },
          transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="bg-canvas px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 gap-3 md:h-[540px] md:grid-cols-4 md:grid-rows-2 md:gap-4">
          {/* Estilo de vida (grande) */}
          <motion.div
            {...anim(0)}
            className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-3xl md:row-span-2 md:aspect-auto md:h-full"
          >
            <Image src={heroSrc} alt={heroAlt} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
          </motion.div>

          {/* Zonas */}
          {PHOTOS.map((p, i) => (
            <motion.div
              key={p.src}
              {...anim(i + 1)}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl md:aspect-auto md:h-full"
            >
              <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
              <Chip label={p.label} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
