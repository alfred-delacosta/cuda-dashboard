/**
 * Copyright Advanced Software and AI Solutions LLC
 */

export type PlatformKind = "windows" | "wsl" | "linux";

export type SmiSource = "override" | "System32" | "NVSMI" | "WSL" | "PATH" | "notFound";

export type NvccSource = "override" | "CUDA_PATH" | "PATH" | "local" | "notFound";

export interface BinaryResolution {
  found: boolean;
  path: string | null;
  source: SmiSource | NvccSource;
}

export interface ToolkitInfo {
  installed: boolean;
  versions: string[];
  active: string | null;
  source: NvccSource;
}

export interface GpuMetrics {
  index: number | null;
  name: string | null;
  uuid: string | null;
  driverVersion: string | null;
  computeCap: string | null;
  pciBusId: string | null;
  pstate: string | null;
  temperatureGpu: number | null;
  fanSpeed: number | null;
  utilizationGpu: number | null;
  utilizationMemory: number | null;
  memoryTotalMiB: number | null;
  memoryUsedMiB: number | null;
  memoryFreeMiB: number | null;
  powerDrawW: number | null;
  powerLimitW: number | null;
  clocksSm: number | null;
  clocksMaxSm: number | null;
}

export interface ComputeApp {
  gpuUuid: string | null;
  pid: number | null;
  processName: string | null;
  usedMemoryMiB: number | null;
}

export type RunnerStatus = "ok" | "notFound" | "timedOut" | "error";

export interface RunnerResult {
  id: string;
  status: RunnerStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  message?: string;
}

export interface AllowlistEntry {
  id: string;
  label: string;
  binary: "nvidia-smi" | "nvcc";
  args: readonly string[];
  displayCommand: string;
}
