import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const TIMEOUT_MS = 20_000;
const MAX_BYTES = 5 * 1024 * 1024;

// CORS escape hatch for configured pages: the browser is the default caller,
// but endpoints that don't send CORS headers can opt into relaying through here.
// Authenticated users only — this can reach anything the server can reach.
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { url, method, headers, body } = await req.json();

        let target: URL;
        try {
            target = new URL(url);
        } catch {
            return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 });
        }
        if (target.protocol !== 'http:' && target.protocol !== 'https:') {
            return NextResponse.json({ ok: false, error: "Only http(s) URLs are supported" }, { status: 400 });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(target.toString(), {
                method: method || 'GET',
                headers: headers || {},
                body: body || undefined,
                signal: controller.signal,
                redirect: 'follow',
            });

            const text = await response.text();
            if (text.length > MAX_BYTES) {
                return NextResponse.json(
                    { ok: false, status: response.status, error: "Response too large (over 5 MB)" },
                    { status: 413 }
                );
            }

            let data: unknown = text;
            try {
                data = JSON.parse(text);
            } catch {
                /* keep raw text */
            }

            return NextResponse.json({
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                data,
                error: response.ok ? undefined : `Request failed with ${response.status}`,
            });
        } finally {
            clearTimeout(timeout);
        }
    } catch (error) {
        const aborted = error instanceof Error && error.name === 'AbortError';
        console.error("Error proxying dynamic page request:", error);
        return NextResponse.json(
            {
                ok: false,
                status: 0,
                error: aborted ? "Request timed out after 20s" : "Could not reach the endpoint",
            },
            { status: 200 }
        );
    }
}
