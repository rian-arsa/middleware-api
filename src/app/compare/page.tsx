"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { inlineSplit, prettyIfJson, sideBySide, type SbsRow } from "@/lib/jsondiff";

const GREEN = "#00AA13";
const MONO = "var(--code-font, 'JetBrains Mono', Consolas, monospace)";

interface LogItem {
  id: string;
  timestamp: string;
  method: string;
  service: string;
  url: string;
  status: number;
  duration: number;
  responseBody: string | null;
  responseHeaders: Record<string, string>;
  mockedBy?: string;
}

interface Side {
  mode: "log" | "paste";
  logId: string;
  text: string;
}

const emptySide: Side = { mode: "log", logId: "", text: "" };

const DEL_BG = "#ffeef0";
const DEL_STRONG = "#fdb8c0";
const ADD_BG = "#e6ffed";
const ADD_STRONG = "#acf2bd";
const EMPTY_BG = "#f6f8fa";
const CONTEXT = 3;

type DisplayItem = { type: "row"; row: SbsRow; idx: number } | { type: "gap"; count: number };

function buildDisplay(rows: SbsRow[], onlyDiff: boolean): DisplayItem[] {
  if (!onlyDiff) return rows.map((row, idx) => ({ type: "row", row, idx }));
  const keep = new Array<boolean>(rows.length).fill(false);
  rows.forEach((r, i) => {
    if (r.kind === "same") return;
    for (let k = Math.max(0, i - CONTEXT); k <= Math.min(rows.length - 1, i + CONTEXT); k++) keep[k] = true;
  });
  const out: DisplayItem[] = [];
  let hidden = 0;
  rows.forEach((row, idx) => {
    if (keep[idx]) {
      if (hidden) out.push({ type: "gap", count: hidden });
      hidden = 0;
      out.push({ type: "row", row, idx });
    } else hidden++;
  });
  if (hidden) out.push({ type: "gap", count: hidden });
  return out;
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, color: "#0f172a" };
const input: React.CSSProperties = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: "#fff", width: "100%" };

