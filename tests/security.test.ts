/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { describe, expect, it } from "vitest";
import { createCidrBlockList, isIpAllowed } from "../src/server/security/cidr.js";
import { isHostAllowed } from "../src/server/security/host.js";
import { DEFAULT_CIDRS } from "../src/core/config.js";

describe("CIDR allowlist", () => {
  const list = createCidrBlockList(DEFAULT_CIDRS);

  it("allows loopback and private", () => {
    expect(isIpAllowed(list, "127.0.0.1")).toBe(true);
    expect(isIpAllowed(list, "192.168.1.50")).toBe(true);
    expect(isIpAllowed(list, "10.0.0.2")).toBe(true);
    expect(isIpAllowed(list, "::1")).toBe(true);
    expect(isIpAllowed(list, "::ffff:192.168.0.5")).toBe(true);
  });

  it("denies public addresses", () => {
    expect(isIpAllowed(list, "8.8.8.8")).toBe(false);
    expect(isIpAllowed(list, "1.1.1.1")).toBe(false);
  });
});

describe("Host header", () => {
  it("allows app hostname and localhost", () => {
    expect(
      isHostAllowed("dell-aio.local:3000", "dell-aio.local", "supermicro", new Set(["127.0.0.1"])),
    ).toBe(true);
    expect(
      isHostAllowed("localhost:3000", "dell-aio.local", "supermicro", new Set(["127.0.0.1"])),
    ).toBe(true);
  });

  it("rejects foreign hosts", () => {
    expect(
      isHostAllowed("evil.example:3000", "dell-aio.local", "supermicro", new Set(["127.0.0.1"])),
    ).toBe(false);
  });
});
