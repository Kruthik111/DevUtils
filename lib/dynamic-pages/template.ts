// Card slots are configured by typing an expression rather than picking a
// column, e.g. "{{dealId}}" or "https://upg.storeking.in/asset/v1/{{images[0]}}".

import { getByPath } from './introspect';

const TOKEN = /\{\{\s*([^}]+?)\s*\}\}/g;
const SINGLE_TOKEN = /^\{\{\s*([^}]+?)\s*\}\}$/;

/** `images[0].url` → `images.0.url`, the form getByPath understands. */
export function normalizePath(path: string): string {
    return path.replace(/\[(\d+)\]/g, '.$1').replace(/^\.+/, '');
}

export function hasTokens(expr?: string): boolean {
    return !!expr && /\{\{\s*[^}]+?\s*\}\}/.test(expr);
}

/**
 * Resolve a card expression against one row.
 *
 * - `""`                     → undefined (slot unused)
 * - `dealId`                 → value at that path (a bare path still works, so
 *                              configs saved before templates keep rendering)
 * - `{{images[0]}}`          → the *raw* value, so images/numbers/booleans keep
 *                              their type for CellValue to format
 * - `.../v1/{{images[0]}}`   → an interpolated string
 */
export function resolveExpression(row: unknown, expr?: string): unknown {
    if (!expr || !expr.trim()) return undefined;
    const trimmed = expr.trim();

    if (!trimmed.includes('{{')) return getByPath(row, normalizePath(trimmed));

    const single = trimmed.match(SINGLE_TOKEN);
    if (single) return getByPath(row, normalizePath(single[1]));

    return trimmed.replace(TOKEN, (_match, path: string) => {
        const value = getByPath(row, normalizePath(path));
        if (value === null || value === undefined) return '';
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    });
}
