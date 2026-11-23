/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseGpuQueryCsv } from "../src/core/parsers/csv.js";
import { parseSmiXml } from "../src/core/parsers/xml.js";
import { parseAppsCsv } from "../src/core/parsers/apps.js";
import { parseNvccVersion } from "../src/core/parsers/nvcc.js";
import { parseGpuList } from "../src/core/parsers/list.js";
import { redactIdentifiers } from "../src/core/redact.js";

const fix = (name: string) =>
  readFileSync(path.join(import.meta.dirname, "fixtures", name), "utf8");

describe("parsers", () => {
  it("parses one GPU CSV", () => {
    const gpus = parseGpuQueryCsv(fix("smi-query-1gpu.csv"));
    expect(gpus).toHaveLength(1);
    expect(gpus[0].name).toBe("Fake GeForce RTX 3060");
    expect(gpus[0].utilizationGpu).toBe(55);
  });

  it("parses two GPUs and maps N/A to null", () => {
    const gpus = parseGpuQueryCsv(fix("smi-query-2gpu.csv"));
    expect(gpus).toHaveLength(2);
    expect(gpus[0].fanSpeed).toBeNull();
    expect(gpus[1].temperatureGpu).toBeNull();
    expect(gpus[1].powerDrawW).toBeNull();
  });

  it("parses XML driver and cuda versions", () => {
    const summary = parseSmiXml(fix("smi.xml"));
    expect(summary.driverVersion).toBe("560.00");
    expect(summary.cudaVersion).toBe("12.6");
    expect(summary.gpuCount).toBe(1);
  });

  it("parses apps CSV with redaction and hidden names by default", () => {
    const apps = parseAppsCsv(fix("smi-apps.csv"), {
      showProcessNames: false,
      showIdentifiers: false,
    });
    expect(apps).toHaveLength(2);
    expect(apps[0].processName).toBeNull();
    expect(apps[0].gpuUuid).toBe("GPU-[REDACTED]");
    expect(apps[0].pid).toBe(1234);
  });

  it("shows basename only when process names enabled", () => {
    const apps = parseAppsCsv(fix("smi-apps.csv"), {
      showProcessNames: true,
      showIdentifiers: true,
    });
    expect(apps[0].processName).toBe("render.exe");
    expect(apps[1].processName).toBe("python3");
  });

  it("parses nvcc Windows and Linux", () => {
    expect(parseNvccVersion(fix("nvcc-windows.txt"))).toBe("12.4");
    expect(parseNvccVersion(fix("nvcc-linux.txt"))).toBe("12.1");
  });

  it("parses smi -L", () => {
    const list = parseGpuList(fix("smi-list.txt"));
    expect(list).toHaveLength(2);
    expect(list[0].index).toBe(0);
    expect(list[0].name).toContain("Fake");
  });

  it("redacts identifiers in raw text by default", () => {
    const raw = fix("smi.xml");
    const redacted = redactIdentifiers(raw);
    expect(redacted).not.toMatch(/GPU-11111111/);
    expect(redacted).toContain("GPU-[REDACTED]");
    expect(redacted).not.toContain("SERIAL-FAKE-001");
    expect(redacted).toContain("<serial>[REDACTED]</serial>");
  });
});
