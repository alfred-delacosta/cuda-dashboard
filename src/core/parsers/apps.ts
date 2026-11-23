/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import type { ComputeApp } from "../types.js";
import { basenameOnly } from "../redact.js";
import { parseNullableNumber, parseNullableString } from "./na.js";
import { splitCsvLine } from "./csv.js";

export function parseAppsCsv(
  stdout: string,
  options: { showProcessNames: boolean; showIdentifiers: boolean },
): ComputeApp[] {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line) => {
    const c = splitCsvLine(line);
    const rawName = parseNullableString(c[2]);
    let processName: string | null = null;
    if (options.showProcessNames) {
      processName = basenameOnly(rawName);
    }
    let gpuUuid = parseNullableString(c[0]);
    if (!options.showIdentifiers && gpuUuid) {
      gpuUuid = "GPU-[REDACTED]";
    }
    return {
      gpuUuid,
      pid: parseNullableNumber(c[1]),
      processName,
      usedMemoryMiB: parseNullableNumber(c[3]),
    };
  });
}
