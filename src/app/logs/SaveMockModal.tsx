"use client";

import { useEffect, useMemo, useState } from "react";
import type { MockCollection } from "@/lib/mockTypes";
import { CloseIcon } from "@/components/Icons";
import s from "./SaveMockModal.module.css";

export interface SaveMockLog {
  id: string;
  url: string;
  method: string;
  status: number;
  service: string;
  queryParams?: Record<string, string>;
  requestHeaders?: Record<string, string>;
  requestBody?: string | null;
  responseHeaders?: Record<string, string>;
  responseBody?: string | null;
}

const NEW_COL = "__NEW_COLLECTION__";
const NEW_FOLDER = "__NEW_FOLDER__";
// Header ini tidak valid lagi jika body dikirim ulang apa adanya
const SKIP_HEADERS = ["content-length", "content-encoding", "transfer-encoding", "connection"];
// Header transport/browser yang tidak berguna untuk dokumentasi request
const SKIP_REQUEST_HEADERS = [
  "host", "content-length", "connection", "accept-encoding", "user-agent", "origin", "referer",
  "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-forwarded-port", "accept-language",
];
// Nilai rahasia diganti placeholder agar tidak bocor ke dokumentasi
const SECRET_HEADERS: Record<string, string> = {
  cookie: "<cookie>",
  authorization: "Bearer <token>",
  "x-api-key": "<api-key>",
  "proxy-authorization": "<credentials>",
};

function buildRequestDocs(log: SaveMockLog) {
  const requestHeaders = Object.entries(log.requestHeaders ?? {})
    .filter(([k]) => !SKIP_REQUEST_HEADERS.includes(k.toLowerCase()))
    .map(([key, value]) => ({ key, value: SECRET_HEADERS[key.toLowerCase()] ?? String(value), enabled: true }));

  const query = { ...(log.queryParams ?? {}) };
  if (!Object.keys(query).length) {
    try {
      new URL(log.url).searchParams.forEach((v, k) => (query[k] = v));
    } catch {
      // url relatif, abaikan
    }
  }
  const requestQuery = Object.entries(query).map(([key, value]) => ({ key, value: String(value), enabled: true }));

  const raw = (log.requestBody ?? "").trim();
  let requestBody: { mode: "none" | "json" | "text"; content: string } = { mode: "none", content: "" };
  if (raw) {
    try {
      requestBody = { mode: "json", content: JSON.stringify(JSON.parse(raw), null, 2) };
    } catch {
      requestBody = { mode: "text", content: log.requestBody ?? "" };
    }
  }
  return { requestHeaders, requestQuery, requestBody };
}

function pathFromUrl(url: string, service: string) {
  let p = url;
  try {
    p = new URL(url).pathname;
  } catch {
    p = url.split("?")[0];
  }
  p = p.startsWith("/") ? p : `/${p}`;
  // URL mock = /{service}{path}, jadi prefix service tidak boleh ikut tersimpan
  const prefix = `/${service.toLowerCase()}`;
  if (p.toLowerCase() === prefix) return "/";
  if (p.toLowerCase().startsWith(`${prefix}/`)) p = p.slice(prefix.length);
  return p;
}

async function postJson(url: string, body: unknown, errMsg: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(errMsg);
  return res.json();
}

