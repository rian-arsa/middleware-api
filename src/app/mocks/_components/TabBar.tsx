"use client";

import { useState } from "react";
import { CloseIcon, LayersIcon } from "@/components/Icons";
import { ContextMenu, MethodBadge } from "./ui";
import s from "./mocks.module.css";

export interface TabItem {
  key: string;
  label: string;
  method?: string;
}

export default function TabBar({
  items,
  activeKey,
  onSelect,
  onClose,
  onCloseOthers,
  onCloseAll,
}: {
  items: TabItem[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  onClose: (key: string) => void;
  onCloseOthers: (key: string) => void;
  onCloseAll: () => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number; key: string } | null>(null);
  if (items.length === 0) return null;
  return (
    <div className={s.tabbar} role="tablist">
      {items.map((t) => (
        <div
          key={t.key}
          role="tab"
          aria-selected={t.key === activeKey}
          tabIndex={0}
          className={`${s.tab} ${t.key === activeKey ? s.tabActive : ""}`}
          onClick={() => onSelect(t.key)}
          onKeyDown={(e) => e.key === "Enter" && onSelect(t.key)}
          onAuxClick={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              onClose(t.key);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ x: e.clientX, y: e.clientY, key: t.key });
          }}
        >
          {t.method ? <MethodBadge method={t.method} /> : <LayersIcon size={13} />}
          <span className={s.tabLabel}>{t.label}</span>
          <button
            type="button"
            className={s.iconBtn}
            aria-label="Tutup tab"
            title="Tutup tab"
            onClick={(e) => {
              e.stopPropagation();
              onClose(t.key);
            }}
          >
            <CloseIcon size={11} />
          </button>
        </div>
      ))}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: "Tutup", onClick: () => onClose(menu.key) },
            { label: "Tutup lainnya", onClick: () => onCloseOthers(menu.key) },
            { label: "Tutup semua", onClick: onCloseAll },
          ]}
        />
      )}
    </div>
  );
}
