// Franja de azulejos marinos bajo el hero: marquee horizontal en loop. Muestra las 2 filas
// superiores (recorte por overflow) de una imagen 21:9; las copias impares van espejadas
// (-scale-x) para que cada empalme case y el loop no muestre costura. Decorativa (aria-hidden),
// CSS puro (sin JS); se detiene con prefers-reduced-motion (ver .tile-marquee-track en globals).

const BAND = "h-[150px] md:h-[190px]";
const IMG = "h-[300px] w-auto md:h-[380px]"; // 2x el alto de la banda → recorta las 2 filas de arriba

function Unit() {
  return (
    <div className="flex shrink-0">
      <img
        src="/hero/azulejos-mar.webp"
        alt=""
        className={`${IMG} max-w-none select-none`}
        draggable={false}
      />
      <img
        src="/hero/azulejos-mar.webp"
        alt=""
        className={`${IMG} max-w-none -scale-x-100 select-none`}
        draggable={false}
      />
    </div>
  );
}

export function TileBand() {
  return (
    <section
      aria-hidden
      className={`${BAND} overflow-hidden border-y border-hairline bg-canvas`}
    >
      <div className="tile-marquee-track flex w-max">
        <Unit />
        <Unit />
      </div>
    </section>
  );
}
