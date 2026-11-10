import { connection, NextResponse } from "next/server";
import { listServices, removeService, upsertService, validateService } from "@/lib/serviceStore";

export async function GET() {
  await connection();
  return NextResponse.json({ items: listServices() });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  const service = String(body?.service ?? "").trim().toLowerCase();
  const baseUrl = String(body?.baseUrl ?? "").trim();
  const err = validateService(service, baseUrl);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  upsertService({ service, baseUrl, enabled: body?.enabled !== false });
  return NextResponse.json({ items: listServices() });
}

export async function DELETE(req: Request) {
  const service = new URL(req.url).searchParams.get("service") ?? "";
  removeService(service);
  return NextResponse.json({ items: listServices() });
}

// Tes koneksi ke base URL tanpa mengikuti redirect
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const baseUrl = String(body?.baseUrl ?? "").trim();
  const err = validateService("tes", baseUrl);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const started = Date.now();
  try {
    const res = await fetch(baseUrl, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(6000) });
    return NextResponse.json({ ok: true, status: res.status, ms: Date.now() - started });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Gagal terhubung", ms: Date.now() - started });
  }
}

