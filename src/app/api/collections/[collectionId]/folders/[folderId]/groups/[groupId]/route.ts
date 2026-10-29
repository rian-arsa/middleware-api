import { NextRequest, NextResponse } from "next/server";
import { updateGroup, deleteGroup } from "@/lib/mockStore";
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
    }>;
  }
): Promise<NextResponse> {
  const { collectionId, folderId, groupId } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Format request body harus berupa JSON." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const badField =
    (body.name !== undefined && typeof body.name !== "string") ||
    (body.description !== undefined && typeof body.description !== "string") ||
    (body.requestQuery !== undefined && !Array.isArray(body.requestQuery)) ||
    (body.requestHeaders !== undefined && !Array.isArray(body.requestHeaders)) ||
    (body.requestBody !== undefined &&
      !["none", "json", "text"].includes(body.requestBody?.mode));
  if (badField) {
    return NextResponse.json(
      { error: "Field name/description harus string, requestQuery/requestHeaders harus array, requestBody.mode harus none|json|text." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const updated = updateGroup(collectionId, folderId, groupId, body);
  if (!updated) {
    return NextResponse.json(
      { error: "Endpoint group tidak ditemukan atau activeVariantId tidak valid." },
      { status: 400, headers: CORS_HEADERS }
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
    }>;
  }
): Promise<NextResponse> {
  const { collectionId, folderId, groupId } = await params;
  const ok = deleteGroup(collectionId, folderId, groupId);
  if (!ok) {
    return NextResponse.json(
      { error: "Endpoint group tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { message: "Endpoint group berhasil dihapus." },
    { headers: CORS_HEADERS }
  );
}
