import { NextResponse } from "next/server";
import { getLogs, clearLogs } from "@/lib/logStore";

export function GET(): NextResponse {
  const logs = getLogs();
  return NextResponse.json(logs);
}

export function DELETE(): NextResponse {
  clearLogs();
  return NextResponse.json({ message: "Semua log berhasil dihapus." });
}
