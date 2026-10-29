"use client";

import { useCallback, useEffect, useState } from "react";

export type OpenTab =
  | { key: string; kind: "endpoint"; collectionId: string; folderId: string; groupId: string }
  | { key: string; kind: "collection"; collectionId: string };

const STORAGE_KEY = "mocks.openTabs.v1";

export function useOpenTabs() {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.tabs)) setTabs(parsed.tabs);
        if (typeof parsed.activeKey === "string") setActiveKey(parsed.activeKey);
      }
    } catch {
      // abaikan data rusak
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeKey }));
  }, [tabs, activeKey, ready]);

  const openTab = useCallback((tab: OpenTab) => {
    setTabs((prev) => (prev.some((t) => t.key === tab.key) ? prev : [...prev, tab]));
    setActiveKey(tab.key);
  }, []);

  const closeTab = useCallback((key: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === key);
      if (idx === -1) return prev;
      const next = prev.filter((t) => t.key !== key);
      setActiveKey((cur) => (cur === key ? next[Math.min(idx, next.length - 1)]?.key ?? null : cur));
      return next;
    });
  }, []);

  const closeOthers = useCallback((key: string) => {
    setTabs((prev) => prev.filter((t) => t.key === key));
    setActiveKey(key);
  }, []);

  const closeAll = useCallback(() => {
    setTabs([]);
    setActiveKey(null);
  }, []);

  // Buang tab yatim (endpoint/collection sudah dihapus)
  const prune = useCallback((valid: Set<string>) => {
    setTabs((prev) => {
      const next = prev.filter((t) => valid.has(t.key));
      if (next.length === prev.length) return prev;
      setActiveKey((cur) => (cur && next.some((t) => t.key === cur) ? cur : next[next.length - 1]?.key ?? null));
      return next;
    });
  }, []);

  return { tabs, activeKey, setActiveKey, openTab, closeTab, closeOthers, closeAll, prune };
}

export const endpointKey = (groupId: string) => `ep:${groupId}`;
export const collectionKey = (id: string) => `col:${id}`;
