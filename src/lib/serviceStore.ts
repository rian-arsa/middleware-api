import fs from "fs";
import path from "path";

const SERVICES_FILE = path.join(process.cwd(), "services.json");

export const RESERVED_NAMES = ["logs", "api", "mocks", "tester", "docs", "settings", "compare"];

export interface ServiceEntry {
  service: string;
  baseUrl: string;
  enabled: boolean;
}

export type ServiceSource = "ui" | "env" | "env-override";

export interface ServiceView {
  service: string;
  baseUrl: string;
  enabled: boolean;
  source: ServiceSource;
  envKey: string;
  envUrl?: string;
}

export const serviceToEnvKey = (service: string) => service.toUpperCase().replace(/-/g, "_") + "_URL";

function readFile(): ServiceEntry[] {
  try {
    if (!fs.existsSync(SERVICES_FILE)) return [];
    const raw = fs.readFileSync(SERVICES_FILE, "utf-8").trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((s) => s && typeof s.service === "string" && typeof s.baseUrl === "string").map((s) => ({ service: s.service, baseUrl: s.baseUrl, enabled: s.enabled !== false })) : [];
  } catch {
    return [];
  }
}

function writeFile(list: ServiceEntry[]) {
  fs.writeFileSync(SERVICES_FILE, JSON.stringify(list, null, 2), "utf-8");
}

export function stripCredentials(raw: string): string {
  try {
    const u = new URL(raw);
    u.username = "";
    u.password = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

export function validateService(name: string, url: string): string | null {
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) return "Nama service hanya boleh huruf kecil, angka, dan tanda hubung.";
  if (RESERVED_NAMES.includes(name)) return `"${name}" adalah nama yang dicadangkan aplikasi.`;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "URL harus diawali http:// atau https://";
    if (u.username || u.password) return "Jangan sertakan user:password di URL.";
  } catch {
    return "Format URL tidak valid.";
  }
  return null;
}

/** URL yang dipakai proxy. Entri dari UI menang atas .env; entri nonaktif dilewati. */
export function getServiceBaseUrl(service: string): string | null {
  const ui = readFile().find((s) => s.service === service);
  if (ui) return ui.enabled ? ui.baseUrl : null;
  return process.env[serviceToEnvKey(service)] || null;
}

export function listServices(): ServiceView[] {
  const file = readFile();
  const map = new Map<string, ServiceView>();

  for (const k of Object.keys(process.env)) {
    if (!/^[A-Z][A-Z0-9_]*_URL$/.test(k) || k.startsWith("NEXT_") || !process.env[k]) continue;
    const service = k.slice(0, -4).toLowerCase().replace(/_/g, "-");
    map.set(service, { service, baseUrl: stripCredentials(process.env[k] as string), enabled: true, source: "env", envKey: k });
  }
  for (const s of file) {
    const env = map.get(s.service);
    map.set(s.service, {
      service: s.service,
      baseUrl: s.baseUrl,
      enabled: s.enabled,
      source: env ? "env-override" : "ui",
      envKey: serviceToEnvKey(s.service),
      envUrl: env?.baseUrl,
    });
  }
  return [...map.values()].sort((a, b) => a.service.localeCompare(b.service));
}

export function upsertService(entry: ServiceEntry) {
  const list = readFile().filter((s) => s.service !== entry.service);
  list.push({ service: entry.service, baseUrl: entry.baseUrl.replace(/\/+$/, ""), enabled: entry.enabled });
  writeFile(list);
}

export function removeService(service: string): boolean {
  const list = readFile();
  const next = list.filter((s) => s.service !== service);
  if (next.length === list.length) return false;
  writeFile(next);
  return true;
}
