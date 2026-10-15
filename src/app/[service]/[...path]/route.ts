import { NextRequest, NextResponse } from "next/server";
import { proxyAndLog } from "@/lib/proxy";
import { corsPreflightResponse, CORS_HEADERS } from "@/lib/cors";

type Params = Promise<{
  service: string;
  path: string[];
}>;

// Nama service yang dilarang karena bentrok dengan route internal
const RESERVED = ["logs", "api", "mocks", "tester"];

async function handler(
  req: NextRequest,
  { params }: { params: Params }
): Promise<Response> {
  const { service, path } = await params;

  if (RESERVED.includes(service)) {
    return NextResponse.json(
      { error: `Nama service "${service}" tidak diizinkan karena bentrok dengan route internal.` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const joinedPath = "/" + path.join("/");
  const query = req.nextUrl.search.replace(/^\?/, "");

  return proxyAndLog(service, joinedPath, query, req);
}

// Preflight OPTIONS — wajib ada agar browser tidak reject sebelum request dikirim
export async function OPTIONS(): Promise<Response> {
  return corsPreflightResponse();
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
