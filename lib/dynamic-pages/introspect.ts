// Response introspection: given a sample API response, work out where the rows
// live and what columns they should produce. This is what lets the builder
// configure a page without anyone writing frontend code.

import { ColumnType, ColumnConfig } from './types';

/** Read a dot path out of an object. Empty path returns the object itself. */
export function getByPath(obj: unknown, path?: string): unknown {
    if (!path) return obj;
    return path.split('.').reduce<unknown>((acc, part) => {
        if (acc === null || acc === undefined) return undefined;
        if (Array.isArray(acc)) {
            const idx = Number(part);
            return Number.isInteger(idx) ? acc[idx] : undefined;
        }
        if (typeof acc === 'object') return (acc as Record<string, unknown>)[part];
        return undefined;
    }, obj);
}

export interface ArrayCandidate {
    path: string;
    length: number;
    /** Rough score used to pick the most likely "rows" array. */
    score: number;
}

/**
 * Find every array of objects in the response, ranked by how likely it is to be
 * the list the user wants to render. Depth-limited so huge payloads stay cheap.
 */
export function findArrayCandidates(response: unknown, maxDepth = 4): ArrayCandidate[] {
    const found: ArrayCandidate[] = [];
    const preferredNames = ['data', 'items', 'results', 'records', 'rows', 'list', 'content', 'docs'];

    const walk = (node: unknown, path: string, depth: number) => {
        if (depth > maxDepth || node === null || typeof node !== 'object') return;

        if (Array.isArray(node)) {
            const objectRows = node.filter((r) => r && typeof r === 'object' && !Array.isArray(r));
            if (objectRows.length > 0) {
                const last = path.split('.').pop() || '';
                // Shallower paths and conventional names win.
                let score = 100 - depth * 10;
                if (preferredNames.includes(last)) score += 25;
                score += Math.min(node.length, 20);
                found.push({ path, length: node.length, score });
            }
            // Don't descend into array elements — one level of rows is enough.
            return;
        }

        Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
            walk(value, path ? `${path}.${key}` : key, depth + 1);
        });
    };

    walk(response, '', 0);
    return found.sort((a, b) => b.score - a.score);
}

/** Guess a column type from a set of sample values. */
function inferType(values: unknown[]): ColumnType {
    const sample = values.find((v) => v !== null && v !== undefined);
    if (sample === undefined) return 'text';

    if (typeof sample === 'boolean') return 'boolean';
    if (typeof sample === 'number') return 'number';
    if (Array.isArray(sample)) {
        // Type arrays by their first element so ["a.jpg", ...] renders as images.
        const first = sample.find((v) => v !== null && v !== undefined);
        if (typeof first === 'string') {
            if (/\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(first)) return 'image';
            if (/^https?:\/\//i.test(first)) return 'link';
            return 'badge';
        }
        return 'json';
    }
    if (typeof sample === 'object') return 'json';

    if (typeof sample === 'string') {
        if (/^https?:\/\//i.test(sample)) {
            return /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(sample) ? 'image' : 'link';
        }
        // ISO-ish date, or a date-only string
        if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/.test(sample) && !Number.isNaN(Date.parse(sample))) {
            return 'date';
        }
        // Short, low-cardinality strings read well as badges (status, role, type...)
        const strings = values.filter((v): v is string => typeof v === 'string');
        const unique = new Set(strings);
        if (sample.length <= 20 && unique.size > 0 && unique.size <= Math.max(2, strings.length / 3)) {
            return 'badge';
        }
    }
    return 'text';
}

/** Turn "created_at" / "createdAt" / "user.firstName" into "Created At" / "User First Name". */
export function humanizeKey(key: string): string {
    return key
        .split('.')
        .map((part) =>
            part
                .replace(/[_-]+/g, ' ')
                .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/\b\w/g, (c) => c.toUpperCase())
        )
        .join(' ');
}

/**
 * Collect the leaf keys shared across sample rows, flattening nested objects one
 * level at a time so "user.name" becomes a selectable column.
 */
export function detectColumns(rows: unknown[], maxNestDepth = 2): ColumnConfig[] {
    const sample = rows.filter((r) => r && typeof r === 'object' && !Array.isArray(r)).slice(0, 25) as Record<string, unknown>[];
    if (sample.length === 0) return [];

    const valuesByKey = new Map<string, unknown[]>();

    const collect = (obj: Record<string, unknown>, prefix: string, depth: number) => {
        Object.entries(obj).forEach(([key, value]) => {
            const path = prefix ? `${prefix}.${key}` : key;
            const isPlainObject = value !== null && typeof value === 'object' && !Array.isArray(value);

            if (isPlainObject && depth < maxNestDepth) {
                collect(value as Record<string, unknown>, path, depth + 1);
                return;
            }
            const existing = valuesByKey.get(path);
            if (existing) existing.push(value);
            else valuesByKey.set(path, [value]);
        });
    };

    sample.forEach((row) => collect(row, '', 0));

    return Array.from(valuesByKey.entries()).map(([key, values], index) => ({
        key,
        label: humanizeKey(key),
        type: inferType(values),
        // Keep the first handful visible so a fresh config isn't overwhelming.
        visible: index < 8,
        sortable: false,
        sortKey: key,
    }));
}

/** Scalar paths at the root of the response — candidates for stat tiles. */
export function detectScalarPaths(response: unknown, maxDepth = 3): { path: string; value: unknown }[] {
    const out: { path: string; value: unknown }[] = [];

    const walk = (node: unknown, path: string, depth: number) => {
        if (depth > maxDepth || node === null || typeof node !== 'object' || Array.isArray(node)) return;
        Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
            const next = path ? `${path}.${key}` : key;
            if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
                if (String(value).length <= 40) out.push({ path: next, value });
            } else {
                walk(value, next, depth + 1);
            }
        });
    };

    walk(response, '', 0);
    return out;
}
