/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/core/config.js";

describe("config", () => {
  it("defaults PORT HOST and APP_HOSTNAME", () => {
    const cfg = loadConfig({
      PORT: undefined,
      HOST: undefined,
      APP_HOSTNAME: undefined,
    } as NodeJS.ProcessEnv);
    expect(cfg.port).toBe(3000);
    expect(cfg.host).toBe("0.0.0.0");
    expect(cfg.appHostname.length).toBeGreaterThan(0);
  });

  it("reads PORT from env", () => {
    const cfg = loadConfig({ PORT: "4000" } as NodeJS.ProcessEnv);
    expect(cfg.port).toBe(4000);
  });

  it("enforces REFRESH_MS minimum 1000", () => {
    const cfg = loadConfig({ REFRESH_MS: "100" } as NodeJS.ProcessEnv);
    expect(cfg.refreshMs).toBe(1000);
  });

  it("defaults privacy flags to false", () => {
    const cfg = loadConfig({} as NodeJS.ProcessEnv);
    expect(cfg.showIdentifiers).toBe(false);
    expect(cfg.showProcessNames).toBe(false);
  });
});
