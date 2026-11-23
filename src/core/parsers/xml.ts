/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { XMLParser } from "fast-xml-parser";
import { parseNullableString } from "./na.js";

export interface XmlSummary {
  driverVersion: string | null;
  cudaVersion: string | null;
  gpuCount: number;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  // Keep driver/cuda versions as strings (e.g. "560.00"), not numbers.
  parseTagValue: false,
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseSmiXml(stdout: string): XmlSummary {
  const doc = parser.parse(stdout);
  const root = doc?.nvidia_smi_log ?? doc;
  const driverVersion = parseNullableString(
    root?.driver_version != null ? String(root.driver_version) : null,
  );
  const cudaVersion = parseNullableString(
    root?.cuda_version != null ? String(root.cuda_version) : null,
  );
  const gpus = asArray(root?.gpu);
  return {
    driverVersion,
    cudaVersion,
    gpuCount: gpus.length,
  };
}
