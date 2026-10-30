export type RowKind = "same" | "changed" | "added" | "removed";

export interface Line {
  n: number;
  text: string;
}

export interface SbsRow {
  left?: Line;
  right?: Line;
  kind: RowKind;
}

export interface SbsResult {
  rows: SbsRow[];
  isJson: boolean;
  counts: Record<RowKind, number>;
}

function tryParse(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function stripKeys(value: unknown, ignore: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((v) => stripKeys(v, ignore));
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (!ignore.has(k.toLowerCase())) out[k] = stripKeys(v, ignore);
    }
    return out;
  }
  return value;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) out[k] = sortKeys((value as Record<string, unknown>)[k]);
    return out;
  }
  return value;
}

export function normalize(text: string, ignoreKeys: string[], sort: boolean): { lines: string[]; isJson: boolean } {
  const ignore = new Set(ignoreKeys.map((k) => k.trim().toLowerCase()).filter(Boolean));
  const p = tryParse(text);
  if (p.ok) {
    let v = stripKeys(p.value, ignore);
    if (sort) v = sortKeys(v);
    return { lines: JSON.stringify(v, null, 2).split("\n"), isJson: true };
  }
  return { lines: text.split(/\r?\n/), isJson: false };
}

type Op = { t: "same" | "del" | "add"; i: number; j: number };

function diffOps(a: string[], b: string[]): Op[] {
  const n = a.length;
  const m = b.length;
  const ops: Op[] = [];
  let start = 0;
  while (start < n && start < m && a[start] === b[start]) {
    ops.push({ t: "same", i: start, j: start });
    start++;
  }
  let endA = n;
  let endB = m;
  const tail: Op[] = [];
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
    tail.push({ t: "same", i: endA, j: endB });
  }
  const an = endA - start;
  const bn = endB - start;

  // LCS dibatasi agar tetap ringan untuk teks yang sangat panjang
  if (an * bn > 4_000_000) {
    for (let k = 0; k < Math.max(an, bn); k++) {
      if (k < an) ops.push({ t: "del", i: start + k, j: -1 });
      if (k < bn) ops.push({ t: "add", i: -1, j: start + k });
    }
  } else {
    const dp: Uint32Array[] = Array.from({ length: an + 1 }, () => new Uint32Array(bn + 1));
    for (let i = an - 1; i >= 0; i--) {
      for (let j = bn - 1; j >= 0; j--) {
        dp[i][j] = a[start + i] === b[start + j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < an || j < bn) {
      if (i < an && j < bn && a[start + i] === b[start + j]) {
        ops.push({ t: "same", i: start + i, j: start + j });
        i++;
        j++;
      } else if (j < bn && (i >= an || dp[i][j + 1] >= dp[i + 1][j])) {
        ops.push({ t: "add", i: -1, j: start + j });
        j++;
      } else {
        ops.push({ t: "del", i: start + i, j: -1 });
        i++;
      }
    }
  }
  return ops.concat(tail.reverse());
}

export function sideBySide(aText: string, bText: string, ignoreKeys: string[] = [], sort = false): SbsResult {
  const na = normalize(aText, ignoreKeys, sort);
  const nb = normalize(bText, ignoreKeys, sort);
  const ops = diffOps(na.lines, nb.lines);
  const rows: SbsRow[] = [];

  let k = 0;
  while (k < ops.length) {
    const op = ops[k];
    if (op.t === "same") {
      rows.push({ left: { n: op.i + 1, text: na.lines[op.i] }, right: { n: op.j + 1, text: nb.lines[op.j] }, kind: "same" });
      k++;
      continue;
    }
    // kumpulkan satu blok perubahan lalu pasangkan baris hapus dan tambah
    const dels: Op[] = [];
    const adds: Op[] = [];
    while (k < ops.length && ops[k].t !== "same") {
      (ops[k].t === "del" ? dels : adds).push(ops[k]);
      k++;
    }
    const len = Math.max(dels.length, adds.length);
    for (let x = 0; x < len; x++) {
      const d = dels[x];
      const ad = adds[x];
      const left = d ? { n: d.i + 1, text: na.lines[d.i] } : undefined;
      const right = ad ? { n: ad.j + 1, text: nb.lines[ad.j] } : undefined;
      rows.push({ left, right, kind: left && right ? "changed" : left ? "removed" : "added" });
    }
  }

  const counts: Record<RowKind, number> = { same: 0, changed: 0, added: 0, removed: 0 };
  for (const r of rows) counts[r.kind]++;
  return { rows, isJson: na.isJson && nb.isJson, counts };
}

// Bagian awal dan akhir yang sama dipisahkan agar bagian yang berbeda bisa diberi warna lebih pekat
export function inlineSplit(a: string, b: string): { pre: string; midA: string; midB: string; post: string } {
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let e = 0;
  while (e < a.length - s && e < b.length - s && a[a.length - 1 - e] === b[b.length - 1 - e]) e++;
  return { pre: a.slice(0, s), midA: a.slice(s, a.length - e), midB: b.slice(s, b.length - e), post: a.slice(a.length - e) };
}

export function prettyIfJson(text: string | null | undefined): string {
  if (!text) return "";
  const p = tryParse(text);
  return p.ok ? JSON.stringify(p.value, null, 2) : text;
}
