"use client";

import { useEffect, useState } from "react";
import type { MockCollection, MockFolder, MockGroup } from "@/lib/mockTypes";
import { buildMockUrl, groupLabel } from "@/lib/mockDocs";
import { METHODS } from "@/lib/mockUi";
import DocsTab from "./DocsTab";
import ResponsesTab from "./ResponsesTab";
import TryItTab from "./TryItTab";
import { CopyButton } from "./ui";
import type { MocksActions } from "./useMocks";
import s from "./mocks.module.css";

type SubTab = "docs" | "responses" | "try";

export default function EndpointPanel({
  collection,
  folder,
  group,
  actions,
  notify,
}: {
  collection: MockCollection;
  folder: MockFolder;
  group: MockGroup;
  actions: MocksActions;
  notify: (msg: string, kind?: "ok" | "error") => void;
}) {
  const [tab, setTab] = useState<SubTab>("docs");
  const [path, setPath] = useState(group.path);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => setPath(group.path), [group.path]);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:4000";
  const fullUrl = buildMockUrl(origin, collection.service, group.path);
  const active = group.variants.find((v) => v.id === group.activeVariantId);

  const update = async (d: Partial<MockGroup>) => {
    try {
      await actions.updateGroup(collection.id, folder.id, group.id, d);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Gagal menyimpan.", "error");
    }
  };

  const commitPath = () => {
    const p = path.trim();
    if (!p) {
      setPath(group.path);
      return;
    }
    const norm = p.startsWith("/") ? p : `/${p}`;
    if (norm !== group.path) update({ path: norm });
  };

  return (
    <div className={s.panel}>
      <div className={s.breadcrumb}>
        {collection.name} / {folder.name} / <strong>{groupLabel(group)}</strong>
      </div>

      <div className={s.requestLine}>
        <select className={s.select} style={{ width: 100, fontWeight: 700 }} value={group.method} onChange={(e) => update({ method: e.target.value })} aria-label="Method">
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <span className={`${s.urlPrefix} ${s.mono}`}>{origin}/{collection.service}</span>
        <input
          className={`${s.input} ${s.mono}`}
          style={{ flex: 1, minWidth: 160 }}
          value={path}
          aria-label="Path endpoint"
          title="Gunakan :id untuk parameter dinamis, mis. /users/:id"
          onChange={(e) => setPath(e.target.value)}
          onBlur={commitPath}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
        <CopyButton text={fullUrl} label="Copy URL" />
        <label className={s.flex} style={{ gap: 6 }}>
          <input type="checkbox" checked={group.enabled !== false} onChange={(e) => update({ enabled: e.target.checked })} />
          Aktif
        </label>
      </div>
      <div className={s.muted} style={{ marginTop: 4 }}>
        Tip: gunakan <code>:id</code> untuk parameter dinamis, mis. <code>/users/:id</code>.
      </div>

      {active ? (
        <div className={`${s.notice} ${s.noticeOk}`}>
          Response aktif: {active.responseStatus} {active.name}
        </div>
      ) : (
        <div className={`${s.notice} ${s.noticeWarn}`}>
          Peringatan: Belum ada response aktif — request akan diteruskan ke backend asli.
        </div>
      )}

      <div className={s.subtabs} role="tablist">
        {(
          [
            ["docs", "Docs"],
            ["responses", `Responses (${group.variants.length})`],
            ["try", "Try it"],
          ] as [SubTab, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${s.subtab} ${tab === k ? s.subtabActive : ""}`} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "docs" && (
        <DocsTab
          collection={collection}
          group={group}
          actions={actions}
          notify={notify}
          onOpenResponse={(id) => {
            setSelectedVariant(id);
            setTab("responses");
          }}
        />
      )}
      {tab === "responses" && (
        <ResponsesTab group={group} actions={actions} notify={notify} selectedId={selectedVariant} onSelect={setSelectedVariant} />
      )}
      {tab === "try" && <TryItTab collection={collection} group={group} />}
    </div>
  );
}
