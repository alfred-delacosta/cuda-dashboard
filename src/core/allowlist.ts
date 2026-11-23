/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import type { AllowlistEntry } from "./types.js";

const QUERY_FIELDS =
  "index,name,uuid,driver_version,compute_cap,pci.bus_id,pstate,temperature.gpu,fan.speed,utilization.gpu,utilization.memory,memory.total,memory.used,memory.free,power.draw,power.limit,clocks.sm,clocks.max.sm";

export const ALLOWLIST: Record<string, AllowlistEntry> = {
  "smi.query": {
    id: "smi.query",
    label: "GPU query (CSV)",
    binary: "nvidia-smi",
    args: [`--query-gpu=${QUERY_FIELDS}`, "--format=csv,noheader,nounits"],
    displayCommand: `nvidia-smi --query-gpu=${QUERY_FIELDS} --format=csv,noheader,nounits`,
  },
  "smi.xml": {
    id: "smi.xml",
    label: "Full query (XML)",
    binary: "nvidia-smi",
    args: ["-q", "-x"],
    displayCommand: "nvidia-smi -q -x",
  },
  "smi.apps": {
    id: "smi.apps",
    label: "Compute apps (CSV)",
    binary: "nvidia-smi",
    args: [
      "--query-compute-apps=gpu_uuid,pid,process_name,used_memory",
      "--format=csv,noheader,nounits",
    ],
    displayCommand:
      "nvidia-smi --query-compute-apps=gpu_uuid,pid,process_name,used_memory --format=csv,noheader,nounits",
  },
  "smi.list": {
    id: "smi.list",
    label: "GPU list",
    binary: "nvidia-smi",
    args: ["-L"],
    displayCommand: "nvidia-smi -L",
  },
  "smi.summary": {
    id: "smi.summary",
    label: "Summary table",
    binary: "nvidia-smi",
    args: [],
    displayCommand: "nvidia-smi",
  },
  "smi.topo": {
    id: "smi.topo",
    label: "Topology matrix",
    binary: "nvidia-smi",
    args: ["topo", "-m"],
    displayCommand: "nvidia-smi topo -m",
  },
  "nvcc.version": {
    id: "nvcc.version",
    label: "nvcc version",
    binary: "nvcc",
    args: ["--version"],
    displayCommand: "nvcc --version",
  },
};

export function getAllowlistEntry(id: string): AllowlistEntry | undefined {
  return ALLOWLIST[id];
}

export function isAllowlistId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(ALLOWLIST, id);
}

export function allowlistIds(): string[] {
  return Object.keys(ALLOWLIST);
}
