"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

// --- Interfaces & Types ---

interface KeyValuePair {
  key: string;
  value: string;
}

interface RequestHistoryItem {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyMode: "json" | "text" | "form" | "none";
  bodyText: string;
  formBody?: KeyValuePair[];
  responseStatus: number;
  responseDuration: number;
}

interface ResponseState {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string | null;
  duration: number;
  size: number;
}

// --- Constants & Styling ---

const GOJEK_GREEN = "#00AA13";

const METHOD_COLOR: Record<string, { bg: string; text: string }> = {
  GET: { bg: "#e8f4fd", text: "#1a6fa8" },
  POST: { bg: "#e6f9ec", text: "#177a37" },
  PUT: { bg: "#fff4e5", text: "#b35c00" },
  PATCH: { bg: "#f3eeff", text: "#6931c7" },
  DELETE: { bg: "#fdecea", text: "#b91c1c" },
};

function getStatusStyle(status: number): { bg: string; text: string } {
  if (status >= 500) return { bg: "#fdecea", text: "#b91c1c" };
  if (status >= 400) return { bg: "#fff4e5", text: "#b35c00" };
  if (status >= 300) return { bg: "#e8f4fd", text: "#1a6fa8" };
  if (status >= 200) return { bg: "#e6f9ec", text: "#177a37" };
  return { bg: "#f1f5f9", text: "#64748b" };
}

function Pill({ label, style }: { label: string; style: { bg: string; text: string } }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "100px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: style.bg,
        color: style.text,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {label}
    </span>
  );
}

/** Coba parse string sebagai JSON. Return null jika gagal. */
function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/** Syntax highlighting sederhana untuk JSON string. */
function highlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("[^"\\]*(?:\\.[^"\\]*)*")\s*:/g,
      '<span style="color:#6366f1">$1</span>:'
    )
    .replace(
      /:\s*("[^"\\]*(?:\\.[^"\\]*)*")/g,
      ': <span style="color:#059669">$1</span>'
    )
    .replace(
      /:\s*(true|false)/g,
      ': <span style="color:#d97706">$1</span>'
    )
    .replace(
      /:\s*(null)/g,
      ': <span style="color:#9ca3af">$1</span>'
    )
    .replace(
      /:\s*(-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
      ': <span style="color:#0284c7">$1</span>'
    );
}

function CodeBlock({
  value,
  label,
  initialMaxHeight = "320px",
}: {
  value: string | null | Record<string, string>;
  label?: string;
  initialMaxHeight?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"formatted" | "raw">("formatted");
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  if (!value) {
    return (
      <span style={{ fontSize: "12px", color: "#d1d5db", fontStyle: "italic" }}>
        kosong
      </span>
    );
  }

  const rawText =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

  const parsed = typeof value === "object" ? value : tryParseJson(rawText);
  const isJson = parsed !== null;
  const formattedText = isJson
    ? JSON.stringify(parsed, null, 2)
    : rawText;

  const displayText = mode === "formatted" ? formattedText : rawText;
  const highlighted =
    isJson && mode === "formatted" ? highlightJson(formattedText) : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const currentMaxHeight = isFullHeight ? "none" : initialMaxHeight;

  return (
    <>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#f8fafc",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 10px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f1f5f9",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {isJson && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("formatted")}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "4px",
                    border: "none",
                    background: mode === "formatted" ? "#fff" : "transparent",
                    boxShadow:
                      mode === "formatted" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: mode === "formatted" ? "#111827" : "#9ca3af",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => setMode("raw")}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "4px",
                    border: "none",
                    background: mode === "raw" ? "#fff" : "transparent",
                    boxShadow:
                      mode === "raw" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: mode === "raw" ? "#111827" : "#9ca3af",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Raw
                </button>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setIsFullHeight((prev) => !prev)}
              title={
                isFullHeight
                  ? "Kembalikan tinggi standar"
                  : "Tampilkan seluruh isi tanpa scroll"
              }
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                border: "1px solid #e2e8f0",
                background: isFullHeight ? "#e2e8f0" : "#fff",
                fontSize: "11px",
                fontWeight: 500,
                color: "#475569",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {isFullHeight ? "Tinggi Normal" : "Tinggi Penuh"}
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="Buka tampilan modal layar penuh"
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                border: "1px solid #e2e8f0",
                background: "#fff",
                fontSize: "11px",
                fontWeight: 500,
                color: "#475569",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Layar Penuh
            </button>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: "3px 10px",
                borderRadius: "4px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                fontSize: "11px",
                fontWeight: 600,
                color: copied ? "#059669" : "#6b7280",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "color 0.2s",
              }}
            >
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
        </div>

        {/* Content */}
        {highlighted ? (
          <pre
            style={{
              margin: 0,
              padding: "12px 14px",
              fontSize: "12px",
              overflowX: "auto",
              maxHeight: currentMaxHeight,
              overflowY: "auto",
              resize: "vertical",
              minHeight: "150px",
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              lineHeight: 1.7,
              color: "#1e293b",
            }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          <pre
            style={{
              margin: 0,
              padding: "12px 14px",
              fontSize: "12px",
              color: "#374151",
              overflowX: "auto",
              maxHeight: currentMaxHeight,
              overflowY: "auto",
              resize: "vertical",
              minHeight: "150px",
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              lineHeight: 1.7,
            }}
          >
            {displayText}
          </pre>
        )}
      </div>

      {/* Fullscreen Overlay Modal */}
      {isFullscreen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "92vw",
              maxWidth: "1400px",
              height: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}
                >
                  {label ?? "Detail Viewer"}
                </span>
                {isJson && (
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      background: "#e2e8f0",
                      padding: "2px",
                      borderRadius: "6px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setMode("formatted")}
                      style={{
                        padding: "3px 12px",
                        borderRadius: "4px",
                        border: "none",
                        background: mode === "formatted" ? "#fff" : "transparent",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("raw")}
                      style={{
                        padding: "3px 12px",
                        borderRadius: "4px",
                        border: "none",
                        background: mode === "raw" ? "#fff" : "transparent",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Raw
                    </button>
                  </div>
                )}
              </div>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: copied ? "#059669" : "#334155",
                    cursor: "pointer",
                  }}
                >
                  {copied ? "Tersalin" : "Salin"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#e2e8f0",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Tutup (ESC)
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "20px",
                background: "#f8fafc",
              }}
            >
              {highlighted ? (
                <pre
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: 1.7,
                    fontFamily:
                      "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    color: "#1e293b",
                  }}
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              ) : (
                <pre
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: 1.7,
                    fontFamily:
                      "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    color: "#374151",
                  }}
                >
                  {displayText}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Helper Functions ---

