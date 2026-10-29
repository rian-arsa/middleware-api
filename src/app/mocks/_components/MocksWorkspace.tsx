"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import { DownloadIcon, MenuIcon, PlusIcon, UploadIcon } from "@/components/Icons";
import type { MockCollection } from "@/lib/mockTypes";
import { buildCurl, buildMockUrl, countStats, groupLabel, withQuery } from "@/lib/mockDocs";
import { METHODS } from "@/lib/mockUi";
import CollectionPanel from "./CollectionPanel";
import CollectionTree, { type TreeTarget } from "./CollectionTree";
import { CollectionModal, EndpointModal, FolderModal, ImportModal } from "./Dialogs";
import EndpointPanel from "./EndpointPanel";
import TabBar from "./TabBar";
import { ConfirmDialog, ContextMenu, copyText, Modal, Toast, type MenuItem } from "./ui";
import { collectionKey, endpointKey, useOpenTabs } from "./useOpenTabs";
import { useMocks } from "./useMocks";
import s from "./mocks.module.css";

type ModalState =
  | null
  | { t: "collection"; edit?: MockCollection }
  | { t: "folder"; collectionId: string; folderId?: string; name?: string }
  | { t: "endpoint"; collectionId: string; folderId: string }
  | { t: "import" }
  | { t: "help" }
  | { t: "confirm"; title: string; message: string; onConfirm: () => Promise<void> };

const WIDTH_KEY = "mocks.sidebarWidth.v1";

