/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { describe, expect, it, vi } from "vitest";
import { SharedSampler } from "../src/server/sampler.js";
import type { NvidiaService } from "../src/server/services/nvidia.js";

describe("SharedSampler", () => {
  it("stops when no clients remain", async () => {
    const service = {
      getGpus: vi.fn().mockResolvedValue([]),
      getProcesses: vi.fn().mockResolvedValue({
        apps: [],
        pidCount: 0,
        totalMemoryMiB: null,
      }),
    } as unknown as NvidiaService;

    const sampler = new SharedSampler(service, 50);
    const unsub = sampler.subscribe(() => undefined);
    expect(sampler.isRunning()).toBe(true);
    unsub();
    expect(sampler.clientCount).toBe(0);
    expect(sampler.isRunning()).toBe(false);
  });
});
