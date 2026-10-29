import { NextRequest, NextResponse } from "next/server";
import { createFolder } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function POST(
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

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { error: 'Field "name" wajib diisi.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const folder = createFolder(collectionId, body.name.trim());
  if (!folder) {
    return NextResponse.json(
      { error: "Collection tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(folder, { status: 201, headers: CORS_HEADERS });
}
