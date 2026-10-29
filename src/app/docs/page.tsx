"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import { CopyIcon, CheckIcon } from "@/components/Icons";

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
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "#0f172a",
        margin: "14px 0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
          {title && (
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
              {title}
            </span>
          )}
          {tabs && (
            <div style={{ display: "flex", gap: "4px", marginLeft: title ? "8px" : "0" }}>
              {tabs.map((tab, idx) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "4px",
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
          title={copied ? "Tersalin!" : "Salin Kode"}
          aria-label="Salin Kode"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "6px",
            border: "1px solid #475569",
            background: copied ? "#059669" : "#334155",
            color: "#ffffff",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
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
    info: { bg: "#f0fdf4", border: "#bbf7d0", accent: "#059669", text: "#166534", title: "#14532d", badge: "INFO" },
    tip: { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb", text: "#1e40af", title: "#1e3a8a", badge: "TIPS" },
    warning: { bg: "#fffbeb", border: "#fde68a", accent: "#d97706", text: "#92400e", title: "#78350f", badge: "PERHATIAN" },
  }[type];

  return (
    <div
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderLeft: `4px solid ${styles.accent}`,
        borderRadius: "8px",
        padding: "14px 18px",
        margin: "16px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            padding: "1px 6px",
            borderRadius: "4px",
            background: styles.accent,
            color: "#ffffff",
            letterSpacing: "0.04em",
          }}
        >
          {styles.badge}
        </span>
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
    { id: "overview", label: "Pengenalan & Arsitektur", num: "01" },
    { id: "gateway", label: "Proxy Gateway & CORS", num: "02" },
    { id: "logs", label: "Live Logs & Inspector", num: "03" },
    { id: "mocks", label: "Mock API Manager", num: "04" },
    { id: "tester", label: "API Tester & cURL Client", num: "05" },
    { id: "examples", label: "Contoh Integrasi Frontend", num: "06" },
    { id: "faq", label: "FAQ & Troubleshooting", num: "07" },
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
          subtitle="Dokumentasi Teknis, Arsitektur & Panduan Integrasi"
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
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: activeSection === sec.id ? 1 : 0.6,
                      minWidth: "20px",
                    }}
                  >
                    {sec.num}
                  </span>
                  <span>{sec.label}</span>
                </a>
              ))}
            </nav>

            <div style={{ marginTop: "auto", paddingTop: "20px" }}>
              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                  Uji Coba Langsung
                </div>
                <p style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.5, marginBottom: "10px" }}>
                  Gunakan antarmuka API Tester bawaan untuk menguji endpoint via proxy secara langsung di browser.
                </p>
                <a
                  href="/tester"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11.5px",
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
              <div style={{ display: "inline-flex", alignItems: "center", background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "3px 8px", borderRadius: "4px", color: "#334155", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "12px" }}>
                <span>DOKUMENTASI TEKNIS</span>
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                Dokumentasi Resmi Middleware Studio
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
                Panduan komprehensif mengenai arsitektur Proxy Gateway, integrasi CORS Bypass, pemantauan trafik HTTP real-time, simulasi endpoint dengan Mock Engine, dan pengujian API via API Tester.
              </p>
            </div>

            {/* Section 1: Overview & Architecture */}
            <section id="overview" style={{ marginBottom: "48px" }}>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOJEK_GREEN, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Bagian 01
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  Pengenalan & Arsitektur
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Dalam pengembangan aplikasi modern (misalnya Next.js, React, Vue, atau Mobile Apps), pengembang sering menghadapi kendala arsitektur dan jaringan lokal:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#b91c1c", marginBottom: "8px" }}>
                    Tantangan Frontend Tradisional
                  </h4>
                  <ul style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, paddingLeft: "18px" }}>
                    <li><strong>CORS Blocker:</strong> Backend staging atau production menolak request yang berasal dari origin <code>localhost</code>.</li>
                    <li><strong>Log Terpisah:</strong> Request Server-Side Rendering (SSR) berada di terminal, sedangkan request Client-Side Rendering (CSR) berada di DevTools browser.</li>
                    <li><strong>Ketergantungan Backend:</strong> Tim Frontend terhenti ketika endpoint baru belum selesai diimplementasikan oleh tim Backend.</li>
                  </ul>
                </div>

                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#15803d", marginBottom: "8px" }}>
                    Solusi Middleware Studio
                  </h4>
                  <ul style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, paddingLeft: "18px" }}>
                    <li><strong>Bypass CORS Lengkap:</strong> Proxy perantara menyisipkan header CORS yang valid ke seluruh respon balik ke browser.</li>
                    <li><strong>Monitoring Sentral:</strong> Seluruh lalu lintas HTTP dari SSR maupun CSR dicatat secara terpadu di halaman <code>/logs</code>.</li>
                    <li><strong>Mock API Instan:</strong> Pengembang dapat membuat respon simulasi mandiri kapan saja di halaman <code>/mocks</code>.</li>
                  </ul>
                </div>
              </div>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Diagram Alur Kerja Request
              </h3>
              <CodeBox
                title="Alur Eksekusi Proxy"
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
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOJEK_GREEN, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Bagian 02
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  Proxy Gateway & CORS Bypass
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Proxy Gateway menerima request dari aplikasi Anda dan meneruskannya ke backend yang sesuai berdasarkan segmen pertama URL (*service name*).
              </p>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Format URL Gateway
              </h3>
              <div style={{ background: "#0f172a", color: "#38bdf8", padding: "10px 16px", borderRadius: "6px", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", marginBottom: "14px" }}>
                http://localhost:4000/[nama-service]/[path-endpoint]?query=value
              </div>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Konfigurasi <code>.env</code>
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
                Daftarkan URL backend target pada file <code>.env</code> dengan aturan: nama service di URL diubah menjadi huruf kapital, tanda hubung (<code>-</code>) diubah menjadi garis bawah (<code>_</code>), lalu ditambah akhiran <code>_URL</code>.
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
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Variabel Environment</th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>URL Tujuan Backend</th>
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

              <Callout type="warning" title="Reserved Service Names">
                Nama service berikut tidak dapat digunakan sebagai nama backend karena digunakan oleh halaman dan API internal aplikasi: <code>logs</code>, <code>api</code>, <code>mocks</code>, <code>tester</code>, dan <code>docs</code>.
              </Callout>
            </section>

            {/* Section 3: Live Logs */}
            <section id="logs" style={{ marginBottom: "48px" }}>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOJEK_GREEN, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Bagian 03
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  Live Logs & Traffic Inspector (/logs)
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Halaman <strong>Live Logs</strong> menyajikan visibilitas menyeluruh terhadap setiap traffic HTTP yang melintasi middleware.
              </p>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Fitur Utama Halaman Logs:
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    Live Polling Indicator
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Log diperbarui otomatis secara periodik tanpa memuat ulang halaman. Polling dapat dihentikan sementara via tombol <strong>Live / Paused</strong>.
                  </p>
                </div>
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    Filter Multi-Parameter
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Penyaringan instan berdasarkan <strong>HTTP Method</strong> (GET, POST, dsb), <strong>Service</strong>, dan <strong>Status Code</strong> (2xx, 3xx, 4xx, 5xx).
                  </p>
                </div>
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    Salin Perintah cURL
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Setiap log yang dipilih memiliki tombol <strong>Salin cURL</strong> untuk mereproduksi request yang sama langsung pada terminal.
                  </p>
                </div>
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    Simpan Langsung Jadi Mock
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Konversi respon riil backend dari tabel log menjadi Mock API aktif dengan satu klik tombol <strong>Simpan jadi Mock</strong>.
                  </p>
                </div>
              </div>

              <Callout type="tip" title="JSON Formatter & Fullscreen Preview">
                Pada panel Request & Response Body, tersedia pengalihan mode antara <strong>Formatted JSON</strong> dan <strong>Raw Text</strong>, serta mode <strong>Fullscreen</strong> untuk membaca payload berukuran besar.
              </Callout>
            </section>

            {/* Section 4: Mock API Manager */}
            <section id="mocks" style={{ marginBottom: "48px" }}>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOJEK_GREEN, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Bagian 04
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  Mock API Manager (/mocks)
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Mock Manager memungkinkan pengembang menyimulasikan respon API apa pun tanpa melakukan perubahan pada kode backend.
              </p>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Parameter Konfigurasi Mock:
              </h3>
              <ul style={{ fontSize: "13px", color: "#475569", lineHeight: 1.8, paddingLeft: "20px", marginBottom: "16px" }}>
                <li><strong>Nama Mock:</strong> Label identifikasi deskriptif (contoh: <em>GET /users - Simulasi Data Kosong</em>).</li>
                <li><strong>Method & Service & Path:</strong> Kriteria pencocokan request yang masuk (contoh: <code>GET</code>, service <code>kong</code>, path <code>/v1/users</code>).</li>
                <li><strong>HTTP Status:</strong> Status code respons (contoh: <code>200</code>, <code>400</code>, <code>401</code>, <code>404</code>, atau <code>500</code>).</li>
                <li><strong>Delay Simulasi (ms):</strong> Jeda latensi sebelum respon dikirim (contoh: <code>1500 ms</code> untuk menguji komponen loading/skeleton UI).</li>
                <li><strong>Response Headers:</strong> Objek JSON header tambahan (otomatis digabungkan dengan CORS headers).</li>
                <li><strong>Response Body:</strong> Konten payload respons (JSON atau teks).</li>
                <li><strong>Toggle Aktif:</strong> Kontrol aktif/nonaktif mock tanpa menghapus konfigurasi.</li>
              </ul>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Skenario Penggunaan Mock:
              </h3>
              <CodeBox
                title="Skenario: Pengujian Error 500 dan Penanganan UI Fallback"
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
                    label: "Respon yang Diterima Frontend",
                    code: `// Frontend menerima status HTTP 500 dan memicu UI Banner Error:
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
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOJEK_GREEN, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Bagian 05
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  API Tester & cURL Importer (/tester)
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Pengujian endpoint dapat dilakukan langsung melalui antarmuka HTTP Client terintegrasi tanpa memerlukan aplikasi eksternal.
              </p>

              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                Panduan Penggunaan API Tester:
              </h3>
              <ol style={{ fontSize: "13px", color: "#475569", lineHeight: 1.8, paddingLeft: "20px", marginBottom: "16px" }}>
                <li>Tentukan HTTP Method (<code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>PATCH</code>, <code>DELETE</code>).</li>
                <li>Tentukan target URL (contoh: <code>http://localhost:4000/kong/v1/business-unit</code>).</li>
                <li>Tambahkan <strong>Query Params</strong> atau <strong>Request Headers</strong> sesuai kebutuhan.</li>
                <li>Untuk method yang membawa payload, konfigurasikan <strong>Body</strong> (JSON, Form x-www-form-urlencoded, atau Plain Text).</li>
                <li>Klik tombol <strong>Kirim Request</strong> untuk melihat status respon, durasi latensi, ukuran payload, dan body respons.</li>
              </ol>

              <Callout type="tip" title="Impor Instan via Paste cURL">
                Salin perintah cURL dari tab Network DevTools browser melalui menu <em>Copy as cURL</em>, lalu klik tombol <strong>Paste cURL</strong> pada halaman tester untuk mengisi formulir request secara otomatis.
              </Callout>
            </section>

            {/* Section 6: Code Examples */}
            <section id="examples" style={{ marginBottom: "48px" }}>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOJEK_GREEN, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Bagian 06
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  Contoh Integrasi Frontend
                </h2>
              </div>
              <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, marginBottom: "14px" }}>
                Berikut adalah contoh implementasi pemanggilan API melalui Middleware Studio dari beberapa stack frontend:
              </p>

              <CodeBox
                title="Pilihan Integrasi Frontend"
                tabs={[
                  {
                    label: "Next.js / React (Fetch)",
                    code: `// Contoh pemanggilan pada React Client Component
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
    return json;
  } catch (error) {
    console.error("Gagal melakukan fetch:", error);
  }
}`,
                  },
                  {
                    label: "Axios",
                    code: `import axios from "axios";

