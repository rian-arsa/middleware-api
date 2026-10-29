import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, getCollections } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";
import { MockCollection, MockStore } from "@/lib/mockTypes";
import { randomUUID } from "crypto";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Format request body harus berupa JSON." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { mode, data } = body || {};
  if (!mode || (mode !== "merge" && mode !== "replace")) {
    return NextResponse.json(
      { error: 'Mode harus berupa "merge" atau "replace".' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!data || typeof data !== "object" || !Array.isArray(data.collections)) {
    return NextResponse.json(
      { error: 'Data JSON harus memiliki array "collections".' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const currentStore = readStore();

  if (mode === "replace") {
    const newStore: MockStore = {
      version: 2,
      collections: data.collections,
    };
    writeStore(newStore);
    return NextResponse.json(newStore.collections, { headers: CORS_HEADERS });
  } else {
    // Mode merge
    const incomingCollections: MockCollection[] = data.collections.map((col: MockCollection) => {
      const newColId = randomUUID();
      return {
        ...col,
        id: newColId,
        name: `${col.name} (Imported)`,
        folders: (col.folders || []).map((f) => {
          const newFolderId = randomUUID();
          return {
            ...f,
            id: newFolderId,
            collectionId: newColId,
            groups: (f.groups || []).map((g) => {
              const variants = (g.variants || []).map((v) => ({ ...v, id: randomUUID() }));
              const activeIdx = (g.variants || []).findIndex((v) => v.id === g.activeVariantId);
              return {
                ...g,
                id: randomUUID(),
                folderId: newFolderId,
                collectionId: newColId,
                variants,
                activeVariantId: activeIdx >= 0 ? variants[activeIdx].id : null,
              };
            }),
          };
        }),
      };
    });

    currentStore.collections.push(...incomingCollections);
    writeStore(currentStore);
    return NextResponse.json(currentStore.collections, { headers: CORS_HEADERS });
  }
}
