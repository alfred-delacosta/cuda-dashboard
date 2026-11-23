/**
 * Copyright Advanced Software and AI Solutions LLC
 */

export interface SystemInfo {
  platform: "windows" | "wsl" | "linux";
  appHostname: string;
  port: number;
  smi: { found: boolean; source: string };
  driverVersion: string | null;
  driverMaxCuda: string | null;
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

export interface ToolkitRecommendation {
  status: "install" | "current" | "upgrade" | "newer_than_driver" | "unknown";
  recommendedToolkit: string | null;
  driverBranch: string | null;
  notes: string | null;
  message: string;
  lastChecked: string;
  downloadsUrl: string;
  sources: Array<{ title: string; url: string }>;
}

export interface CudaInfo {
  driverMaxCuda: string | null;
  toolkit: {
    installed: boolean;
    versions: string[];
    active: string | null;
    source: string;
  };
  explanation: string;
  recommendation: ToolkitRecommendation;
}

export interface ProcessesInfo {
  apps: Array<{
    gpuUuid: string | null;
    pid: number | null;
    processName: string | null;
    usedMemoryMiB: number | null;
  }>;
  pidCount: number;
  totalMemoryMiB: number | null;
}

export interface SamplePayload {
  gpus: GpuMetrics[];
  processes: ProcessesInfo;
  at: string;
}

export interface RawResult {
  id: string;
  label: string;
  displayCommand: string;
  output: string;
  exitCode: number | null;
  durationMs: number;
  status?: string;
  message?: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message ?? res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function fetchSystem() {
  return getJson<SystemInfo>("/api/system");
}

export function fetchCuda() {
  return getJson<CudaInfo>("/api/cuda");
}

export function fetchRaw(id: string) {
  return getJson<RawResult>(`/api/raw/${id}`);
}

export function fetchRawIds() {
  return getJson<{ ids: string[] }>("/api/raw");
}
