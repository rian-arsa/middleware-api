"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckIcon, CloseIcon, CopyIcon, TrashIcon } from "@/components/Icons";
import type { KeyValueDoc } from "@/lib/mockTypes";
import { getMethodStyle, getStatusStyle, type MockStatus } from "@/lib/mockUi";
import s from "./mocks.module.css";

export function MethodBadge({ method }: { method: string }) {
  const c = getMethodStyle(method);
  return (
    <span className={s.badge} style={{ background: c.bg, color: c.text }}>
      {method.toUpperCase()}
    </span>
  );
}

export function StatusBadge({ status }: { status: number }) {
  const c = getStatusStyle(status);
  return (
    <span className={s.pill} style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyButton({ text, label = "Copy", className, iconOnly }: { text: string; label?: string; className?: string; iconOnly?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title={iconOnly ? (done ? "Tersalin" : label) : undefined}
      aria-label={iconOnly ? label : undefined}
      className={className ?? (iconOnly ? `${s.btn} ${s.btnIcon}` : s.btn)}
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }
      }}
    >
      {done ? <CheckIcon size={iconOnly ? 14 : 12} /> : <CopyIcon size={iconOnly ? 14 : 12} />}
      {!iconOnly && <> {done ? "Tersalin" : label}</>}
    </button>
  );
}

export function StatusDot({ status }: { status: MockStatus }) {
  const cls = status.kind === "on" ? s.statusOn : status.kind === "off" ? s.statusOff : s.statusWarn;
  return <span className={`${s.statusDot} ${cls}`} title={`${status.label}. ${status.detail}`} role="img" aria-label={status.label} />;
}

export function StatusBanner({
  status,
  checked,
  onToggle,
  toggleLabel,
}: {
  status: MockStatus;
  checked: boolean;
  onToggle: (v: boolean) => void;
  toggleLabel: string;
}) {
  const cls = status.kind === "on" ? s.statusBannerOn : status.kind === "off" ? s.statusBannerOff : s.statusBannerWarn;
  const dot = status.kind === "on" ? s.statusOn : status.kind === "off" ? s.statusOff : s.statusWarn;
  return (
    <div className={`${s.statusBanner} ${cls}`} role="status">
      <span className={`${s.statusDot} ${dot}`} aria-hidden="true" />
      <div className={s.statusBannerText}>
        <strong>{status.label}</strong>
        {status.detail}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={`${s.switch} ${checked ? s.switchOn : ""}`}
        onClick={() => onToggle(!checked)}
      />
    </div>
  );
}

export function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className={s.codeWrap}>
      <div className={s.codeHeader}>
        <span>{title ?? ""}</span>
        <CopyButton text={code} className={s.codeBtn} />
      </div>
      <pre className={s.code}>{code}</pre>
    </div>
  );
}

export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className={s.mark}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export interface MenuItem {
  label: string;
  danger?: boolean;
  separator?: boolean;
  onClick?: () => void;
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 200);
  const top = Math.min(y, window.innerHeight - items.length * 30 - 16);
  return (
    <div ref={ref} className={s.menu} style={{ left, top }} role="menu">
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} className={s.menuSep} />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            className={`${s.menuItem} ${it.danger ? s.menuDanger : ""}`}
            onClick={() => {
              onClose();
              it.onClick?.();
            }}
          >
            {it.label}
          </button>
        )
      )}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={wide ? { maxWidth: 640 } : undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.modalHead}>
          <span>{title}</span>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Tutup" title="Tutup">
            <CloseIcon size={14} />
          </button>
        </div>
        {children}
        {footer && <div className={s.modalFoot}>{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Hapus",
  danger = true,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={s.btn} onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className={`${s.btn} ${danger ? s.btnDanger : s.btnPrimary}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
                onClose();
              }
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className={s.modalBody}>
        <p>{message}</p>
      </div>
    </Modal>
  );
}

export function Toast({ message, kind }: { message: string; kind: "ok" | "error" }) {
  return <div className={`${s.toast} ${kind === "error" ? s.toastError : ""}`}>{message}</div>;
}

const emptyRow = (): KeyValueDoc => ({ key: "", value: "", description: "", enabled: true });

/** Editor key-value ala Postman: selalu ada satu baris kosong di bawah. */
export function KeyValueTable({
  rows,
  onChange,
  showDescription,
}: {
  rows: KeyValueDoc[];
  onChange: (rows: KeyValueDoc[]) => void;
  showDescription?: boolean;
}) {
  const view = [...rows, emptyRow()];
  const update = (i: number, patch: Partial<KeyValueDoc>) => {
    const next = view.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next.filter((r, idx) => idx < next.length - 1 || r.key !== "" || r.value !== "" || r.description));
  };
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <table className={s.kv}>
      <thead>
        <tr>
          <th style={{ width: 28 }} />
          <th>Key</th>
          <th>Value</th>
          {showDescription && <th>Deskripsi</th>}
          <th style={{ width: 28 }} />
        </tr>
      </thead>
      <tbody>
        {view.map((r, i) => {
          const isGhost = i === rows.length;
          return (
            <tr key={i}>
              <td>
                {!isGhost && (
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    aria-label="Aktif"
                    onChange={(e) => update(i, { enabled: e.target.checked })}
                  />
                )}
              </td>
              <td>
                <input type="text" value={r.key} placeholder="key" onChange={(e) => update(i, { key: e.target.value })} />
              </td>
              <td>
                <input type="text" value={r.value} placeholder="value" onChange={(e) => update(i, { value: e.target.value })} />
              </td>
              {showDescription && (
                <td>
                  <input
                    type="text"
                    value={r.description ?? ""}
                    placeholder="deskripsi"
                    onChange={(e) => update(i, { description: e.target.value })}
                  />
                </td>
              )}
              <td>
                {!isGhost && (
                  <button type="button" className={s.iconBtn} onClick={() => remove(i)} aria-label="Hapus baris" title="Hapus baris">
                    <TrashIcon size={12} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