// Inisialisasi Axios client dengan baseURL middleware
const api = axios.create({
  baseURL: "http://localhost:4000",
  timeout: 10000,
});

// Pemanggilan service 'kong'
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
                    code: `# Pengujian GET via terminal
curl -X GET 'http://localhost:4000/kong/posservice-ear/v1/business-unit' \\
  -H 'Accept: application/json'

# Pengujian POST dengan JSON payload
curl -X POST 'http://localhost:4000/user-service/api/users' \\
  -H 'Content-Type: application/json' \\
  -d '{"name": "Budi Santoso", "role": "developer"}'`,
                  },
                ]}
              />
            </section>

            {/* Section 7: FAQ */}
            <section id="faq" style={{ marginBottom: "48px" }}>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: GOJEK_GREEN, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Bagian 07
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  FAQ & Troubleshooting
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Q: Muncul error "Environment variable XYZ_URL tidak ditemukan untuk service xyz"?
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                    Pastikan variabel <code>XYZ_URL=https://...</code> telah didefinisikan pada file <code>.env</code> project. Lakukan restart server jika variabel baru saja ditambahkan agar Next.js membaca ulang file environment.
                  </p>
                </div>

                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Q: Apakah Mock API tetap berfungsi saat server backend target mati?
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                    Tetap berfungsi. Middleware mengevaluasi data mock yang aktif terlebih dahulu. Jika request cocok dengan mock yang aktif, respons simulasi langsung dikembalikan tanpa melakukan koneksi jaringan ke backend asli.
                  </p>
                </div>

                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Q: Apakah data konfigurasi Mock tersimpan permanen?
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                    Ya. Konfigurasi Mock disimpan pada berkas <code>mocks.json</code> di root repositori sehingga tidak hilang saat server di-restart. Sementara riwayat log lalu lintas pada <code>/logs</code> disimpan secara in-memory untuk kebutuhan runtime monitoring.
                  </p>
                </div>

                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Q: Bagaimana mekanisme CORS bypass bekerja?
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
                    Request antar-server (Node.js runtime ke target backend) tidak dibatasi oleh Same-Origin Policy browser. Middleware Studio menerima respon backend, lalu menyisipkan header <code>Access-Control-Allow-Origin: *</code> serta menangani preflight <code>OPTIONS</code> sebelum meneruskan respon kembali ke browser client.
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
