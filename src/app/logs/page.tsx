"use client";

import { useEffect, useState, useCallback } from "react";

interface LogEntry {
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

const METHOD_COLOR: Record<string, { bg: string; text: string }> = {
  GET:    { bg: "#e8f4fd", text: "#1a6fa8" },
  POST:   { bg: "#e6f9ec", text: "#177a37" },
  PUT:    { bg: "#fff4e5", text: "#b35c00" },
  PATCH:  { bg: "#f3eeff", text: "#6931c7" },
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "#9ca3af",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "8px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {title}
      </p>
      {children}
    </div>
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

/** Menghasilkan perintah cURL yang siap dijalankan dari LogEntry */
function generateCurl(log: LogEntry): string {
  const lines: string[] = [`curl -X ${log.method} '${log.url}'`];

  const skipHeaders = new Set([
    "host",
    "connection",
    "content-length",
    "accept-encoding",
    "sec-fetch-mode",
    "sec-fetch-site",
    "sec-fetch-dest",
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
    "upgrade-insecure-requests",
  ]);

  if (log.requestHeaders) {
    for (const [key, value] of Object.entries(log.requestHeaders)) {
      if (skipHeaders.has(key.toLowerCase())) continue;
      const escapedVal = String(value).replace(/'/g, `'\\''`);
      lines.push(`  -H '${key}: ${escapedVal}'`);
    }
  }

  if (log.requestBody && log.method !== "GET" && log.method !== "HEAD") {
    const escapedBody = log.requestBody.replace(/'/g, `'\\''`);
    lines.push(`  --data-raw '${escapedBody}'`);
  }

  return lines.join(" \\\n");
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
  const highlighted = isJson && mode === "formatted"
    ? highlightJson(formattedText)
    : null;

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
                  onClick={() => setMode("formatted")}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "4px",
                    border: "none",
                    background: mode === "formatted" ? "#fff" : "transparent",
                    boxShadow: mode === "formatted" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
                  onClick={() => setMode("raw")}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "4px",
                    border: "none",
                    background: mode === "raw" ? "#fff" : "transparent",
                    boxShadow: mode === "raw" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
            {/* Toggle Full Height */}
            <button
              onClick={() => setIsFullHeight((prev) => !prev)}
              title={isFullHeight ? "Kembalikan tinggi standar" : "Tampilkan seluruh isi tanpa scroll"}
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

            {/* Toggle Fullscreen Modal */}
            <button
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

            {/* Copy button */}
            <button
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
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
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
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
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
            {/* Modal Header */}
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
                <span style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>
                  {label ?? "Detail Viewer"}
                </span>
                {isJson && (
                  <div style={{ display: "flex", gap: "4px", background: "#e2e8f0", padding: "2px", borderRadius: "6px" }}>
                    <button
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
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
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

            {/* Modal Body */}
            <div style={{ flex: 1, overflow: "auto", padding: "20px", background: "#f8fafc" }}>
              {highlighted ? (
                <pre
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: 1.7,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
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
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
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

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "#9ca3af",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          background: "#fff",
          color: "#111827",
          border: "1.5px solid #e5e7eb",
          borderRadius: "8px",
          padding: "7px 12px",
          fontSize: "13px",
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
          cursor: "pointer",
          outline: "none",
          minWidth: "120px",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [filterMethod, setFilterMethod] = useState("Semua Method");
  const [filterService, setFilterService] = useState("Semua Service");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [polling, setPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [clearing, setClearing] = useState(false);
  const [panelWide, setPanelWide] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);

  const handleCopyCurl = async () => {
    if (!selected) return;
    try {
      const curl = generateCurl(selected);
      await navigator.clipboard.writeText(curl);
      setCurlCopied(true);
      setTimeout(() => setCurlCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      const data: LogEntry[] = await res.json();
      setLogs(data);
      setLastUpdate(new Date());
    } catch {
      // fail silently
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [polling, fetchLogs]);

  const handleClear = async () => {
    setClearing(true);
    await fetch("/api/logs", { method: "DELETE" });
    setLogs([]);
    setSelected(null);
    setClearing(false);
  };

  const services = ["Semua Service", ...Array.from(new Set(logs.map((l) => l.service)))];
  const methods = ["Semua Method", "GET", "POST", "PUT", "PATCH", "DELETE"];
  const statuses = ["Semua Status", "2xx", "3xx", "4xx", "5xx"];

  const filtered = logs.filter((log) => {
    if (filterMethod !== "Semua Method" && log.method !== filterMethod) return false;
    if (filterService !== "Semua Service" && log.service !== filterService) return false;
    if (filterStatus !== "Semua Status") {
      const prefix = parseInt(filterStatus[0]);
      if (Math.floor(log.status / 100) !== prefix) return false;
    }
    return true;
  });

  const GOJEK_GREEN = "#00AA13";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f9fafb; color: #111827; font-family: 'Inter', 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        tr.log-row { cursor: pointer; transition: background 0.1s; }
        tr.log-row:hover td { background: #f0fdf4; }
        tr.log-row.selected td { background: #dcfce7; }
        button { font-family: 'Inter', sans-serif; }
        select:focus { border-color: #00AA13 !important; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            padding: "0 32px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Gojek-style logo strip */}
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
                Middleware Logger
              </p>
              <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
                {lastUpdate
                  ? `Terakhir diperbarui pukul ${lastUpdate.toLocaleTimeString("id-ID")}`
                  : "Menghubungkan..."}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Live indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1.5px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
              onClick={() => setPolling((p) => !p)}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: polling ? GOJEK_GREEN : "#d1d5db",
                  display: "inline-block",
                  animation: polling ? "blink 1.5s infinite" : "none",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: polling ? "#111827" : "#9ca3af",
                }}
              >
                {polling ? "Live" : "Paused"}
              </span>
            </div>

            <button
              onClick={fetchLogs}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: "1.5px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>

            <button
              onClick={handleClear}
              disabled={clearing || logs.length === 0}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: "1.5px solid #fca5a5",
                background: "#fff",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: 600,
                cursor: logs.length === 0 ? "not-allowed" : "pointer",
                opacity: logs.length === 0 ? 0.4 : 1,
              }}
            >
              Hapus Log
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            padding: "14px 32px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <SelectFilter
            label="Method"
            value={filterMethod}
            options={methods}
            onChange={setFilterMethod}
          />
          <SelectFilter
            label="Service"
            value={filterService}
            options={services}
            onChange={setFilterService}
          />
          <SelectFilter
            label="Status"
            value={filterStatus}
            options={statuses}
            onChange={setFilterStatus}
          />

          <div style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
            <p
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              {filtered.length} dari {logs.length} request
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Table */}
          <div
            style={{
              flex: selected ? "0 0 58%" : "1",
              overflowY: "auto",
              borderRight: selected ? "1px solid #e5e7eb" : "none",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "60vh",
                  gap: "12px",
                  color: "#9ca3af",
                }}
              >
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#374151" }}>
                  {logs.length === 0 ? "Belum ada request" : "Tidak ada hasil filter"}
                </p>
                <p style={{ fontSize: "13px" }}>
                  {logs.length === 0
                    ? "Kirim request melalui middleware untuk melihat log di sini."
                    : "Coba ubah filter di atas."}
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Waktu", "Method", "Service", "Path", "Status", "Durasi"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "11px 16px",
                          textAlign: "left",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#9ca3af",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          background: "#fff",
                          borderBottom: "2px solid #e5e7eb",
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          whiteSpace: "nowrap",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => {
                    const isSelected = selected?.id === log.id;
                    return (
                      <tr
                        key={log.id}
                        className={`log-row${isSelected ? " selected" : ""}`}
                        onClick={() => setSelected(isSelected ? null : log)}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "12px",
                            color: "#6b7280",
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <Pill
                            label={log.method}
                            style={METHOD_COLOR[log.method] ?? { bg: "#f1f5f9", text: "#374151" }}
                          />
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#111827",
                            fontFamily: "'Inter', sans-serif",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          {log.service}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "12px",
                            color: "#6b7280",
                            fontFamily: "monospace",
                            maxWidth: 280,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                          title={log.url}
                        >
                          {(() => {
                            try {
                              return new URL(log.url).pathname;
                            } catch {
                              return log.url;
                            }
                          })()}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <Pill
                            label={String(log.status)}
                            style={getStatusStyle(log.status)}
                          />
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "12px",
                            fontFamily: "monospace",
                            color: log.duration > 1000 ? "#b35c00" : "#6b7280",
                            whiteSpace: "nowrap",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          {log.duration} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div
              style={{
                flex: panelWide ? "0 0 65%" : "0 0 42%",
                transition: "flex 0.2s ease-in-out",
                overflowY: "auto",
                background: "#fff",
                padding: "24px 28px",
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Pill
                    label={selected.method}
                    style={METHOD_COLOR[selected.method] ?? { bg: "#f1f5f9", text: "#374151" }}
                  />
                  <Pill
                    label={String(selected.status)}
                    style={getStatusStyle(selected.status)}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      fontFamily: "monospace",
                    }}
                  >
                    {selected.duration} ms
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={handleCopyCurl}
                    title="Salin request ini sebagai perintah cURL"
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: curlCopied ? "#00AA13" : "#00AA13",
                      background: curlCopied ? "#e6f9ec" : "#00AA13",
                      color: curlCopied ? "#00AA13" : "#fff",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {curlCopied ? "✓ cURL Tersalin" : "Salin cURL"}
                  </button>
                  <button
                    onClick={() => setPanelWide((prev) => !prev)}
                    title={panelWide ? "Perkecil panel (42%)" : "Perlebar panel (65%)"}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      background: panelWide ? "#f1f5f9" : "#fff",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {panelWide ? "Normal (42%)" : "Perlebar (65%)"}
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9ca3af",
                      fontSize: "20px",
                      cursor: "pointer",
                      lineHeight: 1,
                      padding: "2px 6px",
                    }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              <Section title="Timestamp">
                <p style={{ fontSize: "13px", color: "#374151", fontFamily: "monospace" }}>
                  {new Date(selected.timestamp).toLocaleString("id-ID")}
                </p>
              </Section>

              <Section title="URL">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#374151",
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                      lineHeight: 1.6,
                      flex: 1,
                    }}
                  >
                    {selected.url}
                  </p>
                  <button
                    onClick={handleCopyCurl}
                    title="Salin sebagai perintah cURL"
                    style={{
                      flexShrink: 0,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: curlCopied ? "#00AA13" : "#4b5563",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {curlCopied ? "✓ Tersalin" : "Salin cURL"}
                  </button>
                </div>
              </Section>

              {Object.keys(selected.queryParams).length > 0 && (
                <Section title="Query Params">
                  <CodeBlock value={selected.queryParams} />
                </Section>
              )}

              <Section title="Request Headers">
                <CodeBlock value={selected.requestHeaders} />
              </Section>

              {selected.requestBody && (
                <Section title="Request Body">
                  <CodeBlock
                    value={selected.requestBody}
                    label="Request Body"
                    initialMaxHeight="380px"
                  />
                </Section>
              )}

              <div
                style={{
                  height: 1,
                  background: "#e5e7eb",
                  margin: "20px 0",
                }}
              />

              <Section title="Response Headers">
                <CodeBlock value={selected.responseHeaders} label="Response Headers" />
              </Section>

              {selected.responseBody && (
                <Section title="Response Body">
                  <CodeBlock
                    value={selected.responseBody}
                    label="Response Body"
                    initialMaxHeight="520px"
                  />
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
