// Carga los CSV del motor de keywords (/root/google-ads-automation) a la base.
// Crea las tablas si no existen y reemplaza la corrida anterior de cada brief.
//
//   node --env-file=.env.local scripts/import-keywords.mjs
//
// Los CSV no viven en el repo a propósito: es público y el research no se publica.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const ORIGEN = "/root/google-ads-automation/data";
const sql = neon(process.env.DATABASE_URL);

// brief -> metadatos de la corrida
const CORRIDAS = {
  peninsula_ciudades_es: { mercado: "nacional_es", geo: "México", idioma: "es" },
  peninsula_ciudades_en: { mercado: "extranjero_en", geo: "Estados Unidos", idioma: "en" },
  yucatan_es: { mercado: "nacional_es", geo: "México", idioma: "es" },
  playas_es: { mercado: "nacional_es", geo: "México", idioma: "es" },
  playas_en: { mercado: "extranjero_en", geo: "Estados Unidos", idioma: "en" },
  ciudades_es: { mercado: "nacional_es", geo: "México", idioma: "es" },
};

function parseCsv(texto) {
  const filas = [];
  let campo = "", fila = [], comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cabecera, ...resto] = filas;
  return resto
    .filter((f) => f.length === cabecera.length)
    .map((f) => Object.fromEntries(cabecera.map((k, i) => [k, f[i]])));
}

// El driver http no acepta varios statements por llamada: van de uno en uno.
const ddl = readFileSync(join(process.cwd(), "drizzle/kw_research.sql"), "utf8")
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
for (const statement of ddl) await sql.query(statement);

const archivos = readdirSync(ORIGEN).filter((f) => f.endsWith(".csv"));
for (const archivo of archivos) {
  const brief = archivo.replace(/\.csv$/, "");
  const meta = CORRIDAS[brief];
  if (!meta) { console.log(`saltado (sin metadatos): ${archivo}`); continue; }

  const ideas = parseCsv(readFileSync(join(ORIGEN, archivo), "utf8"))
    .filter((r) => r.keyword && r.plaza !== "sin clasificar");

  await sql`DELETE FROM kw_runs WHERE brief = ${brief}`;
  const [run] = await sql`
    INSERT INTO kw_runs (brief, mercado, geo, idioma, tipo_cambio, total)
    VALUES (${brief}, ${meta.mercado}, ${meta.geo}, ${meta.idioma}, 18.5, ${ideas.length})
    RETURNING id`;

  for (let i = 0; i < ideas.length; i += 500) {
    const lote = ideas.slice(i, i + 500);
    await sql`
      INSERT INTO kw_ideas (run_id, keyword, plaza, volumen, competencia,
        indice_competencia, puja_baja_usd, puja_alta_usd, variantes, serie_12m)
      SELECT ${run.id}::uuid, k, p, v::int, c, ic::int, pb::numeric, pa::numeric,
             va::int, s::jsonb
      FROM unnest(
        ${lote.map((r) => r.keyword)}::text[],
        ${lote.map((r) => r.plaza)}::text[],
        ${lote.map((r) => r.volumen_mensual)}::text[],
        ${lote.map((r) => r.competencia)}::text[],
        ${lote.map((r) => r.indice_competencia || "0")}::text[],
        ${lote.map((r) => r.puja_baja_usd)}::text[],
        ${lote.map((r) => r.puja_alta_usd)}::text[],
        ${lote.map((r) => r.variantes || "1")}::text[],
        ${lote.map((r) => JSON.stringify((r.serie_12m || "").split(" ").filter(Boolean).map(Number)))}::text[]
      ) AS t(k, p, v, c, ic, pb, pa, va, s)`;
  }
  console.log(`${brief}: ${ideas.length} keywords`);
}

const [{ total }] = await sql`SELECT count(*)::int AS total FROM kw_ideas`;
console.log(`total en base: ${total}`);
