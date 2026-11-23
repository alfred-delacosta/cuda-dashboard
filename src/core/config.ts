/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface AppConfig {
  port: number;
  host: string;
  appHostname: string;
  allowedCidrs: string[];
  refreshMs: number;
  commandTimeoutMs: number;
  maxSseClients: number;
  nvidiaSmiPath: string | undefined;
  nvccPath: string | undefined;
  showProcessNames: boolean;
  showIdentifiers: boolean;
}

const DEFAULT_CIDRS = [
  "127.0.0.0/8",
  "::1",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "fc00::/7",
  "fe80::/10",
];

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw === "") return fallback;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return fallback;
}

function parseIntMin(raw: string | undefined, fallback: number, min: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, n);
}

export function loadEnvFileIfPresent(cwd = process.cwd()): void {
  const envPath = path.join(cwd, ".env");
  if (!existsSync(envPath)) return;
  // Node 26: loadEnvFile does not override existing process.env keys.
  process.loadEnvFile(envPath);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const allowedCidrs =
    env.ALLOWED_CIDRS && env.ALLOWED_CIDRS.trim()
      ? env.ALLOWED_CIDRS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : DEFAULT_CIDRS;

  const appHostname =
    env.APP_HOSTNAME && env.APP_HOSTNAME.trim() ? env.APP_HOSTNAME.trim() : os.hostname();

  return {
    port: parseIntMin(env.PORT, 3000, 1),
    host: env.HOST && env.HOST.trim() ? env.HOST.trim() : "0.0.0.0",
    appHostname,
    allowedCidrs,
    refreshMs: parseIntMin(env.REFRESH_MS, 2000, 1000),
    commandTimeoutMs: parseIntMin(env.COMMAND_TIMEOUT_MS, 5000, 100),
    maxSseClients: parseIntMin(env.MAX_SSE_CLIENTS, 10, 1),
    nvidiaSmiPath: env.NVIDIA_SMI_PATH?.trim() || undefined,
    nvccPath: env.NVCC_PATH?.trim() || undefined,
    showProcessNames: parseBool(env.SHOW_PROCESS_NAMES, false),
    showIdentifiers: parseBool(env.SHOW_IDENTIFIERS, false),
  };
}

export { DEFAULT_CIDRS };
