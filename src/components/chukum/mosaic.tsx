"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

interface MosaicPhoto {
  src: string;
  alt: string;
  label: string; // chip de zona
  restClassName: string;
  from: { x: number; y: number };
  enter: [number, number];
  rotateFrom: number;
  rotateTo: number;
}

// Fotos de desarrollos por zona (sin nombrar proyectos), alrededor de la imagen central.
const PHOTOS: MosaicPhoto[] = [
  {
    src: "/hero/ccm-foodtrucks.webp",
    alt: "Zona comercial de un desarrollo en el norte de Mérida",
    label: "Mérida",
    restClassName: "top-[2%] left-[1%] w-[23vw] min-w-[200px] aspect-[4/3]",
    from: { x: -320, y: 70 },
    enter: [0.12, 0.34],
    rotateFrom: -6,
    rotateTo: -3,
  },
  {
    src: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club de un desarrollo en la selva de Yucatán",
    label: "Selva",
    restClassName: "bottom-[3%] left-[3%] w-[18vw] min-w-[160px] aspect-[4/5]",
    from: { x: -180, y: 240 },
    enter: [0.2, 0.42],
    rotateFrom: 5,
    rotateTo: 2,
  },
  {
    src: "/hero/progreso-aereo.webp",
    alt: "Vista aérea de la costa de Progreso, Yucatán",
    label: "Costa",
    restClassName: "top-[4%] right-[1%] w-[22vw] min-w-[190px] aspect-[16/10]",
    from: { x: 320, y: -70 },
    enter: [0.28, 0.5],
    rotateFrom: 6,
    rotateTo: 3,
  },
  {
    src: "/hero/ukana-pdc-gym.webp",
    alt: "Amenidad de un desarrollo de departamentos en el Caribe",
    label: "Caribe",
    restClassName: "bottom-[5%] right-[3%] w-[17vw] min-w-[150px] aspect-[3/4]",
    from: { x: 240, y: 210 },
    enter: [0.36, 0.56],
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
  // clamp: sin él useTransform extrapola y las fotos se pasan de su lugar; con clamp
  // entran una vez y se quedan puestas.
  const x = useTransform(scrollYProgress, photo.enter, [photo.from.x, 0], { clamp: true });
  const y = useTransform(scrollYProgress, photo.enter, [photo.from.y, 0], { clamp: true });
  const opacity = useTransform(scrollYProgress, [photo.enter[0], photo.enter[0] + 0.1], [0, 1], { clamp: true });
  const rotate = useTransform(scrollYProgress, photo.enter, [photo.rotateFrom, photo.rotateTo], { clamp: true });

  return (
    <motion.div
      style={{ x, y, opacity, rotate }}
      className={`absolute overflow-hidden rounded-2xl shadow-[0_20px_50px_-24px_rgba(20,16,14,0.4)] ${photo.restClassName}`}
    >
      <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="25vw" />
      <Chip label={photo.label} />
    </motion.div>
  );
}

// Abanico: la imagen de estilo de vida arranca GRANDE (pantalla completa) y se ENCOGE con
// el scroll a un card central, mientras las 4 fotos de zona entran alrededor. Una vez
// formada, la composición se sostiene (hold largo) antes de salir. clamp evita el drift.
export function Mosaic({ heroSrc, heroAlt }: { heroSrc: string; heroAlt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.55], { clamp: true });
  const heroRadius = useTransform(scrollYProgress, [0, 0.4], [0, 24], { clamp: true });

  if (reduce) {
    return (
      <section className="bg-canvas px-5 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-3 md:gap-4">
          <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-3xl">
            <Image src={heroSrc} alt={heroAlt} fill className="object-cover" sizes="100vw" />
          </div>
          {PHOTOS.map((p) => (
            <div key={p.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="50vw" />
              <Chip label={p.label} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[250vh] bg-canvas">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <motion.div
          style={{ scale: heroScale, borderRadius: heroRadius }}
          className="absolute inset-0 origin-center overflow-hidden"
        >
          <Image src={heroSrc} alt={heroAlt} fill className="object-cover" sizes="100vw" priority={false} />
        </motion.div>
        {PHOTOS.map((p) => (
          <MosaicPhotoItem key={p.src} photo={p} scrollYProgress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
