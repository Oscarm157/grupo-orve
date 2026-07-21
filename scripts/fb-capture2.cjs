// Captura del catálogo (#desarrollos) y la página de detalle guau (name-free). Robusto.
const next = require("next");
const http = require("node:http");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const DIR = "/root/chukum";
const PORT = 4339;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.fb-shots`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const app = next({ dev: false, dir: DIR });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  console.log("Next en " + BASE);
  const browser = await chromium.launch();
  for (const [label, vp] of [["d", { width: 1440, height: 900 }], ["m", { width: 390, height: 844 }]]) {
    try {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      // Detalle guau
      await page.goto(`${BASE}/vivir-en-merida/desarrollos/selva-maya`, { waitUntil: "networkidle" });
      for (let y = 0; y < 12; y++) { await page.mouse.wheel(0, 700); await wait(120); }
      await page.evaluate(() => window.scrollTo(0, 0)); await wait(500);
      await page.screenshot({ path: `${OUT}/${label}-detalle.png`, fullPage: true });
      const html = await page.content();
      const leaks = ["Xo'ok","xook","Xenotikal","xenotikal","ukana","ciudad-central","Ciudad Central","ccm-","ccp-","tulum-ha","Grupo Orve"].filter((n) => html.includes(n));
      console.log(`${label} detalle leaks: ${leaks.length ? leaks.join(", ") : "NINGUNO"}`);
      // Catálogo
      await page.goto(`${BASE}/inicio`, { waitUntil: "networkidle" });
      for (let y = 0; y < 10; y++) { await page.mouse.wheel(0, 800); await wait(120); }
      await page.screenshot({ path: `${OUT}/${label}-catalogo.png`, fullPage: true });
      await ctx.close();
    } catch (e) { console.log(`${label} ERROR:`, String(e).slice(0, 200)); }
  }
  await browser.close();
  server.close();
  process.exit(0);
})();
