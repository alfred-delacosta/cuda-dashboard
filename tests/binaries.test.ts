/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveNvidiaSmi, resolveNvcc, type FsLike } from "../src/core/binaries.js";

function mockFs(existing: string[]): FsLike {
  const set = new Set(existing.map((p) => path.normalize(p)));
  return {
    exists(filePath: string) {
      return set.has(path.normalize(filePath));
    },
  };
}

describe("binary resolution", () => {
  it("resolves System32 on Windows", () => {
    const systemRoot = "C:\\Windows";
    const file = path.join(systemRoot, "System32", "nvidia-smi.exe");
    const r = resolveNvidiaSmi(
      "windows",
      { SystemRoot: systemRoot, PATH: "" },
      mockFs([file]),
    );
    expect(r.found).toBe(true);
    expect(r.source).toBe("System32");
  });

  it("resolves NVSMI when System32 missing", () => {
    const programFiles = "C:\\Program Files";
    const file = path.join(programFiles, "NVIDIA Corporation", "NVSMI", "nvidia-smi.exe");
    const r = resolveNvidiaSmi(
      "windows",
      { SystemRoot: "C:\\Windows", ProgramFiles: programFiles, PATH: "" },
      mockFs([file]),
    );
    expect(r.found).toBe(true);
    expect(r.source).toBe("NVSMI");
  });

  it("resolves WSL path", () => {
    const file = "/usr/lib/wsl/lib/nvidia-smi";
    const r = resolveNvidiaSmi("wsl", { PATH: "" }, mockFs([file]));
    expect(r.found).toBe(true);
    expect(r.source).toBe("WSL");
  });

  it("resolves nvcc from CUDA_PATH", () => {
    const cuda = "C:\\CUDA";
    const file = path.join(cuda, "bin", "nvcc.exe");
    const r = resolveNvcc("windows", { CUDA_PATH: cuda, PATH: "" }, mockFs([file]));
    expect(r.found).toBe(true);
    expect(r.source).toBe("CUDA_PATH");
  });

  it("rejects non-absolute override", () => {
    const r = resolveNvidiaSmi(
      "windows",
      { NVIDIA_SMI_PATH: "nvidia-smi.exe", PATH: "" },
      mockFs(["nvidia-smi.exe"]),
    );
    expect(r.found).toBe(false);
  });

  it("accepts absolute override with correct basename", () => {
    const file = "C:\\tools\\nvidia-smi.exe";
    const r = resolveNvidiaSmi(
      "windows",
      { NVIDIA_SMI_PATH: file, PATH: "" },
      mockFs([file]),
    );
    expect(r.found).toBe(true);
    expect(r.source).toBe("override");
  });
});
