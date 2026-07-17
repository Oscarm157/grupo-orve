// Genera stills candidatos para el hero: atardecer de playa/costa de Progreso (Yucatán),
// genérico, que represente a Mérida, SIN nombrar ni mostrar un desarrollo. Salida a .hero-cand/
// para que Oscar elija uno antes de animarlo. Uso: REPLICATE_API_TOKEN=... node scripts/gen-hero-still.mjs
import fs from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error("Falta REPLICATE_API_TOKEN"); process.exit(1); }

const OUTDIR = path.resolve(".hero-cand");
await fs.mkdir(OUTDIR, { recursive: true });

async function run(model, input) {
  const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({ input }),
  });
  let data = await res.json();
  let tries = 0;
  while (data.status && data.status !== "succeeded" && data.status !== "failed" && tries < 120) {
    await new Promise((r) => setTimeout(r, 3000));
    const g = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
    data = await g.json();
    tries++;
  }
  if (data.status !== "succeeded") throw new Error(JSON.stringify(data.error || data.status));
  return Array.isArray(data.output) ? data.output[0] : data.output;
}

async function save(name, url) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  const out = path.join(OUTDIR, name);
  await fs.writeFile(out, buf);
  console.log(`✓ ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
}

// Aéreo real de Progreso, relighteado a golden-hour (conserva la costa real).
const aerial = await fs.readFile(path.resolve("public/hero/progreso-aereo.webp"));
const aerialUri = `data:image/webp;base64,${aerial.toString("base64")}`;

const jobs = [
  ["a-aereo.jpg", "google/nano-banana-pro", {
    prompt:
      "Relight this real aerial coastal photo of Progreso, Yucatán into a warm golden-hour sunset over the Gulf of Mexico. Keep the exact same real coastline, beach, malecón and buildings. Low sun near the horizon casting long warm light, calm turquoise sea, soft orange and pink sky with gentle clouds. Photorealistic aerial photography, natural, cinematic, high detail. No text, no logos, no watermark.",
    image_input: [aerialUri], aspect_ratio: "16:9", resolution: "2K", output_format: "jpg",
  }],
  ["b-malecon.webp", "black-forest-labs/flux-1.1-pro", {
    prompt:
      "Photorealistic wide cinematic shot of a tropical beach on the Yucatán gulf coast (Progreso, Mexico) at golden-hour sunset. Tall coconut palm trees leaning over calm turquoise water, warm low sun near the horizon, soft orange and pink sky, gentle clouds, empty sand, natural film look, fine grain. Slightly darker moody foreground. No people, no text, no logos, no watermark.",
    aspect_ratio: "16:9", output_format: "webp", prompt_upsampling: true,
  }],
  ["c-playa.webp", "black-forest-labs/flux-1.1-pro", {
    prompt:
      "Photorealistic cinematic sunset over the Gulf of Mexico seen from a Yucatán beach: silhouettes of palm trees against a warm dramatic orange sky, sun reflecting on calm shallow water, long beach, atmospheric golden light, natural, high dynamic range, film grain. Empty, serene. No people, no text, no logos, no watermark.",
    aspect_ratio: "16:9", output_format: "webp", prompt_upsampling: true,
  }],
];

await Promise.all(
  jobs.map(async ([name, model, input]) => {
    try { await save(name, await run(model, input)); }
    catch (e) { console.error(`✗ ${name}:`, String(e).slice(0, 200)); }
  })
);
console.log("DONE ->", OUTDIR);
