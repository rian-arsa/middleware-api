import { NextRequest, NextResponse } from "next/server";
import { createGroup } from "@/lib/mockStore";
import { CORS_HEADERS, corsPreflightResponse } from "@/lib/cors";

export function OPTIONS(): Response {
  return corsPreflightResponse();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collectionId: string; folderId: string }> }
): Promise<NextResponse> {
  const { collectionId, folderId } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Format request body harus berupa JSON." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const method = String(body.method || "").toUpperCase();
  if (!validMethods.includes(method)) {
    return NextResponse.json(
      { error: `Method harus salah satu dari: ${validMethods.join(", ")}.` },
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
      { error: 'Field "path" harus diawali dengan tanda slash ("/").' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const group = createGroup(collectionId, folderId, {
    method,
    path: pathStr,
    name: typeof body.name === "string" ? body.name : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
  });

  if (!group) {
    return NextResponse.json(
      { error: "Collection atau Folder tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(group, { status: 201, headers: CORS_HEADERS });
}
