"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyValueDoc, MockCollection, MockGroup, RequestBodyDoc } from "@/lib/mockTypes";
import { buildAxiosSnippet, buildCurl, buildFetchSnippet, buildMockUrl, withQuery } from "@/lib/mockDocs";
import { CodeBlock, KeyValueTable, StatusBadge } from "./ui";
import { BracesIcon, EyeIcon } from "@/components/Icons";
import type { MocksActions } from "./useMocks";
import s from "./mocks.module.css";

const clean = (rows: KeyValueDoc[]) => rows.filter((r) => r.key.trim() !== "");

export default function DocsTab({
  collection,
  group,
  actions,
  notify,
  onOpenResponse,
}: {
  collection: MockCollection;
  group: MockGroup;
  actions: MocksActions;
  notify: (msg: string, kind?: "ok" | "error") => void;
  onOpenResponse: (variantId: string) => void;
}) {
  const initial = useMemo(
    () => ({
      name: group.name ?? "",
      description: group.description ?? "",
      query: group.requestQuery ?? [],
      headers: group.requestHeaders ?? [],
      body: group.requestBody ?? ({ mode: "none", content: "" } as RequestBodyDoc),
    }),
    [group]
  );
  const [draft, setDraft] = useState(initial);
  const [snippetTab, setSnippetTab] = useState<"curl" | "fetch" | "axios">("curl");
  const lastSaved = useRef(JSON.stringify(initial));

  const initialKey = JSON.stringify(initial);
  useEffect(() => {
    setDraft(initial);
    lastSaved.current = initialKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const dirty = JSON.stringify(draft) !== lastSaved.current;

  const save = async () => {
    try {
      await actions.updateGroup(group.collectionId, group.folderId, group.id, {
        name: draft.name,
        description: draft.description,
        requestQuery: clean(draft.query),
        requestHeaders: clean(draft.headers),
        requestBody: draft.body,
      });
      lastSaved.current = JSON.stringify(draft);
      notify("Dokumentasi disimpan.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Gagal menyimpan.", "error");
    }
  };

  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:4000";
  const url = buildMockUrl(origin, collection.service, group.path);
  const snippetInput = {
    method: group.method,
    url: withQuery(url, clean(draft.query)),
    headers: clean(draft.headers),
    body: draft.body,
  };
  const snippet =
    snippetTab === "curl"
      ? buildCurl(snippetInput)
      : snippetTab === "fetch"
        ? buildFetchSnippet(snippetInput)
        : buildAxiosSnippet(snippetInput);

  const formatJson = () => {
    try {
      setDraft({ ...draft, body: { ...draft.body, content: JSON.stringify(JSON.parse(draft.body.content), null, 2) } });
    } catch {
      notify("JSON tidak valid.", "error");
    }
  };

  return (
    <div>
      <div className={s.flex} style={{ justifyContent: "flex-end", marginBottom: 10 }}>
        {dirty && <span className={s.muted}>Perubahan belum disimpan<span className={s.dot} /></span>}
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled={!dirty} onClick={save}>
          Simpan (Ctrl+S)
        </button>
      </div>

      <div className={s.card}>
        <div className={s.stack}>
          <div>
            <label className={s.label} htmlFor="doc-name">Nama endpoint</label>
            <input id="doc-name" className={s.input} value={draft.name} placeholder="mis. List Users" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className={s.label} htmlFor="doc-desc">Deskripsi</label>
            <textarea id="doc-desc" className={s.textarea} rows={3} value={draft.description} placeholder="Jelaskan fungsi endpoint ini…" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
        </div>
      </div>

      <div className={s.card}>
        <h3 className={s.cardTitle}>Query Params</h3>
        <KeyValueTable showDescription rows={draft.query} onChange={(query) => setDraft({ ...draft, query })} />
      </div>

      <div className={s.card}>
        <h3 className={s.cardTitle}>Headers</h3>
        <KeyValueTable showDescription rows={draft.headers} onChange={(headers) => setDraft({ ...draft, headers })} />
      </div>

      <div className={s.card}>
        <h3 className={s.cardTitle}>Request Body (contoh)</h3>
        <div className={s.flex} style={{ marginBottom: 8 }}>
          {(["none", "json", "text"] as const).map((m) => (
            <label key={m} className={s.flex} style={{ gap: 4 }}>
              <input type="radio" name="body-mode" checked={draft.body.mode === m} onChange={() => setDraft({ ...draft, body: { ...draft.body, mode: m } })} />
              {m === "none" ? "None" : m.toUpperCase()}
            </label>
          ))}
          {draft.body.mode === "json" && (
            <button type="button" className={`${s.btn} ${s.btnIcon}`} title="Format JSON" aria-label="Format JSON" onClick={formatJson}><BracesIcon size={14} /></button>
          )}
        </div>
        {draft.body.mode !== "none" && (
          <textarea className={s.textarea} rows={8} value={draft.body.content} onChange={(e) => setDraft({ ...draft, body: { ...draft.body, content: e.target.value } })} aria-label="Request body" />
        )}
      </div>

      <div className={s.card}>
        <h3 className={s.cardTitle}>Contoh Response</h3>
        {group.variants.length === 0 && <p className={s.muted}>Belum ada response. Tambahkan di tab Responses.</p>}
        <div className={s.stack}>
          {group.variants.map((v) => (
            <div key={v.id} className={s.flex} style={{ justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className={s.flex}>
                  <StatusBadge status={v.responseStatus} />
                  <strong>{v.name}</strong>
                  {v.id === group.activeVariantId && <span className={`${s.pill} ${s.noticeOk}`}>AKTIF</span>}
                </div>
                <pre className={`${s.mono} ${s.muted}`} style={{ margin: "6px 0 0", maxHeight: 54, overflow: "hidden", whiteSpace: "pre-wrap" }}>{v.responseBody.slice(0, 240)}</pre>
              </div>
              <button type="button" className={`${s.btn} ${s.btnIcon}`} title="Lihat response" aria-label="Lihat response" onClick={() => onOpenResponse(v.id)}><EyeIcon size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className={s.card}>
        <h3 className={s.cardTitle}>Code Snippet</h3>
        <div className={s.flex} style={{ marginBottom: 8 }}>
          {(["curl", "fetch", "axios"] as const).map((t) => (
            <button key={t} type="button" className={`${s.btn} ${snippetTab === t ? s.btnPrimary : ""}`} onClick={() => setSnippetTab(t)}>
              {t === "curl" ? "cURL" : t}
            </button>
          ))}
        </div>
        <CodeBlock title={snippetTab} code={snippet} />
      </div>
    </div>
  );
}
