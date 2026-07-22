// Genera varias variantes de olas NATIVAMENTE suaves (mar en calma, sin reventones), para elegir
// la que nace pareja sin necesidad de compresión agresiva. Salida a .ambient-cand/olas-N.wav
import fs from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error("Falta REPLICATE_API_TOKEN"); process.exit(1); }
const OUTDIR = path.resolve(".ambient-cand");
await fs.mkdir(OUTDIR, { recursive: true });
const VERSION = "9aff84a639f96d0f7e6081cdea002d15133d0043727f849c40abdd166b7c75a8";

async function run(input) {
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({ version: VERSION, input }),
  });
  let data = await res.json();
  let tries = 0;
  while (data.urls?.get && data.status !== "succeeded" && data.status !== "failed" && tries < 200) {
    await new Promise((r) => setTimeout(r, 3000));
    const g = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
    data = await g.json(); tries++;
  }
  if (data.status !== "succeeded") throw new Error(JSON.stringify(data.error || data.detail || data).slice(0, 300));
  const out = data.output;
  return typeof out === "string" ? out : out?.audio ?? (Array.isArray(out) ? out[0] : out);
}
async function save(name, url) {
  const r = await fetch(url);
  await fs.writeFile(path.join(OUTDIR, name), Buffer.from(await r.arrayBuffer()));
  console.log(`OK ${name}`);
}

const jobs = [
  ["olas-1.wav", "Calm gentle sea on a still day, tiny soft ripples of water lapping very quietly on sand, slow, distant, peaceful, continuous and even, no breaking waves, no crashes, seamless spa ambience"],
  ["olas-2.wav", "Soft continuous shoreline water, very gentle and quiet, smooth steady water texture, mellow and even, relaxing, no swell, no crashing waves, seamless background loop"],
  ["olas-3.wav", "Gentle calm ocean heard from far away, soft steady wash of water, mellow low and even, very quiet and continuous, peaceful, no breaking, no crashes, seamless loop"],
];
for (const [name, prompt] of jobs) {
  for (let a = 1; a <= 4; a++) {
    try { await save(name, await run({ prompt, seconds_total: 47, cfg_scale: 6, steps: 100 })); break; }
    catch (e) { console.error(`x ${name} (${a}):`, String(e).slice(0, 120)); await new Promise((r) => setTimeout(r, 15000)); }
  }
  await new Promise((r) => setTimeout(r, 12000));
}
console.log("DONE");
