/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import { resolveNvcc, type FsLike, realFs } from "./binaries.js";
import { parseNvccVersion } from "./parsers/nvcc.js";
import type { NvccSource, PlatformKind, ToolkitInfo } from "./types.js";

export interface ToolkitDeps {
  fs: FsLike;
  listDir: (dir: string) => string[];
  runNvccVersion: () => Promise<string | null>;
}

function defaultListDir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function scanWindowsVersions(env: NodeJS.ProcessEnv, listDir: (d: string) => string[]): string[] {
  const programFiles = env.ProgramFiles || env.PROGRAMFILES || "C:\\Program Files";
  const root = path.join(programFiles, "NVIDIA GPU Computing Toolkit", "CUDA");
  const entries = listDir(root);
  const versions: string[] = [];
  for (const e of entries) {
    const m = e.match(/^v(\d+\.\d+)$/i);
    if (m) versions.push(m[1]);
  }
  return versions.sort();
}

function scanLinuxVersions(listDir: (d: string) => string[]): string[] {
  const parent = "/usr/local";
  const entries = listDir(parent);
  const versions: string[] = [];
  for (const e of entries) {
    const m = e.match(/^cuda-(\d+\.\d+)$/i);
    if (m) versions.push(m[1]);
  }
  return versions.sort();
}

export async function detectToolkit(
  platform: PlatformKind,
  env: NodeJS.ProcessEnv = process.env,
  deps: Partial<ToolkitDeps> = {},
): Promise<ToolkitInfo> {
  const fs = deps.fs ?? realFs;
  const listDir = deps.listDir ?? defaultListDir;
  const resolution = resolveNvcc(platform, env, fs);

  let active: string | null = null;
  if (deps.runNvccVersion) {
    active = await deps.runNvccVersion();
  }

  const versions =
    platform === "windows" ? scanWindowsVersions(env, listDir) : scanLinuxVersions(listDir);

  const source = resolution.source as NvccSource;
  const installed = resolution.found || versions.length > 0;

  return {
    installed,
    versions: versions.length ? versions : active ? [active] : [],
    active,
    source: resolution.found ? source : versions.length ? "local" : "notFound",
  };
}

export { parseNvccVersion };
