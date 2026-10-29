"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { ArrowLeftIcon } from "@/components/Icons";
import type { KeyValueDoc, MockCollection } from "@/lib/mockTypes";
import { buildCollectionMarkdown, buildCurl, buildMockUrl, groupLabel, withQuery } from "@/lib/mockDocs";
import { CodeBlock, CopyButton, MethodBadge, StatusBadge } from "../../_components/ui";
import s from "../../_components/mocks.module.css";

function KvTable({ title, rows }: { title: string; rows?: KeyValueDoc[] }) {
  const r = (rows ?? []).filter((x) => x.key.trim());
  if (!r.length) return null;
  return (
    <>
      <h4 style={{ margin: "12px 0 4px", fontSize: 13 }}>{title}</h4>
      <table className={s.docsTable}>
        <thead>
          <tr><th>Key</th><th>Contoh</th><th>Deskripsi</th></tr>
        </thead>
        <tbody>
          {r.map((x, i) => (
            <tr key={i}>
              <td className={s.mono}>{x.key}</td>
              <td className={s.mono}>{x.value}</td>
              <td>{x.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function DocsView({ collectionId }: { collectionId: string }) {
  const [collection, setCollection] = useState<MockCollection | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [activeId, setActiveId] = useState<string>("");
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:4000";

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data: MockCollection[]) => {
        const c = Array.isArray(data) ? data.find((x) => x.id === collectionId) : undefined;
        setCollection(c ?? null);
        setState(c ? "ready" : "missing");
      })
      .catch(() => setState("error"));
  }, [collectionId]);

  useEffect(() => {
    if (state !== "ready") return;
    const els = Array.from(document.querySelectorAll("[data-ep]"));
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [state, collection]);

  const download = () => {
    if (!collection) return;
    const blob = new Blob([buildCollectionMarkdown(collection, origin)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${collection.service}-docs.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (state !== "ready" || !collection) {
    return (
      <>
        <Header currentTab="mocks" subtitle="Dokumentasi" />
        <div className={s.empty}>
          {state === "loading" && "Memuat dokumentasi…"}
          {state === "missing" && "Collection tidak ditemukan."}
          {state === "error" && "Gagal memuat data."}
          <div style={{ marginTop: 12 }}>
            <Link href="/mocks" className={s.btn}><ArrowLeftIcon size={14} /> Kembali ke Workspace</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header currentTab="mocks" subtitle={`Dokumentasi: ${collection.name}`} />
      <div className={s.docsLayout}>
        <nav className={s.toc} aria-label="Daftar isi">
          <div style={{ fontWeight: 800, padding: "0 8px 6px" }}>{collection.name}</div>
          {collection.folders.map((f) => (
            <div key={f.id}>
              <div className={s.tocFolder}>{f.name}</div>
              {f.groups.map((g) => (
                <a key={g.id} href={`#ep-${g.id}`} className={`${s.tocLink} ${activeId === `ep-${g.id}` ? s.tocActive : ""}`}>
                  <MethodBadge method={g.method} />
                  <span className={s.rowLabel}>{groupLabel(g)}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className={s.docsContent}>
          <div className={s.docsToolbar}>
            <Link href="/mocks" className={s.btn}><ArrowLeftIcon size={14} /> Workspace</Link>
            <CopyButton text={buildCollectionMarkdown(collection, origin)} label="Copy Markdown" />
            <button type="button" className={s.btn} onClick={download}>Download .md</button>
            <button type="button" className={s.btn} onClick={() => window.print()}>Print</button>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{collection.name}</h1>
          {collection.description && <p style={{ margin: "8px 0", color: "#4b5563" }}>{collection.description}</p>}
          <p className={s.muted}>Base URL: <code>{buildMockUrl(origin, collection.service, "")}</code></p>

          {collection.folders.map((f) => (
            <section key={f.id}>
              <h2 className={s.docsH2}>{f.name}</h2>
              {f.groups.length === 0 && <p className={s.muted}>Belum ada endpoint.</p>}
              {f.groups.map((g) => {
                const url = buildMockUrl(origin, collection.service, g.path);
                return (
                  <article key={g.id} id={`ep-${g.id}`} data-ep className={s.docsEndpoint}>
                    <div className={s.docsPath}>
                      <MethodBadge method={g.method} />
                      <span className={s.mono}>{g.path}</span>
                      {g.enabled === false && <span className={`${s.pill} ${s.noticeWarn}`}>Nonaktif</span>}
                    </div>
                    {g.name && <div style={{ fontWeight: 600, margin: "6px 0" }}>{g.name}</div>}
                    {g.description && <p style={{ margin: "6px 0", whiteSpace: "pre-wrap" }}>{g.description}</p>}
                    <div className={s.flex} style={{ margin: "8px 0" }}>
                      <code>{url}</code>
                      <CopyButton text={url} />
                    </div>
                    <KvTable title="Query Params" rows={g.requestQuery} />
                    <KvTable title="Headers" rows={g.requestHeaders} />
                    {g.requestBody && g.requestBody.mode !== "none" && g.requestBody.content.trim() && (
                      <div style={{ margin: "10px 0" }}>
                        <CodeBlock title="Request Body" code={g.requestBody.content} />
                      </div>
                    )}
                    <div style={{ margin: "10px 0" }}>
                      <CodeBlock
                        title="cURL"
                        code={buildCurl({ method: g.method, url: withQuery(url, g.requestQuery), headers: g.requestHeaders, body: g.requestBody })}
                      />
                    </div>
                    <h4 style={{ margin: "12px 0 6px", fontSize: 13 }}>Response</h4>
                    {g.variants.length === 0 && <p className={s.muted}>Belum ada contoh response.</p>}
                    {g.variants.map((v) => (
                      <div key={v.id} style={{ marginBottom: 12 }}>
                        <div className={s.flex} style={{ marginBottom: 4 }}>
                          <StatusBadge status={v.responseStatus} />
                          <strong>{v.name}</strong>
                          {v.id === g.activeVariantId && <span className={`${s.pill} ${s.noticeOk}`}>AKTIF</span>}
                        </div>
                        {v.description && <p className={s.muted}>{v.description}</p>}
                        <CodeBlock title={`Body${v.delayMs ? ` • delay ${v.delayMs}ms` : ""}`} code={v.responseBody || "(kosong)"} />
                      </div>
                    ))}
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
