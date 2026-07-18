// Helpers de parseo de FormData compartidos por las server actions del panel.
// (num/decimal se deja local en cada action porque su rango difiere: lat/lng admite
// negativos, áreas/precios no.)

export const str = (v: FormDataEntryValue | null): string | null => {
  const t = String(v ?? "").trim();
  return t || null;
};

export const int = (v: FormDataEntryValue | null): number | null => {
  const d = String(v ?? "").replace(/[^\d]/g, "");
  if (d === "") return null;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? Math.min(n, 2_000_000_000) : null;
};

export const csv = (v: FormDataEntryValue | null): string[] =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Violación de unicidad de Postgres (slug duplicado) — código 23505.
export function isUniqueViolation(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  return code === "23505" || /duplicate key|unique/i.test(String((e as Error)?.message ?? ""));
}
