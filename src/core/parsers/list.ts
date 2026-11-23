/**
 * Copyright Advanced Software and AI Solutions LLC
 */

export interface ListedGpu {
  index: number | null;
  name: string | null;
  uuid: string | null;
}

/** Parse nvidia-smi -L lines like: GPU 0: Name (UUID: GPU-...) */
export function parseGpuList(stdout: string): ListedGpu[] {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const out: ListedGpu[] = [];
  for (const line of lines) {
    const m = line.match(/^GPU\s+(\d+):\s*(.+?)\s*\(UUID:\s*([^)]+)\)\s*$/i);
    if (!m) continue;
    out.push({
      index: Number(m[1]),
      name: m[2].trim(),
      uuid: m[3].trim(),
    });
  }
  return out;
}
