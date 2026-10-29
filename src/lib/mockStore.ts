import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  MockStore,
  MockCollection,
  MockFolder,
  MockGroup,
  MockVariant,
  ResolvedMock,
  KeyValueDoc,
  RequestBodyDoc,
} from "./mockTypes";

const MOCKS_FILE = path.join(process.cwd(), "mocks.json");

/**
 * FUNGSI 1: readStore() => MockStore
 * - Baca mocks.json
 * - Jika file tidak ada atau kosong => return { version: 2, collections: [] }
 * - Jika isi file adalah ARRAY (format lama v1) => panggil migrateV1toV2(isi)
 * - Jika isi file punya field "version" (format v2) => return langsung
 */
export function readStore(): MockStore {
  try {
    if (!fs.existsSync(MOCKS_FILE)) {
      return { version: 2, collections: [] };
    }
    const raw = fs.readFileSync(MOCKS_FILE, "utf-8").trim();
    if (!raw) {
      return { version: 2, collections: [] };
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const migrated = migrateV1toV2(parsed);
      writeStore(migrated);
      return migrated;
    }
    if (parsed && typeof parsed === "object" && parsed.version) {
      return parsed as MockStore;
    }
    return { version: 2, collections: [] };
  } catch {
    return { version: 2, collections: [] };
  }
}

/**
 * FUNGSI 2: writeStore(store) => void
 * - Tulis store ke mocks.json
 */
export function writeStore(store: MockStore): void {
  try {
    fs.writeFileSync(MOCKS_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[mockStore] Failed to write mocks.json:", err);
  }
}

/**
 * FUNGSI 3: migrateV1toV2(oldData: any[]) => MockStore
 * Mengonversi array MockEntry v1 menjadi struktur MockStore v2
 */
export function migrateV1toV2(oldData: any[]): MockStore {
  if (!Array.isArray(oldData) || oldData.length === 0) {
    return { version: 2, collections: [] };
  }

  const collectionsMap = new Map<string, MockCollection>();

  for (const entry of oldData) {
    const serviceName = String(entry.service || "default-service").toLowerCase();
    let col = collectionsMap.get(serviceName);

    if (!col) {
      const now = entry.createdAt || new Date().toISOString();
      col = {
        id: randomUUID(),
        name: `Migrasi: ${serviceName}`,
        description: `Otomatis dikonversi dari mock lama untuk service ${serviceName}`,
        service: serviceName,
        enabled: true,
        createdAt: now,
        updatedAt: new Date().toISOString(),
        folders: [
          {
            id: randomUUID(),
            name: "Default",
            collectionId: "", // akan di-update setelah id pasti
            groups: [],
          },
        ],
      };
      col.folders[0].collectionId = col.id;
      collectionsMap.set(serviceName, col);
    }

    const defaultFolder = col.folders[0];
    const variantId = randomUUID();
    const groupCreatedAt = entry.createdAt || new Date().toISOString();
    const groupUpdatedAt = entry.updatedAt || groupCreatedAt;

    const variant: MockVariant = {
      id: variantId,
      name: entry.name || "Default Variant",
      responseStatus: typeof entry.responseStatus === "number" ? entry.responseStatus : 200,
      responseHeaders: entry.responseHeaders || { "content-type": "application/json" },
      responseBody: typeof entry.responseBody === "string" ? entry.responseBody : "",
      delayMs: typeof entry.delayMs === "number" ? entry.delayMs : 0,
      createdAt: groupCreatedAt,
      updatedAt: groupUpdatedAt,
    };

    const group: MockGroup = {
      id: randomUUID(),
      method: String(entry.method || "GET").toUpperCase(),
      path: String(entry.path || "/").startsWith("/") ? String(entry.path || "/") : `/${entry.path}`,
      folderId: defaultFolder.id,
      collectionId: col.id,
      enabled: entry.enabled !== false,
      activeVariantId: variantId,
      variants: [variant],
    };

    defaultFolder.groups.push(group);
  }

  return {
    version: 2,
    collections: Array.from(collectionsMap.values()),
  };
}

/**
 * FUNGSI 4: getCollections() => MockCollection[]
 */
export function getCollections(): MockCollection[] {
  return readStore().collections;
}

/**
 * FUNGSI 5: createCollection(data) => MockCollection
 */
export function createCollection(data: {
  name: string;
  description?: string;
  service: string;
}): MockCollection {
  const store = readStore();
  const now = new Date().toISOString();
  const collection: MockCollection = {
    id: randomUUID(),
    name: data.name.trim(),
    description: (data.description || "").trim(),
    service: data.service.trim().toLowerCase(),
    enabled: true,
    createdAt: now,
    updatedAt: now,
    folders: [],
  };
  store.collections.push(collection);
  writeStore(store);
  return collection;
}

/**
 * FUNGSI 6: updateCollection(id, data) => MockCollection | null
 */
export function updateCollection(
  id: string,
  data: Partial<Omit<MockCollection, "id" | "folders" | "createdAt">>
): MockCollection | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === id);
  if (!col) return null;

  if (data.name !== undefined) col.name = data.name.trim();
  if (data.description !== undefined) col.description = data.description.trim();
  if (data.service !== undefined) col.service = data.service.trim().toLowerCase();
  if (data.enabled !== undefined) col.enabled = Boolean(data.enabled);
  col.updatedAt = new Date().toISOString();

  writeStore(store);
  return col;
}

