import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import { serverEnv } from "./env";

// El build (SSG) hace decenas de queries seguidas a Neon; el driver HTTP a veces devuelve
// "fetch failed" transitorio y Next aborta TODO el deploy por un solo fallo de red. Reintentamos
// el fetch con backoff corto para que un parpadeo no tumbe el build.
neonConfig.fetchFunction = async (url: string, opts: Record<string, unknown>) => {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fetch(url, opts);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastErr;
};

type DB = ReturnType<typeof drizzle<typeof schema>>;

let client: DB | undefined;

function get(): DB {
  if (!client) client = drizzle(neon(serverEnv().DATABASE_URL), { schema });
  return client;
}

// Proxy lazy: `db.select()...` no inicializa la conexión hasta el primer uso,
// así el build no necesita DATABASE_URL.
export const db = new Proxy({} as DB, {
  get: (_t, prop) => Reflect.get(get(), prop),
});
