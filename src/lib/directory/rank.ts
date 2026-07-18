// Ranking del directorio. Se corre UNA vez al importar de Outscraper y se recalcula en el refresh
// mensual. No toca DB ni red: recibe los lugares, devuelve rankScore + rankInCategory. Determinista.
//
// Media bayesiana (estilo "weighted rating" de IMDb), normalizada por categoría + zona:
//
//   WR = (v / (v + m)) * R  +  (m / (v + m)) * C
//
//   R = rating del lugar (0..5)      v = número de reseñas del lugar
//   C = rating medio del grupo        m = umbral de confianza (reseñas para "creerle" al rating)
//
// Pocas reseñas -> el score tira hacia la media del grupo (C). Muchas reseñas -> manda su propio
// rating (R). Así un 5.0 con 3 reseñas no le gana a un 4.6 con 900.

export type RankInput = {
  /** identificador estable para mapear el resultado de vuelta (slug o id) */
  key: string;
  category: string;
  /** null si no hay zona: se agrupa como "sin-zona" */
  zonaId?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  /** señal opcional: fecha de la reseña más reciente (ms epoch) */
  latestReviewAt?: number | null;
  /** señal opcional: cantidad de fotos del lugar */
  photosCount?: number | null;
};

export type RankResult = {
  key: string;
  rankScore: number;
  rankInCategory: number;
};

export type RankOptions = {
  /** umbral de confianza m. Default 25 reseñas. */
  confidence?: number;
  /**
   * Prior C: la media hacia la que se encoge un lugar con pocas reseñas.
   * Si se da, se usa fijo (baseline conservador, ej. 4.2). Si no, se calcula por categoría
   * (media de todos los lugares de esa categoría, no del grupito categoría+zona: si el grupo
   * tiene 3 lugares su media es inestable y rompe la regularización).
   */
  prior?: number;
  /** peso del bonus de recencia (0..1 del score). Default 0 (apagado). */
  recencyWeight?: number;
  /** peso del bonus por fotos (0..1 del score). Default 0 (apagado). */
  photosWeight?: number;
  /** "ahora" en ms epoch, para la recencia. Se pasa explícito para mantener el cálculo determinista. */
  now?: number;
};

function groupKey(category: string, zonaId?: string | null): string {
  return `${category}::${zonaId ?? "sin-zona"}`;
}

/** Bonus de recencia acotado 0..1: 1 si la reseña más nueva es de hoy, ~0 al año. */
function recency(latestReviewAt: number | null | undefined, now: number): number {
  if (!latestReviewAt) return 0;
  const days = (now - latestReviewAt) / 86_400_000;
  if (days <= 0) return 1;
  const year = 365;
  return Math.max(0, 1 - days / year);
}

/** Bonus por fotos acotado 0..1 con saturación (log): a partir de ~30 fotos ya casi no suma. */
function photos(count: number | null | undefined): number {
  const c = Math.max(0, count ?? 0);
  return Math.min(1, Math.log10(c + 1) / Math.log10(31));
}

/**
 * Calcula rankScore y rankInCategory para cada lugar, agrupando por categoría + zona.
 * El orden dentro del grupo desempata por número de reseñas y luego por key (estable).
 */
export function computeRankings(items: RankInput[], opts: RankOptions = {}): RankResult[] {
  const m = opts.confidence ?? 25;
  const recW = opts.recencyWeight ?? 0;
  const phoW = opts.photosWeight ?? 0;
  const now = opts.now ?? 0;

  // Prior C por categoría: media de TODOS los lugares con rating de esa categoría (no del grupo
  // categoría+zona, que puede ser diminuto e inestable). Con `opts.prior` se ancla a un fijo.
  const catSum = new Map<string, { sum: number; n: number }>();
  for (const it of items) {
    if (typeof it.rating !== "number") continue;
    const acc = catSum.get(it.category) ?? { sum: 0, n: 0 };
    acc.sum += it.rating;
    acc.n += 1;
    catSum.set(it.category, acc);
  }
  const priorFor = (category: string): number => {
    if (typeof opts.prior === "number") return opts.prior;
    const acc = catSum.get(category);
    return acc && acc.n > 0 ? acc.sum / acc.n : 0;
  };

  // Agrupar por categoría + zona (el ranking se muestra dentro de ese grupo).
  const groups = new Map<string, RankInput[]>();
  for (const it of items) {
    const g = groupKey(it.category, it.zonaId);
    const list = groups.get(g) ?? [];
    list.push(it);
    groups.set(g, list);
  }

  const results: RankResult[] = [];

  for (const list of groups.values()) {
    const C = priorFor(list[0].category);

    const scored = list.map((it) => {
      const R = typeof it.rating === "number" ? it.rating : C; // sin rating -> a la media
      const v = Math.max(0, it.reviewsCount ?? 0);
      const wr = (v / (v + m)) * R + (m / (v + m)) * C;

      // Señales opcionales, acotadas, que solo empujan si están activadas.
      const bonus = recW * recency(it.latestReviewAt, now) + phoW * photos(it.photosCount);
      const score = wr + bonus;

      return { it, score, v };
    });

    // Orden desc por score; desempate estable por reseñas y luego key.
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.v !== a.v) return b.v - a.v;
      return a.it.key < b.it.key ? -1 : a.it.key > b.it.key ? 1 : 0;
    });

    scored.forEach((s, i) => {
      results.push({
        key: s.it.key,
        rankScore: Math.round(s.score * 1000) / 1000,
        rankInCategory: i + 1,
      });
    });
  }

  return results;
}
