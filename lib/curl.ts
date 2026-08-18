export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

/** Parses a curl command (as copied from browser devtools / Postman) into request parts. */
export function parseCurl(text: string): ParsedCurl {
  const tokens: string[] = [];
  const re = /'([^']*)'|"((?:[^"\\]|\\.)*)"|(\S+)/g;
  const src = text.replace(/\\\r?\n/g, " ");
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    tokens.push(m[1] ?? (m[2] !== undefined ? m[2].replace(/\\(.)/g, "$1") : m[3]));
  }

  const out: ParsedCurl = { method: "", url: "", headers: {}, body: null };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "-X" || t === "--request") { out.method = tokens[++i] ?? ""; continue; }
    if (t === "-H" || t === "--header") {
      const h = tokens[++i] ?? "";
      const at = h.indexOf(":");
      if (at > 0) out.headers[h.slice(0, at).trim()] = h.slice(at + 1).trim();
      continue;
    }
    if (t === "-b" || t === "--cookie") { out.headers.Cookie = tokens[++i] ?? ""; continue; }
    if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary" || t === "--data-urlencode") {
      out.body = (out.body ? out.body + "&" : "") + (tokens[++i] ?? "");
      continue;
    }
    if (t === "curl" || t.startsWith("-")) continue; // flags we don't care about (-L, --compressed, …)
    if (!out.url) out.url = t;
  }

  out.method = (out.method || (out.body ? "POST" : "GET")).toUpperCase();
  return out;
}
