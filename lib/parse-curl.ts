export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
}

function tokenize(input: string): string[] {
  const cleaned = input
    .replace(/\\\r?\n/g, ' ')
    .replace(/\r?\n/g, ' ')
    // normalize smart quotes that come from copy/paste
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    // strip common shell prompts at start
    .replace(/^\s*[$#>]\s+/, '')
    .trim();

  const tokens: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let buf = '';
      while (i < cleaned.length && cleaned[i] !== quote) {
        if (cleaned[i] === '\\' && i + 1 < cleaned.length && quote === '"') {
          buf += cleaned[i + 1];
          i += 2;
        } else {
          buf += cleaned[i++];
        }
      }
      i++;
      tokens.push(buf);
    } else {
      let buf = '';
      while (i < cleaned.length && cleaned[i] !== ' ' && cleaned[i] !== '\t') {
        if (cleaned[i] === '\\' && i + 1 < cleaned.length) {
          buf += cleaned[i + 1];
          i += 2;
        } else {
          buf += cleaned[i++];
        }
      }
      tokens.push(buf);
    }
  }
  return tokens;
}

export function parseCurl(input: string): ParsedCurl {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Empty cURL command');

  const rawTokens = tokenize(trimmed);
  if (rawTokens.length === 0) throw new Error('Invalid cURL command');
  if (rawTokens[0].toLowerCase() === 'curl') rawTokens.shift();

  // Split `--flag=value` into two tokens
  const tokens: string[] = [];
  for (const t of rawTokens) {
    if (t.startsWith('--') && t.includes('=')) {
      const eq = t.indexOf('=');
      tokens.push(t.slice(0, eq));
      tokens.push(t.slice(eq + 1));
    } else {
      tokens.push(t);
    }
  }

  let method = '';
  let url = '';
  const headers: Record<string, string> = {};
  const dataParts: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = () => tokens[++i];

    if (t === '-X' || t === '--request') {
      method = (next() || '').toUpperCase();
    } else if (t === '-H' || t === '--header') {
      const h = next() || '';
      const idx = h.indexOf(':');
      if (idx > -1) {
        const key = h.slice(0, idx).trim();
        const value = h.slice(idx + 1).trim();
        if (key) headers[key] = value;
      }
    } else if (
      t === '-d' || t === '--data' || t === '--data-raw' ||
      t === '--data-binary' || t === '--data-ascii'
    ) {
      dataParts.push(next() || '');
    } else if (t === '--data-urlencode') {
      dataParts.push(next() || '');
    } else if (t === '-u' || t === '--user') {
      const cred = next() || '';
      headers['Authorization'] = 'Basic ' + (typeof btoa !== 'undefined' ? btoa(cred) : cred);
    } else if (t === '-A' || t === '--user-agent') {
      headers['User-Agent'] = next() || '';
    } else if (t === '-e' || t === '--referer') {
      headers['Referer'] = next() || '';
    } else if (t === '-b' || t === '--cookie') {
      headers['Cookie'] = next() || '';
    } else if (t === '--url') {
      url = next() || '';
    } else if (
      t === '-i' || t === '-I' || t === '-k' || t === '-L' || t === '-s' ||
      t === '-v' || t === '-g' || t === '-O' || t === '-J' || t === '-f' ||
      t === '--compressed' || t === '--insecure' || t === '--location' ||
      t === '--silent' || t === '--verbose' || t === '--include' ||
      t === '--head' || t === '--fail' || t === '--globoff' ||
      t === '--remote-name' || t === '--remote-header-name'
    ) {
      // boolean flag, ignore
    } else if (t.startsWith('-') && t.length > 1 && !t.startsWith('http')) {
      // unknown flag with a value — skip its value
      i++;
    } else if (!url) {
      url = t;
    }
  }

  if (!url) throw new Error('No URL found in cURL command');

  const body = dataParts.join('&');
  if (!method) method = body ? 'POST' : 'GET';

  // Split query params off URL
  const queryParams: Record<string, string> = {};
  const qIdx = url.indexOf('?');
  if (qIdx > -1) {
    const qs = url.slice(qIdx + 1);
    url = url.slice(0, qIdx);
    for (const pair of qs.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const k = eq > -1 ? pair.slice(0, eq) : pair;
      const v = eq > -1 ? pair.slice(eq + 1) : '';
      try {
        queryParams[decodeURIComponent(k)] = decodeURIComponent(v);
      } catch {
        queryParams[k] = v;
      }
    }
  }

  return { method, url, headers, queryParams, body };
}
