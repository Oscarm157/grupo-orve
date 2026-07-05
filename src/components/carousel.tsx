"use client";

import { useEffect, useRef, useState } from "react";

interface CarouselProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  ariaLabel: string;
  itemClassName?: string;
}

export function Carousel<T>({ items, renderItem, ariaLabel, itemClassName }: CarouselProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = cardRefs.current.filter((c): c is HTMLDivElement => c !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = cards.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActive(idx);
          }
        }
      },
      { root: track, threshold: [0.6] },
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [items.length]);

  function scrollToIndex(index: number) {
    const card = cardRefs.current[index];
    if (card) card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        data-lenis-prevent
        role="region"
        aria-label={ariaLabel}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={`shrink-0 snap-start ${itemClassName ?? "w-[82vw] md:w-[38%]"}`}
          >
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir a la tarjeta ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                active === i ? "w-6 bg-obsidian" : "w-1.5 bg-mist"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Anterior"
            onClick={() => scrollToIndex(Math.max(0, active - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-mist transition hover:border-obsidian"
          >
            ←
          </button>
          <button
            aria-label="Siguiente"
            onClick={() => scrollToIndex(Math.min(items.length - 1, active + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-mist transition hover:border-obsidian"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
