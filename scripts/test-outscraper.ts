import { mapOutscraperRow } from "../src/lib/directory/outscraper";

let failed = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failed++;
}

// Fila representativa de un export de Outscraper (Google Maps).
const row = {
  name: "Marago Coffee",
  full_address: "Calle 33D 498, Buenavista, 97127 Mérida, Yuc.",
  rating: "4.7",
  reviews: "2140",
  photos_count: 812,
  photo: "https://lh5.googleusercontent.com/marago.jpg",
  working_hours: { Monday: "7AM-9PM", Sunday: "8AM-2PM" },
  phone: "+52 999 123 4567",
  site: "https://maragocoffee.com",
  latitude: 20.99,
  longitude: -89.62,
  place_id: "ChIJd8BlQ2BZwokRAFUEcm_qX9c",
  range: "$$",
  menu_link: "https://maragocoffee.com/menu",
};

const m = mapOutscraperRow(row, { category: "cafe", zonaId: "norte" });

check("nombre mapeado", m.nombre === "Marago Coffee");
check("slug estable con sufijo de place_id", m.slug === "marago-coffee-cmqx9c");
check("category del contexto", m.category === "cafe");
check("rating a string numérico", m.rating === "4.7");
check("reviewsCount numérico", m.reviewsCount === 2140);
check("priceLevel $$ -> 2", m.priceLevel === 2);
check("website de `site`", m.website === "https://maragocoffee.com");
check("photoUrls como array", Array.isArray(m.photoUrls) && m.photoUrls![0].includes("marago"));
check("hours pasa directo", m.hours?.Monday === "7AM-9PM");
check("dataSource outscraper", m.dataSource === "outscraper");
check("placeIdGoogle preservado", m.placeIdGoogle === "ChIJd8BlQ2BZwokRAFUEcm_qX9c");

// Fila mínima: solo nombre, sin place_id. No debe romper (aunque el import la saltaría).
const min = mapOutscraperRow({ name: "Puesto sin ID" }, { category: "mercado" });
check("fila mínima no rompe", min.nombre === "Puesto sin ID" && min.placeIdGoogle === null);

if (failed > 0) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log("\nTodos los tests del importador pasaron.");
