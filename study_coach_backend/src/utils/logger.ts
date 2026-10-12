// Prefixes every log line with an ISO timestamp, e.g. [2026-10-09T07:00:00.000Z]
export function timestamp(): string {
  return new Date().toISOString();
}

export function log(...args: unknown[]): void {
  console.log(`[${timestamp()}]`, ...args);
}

export function logError(...args: unknown[]): void {
  console.error(`[${timestamp()}]`, ...args);
}
