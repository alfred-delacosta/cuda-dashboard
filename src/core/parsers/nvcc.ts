/**
 * Copyright Advanced Software and AI Solutions LLC
 */

/** Parse "release X.Y" from nvcc --version output. */
export function parseNvccVersion(stdout: string): string | null {
  const match = stdout.match(/release\s+(\d+\.\d+)/i);
  return match ? match[1] : null;
}
