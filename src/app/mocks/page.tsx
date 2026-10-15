"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Header from "@/components/Header";

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

const METHOD_STYLE: Record<string, { bg: string; text: string }> = {
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

const GOJEK_GREEN = "#00AA13";

interface FormDataState {
  name: string;
  method: string;
  service: string;
  path: string;
  responseStatus: number;
  responseHeadersText: string;
  responseBody: string;
  delayMs: number;
  enabled: boolean;
}

const initialForm: FormDataState = {
  name: "",
  method: "GET",
  service: "",
  path: "/",
  responseStatus: 200,
  responseHeadersText: '{\n  "content-type": "application/json"\n}',
  responseBody: '{\n  "message": "success",\n  "data": {}\n}',
  delayMs: 0,
  enabled: true,
};

export default function MocksPage() {
  const [mocks, setMocks] = useState<MockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMock, setEditingMock] = useState<MockEntry | null>(null);
  const [formData, setFormData] = useState<FormDataState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMocks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mocks");
      if (!res.ok) throw new Error("Gagal mengambil data mock");
      const data = await res.json();
      setMocks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || "Gagal memuat mock", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMocks();
  }, [fetchMocks]);

  const openCreateModal = () => {
    setEditingMock(null);
    setFormData(initialForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mock: MockEntry) => {
    setEditingMock(mock);
    setFormData({
      name: mock.name,
      method: mock.method,
      service: mock.service,
      path: mock.path,
      responseStatus: mock.responseStatus,
      responseHeadersText: JSON.stringify(mock.responseHeaders || {}, null, 2),
      responseBody: mock.responseBody || "",
      delayMs: mock.delayMs || 0,
      enabled: mock.enabled,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggle = async (mock: MockEntry) => {
    const nextState = !mock.enabled;
    try {
      const res = await fetch(`/api/mocks/${mock.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengubah status mock");
      }
      setMocks((prev) =>
        prev.map((m) => (m.id === mock.id ? { ...m, enabled: nextState } : m))
      );
      showToast(`Mock "${mock.name}" ${nextState ? "diaktifkan" : "dinonaktifkan"}`);
    } catch (err: any) {
      showToast(err.message || "Gagal mengubah status", "error");
    }
  };

  const handleDelete = async (mock: MockEntry) => {
    if (!window.confirm(`Yakin ingin menghapus mock "${mock.name}"?`)) return;
    try {
      const res = await fetch(`/api/mocks/${mock.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus mock");
      }
      setMocks((prev) => prev.filter((m) => m.id !== mock.id));
      showToast(`Mock "${mock.name}" berhasil dihapus`);
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus mock", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Nama mock wajib diisi");
      return;
    }
    if (!formData.service.trim()) {
      setFormError("Nama service wajib diisi");
      return;
    }
    if (!formData.path.trim().startsWith("/")) {
      setFormError("Path harus diawali dengan karakter '/'");
      return;
    }
    if (isNaN(formData.responseStatus) || formData.responseStatus < 100 || formData.responseStatus > 599) {
      setFormError("Status code harus berupa angka antara 100 dan 599");
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    if (formData.responseHeadersText.trim()) {
      try {
        parsedHeaders = JSON.parse(formData.responseHeadersText);
        if (typeof parsedHeaders !== "object" || parsedHeaders === null || Array.isArray(parsedHeaders)) {
          throw new Error();
        }
      } catch {
        setFormError("Response Headers harus berupa JSON Object yang valid");
        return;
      }
    }

    if (formData.delayMs < 0) {
      setFormError("Delay simulasi tidak boleh bernilai negatif");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      method: formData.method,
      service: formData.service.trim().toLowerCase(),
      path: formData.path.trim(),
      responseStatus: Number(formData.responseStatus),
      responseHeaders: parsedHeaders,
      responseBody: formData.responseBody,
      delayMs: Number(formData.delayMs),
      enabled: formData.enabled,
    };

    setSubmitting(true);
    try {
      if (editingMock) {
        const res = await fetch(`/api/mocks/${editingMock.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui mock");
        setMocks((prev) => prev.map((m) => (m.id === editingMock.id ? data : m)));
        showToast("Mock berhasil diperbarui");
      } else {
        const res = await fetch("/api/mocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat mock");
        setMocks((prev) => [...prev, data]);
        showToast("Mock baru berhasil dibuat");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan saat menyimpan mock");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMocks = useMemo(() => {
    return mocks.filter((m) => {
      if (filterMethod !== "Semua" && m.method !== filterMethod) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchService = m.service.toLowerCase().includes(q);
        const matchPath = m.path.toLowerCase().includes(q);
        if (!matchName && !matchService && !matchPath) return false;
      }
      return true;
    });
  }, [mocks, filterMethod, search]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f9fafb; color: #111827; font-family: 'Inter', 'Segoe UI', sans-serif; color-scheme: light; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        input, select, textarea, button { font-family: 'Inter', sans-serif; color-scheme: light; }
        input, select, textarea {
          background-color: #fff !important;
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
        }
        select option {
          background-color: #fff !important;
          color: #111827 !important;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px #fff inset !important;
          -webkit-text-fill-color: #111827 !important;
        }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Header */}
        <Header
          currentTab="mocks"
          subtitle="Simulasi respons endpoint & bypass backend"
          rightSlot={
            <button
              id="btn-tambah-mock"
              onClick={openCreateModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                borderRadius: "8px",
                border: `1.5px solid ${GOJEK_GREEN}`,
                background: GOJEK_GREEN,
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              + Tambah Mock
            </button>
          }
        />

        {/* Filter bar */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="text"
              placeholder="Cari nama, service, atau path..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "7px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
                color: "#111827",
                width: "280px",
                outline: "none",
              }}
            />

            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "7px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
                color: "#111827",
                background: "#fff",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="Semua">Semua Method</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
            Total: <strong>{filteredMocks.length}</strong> mock ({mocks.filter((m) => m.enabled).length} aktif)
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b", fontSize: "14px" }}>
              Memuat daftar mock...
            </div>
          ) : filteredMocks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "#fff",
                borderRadius: "10px",
                border: "1px dashed #d1d5db",
              }}
            >
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                {mocks.length === 0
                  ? "Belum ada mock yang terdaftar"
                  : "Tidak ada mock yang sesuai dengan filter pencarian"}
              </p>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
                {mocks.length === 0
                  ? "Buat mock secara manual atau simpan langsung dari halaman Logs."
                  : "Coba ubah kata kunci pencarian atau filter method."}
              </p>
              {mocks.length === 0 && (
                <button
                  id="btn-tambah-mock-empty"
                  onClick={openCreateModal}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: GOJEK_GREEN,
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Tambah Mock Pertama
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", width: "70px" }}>Aktif</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Nama & Keterangan</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", width: "90px" }}>Method</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", width: "130px" }}>Service</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Path</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", width: "90px" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", width: "90px" }}>Delay</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", width: "140px", textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMocks.map((mock, idx) => {
                    const mStyle = METHOD_STYLE[mock.method] || { bg: "#f1f5f9", text: "#475569" };
                    const sStyle = getStatusStyle(mock.responseStatus);
                    return (
                      <tr
                        key={mock.id}
                        style={{
                          borderBottom: idx === filteredMocks.length - 1 ? "none" : "1px solid #f1f5f9",
                          background: mock.enabled ? "#fff" : "#fafafa",
                          opacity: mock.enabled ? 1 : 0.75,
                        }}
                      >
                        {/* Toggle switch */}
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            type="button"
                            onClick={() => handleToggle(mock)}
                            title={mock.enabled ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
                            style={{
                              position: "relative",
                              width: "38px",
                              height: "20px",
                              borderRadius: "10px",
                              background: mock.enabled ? GOJEK_GREEN : "#cbd5e1",
                              border: "none",
                              cursor: "pointer",
                              transition: "background 0.2s",
                              padding: 0,
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: mock.enabled ? "20px" : "2px",
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                background: "#fff",
                                transition: "left 0.2s",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                              }}
                            />
                          </button>
                        </td>

                        {/* Nama */}
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontWeight: 600, color: "#111827" }}>{mock.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8" }}>ID: {mock.id.slice(0, 8)}</p>
                        </td>

                        {/* Method */}
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: mStyle.bg,
                              color: mStyle.text,
                            }}
                          >
                            {mock.method}
                          </span>
                        </td>

                        {/* Service */}
                        <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 500 }}>
                          {mock.service}
                        </td>

                        {/* Path */}
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0f172a" }}>
                          {mock.path}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: sStyle.bg,
                              color: sStyle.text,
                            }}
                          >
                            {mock.responseStatus}
                          </span>
                        </td>

                        {/* Delay */}
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px" }}>
                          {mock.delayMs > 0 ? `${mock.delayMs} ms` : "0 ms"}
                        </td>

                        {/* Aksi */}
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              onClick={() => openEditModal(mock)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                background: "#fff",
                                color: "#1e293b",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(mock)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #fecaca",
                                background: "#fff",
                                color: "#dc2626",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Form Create / Edit */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(15, 23, 42, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "640px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "16px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  {editingMock ? "Edit Mock API" : "Tambah Mock API Baru"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "18px",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "20px 22px", overflowY: "auto", maxHeight: "calc(90vh - 140px)" }}>
                  {formError && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      {formError}
                    </div>
                  )}

                  {/* Nama */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      Nama Mock *
                    </label>
                    <input
                      id="input-mock-name"
                      type="text"
                      required
                      placeholder="Contoh: GET /users/list - Sukses"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Method & Service & Path */}
                  <div style={{ display: "grid", gridTemplateColumns: "110px 150px 1fr", gap: "10px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                        Method *
                      </label>
                      <select
                        value={formData.method}
                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "7px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          background: "#fff",
                          outline: "none",
                        }}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                        Service *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="user-service"
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "7px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                        Path (mulai &apos;/&apos;) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="/users"
                        value={formData.path}
                        onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "7px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          outline: "none",
                          fontFamily: "monospace",
                        }}
                      />
                    </div>
                  </div>

                  {/* Status & Delay & Enabled */}
                  <div style={{ display: "grid", gridTemplateColumns: "130px 140px 1fr", gap: "10px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                        HTTP Status *
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="599"
                        required
                        value={formData.responseStatus}
                        onChange={(e) => setFormData({ ...formData, responseStatus: Number(e.target.value) })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "7px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                        Delay Simulasi (ms)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.delayMs}
                        onChange={(e) => setFormData({ ...formData, delayMs: Number(e.target.value) })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "7px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", paddingTop: "20px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={formData.enabled}
                          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                          style={{ width: "16px", height: "16px", accentColor: GOJEK_GREEN }}
                        />
                        Aktifkan Mock ini
                      </label>
                    </div>
                  </div>

                  {/* Response Headers */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      Response Headers (JSON Object)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.responseHeadersText}
                      onChange={(e) => setFormData({ ...formData, responseHeadersText: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Response Body */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      Response Body *
                    </label>
                    <textarea
                      rows={8}
                      required
                      placeholder="Masukkan JSON string atau teks respons mock..."
                      value={formData.responseBody}
                      onChange={(e) => setFormData({ ...formData, responseBody: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div
                  style={{
                    padding: "14px 22px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "7px",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      color: "#475569",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "7px",
                      border: `1px solid ${GOJEK_GREEN}`,
                      background: GOJEK_GREEN,
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Menyimpan..." : "Simpan Mock"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              padding: "10px 18px",
              borderRadius: "8px",
              background: toast.type === "error" ? "#dc2626" : "#0f172a",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              zIndex: 200,
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}

