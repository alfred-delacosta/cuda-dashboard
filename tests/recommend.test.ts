/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildRecommendation,
  compareCudaVersions,
  loadRecommendationCatalog,
  pickRecommendedToolkit,
} from "../src/core/recommend.js";
import type { ToolkitInfo } from "../src/core/types.js";

const catalog = loadRecommendationCatalog(
  path.join(import.meta.dirname, "../src/core/data/cuda-recommendations.json"),
);

const emptyToolkit: ToolkitInfo = {
  installed: false,
  versions: [],
  active: null,
  source: "notFound",
};

describe("recommend", () => {
  it("compares CUDA versions", () => {
    expect(compareCudaVersions("13.5", "13.4")).toBeGreaterThan(0);
    expect(compareCudaVersions("12.9", "13.0")).toBeLessThan(0);
    expect(compareCudaVersions("12.6", "12.6.0")).toBe(0);
  });

  it("picks highest toolkit at or below driver max CUDA", () => {
    const pick = pickRecommendedToolkit("13.5", catalog);
    expect(pick?.version).toBe("13.5");
    expect(pickRecommendedToolkit("12.6", catalog)?.version).toBe("12.6");
    expect(pickRecommendedToolkit("12.7", catalog)?.version).toBe("12.6");
  });

  it("recommends install when no toolkit", () => {
    const rec = buildRecommendation("13.5", emptyToolkit, catalog);
    expect(rec.status).toBe("install");
    expect(rec.recommendedToolkit).toBe("13.5");
    expect(rec.lastChecked).toBe(catalog.lastChecked);
    expect(rec.sources.length).toBeGreaterThan(0);
    expect(rec.message).toContain("Install CUDA Toolkit 13.5");
  });

  it("marks current when active matches", () => {
    const toolkit: ToolkitInfo = {
      installed: true,
      versions: ["13.5"],
      active: "13.5",
      source: "PATH",
    };
    const rec = buildRecommendation("13.5", toolkit, catalog);
    expect(rec.status).toBe("current");
  });

  it("marks upgrade when active is older", () => {
    const toolkit: ToolkitInfo = {
      installed: true,
      versions: ["12.6"],
      active: "12.6",
      source: "PATH",
    };
    const rec = buildRecommendation("13.5", toolkit, catalog);
    expect(rec.status).toBe("upgrade");
    expect(rec.recommendedToolkit).toBe("13.5");
  });

  it("warns when active is newer than driver max", () => {
    const toolkit: ToolkitInfo = {
      installed: true,
      versions: ["13.5"],
      active: "13.5",
      source: "PATH",
    };
    const rec = buildRecommendation("12.6", toolkit, catalog);
    expect(rec.status).toBe("newer_than_driver");
    expect(rec.recommendedToolkit).toBe("12.6");
  });

  it("handles unknown driver max", () => {
    const rec = buildRecommendation(null, emptyToolkit, catalog);
    expect(rec.status).toBe("unknown");
    expect(rec.recommendedToolkit).toBeNull();
  });

  it("catalog includes lastChecked and sources", () => {
    expect(catalog.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(catalog.sources.every((s) => s.title && s.url.startsWith("http"))).toBe(true);
  });
});
