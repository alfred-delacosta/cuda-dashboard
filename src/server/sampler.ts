/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import type { NvidiaService } from "./services/nvidia.js";
import type { ComputeApp, GpuMetrics } from "../core/types.js";

export interface SamplePayload {
  gpus: GpuMetrics[];
  processes: {
    apps: ComputeApp[];
    pidCount: number;
    totalMemoryMiB: number | null;
  };
  at: string;
}

type Listener = (payload: SamplePayload) => void;

export class SharedSampler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly listeners = new Set<Listener>();
  private last: SamplePayload | null = null;
  private sampling = false;

  constructor(
    private readonly service: NvidiaService,
    private readonly refreshMs: number,
  ) {}

  get clientCount(): number {
    return this.listeners.size;
  }

  getLast(): SamplePayload | null {
    return this.last;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.ensureRunning();
    if (this.last) listener(this.last);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  /** Test helper: force stop without clients. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.timer != null;
  }

  private ensureRunning(): void {
    if (this.timer) return;
    void this.tick();
    this.timer = setInterval(() => {
      void this.tick();
    }, this.refreshMs);
    // Allow process to exit in tests if only sampler remains.
    if (typeof this.timer === "object" && "unref" in this.timer) {
      this.timer.unref();
    }
  }

  private async tick(): Promise<void> {
    if (this.sampling || this.listeners.size === 0) return;
    this.sampling = true;
    try {
      const [gpus, processes] = await Promise.all([
        this.service.getGpus(),
        this.service.getProcesses(),
      ]);
      const payload: SamplePayload = {
        gpus,
        processes,
        at: new Date().toISOString(),
      };
      this.last = payload;
      for (const listener of this.listeners) {
        listener(payload);
      }
    } finally {
      this.sampling = false;
    }
  }
}
