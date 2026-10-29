import { connection, NextResponse } from "next/server";


// Sembunyikan kredensial (user:pass@) dan query string agar aman ditampilkan.
function sanitizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.username = "";
    u.password = "";
    u.search = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/\/\/[^/@]*@/, "//");
  }
}

export async function GET() {
  await connection();
  const items = Object.keys(process.env)
    .filter((k) => /^[A-Z][A-Z0-9_]*_URL$/.test(k) && !k.startsWith("NEXT_") && process.env[k])
    .sort()
    .map((envKey) => ({
      envKey,
      service: envKey.slice(0, -4).toLowerCase().replace(/_/g, "-"),
      baseUrl: sanitizeUrl(process.env[envKey] as string),
    }));
  return NextResponse.json({ items });
}
