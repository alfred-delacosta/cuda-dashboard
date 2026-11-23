/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { accessSync, constants } from "node:fs";
import path from "node:path";
import type { BinaryResolution, NvccSource, PlatformKind, SmiSource } from "./types.js";

export interface FsLike {
  exists(filePath: string): boolean;
}

export const realFs: FsLike = {
  exists(filePath: string): boolean {
    try {
      accessSync(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  },
};

function isAbsolutePath(p: string): boolean {
  return path.isAbsolute(p);
}

function basenameOk(filePath: string, expected: "nvidia-smi" | "nvcc"): boolean {
  const base = path.basename(filePath).toLowerCase();
  if (process.platform === "win32" || expected === "nvidia-smi") {
    if (expected === "nvidia-smi") {
      return base === "nvidia-smi" || base === "nvidia-smi.exe";
    }
  }
  return base === "nvcc" || base === "nvcc.exe";
}

function validateOverride(
  override: string | undefined,
  expected: "nvidia-smi" | "nvcc",
  fs: FsLike,
): string | null {
  if (!override || !override.trim()) return null;
  const p = override.trim();
  if (!isAbsolutePath(p)) return null;
  if (!basenameOk(p, expected)) return null;
  if (!fs.exists(p)) return null;
  return p;
}

function pathDirs(env: NodeJS.ProcessEnv): string[] {
  const raw = env.PATH ?? env.Path ?? "";
  return raw.split(path.delimiter).filter(Boolean);
}

function smiNames(platform: PlatformKind): string[] {
  if (platform === "windows") return ["nvidia-smi.exe", "nvidia-smi"];
  return ["nvidia-smi"];
}

function nvccNames(platform: PlatformKind): string[] {
  if (platform === "windows") return ["nvcc.exe", "nvcc"];
  return ["nvcc"];
}

export function resolveNvidiaSmi(
  platform: PlatformKind,
  env: NodeJS.ProcessEnv = process.env,
  fs: FsLike = realFs,
): BinaryResolution {
  const override = validateOverride(env.NVIDIA_SMI_PATH, "nvidia-smi", fs);
  if (override) {
    return { found: true, path: override, source: "override" };
  }

  const names = smiNames(platform);
  const candidates: { file: string; source: SmiSource }[] = [];

  if (platform === "windows") {
    const systemRoot = env.SystemRoot || env.SYSTEMROOT || "C:\\Windows";
    const programFiles = env.ProgramFiles || env.PROGRAMFILES || "C:\\Program Files";
    for (const name of names) {
      candidates.push({
        file: path.join(systemRoot, "System32", name),
        source: "System32",
      });
      candidates.push({
        file: path.join(programFiles, "NVIDIA Corporation", "NVSMI", name),
        source: "NVSMI",
      });
    }
  }

  if (platform === "wsl" || platform === "linux") {
    for (const name of names) {
      candidates.push({ file: `/usr/lib/wsl/lib/${name}`, source: "WSL" });
      candidates.push({ file: `/usr/bin/${name}`, source: "PATH" });
    }
  }

  for (const dir of pathDirs(env)) {
    for (const name of names) {
      candidates.push({ file: path.join(dir, name), source: "PATH" });
    }
  }

  for (const c of candidates) {
    if (fs.exists(c.file)) {
      return { found: true, path: c.file, source: c.source };
    }
  }

  return { found: false, path: null, source: "notFound" };
}

export function resolveNvcc(
  platform: PlatformKind,
  env: NodeJS.ProcessEnv = process.env,
  fs: FsLike = realFs,
): BinaryResolution {
  const override = validateOverride(env.NVCC_PATH, "nvcc", fs);
  if (override) {
    return { found: true, path: override, source: "override" };
  }

  const names = nvccNames(platform);
  const candidates: { file: string; source: NvccSource }[] = [];

  const cudaPath = env.CUDA_PATH;
  if (cudaPath) {
    for (const name of names) {
      candidates.push({
        file: path.join(cudaPath, "bin", name),
        source: "CUDA_PATH",
      });
    }
  }

  for (const dir of pathDirs(env)) {
    for (const name of names) {
      candidates.push({ file: path.join(dir, name), source: "PATH" });
    }
  }

  if (platform !== "windows") {
    for (const name of names) {
      candidates.push({ file: `/usr/local/cuda/bin/${name}`, source: "local" });
    }
  }

  for (const c of candidates) {
    if (fs.exists(c.file)) {
      return { found: true, path: c.file, source: c.source };
    }
  }

  return { found: false, path: null, source: "notFound" };
}
