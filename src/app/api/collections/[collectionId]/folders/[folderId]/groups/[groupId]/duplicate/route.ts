import { NextRequest, NextResponse } from "next/server";
import { duplicateGroup } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function POST(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ collectionId: string; folderId: string; groupId: string }> }
): Promise<NextResponse> {
  const { collectionId, folderId, groupId } = await params;
  const copy = duplicateGroup(collectionId, folderId, groupId);
  if (!copy) {
    return NextResponse.json(
      { error: "Endpoint tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }
  return NextResponse.json(copy, { status: 201, headers: CORS_HEADERS });
}
