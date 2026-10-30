export const GOJEK_GREEN = "#00AA13";

export const METHOD_COLOR: Record<string, { bg: string; text: string }> = {
  GET: { bg: "#e8f4fd", text: "#1a6fa8" },
  POST: { bg: "#e6f9ec", text: "#177a37" },
  PUT: { bg: "#fff4e5", text: "#b35c00" },
  PATCH: { bg: "#f3eeff", text: "#6931c7" },
  DELETE: { bg: "#fdecea", text: "#b91c1c" },
};

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function getMethodStyle(method: string): { bg: string; text: string } {
  return METHOD_COLOR[method.toUpperCase()] ?? { bg: "#f1f5f9", text: "#64748b" };
}

export function getStatusStyle(status: number): { bg: string; text: string } {
  if (status >= 500) return { bg: "#fdecea", text: "#b91c1c" };
  if (status >= 400) return { bg: "#fff4e5", text: "#b35c00" };
  if (status >= 300) return { bg: "#e8f4fd", text: "#1a6fa8" };
  if (status >= 200) return { bg: "#e6f9ec", text: "#177a37" };
  return { bg: "#f1f5f9", text: "#64748b" };
}

export const STATUS_PRESETS: { code: number; text: string }[] = [
  { code: 200, text: "OK" },
  { code: 201, text: "Created" },
  { code: 204, text: "No Content" },
  { code: 400, text: "Bad Request" },
  { code: 401, text: "Unauthorized" },
  { code: 403, text: "Forbidden" },
  { code: 404, text: "Not Found" },
  { code: 409, text: "Conflict" },
  { code: 422, text: "Unprocessable Entity" },
  { code: 429, text: "Too Many Requests" },
  { code: 500, text: "Internal Server Error" },
  { code: 503, text: "Service Unavailable" },
];

export const RESERVED_SERVICES = ["logs", "api", "mocks", "tester", "docs", "settings", "compare"];

export type MockStatusKind = "on" | "off" | "passthrough";

export interface MockStatus {
  kind: MockStatusKind;
  label: string;
  detail: string;
}

/** Status efektif sebuah endpoint: apakah request benar-benar dilayani oleh mock. */
export function getMockStatus(
  collection: { enabled: boolean },
  group: { enabled?: boolean; activeVariantId?: string | null; variants: { id: string }[] }
): MockStatus {
  if (!collection.enabled) {
    return { kind: "off", label: "Mock NONAKTIF", detail: "Collection dinonaktifkan. Semua request diteruskan ke backend asli." };
  }
  if (group.enabled === false) {
    return { kind: "off", label: "Mock NONAKTIF", detail: "Endpoint ini dinonaktifkan. Request diteruskan ke backend asli." };
  }
  if (!group.variants.some((v) => v.id === group.activeVariantId)) {
    return { kind: "passthrough", label: "Belum ada response aktif", detail: "Tidak ada response yang dipilih aktif. Request diteruskan ke backend asli." };
  }
  return { kind: "on", label: "Mock AKTIF", detail: "Request ke endpoint ini dilayani oleh mock." };
}