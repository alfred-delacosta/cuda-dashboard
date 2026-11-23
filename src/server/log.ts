/**
 * Copyright Advanced Software and AI Solutions LLC
 * Logs ids and durations only, never command output.
 */

export function logCommand(id: string, durationMs: number, status: string): void {
  console.info(JSON.stringify({ event: "command", id, durationMs, status }));
}

export function logRequest(method: string, url: string, statusCode: number, durationMs: number): void {
  console.info(JSON.stringify({ event: "request", method, url, statusCode, durationMs }));
}
