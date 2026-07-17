"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

interface MosaicPhoto {
  src: string;
  alt: string;
  label: string; // chip de zona: comunica el abanico de opciones, sin nombrar proyectos
  restClassName: string;
  from: { x: number; y: number };
  enter: [number, number];
  rotateFrom: number;
  rotateTo: number;
}

// Fotos genéricas de Yucatán/Caribe (sin nombrar desarrollos). Cada una lleva su zona
// como chip para leerse como "hay opciones en distintas zonas".
const PHOTOS: MosaicPhoto[] = [
  {
    src: "/hero/ccm-foodtrucks.webp",
    alt: "Zona comercial de un desarrollo en el norte de Mérida",
    label: "Mérida",
    restClassName: "top-[8%] left-[4%] w-[24vw] min-w-[200px] aspect-[4/3]",
    from: { x: -300, y: 60 },
    enter: [0.08, 0.32],
    rotateFrom: -6,
    rotateTo: -3,
  },
  {
    src: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club de un desarrollo residencial en la selva de Yucatán",
    label: "Selva",
    restClassName: "bottom-[10%] left-[8%] w-[19vw] min-w-[160px] aspect-[4/5]",
    from: { x: -160, y: 220 },
    enter: [0.16, 0.4],
    rotateFrom: 5,
    rotateTo: 2,
  },
  {
    src: "/hero/progreso-aereo.webp",
    alt: "Vista aérea de la costa de Progreso, Yucatán",
    label: "Costa",
    restClassName: "top-[11%] right-[5%] w-[23vw] min-w-[190px] aspect-[16/10]",
    from: { x: 300, y: -60 },
    enter: [0.24, 0.48],
    rotateFrom: 6,
    rotateTo: 3,
  },
  {
    src: "/hero/ukana-pdc-gym.webp",
    alt: "Amenidad de un desarrollo de departamentos en el Caribe",
    label: "Caribe",
    restClassName: "bottom-[13%] right-[7%] w-[18vw] min-w-[150px] aspect-[3/4]",
    from: { x: 220, y: 200 },
    enter: [0.32, 0.56],
    rotateFrom: -5,
    rotateTo: -2,
  },
];

function Chip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-2 left-2 rounded-full bg-espresso/70 px-3 py-1 text-xs text-crema backdrop-blur-sm">
      {label}
    </span>
  );
}

function MosaicPhotoItem({
  photo,
  scrollYProgress,
}: {
  photo: MosaicPhoto;
  scrollYProgress: import("motion/react").MotionValue<number>;
}) {
  // clamp: sin él, useTransform extrapola fuera del rango y las fotos se pasan de su
  // posición de reposo (se veían "desordenadas / aparecen y desaparecen"). Con clamp
  // entran una vez y se quedan en la composición.
  const x = useTransform(scrollYProgress, photo.enter, [photo.from.x, 0], { clamp: true });
  const y = useTransform(scrollYProgress, photo.enter, [photo.from.y, 0], { clamp: true });
  const opacity = useTransform(scrollYProgress, [photo.enter[0], photo.enter[0] + 0.12], [0, 1], { clamp: true });
  const rotate = useTransform(scrollYProgress, photo.enter, [photo.rotateFrom, photo.rotateTo], { clamp: true });

  return (
    <motion.div
      style={{ x, y, opacity, rotate }}
      className={`absolute overflow-hidden rounded-[20px] ${photo.restClassName}`}
    >
      <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="26vw" />
      <Chip label={photo.label} />
    </motion.div>
  );
}

// El hero se encoge a un card mientras entran fotos en abanico: comunica "hay opciones".
// Portado del inicio anterior a los tokens chukum. Respeta prefers-reduced-motion.
export function Mosaic({ heroSrc, heroAlt }: { heroSrc: string; heroAlt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.58], { clamp: true });
  const heroRadius = useTransform(scrollYProgress, [0, 0.3], [0, 20], { clamp: true });

  if (reduceMotion) {
    return (
      <section className="relative mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-[100px]">
        <div className="relative mx-auto aspect-[16/9] max-w-3xl overflow-hidden rounded-[20px]">
          <Image src={heroSrc} alt={heroAlt} fill className="object-cover" />
        </div>
        <div className="relative mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {PHOTOS.map((p) => (
            <div key={p.src} className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
              <Image src={p.src} alt={p.alt} fill className="object-cover" />
              <Chip label={p.label} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[220vh] bg-canvas">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <motion.div
          style={{ scale: heroScale, borderRadius: heroRadius }}
          className="absolute inset-0 origin-center overflow-hidden"
        >
          <Image src={heroSrc} alt={heroAlt} fill className="object-cover" priority={false} sizes="100vw" />
        </motion.div>
        {PHOTOS.map((p) => (
          <MosaicPhotoItem key={p.src} photo={p} scrollYProgress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
