import { NextRequest, NextResponse } from "next/server";
import { getCollections, createCollection } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export function GET(): NextResponse {
  return NextResponse.json(getCollections(), { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  if (!body.service || typeof body.service !== "string" || !body.service.trim()) {
    return NextResponse.json(
      { error: 'Field "service" wajib diisi.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const collection = createCollection({
    name: body.name.trim(),
    service: body.service.trim().toLowerCase(),
    description: typeof body.description === "string" ? body.description.trim() : "",
  });

  return NextResponse.json(collection, { status: 201, headers: CORS_HEADERS });
}
