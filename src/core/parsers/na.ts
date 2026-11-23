/**
 * Copyright Advanced Software and AI Solutions LLC
 */

const NA_VALUES = new Set([
  "[n/a]",
  "[not supported]",
  "n/a",
  "not supported",
  "not available",
  "",
]);

export function parseNullableString(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (NA_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function parseNullableNumber(raw: string | undefined | null): number | null {
  const s = parseNullableString(raw);
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function displayNullable(value: string | number | null | undefined): string {
  if (value == null || value === "") return "Not available";
  return String(value);
}
