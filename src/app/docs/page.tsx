"use client";

import React, { useState } from "react";
import Header from "@/components/Header";

const GOJEK_GREEN = "#00AA13";

interface CodeSnippetProps {
  title?: string;
  tabs?: { label: string; code: string; language?: string }[];
  singleCode?: string;
}

function CodeBox({ title, tabs, singleCode }: CodeSnippetProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentCode = tabs ? tabs[activeTab].code : singleCode || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "#0f172a",
        margin: "14px 0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          </div>
          {title && (
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginLeft: "6px" }}>
              {title}
            </span>
          )}
          {tabs && (
            <div style={{ display: "flex", gap: "4px", marginLeft: "10px" }}>
              {tabs.map((tab, idx) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "5px",
                    border: "none",
                    background: activeTab === idx ? "#334155" : "transparent",
                    color: activeTab === idx ? "#38bdf8" : "#94a3b8",
                    fontSize: "11px",
                    fontWeight: activeTab === idx ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid #475569",
            background: copied ? "#059669" : "#334155",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {copied ? "✓ Tersalin" : "Salin Kode"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "16px",
          color: "#e2e8f0",
          fontSize: "12.5px",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          lineHeight: 1.6,
          overflowX: "auto",
        }}
      >
        <code>{currentCode}</code>
      </pre>
    </div>
  );
}

function Callout({ type = "info", title, children }: { type?: "info" | "tip" | "warning"; title: string; children: React.ReactNode }) {
  const styles = {
    info: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", title: "#14532d", icon: "💡" },
    tip: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", title: "#1e3a8a", icon: "✨" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", title: "#78350f", icon: "⚠️" },
  }[type];

  return (
    <div
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: "10px",
        padding: "14px 18px",
        margin: "16px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span>{styles.icon}</span>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: styles.title, margin: 0 }}>
          {title}
        </h4>
      </div>
      <div style={{ fontSize: "12.5px", color: styles.text, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const sections = [
    { id: "overview", label: "1. Pengenalan & Arsitektur", icon: "🏛️" },
    { id: "gateway", label: "2. Proxy Gateway & CORS", icon: "🌐" },
    { id: "logs", label: "3. Live Logs & Inspector", icon: "📊" },
    { id: "mocks", label: "4. Mock API Manager", icon: "🎭" },
    { id: "tester", label: "5. API Tester & cURL Client", icon: "⚡" },
    { id: "examples", label: "6. Contoh Integrasi Frontend", icon: "💻" },
    { id: "faq", label: "7. FAQ & Troubleshooting", icon: "❓" },
  ];

  const filteredSections = sections.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #f8fafc;
          color: #1e293b;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color-scheme: light;
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        code {
          background: #e2e8f0;
          color: #0f172a;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
        }
        pre code {
          background: transparent !important;
          color: inherit !important;
          padding: 0 !important;
        }
        a.docs-sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          color: #475569;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        a.docs-sidebar-link:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        a.docs-sidebar-link.active {
          background: #ecfdf5;
          color: #00AA13;
          font-weight: 700;
        }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Navigation Header */}
        <Header
          currentTab="docs"
          subtitle="Dokumentasi Lengkap, Arsitektur & Panduan Integrasi"
        />

        {/* 2-Column Documentation Container */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Sidebar: TOC */}
          <aside
            style={{
              width: "290px",
              background: "#ffffff",
              borderRight: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              padding: "20px 16px",
              overflowY: "auto",
            }}
          >
            {/* Search filter */}
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Cari bab dokumentasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: "#f8fafc",
                  color: "#0f172a",
                }}
              />
            </div>

            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.06em", marginBottom: "8px", paddingLeft: "8px" }}>
              Daftar Isi Dokumentasi
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {filteredSections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(sec.id);
                  }}
                  className={`docs-sidebar-link ${activeSection === sec.id ? "active" : ""}`}
                >
                  <span style={{ fontSize: "14px" }}>{sec.icon}</span>
                  <span>{sec.label}</span>
                </a>
              ))}
            </nav>

            <div style={{ marginTop: "auto", paddingTop: "20px" }}>
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  🚀 Butuh Coba Endpoint?
                </div>
                <p style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.4, marginBottom: "8px" }}>
                  Buka tab API Tester untuk mencoba langsung request ke backend via middleware.
                </p>
                <a
                  href="/tester"
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: GOJEK_GREEN,
                    textDecoration: "none",
                  }}
                >
                  Buka API Tester &rarr;
                </a>
              </div>
            </div>
          </aside>

          {/* Right Main Content */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "36px 48px",
              maxWidth: "1050px",
              margin: "0 auto",
            }}
          >
            {/* Header Title Hero */}
            <div style={{ marginBottom: "32px", borderBottom: "1px solid #e2e8f0", paddingBottom: "24px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "4px 10px", borderRadius: "100px", color: "#059669", fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>
                <span>📖 Developer Documentation</span>
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                Dokumentasi Resmi Middleware Studio
              </h1>
              <p style={{ fontSize: "14.5px", color: "#64748b", lineHeight: 1.6 }}>
                Panduan komprehensif mengenai arsitektur Proxy Gateway, integrasi CORS Bypass, pemantauan trafik HTTP real-time, simulasi endpoint dengan Mock Engine, dan pengujian API via API Tester.
              </p>
            </div>

            {/* Section 1: Overview & Architecture */}
            <section id="overview" style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>🏛️</span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  1. Pengenalan & Arsitektur
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Dalam pengembangan aplikasi modern (misalnya Next.js, React, Vue, atau Mobile Apps), pengembang sering menghadapi kendala:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", marginBottom: "6px" }}>
                    ❌ Masalah Umum Frontend
                  </h4>
                  <ul style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, paddingLeft: "18px" }}>
                    <li><strong>CORS Blocker:</strong> Backend staging/production menolak request yang berasal dari <code>localhost</code>.</li>
                    <li><strong>Log Tercecer:</strong> Request SSR ada di terminal, request CSR ada di DevTools Network browser.</li>
                    <li><strong>Backend Belum Siap:</strong> Frontend terhambat menunggu API baru selesai dibuat oleh tim Backend.</li>
                  </ul>
                </div>

                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: GOJEK_GREEN, marginBottom: "6px" }}>
                    ✅ Solusi Middleware Studio
                  </h4>
                  <ul style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, paddingLeft: "18px" }}>
                    <li><strong>Bypass CORS Penuh:</strong> Proxy lokal menambahkan header CORS yang valid ke seluruh respon.</li>
                    <li><strong>Satu Tempat Monitoring:</strong> Seluruh trafik SSR & CSR otomatis tercatat di <code>/logs</code>.</li>
                    <li><strong>Mock API Instan:</strong> Simulasikan respon endpoint secara mandiri kapan saja di <code>/mocks</code>.</li>
                  </ul>
                </div>
              </div>

              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Diagram Alur Kerja Request
              </h3>
              <CodeBox
                title="Arsitektur Aliran Data (Flowchart)"
                singleCode={`[Frontend Client] (React / Next.js / Mobile)
        │
        │ 1. Kirim request ke http://localhost:4000/[service]/[endpoint]
        ▼
[Middleware Studio Core]
        │
        ├─► [Mock Engine]: Apakah ada Mock aktif yang cocok di mocks.json?
        │       │
        │       ├─► (YA)  Tunggu simulasi delayMs ──► Kembalikan Mock Response + CORS Headers
        │       │
        │       └─► (TIDAK) Lanjutkan ke Proxy Forwarder
        │
        ├─► [Proxy Forwarder]:
        │       1. Ambil target URL dari .env (<SERVICE>_URL)
        │       2. Bersihkan hop-by-hop headers (host, connection, dll.)
        │       3. Kirim request ke Backend asli
        │       4. Tambahkan header CORS (Access-Control-Allow-Origin: *)
        │       5. Catat log request, response, status, & durasi ke Log Store
        │
        ▼
[Target Backend Service] (Kong Gateway / Microservice / Staging API)`}
              />
            </section>

            {/* Section 2: Gateway & CORS */}
            <section id="gateway" style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>🌐</span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  2. Proxy Gateway & CORS Bypass
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Proxy Gateway menerima request dari aplikasi Anda dan meneruskannya ke backend yang sesuai berdasarkan segmen pertama URL (*service name*).
              </p>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Pola URL Gateway:
              </h3>
              <div style={{ background: "#0f172a", color: "#38bdf8", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontFamily: "monospace", marginBottom: "14px" }}>
                http://localhost:4000/[nama-service]/[path-endpoint]?query=value
              </div>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Konfigurasi <code>.env</code>
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
                Daftarkan URL backend target pada file <code>.env</code> dengan aturan: nama service di URL diubah menjadi huruf besar, tanda hubung (<code>-</code>) diubah menjadi garis bawah (<code>_</code>), lalu ditambah akhiran <code>_URL</code>.
              </p>

              <CodeBox
                title="Contoh .env"
                singleCode={`# Konfigurasi Backend Targets
KONG_URL=https://kong.staging.eratech.id
USER_SERVICE_URL=https://user-api.internal.id
INVENTORY_SERVICE_URL=https://inventory.internal.id/api/v2
AUTH_URL=https://auth.internal.id`}
              />

              <div style={{ overflowX: "auto", margin: "16px 0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left", background: "#ffffff", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Request dari Frontend</th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Env Key</th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>URL Akhir yang Dihubungi BE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#0f172a" }}>/kong/v1/business-unit</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#6366f1" }}>KONG_URL</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#059669" }}>https://kong.../v1/business-unit</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#0f172a" }}>/user-service/users/profile</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#6366f1" }}>USER_SERVICE_URL</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#059669" }}>https://user-api.../users/profile</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#0f172a" }}>/auth/oauth/token</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#6366f1" }}>AUTH_URL</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#059669" }}>https://auth.../oauth/token</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Callout type="warning" title="Reserved Routes">
                Nama service berikut tidak boleh digunakan sebagai nama service backend karena digunakan oleh halaman dan API internal aplikasi: <code>logs</code>, <code>api</code>, <code>mocks</code>, <code>tester</code>, dan <code>docs</code>.
              </Callout>
            </section>

            {/* Section 3: Live Logs */}
            <section id="logs" style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>📊</span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  3. Live Logs & Traffic Inspector (/logs)
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Halaman <strong>Live Logs</strong> menyajikan visibilitas 100% terhadap setiap traffic HTTP yang melintasi middleware.
              </p>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Fitur Unggulan di Halaman Logs:
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    🔴 Live Polling Indicator
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Log diperbarui otomatis setiap beberapa detik tanpa perlu reload halaman. Anda dapat mem-pause polling kapan saja dengan menekan tombol <strong>Live / Paused</strong>.
                  </p>
                </div>
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    🔍 Filter Multi-Dimensi
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Saring traffic secara instan berdasarkan <strong>HTTP Method</strong> (GET, POST, dsb), <strong>Service</strong>, dan <strong>Status Code</strong> (2xx, 3xx, 4xx, 5xx).
                  </p>
                </div>
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    📋 Salin Perintah cURL
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Tiap log yang dipilih memiliki tombol <strong>Salin cURL</strong> untuk mereproduksi request yang persis sama langsung di terminal developer.
                  </p>
                </div>
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    ⚡ Simpan Langsung Jadi Mock
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Menemukan respon backend yang ingin Anda simulasikan? Klik tombol <strong>Simpan jadi Mock</strong> di panel detail log, dan endpoint tersebut otomatis menjadi Mock API aktif!
                  </p>
                </div>
              </div>

              <Callout type="tip" title="JSON Formatter & Fullscreen">
                Pada panel Request & Response Body, terdapat tombol switch antara <strong>Formatted JSON</strong> (dengan syntax highlighting) dan <strong>Raw Text</strong>, serta tombol <strong>Fullscreen</strong> untuk membaca payload JSON berukuran besar dengan nyaman.
              </Callout>
            </section>

            {/* Section 4: Mock API Manager */}
            <section id="mocks" style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>🎭</span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  4. Mock API Manager (/mocks)
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Mock Manager memungkinkan pengembang merekayasa respon API apa pun tanpa menyentuh backend sama sekali.
              </p>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Konfigurasi Mock:
              </h3>
              <ul style={{ fontSize: "13px", color: "#475569", lineHeight: 1.8, paddingLeft: "20px", marginBottom: "16px" }}>
                <li><strong>Nama Mock:</strong> Label identifikasi (misal: <em>GET /users - Simulasi User Kosong</em>).</li>
                <li><strong>Method & Service & Path:</strong> Kombinasi kunci pencocokan request (misal: <code>GET</code>, service <code>kong</code>, path <code>/v1/users</code>).</li>
                <li><strong>HTTP Status:</strong> Status code yang dikembalikan (misal: <code>200 OK</code>, <code>400 Bad Request</code>, <code>401 Unauthorized</code>, atau <code>500 Internal Error</code>).</li>
                <li><strong>Delay Simulasi (ms):</strong> Jeda waktu sebelum respon dikembalikan (misal: <code>1500 ms</code> untuk menguji komponen skeleton loading / UI spin loader).</li>
                <li><strong>Response Headers:</strong> JSON object berisi header kustom (otomatis di-merge dengan CORS headers).</li>
                <li><strong>Response Body:</strong> String teks atau JSON respon yang diinginkan.</li>
                <li><strong>Toggle Aktif:</strong> Saklar on/off untuk mengaktifkan atau menonaktifkan mock secara instan.</li>
              </ul>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Contoh Kasus Penggunaan Mock:
              </h3>
              <CodeBox
                title="Skenario: Pengujian Error 500 dan UI Fallback"
                tabs={[
                  {
                    label: "Konfigurasi Mock",
                    code: `Method        : GET
Service       : kong
Path          : /v1/checkout/payment-methods
Status Code   : 500
Delay Latensi : 800 ms
Response Body : {
  "status": "error",
  "code": "PG_SERVICE_UNAVAILABLE",
  "message": "Payment gateway sedang dalam pemeliharaan berkala."
}`,
                  },
                  {
                    label: "Hasil Uji di Frontend",
                    code: `// Frontend menerima status 500 dan menampilkan UI Banner Error dengan benar:
{
  "status": "error",
  "code": "PG_SERVICE_UNAVAILABLE",
  "message": "Payment gateway sedang dalam pemeliharaan berkala."
}`,
                  },
                ]}
              />
            </section>

            {/* Section 5: API Tester */}
            <section id="tester" style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>⚡</span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  5. API Tester & cURL Importer (/tester)
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Tidak perlu membuka aplikasi terpisah seperti Postman atau Insomnia. Middleware Studio menyediakan HTTP client interaktif langsung di tab <strong>API Tester</strong>.
              </p>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Langkah Cepat Menggunakan API Tester:
              </h3>
              <ol style={{ fontSize: "13px", color: "#475569", lineHeight: 1.8, paddingLeft: "20px", marginBottom: "16px" }}>
                <li>Pilih HTTP Method (<code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>PATCH</code>, <code>DELETE</code>).</li>
                <li>Masukkan URL target (misal: <code>http://localhost:4000/kong/v1/business-unit</code>).</li>
                <li>Tambahkan <strong>Query Params</strong> atau <strong>Headers</strong> (disediakan autocomplete untuk header umum seperti <code>Authorization</code>, <code>Content-Type</code>, dll).</li>
                <li>Jika method POST/PUT/PATCH, atur <strong>Body</strong> (JSON, Form x-www-form-urlencoded, atau Text).</li>
                <li>Klik tombol <strong>Kirim Request</strong> untuk melihat respon secara instan beserta durasi dan ukuran payload.</li>
              </ol>

              <Callout type="tip" title="Fitur Paste cURL (Impor Instan)">
                Buka tab <strong>Network</strong> pada Browser DevTools $\to$ Klik kanan pada request apa pun $\to$ Pilih <em>Copy as cURL</em> $\to$ Di API Tester, klik tombol <strong>Paste cURL</strong>. URL, Method, Headers, dan Body akan terisi otomatis ke form!
              </Callout>
            </section>

            {/* Section 6: Code Examples */}
            <section id="examples" style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>💻</span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  6. Contoh Integrasi Frontend
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Berikut adalah contoh implementasi pemanggilan API melalui Middleware Studio dari berbagai stack Frontend:
              </p>

              <CodeBox
                title="Pilihan Integrasi Frontend"
                tabs={[
                  {
                    label: "Next.js / React (Fetch)",
                    code: `// Contoh pemanggilan di React Client Component
async function getBusinessUnits() {
  try {
    const res = await fetch("http://localhost:4000/kong/posservice-ear/v1/business-unit", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer YOUR_JWT_TOKEN",
      },
    });

    if (!res.ok) {
      throw new Error(\`HTTP error! status: \${res.status}\`);
    }

    const json = await res.json();
    console.log("Data diterima:", json);
    return json;
  } catch (error) {
    console.error("Gagal fetch:", error);
  }
}`,
                  },
                  {
                    label: "Axios",
                    code: `import axios from "axios";

// Buat instance axios dengan baseURL middleware
const api = axios.create({
  baseURL: "http://localhost:4000",
  timeout: 10000,
});

// Panggil service 'kong'
export async function createOrder(payload) {
  const response = await api.post("/kong/v1/orders", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
}`,
                  },
                  {
                    label: "Terminal (cURL)",
                    code: `# Kirim request GET langsung dari terminal
curl -X GET 'http://localhost:4000/kong/posservice-ear/v1/business-unit' \\
  -H 'Accept: application/json'

# Kirim request POST dengan JSON body
curl -X POST 'http://localhost:4000/user-service/api/users' \\
  -H 'Content-Type: application/json' \\
  -d '{"name": "Budi Santoso", "role": "developer"}'`,
                  },
                ]}
              />
            </section>

            {/* Section 7: FAQ */}
            <section id="faq" style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>❓</span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  7. FAQ & Troubleshooting
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Q: Muncul error <code>Environment variable "XYZ_URL" tidak ditemukan untuk service "xyz"</code>?
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                    Pastikan Anda telah menambahkan variabel <code>XYZ_URL=https://...</code> di file <code>.env</code> project middleware ini. Jika baru menambahkan variabel baru, restart dev server agar Next.js membaca file <code>.env</code> terbaru.
                  </p>
                </div>

                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Q: Apakah Mock API tetap berfungsi jika target Backend di .env sedang mati/down?
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                    <strong>Ya!</strong> Middleware mengecek daftar Mock aktif terlebih dahulu sebelum menghubungi backend. Jika mock ditemukan dan aktif, respon mock langsung dikembalikan ke frontend tanpa pernah menghubungi backend asli.
                  </p>
                </div>

                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Q: Apakah data Mock hilang jika dev server di-restart?
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                    <strong>Tidak.</strong> Konfigurasi Mock disimpan secara permanen di file <code>mocks.json</code> di root project. Sementara data log traffic (di <code>/logs</code>) disimpan di memori sementara (maksimal 500 riwayat terbaru).
                  </p>
                </div>

                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Q: Bagaimana cara kerja CORS Bypass?
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                    Browser memblokir request jika header <code>Access-Control-Allow-Origin</code> tidak cocok. Middleware ini bertindak sebagai perantara server-to-server (Node.js fetch tidak terpengaruh aturan CORS browser), kemudian menyematkan header <code>Access-Control-Allow-Origin: *</code> sebelum meneruskan respon kembali ke browser Anda.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
