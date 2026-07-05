"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export interface StackSlide {
  src?: string;
  alt?: string;
  eyebrow: string;
  title: string;
  body: string;
  specs?: { label: string; value: string }[];
  disclaimer?: string;
}

function StackCopy({
  slide,
  scrollYProgress,
  start,
  end,
}: {
  slide: StackSlide;
  scrollYProgress: import("motion/react").MotionValue<number>;
  start: number;
  end: number;
}) {
  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.05, end - 0.05, end],
    [0, 1, 1, 0],
  );

  return (
    <motion.div style={{ opacity }} className="absolute inset-x-6 bottom-10 md:inset-x-10 md:bottom-14 md:max-w-md">
      <p className="text-sm tracking-[0.2em] text-pebble uppercase">{slide.eyebrow}</p>
      <h3 className="mt-2 text-2xl tracking-[-0.01em] md:text-3xl">{slide.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-pebble">{slide.body}</p>
      {slide.specs && (
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-[20px] border border-mist bg-cream/90 p-6 text-sm backdrop-blur-sm">
          {slide.specs.map((s) => (
            <div key={s.label}>
              <dt className="text-pebble">{s.label}</dt>
              <dd className="mt-1 text-xl">{s.value}</dd>
            </div>
          ))}
          {slide.disclaimer && (
            <p className="col-span-2 mt-1 text-xs text-driftwood">{slide.disclaimer}</p>
          )}
        </dl>
      )}
    </motion.div>
  );
}

function StackPhoto({
  slide,
  index,
  seg,
  scrollYProgress,
}: {
  slide: StackSlide;
  index: number;
  seg: number;
  scrollYProgress: import("motion/react").MotionValue<number>;
}) {
  const start = index * seg;
  const end = (index + 1) * seg;
  const y = useTransform(scrollYProgress, [start, end], [900, 0]);
  const opacity = useTransform(scrollYProgress, [start, start + 0.04], [0, 1]);

  return (
    <motion.div
      style={{ y, opacity, top: index * 14, zIndex: index + 1 }}
      className="absolute inset-6 overflow-hidden rounded-[20px] md:inset-10"
    >
      {slide.src && (
        <Image src={slide.src} alt={slide.alt ?? slide.title} fill className="object-cover" sizes="90vw" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <StackCopy slide={slide} scrollYProgress={scrollYProgress} start={start} end={end} />
    </motion.div>
  );
}

export function StackedReveal({
  backdropHeadline,
  slides,
}: {
  backdropHeadline: string;
  slides: StackSlide[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const seg = 1 / slides.length;

  if (reduceMotion) {
    return (
      <section className="relative mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-[100px]">
        <h2 className="text-[12vw] leading-[0.95] tracking-[-0.03em] md:text-[6vw]">{backdropHeadline}</h2>
        <div className="mt-10 space-y-10">
          {slides.map((s) => (
            <div key={s.title} className="relative aspect-[16/10] overflow-hidden rounded-[20px]">
              {s.src && <Image src={s.src} alt={s.alt ?? s.title} fill className="object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 md:inset-x-10 md:bottom-10 md:max-w-md">
                <p className="text-sm tracking-[0.2em] text-white/70 uppercase">{s.eyebrow}</p>
                <h3 className="mt-2 text-2xl text-white tracking-[-0.01em] md:text-3xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{s.body}</p>
                {s.specs && (
                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-[20px] bg-cream p-6 text-sm text-obsidian">
                    {s.specs.map((sp) => (
                      <div key={sp.label}>
                        <dt className="text-pebble">{sp.label}</dt>
                        <dd className="mt-1 text-xl">{sp.value}</dd>
                      </div>
                    ))}
                    {s.disclaimer && (
                      <p className="col-span-2 mt-1 text-xs text-driftwood">{s.disclaimer}</p>
                    )}
                  </dl>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[320vh] bg-cream">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <h2 className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-[15vw] leading-[0.9] tracking-[-0.04em] text-obsidian/90 md:px-10 md:text-[8vw]">
          {backdropHeadline}
        </h2>
        {slides.map((slide, i) => (
          <StackPhoto key={slide.title} slide={slide} index={i} seg={seg} scrollYProgress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
