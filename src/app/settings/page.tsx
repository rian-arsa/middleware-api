"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { CopyIcon, CheckIcon } from "@/components/Icons";
import { CREATOR } from "@/lib/creator";

const GREEN = "#00AA13";
const MONO = "var(--code-font, 'JetBrains Mono', Consolas, monospace)";

const UI_FONTS = [
  { id: "default", label: "Default (Arial)", css: "Arial, Helvetica, sans-serif" },
  { id: "geist", label: "Geist", css: "var(--font-geist-sans), sans-serif" },
  { id: "inter", label: "Inter", css: "var(--font-inter), sans-serif" },
  { id: "roboto", label: "Roboto", css: "var(--font-roboto), sans-serif" },
  { id: "jakarta", label: "Plus Jakarta Sans", css: "var(--font-jakarta), sans-serif" },
  { id: "system", label: "System UI", css: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { id: "serif", label: "Serif (Georgia)", css: "Georgia, 'Times New Roman', serif" },
];

const CODE_FONTS = [
  { id: "default", label: "Default", css: "'JetBrains Mono', Consolas, monospace" },
  { id: "jetbrains", label: "JetBrains Mono", css: "var(--font-jetbrains), monospace" },
  { id: "fira", label: "Fira Code", css: "var(--font-fira), monospace" },
  { id: "source", label: "Source Code Pro", css: "var(--font-source-code), monospace" },
  { id: "geist-mono", label: "Geist Mono", css: "var(--font-geist-mono), monospace" },
  { id: "consolas", label: "Consolas / Menlo", css: "Consolas, Menlo, 'Courier New', monospace" },
  { id: "courier", label: "Courier New", css: "'Courier New', Courier, monospace" },
];

const CODE_SIZE_DEFAULT = 12;

const SAMPLE = `POST /pos-b2b/v1/orders
Content-Type: application/json

{
  "orderId": "ORD-1024",
  "status": "PAID",
  "items": [{ "sku": "A-01", "qty": 2 }],
  "total": 125000
}`;

type SectionId = "tampilan" | "env" | "json" | "dokumentasi" | "pembuat";

interface EnvItem {
  envKey: string;
  service: string;
  baseUrl: string;
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
  color: "#0f172a",
};

const h2: React.CSSProperties = { fontSize: 17, fontWeight: 700, marginBottom: 4 };
const sub: React.CSSProperties = { fontSize: 13, color: "#64748b", marginBottom: 18, lineHeight: 1.6 };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", margin: "20px 0 8px" };

function NavIcon({ id }: { id: SectionId }) {
  const p = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (id === "tampilan")
    return (
      <svg {...p}>
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    );
  if (id === "env")
    return (
      <svg {...p}>
        <rect x="2" y="3" width="20" height="8" rx="2" />
        <rect x="2" y="13" width="20" height="8" rx="2" />
        <line x1="6" y1="7" x2="6.01" y2="7" />
        <line x1="6" y1="17" x2="6.01" y2="17" />
      </svg>
    );
  if (id === "json")
    return (
      <svg {...p}>
        <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
        <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
      </svg>
    );
  if (id === "dokumentasi")
    return (
      <svg {...p}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LinkIcon({ id }: { id: string }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (id) {
    case "github":
      return (
        <svg {...p}>
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...p}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case "email":
      return (
        <svg {...p}>
          <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case "donate":
      return (
        <svg {...p}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}

const SECTIONS: { id: SectionId; title: string; desc: string }[] = [
  { id: "tampilan", title: "Tampilan", desc: "Font dan ukuran teks" },
  { id: "env", title: "Environment", desc: "Daftar URL backend" },
  { id: "json", title: "JSON Beautifier", desc: "Rapikan, minify, validasi" },
  { id: "dokumentasi", title: "Dokumentasi", desc: "Panduan teknis dan fitur" },
  { id: "pembuat", title: "Pembuat", desc: "Kontak dan dukungan" },
];

function CopyCell({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      title="Copy"
      aria-label="Copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, padding: 5, cursor: "pointer", color: ok ? GREEN : "#64748b", display: "inline-flex" }}
    >
      {ok ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
    </button>
  );
}

function choiceStyle(active: boolean, family?: string): React.CSSProperties {
  return {
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 10,
    cursor: "pointer",
    border: `1.5px solid ${active ? GREEN : "#e2e8f0"}`,
    background: active ? "#f0fdf4" : "#fff",
    color: "#0f172a",
    fontFamily: family,
  };
}

function AppearanceSection() {
  const [font, setFont] = useState("default");
  const [codeFont, setCodeFont] = useState("default");
  const [codeSize, setCodeSize] = useState(CODE_SIZE_DEFAULT);
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const d = document.documentElement;
      setFont(d.dataset.font || "default");
      setCodeFont(d.dataset.codefont || "default");
      const z = parseInt(localStorage.getItem("app-codesize") || "", 10);
      if (z >= 10 && z <= 28) setCodeSize(z);
      setCustom(Boolean(d.dataset.font || d.dataset.codefont || d.dataset.codesize));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const applyFont = (id: string) => {
    setFont(id);
    document.documentElement.dataset.font = id;
    localStorage.setItem("app-font", id);
    setCustom(true);
  };
  const applyCodeFont = (id: string) => {
    setCodeFont(id);
    document.documentElement.dataset.codefont = id;
    localStorage.setItem("app-codefont", id);
    setCustom(true);
  };
  const applySize = (n: number) => {
    const v = Math.min(28, Math.max(10, n));
    setCodeSize(v);
    const d = document.documentElement;
    d.dataset.codesize = "1";
    d.style.setProperty("--code-size", v + "px");
    localStorage.setItem("app-codesize", String(v));
    setCustom(true);
  };
  const reset = () => {
    const d = document.documentElement;
    delete d.dataset.font;
    delete d.dataset.codefont;
    delete d.dataset.codesize;
    d.style.removeProperty("--code-size");
    ["app-font", "app-codefont", "app-codesize"].forEach((k) => localStorage.removeItem(k));
    setFont("default");
    setCodeFont("default");
    setCodeSize(CODE_SIZE_DEFAULT);
    setCustom(false);
  };

  return (
    <>
      <section style={card}>
        <h2 style={h2}>Font aplikasi</h2>
        <p style={sub}>Dipakai untuk menu, label, tombol, dan teks umum di semua halaman.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
          {UI_FONTS.map((f) => (
            <button key={f.id} type="button" data-keepfont aria-pressed={font === f.id} onClick={() => applyFont(f.id)} style={choiceStyle(font === f.id, f.css)}>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>Aa</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{f.label}</div>
            </button>
          ))}
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Font request dan response</h2>
        <p style={sub}>
          Dipakai untuk body JSON, header, cURL, dan blok kode di Logs, Tester, dan Mocks.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
          {CODE_FONTS.map((f) => (
            <button key={f.id} type="button" data-keepfont aria-pressed={codeFont === f.id} onClick={() => applyCodeFont(f.id)} style={choiceStyle(codeFont === f.id, f.css)}>
              <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.2 }}>{"{ } 0O 1lI"}</div>
              <div style={{ fontSize: 13, marginTop: 6, fontFamily: "inherit" }}>{f.label}</div>
            </button>
          ))}
        </div>

        <div style={label}>Ukuran teks kode</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button type="button" aria-label="Perkecil" onClick={() => applySize(codeSize - 1)} style={stepBtn}>
            -
          </button>
          <input
            type="range"
            min={10}
            max={28}
            value={codeSize}
            onChange={(e) => applySize(Number(e.target.value))}
            aria-label="Ukuran teks kode"
            style={{ flex: "1 1 200px", maxWidth: 320, accentColor: GREEN }}
          />
          <button type="button" aria-label="Perbesar" onClick={() => applySize(codeSize + 1)} style={stepBtn}>
            +
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40 }}>{codeSize}px</span>
        </div>

        <div style={label}>Pratinjau</div>
        <pre
          style={{
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: 10,
            padding: 16,
            overflow: "auto",
            fontFamily: MONO,
            fontSize: `var(--code-size, ${CODE_SIZE_DEFAULT}px)`,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {SAMPLE}
        </pre>

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            disabled={!custom}
            style={{ padding: "8px 16px", borderRadius: 8, cursor: custom ? "pointer" : "not-allowed", fontSize: 13, border: "1px solid #e2e8f0", background: "#fff", color: custom ? "#334155" : "#94a3b8" }}
          >
            Kembalikan ke bawaan
          </button>
          <span style={{ fontSize: 12, color: "#64748b" }}>Tersimpan otomatis di browser ini.</span>
        </div>
      </section>
    </>
  );
}

const stepBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  fontSize: 16,
  cursor: "pointer",
};

function EnvSection() {
  const [items, setItems] = useState<EnvItem[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/env")
      .then((r) => r.json())
      .then((d) => !cancelled && setItems(d.items || []))
      .catch(() => !cancelled && setError("Gagal memuat daftar env."));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = (items || []).filter((i) => (i.envKey + i.baseUrl).toLowerCase().includes(query.toLowerCase()));
  const cell: React.CSSProperties = { padding: "10px 8px", fontFamily: MONO, fontSize: 12 };

  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <h2 style={h2}>Environment URL</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari env atau URL"
          style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: "#fff", minWidth: 220 }}
        />
      </div>
      <p style={sub}>
        Variabel <code>*_URL</code> dari file <code>.env</code> yang dipakai sebagai backend tiap service. Kredensial dan query
        string disembunyikan. Untuk mengubah nilainya, edit <code>.env</code> lalu restart server.
      </p>
      {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
      {!items && !error && <p style={{ fontSize: 13, color: "#64748b" }}>Memuat...</p>}
      {items && filtered.length === 0 && <p style={{ fontSize: 13, color: "#64748b" }}>{items.length === 0 ? "Belum ada env *_URL." : "Tidak ada hasil."}</p>}
      {filtered.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#64748b", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "8px" }}>Env</th>
                <th style={{ padding: "8px" }}>Path service</th>
                <th style={{ padding: "8px" }}>URL backend</th>
                <th style={{ padding: "8px", width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.envKey} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ ...cell, fontWeight: 600 }}>{i.envKey}</td>
                  <td style={{ ...cell, color: "#475569" }}>/{i.service}/...</td>
                  <td style={{ ...cell, wordBreak: "break-all" }}>{i.baseUrl}</td>
                  <td style={{ padding: "8px" }}>
                    <CopyCell text={i.baseUrl} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v !== null && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortDeep(o[k])]));
  }
  return v;
}

