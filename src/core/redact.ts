/**
 * Copyright Advanced Software and AI Solutions LLC
 */

const UUID_RE =
  /\bGPU-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;
const UUID_BARE_RE =
  /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

/** Serial / board part patterns commonly seen in nvidia-smi XML and text. */
const SERIAL_LINE_RE =
  /(Serial Number|Board Part Number|board_part_number|gpu_part_number)\s*[:=]\s*\S+/gi;
const SERIAL_XML_RE =
  /<(serial|board_part_number|gpu_part_number|gpu_uuid)>([^<]*)<\/\1>/gi;

const REDACTED = "[REDACTED]";

export function redactIdentifiers(text: string): string {
  let out = text.replace(UUID_RE, "GPU-[REDACTED]");
  out = out.replace(UUID_BARE_RE, REDACTED);
  out = out.replace(SERIAL_LINE_RE, (_m, label: string) => `${label}: ${REDACTED}`);
  out = out.replace(SERIAL_XML_RE, (_m, tag: string) => `<${tag}>${REDACTED}</${tag}>`);
  return out;
}

export function maybeRedact(text: string, showIdentifiers: boolean): string {
  return showIdentifiers ? text : redactIdentifiers(text);
}

export function redactUuidValue(value: string | null, showIdentifiers: boolean): string | null {
  if (value == null) return null;
  if (showIdentifiers) return value;
  if (/^GPU-/i.test(value) || UUID_BARE_RE.test(value)) {
    UUID_BARE_RE.lastIndex = 0;
    return "GPU-[REDACTED]";
  }
  return value;
}

export function basenameOnly(processName: string | null): string | null {
  if (processName == null || processName === "") return processName;
  const normalized = processName.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || processName;
}
