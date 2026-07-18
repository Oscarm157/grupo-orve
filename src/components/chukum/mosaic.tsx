"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

interface MosaicPhoto {
  src: string;
  alt: string;
  label: string; // chip de zona
  restClassName: string; // posición de reposo (desktop), alineada
  from: { x: number; y: number }; // de dónde entra
  rotate: number; // giro sutil hacia afuera en reposo
  delay: number; // stagger de entrada
}

// Fotos de desarrollos por zona (sin nombrar proyectos). Mismo tamaño, alineadas a las
// esquinas y giradas ~12° hacia afuera (izquierda a la izquierda, derecha a la derecha).
const PHOTOS: MosaicPhoto[] = [
  {
    src: "/hero/ccm-foodtrucks.webp",
    alt: "Zona comercial de un desarrollo en el norte de Mérida",
    label: "Mérida",
    restClassName: "top-[5%] left-[2%] w-[22vw] min-w-[190px] aspect-[4/3]",
    from: { x: -300, y: 0 },
    rotate: -12,
    delay: 0.05,
  },
  {
    src: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club de un desarrollo en la selva de Yucatán",
    label: "Selva",
    restClassName: "bottom-[5%] left-[2%] w-[22vw] min-w-[190px] aspect-[4/3]",
    from: { x: -300, y: 0 },
    rotate: -12,
    delay: 0.16,
  },
  {
    src: "/hero/progreso-aereo.webp",
    alt: "Vista aérea de la costa de Progreso, Yucatán",
    label: "Costa",
    restClassName: "top-[5%] right-[2%] w-[22vw] min-w-[190px] aspect-[4/3]",
    from: { x: 300, y: 0 },
    rotate: 12,
    delay: 0.27,
  },
  {
    src: "/hero/ukana-pdc-gym.webp",
    alt: "Amenidad de un desarrollo de departamentos en el Caribe",
    label: "Caribe",
    restClassName: "bottom-[5%] right-[2%] w-[22vw] min-w-[190px] aspect-[4/3]",
    from: { x: 300, y: 0 },
    rotate: 12,
    delay: 0.38,
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function Chip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-2 left-2 rounded-full bg-espresso/70 px-3 py-1 text-xs text-crema backdrop-blur-sm">
      {label}
    </span>
  );
}

// Abanico: la imagen de estilo de vida arranca GRANDE y se encoge ligada al scroll (sin
// pinear la sección) mientras las 4 fotos de zona entran a las esquinas y SE QUEDAN. Sin
// sticky no desaparece; sin rotación quedan derechas y alineadas.
export function Mosaic({ heroSrc, heroAlt }: { heroSrc: string; heroAlt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0.05, 0.5], [1.22, 0.84], { clamp: true });

  return (
    <section ref={ref} className="bg-canvas px-5 pt-2 pb-10 md:px-10 md:pt-4 md:pb-12">
      <div className="mx-auto max-w-[1400px]">
        {/* Desktop: composición en abanico, alineada */}
        <div className="relative hidden h-[82vh] min-h-[560px] md:block">
          <motion.div
            style={reduce ? undefined : { scale: heroScale }}
            className="absolute left-1/2 top-1/2 h-[74%] w-[50%] -translate-x-1/2 -translate-y-1/2 origin-center overflow-hidden rounded-3xl"
          >
            <Image src={heroSrc} alt={heroAlt} fill className="object-cover" sizes="50vw" priority={false} />
          </motion.div>

          {PHOTOS.map((p) => (
            <motion.div
              key={p.src}
              initial={reduce ? false : { opacity: 0, x: p.from.x, y: p.from.y, rotate: p.rotate }}
              whileInView={{ opacity: 1, x: 0, y: 0, rotate: p.rotate }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ duration: 0.7, delay: p.delay, ease: EASE }}
              className={`absolute overflow-hidden rounded-2xl shadow-[0_20px_50px_-24px_rgba(20,16,14,0.4)] ${p.restClassName}`}
            >
              <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="22vw" />
              <Chip label={p.label} />
            </motion.div>
          ))}
        </div>

        {/* Mobile: grid estático */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-3xl">
            <Image src={heroSrc} alt={heroAlt} fill className="object-cover" sizes="100vw" />
          </div>
          {PHOTOS.map((p) => (
            <div key={p.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="50vw" />
              <Chip label={p.label} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
