/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { detectPlatform } from "../../core/platform.js";
import { resolveNvidiaSmi, resolveNvcc } from "../../core/binaries.js";
import { CommandRunner } from "../../core/runner.js";
import { parseGpuQueryCsv } from "../../core/parsers/csv.js";
import { parseSmiXml } from "../../core/parsers/xml.js";
import { parseAppsCsv } from "../../core/parsers/apps.js";
import { parseNvccVersion } from "../../core/parsers/nvcc.js";
import { detectToolkit } from "../../core/toolkit.js";
import { maybeRedact, redactUuidValue } from "../../core/redact.js";
import type { AppConfig } from "../../core/config.js";
import type { ComputeApp, GpuMetrics, ToolkitInfo } from "../../core/types.js";
import { logCommand } from "../log.js";

export const DRIVER_CUDA_EXPLANATION =
  "This is the newest CUDA version your installed driver can support. It is not the CUDA toolkit installed on this machine.";

export class NvidiaService {
  readonly platform = detectPlatform();
  readonly smi;
  readonly nvcc;
  readonly runner: CommandRunner;
  private readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    const env = {
      ...process.env,
      ...(config.nvidiaSmiPath ? { NVIDIA_SMI_PATH: config.nvidiaSmiPath } : {}),
      ...(config.nvccPath ? { NVCC_PATH: config.nvccPath } : {}),
    };
    this.smi = resolveNvidiaSmi(this.platform, env);
    this.nvcc = resolveNvcc(this.platform, env);
    this.runner = new CommandRunner({
      timeoutMs: config.commandTimeoutMs,
      smi: this.smi,
      nvcc: this.nvcc,
    });
  }

  async getDriverMeta(): Promise<{
    driverVersion: string | null;
    driverMaxCuda: string | null;
  }> {
    const xml = await this.runner.run("smi.xml");
    logCommand("smi.xml", xml.durationMs, xml.status);
    if (xml.status !== "ok") {
      const query = await this.runner.run("smi.query");
      logCommand("smi.query", query.durationMs, query.status);
      if (query.status === "ok") {
        const gpus = parseGpuQueryCsv(query.stdout);
        return {
          driverVersion: gpus[0]?.driverVersion ?? null,
          driverMaxCuda: null,
        };
      }
      return { driverVersion: null, driverMaxCuda: null };
    }
    const parsed = parseSmiXml(xml.stdout);
    return {
      driverVersion: parsed.driverVersion,
      driverMaxCuda: parsed.cudaVersion,
    };
  }

  async getGpus(): Promise<GpuMetrics[]> {
    const result = await this.runner.run("smi.query");
    logCommand("smi.query", result.durationMs, result.status);
    if (result.status !== "ok") return [];
    const gpus = parseGpuQueryCsv(result.stdout);
    return gpus.map((g) => ({
      ...g,
      uuid: redactUuidValue(g.uuid, this.config.showIdentifiers),
    }));
  }

  async getProcesses(): Promise<{
    apps: ComputeApp[];
    pidCount: number;
    totalMemoryMiB: number | null;
  }> {
    const result = await this.runner.run("smi.apps");
    logCommand("smi.apps", result.durationMs, result.status);
    if (result.status !== "ok") {
      return { apps: [], pidCount: 0, totalMemoryMiB: null };
    }
    const apps = parseAppsCsv(result.stdout, {
      showProcessNames: this.config.showProcessNames,
      showIdentifiers: this.config.showIdentifiers,
    });
    const total = apps.reduce((sum, a) => sum + (a.usedMemoryMiB ?? 0), 0);
    return {
      apps,
      pidCount: apps.length,
      totalMemoryMiB: apps.length ? total : null,
    };
  }

  async getToolkit(): Promise<ToolkitInfo> {
    const result = await this.runner.run("nvcc.version");
    logCommand("nvcc.version", result.durationMs, result.status);
    const active = result.status === "ok" ? parseNvccVersion(result.stdout) : null;
    return detectToolkit(this.platform, process.env, {
      runNvccVersion: async () => active,
    });
  }

  async getRaw(id: string) {
    const result = await this.runner.run(id);
    logCommand(id, result.durationMs, result.status);
    const output = maybeRedact(
      [result.stdout, result.stderr].filter(Boolean).join("\n"),
      this.config.showIdentifiers,
    );
    return { result, output };
  }
}