/**
 * FUNGSI 7: deleteCollection(id) => boolean
 */
export function deleteCollection(id: string): boolean {
  const store = readStore();
  const idx = store.collections.findIndex((c) => c.id === id);
  if (idx === -1) return false;

  store.collections.splice(idx, 1);
  writeStore(store);
  return true;
}

/**
 * FUNGSI 8: createFolder(collectionId, name) => MockFolder | null
 */
export function createFolder(
  collectionId: string,
  name: string
): MockFolder | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return null;

  const folder: MockFolder = {
    id: randomUUID(),
    name: name.trim(),
    collectionId,
    groups: [],
  };
  col.folders.push(folder);
  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return folder;
}

/**
 * FUNGSI 9: updateFolder(collectionId, folderId, name) => MockFolder | null
 */
export function updateFolder(
  collectionId: string,
  folderId: string,
  name: string
): MockFolder | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return null;

  const folder = col.folders.find((f) => f.id === folderId);
  if (!folder) return null;

  folder.name = name.trim();
  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return folder;
}

/**
 * FUNGSI 10: deleteFolder(collectionId, folderId) => boolean
 */
export function deleteFolder(collectionId: string, folderId: string): boolean {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return false;

  const idx = col.folders.findIndex((f) => f.id === folderId);
  if (idx === -1) return false;

  col.folders.splice(idx, 1);
  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return true;
}

/**
 * FUNGSI 11: createGroup(collectionId, folderId, data) => MockGroup | null
 */
export function createGroup(
  collectionId: string,
  folderId: string,
  data: { method: string; path: string; name?: string; description?: string }
): MockGroup | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return null;

  const folder = col.folders.find((f) => f.id === folderId);
  if (!folder) return null;

  const normPath = data.path.trim().startsWith("/")
    ? data.path.trim()
    : `/${data.path.trim()}`;

  const group: MockGroup = {
    id: randomUUID(),
    ...(data.name?.trim() ? { name: data.name.trim() } : {}),
    ...(data.description?.trim() ? { description: data.description } : {}),
    method: data.method.trim().toUpperCase(),
    path: normPath,
    folderId,
    collectionId,
    enabled: true,
    activeVariantId: null,
    variants: [],
  };

  folder.groups.push(group);
  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return group;
}

/**
 * FUNGSI 12: updateGroup(collectionId, folderId, groupId, data) => MockGroup | null
 */
export function updateGroup(
  collectionId: string,
  folderId: string,
  groupId: string,
  data: {
    method?: string;
    path?: string;
    enabled?: boolean;
    activeVariantId?: string | null;
    name?: string;
    description?: string;
    requestQuery?: KeyValueDoc[];
    requestHeaders?: KeyValueDoc[];
    requestBody?: RequestBodyDoc;
  }
): MockGroup | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return null;

  const folder = col.folders.find((f) => f.id === folderId);
  if (!folder) return null;

  const group = folder.groups.find((g) => g.id === groupId);
  if (!group) return null;

  if (data.activeVariantId !== undefined) {
    if (data.activeVariantId !== null) {
      const exists = group.variants.some((v) => v.id === data.activeVariantId);
      if (!exists) return null;
    }
    group.activeVariantId = data.activeVariantId;
  }

  if (data.name !== undefined) group.name = String(data.name).trim();
  if (data.description !== undefined) group.description = String(data.description);
  if (data.requestQuery !== undefined) group.requestQuery = data.requestQuery;
  if (data.requestHeaders !== undefined) group.requestHeaders = data.requestHeaders;
  if (data.requestBody !== undefined) group.requestBody = data.requestBody;

  if (data.enabled !== undefined) group.enabled = Boolean(data.enabled);
  if (data.method !== undefined) group.method = data.method.trim().toUpperCase();
  if (data.path !== undefined) {
    const p = data.path.trim();
    group.path = p.startsWith("/") ? p : `/${p}`;
  }

  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return group;
}

