"use client";

import { useState } from "react";
import type { MockCollection } from "@/lib/mockTypes";
import { METHODS, RESERVED_SERVICES } from "@/lib/mockUi";
import { Modal } from "./ui";
import s from "./mocks.module.css";

function Footer({ onClose, busy, label }: { onClose: () => void; busy: boolean; label: string }) {
  return (
    <>
      <button type="button" className={s.btn} onClick={onClose}>Batal</button>
      <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={busy}>{busy ? "Menyimpan…" : label}</button>
    </>
  );
}

function FormModal({
  title,
  onClose,
  onSubmit,
  label,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => Promise<string | null>;
  label: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            const msg = await onSubmit();
            if (msg) setErr(msg);
            else onClose();
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : "Terjadi kesalahan.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className={s.modalBody}>
          {children}
          {err && <div className={`${s.notice} ${s.noticeErr}`}>{err}</div>}
        </div>
        <div className={s.modalFoot}>
          <Footer onClose={onClose} busy={busy} label={label} />
        </div>
      </form>
    </Modal>
  );
}

export function CollectionModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: MockCollection;
  onClose: () => void;
  onSave: (d: { name: string; service: string; description: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [service, setService] = useState(initial?.service ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  return (
    <FormModal
      title={initial ? "Edit Collection" : "Tambah Collection"}
      onClose={onClose}
      label="Simpan"
      onSubmit={async () => {
        const svc = service.trim().toLowerCase();
        if (!name.trim()) return "Nama wajib diisi.";
        if (!/^[a-z0-9_-]+$/.test(svc)) return "Service hanya boleh huruf kecil, angka, - dan _.";
        if (RESERVED_SERVICES.includes(svc)) return `Service "${svc}" dipakai route internal.`;
        await onSave({ name: name.trim(), service: svc, description });
        return null;
      }}
    >
      <div>
        <label className={s.label} htmlFor="c-name">Nama</label>
        <input id="c-name" autoFocus className={s.input} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className={s.label} htmlFor="c-svc">Service (prefix URL)</label>
        <input id="c-svc" className={s.input} value={service} placeholder="mis. auth" onChange={(e) => setService(e.target.value)} />
      </div>
      <div>
        <label className={s.label} htmlFor="c-desc">Deskripsi</label>
        <textarea id="c-desc" className={s.textarea} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </FormModal>
  );
}

export function FolderModal({
  initialName,
  onClose,
  onSave,
}: {
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName ?? "");
  return (
    <FormModal
      title={initialName ? "Rename Folder" : "Tambah Folder"}
      onClose={onClose}
      label="Simpan"
      onSubmit={async () => {
        if (!name.trim()) return "Nama folder wajib diisi.";
        await onSave(name.trim());
        return null;
      }}
    >
      <div>
        <label className={s.label} htmlFor="f-name">Nama folder</label>
        <input id="f-name" autoFocus className={s.input} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
    </FormModal>
  );
}

export function EndpointModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: { method: string; path: string; name: string; description: string }) => Promise<void>;
}) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <FormModal
      title="Tambah Endpoint"
      onClose={onClose}
      label="Tambah"
      onSubmit={async () => {
        const p = path.trim();
        if (!p || p === "") return "Path wajib diisi.";
        await onSave({ method, path: p.startsWith("/") ? p : `/${p}`, name, description });
        return null;
      }}
    >
      <div className={s.flex} style={{ flexWrap: "nowrap", alignItems: "flex-end" }}>
        <div>
          <label className={s.label} htmlFor="e-method">Method</label>
          <select id="e-method" className={s.select} value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className={s.label} htmlFor="e-path">Path</label>
          <input id="e-path" autoFocus className={`${s.input} ${s.mono}`} value={path} placeholder="/users/:id" onChange={(e) => setPath(e.target.value)} />
        </div>
      </div>
      <div className={s.muted}>Gunakan <code>:id</code> untuk parameter dinamis.</div>
      <div>
        <label className={s.label} htmlFor="e-name">Nama (opsional)</label>
        <input id="e-name" className={s.input} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className={s.label} htmlFor="e-desc">Deskripsi (opsional)</label>
        <textarea id="e-desc" className={s.textarea} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </FormModal>
  );
}

export function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (mode: "merge" | "replace", data: unknown) => Promise<void>;
}) {
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [data, setData] = useState<unknown>(null);
  const [fileName, setFileName] = useState("");
  const [fileErr, setFileErr] = useState<string | null>(null);
  return (
    <FormModal
      title="Import Collection"
      onClose={onClose}
      label="Import"
      onSubmit={async () => {
        if (!data) return "Pilih file JSON terlebih dahulu.";
        await onImport(mode, data);
        return null;
      }}
    >
      <div>
        <label className={s.label} htmlFor="i-file">File JSON (hasil Export)</label>
        <input
          id="i-file"
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const parsed = JSON.parse(String(reader.result));
                if (!parsed || !Array.isArray(parsed.collections)) throw new Error("File tidak memiliki array 'collections'.");
                setData(parsed);
                setFileErr(null);
              } catch (ex) {
                setData(null);
                setFileErr(ex instanceof Error ? ex.message : "File tidak valid.");
              }
            };
            reader.readAsText(file);
          }}
        />
        {fileName && !fileErr && data !== null && <div className={s.muted}>{fileName} siap diimpor.</div>}
        {fileErr && <div className={s.fieldError}>{fileErr}</div>}
      </div>
      <div className={s.stack}>
        <label className={s.flex} style={{ gap: 6 }}>
          <input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} /> Merge (tambahkan sebagai collection baru)
        </label>
        <label className={s.flex} style={{ gap: 6 }}>
          <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} /> Replace (timpa SEMUA data saat ini)
        </label>
      </div>
    </FormModal>
  );
}
