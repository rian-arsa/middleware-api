import { addLog, LogEntry } from "./logStore";
import { CORS_HEADERS } from "./cors";
import { findActiveMockV2 } from "./mockStore";

/**
 * Mengubah nama service dari URL ke nama env variable.
 * Contoh: "service-a" → "SERVICE_A_URL"
 */
export function resolveTargetUrl(
  service: string,
  path: string,
  query: string
): string {
  const envKey = service.toUpperCase().replace(/-/g, "_") + "_URL";
  const baseUrl = process.env[envKey];

  if (!baseUrl) {
    throw new Error(
      `Environment variable "${envKey}" tidak ditemukan untuk service "${service}".`
    );
  }

  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const queryString = query ? `?${query}` : "";

  return `${cleanBase}${cleanPath}${queryString}`;
}

/**
 * Konversi ArrayBuffer ke teks yang bisa di-log.
 * Untuk binary: tampilkan ukuran & content-type saja.
 */
function bufferToLogText(
  buffer: ArrayBuffer,
  contentType: string | null
): string | null {
  if (!buffer.byteLength) return null;
  if (!contentType) return `[${buffer.byteLength} bytes]`;

  const isText =
    contentType.includes("text") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    contentType.includes("form");

  if (!isText) {
    return `[binary: ${buffer.byteLength} bytes, type: ${contentType}]`;
  }

  try {
    return new TextDecoder().decode(buffer);
  } catch {
    return `[${buffer.byteLength} bytes, decode error]`;
  }
}

/**
 * Fungsi utama: proxy request ke BE, catat log, kembalikan response ke FE.
 * Tidak menggunakan .clone() agar body stream tidak pernah "terkunci".
 */