function buildUrlWithParams(
  baseUrl: string,
  params: KeyValuePair[]
): string {
  if (!baseUrl) return "";
  try {
    const dummyBase = "http://localhost:3000";
    const isRelative = !baseUrl.startsWith("http://") && !baseUrl.startsWith("https://");
    const u = new URL(baseUrl, dummyBase);

    // Reconstruct search query cleanly
    const search = new URLSearchParams();
    params.forEach(({ key, value }) => {
      if (key.trim()) {
        search.append(key.trim(), value);
      }
    });

    const qs = search.toString();
    if (isRelative) {
      return u.pathname + (qs ? `?${qs}` : "");
    }
    u.search = qs;
    return u.toString();
  } catch {
    const [path] = baseUrl.split("?");
    const search = new URLSearchParams();
    params.forEach(({ key, value }) => {
      if (key.trim()) search.append(key.trim(), value);
    });
    const qs = search.toString();
    return qs ? `${path}?${qs}` : path;
  }
}

function parseUrlToParams(url: string): KeyValuePair[] {
  if (!url || !url.includes("?")) return [];
  try {
    const queryPart = url.split("?")[1] || "";
    const sp = new URLSearchParams(queryPart);
    const result: KeyValuePair[] = [];
    sp.forEach((value, key) => {
      result.push({ key, value });
    });
    return result;
  } catch {
    return [];
  }
}

function buildRequestBody(
  bodyMode: "json" | "text" | "form" | "none",
  bodyText: string,
  formBody: KeyValuePair[]
): string | undefined {
  if (bodyMode === "json" || bodyMode === "text") {
    return bodyText;
  }
  if (bodyMode === "form") {
    const sp = new URLSearchParams();
    formBody.forEach(({ key, value }) => {
      if (key.trim()) sp.append(key.trim(), value);
    });
    return sp.toString();
  }
  return undefined;
}

