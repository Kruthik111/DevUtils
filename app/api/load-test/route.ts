import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_REQUESTS = 200;
const MAX_CONCURRENCY = 50;

interface RunBody {
  request: { method: string; url: string; headers: Record<string, string>; body: string | null };
  count: number;
  mode: "parallel" | "sequential";
  concurrency: number;
}

async function fire(req: RunBody["request"]) {
  const started = performance.now();
  try {
    const res = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body ?? undefined,
      redirect: "follow",
    });
    const text = await res.text();
    return { status: res.status, ms: performance.now() - started, bytes: text.length, sample: text.slice(0, 2000) };
  } catch (e) {
    return { status: 0, ms: performance.now() - started, bytes: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as RunBody;
  const url = body?.request?.url ?? "";
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ message: "Request URL must be http(s)" }, { status: 400 });
  }

  const count = Math.min(Math.max(1, Math.floor(body.count) || 1), MAX_REQUESTS);
  const concurrency = Math.min(Math.max(1, Math.floor(body.concurrency) || 1), MAX_CONCURRENCY);

  // NDJSON stream: one line per finished request, final line carries wall time.
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      const started = Date.now();
      try {
        if (body.mode === "sequential") {
          for (let i = 0; i < count; i++) emit({ i, ...(await fire(body.request)) });
        } else {
          let next = 0;
          await Promise.all(
            Array.from({ length: Math.min(concurrency, count) }, async () => {
              while (next < count) {
                const i = next++;
                emit({ i, ...(await fire(body.request)) });
              }
            })
          );
        }
        emit({ done: true, wallMs: Date.now() - started });
      } catch (e) {
        emit({ error: e instanceof Error ? e.message : String(e) });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
