"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Scroll suave estilo Lightship. Respeta prefers-reduced-motion: si el usuario lo
// pide, no se inicializa y el navegador usa scroll nativo.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return null;
}