/**
 * FUNGSI 13: deleteGroup(collectionId, folderId, groupId) => boolean
 */
export function deleteGroup(
  collectionId: string,
  folderId: string,
  groupId: string
): boolean {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return false;

  const folder = col.folders.find((f) => f.id === folderId);
  if (!folder) return false;

  const idx = folder.groups.findIndex((g) => g.id === groupId);
  if (idx === -1) return false;

  folder.groups.splice(idx, 1);
  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return true;
}

/**
 * FUNGSI 14: createVariant(collectionId, folderId, groupId, data) => MockVariant | null
 */
export function createVariant(
  collectionId: string,
  folderId: string,
  groupId: string,
  data: Omit<MockVariant, "id" | "createdAt" | "updatedAt">
): MockVariant | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return null;

  const folder = col.folders.find((f) => f.id === folderId);
  if (!folder) return null;

  const group = folder.groups.find((g) => g.id === groupId);
  if (!group) return null;

  const now = new Date().toISOString();
  const variant: MockVariant = {
    id: randomUUID(),
    name: data.name.trim(),
    ...(data.description ? { description: data.description } : {}),
    responseStatus: Number(data.responseStatus) || 200,
    responseHeaders: data.responseHeaders || {},
    responseBody: typeof data.responseBody === "string" ? data.responseBody : "",
    delayMs: Math.max(0, Number(data.delayMs) || 0),
    createdAt: now,
    updatedAt: now,
  };

  // Jika belum ada variant atau activeVariantId null, otomatis jadikan variant ini aktif
  if (group.variants.length === 0 || !group.activeVariantId) {
    group.activeVariantId = variant.id;
  }

  group.variants.push(variant);
  col.updatedAt = now;
  writeStore(store);
  return variant;
}

/**
 * FUNGSI 15: updateVariant(collectionId, folderId, groupId, variantId, data) => MockVariant | null
 */
export function updateVariant(
  collectionId: string,
  folderId: string,
  groupId: string,
  variantId: string,
  data: Partial<Omit<MockVariant, "id" | "createdAt">>
): MockVariant | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return null;

  const folder = col.folders.find((f) => f.id === folderId);
  if (!folder) return null;

  const group = folder.groups.find((g) => g.id === groupId);
  if (!group) return null;

  const variant = group.variants.find((v) => v.id === variantId);
  if (!variant) return null;

  if (data.name !== undefined) variant.name = data.name.trim();
  if (data.description !== undefined) variant.description = String(data.description);
  if (data.responseStatus !== undefined) variant.responseStatus = Number(data.responseStatus);
  if (data.responseHeaders !== undefined) variant.responseHeaders = data.responseHeaders;
  if (data.responseBody !== undefined) variant.responseBody = String(data.responseBody);
  if (data.delayMs !== undefined) variant.delayMs = Math.max(0, Number(data.delayMs) || 0);

  const now = new Date().toISOString();
  variant.updatedAt = now;
  col.updatedAt = now;

  writeStore(store);
  return variant;
}

/**
 * FUNGSI 16: deleteVariant(collectionId, folderId, groupId, variantId) => boolean
 */
export function deleteVariant(
  collectionId: string,
  folderId: string,
  groupId: string,
  variantId: string
): boolean {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return false;

  const folder = col.folders.find((f) => f.id === folderId);
  if (!folder) return false;

  const group = folder.groups.find((g) => g.id === groupId);
  if (!group) return false;

  const idx = group.variants.findIndex((v) => v.id === variantId);
  if (idx === -1) return false;

  group.variants.splice(idx, 1);

  if (group.activeVariantId === variantId) {
    group.activeVariantId = group.variants.length > 0 ? group.variants[0].id : null;
  }

  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return true;
}

/**
 * FUNGSI 17: findActiveMockV2(method, service, reqPath) => ResolvedMock | undefined
 * Mencari mock aktif yang cocok untuk di-intercept oleh proxy
 */
