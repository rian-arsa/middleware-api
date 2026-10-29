"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CloseIcon } from "./Icons";

export type NavTab = "logs" | "mocks" | "tester" | "docs";

interface HeaderProps {
  currentTab: NavTab;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

const GOJEK_GREEN = "#00AA13";

export default function Header({ currentTab, subtitle, rightSlot }: HeaderProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Left: Branding & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "260px" }}>
          {/* Logo Icon */}
          <Link
            href="/logs"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #00AA13 0%, #00870f 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 2px 6px rgba(0, 170, 19, 0.25)",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  Middleware Studio
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0",
                    letterSpacing: "0.04em",
                  }}
                >
                  Proxy
                </span>
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  fontWeight: 500,
                  margin: "1px 0 0 0",
                  whiteSpace: "nowrap",
                }}
              >
                {subtitle || "Dev API Gateway, Logger & Mock"}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Main Navigation Tabs (Fitur & Menu Utama) */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            gap: "2px",
          }}
        >
          {/* Tab 1: Live Logs */}
          <Link
            href="/logs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "9px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: currentTab === "logs" ? 700 : 500,
              color: currentTab === "logs" ? "#0f172a" : "#64748b",
              background: currentTab === "logs" ? "#ffffff" : "transparent",
              boxShadow: currentTab === "logs" ? "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={currentTab === "logs" ? GOJEK_GREEN : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <span>Live Logs</span>
            {currentTab === "logs" && (
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
          </Link>

          {/* Tab 2: Mock API Manager */}
          <Link
            href="/mocks"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "9px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: currentTab === "mocks" ? 700 : 500,
              color: currentTab === "mocks" ? "#0f172a" : "#64748b",
              background: currentTab === "mocks" ? "#ffffff" : "transparent",
              boxShadow: currentTab === "mocks" ? "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={currentTab === "mocks" ? GOJEK_GREEN : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>Mock APIs</span>
            {currentTab === "mocks" && (
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
          </Link>

          {/* Tab 3: API Tester */}
          <Link
            href="/tester"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "9px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: currentTab === "tester" ? 700 : 500,
              color: currentTab === "tester" ? "#0f172a" : "#64748b",
              background: currentTab === "tester" ? "#ffffff" : "transparent",
              boxShadow: currentTab === "tester" ? "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={currentTab === "tester" ? GOJEK_GREEN : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>API Tester</span>
            {currentTab === "tester" && (
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
          </Link>

          {/* Tab 4: Docs */}
          <Link
            href="/docs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "9px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: currentTab === "docs" ? 700 : 500,
              color: currentTab === "docs" ? "#0f172a" : "#64748b",
              background: currentTab === "docs" ? "#ffffff" : "transparent",
              boxShadow: currentTab === "docs" ? "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={currentTab === "docs" ? GOJEK_GREEN : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span>Docs</span>
            {currentTab === "docs" && (
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
          </Link>
        </nav>

        {/* Right: Feature Guide button + Page Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Guide / Fitur info button */}
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#475569",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Lihat semua menu dan panduan fitur aplikasi"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Panduan Fitur</span>
          </button>

          {/* Page specific action buttons */}
          {rightSlot}
        </div>
      </header>

      {/* Modal Panduan Fitur */}
      {guideOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setGuideOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "680px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(to right, #ffffff, #f8fafc)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    background: "#ecfdf5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: GOJEK_GREEN,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    Menu & Fitur Middleware Studio
                  </h3>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>
                    Arsitektur dan fitur utama yang tersedia di aplikasi ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                title="Tutup"
                aria-label="Tutup"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Modal Content - Feature Cards */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "75vh", overflowY: "auto" }}>
              {/* Feature 1: Proxy Gateway */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    background: "#e0e7ff",
                    color: "#4338ca",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                      1. Proxy Gateway & CORS Bypass
                    </h4>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: "4px" }}>
                      Gateway Core
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Meneruskan request dari Frontend ke Backend tanpa terkendala CORS. Gunakan pola URL:
                  </p>
                  <div style={{ background: "#0f172a", color: "#38bdf8", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace", marginTop: "6px" }}>
                    http://localhost:[port]/[nama-service]/[endpoint-path]
                  </div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                    Contoh: <code>/kong/v1/users</code> otomatis diteruskan ke URL target di <code>.env</code> (<code>KONG_URL</code>).
                  </p>
                </div>
              </div>

              {/* Feature 2: Live Logs */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    background: "#dcfce7",
                    color: "#15803d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                      2. Live Logs & Inspector (/logs)
                    </h4>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: "4px" }}>
                      Monitoring
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Memantau setiap HTTP traffic yang lewat secara real-time. Anda bisa memeriksa Headers, Query Params, Request & Response Body, durasi latency, salin cURL, serta <strong>langsung menyimpan log respon menjadi Mock API</strong> hanya dengan 1 klik!
                  </p>
                </div>
              </div>

              {/* Feature 3: Mock Manager */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    background: "#fef3c7",
                    color: "#b45309",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                      3. Mock API Manager (/mocks)
                    </h4>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#d97706", background: "#fffbeb", padding: "2px 8px", borderRadius: "4px" }}>
                      Simulator
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Simulasikan respons endpoint tanpa menyentuh backend sama sekali. Sangat bermanfaat ketika backend sedang down atau belum selesai dibuat. Mendukung HTTP Status (200, 404, 500), simulasi delay latensi jaringan (ms), dan toggle on/off instan.
                  </p>
                </div>
              </div>

              {/* Feature 4: API Tester */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    background: "#fce7f3",
                    color: "#be185d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                      4. API Tester & cURL Client (/tester)
                    </h4>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#db2777", background: "#fdf2f8", padding: "2px 8px", borderRadius: "4px" }}>
                      Testing Tool
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                    Client pengujian API lengkap (mirip Postman/Insomnia) di dalam browser Anda. Bisa import command cURL dari developer tools, atur query params, headers, request body (JSON/Form/Text), dan kelola history pengujian secara terstruktur.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #f1f5f9",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Tip: Pilih tab di navbar atas untuk berpindah fitur kapan saja.
              </span>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: GOJEK_GREEN,
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
