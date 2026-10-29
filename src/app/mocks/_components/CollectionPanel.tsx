"use client";

import { useEffect, useState } from "react";
import type { MockCollection } from "@/lib/mockTypes";
import { buildMockUrl, countStats, groupLabel } from "@/lib/mockDocs";
import { CopyButton, MethodBadge } from "./ui";
import { DownloadIcon, TrashIcon } from "@/components/Icons";
import type { MocksActions } from "./useMocks";
import s from "./mocks.module.css";

export default function CollectionPanel({
  collection,
  actions,
  notify,
  onOpenGroup,
  onDelete,
}: {
  collection: MockCollection;
  actions: MocksActions;
  notify: (msg: string, kind?: "ok" | "error") => void;
  onOpenGroup: (folderId: string, groupId: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description);
  useEffect(() => {
    setName(collection.name);
    setDescription(collection.description);
  }, [collection.name, collection.description]);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:4000";
  const stats = countStats([collection]);

  const save = async (d: Partial<Pick<MockCollection, "name" | "description" | "enabled">>) => {
    try {
      await actions.updateCollection(collection.id, d);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Gagal menyimpan.", "error");
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: 2, collections: [collection] }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${collection.service}-collection.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={s.panel}>
      <div className={s.card}>
        <div className={s.stack}>
          <div>
            <label className={s.label} htmlFor="cp-name">Nama</label>
            <input id="cp-name" className={s.input} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== collection.name && save({ name })} />
          </div>
          <div>
            <label className={s.label} htmlFor="cp-desc">Deskripsi</label>
            <textarea id="cp-desc" className={s.textarea} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} onBlur={() => description !== collection.description && save({ description })} />
          </div>
          <div className={s.flex}>
            <span className={`${s.mono}`}>{buildMockUrl(origin, collection.service, "")}</span>
            <CopyButton text={buildMockUrl(origin, collection.service, "")} label="Copy Base URL" />
            <label className={s.flex} style={{ gap: 6 }}>
              <input type="checkbox" checked={collection.enabled} onChange={(e) => save({ enabled: e.target.checked })} /> Aktif
            </label>
          </div>
          <div className={s.muted}>
            {collection.folders.length} folder • {stats.endpoints} endpoint • {stats.variants} response
          </div>
          <div className={s.flex}>
            <a className={`${s.btn} ${s.btnPrimary}`} href={`/mocks/docs/${collection.id}`} target="_blank" rel="noreferrer">Lihat Dokumentasi</a>
            <button type="button" className={`${s.btn} ${s.btnIcon}`} title="Export collection (JSON)" aria-label="Export collection" onClick={exportJson}><DownloadIcon size={14} /></button>
            <button type="button" className={`${s.btn} ${s.btnIcon} ${s.btnDanger}`} title="Hapus collection" aria-label="Hapus collection" onClick={onDelete}><TrashIcon size={14} /></button>
          </div>
        </div>
      </div>

      <div className={s.card}>
        <h3 className={s.cardTitle}>Daftar Endpoint</h3>
        {stats.endpoints === 0 && <p className={s.muted}>Belum ada endpoint. Tambahkan lewat menu folder di sidebar.</p>}
        {collection.folders.map((f) =>
          f.groups.length === 0 ? null : (
            <div key={f.id} style={{ marginBottom: 10 }}>
              <div className={s.label}>{f.name}</div>
              {f.groups.map((g) => (
                <div key={g.id} className={s.row} style={{ paddingLeft: 6 }} role="button" tabIndex={0} onClick={() => onOpenGroup(f.id, g.id)} onKeyDown={(e) => e.key === "Enter" && onOpenGroup(f.id, g.id)}>
                  <MethodBadge method={g.method} />
                  <span className={s.rowLabel}>{groupLabel(g)}</span>
                  <span className={`${s.muted} ${s.mono}`}>{g.path}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
