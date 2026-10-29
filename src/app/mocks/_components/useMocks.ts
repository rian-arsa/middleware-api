"use client";

import { useCallback, useEffect, useState } from "react";
import type { MockCollection, MockGroup, MockVariant } from "@/lib/mockTypes";

async function call<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || `Request gagal (${res.status})`);
  return json as T;
}

const col = (c: string) => `/api/collections/${c}`;
const fol = (c: string, f: string) => `${col(c)}/folders/${f}`;
const grp = (c: string, f: string, g: string) => `${fol(c, f)}/groups/${g}`;
const vr = (c: string, f: string, g: string, v: string) => `${grp(c, f, g)}/variants/${v}`;

export function useMocks() {
  const [collections, setCollections] = useState<MockCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await call<MockCollection[]>("GET", "/api/collections");
      const normalized = (Array.isArray(data) ? data : []).map((c) => ({
        ...c,
        folders: (c.folders ?? []).map((f) => ({
          ...f,
          collectionId: c.id,
          groups: (f.groups ?? []).map((g) => ({
            ...g,
            collectionId: c.id,
            folderId: f.id,
            variants: g.variants ?? [],
          })),
        })),
      }));
      setCollections(normalized);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      const r = await fn();
      await refresh();
      return r;
    },
    [refresh]
  );

  const actions = {
    createCollection: (d: { name: string; service: string; description?: string }) =>
      run(() => call<MockCollection>("POST", "/api/collections", d)),
    updateCollection: (id: string, d: Partial<Pick<MockCollection, "name" | "service" | "description" | "enabled">>) =>
      run(() => call<MockCollection>("PUT", col(id), d)),
    deleteCollection: (id: string) => run(() => call("DELETE", col(id))),
    createFolder: (c: string, name: string) =>
      run(() => call("POST", `${col(c)}/folders`, { name })),
    updateFolder: (c: string, f: string, name: string) =>
      run(() => call("PUT", fol(c, f), { name })),
    deleteFolder: (c: string, f: string) => run(() => call("DELETE", fol(c, f))),
    duplicateFolder: (c: string, f: string) => run(() => call("POST", `${fol(c, f)}/duplicate`)),
    createGroup: (c: string, f: string, d: { method: string; path: string; name?: string; description?: string }) =>
      run(() => call<MockGroup>("POST", `${fol(c, f)}/groups`, d)),
    updateGroup: (c: string, f: string, g: string, d: Partial<MockGroup>) =>
      run(() => call<MockGroup>("PUT", grp(c, f, g), d)),
    deleteGroup: (c: string, f: string, g: string) => run(() => call("DELETE", grp(c, f, g))),
    duplicateGroup: (c: string, f: string, g: string) =>
      run(() => call<MockGroup>("POST", `${grp(c, f, g)}/duplicate`)),
    createVariant: (c: string, f: string, g: string, d: Partial<MockVariant>) =>
      run(() => call<MockVariant>("POST", `${grp(c, f, g)}/variants`, d)),
    updateVariant: (c: string, f: string, g: string, v: string, d: Partial<MockVariant>) =>
      run(() => call<MockVariant>("PUT", vr(c, f, g, v), d)),
    deleteVariant: (c: string, f: string, g: string, v: string) =>
      run(() => call("DELETE", vr(c, f, g, v))),
    duplicateVariant: (c: string, f: string, g: string, v: string) =>
      run(() => call<MockVariant>("POST", `${vr(c, f, g, v)}/duplicate`)),
    importData: (mode: "merge" | "replace", data: unknown) =>
      run(() => call("POST", "/api/collections/import", { mode, data })),
  };

  return { collections, loading, error, refresh, actions };
}

export type MocksActions = ReturnType<typeof useMocks>["actions"];
