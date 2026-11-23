/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { describe, expect, it } from "vitest";
import { detectPlatform } from "../src/core/platform.js";

describe("detectPlatform", () => {
  it("detects wsl via env", () => {
    if (process.platform === "win32") {
      expect(detectPlatform({} as NodeJS.ProcessEnv)).toBe("windows");
    } else {
      expect(detectPlatform({ WSL_DISTRO_NAME: "Ubuntu" } as NodeJS.ProcessEnv)).toBe("wsl");
    }
  });
});
