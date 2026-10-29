import { NextRequest, NextResponse } from "next/server";
import { updateVariant, deleteVariant } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      collectionId: string;
      folderId: string;
      groupId: string;
      variantId: string;
    }>;
  }
): Promise<NextResponse> {
  const { collectionId, folderId, groupId, variantId } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Format request body harus berupa JSON." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const updates: any = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Field "name" tidak boleh kosong.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    updates.name = body.name.trim();
  }

  if (body.responseStatus !== undefined) {
    const s = Number(body.responseStatus);
    if (isNaN(s) || s < 100 || s > 599) {
      return NextResponse.json(
        { error: 'Field "responseStatus" harus berupa angka antara 100 dan 599.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    updates.responseStatus = s;
  }

  if (body.delayMs !== undefined) {
    const d = Number(body.delayMs);
    if (isNaN(d) || d < 0) {
      return NextResponse.json(
        { error: 'Field "delayMs" harus berupa angka >= 0.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    updates.delayMs = d;
  }

  if (body.responseHeaders !== undefined) {
    if (typeof body.responseHeaders !== "object" || Array.isArray(body.responseHeaders)) {
      return NextResponse.json(
        { error: 'Field "responseHeaders" harus berupa objek key-value.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    updates.responseHeaders = body.responseHeaders;
  }

  if (body.responseBody !== undefined) {
    updates.responseBody = String(body.responseBody);
  }

  if (typeof body.description === "string") {
    updates.description = body.description;
  }

  const updated = updateVariant(collectionId, folderId, groupId, variantId, updates);
  if (!updated) {
    return NextResponse.json(
      { error: "Variant tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(updated, { headers: CORS_HEADERS });
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      collectionId: string;
      folderId: string;
      groupId: string;
      variantId: string;
    }>;
  }
): Promise<NextResponse> {
  const { collectionId, folderId, groupId, variantId } = await params;
  const ok = deleteVariant(collectionId, folderId, groupId, variantId);
  if (!ok) {
    return NextResponse.json(
      { error: "Variant tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { message: "Variant berhasil dihapus." },
    { headers: CORS_HEADERS }
  );
}
