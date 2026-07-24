"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Sección con encabezado que se pliega. El estado se recuerda por `id`, para que
 * lo que colapsaste siga colapsado al recargar.
 */
export function Plegable({
  id,
  titulo,
  contador,
  children,
  inicial = true,
}: {
  id: string;
  titulo: ReactNode;
  contador?: ReactNode;
  children: ReactNode;
  inicial?: boolean;
}) {
  const [abierto, setAbierto] = useState(inicial);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem(`plegable:${id}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (guardado !== null) setAbierto(guardado === "1");
    setMontado(true);
  }, [id]);

  useEffect(() => {
    if (montado) localStorage.setItem(`plegable:${id}`, abierto ? "1" : "0");
  }, [id, abierto, montado]);

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center gap-2 py-1.5 text-left"
      >
        <ChevronDown
          className={`size-4 text-[var(--crm-ink-mute)] transition-transform ${
            abierto ? "" : "-rotate-90"
          }`}
        />
        <span className="crm-h2 text-[15px]">{titulo}</span>
        {contador != null && (
          <span className="text-[12.5px] text-[var(--crm-ink-faint)]">{contador}</span>
        )}
      </button>
      {abierto && <div className="mt-1.5">{children}</div>}
    </section>
  );
}
