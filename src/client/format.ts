/**
 * Copyright Advanced Software and AI Solutions LLC
 */

export function na(value: string | number | null | undefined, suffix = ""): string {
  if (value == null || value === "") return "Not available";
  return `${value}${suffix}`;
}

export function pct(value: number | null | undefined): string {
  if (value == null) return "Not available";
  return `${Math.round(value)}%`;
}