function generateCurlFromState(
  method: string,
  url: string,
  headers: KeyValuePair[],
  body?: string
): string {
  const targetUrl = url || "https://kong.eratech.id/v1/...";
  const lines: string[] = [`curl -X ${method} '${targetUrl}'`];

  headers.forEach(({ key, value }) => {
    if (key.trim()) {
      const escapedVal = value.replace(/'/g, `'\\''`);
      lines.push(`  -H '${key.trim()}: ${escapedVal}'`);
    }
  });

  if (body && method !== "GET" && method !== "HEAD") {
    const escapedBody = body.replace(/'/g, `'\\''`);
    lines.push(`  --data-raw '${escapedBody}'`);
  }

  return lines.join(" \\\n");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function formatRelativeTime(isoString: string): string {
  try {
    const now = Date.now();
    const past = new Date(isoString).getTime();
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 5) return "Baru saja";
    if (diffSec < 60) return `${diffSec} dtk lalu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return new Date(isoString).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const STORAGE_KEY = "api-tester-history";

function loadHistoryFromStorage(): RequestHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistoryToStorage(items: RequestHistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // ignore
  }
}

// --- cURL Parser ---

interface ParsedCurl {
  method: string;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyMode: "json" | "text" | "form" | "none";
  bodyText: string;
  formBody: KeyValuePair[];
}

function tokenizeCurlArgs(cmd: string): string[] {
  // Normalize escaped newlines and line continuations
  const normalized = cmd
    .replace(/\\[\r\n]+/g, " ")
    .replace(/\^[\r\n]+/g, " ")
    .trim();

  const tokens: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\" && !inSingleQuote) {
      escapeNext = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function parseCurlCommand(rawCommand: string): ParsedCurl | null {
  const trimmed = rawCommand.trim();
  if (!trimmed.toLowerCase().startsWith("curl")) {
    return null;
  }

  const tokens = tokenizeCurlArgs(trimmed);
  if (tokens.length === 0) return null;

  // Strip leading 'curl'
  if (tokens[0].toLowerCase() === "curl") {
    tokens.shift();
  }

  let method: string | null = null;
  let url: string | null = null;
  const headers: KeyValuePair[] = [];
  const bodyChunks: string[] = [];

  const argFlags = new Set([
    "-X", "--request",
    "-H", "--header",
    "-d", "--data", "--data-raw", "--data-binary", "--data-ascii", "--data-urlencode",
    "--url",
    "-u", "--user",
    "-A", "--user-agent",
    "-e", "--referer",
    "-o", "--output",
    "-m", "--max-time",
    "--connect-timeout"
  ]);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "-X" || token === "--request") {
      if (i + 1 < tokens.length) {
        method = tokens[++i].toUpperCase();
      }
      continue;
    }

    if (token === "-H" || token === "--header") {
      if (i + 1 < tokens.length) {
        const headerStr = tokens[++i];
        const colonIdx = headerStr.indexOf(":");
        if (colonIdx > 0) {
          const key = headerStr.slice(0, colonIdx).trim();
          const value = headerStr.slice(colonIdx + 1).trim();
          headers.push({ key, value });
        }
      }
      continue;
    }

    if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "--data-ascii" ||
      token === "--data-urlencode"
    ) {
      if (i + 1 < tokens.length) {
        bodyChunks.push(tokens[++i]);
      }
      continue;
    }

    if (token === "--url") {
      if (i + 1 < tokens.length) {
        url = tokens[++i];
      }
      continue;
    }

    // Flags taking arguments that we skip
    if (argFlags.has(token)) {
      i++;
      continue;
    }

    // Flags without arguments
    if (token.startsWith("-")) {
      continue;
    }

    // Positional argument -> URL (if not found yet)
    if (!url) {
      url = token;
    }
  }

  const rawUrl = url || "";
  const rawBody = bodyChunks.length > 0 ? bodyChunks.join("&") : null;

  if (!method) {
    method = rawBody !== null ? "POST" : "GET";
  }

  // Extract query parameters
  const queryParams = parseUrlToParams(rawUrl);

  let bodyMode: "json" | "text" | "form" | "none" = "none";
  let bodyText = "";
  const formBody: KeyValuePair[] = [{ key: "", value: "" }];

  if (rawBody !== null && method !== "GET" && method !== "HEAD") {
    bodyText = rawBody;
    const ct = headers.find(
      (h) => h.key.toLowerCase() === "content-type"
    )?.value.toLowerCase() || "";

    const parsedJson = tryParseJson(rawBody);
    if (ct.includes("application/json") || parsedJson !== null) {
      bodyMode = "json";
      if (parsedJson) {
        bodyText = JSON.stringify(parsedJson, null, 2);
      }
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      bodyMode = "form";
      const sp = new URLSearchParams(rawBody);
      const parsedForm: KeyValuePair[] = [];
      sp.forEach((value, key) => {
        parsedForm.push({ key, value });
      });
      if (parsedForm.length > 0) {
        formBody.splice(0, formBody.length, ...parsedForm);
      }
    } else {
      bodyMode = "text";
    }
  }

  return {
    method,
    url: rawUrl,
    params: queryParams.length > 0 ? queryParams : [{ key: "", value: "" }],
    headers: headers.length > 0 ? headers : [{ key: "", value: "" }],
    bodyMode,
    bodyText,
    formBody,
  };
}

// --- Main Page Component ---

export default function TesterPage() {
  // Request builder state
  const [method, setMethod] = useState<string>("GET");
  const [url, setUrl] = useState<string>("");
  const [params, setParams] = useState<KeyValuePair[]>([{ key: "", value: "" }]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([{ key: "", value: "" }]);
  const [bodyMode, setBodyMode] = useState<"json" | "text" | "form" | "none">("none");
  const [bodyText, setBodyText] = useState<string>("");
  const [formBody, setFormBody] = useState<KeyValuePair[]>([{ key: "", value: "" }]);

  // UI state
  const [activeTab, setActiveTab] = useState<"params" | "headers" | "body">("params");
  const [activeResponseTab, setActiveResponseTab] = useState<"body" | "headers">("body");
  const [curlExpanded, setCurlExpanded] = useState<boolean>(false);
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [curlCopied, setCurlCopied] = useState<boolean>(false);
  const [jsonFormatError, setJsonFormatError] = useState<string | null>(null);

  // cURL import modal & toast state
  const [importCurlModalOpen, setImportCurlModalOpen] = useState<boolean>(false);
  const [curlInputModal, setCurlInputModal] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Response state
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistoryFromStorage());
  }, []);

  // When changing method: if GET or HEAD, switch tab away from body
  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    if ((newMethod === "GET" || newMethod === "HEAD") && activeTab === "body") {
      setActiveTab("params");
    }
  };

  // Import / parse cURL and populate all fields
  const handleApplyCurl = (curlText: string): boolean => {
    const parsed = parseCurlCommand(curlText);
    if (!parsed) {
      alert("Format cURL tidak valid. Pastikan perintah diawali dengan 'curl'.");
      return false;
    }

    setMethod(parsed.method);
    setUrl(parsed.url);
    setParams(parsed.params);
    setHeaders(parsed.headers);
    setBodyMode(parsed.bodyMode);
    setBodyText(parsed.bodyText);
    setFormBody(parsed.formBody);
    setJsonFormatError(null);

    // Switch to relevant tab automatically
    if (parsed.bodyMode !== "none") {
      setActiveTab("body");
    } else if (parsed.params.some((p) => p.key.trim().length > 0)) {
      setActiveTab("params");
    } else if (parsed.headers.some((h) => h.key.trim().length > 0)) {
      setActiveTab("headers");
    }

    setToastMessage("cURL berhasil di-import! Method, URL, headers, dan body otomatis terisi.");
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return true;
  };

  // Synchronize URL query params with state (or auto-detect cURL if pasted)
  const handleUrlChange = (newUrl: string) => {
    if (newUrl.trim().toLowerCase().startsWith("curl ")) {
      handleApplyCurl(newUrl);
      return;
    }
    setUrl(newUrl);
    const parsed = parseUrlToParams(newUrl);
    if (parsed.length > 0) {
      setParams(parsed);
    }
  };

  // Param row management
  const updateParam = (index: number, field: "key" | "value", value: string) => {
    const next = [...params];
    next[index] = { ...next[index], [field]: value };
    setParams(next);
    setUrl(buildUrlWithParams(url, next));
  };

  const addParam = () => {
    setParams((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeParam = (index: number) => {
    const next = params.filter((_, i) => i !== index);
    const finalParams = next.length > 0 ? next : [{ key: "", value: "" }];
    setParams(finalParams);
    setUrl(buildUrlWithParams(url, finalParams));
  };

  // Header row management
  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const next = [...headers];
    next[index] = { ...next[index], [field]: value };
    setHeaders(next);
  };

  const addHeader = () => {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    const next = headers.filter((_, i) => i !== index);
    setHeaders(next.length > 0 ? next : [{ key: "", value: "" }]);
  };

  // Form Body row management
  const updateFormBody = (index: number, field: "key" | "value", value: string) => {
    const next = [...formBody];
    next[index] = { ...next[index], [field]: value };
    setFormBody(next);
  };

  const addFormBody = () => {
    setFormBody((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeFormBody = (index: number) => {
    const next = formBody.filter((_, i) => i !== index);
    setFormBody(next.length > 0 ? next : [{ key: "", value: "" }]);
  };

  // Switch body mode & auto manage Content-Type header
  const handleBodyModeChange = (mode: "json" | "text" | "form" | "none") => {
    setBodyMode(mode);
    setJsonFormatError(null);

    const setHeaderValue = (contentType: string) => {
      setHeaders((prev) => {
        const ctIdx = prev.findIndex(
          (h) => h.key.trim().toLowerCase() === "content-type"
        );
        if (ctIdx >= 0) {
          const updated = [...prev];
          updated[ctIdx] = { ...updated[ctIdx], value: contentType };
          return updated;
        }
        // If first row is empty, replace it
        if (prev.length === 1 && !prev[0].key.trim()) {
          return [{ key: "Content-Type", value: contentType }];
        }
        return [...prev, { key: "Content-Type", value: contentType }];
      });
    };

    if (mode === "json") {
      setHeaderValue("application/json");
    } else if (mode === "text") {
      setHeaderValue("text/plain");
    } else if (mode === "form") {
      setHeaderValue("application/x-www-form-urlencoded");
    }
  };

  // Format JSON action
  const handleFormatJson = () => {
    if (!bodyText.trim()) return;
    try {
      const parsed = JSON.parse(bodyText);
      setBodyText(JSON.stringify(parsed, null, 2));
      setJsonFormatError(null);
    } catch (err) {
      setJsonFormatError(
        err instanceof Error ? err.message : "Format JSON tidak valid"
      );
    }
  };

  // Current built body
  const currentBuiltBody = useMemo(() => {
    return buildRequestBody(bodyMode, bodyText, formBody);
  }, [bodyMode, bodyText, formBody]);

  // Current generated cURL
  const currentCurl = useMemo(() => {
    const finalUrl = buildUrlWithParams(url, params);
    return generateCurlFromState(method, finalUrl, headers, currentBuiltBody);
  }, [method, url, params, headers, currentBuiltBody]);

  // Copy cURL
  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(currentCurl);
      setCurlCopied(true);
      setTimeout(() => setCurlCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Load from history
  const handleLoadHistory = (item: RequestHistoryItem) => {
    setMethod(item.method);
    setUrl(item.url);
    setParams(
      item.params && item.params.length > 0
        ? item.params
        : [{ key: "", value: "" }]
    );
    setHeaders(
      item.headers && item.headers.length > 0
        ? item.headers
        : [{ key: "", value: "" }]
    );
    setBodyMode(item.bodyMode);
    setBodyText(item.bodyText || "");
    if (item.formBody && item.formBody.length > 0) {
      setFormBody(item.formBody);
    } else {
      setFormBody([{ key: "", value: "" }]);
    }
    setError(null);
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistoryToStorage(next);
  };

  // Clear all history
  const handleClearAllHistory = () => {
    setHistory([]);
    saveHistoryToStorage([]);
  };

  // Indicators if tabs have data
  const hasParamsData = useMemo(
    () => params.some((p) => p.key.trim().length > 0),
    [params]
  );
  const hasHeadersData = useMemo(
    () => headers.some((h) => h.key.trim().length > 0),
    [headers]
  );
  const hasBodyData = useMemo(() => {
    if (bodyMode === "none") return false;
    if (bodyMode === "form")
      return formBody.some((f) => f.key.trim().length > 0);
    return bodyText.trim().length > 0;
  }, [bodyMode, bodyText, formBody]);

  // Send request
  const handleSend = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      alert("URL tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const start = Date.now();
    const finalUrl = buildUrlWithParams(trimmedUrl, params);

    // Build req headers
    const reqHeaders: Record<string, string> = {};
    headers.forEach(({ key, value }) => {
      if (key.trim()) {
        reqHeaders[key.trim()] = value;
      }
    });

    // Make sure Content-Type is set if body is provided and not explicitly given
    if (method !== "GET" && method !== "HEAD") {
      if (
        bodyMode === "json" &&
        !Object.keys(reqHeaders).some(
          (k) => k.toLowerCase() === "content-type"
        )
      ) {
        reqHeaders["Content-Type"] = "application/json";
      } else if (
        bodyMode === "text" &&
        !Object.keys(reqHeaders).some(
          (k) => k.toLowerCase() === "content-type"
        )
      ) {
        reqHeaders["Content-Type"] = "text/plain";
      } else if (
        bodyMode === "form" &&
        !Object.keys(reqHeaders).some(
          (k) => k.toLowerCase() === "content-type"
        )
      ) {
        reqHeaders["Content-Type"] = "application/x-www-form-urlencoded";
      }
    }

    const payload =
      method !== "GET" && method !== "HEAD" ? currentBuiltBody : undefined;

    try {
      const res = await fetch(finalUrl, {
        method,
        headers: reqHeaders,
        body: payload,
      });

      const duration = Date.now() - start;
      const buffer = await res.arrayBuffer();
      const text = new TextDecoder().decode(buffer);
      const size = buffer.byteLength;

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      const responseObj: ResponseState = {
        status: res.status,
        statusText: res.statusText || (res.status === 200 ? "OK" : ""),
        headers: resHeaders,
        body: text || null,
        duration,
        size,
      };

      setResponse(responseObj);

      // Save to history
      const newHistoryItem: RequestHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        method,
        url: finalUrl,
        params,
        headers,
        bodyMode,
        bodyText,
        formBody: bodyMode === "form" ? formBody : undefined,
        responseStatus: res.status,
        responseDuration: duration,
      };

      const updatedHistory = [newHistoryItem, ...history].slice(0, 50);
      setHistory(updatedHistory);
      saveHistoryToStorage(updatedHistory);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #f9fafb;
          color: #111827;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          height: 100%;
          color-scheme: light !important;
        }

        /* Force dark text and clean light background on all inputs */
        input, select, textarea {
          font-family: inherit;
          color: #111827 !important;
          background-color: #ffffff !important;
          color-scheme: light !important;
        }

        input::placeholder, textarea::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }

        select option {
          background-color: #ffffff !important;
          color: #111827 !important;
        }

        input:focus, select:focus, textarea:focus {
          outline: 2px solid #00AA13 !important;
          outline-offset: 1px !important;
        }

        /* Cross-browser visible, smooth scrollbars */
        * {
          scrollbar-width: thin !important;
          scrollbar-color: #94a3b8 #f1f5f9 !important;
        }

        ::-webkit-scrollbar {
          width: 9px !important;
          height: 9px !important;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
        }
        ::-webkit-scrollbar-thumb {
          background: #94a3b8 !important;
          border-radius: 6px !important;
          border: 2px solid #f1f5f9 !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #64748b !important;
        }

        .tester-panel-left {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
        }

        .tester-panel-right {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
        }

        .tester-scrollable-list {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive full-page scroll on smaller/medium viewports */
        @media (max-width: 900px) {
          .tester-root-container {
            height: auto !important;
            min-height: 100vh !important;
            overflow-y: auto !important;
          }
          .tester-panels-wrapper {
            flex-direction: column !important;
            height: auto !important;
            overflow: visible !important;
          }
          .tester-panel-left, .tester-panel-right {
            width: 100% !important;
            min-width: 0 !important;
            height: auto !important;
            overflow: visible !important;
            border-right: none !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      {/* Datalist for Header keys suggestions */}
      <datalist id="header-keys-list">
        <option value="Authorization" />
        <option value="Content-Type" />
        <option value="Accept" />
        <option value="X-Request-ID" />
        <option value="X-API-Key" />
        <option value="Cache-Control" />
      </datalist>

      <div
        className="tester-root-container"
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            padding: "0 32px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: 4,
                height: 28,
                borderRadius: 2,
                background: GOJEK_GREEN,
              }}
            />
            <div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: 1.2,
                }}
              >
                API Tester
              </p>
              <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
                Test and debug backend APIs via proxy middleware
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setImportCurlModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "7px 14px",
                borderRadius: "8px",
                border: "1.5px solid #d1d5db",
                background: "#f9fafb",
                color: "#374151",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Paste cURL
            </button>

            <a
              href="/logs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "7px 16px",
                borderRadius: "8px",
                border: "1.5px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Logs
            </a>
          </div>
        </header>

        {/* 2-Panel Content Area */}
        <div
          className="tester-panels-wrapper"
          style={{
            flex: 1,
            height: "calc(100vh - 60px)",
            maxHeight: "calc(100vh - 60px)",
            minHeight: 0,
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            width: "100%",
          }}
        >
          {/* ================= LEFT PANEL: Request Builder ================= */}
          <div
            className="tester-panel-left"
            style={{
              flex: "1 1 50%",
              width: "50%",
              minWidth: "380px",
              height: "100%",
              maxHeight: "100%",
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "24px 28px",
              borderRight: "1px solid #e5e7eb",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Toast feedback when cURL or action succeeds */}
            {toastMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span>{toastMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#065f46",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                >
                  &times;
                </button>
              </div>
            )}

            {/* 1.1 Method + URL + Paste cURL + GO Button */}
            <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
              <select
                value={method}
                onChange={(e) => handleMethodChange(e.target.value)}
                style={{
                  background: METHOD_COLOR[method]?.bg || "#f1f5f9",
                  color: METHOD_COLOR[method]?.text || "#111827",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  minWidth: "105px",
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                placeholder="https://kong.eratech.id/v1/... atau tempel perintah cURL langsung di sini"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onPaste={(e) => {
                  const pasteText = e.clipboardData.getData("text");
                  if (pasteText.trim().toLowerCase().startsWith("curl")) {
                    e.preventDefault();
                    handleApplyCurl(pasteText);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleSend();
                  }
                }}
                style={{
                  flex: 1,
                  background: "#fff",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  color: "#111827",
                  fontFamily: "'Inter', sans-serif",
                }}
              />

              <button
                type="button"
                onClick={() => setImportCurlModalOpen(true)}
                title="Paste dan import dari perintah cURL"
                style={{
                  background: "#f8fafc",
                  color: "#374151",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                Paste cURL
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                style={{
                  background: GOJEK_GREEN,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 24px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 1px 3px rgba(0,170,19,0.3)",
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        borderTopColor: "transparent",
                        animation: "spin 0.8s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Mengirim...
                  </>
                ) : (
                  "GO"
                )}
              </button>
            </div>

            {/* 1.2 Tabs (Params | Headers | Body) */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#fafafa",
                overflow: "hidden",
              }}
            >
              {/* Tab Navigation */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#fff",
                }}
              >
                {/* Tab Params */}
                <button
                  type="button"
                  onClick={() => setActiveTab("params")}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    background: "transparent",
                    borderBottom:
                      activeTab === "params"
                        ? `2.5px solid ${GOJEK_GREEN}`
                        : "2.5px solid transparent",
                    color: activeTab === "params" ? "#111827" : "#9ca3af",
                    fontWeight: activeTab === "params" ? 600 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Params
                  {hasParamsData && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: GOJEK_GREEN,
                        display: "inline-block",
                      }}
                    />
                  )}
                </button>

                {/* Tab Headers */}
                <button
                  type="button"
                  onClick={() => setActiveTab("headers")}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    background: "transparent",
                    borderBottom:
                      activeTab === "headers"
                        ? `2.5px solid ${GOJEK_GREEN}`
                        : "2.5px solid transparent",
                    color: activeTab === "headers" ? "#111827" : "#9ca3af",
                    fontWeight: activeTab === "headers" ? 600 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Headers
                  {hasHeadersData && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: GOJEK_GREEN,
                        display: "inline-block",
                      }}
                    />
                  )}
                </button>

                {/* Tab Body */}
                <button
                  type="button"
                  onClick={() => {
                    if (method !== "GET" && method !== "HEAD") {
                      setActiveTab("body");
                    }
                  }}
                  disabled={method === "GET" || method === "HEAD"}
                  title={
                    method === "GET" || method === "HEAD"
                      ? "Body dinonaktifkan untuk GET/HEAD"
                      : undefined
                  }
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    background: "transparent",
                    borderBottom:
                      activeTab === "body"
                        ? `2.5px solid ${GOJEK_GREEN}`
                        : "2.5px solid transparent",
                    color:
                      method === "GET" || method === "HEAD"
                        ? "#d1d5db"
                        : activeTab === "body"
                          ? "#111827"
                          : "#9ca3af",
                    fontWeight: activeTab === "body" ? 600 : 500,
                    fontSize: "13px",
                    cursor:
                      method === "GET" || method === "HEAD"
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Body
                  {hasBodyData && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: GOJEK_GREEN,
                        display: "inline-block",
                      }}
                    />
                  )}
                </button>
              </div>

              {/* Tab Content Box */}
              <div style={{ padding: "16px" }}>
                {/* 1. PARAMS CONTENT */}
                {activeTab === "params" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 36px",
                        gap: "8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        paddingBottom: "4px",
                      }}
                    >
                      <span>Key</span>
                      <span>Value</span>
                      <span />
                    </div>

                    <div
                      className="tester-scrollable-list"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        maxHeight: "190px",
                        overflowY: "auto",
                        paddingRight: "4px",
                      }}
                    >
                      {params.map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 36px",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Key"
                            value={row.key}
                            onChange={(e) => updateParam(idx, "key", e.target.value)}
                            style={{
                              background: "#ffffff",
                              color: "#111827",
                              border: "1.5px solid #d1d5db",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "12px",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={row.value}
                            onChange={(e) => updateParam(idx, "value", e.target.value)}
                            style={{
                              background: "#ffffff",
                              color: "#111827",
                              border: "1.5px solid #d1d5db",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeParam(idx)}
                            title="Hapus baris"
                            style={{
                              height: "32px",
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              color: "#ef4444",
                              fontWeight: 700,
                              fontSize: "14px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "4px" }}>
                      <button
                        type="button"
                        onClick={addParam}
                        style={{
                          background: "#fff",
                          border: "1px dashed #d1d5db",
                          borderRadius: "6px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#374151",
                          cursor: "pointer",
                        }}
                      >
                        + Tambah Param
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. HEADERS CONTENT */}
                {activeTab === "headers" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 36px",
                        gap: "8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        paddingBottom: "4px",
                      }}
                    >
                      <span>Key</span>
                      <span>Value</span>
                      <span />
                    </div>

                    <div
                      className="tester-scrollable-list"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        maxHeight: "190px",
                        overflowY: "auto",
                        paddingRight: "4px",
                      }}
                    >
                      {headers.map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 36px",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="text"
                            list="header-keys-list"
                            placeholder="Header key (mis: Authorization)"
                            value={row.key}
                            onChange={(e) => updateHeader(idx, "key", e.target.value)}
                            style={{
                              background: "#ffffff",
                              color: "#111827",
                              border: "1.5px solid #d1d5db",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "12px",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Header value"
                            value={row.value}
                            onChange={(e) => updateHeader(idx, "value", e.target.value)}
                            style={{
                              background: "#ffffff",
                              color: "#111827",
                              border: "1.5px solid #d1d5db",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeHeader(idx)}
                            title="Hapus header"
                            style={{
                              height: "32px",
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              color: "#ef4444",
                              fontWeight: 700,
                              fontSize: "14px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "4px" }}>
                      <button
                        type="button"
                        onClick={addHeader}
                        style={{
                          background: "#fff",
                          border: "1px dashed #d1d5db",
                          borderRadius: "6px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#374151",
                          cursor: "pointer",
                        }}
                      >
                        + Tambah Header
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. BODY CONTENT */}
                {activeTab === "body" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Sub-tab selection */}
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                        borderBottom: "1px solid #e5e7eb",
                        paddingBottom: "10px",
                      }}
                    >
                      {(["json", "text", "form", "none"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleBodyModeChange(mode)}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb",
                            background: bodyMode === mode ? "#111827" : "#fff",
                            color: bodyMode === mode ? "#fff" : "#4b5563",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            textTransform:
                              mode === "json"
                                ? "uppercase"
                                : mode === "form"
                                  ? "capitalize"
                                  : "capitalize",
                          }}
                        >
                          {mode === "form" ? "Form Data" : mode}
                        </button>
                      ))}

                      {bodyMode === "json" && (
                        <div style={{ marginLeft: "auto" }}>
                          <button
                            type="button"
                            onClick={handleFormatJson}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              background: "#fff",
                              color: "#374151",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Format JSON
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mode JSON */}
                    {bodyMode === "json" && (
                      <div>
                        {jsonFormatError && (
                          <div
                            style={{
                              padding: "6px 10px",
                              marginBottom: "8px",
                              borderRadius: "6px",
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#b91c1c",
                              fontSize: "11px",
                            }}
                          >
                            Error parsing JSON: {jsonFormatError}
                          </div>
                        )}
                        <textarea
                          placeholder='{"key": "value"}'
                          value={bodyText}
                          onChange={(e) => {
                            setBodyText(e.target.value);
                            if (jsonFormatError) setJsonFormatError(null);
                          }}
                          style={{
                            width: "100%",
                            minHeight: "180px",
                            maxHeight: "340px",
                            overflowY: "auto",
                            background: "#ffffff",
                            color: "#111827",
                            border: jsonFormatError
                              ? "1.5px solid #ef4444"
                              : "1.5px solid #d1d5db",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            fontSize: "12px",
                            fontFamily:
                              "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                            lineHeight: 1.6,
                            resize: "vertical",
                          }}
                        />
                      </div>
                    )}

                    {/* Mode Text */}
                    {bodyMode === "text" && (
                      <textarea
                        placeholder="Plain text body..."
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "180px",
                          maxHeight: "340px",
                          overflowY: "auto",
                          background: "#ffffff",
                          color: "#111827",
                          border: "1.5px solid #d1d5db",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          fontSize: "12px",
                          fontFamily:
                            "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                          lineHeight: 1.6,
                          resize: "vertical",
                        }}
                      />
                    )}

                    {/* Mode Form Data */}
                    {bodyMode === "form" && (
                      <div
                        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 36px",
                            gap: "8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          <span>Field</span>
                          <span>Value</span>
                          <span />
                        </div>

                        <div
                          className="tester-scrollable-list"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            maxHeight: "190px",
                            overflowY: "auto",
                            paddingRight: "4px",
                          }}
                        >
                          {formBody.map((row, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 36px",
                                gap: "8px",
                                alignItems: "center",
                              }}
                            >
                              <input
                                type="text"
                                placeholder="Field name"
                                value={row.key}
                                onChange={(e) =>
                                  updateFormBody(idx, "key", e.target.value)
                                }
                                style={{
                                  background: "#ffffff",
                                  color: "#111827",
                                  border: "1.5px solid #d1d5db",
                                  borderRadius: "6px",
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                }}
                              />
                              <input
                                type="text"
                                placeholder="Field value"
                                value={row.value}
                                onChange={(e) =>
                                  updateFormBody(idx, "value", e.target.value)
                                }
                                style={{
                                  background: "#ffffff",
                                  color: "#111827",
                                  border: "1.5px solid #d1d5db",
                                  borderRadius: "6px",
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeFormBody(idx)}
                                style={{
                                  height: "32px",
                                  background: "#fff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "6px",
                                  color: "#ef4444",
                                  fontWeight: 700,
                                  fontSize: "14px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={addFormBody}
                            style={{
                              background: "#fff",
                              border: "1px dashed #d1d5db",
                              borderRadius: "6px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#374151",
                              cursor: "pointer",
                            }}
                          >
                            + Tambah Field
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mode None */}
                    {bodyMode === "none" && (
                      <div
                        style={{
                          padding: "24px",
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: "13px",
                          fontStyle: "italic",
                        }}
                      >
                        Tidak ada body untuk request ini.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 1.3 cURL Preview (Collapsible) */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "#f8fafc",
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setCurlExpanded((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: "#f1f5f9",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#334155",
                    letterSpacing: "0.04em",
                  }}
                >
                  cURL Preview
                </span>

                {curlExpanded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCurl();
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: curlCopied ? "#059669" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    {curlCopied ? "Tersalin" : "Salin"}
                  </button>
                )}
              </div>

              {curlExpanded && (
                <div style={{ padding: "12px 14px", background: "#f8fafc" }}>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      fontFamily:
                        "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      lineHeight: 1.6,
                      color: "#1e293b",
                    }}
                  >
                    {currentCurl}
                  </pre>
                </div>
              )}
            </div>

            {/* 1.4 History (Collapsible) */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "#f8fafc",
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setHistoryExpanded((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: "#f1f5f9",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#334155",
                    letterSpacing: "0.04em",
                  }}
                >
                  History ({history.length} request)
                </span>

                {historyExpanded && history.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAllHistory();
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      border: "1px solid #fca5a5",
                      background: "#fff",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              {historyExpanded && (
                <div style={{ padding: "12px 14px", background: "#fff" }}>
                  {history.length === 0 ? (
                    <div
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: "12px",
                        fontStyle: "italic",
                      }}
                    >
                      Belum ada riwayat request.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        maxHeight: "260px",
                        overflowY: "auto",
                      }}
                    >
                      {history.map((item) => {
                        const mColor = METHOD_COLOR[item.method] || {
                          bg: "#f1f5f9",
                          text: "#64748b",
                        };
                        const sStyle = getStatusStyle(item.responseStatus);
                        const displayUrl =
                          item.url.length > 38
                            ? item.url.slice(0, 35) + "..."
                            : item.url;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleLoadHistory(item)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 10px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              cursor: "pointer",
                              background: "#f9fafb",
                              transition: "background 0.15s ease",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                overflow: "hidden",
                              }}
                            >
                              <Pill label={item.method} style={mColor} />
                              <Pill
                                label={String(item.responseStatus)}
                                style={sStyle}
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "#374151",
                                  fontFamily:
                                    "'JetBrains Mono', 'Fira Code', monospace",
                                }}
                              >
                                {displayUrl}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flexShrink: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#9ca3af",
                                }}
                              >
                                {formatRelativeTime(item.timestamp)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleDeleteHistoryItem(item.id, e)
                                }
                                title="Hapus item"
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "#9ca3af",
                                  fontSize: "16px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: "0 4px",
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT PANEL: Response Viewer ================= */}
          <div
            className="tester-panel-right"
            style={{
              flex: "1 1 50%",
              width: "50%",
              minWidth: "380px",
              height: "100%",
              maxHeight: "100%",
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "24px 28px",
              background: "#fafafa",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Status Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                minHeight: "52px",
              }}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#4b5563",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: "3px solid #e5e7eb",
                      borderTopColor: GOJEK_GREEN,
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Mengirim request...</span>
                </div>
              ) : response ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  <Pill
                    label={`${response.status} ${response.statusText}`}
                    style={getStatusStyle(response.status)}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      fontWeight: 600,
                    }}
                  >
                    Durasi:{" "}
                    <strong style={{ color: "#111827" }}>
                      {response.duration} ms
                    </strong>
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      fontWeight: 600,
                    }}
                  >
                    Ukuran:{" "}
                    <strong style={{ color: "#111827" }}>
                      {formatBytes(response.size)}
                    </strong>
                  </span>
                </div>
              ) : error ? (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#b91c1c",
                    fontWeight: 600,
                  }}
                >
                  Request Gagal
                </div>
              ) : (
                <span
                  style={{
                    fontSize: "13px",
                    color: "#9ca3af",
                    fontStyle: "italic",
                  }}
                >
                  Kirim request untuk melihat response di sini.
                </span>
              )}
            </div>

            {/* Error Message Box */}
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  color: "#b91c1c",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <strong>Gagal mengirim request:</strong>
                <p style={{ marginTop: "4px", fontFamily: "monospace" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Response Tabs (Body | Headers) */}
            {response && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  flex: 1,
                }}
              >
                {/* Tabs bar */}
                <div
                  style={{
                    display: "flex",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#fff",
                    borderRadius: "8px 8px 0 0",
                    padding: "0 8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveResponseTab("body")}
                    style={{
                      padding: "10px 18px",
                      border: "none",
                      background: "transparent",
                      borderBottom:
                        activeResponseTab === "body"
                          ? `2.5px solid ${GOJEK_GREEN}`
                          : "2.5px solid transparent",
                      color:
                        activeResponseTab === "body" ? "#111827" : "#9ca3af",
                      fontWeight: activeResponseTab === "body" ? 600 : 500,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Response Body
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveResponseTab("headers")}
                    style={{
                      padding: "10px 18px",
                      border: "none",
                      background: "transparent",
                      borderBottom:
                        activeResponseTab === "headers"
                          ? `2.5px solid ${GOJEK_GREEN}`
                          : "2.5px solid transparent",
                      color:
                        activeResponseTab === "headers" ? "#111827" : "#9ca3af",
                      fontWeight: activeResponseTab === "headers" ? 600 : 500,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Response Headers
                  </button>
                </div>

                {/* Tab Content */}
                <div style={{ flex: 1 }}>
                  {activeResponseTab === "body" ? (
                    <CodeBlock
                      value={response.body}
                      label="Response Body"
                      initialMaxHeight="440px"
                    />
                  ) : (
                    <CodeBlock
                      value={response.headers}
                      label="Response Headers"
                      initialMaxHeight="440px"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import cURL Modal */}
      {importCurlModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setImportCurlModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "92vw",
              maxWidth: "680px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
                  Import Perintah cURL
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImportCurlModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "22px",
                  lineHeight: 1,
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
                Tempel perintah cURL dari browser, terminal, atau Postman di bawah ini.
                Method, URL, query params, headers, dan body request akan otomatis diuraikan ke dalam form.
              </p>

              <textarea
                placeholder={`curl -X POST 'https://api.example.com/v1/users?page=1' \\\n  -H 'Authorization: Bearer token123' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{"name":"John"}'`}
                value={curlInputModal}
                onChange={(e) => setCurlInputModal(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "12px 14px",
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  resize: "vertical",
                  lineHeight: 1.6,
                  color: "#111827",
                  background: "#ffffff",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "6px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clip = await navigator.clipboard.readText();
                      if (clip) setCurlInputModal(clip);
                    } catch {
                      // clipboard access denied/unavailable
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: "12px",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Tempel dari Clipboard
                </button>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setImportCurlModalOpen(false);
                      setCurlInputModal("");
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!curlInputModal.trim()) {
                        alert("Silakan tempel perintah cURL terlebih dahulu.");
                        return;
                      }
                      if (handleApplyCurl(curlInputModal)) {
                        setImportCurlModalOpen(false);
                        setCurlInputModal("");
                      }
                    }}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "6px",
                      border: "none",
                      background: GOJEK_GREEN,
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,170,19,0.3)",
                    }}
                  >
                    Import ke Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
