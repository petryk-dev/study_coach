// Prefixes every log line with an ISO timestamp, e.g. [2026-10-09T07:00:00.000Z]
function timestamp() {
  return new Date().toISOString();
}

function log(...args) {
  console.log(`[${timestamp()}]`, ...args);
}

function logError(...args) {
  console.error(`[${timestamp()}]`, ...args);
}

module.exports = { timestamp, log, logError };
