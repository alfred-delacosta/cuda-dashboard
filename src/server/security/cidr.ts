/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { BlockList, isIPv4, isIPv6 } from "node:net";

export function createCidrBlockList(cidrs: string[]): BlockList {
  const list = new BlockList();
  for (const cidr of cidrs) {
    const trimmed = cidr.trim();
    if (!trimmed) continue;
    if (trimmed.includes("/")) {
      const [addr, prefixStr] = trimmed.split("/");
      const prefix = Number(prefixStr);
      if (!addr || !Number.isFinite(prefix)) continue;
      const type = isIPv6(addr) ? "ipv6" : "ipv4";
      list.addSubnet(addr, prefix, type);
    } else if (isIPv4(trimmed)) {
      list.addAddress(trimmed, "ipv4");
    } else if (isIPv6(trimmed)) {
      list.addAddress(trimmed, "ipv6");
    }
  }
  return list;
}

/** Normalize IPv4-mapped IPv6 (::ffff:x.x.x.x) to IPv4 for BlockList checks. */
export function normalizeClientIp(ip: string): { address: string; type: "ipv4" | "ipv6" } {
  let address = ip;
  if (address.startsWith("::ffff:")) {
    address = address.slice(7);
  }
  if (isIPv4(address)) {
    return { address, type: "ipv4" };
  }
  return { address, type: "ipv6" };
}

export function isIpAllowed(list: BlockList, ip: string): boolean {
  try {
    const { address, type } = normalizeClientIp(ip);
    return list.check(address, type);
  } catch {
    return false;
  }
}
