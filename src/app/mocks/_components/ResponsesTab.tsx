"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BracesIcon, CopyIcon, MinifyIcon, PlusIcon, TrashIcon } from "@/components/Icons";
import type { KeyValueDoc, MockGroup, MockVariant } from "@/lib/mockTypes";
import { STATUS_PRESETS } from "@/lib/mockUi";
import { ConfirmDialog, CopyButton, KeyValueTable, StatusBadge } from "./ui";
import type { MocksActions } from "./useMocks";
import s from "./mocks.module.css";

interface Form {
  name: string;
  description: string;
  status: string;
  delay: string;
  headers: KeyValueDoc[];
  body: string;
}

const toForm = (v: MockVariant): Form => ({
  name: v.name,
  description: v.description ?? "",
  status: String(v.responseStatus),
  delay: String(v.delayMs),
  headers: Object.entries(v.responseHeaders ?? {}).map(([key, value]) => ({ key, value, enabled: true })),
  body: v.responseBody,
});

export default function ResponsesTab({
  group,
  actions,
  notify,
  selectedId,
  onSelect,
}: {
  group: MockGroup;
  actions: MocksActions;
  notify: (msg: string, kind?: "ok" | "error") => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const current = group.variants.find((v) => v.id === selectedId) ?? group.variants[0] ?? null;
  const base = useMemo(() => (current ? JSON.stringify(toForm(current)) : ""), [current]);
  const [form, setForm] = useState<Form | null>(current ? toForm(current) : null);
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const currentId = current?.id ?? null;

  useEffect(() => {
    setForm(current ? toForm(current) : null);
    // reset hanya saat variant berganti atau data server berubah
  }, [base]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = form !== null && JSON.stringify(form) !== base;

  const statusNum = Number(form?.status);
  const statusValid = Number.isInteger(statusNum) && statusNum >= 100 && statusNum <= 599;
  const delayNum = Number(form?.delay);
  const delayValid = form !== null && form.delay.trim() !== "" && delayNum >= 0 && delayNum <= 60000;
  const nameValid = !!form?.name.trim();

  const contentType =
    form?.headers.find((h) => h.key.toLowerCase() === "content-type")?.value.toLowerCase() ?? "";
  let jsonWarn = false;
  if (form && contentType.includes("json") && form.body.trim()) {
    try {
      JSON.parse(form.body);
    } catch {
      jsonWarn = true;
    }
  }

  const select = (id: string | null) => {
    if (dirty) {
      setPending(id);
      return;
    }
    onSelect(id);
  };

  const save = async () => {
    if (!current || !form) return;
    if (!nameValid || !statusValid || !delayValid) {
      notify("Periksa nama, status (100–599), dan delay (0–60000).", "error");
      return;
    }
    const headers: Record<string, string> = {};
    form.headers.filter((h) => h.key.trim() && h.enabled !== false).forEach((h) => (headers[h.key.trim()] = h.value));
    try {
      await actions.updateVariant(group.collectionId, group.folderId, group.id, current.id, {
        name: form.name,
        description: form.description,
        responseStatus: statusNum,
        delayMs: delayNum,
        responseHeaders: headers,
        responseBody: form.body,
      });
      notify("Response disimpan.");
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

  const addVariant = async () => {
    try {
      const v = await actions.createVariant(group.collectionId, group.folderId, group.id, {
        name: `Response ${group.variants.length + 1}`,
        responseStatus: 200,
        responseHeaders: { "content-type": "application/json" },
        responseBody: '{\n  "message": "success"\n}',
        delayMs: 0,
      });
      onSelect(v.id);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Gagal menambah response.", "error");
    }
  };

  const setActive = async (id: string) => {
    try {
      await actions.updateGroup(group.collectionId, group.folderId, group.id, { activeVariantId: id });
    } catch (e) {
      notify(e instanceof Error ? e.message : "Gagal mengaktifkan response.", "error");
    }
  };

  const formatJson = (min: boolean) => {
    if (!form) return;
    try {
      const parsed = JSON.parse(form.body);
      setForm({ ...form, body: min ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2) });
    } catch {
      notify("Body bukan JSON yang valid.", "error");
    }
  };

  return (
    <div className={s.grid2}>
      <div className={s.card} style={{ padding: 8 }}>
        <div className={s.stack} style={{ gap: 4 }}>
          {group.variants.map((v) => (
            <div
              key={v.id}
              className={`${s.row} ${v.id === currentId ? s.rowActive : ""}`}
              style={{ paddingLeft: 8, borderRadius: 6 }}
              onClick={() => select(v.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && select(v.id)}
            >
              <input
                type="radio"
                name="active-variant"
                checked={v.id === group.activeVariantId}
                onChange={() => setActive(v.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Jadikan "${v.name}" response aktif`}
                title="Jadikan response aktif"
              />
              <StatusBadge status={v.responseStatus} />
              <span className={s.rowLabel}>{v.name}</span>
              {v.id === group.activeVariantId && <span className={s.count} style={{ color: "#177a37", background: "#e6f9ec" }}>AKTIF</span>}
            </div>
          ))}
        </div>
        <button type="button" className={s.btn} style={{ marginTop: 8, width: "100%", justifyContent: "center" }} onClick={addVariant}>
          <PlusIcon size={12} /> Tambah Response
        </button>
      </div>

      {current && form ? (
        <div className={s.card}>
          <div className={s.stack}>
            <div className={s.flex} style={{ justifyContent: "space-between" }}>
              <strong>
                {form.name || "(tanpa nama)"}
                {dirty && <span className={s.dot} title="Perubahan belum disimpan" />}
              </strong>
              <div className={s.flex}>
                <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled={!dirty} onClick={save}>Simpan</button>
                <button
                  type="button"
                  className={`${s.btn} ${s.btnIcon}`}
                  title="Duplikat response"
                  aria-label="Duplikat response"
                  onClick={async () => {
                    try {
                      await actions.duplicateVariant(group.collectionId, group.folderId, group.id, current.id);
                      notify("Response diduplikasi.");
                    } catch (e) {
                      notify(e instanceof Error ? e.message : "Gagal menduplikasi.", "error");
                    }
                  }}
                >
                  <CopyIcon size={14} />
                </button>
                <button type="button" className={`${s.btn} ${s.btnIcon} ${s.btnDanger}`} title="Hapus response" aria-label="Hapus response" onClick={() => setConfirmDelete(true)}><TrashIcon size={14} /></button>
              </div>
            </div>

            <div>
              <label className={s.label} htmlFor="v-name">Nama</label>
              <input id="v-name" className={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {!nameValid && <div className={s.fieldError}>Nama wajib diisi.</div>}
            </div>
            <div className={s.flex} style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label className={s.label} htmlFor="v-status">Status</label>
                <div className={s.flex} style={{ flexWrap: "nowrap" }}>
                  <select
                    className={s.select}
                    aria-label="Preset status"
                    value={STATUS_PRESETS.some((p) => String(p.code) === form.status) ? form.status : ""}
                    onChange={(e) => e.target.value && setForm({ ...form, status: e.target.value })}
                  >
                    <option value="">Kustom</option>
                    {STATUS_PRESETS.map((p) => (
                      <option key={p.code} value={p.code}>{p.code} {p.text}</option>
                    ))}
                  </select>
                  <input id="v-status" className={s.input} style={{ width: 80 }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
                </div>
                {!statusValid && <div className={s.fieldError}>Status harus angka 100–599.</div>}
              </div>
              <div style={{ width: 140 }}>
                <label className={s.label} htmlFor="v-delay">Delay (ms)</label>
                <input id="v-delay" type="number" min={0} max={60000} className={s.input} value={form.delay} onChange={(e) => setForm({ ...form, delay: e.target.value })} />
                {!delayValid && <div className={s.fieldError}>0–60000.</div>}
              </div>
            </div>
            <div>
              <label className={s.label} htmlFor="v-desc">Deskripsi (kapan response ini dipakai)</label>
              <input id="v-desc" className={s.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <span className={s.label}>Headers</span>
              <KeyValueTable rows={form.headers} onChange={(headers) => setForm({ ...form, headers })} />
            </div>
            <div>
              <div className={s.flex} style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <span className={s.label} style={{ margin: 0 }}>Body</span>
                <div className={s.flex}>
                  <button type="button" className={`${s.btn} ${s.btnIcon}`} title="Format JSON" aria-label="Format JSON" onClick={() => formatJson(false)}><BracesIcon size={14} /></button>
                  <button type="button" className={`${s.btn} ${s.btnIcon}`} title="Minify JSON" aria-label="Minify JSON" onClick={() => formatJson(true)}><MinifyIcon size={14} /></button>
                  <CopyButton text={form.body} label="Salin body" iconOnly />
                </div>
              </div>
              <textarea className={s.textarea} style={{ minHeight: 260 }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} aria-label="Response body" />
              {jsonWarn && <div className={`${s.notice} ${s.noticeWarn}`}>Content-Type JSON, tetapi body bukan JSON yang valid.</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className={`${s.card} ${s.empty}`}>
          <div className={s.emptyTitle}>Belum ada response</div>
          <p style={{ marginBottom: 12 }}>Tambahkan response pertama agar endpoint ini bisa di-mock.</p>
          <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={addVariant}>+ Tambah Response</button>
        </div>
      )}

      {confirmDelete && current && (
        <ConfirmDialog
          title="Hapus Response"
          message={`Hapus response "${current.name}"?`}
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            try {
              await actions.deleteVariant(group.collectionId, group.folderId, group.id, current.id);
              onSelect(null);
            } catch (e) {
              notify(e instanceof Error ? e.message : "Gagal menghapus.", "error");
            }
          }}
        />
      )}
      {pending !== undefined && (
        <ConfirmDialog
          title="Buang perubahan?"
          message="Ada perubahan yang belum disimpan. Buang perubahan dan pindah response?"
          confirmLabel="Buang"
          onClose={() => setPending(undefined)}
          onConfirm={() => {
            const target = pending;
            setPending(undefined);
            if (current) setForm(toForm(current));
            onSelect(target ?? null);
          }}
        />
      )}
    </div>
  );
}
