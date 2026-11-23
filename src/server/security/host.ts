/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { networkInterfaces } from "node:os";
import { isIP } from "node:net";

export function collectInterfaceIps(): Set<string> {
  const ips = new Set<string>(["127.0.0.1", "::1"]);
  const nets = networkInterfaces();
  for (const entries of Object.values(nets)) {
    if (!entries) continue;
    for (const e of entries) {
      ips.add(e.address);
      if (String(e.family) === "IPv4" || (e.family as unknown) === 4) {
        ips.add(`::ffff:${e.address}`);
      }
    }
  }
  return ips;
}

export function parseHostHeader(hostHeader: string | undefined): string | null {
  if (!hostHeader) return null;
  let host = hostHeader.trim().toLowerCase();
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end === -1) return null;
    return host.slice(1, end);
  }
  // Strip port for IPv4/hostname
  const colon = host.lastIndexOf(":");
  if (colon !== -1 && host.indexOf(":") === colon) {
    host = host.slice(0, colon);
  }
  return host || null;
}

export function isHostAllowed(
  hostHeader: string | undefined,
  appHostname: string,
  osHostname: string,
  interfaceIps: Set<string> = collectInterfaceIps(),
): boolean {
  const host = parseHostHeader(hostHeader);
  if (!host) return false;

  const allowedNames = new Set(
    [appHostname, osHostname, "localhost"]
      .filter(Boolean)
      .map((h) => h.toLowerCase()),
  );

  if (allowedNames.has(host)) return true;

  if (isIP(host)) {
    if (interfaceIps.has(host)) return true;
    if (host === "127.0.0.1" || host === "::1") return true;
  }

  return false;
}