export function findActiveMockV2(
  method: string,
  service: string,
  reqPath: string
): ResolvedMock | undefined {
  const store = readStore();
  const normMethod = method.toUpperCase();
  const normService = service.toLowerCase();

  const cleanReqPath = reqPath.startsWith("/") ? reqPath : `/${reqPath}`;
  // Strip trailing slash unless root
  const stripSlash = (p: string) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);
  const targetPath = stripSlash(cleanReqPath);

  for (const pass of ["exact", "pattern"] as const) {
    for (const collection of store.collections) {
      if (collection.enabled === false) continue;
      if (collection.service.toLowerCase() !== normService) continue;

      for (const folder of collection.folders) {
        for (const group of folder.groups) {
          if (group.enabled === false) continue;
          if (!group.activeVariantId) continue;
          if (group.method.toUpperCase() !== normMethod) continue;

          const cleanGroupPath = group.path.startsWith("/") ? group.path : `/${group.path}`;
          const groupTargetPath = stripSlash(cleanGroupPath);

          const matched =
            pass === "exact"
              ? groupTargetPath === targetPath
              : matchPattern(groupTargetPath, targetPath);
          if (!matched) continue;

          const activeVariant = group.variants.find((v) => v.id === group.activeVariantId);
          if (activeVariant) {
            return {
              id: group.id,
              groupId: group.id,
              responseStatus: activeVariant.responseStatus,
              responseHeaders: activeVariant.responseHeaders,
              responseBody: activeVariant.responseBody,
              delayMs: activeVariant.delayMs,
              variantName: activeVariant.name,
              collectionName: collection.name,
            };
          }
        }
      }
    }
  }

  return undefined;
}

function cloneGroup(g: MockGroup, folderId: string, collectionId: string, disable: boolean): MockGroup {
  const variants = g.variants.map((v) => ({ ...v, id: randomUUID() }));
  const activeIdx = g.variants.findIndex((v) => v.id === g.activeVariantId);
  return {
    ...JSON.parse(JSON.stringify(g)),
    id: randomUUID(),
    folderId,
    collectionId,
    enabled: disable ? false : g.enabled,
    variants,
    activeVariantId: activeIdx >= 0 ? variants[activeIdx].id : null,
  };
}

export function duplicateGroup(
  collectionId: string,
  folderId: string,
  groupId: string
): MockGroup | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  const folder = col?.folders.find((f) => f.id === folderId);
  const group = folder?.groups.find((g) => g.id === groupId);
  if (!col || !folder || !group) return null;

  const copy = cloneGroup(group, folderId, collectionId, true);
  copy.name = `${group.name || group.path} (Copy)`;
  folder.groups.splice(folder.groups.indexOf(group) + 1, 0, copy);
  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return copy;
}

export function duplicateFolder(collectionId: string, folderId: string): MockFolder | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  const folder = col?.folders.find((f) => f.id === folderId);
  if (!col || !folder) return null;

  const newId = randomUUID();
  const copy: MockFolder = {
    id: newId,
    name: `${folder.name} (Copy)`,
    collectionId,
    groups: folder.groups.map((g) => cloneGroup(g, newId, collectionId, true)),
  };
  col.folders.splice(col.folders.indexOf(folder) + 1, 0, copy);
  col.updatedAt = new Date().toISOString();
  writeStore(store);
  return copy;
}

export function duplicateVariant(
  collectionId: string,
  folderId: string,
  groupId: string,
  variantId: string
): MockVariant | null {
  const store = readStore();
  const col = store.collections.find((c) => c.id === collectionId);
  const group = col?.folders.find((f) => f.id === folderId)?.groups.find((g) => g.id === groupId);
  const variant = group?.variants.find((v) => v.id === variantId);
  if (!col || !group || !variant) return null;

  const now = new Date().toISOString();
  const copy: MockVariant = {
    ...JSON.parse(JSON.stringify(variant)),
    id: randomUUID(),
    name: `${variant.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };
  group.variants.splice(group.variants.indexOf(variant) + 1, 0, copy);
  col.updatedAt = now;
  writeStore(store);
  return copy;
}

/** Cocokkan pola path (mendukung :param dan {param}) dengan path asli. */
function matchPattern(pattern: string, actual: string): boolean {
  const ps = pattern.split("/");
  const as = actual.split("/");
  if (ps.length !== as.length) return false;
  return ps.every(
    (seg, i) =>
      seg === as[i] ||
      (as[i] !== "" && (/^:.+/.test(seg) || /^\{.+\}$/.test(seg)))
  );
}

export const findActiveMock = findActiveMockV2;
