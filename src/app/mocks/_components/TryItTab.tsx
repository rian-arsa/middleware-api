"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { KeyValueDoc, MockCollection, MockGroup } from "@/lib/mockTypes";
import { buildMockUrl } from "@/lib/mockDocs";
import { METHODS } from "@/lib/mockUi";
import { CopyButton, KeyValueTable, StatusBadge } from "./ui";
import s from "./mocks.module.css";

interface Result {
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
  ms: number;
  size: number;
  mock: string | null;
}

const enabledRows = (rows?: KeyValueDoc[]) =>
  (rows ?? []).filter((r) => r.key.trim() !== "" && r.enabled !== false).map((r) => ({ ...r }));

export default function TryItTab({
  collection,
  group,
}: {
  collection: MockCollection;
  group: MockGroup;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:4000";
  const baseUrl = buildMockUrl(origin, collection.service, group.path);

  const docKey = JSON.stringify([group.id, group.method, baseUrl, group.requestQuery, group.requestHeaders, group.requestBody]);
  const initial = useMemo(
    () => ({
      method: group.method,
      url: baseUrl,
      params: enabledRows(group.requestQuery),
      headers: enabledRows(group.requestHeaders),
      bodyMode: group.requestBody?.mode ?? "none",
      body: group.requestBody?.content ?? "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docKey]
  );
  const [method, setMethod] = useState(initial.method);
  const [url, setUrl] = useState(initial.url);
  const [params, setParams] = useState<KeyValueDoc[]>(initial.params);
  const [headers, setHeaders] = useState<KeyValueDoc[]>(initial.headers);
  const [bodyMode, setBodyMode] = useState<"none" | "json" | "text">(initial.bodyMode);
  const [body, setBody] = useState(initial.body);
  const [reqTab, setReqTab] = useState<"params" | "headers" | "body">("params");
  const [resTab, setResTab] = useState<"body" | "headers">("body");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    setMethod(initial.method);
    setUrl(initial.url);
    setParams(initial.params);
    setHeaders(initial.headers);
    setBodyMode(initial.bodyMode);
    setBody(initial.body);
    setResult(null);
    setError(null);
  }, [initial]);

  const send = async () => {
    if (loading) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const target = new URL(url, window.location.origin);
      params.filter((p) => p.key.trim() && p.enabled !== false).forEach((p) => target.searchParams.append(p.key, p.value));
      const h = new Headers();
      headers.filter((x) => x.key.trim() && x.enabled !== false).forEach((x) => h.set(x.key, x.value));
      if (bodyMode === "json" && !h.has("content-type")) h.set("content-type", "application/json");
      const hasBody = bodyMode !== "none" && !["GET", "HEAD"].includes(method);

      const t0 = performance.now();
      const res = await fetch(target.toString(), {
        method,
        headers: h,
        body: hasBody ? body : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      const ms = Math.round(performance.now() - t0);
      const mockHeader = res.headers.get("x-mock");
      setResult({
        status: res.status,
        statusText: res.statusText,
        headers: Array.from(res.headers.entries()),
        body: text,
        ms,
        size: new Blob([text]).size,
        mock: mockHeader ? decodeURIComponent(mockHeader) : null,
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setError("Request dibatalkan.");
      } else {
        setError(`Gagal mengirim request: ${(e as Error).message}`);
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        sendRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      abortRef.current?.abort();
    };
  }, []);

  const prettyBody = useMemo(() => {
    if (!result) return "";
    try {
      return JSON.stringify(JSON.parse(result.body), null, 2);
    } catch {
      return result.body;
    }
  }, [result]);

  const [backend, setBackend] = useState<{ envKey: string; baseUrl: string | null } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/collections/${collection.id}/target`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setBackend(d))
      .catch(() => alive && setBackend(null));
    return () => {
      alive = false;
    };
  }, [collection.id]);

  const backendUrl = useMemo(() => {
    if (!backend?.baseUrl) return "";
    const u = `${backend.baseUrl}${group.path.startsWith("/") ? group.path : `/${group.path}`}`;
    const qs = enabledRows(group.requestQuery)
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join("&");
    return qs ? `${u}?${qs}` : u;
  }, [backend, group.path, group.requestQuery]);

  const backendCurl = useMemo(() => {
    if (!backendUrl) return "";
    const parts = [`curl -X ${group.method} '${backendUrl}'`];
    enabledRows(group.requestHeaders).forEach((h) => parts.push(`-H '${h.key}: ${h.value}'`));
    const b = group.requestBody;
    if (b && b.mode !== "none" && b.content.trim() && !["GET", "HEAD"].includes(group.method)) {
      parts.push(`--data-raw '${b.content.replace(/'/g, "'\\''")}'`);
    }
    return parts.join(" \\\n  ");
  }, [backendUrl, group.method, group.requestHeaders, group.requestBody]);

  return (
    <div>
      <div className={s.card} style={{ padding: "12px 14px", marginBottom: 12 }}>
        <span className={s.label}>URL Backend Asli (informasi)</span>
        {backendUrl ? (
          <div className={s.flex} style={{ flexWrap: "nowrap" }}>
            <code className={s.mono} style={{ flex: 1, minWidth: 0, wordBreak: "break-all", fontSize: 12 }}>
              <strong>{group.method}</strong> {backendUrl}
            </code>
            <CopyButton text={backendUrl} label="Copy URL" />
            <CopyButton text={backendCurl} label="Copy cURL" />
          </div>
        ) : (
          <p className={s.muted}>
            {backend
              ? <>Belum diatur. Tambahkan <code>{backend.envKey}</code> di file <code>.env</code> untuk menampilkan URL backend asli.</>
              : "Memuat…"}
          </p>
        )}
        <p className={s.muted} style={{ marginTop: 6 }}>
          Request di bawah dikirim ke URL mock. Jika endpoint nonaktif atau tidak punya response aktif, request diteruskan ke backend asli ini.
        </p>
      </div>

      <div className={s.requestLine}>
        <select className={s.select} style={{ width: 100 }} value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Method">
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input className={`${s.input} ${s.mono}`} style={{ flex: 1, minWidth: 200 }} value={url} onChange={(e) => setUrl(e.target.value)} aria-label="URL" />
        {loading ? (
          <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={() => abortRef.current?.abort()}>Batal</button>
        ) : (
          <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={send}>Send (Ctrl+Enter)</button>
        )}
      </div>

      <div className={s.subtabs}>
        {(["params", "headers", "body"] as const).map((t) => (
          <button key={t} type="button" className={`${s.subtab} ${reqTab === t ? s.subtabActive : ""}`} onClick={() => setReqTab(t)}>
            {t === "params" ? "Params" : t === "headers" ? "Headers" : "Body"}
          </button>
        ))}
      </div>
      <div className={s.card}>
        {reqTab === "params" && <KeyValueTable rows={params} onChange={setParams} />}
        {reqTab === "headers" && <KeyValueTable rows={headers} onChange={setHeaders} />}
        {reqTab === "body" && (
          <div>
            <div className={s.flex} style={{ marginBottom: 8 }}>
              {(["none", "json", "text"] as const).map((m) => (
                <label key={m} className={s.flex} style={{ gap: 4 }}>
                  <input type="radio" name="try-body" checked={bodyMode === m} onChange={() => setBodyMode(m)} />
                  {m === "none" ? "None" : m.toUpperCase()}
                </label>
              ))}
            </div>
            {bodyMode !== "none" && (
              <textarea className={s.textarea} rows={8} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Request body" />
            )}
          </div>
        )}
      </div>

      {error && <div className={`${s.notice} ${s.noticeErr}`}>{error}</div>}

      {result && (
        <div className={s.card}>
          <div className={s.flex} style={{ marginBottom: 10 }}>
            <StatusBadge status={result.status} />
            <strong>{result.statusText || ""}</strong>
            <span className={s.muted}>{result.ms} ms</span>
            <span className={s.muted}>{result.size} B</span>
            {result.mock && <span className={`${s.pill} ${s.noticeOk}`}>MOCK: {result.mock}</span>}
            <span style={{ marginLeft: "auto" }}>
              <CopyButton text={resTab === "body" ? prettyBody : result.headers.map(([k, v]) => `${k}: ${v}`).join("\n")} label="Salin" iconOnly />
            </span>
          </div>
          <div className={s.flex} style={{ marginBottom: 8 }}>
            {(["body", "headers"] as const).map((t) => (
              <button key={t} type="button" className={`${s.btn} ${resTab === t ? s.btnPrimary : ""}`} onClick={() => setResTab(t)}>
                {t === "body" ? "Body" : `Headers (${result.headers.length})`}
              </button>
            ))}
          </div>
          <pre className={s.code}>
            {resTab === "body" ? prettyBody || "(kosong)" : result.headers.map(([k, v]) => `${k}: ${v}`).join("\n")}
          </pre>
        </div>
      )}
      <p className={s.muted}>
        Ingin pengujian lebih lengkap? <Link href="/tester" style={{ color: "#00aa13" }}>Buka API Tester</Link>.
      </p>
    </div>
  );
}
