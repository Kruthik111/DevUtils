// Builds and executes the configured request. Calls fire from the browser by
// default (the user's APIs are their own), with an opt-in server proxy for
// endpoints that don't send CORS headers.

import { DynamicPageConfig, KeyValue } from './types';

export interface QueryState {
    search: string;
    sortBy: string;
    sortDir: 'asc' | 'desc';
    page: number;
    filters: Record<string, string>;
}

export interface RunResult {
    ok: boolean;
    status: number;
    statusText: string;
    data: unknown;
    durationMs: number;
    /** The exact URL that was requested — shown in the UI for debugging. */
    requestedUrl?: string;
    error?: string;
}

export function initialQueryState(config: DynamicPageConfig): QueryState {
    const filters: Record<string, string> = {};
    config.controls.filters.forEach((f) => {
        if (f.defaultValue) filters[f.param] = f.defaultValue;
    });
    return {
        search: '',
        sortBy: '',
        sortDir: 'asc',
        page: config.controls.startPage,
        filters,
    };
}

function activePairs(pairs: KeyValue[]): Record<string, string> {
    const out: Record<string, string> = {};
    pairs.forEach((p) => {
        if (p.enabled !== false && p.key.trim()) out[p.key.trim()] = p.value;
    });
    return out;
}

/** Set a dot path inside a plain object, creating intermediate objects. */
function setByPath(obj: Record<string, unknown>, path: string, value: unknown) {
    const parts = path.split('.');
    let node = obj;
    parts.slice(0, -1).forEach((part) => {
        if (node[part] === null || typeof node[part] !== 'object' || Array.isArray(node[part])) {
            node[part] = {};
        }
        node = node[part] as Record<string, unknown>;
    });
    node[parts[parts.length - 1]] = value;
}

/** Compose the final URL from the endpoint config plus the live control state. */
export function buildUrl(config: DynamicPageConfig, state: QueryState): string {
    const { endpoint, controls } = config;
    const searchMode = controls.searchMode || 'param';
    const search = state.search.trim();

    let rawUrl = endpoint.url;
    // Template mode: {{search}} can sit anywhere in the URL. Empty search → empty token.
    if (controls.searchEnabled && searchMode === 'template') {
        rawUrl = rawUrl.replaceAll('{{search}}', encodeURIComponent(search));
    }
    const url = new URL(rawUrl);

    Object.entries(activePairs(endpoint.queryParams)).forEach(([k, v]) => {
        url.searchParams.set(k, v);
    });

    if (controls.searchEnabled && searchMode === 'param' && controls.searchParam && search) {
        url.searchParams.set(controls.searchParam, search);
    }

    if (controls.sortEnabled && controls.sortParam && state.sortBy) {
        url.searchParams.set(controls.sortParam, state.sortBy);
        if (controls.sortOrderParam) {
            url.searchParams.set(
                controls.sortOrderParam,
                state.sortDir === 'asc' ? controls.ascValue : controls.descValue
            );
        }
    }

    if (controls.paginationEnabled) {
        if (controls.pageParam) url.searchParams.set(controls.pageParam, String(state.page));
        if (controls.pageSizeParam) url.searchParams.set(controls.pageSizeParam, String(controls.pageSize));
    }

    Object.entries(state.filters).forEach(([param, value]) => {
        if (value !== '' && value !== undefined && value !== null) url.searchParams.set(param, value);
    });

    return url.toString();
}

/** Resolve the request body for non-GET calls, injecting the search text per the configured mode. */
function buildBody(config: DynamicPageConfig, state: QueryState): string | undefined {
    const { endpoint, controls } = config;
    if (endpoint.method === 'GET') return undefined;

    const searchMode = controls.searchMode || 'param';
    const search = state.search.trim();
    let body = endpoint.body;

    if (controls.searchEnabled && searchMode === 'template' && body) {
        // Escape for a JSON-string context so quotes in the search text don't break the payload.
        body = body.replaceAll('{{search}}', JSON.stringify(search).slice(1, -1));
    }

    if (controls.searchEnabled && searchMode === 'body' && controls.searchBodyPath) {
        let parsed: Record<string, unknown> = {};
        if (body.trim()) {
            try {
                const candidate = JSON.parse(body);
                if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
                    parsed = candidate;
                } else {
                    return body; // not an object — can't inject, send as configured
                }
            } catch {
                return body; // not JSON — send as configured
            }
        }
        if (search) setByPath(parsed, controls.searchBodyPath, search);
        return JSON.stringify(parsed);
    }

    return body.trim() ? body : undefined;
}

export function isValidUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

/** Execute the request. `endpoint.useProxy` routes it through our server instead. */
export async function runRequest(
    config: DynamicPageConfig,
    state: QueryState,
    signal?: AbortSignal
): Promise<RunResult> {
    const start = performance.now();
    const { endpoint } = config;

    if (!isValidUrl(endpoint.url)) {
        return {
            ok: false,
            status: 0,
            statusText: '',
            data: null,
            durationMs: 0,
            error: 'Enter a valid http(s) URL',
        };
    }

    const url = buildUrl(config, state);
    const headers = activePairs(endpoint.headers);
    const requestBody = buildBody(config, state);
    const sendsBody = requestBody !== undefined;

    if (sendsBody && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        let response: Response;

        if (endpoint.useProxy) {
            response = await fetch('/api/dynamic-pages/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal,
                body: JSON.stringify({
                    url,
                    method: endpoint.method,
                    headers,
                    body: sendsBody ? requestBody : undefined,
                }),
            });
            const proxied = await response.json();
            return {
                ok: proxied.ok,
                status: proxied.status ?? response.status,
                statusText: proxied.statusText ?? '',
                data: proxied.data,
                durationMs: Math.round(performance.now() - start),
                requestedUrl: url,
                error: proxied.ok ? undefined : proxied.error,
            };
        }

        response = await fetch(url, {
            method: endpoint.method,
            headers,
            signal,
            body: sendsBody ? requestBody : undefined,
        });

        const text = await response.text();
        let data: unknown = text;
        try {
            data = JSON.parse(text);
        } catch {
            /* keep the raw text */
        }

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            data,
            durationMs: Math.round(performance.now() - start),
            requestedUrl: url,
            error: response.ok ? undefined : `Request failed with ${response.status}`,
        };
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        const message = error instanceof Error ? error.message : 'Request failed';
        return {
            ok: false,
            status: 0,
            statusText: '',
            data: null,
            durationMs: Math.round(performance.now() - start),
            // A browser fetch that dies with no status is almost always CORS.
            error: endpoint.useProxy
                ? message
                : `${message}. If this endpoint blocks browser requests (CORS), enable "Send via server" in the request settings.`,
        };
    }
}
