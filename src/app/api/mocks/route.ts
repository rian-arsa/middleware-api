import { NextRequest, NextResponse } from "next/server";
import { getMocks, createMock } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

// Preflight OPTIONS
export function OPTIONS(): Response {
  return corsPreflightResponse();
}

// GET /api/mocks - return all mocks
export function GET(): NextResponse {
  return NextResponse.json(getMocks(), { headers: CORS_HEADERS });
}

// POST /api/mocks - create a new mock
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

  const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const method = String(body.method || "").toUpperCase();
  if (!validMethods.includes(method)) {
    return NextResponse.json(
      {
        error: `Field "method" harus salah satu dari: ${validMethods.join(", ")}.`,
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!body.service || typeof body.service !== "string" || !body.service.trim()) {
    return NextResponse.json(
      { error: 'Field "service" wajib diisi.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!body.path || typeof body.path !== "string" || !body.path.trim()) {
    return NextResponse.json(
      { error: 'Field "path" wajib diisi.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const pathStr = body.path.trim();
  if (!pathStr.startsWith("/")) {
    return NextResponse.json(
      { error: 'Field "path" harus diawali dengan karakter "/".' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const statusNum = Number(body.responseStatus);
  if (isNaN(statusNum) || statusNum < 100 || statusNum > 599) {
    return NextResponse.json(
      { error: 'Field "responseStatus" harus berupa angka antara 100 dan 599.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (body.responseBody === undefined || body.responseBody === null) {
    return NextResponse.json(
      { error: 'Field "responseBody" wajib diisi.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  let responseHeaders: Record<string, string> = {};
  if (body.responseHeaders && typeof body.responseHeaders === "object") {
    responseHeaders = body.responseHeaders;
  }

  const delayMs = Math.max(0, Number(body.delayMs) || 0);

  const entry = createMock({
    name: body.name.trim(),
    method,
    service: body.service.trim().toLowerCase(),
    path: pathStr,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
    responseStatus: statusNum,
    responseHeaders,
    responseBody: String(body.responseBody),
    delayMs,
  });

  return NextResponse.json(entry, { status: 201, headers: CORS_HEADERS });
}