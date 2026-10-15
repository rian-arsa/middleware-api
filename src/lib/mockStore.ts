import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface MockEntry {
  id: string;
  name: string;
  method: string;
  service: string;
  path: string;
  enabled: boolean;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  delayMs: number;
  createdAt: string;
  updatedAt: string;
}

const MOCKS_FILE = path.join(process.cwd(), "mocks.json");

let cache: MockEntry[] | null = null;

export function readMocks(): MockEntry[] {
  if (cache !== null) return cache;
  try {
    if (!fs.existsSync(MOCKS_FILE)) {
      cache = [];
      return cache;
    }
    const raw = fs.readFileSync(MOCKS_FILE, "utf-8");
    cache = JSON.parse(raw) as MockEntry[];
    if (!Array.isArray(cache)) {
      cache = [];
    }
  } catch {
    cache = [];
  }
  return cache;
}

function writeMocks(mocks: MockEntry[]): void {
  fs.writeFileSync(MOCKS_FILE, JSON.stringify(mocks, null, 2), "utf-8");
  cache = mocks;
}

export function getMocks(): MockEntry[] {
  return readMocks();
}

export function getMockById(id: string): MockEntry | undefined {
  return readMocks().find((m) => m.id === id);
}

export function createMock(
  data: Omit<MockEntry, "id" | "createdAt" | "updatedAt">
): MockEntry {
  const mocks = readMocks();
  const now = new Date().toISOString();
  const entry: MockEntry = {
    ...data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  writeMocks([...mocks, entry]);
  return entry;
}

export function updateMock(
  id: string,
  data: Partial<Omit<MockEntry, "id" | "createdAt">>
): MockEntry | null {
  const mocks = readMocks();
  const idx = mocks.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const updated: MockEntry = {
    ...mocks[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  const newMocks = [...mocks];
  newMocks[idx] = updated;
  writeMocks(newMocks);
  return updated;
}

export function deleteMock(id: string): boolean {
  const mocks = readMocks();
  const filtered = mocks.filter((m) => m.id !== id);
  if (filtered.length === mocks.length) return false;
  writeMocks(filtered);
  return true;
}

/**
 * Cari mock yang cocok dengan request.
 * Cocok jika method, service, dan path sama persis (case-insensitive method & service).
 * Hanya kembalikan mock yang enabled === true.
 */
export function findActiveMock(
  method: string,
  service: string,
  reqPath: string
): MockEntry | undefined {
  const normReqPath = reqPath.startsWith("/") ? reqPath : `/${reqPath}`;
  return readMocks().find((m) => {
    if (!m.enabled) return false;
    const normMockPath = m.path.startsWith("/") ? m.path : `/${m.path}`;
    return (
      m.method.toUpperCase() === method.toUpperCase() &&
      m.service.toLowerCase() === service.toLowerCase() &&
      normMockPath === normReqPath
    );
  });
}