function JsonSection() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(2);
  const [sort, setSort] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const run =  (mode: "beautify" | "minify") => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      return;
    }
    try {
      let v: unknown = JSON.parse(input);
      if (sort) v = sortDeep(v);
      setOutput(mode === "minify" ? JSON.stringify(v) : JSON.stringify(v, null, indent === 0 ? "\t" : indent));
      setError("");
    } catch (e) {
      setOutput("");
      const msg = e instanceof Error ? e.message : "JSON tidak valid";
      setError(msg);
    }
  };

  const btn: React.CSSProperties = { padding: "7px 14px", fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#334155" };
  const area: React.CSSProperties = { width: "100%", minHeight: 320, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: MONO, fontSize: 12, lineHeight: 1.6, color: "#0f172a", background: "#fff", resize: "vertical" };

  return (
    <section style={card}>
      <h2 style={h2}>JSON Beautifier</h2>
      <p style={sub}>Tempel JSON mentah, lalu rapikan atau minify. Semua diproses di browser, tidak dikirim ke server.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <button type="button" onClick={() => run("beautify")} style={{ ...btn, background: GREEN, borderColor: GREEN, color: "#fff", fontWeight: 600 }}>Rapikan</button>
        <button type="button" onClick={() => run("minify")} style={btn}>Minify</button>
        <label style={{ fontSize: 13, color: "#334155", display: "inline-flex", gap: 6, alignItems: "center" }}>
          Indent
          <select value={indent} onChange={(e) => setIndent(Number(e.target.value))} style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: "#0f172a" }}>
            <option value={2}>2 spasi</option>
            <option value={4}>4 spasi</option>
            <option value={0}>Tab</option>
          </select>
        </label>
        <label style={{ fontSize: 13, color: "#334155", display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={sort} onChange={(e) => setSort(e.target.checked)} />
          Urutkan key A-Z
        </label>
        <button type="button" onClick={() => { setInput(output || input); setOutput(""); }} style={btn} disabled={!output}>Pakai hasil sebagai input</button>
        <button type="button" onClick={() => { setInput(""); setOutput(""); setError(""); }} style={btn}>Bersihkan</button>
      </div>

      {error && <p role="alert" style={{ fontSize: 13, color: "#991b1b", background: "#fee2e2", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontFamily: MONO }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <div>
          <div style={label}>Input</div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder='{"nama":"contoh","aktif":true}' style={area} aria-label="Input JSON" />
        </div>
        <div>
          <div style={{ ...label, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Hasil</span>
            {output && (
              <span style={{ display: "inline-flex", gap: 6 }}>
                <button type="button" title="Perbesar" aria-label="Perbesar hasil" onClick={() => setExpanded(true)} style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, padding: 5, cursor: "pointer", color: "#64748b", display: "inline-flex" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
                <CopyCell text={output} />
              </span>
            )}
          </div>
          <textarea value={output} readOnly spellCheck={false} placeholder="Hasil muncul di sini" style={{ ...area, background: "#f8fafc" }} aria-label="Hasil JSON" />
        </div>
      </div>

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hasil JSON diperbesar"
          onClick={() => setExpanded(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: "min(1100px, 100%)", height: "min(88vh, 100%)", display: "flex", flexDirection: "column", padding: 18, color: "#0f172a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong style={{ fontSize: 15 }}>Hasil JSON</strong>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <CopyCell text={output} />
                <button type="button" onClick={() => setExpanded(false)} style={btn}>Tutup</button>
              </span>
            </div>
            <textarea value={output} readOnly spellCheck={false} style={{ ...area, flex: 1, minHeight: 0, resize: "none", background: "#f8fafc" }} aria-label="Hasil JSON diperbesar" />
          </div>
        </div>
      )}
    </section>
  );
}

function CreatorSection() {
  const initials = CREATOR.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderLink = (l: { id: string; label: string; desc: string; url: string }) => {
    const enabled = Boolean(l.url);
    const common: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 16px",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      background: "#fff",
      color: "#0f172a",
      textDecoration: "none",
      opacity: enabled ? 1 : 0.55,
    };
    const body = (
      <>
        <span style={{ width: 38, height: 38, borderRadius: 9, background: "#f1f5f9", color: "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LinkIcon id={l.id} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{l.label}</span>
          <span style={{ display: "block", fontSize: 12, color: "#64748b" }}>{enabled ? l.desc : "Belum diatur"}</span>
        </span>
      </>
    );
    return enabled ? (
      <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" style={common}>
        {body}
      </a>
    ) : (
      <div key={l.id} style={common} aria-disabled="true">
        {body}
      </div>
    );
  };

  return (
    <>
      <section style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #00AA13 0%, #00870f 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h2 style={{ ...h2, marginBottom: 2 }}>{CREATOR.name}</h2>
            <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>{CREATOR.role}</div>
          </div>
        </div>
        <p style={{ ...sub, marginTop: 16, marginBottom: 0 }}>{CREATOR.bio}</p>
      </section>

      <section style={card}>
        <h2 style={h2}>Hubungi</h2>
        <p style={sub}>Temukan saya di platform berikut.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>{CREATOR.links.map(renderLink)}</div>
      </section>

      <section style={card}>
        <h2 style={h2}>Dukung</h2>
        <p style={sub}>Jika tool ini membantu, dukungan Anda sangat berarti.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>{CREATOR.support.map(renderLink)}</div>
      </section>
    </>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [section, setSection] = useState<SectionId>("tampilan");

  useEffect(() => {
    const t = setTimeout(() => {
      const h = window.location.hash.replace("#", "") as SectionId;
      if (SECTIONS.some((s) => s.id === h)) setSection(h);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const go = (id: SectionId) => {
    if (id === "dokumentasi") {
      router.push("/docs");
      return;
    }
    setSection(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Header currentTab="settings" subtitle="Pengaturan aplikasi" />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px", display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
        <nav aria-label="Menu pengaturan" style={{ width: 240, flexShrink: 0, position: "sticky", top: 88, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 12px 6px" }}>Pengaturan</div>
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  marginBottom: 2,
                  borderRadius: 8,
                  border: "none",
                  borderLeft: `3px solid ${active ? GREEN : "transparent"}`,
                  background: active ? "#f0fdf4" : "transparent",
                  color: active ? "#0f172a" : "#475569",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: active ? GREEN : "#94a3b8", display: "inline-flex" }}>
                  <NavIcon id={s.id} />
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: active ? 700 : 500 }}>{s.title}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "#94a3b8" }}>{s.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <main style={{ flex: "1 1 520px", minWidth: 0 }}>
          {section === "tampilan" && <AppearanceSection />}
          {section === "env" && <EnvSection />}
          {section === "json" && <JsonSection />}
          {section === "pembuat" && <CreatorSection />}
        </main>
      </div>
    </div>
  );
}
