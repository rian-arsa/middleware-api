import { NextRequest, NextResponse } from "next/server";
import { createVariant } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function POST(
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

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { error: 'Field "name" wajib diisi.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const statusNum = Number(body.responseStatus);
  if (isNaN(statusNum) || statusNum < 100 || statusNum > 599) {
    return NextResponse.json(
      { error: 'Field "responseStatus" harus berupa angka status HTTP antara 100 dan 599.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const delayMsNum = Number(body.delayMs ?? 0);
  if (isNaN(delayMsNum) || delayMsNum < 0) {
    return NextResponse.json(
      { error: 'Field "delayMs" harus berupa angka >= 0.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  let responseHeaders = body.responseHeaders;
  if (!responseHeaders || typeof responseHeaders !== "object" || Array.isArray(responseHeaders)) {
    responseHeaders = { "content-type": "application/json" };
  }

  const variant = createVariant(collectionId, folderId, groupId, {
    name: body.name.trim(),
    description: typeof body.description === "string" ? body.description : undefined,
    responseStatus: statusNum,
    responseHeaders,
    responseBody: typeof body.responseBody === "string" ? body.responseBody : "",
    delayMs: delayMsNum,
  });

  if (!variant) {
    return NextResponse.json(
      { error: "Endpoint group tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(variant, { status: 201, headers: CORS_HEADERS });
}
