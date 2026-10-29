"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, FolderOpenIcon, LayersIcon } from "@/components/Icons";
import type { MockCollection } from "@/lib/mockTypes";
import { groupLabel } from "@/lib/mockDocs";
import { Highlight, MethodBadge, StatusDot } from "./ui";
import { getMockStatus } from "@/lib/mockUi";
import s from "./mocks.module.css";

export type TreeTarget =
  | { type: "collection"; collectionId: string }
  | { type: "folder"; collectionId: string; folderId: string }
  | { type: "group"; collectionId: string; folderId: string; groupId: string };

const EXPANDED_KEY = "mocks.tree.expanded.v1";

export default function CollectionTree({
  collections,
  query,
  methodFilter,
  serviceFilter,
  activeGroupId,
  onOpenGroup,
  onOpenCollection,
  onMenu,
  onRenameFolder,
}: {
  collections: MockCollection[];
  query: string;
  methodFilter: string;
  serviceFilter: string;
  activeGroupId: string | null;
  onOpenGroup: (t: Extract<TreeTarget, { type: "group" }>) => void;
  onOpenCollection: (collectionId: string) => void;
  onMenu: (e: React.MouseEvent, t: TreeTarget) => void;
  onRenameFolder: (collectionId: string, folderId: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EXPANDED_KEY);
      if (raw) setExpanded(JSON.parse(raw));
    } catch {
      // abaikan
    }
  }, []);

  const toggle = (id: string, current: boolean) => {
    const next = { ...expanded, [id]: !current };
    setExpanded(next);
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(next));
  };

  const q = query.trim().toLowerCase();
  const filtering = q !== "" || methodFilter !== "Semua Method";

  const filtered = useMemo(() => {
    return collections
      .filter((c) => serviceFilter === "Semua Service" || c.service === serviceFilter)
      .map((c) => {
        const colHit = q !== "" && (c.name.toLowerCase().includes(q) || c.service.toLowerCase().includes(q));
        const folders = c.folders
          .map((f) => {
            const folderHit = q !== "" && f.name.toLowerCase().includes(q);
            const groups = f.groups.filter((g) => {
              if (methodFilter !== "Semua Method" && g.method.toUpperCase() !== methodFilter) return false;
              if (!q || colHit || folderHit) return true;
              return (
                g.path.toLowerCase().includes(q) ||
                g.method.toLowerCase().includes(q) ||
                (g.name ?? "").toLowerCase().includes(q)
              );
            });
            return { ...f, groups };
          })
          .filter((f) => !filtering || f.groups.length > 0);
        return { ...c, folders };
      })
      .filter((c) => !filtering || c.folders.length > 0);
  }, [collections, q, methodFilter, serviceFilter, filtering]);

  if (filtered.length === 0) {
    return <div className={s.empty}>{filtering ? "Tidak ada hasil." : "Belum ada collection."}</div>;
  }

  return (
    <div className={s.tree} role="tree">
      {filtered.map((c) => {
        const open = filtering || expanded[c.id] !== false;
        return (
          <div key={c.id}>
            <div
              className={`${s.row} ${c.enabled ? "" : s.rowDim}`}
              style={{ paddingLeft: 6 }}
              role="treeitem"
              aria-expanded={open}
              tabIndex={0}
              onClick={() => onOpenCollection(c.id)}
              onKeyDown={(e) => e.key === "Enter" && onOpenCollection(c.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                onMenu(e, { type: "collection", collectionId: c.id });
              }}
            >
              <button
                type="button"
                className={s.iconBtn}
                aria-label={open ? "Ciutkan" : "Buka"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(c.id, open);
                }}
              >
                {open ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
              </button>
              <LayersIcon size={14} />
              <span className={s.rowLabel} style={{ fontWeight: 700 }} title={`${c.name} (service: ${c.service})`}>
                <Highlight text={c.name} query={query} />
              </span>
              {!c.enabled && <span className={s.offPill}>OFF</span>}
              <button
                type="button"
                className={`${s.iconBtn} ${s.rowMenu}`}
                aria-label="Menu collection"
                title="Menu"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenu(e, { type: "collection", collectionId: c.id });
                }}
              >
                ⋯
              </button>
            </div>
            {open &&
              c.folders.map((f) => {
                const fOpen = filtering || expanded[f.id] !== false;
                return (
                  <div key={f.id}>
                    <div
                      className={s.row}
                      style={{ paddingLeft: 18 }}
                      role="treeitem"
                      aria-expanded={fOpen}
                      tabIndex={0}
                      onClick={() => toggle(f.id, fOpen)}
                      onKeyDown={(e) => e.key === "Enter" && toggle(f.id, fOpen)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onMenu(e, { type: "folder", collectionId: c.id, folderId: f.id });
                      }}
                    >
                      <span className={s.iconBtn}>
                        {fOpen ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
                      </span>
                      {fOpen ? <FolderOpenIcon size={14} /> : <FolderIcon size={14} />}
                      {renaming === f.id ? (
                        <input
                          autoFocus
                          className={s.input}
                          style={{ padding: "2px 6px" }}
                          defaultValue={f.name}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => setRenaming(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setRenaming(null);
                            if (e.key === "Enter") {
                              const v = e.currentTarget.value.trim();
                              if (v && v !== f.name) onRenameFolder(c.id, f.id, v);
                              setRenaming(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className={s.rowLabel}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setRenaming(f.id);
                          }}
                          title="Klik dua kali untuk rename"
                        >
                          <Highlight text={f.name} query={query} />
                        </span>
                      )}
                      <span className={s.count}>{f.groups.length}</span>
                      <button
                        type="button"
                        className={`${s.iconBtn} ${s.rowMenu}`}
                        aria-label="Menu folder"
                        title="Menu"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenu(e, { type: "folder", collectionId: c.id, folderId: f.id });
                        }}
                      >
                        ⋯
                      </button>
                    </div>
                    {fOpen &&
                      f.groups.map((g) => (
                        <div
                          key={g.id}
                          className={`${s.row} ${g.id === activeGroupId ? s.rowActive : ""} ${getMockStatus(c, g).kind === "off" ? s.rowDim : ""}`}
                          style={{ paddingLeft: 40 }}
                          role="treeitem"
                          tabIndex={0}
                          title={`${g.method} ${g.path}`}
                          onClick={() => onOpenGroup({ type: "group", collectionId: c.id, folderId: f.id, groupId: g.id })}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            onOpenGroup({ type: "group", collectionId: c.id, folderId: f.id, groupId: g.id })
                          }
                          onContextMenu={(e) => {
                            e.preventDefault();
                            onMenu(e, { type: "group", collectionId: c.id, folderId: f.id, groupId: g.id });
                          }}
                        >
                          <MethodBadge method={g.method} />
                          <span className={s.rowLabel}>
                            <Highlight text={groupLabel(g)} query={query} />
                          </span>
                          <StatusDot status={getMockStatus(c, g)} />
                          <button
                            type="button"
                            className={`${s.iconBtn} ${s.rowMenu}`}
                            aria-label="Menu endpoint"
                            title="Menu"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMenu(e, { type: "group", collectionId: c.id, folderId: f.id, groupId: g.id });
                            }}
                          >
                            ⋯
                          </button>
                        </div>
                      ))}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
