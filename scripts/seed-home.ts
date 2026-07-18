// @ts-nocheck -- script de runtime (node --experimental-strip-types); import con .ts a propósito.
// Seed de los desarrollos del home a la base (Opción A: la base gobierna el sitio).
// Importa el array real de src/lib/developments.ts (sin transcribir) y hace upsert por
// slug SIN pisar `name` (dato interno). Cada desarrollo queda con su hero image curada.
// Idempotente. Correr con:
//   node --experimental-strip-types --env-file=.env.local scripts/seed-home.ts
import { neon } from "@neondatabase/serverless";
import { DEVELOPMENTS } from "../src/lib/developments.ts";

const sql = neon(process.env.DATABASE_URL!);

// Nombres internos (permitidos en la base; nunca salen en publicidad). Fuente: CLAUDE.md.
const NAMES: Record<string, string> = {
  xook: "Xo'ok",
  "ciudad-central-merida": "Ciudad Central Mérida",
  "ciudad-central-progreso": "Ciudad Central Progreso",
  "ukana-playa-del-carmen": "Ukana",
  "tulum-ha": "Tulum Ha",
};

const BASE = new Date("2026-01-01T00:00:00Z").getTime();

for (let i = 0; i < DEVELOPMENTS.length; i++) {
  const d = DEVELOPMENTS[i];
  const state = d.zona === "caribe" ? "Quintana Roo" : "Yucatán";
  const createdAt = new Date(BASE + i * 60000); // orden determinista = orden del array
  const name = NAMES[d.slug] ?? d.heading;

  await sql`
    insert into developments
      (slug, name, heading, macro_zona, city, state, country, property_types, usos,
       status_marketing, description_es, highlight_specs, data_source, verified, created_at, updated_at)
    values
      (${d.slug}, ${name}, ${d.heading}, ${d.zona}, ${d.ciudad}, ${state}, 'MX',
       ${JSON.stringify(d.tipos)}::jsonb, ${JSON.stringify(d.usos)}::jsonb,
       ${d.etapa}, ${d.blurb}, ${JSON.stringify(d.specs ?? [])}::jsonb, 'curado', true, ${createdAt}, now())
    on conflict (slug) do update set
      heading = excluded.heading,
      macro_zona = excluded.macro_zona,
      city = excluded.city,
      state = excluded.state,
      property_types = excluded.property_types,
      usos = excluded.usos,
      status_marketing = excluded.status_marketing,
      description_es = excluded.description_es,
      highlight_specs = excluded.highlight_specs,
      verified = true,
      created_at = excluded.created_at,
      updated_at = now()`;

  const [{ id }] = await sql`select id from developments where slug = ${d.slug}`;

  // Una sola hero por desarrollo: la imagen curada del home.
  await sql`update development_images set kind = 'gallery' where development_id = ${id}`;
  const existing = await sql`select id from development_images where development_id = ${id} and url = ${d.image}`;
  if (existing.length) {
    await sql`update development_images set kind = 'hero', sort_order = 0, alt = ${d.alt} where id = ${existing[0].id}`;
  } else {
    await sql`insert into development_images (development_id, url, alt, kind, sort_order)
              values (${id}, ${d.image}, ${d.alt}, 'hero', 0)`;
  }
  console.log(`ok: ${d.slug} (${name})`);
}

console.log(`Listo. ${DEVELOPMENTS.length} desarrollos del home sembrados.`);
