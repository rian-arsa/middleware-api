import { NextRequest, NextResponse } from "next/server";
import { duplicateVariant } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function POST(
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
  const copy = duplicateVariant(collectionId, folderId, groupId, variantId);
  if (!copy) {
    return NextResponse.json(
      { error: "Response tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }
  return NextResponse.json(copy, { status: 201, headers: CORS_HEADERS });
}
