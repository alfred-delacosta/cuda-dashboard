/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolkitInfo } from "./types.js";

export interface RecommendationSource {
  title: string;
  url: string;
}

export interface ToolkitCatalogEntry {
  version: string;
  driverBranch: string;
  notes: string;
}

export interface RecommendationCatalog {
  lastChecked: string;
  downloadsUrl: string;
  sources: RecommendationSource[];
  toolkits: ToolkitCatalogEntry[];
}

export type RecommendationStatus =
  | "install"
  | "current"
  | "upgrade"
  | "newer_than_driver"
  | "unknown";

export interface ToolkitRecommendation {
  status: RecommendationStatus;
  recommendedToolkit: string | null;
  driverBranch: string | null;
  notes: string | null;
  message: string;
  lastChecked: string;
  downloadsUrl: string;
  sources: RecommendationSource[];
}

function defaultCatalogPath(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "data", "cuda-recommendations.json");
}

let cachedCatalog: RecommendationCatalog | null = null;
let cachedPath: string | null = null;

export function loadRecommendationCatalog(filePath = defaultCatalogPath()): RecommendationCatalog {
  if (cachedCatalog && cachedPath === filePath) {
    return cachedCatalog;
  }
  const raw = readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as RecommendationCatalog;
  if (!data.lastChecked || !Array.isArray(data.toolkits) || !Array.isArray(data.sources)) {
    throw new Error("Invalid recommendation catalog");
  }
  cachedCatalog = data;
  cachedPath = filePath;
  return data;
}

/** Test helper to clear the in-memory catalog cache. */
export function clearRecommendationCatalogCache(): void {
  cachedCatalog = null;
  cachedPath = null;
}

/** Parse "13.5" or "13.5.0" style versions into comparable parts. */
export function parseCudaVersion(raw: string | null | undefined): number[] | null {
  if (raw == null || raw.trim() === "") return null;
  const m = raw.trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)];
}

export function compareCudaVersions(a: string, b: string): number {
  const pa = parseCudaVersion(a);
  const pb = parseCudaVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function pickRecommendedToolkit(
  driverMaxCuda: string | null,
  catalog: RecommendationCatalog,
): ToolkitCatalogEntry | null {
  const driverParts = parseCudaVersion(driverMaxCuda);
  if (!driverParts || !driverMaxCuda) return null;

  let best: ToolkitCatalogEntry | null = null;
  for (const entry of catalog.toolkits) {
    if (compareCudaVersions(entry.version, driverMaxCuda) <= 0) {
      if (!best || compareCudaVersions(entry.version, best.version) > 0) {
        best = entry;
      }
    }
  }
  return best;
}

export function buildRecommendation(
  driverMaxCuda: string | null,
  toolkit: ToolkitInfo,
  catalog: RecommendationCatalog,
): ToolkitRecommendation {
  const base = {
    lastChecked: catalog.lastChecked,
    downloadsUrl: catalog.downloadsUrl,
    sources: catalog.sources,
  };

  const pick = pickRecommendedToolkit(driverMaxCuda, catalog);
  if (!pick) {
    return {
      ...base,
      status: "unknown",
      recommendedToolkit: null,
      driverBranch: null,
      notes: null,
      message:
        driverMaxCuda == null
          ? "Driver max CUDA is not available yet, so no toolkit version can be recommended."
          : `No catalog entry is at or below driver max CUDA ${driverMaxCuda}. Check the sources and update the data file.`,
    };
  }

  const active = toolkit.active;
  const installedMatch =
    active != null
      ? active
      : toolkit.versions.find((v) => compareCudaVersions(v, pick.version) === 0) ??
        [...toolkit.versions].sort(compareCudaVersions).at(-1) ??
        null;

  if (!toolkit.installed) {
    return {
      ...base,
      status: "install",
      recommendedToolkit: pick.version,
      driverBranch: pick.driverBranch,
      notes: pick.notes,
      message: `Install CUDA Toolkit ${pick.version} (${pick.driverBranch}). Your driver supports up to CUDA ${driverMaxCuda}.`,
    };
  }

  if (active != null && compareCudaVersions(active, driverMaxCuda!) > 0) {
    return {
      ...base,
      status: "newer_than_driver",
      recommendedToolkit: pick.version,
      driverBranch: pick.driverBranch,
      notes: pick.notes,
      message: `Active nvcc ${active} is newer than driver max CUDA ${driverMaxCuda}. Prefer toolkit ${pick.version}, or update the driver.`,
    };
  }

  if (active != null && compareCudaVersions(active, pick.version) === 0) {
    return {
      ...base,
      status: "current",
      recommendedToolkit: pick.version,
      driverBranch: pick.driverBranch,
      notes: pick.notes,
      message: `Active nvcc ${active} matches the recommended toolkit for driver max CUDA ${driverMaxCuda}.`,
    };
  }

  if (active != null && compareCudaVersions(active, pick.version) < 0) {
    return {
      ...base,
      status: "upgrade",
      recommendedToolkit: pick.version,
      driverBranch: pick.driverBranch,
      notes: pick.notes,
      message: `Active nvcc ${active} is older than recommended ${pick.version} for driver max CUDA ${driverMaxCuda}.`,
    };
  }

  if (installedMatch != null && compareCudaVersions(installedMatch, pick.version) === 0) {
    return {
      ...base,
      status: "current",
      recommendedToolkit: pick.version,
      driverBranch: pick.driverBranch,
      notes: pick.notes,
      message: `CUDA Toolkit ${pick.version} is installed. Point PATH or NVCC_PATH at it if nvcc is not active.`,
    };
  }

  if (installedMatch != null && compareCudaVersions(installedMatch, pick.version) < 0) {
    return {
      ...base,
      status: "upgrade",
      recommendedToolkit: pick.version,
      driverBranch: pick.driverBranch,
      notes: pick.notes,
      message: `Installed toolkit ${installedMatch} is older than recommended ${pick.version} for driver max CUDA ${driverMaxCuda}.`,
    };
  }

  return {
    ...base,
    status: "install",
    recommendedToolkit: pick.version,
    driverBranch: pick.driverBranch,
    notes: pick.notes,
    message: `Toolkit detected, but not ${pick.version}. Recommended: CUDA Toolkit ${pick.version} (${pick.driverBranch}).`,
  };
}
