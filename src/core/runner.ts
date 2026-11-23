/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getAllowlistEntry } from "./allowlist.js";
import type { BinaryResolution, RunnerResult } from "./types.js";

const execFileAsync = promisify(execFile);

const CACHE_TTL_MS = 1000;
const MAX_BUFFER = 2 * 1024 * 1024;

export interface RunnerOptions {
  timeoutMs: number;
  smi: BinaryResolution;
  nvcc: BinaryResolution;
  exec?: typeof execFileAsync;
  now?: () => number;
}

interface CacheEntry {
  at: number;
  result: RunnerResult;
}

export class CommandRunner {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inflight = new Map<string, Promise<RunnerResult>>();
  private readonly opts: RunnerOptions;

  constructor(opts: RunnerOptions) {
    this.opts = opts;
  }

  clearCache(): void {
    this.cache.clear();
  }

  async run(id: string): Promise<RunnerResult> {
    const entry = getAllowlistEntry(id);
    if (!entry) {
      return {
        id,
        status: "error",
        stdout: "",
        stderr: "",
        exitCode: null,
        durationMs: 0,
        message: "Unknown command id",
      };
    }

    const now = (this.opts.now ?? Date.now)();
    const cached = this.cache.get(id);
    if (cached && now - cached.at < CACHE_TTL_MS) {
      return cached.result;
    }

    const existing = this.inflight.get(id);
    if (existing) return existing;

    const promise = this.execute(id, entry.binary, [...entry.args]).finally(() => {
      this.inflight.delete(id);
    });
    this.inflight.set(id, promise);
    const result = await promise;
    this.cache.set(id, { at: (this.opts.now ?? Date.now)(), result });
    return result;
  }

  private async execute(
    id: string,
    binary: "nvidia-smi" | "nvcc",
    args: string[],
  ): Promise<RunnerResult> {
    const resolution = binary === "nvidia-smi" ? this.opts.smi : this.opts.nvcc;
    const start = (this.opts.now ?? Date.now)();

    if (!resolution.found || !resolution.path) {
      return {
        id,
        status: "notFound",
        stdout: "",
        stderr: "",
        exitCode: null,
        durationMs: 0,
        message: `${binary} not found`,
      };
    }

    const exec = this.opts.exec ?? execFileAsync;

    try {
      const { stdout, stderr } = await exec(resolution.path, args, {
        encoding: "utf8",
        timeout: this.opts.timeoutMs,
        maxBuffer: MAX_BUFFER,
        windowsHide: true,
        shell: false,
      });
      const durationMs = (this.opts.now ?? Date.now)() - start;
      return {
        id,
        status: "ok",
        stdout: typeof stdout === "string" ? stdout : String(stdout),
        stderr: typeof stderr === "string" ? stderr : String(stderr),
        exitCode: 0,
        durationMs,
      };
    } catch (err: unknown) {
      const durationMs = (this.opts.now ?? Date.now)() - start;
      const e = err as NodeJS.ErrnoException & {
        killed?: boolean;
        code?: string | number;
        stdout?: string;
        stderr?: string;
        signal?: string;
      };

      if (e.code === "ENOENT") {
        return {
          id,
          status: "notFound",
          stdout: "",
          stderr: "",
          exitCode: null,
          durationMs,
          message: `${binary} not found`,
        };
      }

      if (e.killed || e.signal === "SIGTERM" || e.code === "ETIMEDOUT") {
        return {
          id,
          status: "timedOut",
          stdout: e.stdout ?? "",
          stderr: e.stderr ?? "",
          exitCode: null,
          durationMs,
          message: "Command timed out",
        };
      }

      const exitCode = typeof e.code === "number" ? e.code : null;
      const short =
        (e.stderr || e.message || "Command failed").toString().split(/\r?\n/)[0]?.slice(0, 200) ??
        "Command failed";

      return {
        id,
        status: "error",
        stdout: e.stdout ?? "",
        stderr: e.stderr ?? "",
        exitCode,
        durationMs,
        message: short,
      };
    }
  }
}
