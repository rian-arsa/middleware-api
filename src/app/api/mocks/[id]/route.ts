import { NextRequest, NextResponse } from "next/server";
import { updateMock, deleteMock } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

type Params = Promise<{ id: string }>;

// Preflight OPTIONS
export function OPTIONS(): Response {
  return corsPreflightResponse();
}

// PUT /api/mocks/:id - update mock
export async function PUT(
  req: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse> {
  const { id } = await params;
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
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.method !== undefined) updates.method = String(body.method).toUpperCase();
  if (body.service !== undefined) updates.service = String(body.service).trim().toLowerCase();
  if (body.path !== undefined) {
    const pathStr = String(body.path).trim();
    if (!pathStr.startsWith("/")) {
      return NextResponse.json(
        { error: 'Field "path" harus diawali dengan karakter "/".' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    updates.path = pathStr;
  }
  if (body.enabled !== undefined) updates.enabled = Boolean(body.enabled);
  if (body.responseStatus !== undefined) {
    const statusNum = Number(body.responseStatus);
    if (isNaN(statusNum) || statusNum < 100 || statusNum > 599) {
      return NextResponse.json(
        { error: 'Field "responseStatus" harus berupa angka antara 100 dan 599.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    updates.responseStatus = statusNum;
  }
  if (body.responseHeaders !== undefined && typeof body.responseHeaders === "object") {
    updates.responseHeaders = body.responseHeaders;
  }
  if (body.responseBody !== undefined) {
    updates.responseBody = String(body.responseBody);
  }
  if (body.delayMs !== undefined) {
    updates.delayMs = Math.max(0, Number(body.delayMs) || 0);
  }

  const updated = updateMock(id, updates);
  if (!updated) {
    return NextResponse.json(
      { error: "Mock tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(updated, { headers: CORS_HEADERS });
}

// DELETE /api/mocks/:id - delete mock
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse> {
  const { id } = await params;
  const ok = deleteMock(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Mock tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ message: "Mock berhasil dihapus." }, { headers: CORS_HEADERS });
}