function methodColor(m: string) {
  return m === "GET" ? "#16a34a" : m === "POST" ? "#2563eb" : m === "DELETE" ? "#dc2626" : "#d97706";
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "#fde047", color: "inherit", borderRadius: 2 }}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function SidePanel({ title, side, setSide, logs, loading }: { title: string; side: Side; setSide: (s: Side) => void; logs: LogItem[]; loading: boolean }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return logs.filter((l) => !s || `${l.method} ${l.service} ${l.url} ${l.status} ${l.responseBody ?? ""}`.toLowerCase().includes(s));
  }, [logs, q]);

  const tab = (mode: Side["mode"], label: string) => (
    <button
      type="button"
      onClick={() => setSide({ ...side, mode })}
      aria-pressed={side.mode === mode}
      style={{ padding: "6px 14px", fontSize: 13, borderRadius: 7, cursor: "pointer", border: `1px solid ${side.mode === mode ? GREEN : "#e2e8f0"}`, background: side.mode === mode ? "#f0fdf4" : "#fff", color: "#0f172a" }}
    >
      {label}
    </button>
  );

  return (
    <section style={{ ...card, flex: "1 1 380px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {tab("log", "Dari Log")}
          {tab("paste", "Tempel")}
        </div>
      </div>

      {side.mode === "log" ? (
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari method, service, path, status, atau isi response" style={input} aria-label={`Cari log ${title}`} />
          <div style={{ marginTop: 8, maxHeight: 260, overflowY: "auto", border: "1px solid #f1f5f9", borderRadius: 8 }}>
            {loading && <p style={{ padding: 12, fontSize: 13, color: "#64748b" }}>Memuat log...</p>}
            {!loading && filtered.length === 0 && (
              <p style={{ padding: 12, fontSize: 13, color: "#64748b" }}>{logs.length === 0 ? "Belum ada log. Kirim request lewat proxy, atau pakai tab Tempel." : "Tidak ada hasil."}</p>
            )}
            {filtered.map((l) => {
              const active = l.id === side.logId;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSide({ ...side, logId: l.id })}
                  aria-pressed={active}
                  style={{ display: "flex", gap: 8, alignItems: "center", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", borderBottom: "1px solid #f1f5f9", borderLeft: `3px solid ${active ? GREEN : "transparent"}`, background: active ? "#f0fdf4" : "#fff", cursor: "pointer", color: "#0f172a", fontSize: 12 }}
                >
                  <span style={{ fontWeight: 700, color: methodColor(l.method), minWidth: 44 }}>{l.method}</span>
                  <span style={{ fontFamily: MONO, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <Highlight text={l.url} q={q} />
                  </span>
                  <span style={{ color: l.status >= 400 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{l.status}</span>
                  <span style={{ color: "#94a3b8" }}>{new Date(l.timestamp).toLocaleTimeString("id-ID")}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <textarea
          value={side.text}
          onChange={(e) => setSide({ ...side, text: e.target.value })}
          placeholder="Tempel response JSON atau teks di sini"
          spellCheck={false}
          style={{ ...input, minHeight: 260, fontFamily: MONO, fontSize: 12, resize: "vertical", lineHeight: 1.5 }}
          aria-label={`Isi ${title}`}
        />
      )}
    </section>
  );
}

function getBody(side: Side, logs: LogItem[]): { body: string; headers: string; meta: string } | null {
  if (side.mode === "paste") return side.text.trim() ? { body: side.text, headers: "{}", meta: "Teks tempel" } : null;
  const l = logs.find((x) => x.id === side.logId);
  if (!l) return null;
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(l.responseHeaders || {})) lower[k.toLowerCase()] = v;
  return { body: prettyIfJson(l.responseBody), headers: JSON.stringify(lower), meta: `${l.method} ${l.url} | ${l.status} | ${l.duration} ms` };
}

export default function ComparePage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [a, setA] = useState<Side>(emptySide);
  const [b, setB] = useState<Side>(emptySide);
  const [target, setTarget] = useState<"body" | "headers">("body");
  const [ignore, setIgnore] = useState("");
  const [search, setSearch] = useState("");
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [sortKeys, setSortKeys] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/logs")
      .then((r) => r.json())
      .then((d: LogItem[]) => setLogs(Array.isArray(d) ? d : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const da = getBody(a, logs);
  const db = getBody(b, logs);

  const result = useMemo(() => {
    if (!da || !db) return null;
    const keys = ignore.split(",");
    return sideBySide(target === "body" ? da.body : da.headers, target === "body" ? db.body : db.headers, keys, sortKeys);
  }, [da, db, target, ignore, sortKeys]);

  const q = search.trim();
  const display = useMemo(() => buildDisplay(result?.rows || [], onlyDiff), [result, onlyDiff]);
  const diffCount = result ? result.counts.changed + result.counts.added + result.counts.removed : 0;
  const matchCount = q && result ? result.rows.filter((r) => `${r.left?.text ?? ""}\n${r.right?.text ?? ""}`.toLowerCase().includes(q.toLowerCase())).length : 0;

  const swap = () => {
    setA(b);
    setB(a);
  };

  const lineNo: React.CSSProperties = { width: 46, minWidth: 46, padding: "1px 8px", textAlign: "right", color: "#94a3b8", fontFamily: MONO, fontSize: 12, userSelect: "none", verticalAlign: "top", borderRight: "1px solid #e5e7eb" };
  const code: React.CSSProperties = { padding: "1px 10px", fontFamily: MONO, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all", verticalAlign: "top", color: "#0f172a" };

  const renderText = (r: SbsRow, side: "left" | "right") => {
    const line = r[side];
    if (!line) return null;
    if (q) return <Highlight text={line.text} q={q} />;
    if (r.kind === "changed" && r.left && r.right) {
      const s = inlineSplit(r.left.text, r.right.text);
      const mid = side === "left" ? s.midA : s.midB;
      return (
        <>
          {s.pre}
          <span style={{ background: side === "left" ? DEL_STRONG : ADD_STRONG, borderRadius: 2 }}>{mid}</span>
          {s.post}
        </>
      );
    }
    return line.text;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Header currentTab="compare" subtitle="Bandingkan hasil response" />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
          <SidePanel title="Response A" side={a} setSide={setA} logs={logs} loading={loading} />
          <SidePanel title="Response B" side={b} setSide={setB} logs={logs} loading={loading} />
        </div>

        <div style={{ display: "flex", gap: 10, margin: "14px 0", flexWrap: "wrap" }}>
          <button type="button" onClick={swap} style={{ padding: "7px 14px", fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#334155" }}>
            Tukar A dan B
          </button>
          <button type="button" onClick={load} style={{ padding: "7px 14px", fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#334155" }}>
            Muat ulang log
          </button>
        </div>

        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Hasil perbandingan</h2>

          {!result && <p style={{ fontSize: 13, color: "#64748b" }}>Pilih atau tempel response di kedua sisi untuk melihat perbedaannya.</p>}

          {result && da && db && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 8, fontSize: 12, color: "#475569", marginBottom: 14 }}>
                <div><b>A:</b> <span style={{ fontFamily: MONO }}>{da.meta}</span></div>
                <div><b>B:</b> <span style={{ fontFamily: MONO }}>{db.meta}</span></div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["body", "headers"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTarget(t)} aria-pressed={target === t} style={{ padding: "6px 14px", fontSize: 13, borderRadius: 7, cursor: "pointer", border: `1px solid ${target === t ? GREEN : "#e2e8f0"}`, background: target === t ? "#f0fdf4" : "#fff", color: "#0f172a" }}>
                      {t === "body" ? "Body" : "Header"}
                    </button>
                  ))}
                </div>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari path atau nilai pada hasil" style={{ ...input, flex: "1 1 240px", width: "auto" }} aria-label="Cari pada hasil" />
                <input value={ignore} onChange={(e) => setIgnore(e.target.value)} placeholder="Abaikan key (pisah koma), mis. timestamp, id" style={{ ...input, flex: "1 1 240px", width: "auto" }} aria-label="Abaikan key" />
              </div>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 12, fontSize: 13, color: "#334155" }}>
                <label style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
                  Hanya tampilkan perbedaan
                </label>
                {result.isJson && (
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
                    Urutkan key A-Z
                  </label>
                )}
                {q && <span style={{ color: "#64748b" }}>{matchCount} baris cocok</span>}
              </div>

              {diffCount === 0 ? (
                <p style={{ fontSize: 13, color: "#166534", background: "#dcfce7", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                  Kedua {target === "body" ? "body" : "header"} identik{ignore.trim() ? " (setelah key yang diabaikan dikecualikan)" : ""}.
                </p>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, fontSize: 12, fontWeight: 600 }}>
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: "#f1f5f9", color: "#0f172a" }}>{diffCount} perbedaan</span>
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: "#fef3c7", color: "#92400e" }}>{result.counts.changed} berubah</span>
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: DEL_BG, color: "#991b1b" }}>{result.counts.removed} dihapus</span>
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: ADD_BG, color: "#166534" }}>{result.counts.added} ditambah</span>
                </div>
              )}

              {!result.isJson && <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Salah satu sisi bukan JSON valid, dibandingkan sebagai teks per baris.</p>}

              <div style={{ overflow: "auto", maxHeight: "70vh", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: 46 }} />
                    <col />
                    <col style={{ width: 46 }} />
                    <col />
                  </colgroup>
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr style={{ background: "#f8fafc", textAlign: "left", fontSize: 12, color: "#64748b" }}>
                      <th colSpan={2} style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb" }}>A (asli)</th>
                      <th colSpan={2} style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb", borderLeft: "1px solid #e5e7eb" }}>B (pembanding)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {display.slice(0, 3000).map((it, i) =>
                      it.type === "gap" ? (
                        <tr key={`g${i}`}>
                          <td colSpan={4} style={{ padding: "4px 10px", fontSize: 12, color: "#64748b", background: "#f1f5f9", textAlign: "center" }}>
                            {it.count} baris sama disembunyikan
                          </td>
                        </tr>
                      ) : (
                        <tr key={it.idx}>
                          <td style={{ ...lineNo, background: it.row.left ? (it.row.kind === "same" ? "#fff" : DEL_BG) : EMPTY_BG }}>{it.row.left?.n}</td>
                          <td style={{ ...code, background: it.row.left ? (it.row.kind === "same" ? "#fff" : DEL_BG) : EMPTY_BG }}>{renderText(it.row, "left")}</td>
                          <td style={{ ...lineNo, borderLeft: "1px solid #e5e7eb", background: it.row.right ? (it.row.kind === "same" ? "#fff" : ADD_BG) : EMPTY_BG }}>{it.row.right?.n}</td>
                          <td style={{ ...code, background: it.row.right ? (it.row.kind === "same" ? "#fff" : ADD_BG) : EMPTY_BG }}>{renderText(it.row, "right")}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              {display.length > 3000 && <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Hanya 3000 baris pertama yang ditampilkan. Aktifkan "Hanya tampilkan perbedaan" atau abaikan key.</p>}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
