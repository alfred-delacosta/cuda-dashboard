/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { describe, expect, it, vi } from "vitest";
import { CommandRunner } from "../src/core/runner.js";
import type { BinaryResolution } from "../src/core/types.js";

const smiOk: BinaryResolution = {
  found: true,
  path: "C:\\fake\\nvidia-smi.exe",
  source: "System32",
};
const nvccMissing: BinaryResolution = {
  found: false,
  path: null,
  source: "notFound",
};

describe("CommandRunner", () => {
  it("maps missing binary to notFound", async () => {
    const runner = new CommandRunner({
      timeoutMs: 1000,
      smi: { found: false, path: null, source: "notFound" },
      nvcc: nvccMissing,
    });
    const r = await runner.run("smi.summary");
    expect(r.status).toBe("notFound");
  });

  it("maps ENOENT to notFound", async () => {
    const exec = vi.fn().mockRejectedValue(Object.assign(new Error("nope"), { code: "ENOENT" }));
    const runner = new CommandRunner({
      timeoutMs: 1000,
      smi: smiOk,
      nvcc: nvccMissing,
      exec,
    });
    const r = await runner.run("smi.list");
    expect(r.status).toBe("notFound");
  });

  it("maps timeout to timedOut", async () => {
    const exec = vi.fn().mockRejectedValue(
      Object.assign(new Error("timeout"), { killed: true, signal: "SIGTERM" }),
    );
    const runner = new CommandRunner({
      timeoutMs: 1000,
      smi: smiOk,
      nvcc: nvccMissing,
      exec,
    });
    const r = await runner.run("smi.topo");
    expect(r.status).toBe("timedOut");
  });

  it("maps nonzero exit to error", async () => {
    const exec = vi.fn().mockRejectedValue(
      Object.assign(new Error("fail"), {
        code: 1,
        stderr: "not supported\nmore",
        stdout: "",
      }),
    );
    const runner = new CommandRunner({
      timeoutMs: 1000,
      smi: smiOk,
      nvcc: nvccMissing,
      exec,
    });
    const r = await runner.run("smi.topo");
    expect(r.status).toBe("error");
    expect(r.exitCode).toBe(1);
    expect(r.message).toBe("not supported");
  });

  it("passes fixed argument arrays only", async () => {
    const exec = vi.fn().mockResolvedValue({ stdout: "ok", stderr: "" });
    const runner = new CommandRunner({
      timeoutMs: 1000,
      smi: smiOk,
      nvcc: nvccMissing,
      exec,
    });
    await runner.run("smi.list");
    expect(exec).toHaveBeenCalledWith(
      smiOk.path,
      ["-L"],
      expect.objectContaining({ shell: false, windowsHide: true }),
    );
  });
});
