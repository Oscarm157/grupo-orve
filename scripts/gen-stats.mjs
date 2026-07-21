// Regenera las 4 imágenes de la sección "Vivir en Mérida" (/inicio): fotográficas realistas,
// ligadas a su dato, con grade cálido artesanal (crema + verde cenote). Reemplazan a las
// abstractas actuales. Salida a .stat-cand/ para elegir antes de mover a public/hero/.
// Uso: REPLICATE_API_TOKEN=... node scripts/gen-stats.mjs
import fs from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error("Falta REPLICATE_API_TOKEN"); process.exit(1); }

const OUTDIR = path.resolve(".stat-cand");
await fs.mkdir(OUTDIR, { recursive: true });

const MODEL = "google/nano-banana-pro";

async function run(input) {
  const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({ input }),
  });
  let data = await res.json();
  let tries = 0;
  while (data.urls?.get && data.status !== "succeeded" && data.status !== "failed" && tries < 120) {
    await new Promise((r) => setTimeout(r, 3000));
    const g = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
    data = await g.json();
    tries++;
  }
  if (data.status !== "succeeded") throw new Error(JSON.stringify(data.error || data.detail || data));
  return Array.isArray(data.output) ? data.output[0] : data.output;
}

async function save(name, url) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  const out = path.join(OUTDIR, name);
  await fs.writeFile(out, buf);
  console.log(`✓ ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
}

const STYLE =
  "Photorealistic documentary photography, natural light, subtle film grain, editorial, high detail. Modern present-day Mexico, contemporary everyday cars only, no vintage or classic cars. No text, no logos, no watermark, no people looking at camera.";

// Cada una una escena DISTINTA (no cuatro calles): clima=calle soleada, población=plaza
// del centro con gente, seguridad=barrio residencial de casas, playa=playa abierta.
const jobs = [
  ["clima.jpg",
    `A sunny colonial street in central Mérida, Yucatán at midday: warm cheerful tropical light, pastel facades, palms and bougainvillea, bright blue sky, pleasant warm summer feel (not harsh or oppressive). ${STYLE}`],
  ["poblacion.jpg",
    `The Plaza Grande main square in the historic center of Mérida, Yucatán: the twin-towered cathedral and colonial arcades, families and tourists strolling, benches, trees, lively city-center life. Wide establishing view of a busy plaza. ${STYLE}`],
  ["seguridad.jpg",
    `A calm, well-kept residential neighborhood in Mérida, Yucatán: modern single-family homes with tidy front gardens and low walls, a quiet clean street, a family walking a dog, safe peaceful suburban feel, soft afternoon light. ${STYLE}`],
  ["playa.jpg",
    `An open beach on the Yucatán gulf coast near Progreso: wide pale sand, calm turquoise shallow water, gentle waves, a few coconut palms, people relaxing and swimming, bright warm daylight. Beach-forward composition (no pier). ${STYLE}`],
];

// Cuenta con rate limit bajo (6/min, burst 1): una a la vez con espacio entre llamadas.
for (const [name, prompt] of jobs) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await save(name, await run({ prompt, aspect_ratio: "3:4", resolution: "2K", output_format: "jpg" }));
      break;
    } catch (e) {
      const throttled = String(e).includes("throttled");
      console.error(`✗ ${name} (intento ${attempt}):`, String(e).slice(0, 120));
      if (!throttled && attempt >= 1) { await new Promise((r) => setTimeout(r, 12000)); }
      else { await new Promise((r) => setTimeout(r, 15000)); }
    }
  }
  await new Promise((r) => setTimeout(r, 12000));
}
console.log("DONE ->", OUTDIR);
