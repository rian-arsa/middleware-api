import type {
  KeyValueDoc,
  MockCollection,
  MockGroup,
  RequestBodyDoc,
} from "./mockTypes";

export function buildMockUrl(origin: string, service: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/+$/, "")}/${service}${p}`;
}

function activeKv(rows?: KeyValueDoc[]): KeyValueDoc[] {
  return (rows ?? []).filter((r) => r.enabled !== false && r.key.trim() !== "");
}

export function withQuery(url: string, rows?: KeyValueDoc[]): string {
  const q = activeKv(rows);
  if (q.length === 0) return url;
  const sp = new URLSearchParams();
  q.forEach((r) => sp.append(r.key, r.value));
  return `${url}${url.includes("?") ? "&" : "?"}${sp.toString()}`;
}

interface SnippetInput {
  method: string;
  url: string;
  headers?: KeyValueDoc[];
  body?: RequestBodyDoc;
}

function snippetParts(input: SnippetInput) {
  const headers: Record<string, string> = {};
  activeKv(input.headers).forEach((h) => {
    headers[h.key] = h.value;
  });
  const body = input.body && input.body.mode !== "none" && input.body.content.trim() ? input.body : null;
  if (body?.mode === "json" && !Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }
  return { headers, body };
}

export function buildCurl(input: SnippetInput): string {
  const { headers, body } = snippetParts(input);
  const esc = (s: string) => s.replace(/'/g, `'\\''`);
  const lines = [`curl -X ${input.method.toUpperCase()} '${esc(input.url)}'`];
  Object.entries(headers).forEach(([k, v]) => lines.push(`  -H '${esc(k)}: ${esc(v)}'`));
  if (body) lines.push(`  -d '${esc(body.content)}'`);
  return lines.join(" \\\n");
}

export function buildFetchSnippet(input: SnippetInput): string {
  const { headers, body } = snippetParts(input);
  const opts: string[] = [`  method: ${JSON.stringify(input.method.toUpperCase())},`];
  if (Object.keys(headers).length) {
    opts.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")},`);
  }
  if (body) opts.push(`  body: ${JSON.stringify(body.content)},`);
  return `const res = await fetch(${JSON.stringify(input.url)}, {\n${opts.join("\n")}\n});\nconst data = await res.json();`;
}

export function buildAxiosSnippet(input: SnippetInput): string {
  const { headers, body } = snippetParts(input);
  const cfg: string[] = [
    `  method: ${JSON.stringify(input.method.toLowerCase())},`,
    `  url: ${JSON.stringify(input.url)},`,
  ];
  if (Object.keys(headers).length) {
    cfg.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")},`);
  }
  if (body) cfg.push(`  data: ${JSON.stringify(body.content)},`);
  return `const { data } = await axios({\n${cfg.join("\n")}\n});`;
}

export function groupLabel(g: MockGroup): string {
  return g.name?.trim() || g.path;
}

export function countStats(collections: MockCollection[]) {
  let endpoints = 0;
  let variants = 0;
  collections.forEach((c) =>
    c.folders.forEach((f) => {
      endpoints += f.groups.length;
      f.groups.forEach((g) => (variants += g.variants.length));
    })
  );
  return { collections: collections.length, endpoints, variants };
}

function mdTable(title: string, rows?: KeyValueDoc[]): string {
  const r = (rows ?? []).filter((x) => x.key.trim());
  if (!r.length) return "";
  const lines = [`**${title}**`, "", "| Key | Contoh | Deskripsi |", "|---|---|---|"];
  r.forEach((x) =>
    lines.push(`| \`${x.key}\` | \`${x.value}\` | ${(x.description ?? "").replace(/\|/g, "\\|")} |`)
  );
  return lines.join("\n") + "\n";
}

export function buildCollectionMarkdown(col: MockCollection, origin: string): string {
  const out: string[] = [`# ${col.name}`, ""];
  if (col.description) out.push(col.description, "");
  out.push(`Base URL: \`${origin}/${col.service}\``, "");
  col.folders.forEach((folder) => {
    out.push(`## ${folder.name}`, "");
    folder.groups.forEach((g) => {
      const url = buildMockUrl(origin, col.service, g.path);
      out.push(`### \`${g.method}\` ${g.path}${g.name ? ` — ${g.name}` : ""}`, "");
      if (g.enabled === false) out.push("_Nonaktif_", "");
      if (g.description) out.push(g.description, "");
      const q = mdTable("Query Params", g.requestQuery);
      if (q) out.push(q);
      const h = mdTable("Headers", g.requestHeaders);
      if (h) out.push(h);
      if (g.requestBody && g.requestBody.mode !== "none" && g.requestBody.content.trim()) {
        out.push("**Request Body**", "", "```" + (g.requestBody.mode === "json" ? "json" : ""), g.requestBody.content, "```", "");
      }
      out.push("**Contoh Request**", "", "```bash", buildCurl({
        method: g.method,
        url: withQuery(url, g.requestQuery),
        headers: g.requestHeaders,
        body: g.requestBody,
      }), "```", "");
      if (g.variants.length === 0) out.push("_Belum ada contoh response._", "");
      g.variants.forEach((v) => {
        out.push(`**Response: ${v.responseStatus} — ${v.name}**${v.id === g.activeVariantId ? " (aktif)" : ""}`, "");
        if (v.description) out.push(v.description, "");
        out.push("```json", v.responseBody, "```", "");
      });
    });
  });
  return out.join("\n");
}
