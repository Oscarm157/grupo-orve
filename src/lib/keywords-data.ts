import { and, desc, eq, gte, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { kwIdeas, kwRuns, type KwMercado } from "./schema";

// Datos del research de Google Keyword Planner. Los genera el motor de
// /root/google-ads-automation y los carga scripts/import-keywords.mjs; aquí solo se leen.

export type PlazaResumen = {
  plaza: string;
  nacional: number;
  extranjero: number;
  total: number;
  cpc: number;
  keywords: number;
  disputa: number; // fracción de keywords con competencia alta
};

export async function getPlazas(): Promise<PlazaResumen[]> {
  // Dos corridas pueden traer la misma keyword (Mérida sale en península y en
  // Yucatán): se cuenta una sola vez por plaza y mercado, si no el volumen se dobla.
  const { rows } = await db.execute<{
    plaza: string; mercado: KwMercado; volumen: number;
    keywords: number; cpc: number; altas: number;
  }>(sql`
    WITH unicas AS (
      SELECT DISTINCT ON (i.plaza, r.mercado, i.keyword)
        i.plaza, r.mercado, i.keyword, i.volumen, i.competencia, i.puja_alta_usd
      FROM kw_ideas i
      JOIN kw_runs r ON r.id = i.run_id
      ORDER BY i.plaza, r.mercado, i.keyword, i.volumen DESC
    )
    SELECT plaza, mercado,
           sum(volumen)::int AS volumen,
           count(*)::int AS keywords,
           coalesce(avg(nullif(puja_alta_usd, 0)), 0)::float AS cpc,
           count(*) FILTER (WHERE competencia = 'HIGH')::int AS altas
    FROM unicas
    GROUP BY plaza, mercado
  `);

  const porPlaza = new Map<string, PlazaResumen & { _cpcs: number[]; _altas: number }>();
  for (const r of rows) {
    const actual = porPlaza.get(r.plaza) ?? {
      plaza: r.plaza, nacional: 0, extranjero: 0, total: 0,
      cpc: 0, keywords: 0, disputa: 0, _cpcs: [], _altas: 0,
    };
    if (r.mercado === "nacional_es") actual.nacional += r.volumen;
    else actual.extranjero += r.volumen;
    actual.total += r.volumen;
    actual.keywords += r.keywords;
    actual._altas += r.altas;
    if (r.cpc > 0) actual._cpcs.push(r.cpc);
    porPlaza.set(r.plaza, actual);
  }

  return [...porPlaza.values()]
    .map(({ _cpcs, _altas, ...p }) => ({
      ...p,
      cpc: _cpcs.length ? _cpcs.reduce((a, b) => a + b, 0) / _cpcs.length : 0,
      disputa: p.keywords ? _altas / p.keywords : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export type IdeaFila = {
  keyword: string;
  plaza: string;
  mercado: KwMercado;
  volumen: number;
  competencia: string;
  indice: number; // 0-100, qué tan disputada está la subasta
  cpcBaja: number;
  cpc: number;
  variantes: number;
  serie: number[] | null; // 12 meses, para estacionalidad
};

export async function getIdeas(filtros: {
  plaza?: string;
  mercado?: KwMercado;
  min?: number;
  q?: string;
  limite?: number;
}): Promise<IdeaFila[]> {
  const conds: SQL[] = [];
  if (filtros.plaza) conds.push(eq(kwIdeas.plaza, filtros.plaza));
  if (filtros.mercado) conds.push(eq(kwRuns.mercado, filtros.mercado));
  if (filtros.min) conds.push(gte(kwIdeas.volumen, filtros.min));
  if (filtros.q) conds.push(ilike(kwIdeas.keyword, `%${filtros.q}%`));

  const filas = await db
    .selectDistinctOn([kwIdeas.keyword, kwRuns.mercado], {
      keyword: kwIdeas.keyword,
      plaza: kwIdeas.plaza,
      mercado: kwRuns.mercado,
      volumen: kwIdeas.volumen,
      competencia: kwIdeas.competencia,
      indice: sql<number>`coalesce(${kwIdeas.indiceCompetencia}, 0)::int`,
      cpcBaja: sql<number>`coalesce(${kwIdeas.pujaBajaUsd}, 0)::float`,
      cpc: sql<number>`coalesce(${kwIdeas.pujaAltaUsd}, 0)::float`,
      variantes: kwIdeas.variantes,
      serie: kwIdeas.serie12m,
    })
    .from(kwIdeas)
    .innerJoin(kwRuns, eq(kwIdeas.runId, kwRuns.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(kwIdeas.keyword, kwRuns.mercado, desc(kwIdeas.volumen));

  return filas
    .sort((a, b) => b.volumen - a.volumen)
    .slice(0, filtros.limite ?? 150);
}

export async function getResumen() {
  const { rows: totales } = await db.execute<{ keywords: number; volumen: number; plazas: number }>(sql`
    WITH unicas AS (
      SELECT DISTINCT ON (i.plaza, r.mercado, i.keyword) i.plaza, i.volumen
      FROM kw_ideas i
      JOIN kw_runs r ON r.id = i.run_id
      ORDER BY i.plaza, r.mercado, i.keyword, i.volumen DESC
    )
    SELECT count(*)::int AS keywords, sum(volumen)::int AS volumen,
           count(DISTINCT plaza)::int AS plazas
    FROM unicas`);
  const r = totales[0];
  const [ultima] = await db
    .select({ fecha: kwRuns.corridaEn })
    .from(kwRuns)
    .orderBy(desc(kwRuns.corridaEn))
    .limit(1);
  return { ...r, corridaEn: ultima?.fecha ?? null };
}
