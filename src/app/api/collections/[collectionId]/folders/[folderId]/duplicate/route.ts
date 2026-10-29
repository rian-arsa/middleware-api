import { NextRequest, NextResponse } from "next/server";
import { duplicateFolder } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ collectionId: string; folderId: string }> }
): Promise<NextResponse> {
  const { collectionId, folderId } = await params;
  const copy = duplicateFolder(collectionId, folderId);
  if (!copy) {
    return NextResponse.json(
      { error: "Folder tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }
  return NextResponse.json(copy, { status: 201, headers: CORS_HEADERS });
}
