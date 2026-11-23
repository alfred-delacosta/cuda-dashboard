/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import type { GpuMetrics } from "../types.js";
import { parseNullableNumber, parseNullableString } from "./na.js";

/** Split a CSV line that does not contain quoted commas (nvidia-smi nounits style). */
export function splitCsvLine(line: string): string[] {
  return line.split(",").map((c) => c.trim());
}

export function parseGpuQueryCsv(stdout: string): GpuMetrics[] {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line) => {
    const c = splitCsvLine(line);
    return {
      index: parseNullableNumber(c[0]),
      name: parseNullableString(c[1]),
      uuid: parseNullableString(c[2]),
      driverVersion: parseNullableString(c[3]),
      computeCap: parseNullableString(c[4]),
      pciBusId: parseNullableString(c[5]),
      pstate: parseNullableString(c[6]),
      temperatureGpu: parseNullableNumber(c[7]),
      fanSpeed: parseNullableNumber(c[8]),
      utilizationGpu: parseNullableNumber(c[9]),
      utilizationMemory: parseNullableNumber(c[10]),
      memoryTotalMiB: parseNullableNumber(c[11]),
      memoryUsedMiB: parseNullableNumber(c[12]),
      memoryFreeMiB: parseNullableNumber(c[13]),
      powerDrawW: parseNullableNumber(c[14]),
      powerLimitW: parseNullableNumber(c[15]),
      clocksSm: parseNullableNumber(c[16]),
      clocksMaxSm: parseNullableNumber(c[17]),
    };
  });
}
