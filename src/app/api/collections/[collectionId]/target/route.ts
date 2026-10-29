import { NextResponse } from "next/server";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";
import { getCollections } from "@/lib/mockStore";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

// Mengembalikan base URL backend asli dari env <SERVICE>_URL (sama seperti yang dipakai proxy)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ collectionId: string }> }
): Promise<NextResponse> {
  const { collectionId } = await params;
  const col = getCollections().find((c) => c.id === collectionId);
  if (!col) {
    return NextResponse.json({ error: "Collection tidak ditemukan." }, { status: 404, headers: CORS_HEADERS });
  }

  const envKey = col.service.toUpperCase().replace(/-/g, "_") + "_URL";
  const raw = process.env[envKey];
  return NextResponse.json(
    { envKey, baseUrl: raw ? raw.replace(/\/$/, "") : null },
    { headers: CORS_HEADERS }
  );
}
