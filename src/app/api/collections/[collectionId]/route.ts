import { NextRequest, NextResponse } from "next/server";
import { updateCollection, deleteCollection } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
): Promise<NextResponse> {
  const { collectionId } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Format request body harus berupa JSON." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const updated = updateCollection(collectionId, body);
  if (!updated) {
    return NextResponse.json(
      { error: "Collection tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(updated, { headers: CORS_HEADERS });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
): Promise<NextResponse> {
  const { collectionId } = await params;
  const ok = deleteCollection(collectionId);
  if (!ok) {
    return NextResponse.json(
      { error: "Collection tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { message: "Collection berhasil dihapus." },
    { headers: CORS_HEADERS }
  );
}
