@AGENTS.md

# Vivir en Yucatán / Live Yucatán

Marca independiente de Oscar (embajador de Grupo Orve) para captar compradores por SEO.
Sitio de autoridad de relocation/inversión en Yucatán que rodea a los portales, captura al
comprador y lo funnelea a los desarrollos de Orve. Bootstrap: copia del sitio Grupo-Orve
(mismo starter de plomería) rebrandeada. Spec: `docs/specs/vivir-en-yucatan.md`.

## Reglas (heredan del CLAUDE.md global de Oscar)
- Seguridad de base: toda server action / route handler abre con `requireUser()`/`requireRole()`.
  Validar todo input con Zod. Nunca confiar en IDs del cliente: cargarlos de DB.
- Estados por default: cada vista nace con loading / empty / error (`src/components/states.tsx`).
- Persistir estado; nada efímero. Secrets solo en `.env.local`. Headers ya en `next.config.ts`.
- Anti-slop: data real, nunca inventada; sin em-dashes en copy; sin frases huecas.
- Git: commits chicos por feature, push frecuente; no saltar de tarea sin commitear.

## Arquitectura SEO (3 capas)
- Pilares (guías MDX, `/guias/[slug]`) · Zonas programáticas (`/zonas/[slug]`, tabla `zonas`) ·
  Fichas de desarrollo (`/desarrollos/[slug]`, tabla `developments`). Enlazado interno
  pilar→zona→desarrollo. Gate anti thin-content: zona sin data real no se publica (`publicada`).
- ES primero; EN + hreflang después (columnas `descripcionEn`/`descriptionEn` ya existen).

## Datos (`src/lib/schema.ts`)
- `zonas`: colonia/zona con precio m², plusvalía, perfil, amenidades. `dataSource`/`verified`:
  nada se muestra como confirmado sin el ok de Oscar.
- `developments`/`developmentImages`/`units`: los ~10 desarrollos de Orve, curados a mano
  (piloto: XO'OK). `zonaId` liga cada desarrollo a su zona.
- `leads`: captura form + WhatsApp. El lead lo queda Oscar primero; status `enviado_orve`
  marca el hand-off manual al CRM de Grupo Orve. UTM + atribución por zona/desarrollo.

## Plomería (del starter, no tocar salvo necesidad)
- Auth cookie firmada (`src/lib/auth.ts` + `src/lib/session.ts`), Drizzle+Neon (`src/lib/db.ts`),
  Blob, Resend, env validado, Sentry, CI, Playwright, BotID, security headers.

## Diseño (bespoke)
- Reference lock propio vía Refero (NO copiar el DESIGN.md de Orve). Editorial relocation/
  real-estate. Validar UI con captura real (Playwright); en el VPS usar build de prod
  (`next start`), no `next dev`. Materializar en `DESIGN.md`.

## Pendientes de Oscar (no bloquean el piloto)
- Keywords SEMrush (backbone de la propagación de zonas). Data real de XO'OK. Comprar dominio
  (`vivirenyucatan.com`). Provisionar Neon (`.env.local` con `DATABASE_URL`) para migrar/seed.
