"use client";

import { useMemo, useRef, useState } from "react";
import { Play, Loader2, Zap, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseCurl } from "@/lib/curl";

interface Result {
  i: number;
  status: number;
  ms: number;
  bytes: number;
  sample?: string;
  error?: string;
}

const isOk = (r: Result) => r.status >= 200 && r.status < 400;
const fmt = (n: number) => `${Math.round(n)} ms`;
const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;

export default function LoadTestPage() {
  const [curl, setCurl] = useState("");
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState<"parallel" | "sequential">("parallel");
  const [concurrency, setConcurrency] = useState(10);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [wallMs, setWallMs] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const parsed = useMemo(() => {
    if (!curl.trim()) return null;
    try {
      const p = parseCurl(curl);
      return p.url ? p : null;
    } catch {
      return null;
    }
  }, [curl]);

  const stats = useMemo(() => {
    if (!results.length) return null;
    const times = results.map((r) => r.ms).sort((a, b) => a - b);
    const ok = results.filter(isOk).length;
    const codes = new Map<string, number>();
    results.forEach((r) => {
      const key = r.error ? `ERR ${r.error}` : String(r.status);
      codes.set(key, (codes.get(key) ?? 0) + 1);
    });
    return {
      ok,
      failed: results.length - ok,
      min: times[0],
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      max: times[times.length - 1],
      p50: pct(times, 50),
      p90: pct(times, 90),
      p95: pct(times, 95),
      p99: pct(times, 99),
      codes: [...codes.entries()],
    };
  }, [results]);

  async function run() {
    if (!parsed) return toast.error("Paste a valid curl command first");
    setRunning(true);
    setResults([]);
    setWallMs(0);

    const incoming: Result[] = [];
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/load-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: parsed, count, mode, concurrency }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).message || "Run failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const msg = JSON.parse(line);
          if (msg.error && msg.i === undefined) throw new Error(msg.error);
          if (msg.done) {
            setWallMs(msg.wallMs);
            continue;
          }
          incoming[msg.i] = msg;
          setResults(incoming.filter(Boolean)); // live: each response paints as it lands
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  const maxMs = Math.max(1, ...results.map((r) => r.ms));
  const firstSample = results.find((r) => r.sample)?.sample;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(340px,420px)_1fr] gap-6 items-start">
        {/* Setup */}
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-bold text-foreground/90 mb-4">REQUEST</div>

          <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Paste curl</label>
          <textarea
            value={curl}
            onChange={(e) => setCurl(e.target.value)}
            spellCheck={false}
            placeholder="curl --location 'https://api.example.com/things' --header 'Authorization: JWT ...'"
            className="mt-2 w-full h-44 rounded-xl border border-border bg-secondary/40 p-3 font-mono text-xs outline-none focus:border-primary/60"
          />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Requests</label>
              <input
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(e) => setCount(+e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">Max concurrent</label>
              <input
                type="number"
                min={1}
                max={50}
                disabled={mode === "sequential"}
                value={concurrency}
                onChange={(e) => setConcurrency(+e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary/60 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {([
              { id: "parallel", label: "All at once", icon: Zap },
              { id: "sequential", label: "One after another", icon: ListOrdered },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors",
                  mode === id ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-foreground/60 hover:bg-secondary"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={running ? () => abortRef.current?.abort() : run}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Stop" : "Run test"}
          </button>

          {parsed && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3 font-mono text-[11px] text-foreground/60 break-all max-h-40 overflow-auto">
              <div className="text-foreground/90">{parsed.method} {parsed.url}</div>
              {Object.entries(parsed.headers).map(([k, v]) => (
                <div key={k}>{k}: {v.slice(0, 70)}{v.length > 70 ? "…" : ""}</div>
              ))}
            </div>
          )}
        </div>

        {/* Report */}
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-bold text-foreground/90 mb-4">REPORT</div>

          {!stats ? (
            <div className="text-sm text-foreground/50">Run a test to see results.</div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,120px))] gap-2.5">
                {[
                  ["Requests", String(results.length)],
                  ["Success", String(stats.ok)],
                  ["Failed", String(stats.failed)],
                  ["Wall time", wallMs ? fmt(wallMs) : "…"],
                  ["Throughput", wallMs ? `${(results.length / (wallMs / 1000)).toFixed(2)}/s` : "…"],
                  ["Min", fmt(stats.min)],
                  ["Avg", fmt(stats.avg)],
                  ["p50", fmt(stats.p50)],
                  ["p90", fmt(stats.p90)],
                  ["p95", fmt(stats.p95)],
                  ["p99", fmt(stats.p99)],
                  ["Max", fmt(stats.max)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">{label}</div>
                    <div className={cn("text-lg font-bold", label === "Failed" && stats.failed > 0 && "text-red-500", label === "Success" && "text-green-600")}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex h-28 items-end gap-[2px] overflow-x-auto">
                {results.map((r) => (
                  <span
                    key={r.i}
                    title={`#${r.i + 1} · ${r.error ?? r.status} · ${fmt(r.ms)}`}
                    style={{ height: `${Math.max(3, (r.ms / maxMs) * 100)}%` }}
                    className={cn("w-1.5 shrink-0 rounded-t-sm", isOk(r) ? "bg-primary" : "bg-red-500")}
                  />
                ))}
              </div>

              <table className="mt-5 text-xs">
                <tbody>
                  {stats.codes.map(([code, n]) => (
                    <tr key={code} className="border-b border-border">
                      <td className="py-1.5 pr-8 font-mono">{code}</td>
                      <td className="py-1.5 text-right font-bold">{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-5 max-h-72 overflow-auto">
                <table className="text-xs w-full">
                  <thead className="text-foreground/50">
                    <tr>
                      <th className="text-left py-1.5 pr-6 font-medium">#</th>
                      <th className="text-left py-1.5 pr-6 font-medium">Status</th>
                      <th className="text-right py-1.5 pr-6 font-medium">Time</th>
                      <th className="text-right py-1.5 font-medium">Size</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {results.map((r) => (
                      <tr key={r.i} className="border-t border-border">
                        <td className="py-1.5 pr-6">{r.i + 1}</td>
                        <td className={cn("py-1.5 pr-6", isOk(r) ? "text-green-600" : "text-red-500")}>{r.error ?? r.status}</td>
                        <td className="py-1.5 pr-6 text-right">{fmt(r.ms)}</td>
                        <td className="py-1.5 text-right">{r.bytes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {firstSample && (
                <pre className="mt-5 max-h-60 overflow-auto rounded-xl border border-border bg-secondary/30 p-3 text-[11px] whitespace-pre-wrap break-all">
                  {firstSample}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