export default function MocksWorkspace() {
  const { collections, loading, error, refresh, actions } = useMocks();
  const tabsApi = useOpenTabs();
  const { tabs, activeKey, setActiveKey, openTab, closeTab, closeOthers, closeAll, prune } = tabsApi;

  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("Semua Method");
  const [serviceFilter, setServiceFilter] = useState("Semua Service");
  const [modal, setModal] = useState<ModalState>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: "ok" | "error" } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, kind: "ok" | "error" = "ok") => {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const w = Number(localStorage.getItem(WIDTH_KEY));
    if (w >= 220 && w <= 520) setSidebarWidth(w);
  }, []);

  const stats = useMemo(() => countStats(collections), [collections]);
  const services = useMemo(
    () => ["Semua Service", ...Array.from(new Set(collections.map((c) => c.service)))],
    [collections]
  );

  // Buang tab yatim setelah data termuat
  useEffect(() => {
    if (loading || error) return;
    const valid = new Set<string>();
    collections.forEach((c) => {
      valid.add(collectionKey(c.id));
      c.folders.forEach((f) => f.groups.forEach((g) => valid.add(endpointKey(g.id))));
    });
    prune(valid);
  }, [collections, loading, error, prune]);

  const findGroup = useCallback(
    (groupId: string) => {
      for (const c of collections)
        for (const f of c.folders) {
          const g = f.groups.find((x) => x.id === groupId);
          if (g) return { c, f, g };
        }
      return null;
    },
    [collections]
  );

  const tabItems = useMemo(
    () =>
      tabs.flatMap((t) => {
        if (t.kind === "collection") {
          const c = collections.find((x) => x.id === t.collectionId);
          return c ? [{ key: t.key, label: c.name }] : [];
        }
        const found = findGroup(t.groupId);
        return found ? [{ key: t.key, label: groupLabel(found.g), method: found.g.method }] : [];
      }),
    [tabs, collections, findGroup]
  );

  const activeTab = tabs.find((t) => t.key === activeKey) ?? null;
  const activeGroupId = activeTab?.kind === "endpoint" ? activeTab.groupId : null;

  const openGroup = (collectionId: string, folderId: string, groupId: string) => {
    openTab({ key: endpointKey(groupId), kind: "endpoint", collectionId, folderId, groupId });
    setDrawerOpen(false);
  };
  const openCollection = (collectionId: string) =>
    openTab({ key: collectionKey(collectionId), kind: "collection", collectionId });

  const guard = async (fn: () => Promise<unknown>, okMsg?: string) => {
    try {
      await fn();
      if (okMsg) notify(okMsg);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Terjadi kesalahan.", "error");
    }
  };

  const confirm = (title: string, message: string, fn: () => Promise<unknown>, okMsg: string) =>
    setModal({ t: "confirm", title, message, onConfirm: () => guard(fn, okMsg) });

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ version: 2, collections }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mocks-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Collections berhasil diekspor.");
  };

  const buildMenu = (t: TreeTarget): MenuItem[] => {
    const col = collections.find((c) => c.id === t.collectionId);
    if (!col) return [];
    const origin = window.location.origin;

    if (t.type === "collection") {
      return [
        { label: "Buka", onClick: () => openCollection(col.id) },
        { label: "Tambah Folder", onClick: () => setModal({ t: "folder", collectionId: col.id }) },
        { label: "Edit", onClick: () => setModal({ t: "collection", edit: col }) },
        { label: col.enabled ? "Nonaktifkan" : "Aktifkan", onClick: () => guard(() => actions.updateCollection(col.id, { enabled: !col.enabled })) },
        { label: "Lihat Dokumentasi", onClick: () => window.open(`/mocks/docs/${col.id}`, "_blank") },
        { separator: true, label: "" },
        {
          label: "Hapus",
          danger: true,
          onClick: () =>
            confirm("Hapus Collection", `Hapus "${col.name}" beserta ${col.folders.length} folder dan semua endpoint di dalamnya?`, () => actions.deleteCollection(col.id), "Collection dihapus."),
        },
      ];
    }
    const folder = col.folders.find((f) => f.id === t.folderId);
    if (!folder) return [];
    if (t.type === "folder") {
      return [
        { label: "Tambah Endpoint", onClick: () => setModal({ t: "endpoint", collectionId: col.id, folderId: folder.id }) },
        { label: "Rename", onClick: () => setModal({ t: "folder", collectionId: col.id, folderId: folder.id, name: folder.name }) },
        { label: "Duplicate", onClick: () => guard(() => actions.duplicateFolder(col.id, folder.id), "Folder diduplikasi.") },
        { separator: true, label: "" },
        {
          label: "Hapus",
          danger: true,
          onClick: () =>
            confirm("Hapus Folder", `Hapus folder "${folder.name}" beserta ${folder.groups.length} endpoint dan semua response-nya?`, () => actions.deleteFolder(col.id, folder.id), "Folder dihapus."),
        },
      ];
    }
    const g = folder.groups.find((x) => x.id === t.groupId);
    if (!g) return [];
    const url = buildMockUrl(origin, col.service, g.path);
    return [
      { label: "Buka", onClick: () => openGroup(col.id, folder.id, g.id) },
      { label: "Duplicate", onClick: () => guard(() => actions.duplicateGroup(col.id, folder.id, g.id), "Endpoint diduplikasi (nonaktif).") },
      { label: g.enabled === false ? "Aktifkan" : "Nonaktifkan", onClick: () => guard(() => actions.updateGroup(col.id, folder.id, g.id, { enabled: g.enabled === false })) },
      { label: "Copy URL", onClick: async () => notify((await copyText(url)) ? "URL disalin." : "Gagal menyalin.", "ok") },
      {
        label: "Copy cURL",
        onClick: async () =>
          notify(
            (await copyText(buildCurl({ method: g.method, url: withQuery(url, g.requestQuery), headers: g.requestHeaders, body: g.requestBody }))) ? "cURL disalin." : "Gagal menyalin.",
            "ok"
          ),
      },
      { separator: true, label: "" },
      {
        label: "Hapus",
        danger: true,
        onClick: () =>
          confirm("Hapus Endpoint", `Hapus endpoint "${groupLabel(g)}" beserta ${g.variants.length} response?`, () => actions.deleteGroup(col.id, folder.id, g.id), "Endpoint dihapus."),
      },
    ];
  };

  // Pintasan keyboard global
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setDrawerOpen(true);
        searchRef.current?.focus();
      }
      if (e.altKey && e.key.toLowerCase() === "w" && activeKey) {
        e.preventDefault();
        closeTab(activeKey);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeKey, closeTab]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const move = (ev: MouseEvent) => setSidebarWidth(Math.min(520, Math.max(220, ev.clientX)));
    const up = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      localStorage.setItem(WIDTH_KEY, String(Math.min(520, Math.max(220, ev.clientX))));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const renderMain = () => {
    if (error)
      return (
        <div className={s.empty}>
          <div className={`${s.notice} ${s.noticeErr}`}>Gagal memuat data: {error}</div>
          <button type="button" className={s.btn} onClick={refresh}>Coba lagi</button>
        </div>
      );
    if (!activeTab) {
      return (
        <div className={s.empty}>
          <div className={s.emptyTitle}>{collections.length === 0 && !loading ? "Belum ada Mock Collection" : "Pilih endpoint di sidebar"}</div>
          <p style={{ marginBottom: 14 }}>
            {collections.length === 0 && !loading
              ? "Buat collection pertama atau import dari file JSON."
              : "Klik endpoint di sidebar untuk membuka dokumentasi, response, dan Try it."}
          </p>
          {collections.length === 0 && !loading && (
            <div className={s.flex} style={{ justifyContent: "center" }}>
              <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal({ t: "collection" })}>Buat Collection</button>
              <button type="button" className={s.btn} onClick={() => setModal({ t: "import" })}>Import</button>
            </div>
          )}
        </div>
      );
    }
    if (activeTab.kind === "collection") {
      const col = collections.find((c) => c.id === activeTab.collectionId);
      if (!col) return null;
      return (
        <CollectionPanel
          key={col.id}
          collection={col}
          actions={actions}
          notify={notify}
          onOpenGroup={(fid, gid) => openGroup(col.id, fid, gid)}
          onDelete={() => confirm("Hapus Collection", `Hapus "${col.name}" beserta seluruh isinya?`, () => actions.deleteCollection(col.id), "Collection dihapus.")}
        />
      );
    }
    const found = findGroup(activeTab.groupId);
    if (!found) return <div className={s.empty}>Endpoint tidak ditemukan.</div>;
    return (
      <EndpointPanel
        key={found.g.id}
        collection={found.c}
        folder={found.f}
        group={found.g}
        actions={actions}
        notify={notify}
      />
    );
  };

  return (
    <>
      <Header
        currentTab="mocks"
        subtitle={`${stats.collections} Collections • ${stats.endpoints} Endpoints • ${stats.variants} Responses`}
        rightSlot={
          <div className={s.flex}>
            <button type="button" className={`${s.btn} ${s.btnIcon}`} title="Import collection" aria-label="Import collection" onClick={() => setModal({ t: "import" })}><UploadIcon size={14} /></button>
            <button type="button" className={`${s.btn} ${s.btnIcon}`} title="Export semua collection" aria-label="Export semua collection" onClick={exportAll}><DownloadIcon size={14} /></button>
            <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal({ t: "collection" })}><PlusIcon size={14} /> Collection</button>
          </div>
        }
      />
      <div className={s.workspace} style={{ gridTemplateColumns: `${sidebarWidth}px 1fr` }}>
        <aside className={`${s.sidebar} ${drawerOpen ? s.sidebarOpen : ""}`} aria-label="Collections">
          <div className={s.sidebarTop}>
            <input
              ref={searchRef}
              className={s.input}
              placeholder="Cari endpoint… (Ctrl+K)"
              aria-label="Cari endpoint"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className={s.sidebarFilters}>
              <select className={s.select} aria-label="Filter method" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                {["Semua Method", ...METHODS].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <select className={s.select} aria-label="Filter service" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                {services.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <div aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={s.skeleton} />
              ))}
            </div>
          ) : (
            <CollectionTree
              collections={collections}
              query={query}
              methodFilter={methodFilter}
              serviceFilter={serviceFilter}
              activeGroupId={activeGroupId}
              onOpenGroup={(t) => openGroup(t.collectionId, t.folderId, t.groupId)}
              onOpenCollection={openCollection}
              onMenu={(e, t) => setMenu({ x: e.clientX, y: e.clientY, items: buildMenu(t) })}
              onRenameFolder={(cid, fid, name) => guard(() => actions.updateFolder(cid, fid, name), "Folder diubah.")}
            />
          )}
          <div className={s.resizer} onMouseDown={startResize} role="separator" aria-orientation="vertical" aria-label="Ubah lebar sidebar" />
        </aside>

        <main className={s.main}>
          <button type="button" className={`${s.btn} ${s.hamburger}`} onClick={() => setDrawerOpen((v) => !v)} aria-label="Buka sidebar"><MenuIcon size={14} /> Collections</button>
          <TabBar
            items={tabItems}
            activeKey={activeKey}
            onSelect={setActiveKey}
            onClose={closeTab}
            onCloseOthers={closeOthers}
            onCloseAll={closeAll}
          />
          <div className={s.content}>{renderMain()}</div>
        </main>
      </div>

      <button type="button" className={s.helpBtn} aria-label="Pintasan keyboard" title="Pintasan keyboard" onClick={() => setModal({ t: "help" })}>?</button>

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
      {toast && <Toast message={toast.message} kind={toast.kind} />}

      {modal?.t === "collection" && (
        <CollectionModal
          initial={modal.edit}
          onClose={() => setModal(null)}
          onSave={async (d) => {
            if (modal.edit) await actions.updateCollection(modal.edit.id, d);
            else {
              const c = await actions.createCollection(d);
              openCollection(c.id);
            }
            notify("Collection disimpan.");
          }}
        />
      )}
      {modal?.t === "folder" && (
        <FolderModal
          initialName={modal.name}
          onClose={() => setModal(null)}
          onSave={async (name) => {
            if (modal.folderId) await actions.updateFolder(modal.collectionId, modal.folderId, name);
            else await actions.createFolder(modal.collectionId, name);
            notify("Folder disimpan.");
          }}
        />
      )}
      {modal?.t === "endpoint" && (
        <EndpointModal
          onClose={() => setModal(null)}
          onSave={async (d) => {
            const g = await actions.createGroup(modal.collectionId, modal.folderId, d);
            openGroup(modal.collectionId, modal.folderId, g.id);
            notify("Endpoint ditambahkan.");
          }}
        />
      )}
      {modal?.t === "import" && (
        <ImportModal
          onClose={() => setModal(null)}
          onImport={async (mode, data) => {
            await actions.importData(mode, data);
            notify("Import berhasil.");
          }}
        />
      )}
      {modal?.t === "confirm" && (
        <ConfirmDialog title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onClose={() => setModal(null)} />
      )}
      {modal?.t === "help" && (
        <Modal title="Pintasan Keyboard" onClose={() => setModal(null)}>
          <div className={s.modalBody}>
            <div><kbd>Ctrl/Cmd + K</kbd> — fokus ke pencarian sidebar</div>
            <div><kbd>Ctrl/Cmd + S</kbd> — simpan (tab Docs / Responses)</div>
            <div><kbd>Ctrl/Cmd + Enter</kbd> — kirim request (tab Try it)</div>
            <div><kbd>Alt + W</kbd> — tutup tab aktif</div>
            <div><kbd>Esc</kbd> — tutup menu / dialog</div>
            <div>Klik dua kali nama folder untuk rename. Klik kanan item untuk menu.</div>
          </div>
        </Modal>
      )}
    </>
  );
}