export default function SaveMockModal({
  log,
  onClose,
  onSaved,
}: {
  log: SaveMockLog;
  onClose: () => void;
  onSaved: (message: string, href: string) => void;
}) {
  const [cols, setCols] = useState<MockCollection[] | null>(null);
  const [colId, setColId] = useState(NEW_COL);
  const [folderId, setFolderId] = useState(NEW_FOLDER);
  const [path, setPath] = useState(() => pathFromUrl(log.url, log.service));
  const [endpointName, setEndpointName] = useState("");
  const [variantName, setVariantName] = useState(`Response ${log.status}`);
  const [makeActive, setMakeActive] = useState(true);
  const [saveRequest, setSaveRequest] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data: MockCollection[]) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setCols(list);
        const match = list.find((c) => c.service.toLowerCase() === log.service.toLowerCase());
        if (match) {
          setColId(match.id);
          setFolderId(match.folders[0]?.id ?? NEW_FOLDER);
        }
      })
      .catch(() => alive && setError("Gagal memuat daftar collection."));
    return () => {
      alive = false;
    };
  }, [log.service]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const col = cols?.find((c) => c.id === colId);
  const folder = col?.folders.find((f) => f.id === folderId);
  const normPath = path.trim().startsWith("/") ? path.trim() : `/${path.trim()}`;
  const existing = useMemo(
    () =>
      folder?.groups.find(
        (g) => g.method.toUpperCase() === log.method.toUpperCase() && g.path.toLowerCase() === normPath.toLowerCase()
      ),
    [folder, log.method, normPath]
  );

  const newColName = `Dari Logs - ${log.service}`;
  const reqDocs = useMemo(() => buildRequestDocs(log), [log]);
  const reqSummary = `${reqDocs.requestHeaders.length} header, ${reqDocs.requestQuery.length} query, body ${
    reqDocs.requestBody.mode === "none" ? "kosong" : reqDocs.requestBody.mode.toUpperCase()
  }`;
  const targetCol = colId === NEW_COL ? `${newColName} (baru)` : col?.name ?? "-";
  const targetFolder = colId === NEW_COL || folderId === NEW_FOLDER ? "Default (baru)" : folder?.name ?? "-";

  const save = async () => {
    if (normPath === "/" && !path.trim()) {
      setError("Path endpoint tidak boleh kosong.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let cId = colId;
      let fId = folderId;
      if (cId === NEW_COL) {
        const c = await postJson(
          "/api/collections",
          { name: newColName, service: log.service.toLowerCase(), description: "Dibuat otomatis dari riwayat network log" },
          "Gagal membuat collection baru"
        );
        cId = c.id;
        fId = NEW_FOLDER;
      }
      if (fId === NEW_FOLDER) {
        const f = await postJson(`/api/collections/${cId}/folders`, { name: "Default" }, "Gagal membuat folder");
        fId = f.id;
      }

      let gId = existing?.id;
      if (!gId) {
        const g = await postJson(
          `/api/collections/${cId}/folders/${fId}/groups`,
          { method: log.method, path: normPath, name: endpointName.trim() || undefined },
          "Gagal membuat endpoint"
        );
        gId = g.id;
      }

      if (saveRequest) {
        // Endpoint yang sudah ada tidak ditimpa: hanya bagian yang masih kosong yang diisi
        const docs = buildRequestDocs(log);
        const patch: Record<string, unknown> = {};
        if (docs.requestHeaders.length && !existing?.requestHeaders?.length) patch.requestHeaders = docs.requestHeaders;
        if (docs.requestQuery.length && !existing?.requestQuery?.length) patch.requestQuery = docs.requestQuery;
        if (docs.requestBody.mode !== "none" && !existing?.requestBody?.content?.trim()) patch.requestBody = docs.requestBody;
        if (Object.keys(patch).length) {
          const res = await fetch(`/api/collections/${cId}/folders/${fId}/groups/${gId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          if (!res.ok) throw new Error("Gagal menyimpan request (headers/query/body).");
        }
      }

      const headers = Object.fromEntries(
        Object.entries(log.responseHeaders ?? {}).filter(([k]) => !SKIP_HEADERS.includes(k.toLowerCase()))
      );
      const v = await postJson(
        `/api/collections/${cId}/folders/${fId}/groups/${gId}/variants`,
        {
          name: variantName.trim() || `Response ${log.status}`,
          responseStatus: log.status,
          responseHeaders: headers,
          responseBody: log.responseBody ?? "",
          delayMs: 0,
        },
        "Gagal menyimpan response"
      );

      if (makeActive) {
        const res = await fetch(`/api/collections/${cId}/folders/${fId}/groups/${gId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeVariantId: v.id, enabled: true }),
        });
        if (!res.ok) throw new Error("Response tersimpan, tetapi gagal dijadikan aktif.");
      }

      onSaved(`Tersimpan: ${log.method} ${normPath} di ${targetCol} / ${targetFolder}`, "/mocks");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan mock");
      setSaving(false);
    }
  };

  return (
    <div className={s.overlay} onClick={() => !saving && onClose()}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-label="Simpan sebagai Mock" onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <div>
            <h3 className={s.title}>Simpan sebagai Mock</h3>
            <p className={s.subtitle}>Response dari log ini akan menjadi contoh response di Mock API.</p>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Tutup" title="Tutup" disabled={saving}>
            <CloseIcon size={16} />
          </button>
        </div>

        {cols === null && !error ? (
          <div className={s.loading}>Memuat collection…</div>
        ) : (
          <div className={s.body}>
            <div className={s.source}>
              <span className={s.method}>{log.method}</span>
              <span className={s.url} title={log.url}>{log.url}</span>
              <span className={`${s.status} ${log.status < 400 ? s.statusOk : s.statusErr}`}>{log.status}</span>
            </div>

            <div className={s.section}>
              <div className={s.sectionTitle}><span className={s.step}>1</span>Simpan di mana?</div>
              <div className={s.row}>
                <div className={s.field}>
                  <label htmlFor="sm-col">Collection</label>
                  <select
                    id="sm-col"
                    className={s.select}
                    value={colId}
                    onChange={(e) => {
                      const c = cols?.find((x) => x.id === e.target.value);
                      setColId(e.target.value);
                      setFolderId(c?.folders[0]?.id ?? NEW_FOLDER);
                    }}
                  >
                    <option value={NEW_COL}>+ Collection baru ({log.service})</option>
                    {cols?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.service})</option>
                    ))}
                  </select>
                </div>
                <div className={s.field}>
                  <label htmlFor="sm-folder">Folder</label>
                  <select
                    id="sm-folder"
                    className={s.select}
                    value={colId === NEW_COL ? NEW_FOLDER : folderId}
                    disabled={colId === NEW_COL}
                    onChange={(e) => setFolderId(e.target.value)}
                  >
                    <option value={NEW_FOLDER}>+ Folder baru (Default)</option>
                    {col?.folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.groups.length} endpoint)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={s.section}>
              <div className={s.sectionTitle}><span className={s.step}>2</span>Endpoint</div>
              <div className={s.field}>
                <label htmlFor="sm-path">Path</label>
                <input id="sm-path" className={`${s.input} ${s.mono}`} value={path} onChange={(e) => setPath(e.target.value)} />
                <span className={s.hint}>Ganti bagian yang berubah dengan <code>:id</code>, contoh <code>/users/:id</code>.</span>
              </div>
              {existing ? (
                <div className={`${s.notice} ${s.noticeInfo}`}>
                  Endpoint <b>{existing.method} {existing.path}</b> sudah ada di folder ini. Response akan <b>ditambahkan</b> sebagai skenario baru.
                </div>
              ) : (
                <>
                  <div className={s.field}>
                    <label htmlFor="sm-ep">Nama endpoint (opsional)</label>
                    <input id="sm-ep" className={s.input} placeholder="Contoh: Detail User" value={endpointName} onChange={(e) => setEndpointName(e.target.value)} />
                  </div>
                  <div className={`${s.notice} ${s.noticeNew}`}>Endpoint baru akan dibuat.</div>
                </>
              )}
            </div>

            <div className={s.section}>
              <div className={s.sectionTitle}><span className={s.step}>3</span>Response</div>
              <div className={s.field}>
                <label htmlFor="sm-var">Nama response / skenario</label>
                <input id="sm-var" className={s.input} value={variantName} onChange={(e) => setVariantName(e.target.value)} />
              </div>
              <label className={s.check}>
                <input type="checkbox" checked={makeActive} onChange={(e) => setMakeActive(e.target.checked)} />
                <span className={s.checkText}>
                  <strong>Jadikan response aktif</strong>
                  <span>Hanya response aktif yang dikirim saat endpoint dipanggil. Matikan jika sudah ada response aktif lain yang ingin dipertahankan.</span>
                </span>
              </label>
              <label className={s.check}>
                <input type="checkbox" checked={saveRequest} onChange={(e) => setSaveRequest(e.target.checked)} />
                <span className={s.checkText}>
                  <strong>Simpan juga request (headers, query, body)</strong>
                  <span>
                    {reqSummary}. Authorization/cookie diganti placeholder.
                    {existing ? " Endpoint yang sudah ada hanya diisi pada bagian yang masih kosong." : ""}
                  </span>
                </span>
              </label>
            </div>

            <div className={s.summary}>
              Akan disimpan di <b>{targetCol}</b> / <b>{targetFolder}</b> / <b>{log.method} {normPath}</b>
            </div>

            {error && <div className={`${s.notice} ${s.noticeErr}`}>{error}</div>}
          </div>
        )}

        <div className={s.footer}>
          <button type="button" className={s.btn} onClick={onClose} disabled={saving}>Batal</button>
          <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={save} disabled={saving || cols === null}>
            {saving ? "Menyimpan…" : "Simpan Mock"}
          </button>
        </div>
      </div>
    </div>
  );
}
