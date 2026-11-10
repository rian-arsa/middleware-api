import { NextResponse } from "next/server";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";
import { getCollections } from "@/lib/mockStore";
import { getServiceBaseUrl, serviceToEnvKey } from "@/lib/serviceStore";

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

  const envKey = serviceToEnvKey(col.service);
  const raw = getServiceBaseUrl(col.service);
  return NextResponse.json(
    { envKey, baseUrl: raw ? raw.replace(/\/$/, "") : null },
    { headers: CORS_HEADERS }
  );
}
