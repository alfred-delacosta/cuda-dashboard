/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/server/app.js";
import type { AppConfig } from "../src/core/config.js";
import { CommandRunner } from "../src/core/runner.js";

const baseConfig: AppConfig = {
  port: 3000,
  host: "127.0.0.1",
  appHostname: "localhost",
  allowedCidrs: [
    "127.0.0.0/8",
    "::1",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "fc00::/7",
    "fe80::/10",
  ],
  refreshMs: 1000,
  commandTimeoutMs: 1000,
  maxSseClients: 10,
  nvidiaSmiPath: undefined,
  nvccPath: undefined,
  showProcessNames: false,
  showIdentifiers: false,
};

describe("API", () => {
  let app: FastifyInstance;
  let logs: string[] = [];
  const originalInfo = console.info;

  beforeAll(async () => {
    logs = [];
    console.info = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    // Force runner to not spawn real binaries: patch after build via missing paths
    const { app: built } = await buildApp({
      ...baseConfig,
      nvidiaSmiPath: "C:\\missing\\nvidia-smi.exe",
      nvccPath: "C:\\missing\\nvcc.exe",
    });
    app = built;
    await app.ready();
  });

  afterAll(async () => {
    console.info = originalInfo;
    await app.close();
  });

  it("GET /api/health", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
      headers: { host: "localhost:3000" },
      remoteAddress: "127.0.0.1",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("unknown raw id returns 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/raw/smi.hack",
      headers: { host: "localhost:3000" },
      remoteAddress: "127.0.0.1",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("not_found");
  });

  it("foreign Host returns 421", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
      headers: { host: "evil.example" },
      remoteAddress: "127.0.0.1",
    });
    expect(res.statusCode).toBe(421);
  });

  it("non-private IP returns 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
      headers: { host: "localhost:3000" },
      remoteAddress: "8.8.8.8",
    });
    expect(res.statusCode).toBe(403);
  });

  it("does not log command output", async () => {
    await app.inject({
      method: "GET",
      url: "/api/raw/smi.list",
      headers: { host: "localhost:3000" },
      remoteAddress: "127.0.0.1",
    });
    const joined = logs.join("\n");
    expect(joined).not.toMatch(/GPU-/);
    expect(joined).not.toMatch(/Fake GeForce/);
  });

  it("rate limits after 60 requests", async () => {
    let last = 200;
    for (let i = 0; i < 61; i++) {
      const res = await app.inject({
        method: "GET",
        url: "/api/health",
        headers: { host: "localhost:3000" },
        remoteAddress: "10.0.0.99",
      });
      last = res.statusCode;
    }
    expect(last).toBe(429);
  });
});

describe("allowlist isolation", () => {
  it("runner never receives user args", async () => {
    const exec = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
    const runner = new CommandRunner({
      timeoutMs: 500,
      smi: { found: true, path: "/fake/nvidia-smi", source: "PATH" },
      nvcc: { found: false, path: null, source: "notFound" },
      exec,
    });
    await runner.run("smi.summary");
    expect(exec.mock.calls[0][1]).toEqual([]);
  });
});
