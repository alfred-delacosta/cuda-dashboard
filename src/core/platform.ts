/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { readFileSync } from "node:fs";
import type { PlatformKind } from "./types.js";

export function detectPlatform(
  env: NodeJS.ProcessEnv = process.env,
  procVersionPath = "/proc/version",
): PlatformKind {
  if (process.platform === "win32") {
    return "windows";
  }
  if (env.WSL_DISTRO_NAME) {
    return "wsl";
  }
  try {
    const version = readFileSync(procVersionPath, "utf8").toLowerCase();
    if (version.includes("microsoft")) {
      return "wsl";
    }
  } catch {
    // not WSL or unreadable
  }
  return "linux";
}
