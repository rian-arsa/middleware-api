export interface KeyValueDoc {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface RequestBodyDoc {
  mode: "none" | "json" | "text";
  content: string;
}

export interface MockVariant {
  id: string;
  name: string;
  description?: string;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  delayMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockGroup {
  id: string;
  name?: string;
  description?: string;
  requestQuery?: KeyValueDoc[];
  requestHeaders?: KeyValueDoc[];
  requestBody?: RequestBodyDoc;
  method: string;
  path: string;
  folderId: string;
  collectionId: string;
  enabled: boolean;
  activeVariantId: string | null;
  variants: MockVariant[];
}

export interface MockFolder {
  id: string;
  name: string;
  collectionId: string;
  groups: MockGroup[];
}

export interface MockCollection {
  id: string;
  name: string;
  description: string;
  service: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  folders: MockFolder[];
}

export interface MockStore {
  version: number;
  collections: MockCollection[];
}

export interface ResolvedMock {
  id: string;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  delayMs: number;
  variantName: string;
  groupId: string;
  collectionName: string;
}
