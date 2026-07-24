-- Tablas de investigación de keywords. Se aplican aparte: el journal de drizzle
-- viene desincronizado (varias tablas se crearon con push sin registrar), así que
-- una migración generada intentaría recrear leads/zonas/places y fallaría.
CREATE TABLE IF NOT EXISTS "kw_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brief" text NOT NULL,
	"mercado" text NOT NULL,
	"geo" text NOT NULL,
	"idioma" text NOT NULL,
	"tipo_cambio" numeric(6, 2),
	"total" integer NOT NULL,
	"corrida_en" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "kw_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL REFERENCES "kw_runs"("id") ON DELETE CASCADE,
	"keyword" text NOT NULL,
	"plaza" text NOT NULL,
	"volumen" integer NOT NULL,
	"competencia" text NOT NULL,
	"indice_competencia" integer,
	"puja_baja_usd" numeric(8, 2),
	"puja_alta_usd" numeric(8, 2),
	"variantes" integer DEFAULT 1 NOT NULL,
	"serie_12m" jsonb
);

CREATE INDEX IF NOT EXISTS "kw_ideas_plaza_idx" ON "kw_ideas" ("plaza");
CREATE INDEX IF NOT EXISTS "kw_ideas_run_idx" ON "kw_ideas" ("run_id");
