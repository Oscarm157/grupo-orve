import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-mist bg-cream">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10">
        <p className="max-w-md text-2xl tracking-[-0.01em]">
          Cada vez más personas construyen su futuro con Grupo Orve.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-8 border-t border-mist pt-10 md:grid-cols-4">
          <div>
            <p className="text-sm text-pebble">Navegación</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="#xook" className="transition hover:text-pebble">Xo&apos;ok</Link>
              <Link href="#por-que-invertir" className="transition hover:text-pebble">
                ¿Por qué invertir?
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm text-pebble">Contacto</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <a
                href="https://www.grupoorve.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-pebble"
              >
                grupoorve.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-mist pt-6 text-xs text-driftwood md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl">
            Cifras y specs de desarrollos mostrados son material de marketing publicado por Grupo
            Orve, no constituyen inventario verificado ni oferta vinculante.
          </p>
          <p>© {new Date().getFullYear()}, Grupo Orve.</p>
        </div>
      </div>
    </footer>
  );
}
