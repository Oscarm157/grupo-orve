// Genera dos capas de audio para el ambiente del home: mar constante y sutil + jazz muy bajo.
// Se mezclan luego con ffmpeg. Salida a .ambient-cand/. Uso: REPLICATE_API_TOKEN=... node scripts/gen-ambient.mjs
import fs from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error("Falta REPLICATE_API_TOKEN"); process.exit(1); }

const OUTDIR = path.resolve(".ambient-cand");
await fs.mkdir(OUTDIR, { recursive: true });

const MODEL = "stackadoc/stable-audio-open-1.0";

async function run(input) {
  const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({ input }),
  });
  let data = await res.json();
  let tries = 0;
  while (data.urls?.get && data.status !== "succeeded" && data.status !== "failed" && tries < 200) {
    await new Promise((r) => setTimeout(r, 3000));
    const g = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
    data = await g.json();
    tries++;
  }
  if (data.status !== "succeeded") throw new Error(JSON.stringify(data.error || data.detail || data).slice(0, 300));
  const out = data.output;
  return typeof out === "string" ? out : out?.audio ?? (Array.isArray(out) ? out[0] : out);
}

async function save(name, url) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  const out = path.join(OUTDIR, name);
  await fs.writeFile(out, buf);
  console.log(`✓ ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
}

const jobs = [
  ["waves.wav",
    "Gentle constant ocean waves lapping on a calm tropical beach, soft even and steady, distant and mellow, relaxing spa ambience, no strong crashes, seamless background loop, natural field recording",
  ],
  ["jazz.wav",
    "Very soft slow mellow lounge jazz, quiet warm piano with brushed drums and light upright bass, calm and dreamy, low volume background music, no vocals, relaxing cafe by the sea",
  ],
];

for (const [name, prompt] of jobs) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await save(name, await run({ prompt, seconds_total: 47, cfg_scale: 6, steps: 100 }));
      break;
    } catch (e) {
      console.error(`✗ ${name} (intento ${attempt}):`, String(e).slice(0, 140));
      await new Promise((r) => setTimeout(r, 15000));
    }
  }
  await new Promise((r) => setTimeout(r, 12000));
}
console.log("DONE ->", OUTDIR);
