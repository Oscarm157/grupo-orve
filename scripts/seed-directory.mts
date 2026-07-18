import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
import { getRankedPlaces } from "../src/lib/directory/sample-data";

// Crea (si faltan) las tablas del directorio y siembra los lugares. Aditivo: no toca tablas del CRM.
const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = (env.match(/DATABASE_URL=(.+)/) || [])[1]?.trim().replace(/^["']|["']$/g, "");
if (!url) throw new Error("sin DATABASE_URL");
const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS places (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    nombre text NOT NULL,
    category text NOT NULL,
    zona_slug text,
    place_id_google text UNIQUE,
    google_cid text,
    address text,
    lat numeric,
    lng numeric,
    rating numeric,
    reviews_count integer,
    price_level integer,
    image_url text,
    photo_urls jsonb,
    hours jsonb,
    phone text,
    website text,
    reservation_url text,
    menu_url text,
    rank_score numeric,
    rank_in_category integer,
    editorial_note text,
    perfiles jsonb,
    featured boolean NOT NULL DEFAULT false,
    hidden boolean NOT NULL DEFAULT false,
    published boolean NOT NULL DEFAULT false,
    data_source text NOT NULL DEFAULT 'outscraper',
    verified boolean NOT NULL DEFAULT false,
    source_refreshed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`;

await sql`
  CREATE TABLE IF NOT EXISTS guides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    titulo text NOT NULL,
    cluster text,
    perfiles jsonb,
    excerpt text,
    body_es text,
    body_en text,
    cover_url text,
    cover_alt text,
    seo_title text,
    seo_description text,
    published boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`;

const places = getRankedPlaces();
let n = 0;
for (const p of places) {
  await sql`
    INSERT INTO places (
      slug, nombre, category, zona_slug, place_id_google, address, lat, lng, rating,
      reviews_count, price_level, image_url, photo_urls, hours, phone, website,
      rank_score, perfiles, published, data_source
    ) VALUES (
      ${p.slug}, ${p.nombre}, ${p.category}, ${p.zonaSlug}, ${p.placeId ?? null}, ${p.address ?? null},
      ${p.lat}, ${p.lng}, ${p.rating}, ${p.reviewsCount}, ${p.priceLevel}, ${p.imageUrl ?? null},
      ${p.gallery ? JSON.stringify(p.gallery) : null}::jsonb,
      ${p.hours ? JSON.stringify(p.hours) : null}::jsonb,
      ${p.phone ?? null}, ${p.website ?? null}, ${p.rankScore},
      ${JSON.stringify(p.perfiles)}::jsonb, true, 'outscraper'
    )
    ON CONFLICT (slug) DO UPDATE SET
      nombre = EXCLUDED.nombre, category = EXCLUDED.category, zona_slug = EXCLUDED.zona_slug,
      address = EXCLUDED.address, lat = EXCLUDED.lat, lng = EXCLUDED.lng, rating = EXCLUDED.rating,
      reviews_count = EXCLUDED.reviews_count, price_level = EXCLUDED.price_level,
      image_url = EXCLUDED.image_url, photo_urls = EXCLUDED.photo_urls, hours = EXCLUDED.hours,
      phone = EXCLUDED.phone, website = EXCLUDED.website, rank_score = EXCLUDED.rank_score,
      perfiles = EXCLUDED.perfiles, published = true, updated_at = now()`;
  n++;
}
console.log(`sembrados ${n} lugares en la tabla places`);
const [{ count }] = await sql`SELECT count(*)::int as count FROM places WHERE published = true`;
console.log(`places publicados en DB: ${count}`);
