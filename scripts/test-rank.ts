import { computeRankings } from "../src/lib/directory/rank";

let failed = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failed++;
}

// Caso 1: el que motiva la media bayesiana. Categoría café realista (la media de cafés reales
// ronda ~4.4), para que el prior por categoría sea estable. El 5.0 con 3 reseñas no debe ganar
// al 4.6 con 900.
const cafePop = [
  { key: "c1", rating: 4.3, reviewsCount: 320 },
  { key: "c2", rating: 4.4, reviewsCount: 610 },
  { key: "c3", rating: 4.2, reviewsCount: 180 },
  { key: "c4", rating: 4.5, reviewsCount: 430 },
  { key: "c5", rating: 4.1, reviewsCount: 90 },
  { key: "c6", rating: 4.4, reviewsCount: 275 },
].map((c) => ({ ...c, category: "cafe", zonaId: "norte" }));
const cafes = computeRankings([
  { key: "nuevo-5.0", category: "cafe", zonaId: "norte", rating: 5.0, reviewsCount: 3 },
  { key: "establecido-4.6", category: "cafe", zonaId: "norte", rating: 4.6, reviewsCount: 900 },
  ...cafePop,
]);
const byKey = Object.fromEntries(cafes.map((r) => [r.key, r]));
check("4.6 con 900 reseñas gana al 5.0 con 3", byKey["establecido-4.6"].rankInCategory === 1);
check("el 5.0 con 3 reseñas no queda #1", byKey["nuevo-5.0"].rankInCategory !== 1);

// Caso 1b: el ancla de prior fijo garantiza la intuición aun con grupo diminuto.
const tiny = computeRankings(
  [
    { key: "nuevo-5.0", category: "cafe", zonaId: "norte", rating: 5.0, reviewsCount: 3 },
    { key: "establecido-4.6", category: "cafe", zonaId: "norte", rating: 4.6, reviewsCount: 900 },
  ],
  { prior: 4.2 }
);
check(
  "con prior fijo 4.2, el 4.6 con 900 gana aun en grupo de 2",
  tiny.find((r) => r.key === "establecido-4.6")!.rankInCategory === 1
);

// Caso 2: agrupa por categoría+zona. Un bar en otra zona no compite con los cafés.
const mixed = computeRankings([
  { key: "cafe-a", category: "cafe", zonaId: "norte", rating: 4.5, reviewsCount: 100 },
  { key: "bar-a", category: "bar", zonaId: "centro", rating: 4.9, reviewsCount: 1000 },
]);
check(
  "cada uno es #1 de su propio grupo",
  mixed.find((r) => r.key === "cafe-a")!.rankInCategory === 1 &&
    mixed.find((r) => r.key === "bar-a")!.rankInCategory === 1
);

// Caso 3: un lugar sin rating cae hacia la media, no lo bloquea.
const withNull = computeRankings([
  { key: "top", category: "restaurante", zonaId: "norte", rating: 4.8, reviewsCount: 500 },
  { key: "sin-rating", category: "restaurante", zonaId: "norte", rating: null, reviewsCount: null },
]);
check(
  "lugar sin rating no queda #1",
  withNull.find((r) => r.key === "sin-rating")!.rankInCategory === 2
);

// Caso 4: determinismo. Mismo input -> mismo output.
const a = JSON.stringify(computeRankings(cafes.map((r) => ({ key: r.key, category: "cafe", rating: 4.5, reviewsCount: 10 }))));
const b = JSON.stringify(computeRankings(cafes.map((r) => ({ key: r.key, category: "cafe", rating: 4.5, reviewsCount: 10 }))));
check("determinista (mismo input, mismo orden)", a === b);

console.log(byKey);
if (failed > 0) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log("\nTodos los tests del ranking pasaron.");
