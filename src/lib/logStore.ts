export interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  service: string;
  url: string;
  queryParams: Record<string, string>;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  status: number;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  duration: number;
}

const MAX_LOGS = 500;
const logs: LogEntry[] = [];

export function addLog(entry: LogEntry): void {
  logs.unshift(entry);
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS);
  }
}

export function getLogs(): LogEntry[] {
  return [...logs];
}

export function clearLogs(): void {
  logs.splice(0, logs.length);
}
