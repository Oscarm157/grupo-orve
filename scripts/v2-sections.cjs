// Captura secciones que dependen de scroll: el mosaico "abanico" en pleno fan-out y el
// grid de desarrollos (para verificar cards sin nombre).
const next = require("next");
const http = require("node:http");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const DIR = "/root/chukum";
const PORT = 4332;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.v2-shots`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const app = next({ dev: false, dir: DIR });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/inicio`, { waitUntil: "networkidle" });
    const vh = 900;

    // Mosaico: el track mide 280vh y arranca tras hero(100vh)+intro. Barremos varias
    // posiciones para pescar el abanico desplegado.
    for (const [mult, name] of [[2.4, "s-mosaic-a"], [3.0, "s-mosaic-b"], [3.6, "s-mosaic-c"]]) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(vh * mult));
      await wait(700);
      await page.screenshot({ path: `${OUT}/${name}.png` });
      console.log("shot: " + name);
    }

    for (const [id, name] of [["#desarrollos", "s-desarrollos"], ["#por-que", "s-porque"], ["#contacto", "s-contacto"]]) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await wait(800);
      await page.screenshot({ path: `${OUT}/${name}.png` });
      console.log("shot: " + name);
    }
    await ctx.close();
    await browser.close();
    console.log("DONE");
  } finally {
    server.close();
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