export async function proxyAndLog(
  service: string,
  path: string,
  query: string,
  req: Request
): Promise<Response> {
  const start = Date.now();

  // ── 1. Baca request body sebagai buffer ───────────────────────────────────
  // Baca sekali dari stream asli, lalu pakai buffer yang sama untuk
  // logging DAN forwarding ke BE — tidak perlu clone().
  let reqBuffer: ArrayBuffer | null = null;
  const reqContentType = req.headers.get("content-type");

  if (!["GET", "HEAD"].includes(req.method.toUpperCase())) {
    try {
      reqBuffer = await req.arrayBuffer();
    } catch {
      reqBuffer = null;
    }
  }

  const requestBody = reqBuffer
    ? bufferToLogText(reqBuffer, reqContentType)
    : null;

  // Kumpulkan request headers
  const requestHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });

  // Kumpulkan query params
  const queryParams: Record<string, string> = {};
  new URLSearchParams(query).forEach((value, key) => {
    queryParams[key] = value;
  });

  // ── 1b. Cek mock aktif ────────────────────────────────────────────────────
  const activeMock = findActiveMockV2(req.method, service, path);
  if (activeMock) {
    if (activeMock.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, activeMock.delayMs));
    }
    const duration = Date.now() - start;
    addLog({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      method: req.method,
      service,
      url: `[MOCK] ${path}`,
      queryParams,
      requestHeaders,
      requestBody,
      status: activeMock.responseStatus,
      responseHeaders: activeMock.responseHeaders,
      responseBody: activeMock.responseBody,
      duration,
      mockedBy: activeMock.id,
    });
    // Normalisasi key mock response headers ke lowercase sebelum merge,
    // agar CORS_HEADERS benar-benar meng-override header yang sama.
    // Tanpa normalisasi, plain object spread menghasilkan dua header berbeda
    // karena casing key berbeda (misal: "access-control-allow-credentials" dari
    // mock vs "Access-Control-Allow-Credentials" dari CORS_HEADERS), yang
    // menyebabkan browser reject response karena kombinasi credentials:true + origin:*.
    const normalizedMockHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(activeMock.responseHeaders)) {
      normalizedMockHeaders[k.toLowerCase()] = v;
    }
    const corsHeadersLower: Record<string, string> = {};
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      corsHeadersLower[k.toLowerCase()] = v;
    }
    return new Response(activeMock.responseBody, {
      status: activeMock.responseStatus,
      headers: {
        ...normalizedMockHeaders,
        ...corsHeadersLower,
        "x-mock": encodeURIComponent(activeMock.variantName),
        "x-mock-collection": encodeURIComponent(activeMock.collectionName),
      },
    });
  }

  const targetUrl = resolveTargetUrl(service, path, query);

  // ── 2. Forward ke BE ──────────────────────────────────────────────────────
  let status = 500;
  let responseBody: string | null = null;
  const responseHeaders: Record<string, string> = {};
  let resBuffer: ArrayBuffer = new ArrayBuffer(0);
  let resStatus = 500;
  let resStatusText = "";
  let resHeadersObj: Headers = new Headers();

  try {
    // Bangun headers untuk ke BE (hapus host + hop-by-hop headers)
    const forwardHeaders = new Headers(req.headers);
    forwardHeaders.delete("host");
    forwardHeaders.delete("connection");
    forwardHeaders.delete("keep-alive");
    forwardHeaders.delete("proxy-authenticate");
    forwardHeaders.delete("proxy-authorization");
    forwardHeaders.delete("te");
    forwardHeaders.delete("trailers");
    forwardHeaders.delete("transfer-encoding");
    forwardHeaders.delete("upgrade");
    // Minta BE tidak mengompresi response agar buffer yang diterima sudah plain
    forwardHeaders.set("accept-encoding", "identity");

    const init: RequestInit = {
      method: req.method,
      headers: forwardHeaders,
      redirect: "follow",
    };

    // Sertakan body dari buffer yang sudah dibaca
    if (reqBuffer !== null && reqBuffer.byteLength > 0) {
      init.body = reqBuffer;
    }

    const beResponse = await fetch(targetUrl, init);

    resStatus = beResponse.status;
    resStatusText = beResponse.statusText;
    resHeadersObj = beResponse.headers;
    status = resStatus;

    // Baca response body sebagai buffer — ini satu-satunya kali baca stream
    resBuffer = await beResponse.arrayBuffer();

    const resContentType = beResponse.headers.get("content-type");
    responseBody = bufferToLogText(resBuffer, resContentType);

    beResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
  } catch (error) {
    const duration = Date.now() - start;
    addLog({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      method: req.method,
      service,
      url: targetUrl,
      queryParams,
      requestHeaders,
      requestBody,
      status: 502,
      responseHeaders: {},
      responseBody: `[error: ${error instanceof Error ? error.message : String(error)}]`,
      duration,
    });

    return new Response(
      JSON.stringify({ error: "Bad Gateway", message: String(error) }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }

  // ── 3. Catat log ──────────────────────────────────────────────────────────
  const duration = Date.now() - start;

  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    method: req.method,
    service,
    url: targetUrl,
    queryParams,
    requestHeaders,
    requestBody,
    status,
    responseHeaders,
    responseBody,
    duration,
  };

  addLog(entry);

  // ── 4. Kembalikan response ke FE dari buffer ───────────────────────────────
  // Bangun ulang response dari buffer agar body stream tidak pernah "terkunci".
  // CORS headers ditambahkan langsung di sini.
  const outHeaders = new Headers(resHeadersObj);

  // Strip headers yang tidak boleh diteruskan ke FE:
  // - content-encoding: buffer sudah di-decode oleh Node.js fetch, browser
  //   tidak boleh decode ulang (akan corrupt)
  // - transfer-encoding: tidak relevan karena kita kirim buffer, bukan stream
  // - content-length: ukuran buffer mungkin berbeda dengan aslinya setelah decode
  outHeaders.delete("content-encoding");
  outHeaders.delete("transfer-encoding");
  outHeaders.delete("content-length");
  outHeaders.delete("connection");
  outHeaders.delete("keep-alive");

  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    outHeaders.set(k, v);
  }

  return new Response(resBuffer.byteLength > 0 ? resBuffer : null, {
    status: resStatus,
    statusText: resStatusText,
    headers: outHeaders,
  });
}
