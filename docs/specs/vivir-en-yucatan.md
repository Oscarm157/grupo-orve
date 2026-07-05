# Spec — Vivir en Yucatán / Live Yucatán

Marca independiente de Oscar (embajador Grupo Orve). Sitio de autoridad bilingüe
sobre vivir/invertir en Yucatán que captura al comprador relocation/inversión por
SEO, lo persiste como lead y lo funnelea a los desarrollos de Orve.

## Objetivo
Rodear a los portales (Inmuebles24, Lamudi) capturando al comprador *antes* del
portal, con contenido de autoridad + SEO programático que los brokers del grupo no
hacen. Ventaja de Oscar: marketing + SEO + keywords de baja competencia en Yucatán
(validadas en SEMrush). Incumbente del nicho (yucatanliving.com) dormido desde 2023:
mercado validado, puerta abierta.

## Fuente de verdad y arquitectura (fijada al inicio, NO se cambia a media tarea)
- **Inventario** = ~10 desarrollos propios de Grupo Orve (Ciudad Central Mérida/Progreso,
  XO'OK, Rosenda, Ukana Mérida/Playa, Tulum Ha, Zania, NUVA II, Kenúa). Curados a mano
  desde grupoorve.com. NO hay feed MLS ni reventa de terceros.
- **Zonas** = dataset curado de colonias/zonas de Yucatán (data real, no inventada).
- **Guías pilares** = MDX escritas a mano.
- **Leads** = tabla Neon + deep link WhatsApp.
- **Stack** = starter Oscarm157/starter (Next 16, Drizzle/Neon, Blob, Zod, security
  headers, estados, CI). El diseño es bespoke (flujo Refero); la plomería no se recablea.

## Alcance
IN:
- 3 capas de páginas: pilares (mano) · zonas (programáticas) · desarrollos (inventario)
- Bilingüe ES/EN con hreflang
- SEO técnico: sitemap dinámico, schema.org, URLs limpias, enlazado interno, LCP rápido
- Captura: WhatsApp contextual + form → Neon (lead con source_page)
- CRM mínimo: /admin con lista de leads + estados
- Piloto: 1 zona end-to-end antes de propagar

OUT (por ahora):
- Feed MLS / reventa de terceros
- Portal de inversionistas (es de Orve)
- CRM multi-usuario / permisos (v2)
- Pagos

## Árbol de páginas / URLs
- `/` home ES · `/en` home EN
- `/guias/[slug]` — pilares informacionales
- `/zonas/[colonia]` — programáticas geo
- `/desarrollos/[slug]` — fichas Orve (inventario)
- `/contacto`
- `sitemap.xml`, `robots.txt`

## Clusters SEO (BACKBONE — a validar contra el SEMrush de Oscar)
Pilares (informacional, baja competencia, intención de compra):
- vivir en mérida / en yucatán · mejores zonas para vivir en mérida
- costo de vida en mérida · ¿es seguro mérida?
- invertir en bienes raíces mérida · plusvalía por zona
- comprar casa siendo extranjero (fideicomiso zona costa)
Programáticas (geo long-tail, "casas/terrenos en venta en [colonia]"):
- Temozón Norte, Cholul, Conkal, Montebello, Altabrisa, Francisco de Montejo,
  Komchén, Dzityá, Sitpach + costa (Progreso, Chicxulub)
Regla dura: cada zona se publica SOLO con data real (precio/plusvalía o desarrollo
Orve presente). Sin data → no se genera / noindex. Cero thin content.

## Modelo de datos (Drizzle/Neon)
- `zonas`: id, slug, nombre, descripcion_md, precio_m2, plusvalia_anual, perfil,
  amenidades jsonb, lat, lng, publicada bool
- `desarrollos`: id, slug, nombre, zona_id, tipo, precio_desde, m2_rango, recamaras,
  fotos jsonb, url_orve, estado
- `guias`: MDX en /content (slug, titulo, lang, tipo, zonas_relacionadas)
- `leads`: id, nombre, email, tel, mensaje, source_page, lang, estado
  (nuevo/contactado/…), created_at

## Captura y flujo de lead
- WhatsApp: botón contextual, deep link con mensaje pre-armado por página.
- Form: Zod + anti-abuso (BotID) → `leads` en Neon.
- **PENDIENTE LEGAL (resolver antes de conectar desarrollo):** ¿el lead entra también
  a `crm.grupoorve.mx` por obligación de embajador, o lo quedas tú primero y lo pasas?

## Seguridad (de base, no al final)
- Route handlers / server actions: guard de auth + Zod en todo input externo.
- `/admin` detrás de `requireUser`/`requireRole`.
- Blob privado para uploads, security headers en next.config, secrets solo en .env.local.

## Estados
- Cada vista nace con loading / empty / error.
- El lead se persiste siempre (nada que se pierda al recargar).

## Fases (piloto antes de propagar)
1. Bootstrap starter + DESIGN.md (research Refero: editorial relocation/real-estate).
2. **PILOTO — 1 zona (Temozón Norte) end-to-end:** página de zona generada desde tabla
   + desarrollo Orve colgado + WhatsApp + form→Neon + schema + sitemap. Revisar AQUÍ
   (revisor-codigo + critico-anti-slop en copy), es piloto deliberado el 1º de N.
3. Propagar template al resto de zonas desde la tabla (leer diff del delta).
4. Guías pilares (5-8) + enlazado interno pilar→zona→desarrollo.
5. Bilingüe EN + hreflang.
6. CRM mínimo /admin.

## Criterios de aceptación (ejecutables donde se pueda)
- Piloto: la página de zona se genera desde la tabla (no hardcode); sitemap incluye la
  ruta; schema válido (Rich Results); LCP < 2.5s en preview; form persiste en Neon y
  aparece en /admin; WhatsApp abre con contexto correcto; copy pasa critico-anti-slop.
- Programático: 0 páginas thin (toda zona publicada tiene precio o desarrollo).
- SEO: sitemap.xml y robots.txt válidos; hreflang ES/EN correcto.
- "Aprobado" = captura real (Playwright) + criterios marcados uno por uno.

## Riesgos
- Thin content si se generan zonas vacías → gate de publicación por data.
- Colisión de marca "Yucatán Living" (sitio de 2005) → usamos "Vivir en Yucatán".
- Datos/fotos de desarrollos Orve → curar de la fuente, nunca inventar (anti-slop).
- Flujo de lead vs CRM de Orve → resolver legal antes de conectar.
- Dominio: verificar vivirenyucatan.com/.mx libre en registrador antes de comprar.
