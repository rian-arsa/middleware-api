import { NextRequest, NextResponse } from "next/server";
import { updateFolder, deleteFolder } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ collectionId: string; folderId: string }> }
): Promise<NextResponse> {
  const { collectionId, folderId } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Format request body harus berupa JSON." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { error: 'Field "name" wajib diisi.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const updated = updateFolder(collectionId, folderId, body.name.trim());
  if (!updated) {
    return NextResponse.json(
      { error: "Folder atau Collection tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(updated, { headers: CORS_HEADERS });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ collectionId: string; folderId: string }> }
): Promise<NextResponse> {
  const { collectionId, folderId } = await params;
  const ok = deleteFolder(collectionId, folderId);
  if (!ok) {
    return NextResponse.json(
      { error: "Folder atau Collection tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { message: "Folder berhasil dihapus." },
    { headers: CORS_HEADERS }
  );
}
