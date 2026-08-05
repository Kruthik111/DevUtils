"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Code2,
    Inbox,
    RefreshCw,
    Search,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicPageConfig } from '@/lib/dynamic-pages/types';
import { getByPath } from '@/lib/dynamic-pages/introspect';
import { QueryState, RunResult, initialQueryState, runRequest } from '@/lib/dynamic-pages/runner';
import { CellValue, resolveTemplate } from './cell-value';

// Renders a configured page: controls on top, then the API's rows as a table or
// card grid. Search/sort/paging are sent to the API as query params, so the
// behaviour is whatever the user's own endpoint supports.
export function PageRenderer({ config, compact = false }: { config: DynamicPageConfig; compact?: boolean }) {
    const [state, setState] = useState<QueryState>(() => initialQueryState(config));
    const [result, setResult] = useState<RunResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const { controls, columns, card, stats, layout } = config;
    const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);

    const execute = useCallback(
        async (next: QueryState) => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);
            try {
                const res = await runRequest(config, next, controller.signal);
                setResult(res);
            } catch {
                // superseded by a newer request
                return;
            } finally {
                if (abortRef.current === controller) setLoading(false);
            }
        },
        [config]
    );

    // Refetch whenever the control state changes (including the first render).
    useEffect(() => {
        execute(state);
    }, [execute, state]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const searchMode = controls.searchMode || 'param';

    // Debounce typing so we don't hammer the endpoint on every keystroke.
    // Client mode never refetches — the loaded rows are filtered directly below.
    useEffect(() => {
        if (!controls.searchEnabled || searchMode === 'client') return;
        if (searchInput === state.search) return;
        const timer = setTimeout(() => {
            setState((prev) => ({ ...prev, search: searchInput, page: controls.startPage }));
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput, state.search, controls.searchEnabled, searchMode, controls.startPage]);

    const rows = useMemo(() => {
        if (!result?.ok) return [];
        const found = getByPath(result.data, config.rowsPath);
        let list: Record<string, unknown>[] = [];
        if (Array.isArray(found)) list = found as Record<string, unknown>[];
        // A single object still renders as one row — better than an empty state.
        else if (found && typeof found === 'object') list = [found as Record<string, unknown>];

        // Client-side search: match against the visible columns' values.
        const needle = searchInput.trim().toLowerCase();
        if (controls.searchEnabled && searchMode === 'client' && needle) {
            const keys = columns.filter((c) => c.visible).map((c) => c.key);
            list = list.filter((row) =>
                keys.some((key) => {
                    const value = getByPath(row, key);
                    if (value === null || value === undefined) return false;
                    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    return text.toLowerCase().includes(needle);
                })
            );
        }
        return list;
    }, [result, config.rowsPath, controls.searchEnabled, searchMode, searchInput, columns]);

    const total = useMemo(() => {
        if (!controls.totalPath || !result?.ok) return null;
        const value = getByPath(result.data, controls.totalPath);
        return typeof value === 'number' ? value : null;
    }, [result, controls.totalPath]);

    const totalPages = total !== null && controls.pageSize > 0 ? Math.ceil(total / controls.pageSize) : null;
    const pageIndex = state.page - controls.startPage; // 0-based, for display math
    const isLastPage =
        totalPages !== null ? pageIndex >= totalPages - 1 : rows.length < controls.pageSize;

    const toggleSort = (sortKey: string) => {
        if (!controls.sortEnabled) return;
        setState((prev) => ({
            ...prev,
            sortBy: sortKey,
            sortDir: prev.sortBy === sortKey && prev.sortDir === 'asc' ? 'desc' : 'asc',
            page: controls.startPage,
        }));
    };

    const setFilter = (param: string, value: string) => {
        setState((prev) => ({
            ...prev,
            filters: { ...prev.filters, [param]: value },
            page: controls.startPage,
        }));
    };

    const activeFilterCount = Object.values(state.filters).filter((v) => v !== '').length;

    const clearAll = () => {
        setSearchInput('');
        setState((prev) => ({ ...prev, search: '', filters: {}, page: controls.startPage }));
    };

    return (
        <div className="space-y-4">
            {/* Stat tiles */}
            {stats.length > 0 && result?.ok && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.map((stat) => {
                        const value = getByPath(result.data, stat.path);
                        return (
                            <div key={stat.id} className="p-4 rounded-2xl border border-border bg-background/50">
                                <div className="text-xs text-foreground/60">{stat.label}</div>
                                <div className="text-2xl font-semibold mt-1 tabular-nums">
                                    {value === null || value === undefined ? '—' : String(value)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Controls */}
            {(controls.searchEnabled || controls.filters.length > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                    {controls.searchEnabled && (
                        <div className="relative flex-1 min-w-52">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={controls.searchPlaceholder || 'Search...'}
                                className={cn(
                                    'w-full h-10 pl-9 pr-9 rounded-lg border border-border bg-background/50 text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
                                )}
                            />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-foreground/10"
                                >
                                    <X className="w-3.5 h-3.5 text-foreground/50" />
                                </button>
                            )}
                        </div>
                    )}

                    {controls.filters.map((filter) => (
                        <div key={filter.id} className="flex items-center gap-1.5">
                            {filter.type === 'select' ? (
                                <select
                                    value={state.filters[filter.param] ?? ''}
                                    onChange={(e) => setFilter(filter.param, e.target.value)}
                                    className={cn(
                                        'h-10 px-3 rounded-lg border border-border bg-background/50 text-sm',
                                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                                    )}
                                >
                                    <option value="">{filter.label}: All</option>
                                    {filter.options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : filter.type === 'boolean' ? (
                                <select
                                    value={state.filters[filter.param] ?? ''}
                                    onChange={(e) => setFilter(filter.param, e.target.value)}
                                    className={cn(
                                        'h-10 px-3 rounded-lg border border-border bg-background/50 text-sm',
                                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                                    )}
                                >
                                    <option value="">{filter.label}: Any</option>
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                            ) : (
                                <input
                                    type={filter.type === 'date' ? 'date' : 'text'}
                                    value={state.filters[filter.param] ?? ''}
                                    onChange={(e) => setFilter(filter.param, e.target.value)}
                                    placeholder={filter.label}
                                    className={cn(
                                        'h-10 px-3 rounded-lg border border-border bg-background/50 text-sm',
                                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                                    )}
                                />
                            )}
                        </div>
                    ))}

                    {(searchInput || state.search || activeFilterCount > 0) && (
                        <button
                            onClick={clearAll}
                            className="h-10 px-3 rounded-lg text-sm text-foreground/60 hover:bg-foreground/10 transition-all"
                        >
                            Clear
                        </button>
                    )}

                    <button
                        onClick={() => execute(state)}
                        disabled={loading}
                        className="h-10 w-10 flex items-center justify-center rounded-lg border border-border bg-background/50 hover:bg-foreground/10 transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={cn('w-4 h-4 text-foreground/70', loading && 'animate-spin')} />
                    </button>
                </div>
            )}

            {/* Error */}
            {result && !result.ok && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <div className="font-medium text-sm">
                            {result.status ? `Request failed (${result.status})` : 'Could not reach the API'}
                        </div>
                        <div className="text-sm text-foreground/60 mt-0.5 break-words">{result.error}</div>
                    </div>
                </div>
            )}

            {/* Empty */}
            {result?.ok && rows.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Inbox className="w-10 h-10 text-foreground/20 mb-3" />
                    <div className="font-medium">No records</div>
                    <div className="text-sm text-foreground/60 mt-1">
                        {searchInput || state.search || activeFilterCount > 0
                            ? 'Nothing matched the current search or filters.'
                            : `The API responded successfully but no rows were found at "${config.rowsPath || 'the response root'}".`}
                    </div>
                </div>
            )}

            {/* Loading skeleton on first load */}
            {loading && !result && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-foreground/5 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Table */}
            {rows.length > 0 && layout === 'table' && (
                <div className={cn('rounded-2xl border border-border overflow-hidden', loading && 'opacity-60')}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-foreground/5">
                                    {visibleColumns.map((col) => {
                                        const sortKey = col.sortKey || col.key;
                                        const active = state.sortBy === sortKey;
                                        const sortable = controls.sortEnabled && col.sortable !== false;
                                        return (
                                            <th
                                                key={col.key}
                                                onClick={() => sortable && toggleSort(sortKey)}
                                                className={cn(
                                                    'text-left font-medium text-foreground/70 px-4 py-3 whitespace-nowrap',
                                                    sortable && 'cursor-pointer select-none hover:text-foreground'
                                                )}
                                            >
                                                <span className="inline-flex items-center gap-1.5">
                                                    {col.label}
                                                    {sortable &&
                                                        (active ? (
                                                            state.sortDir === 'asc' ? (
                                                                <ArrowUp className="w-3.5 h-3.5 text-primary" />
                                                            ) : (
                                                                <ArrowDown className="w-3.5 h-3.5 text-primary" />
                                                            )
                                                        ) : (
                                                            <ArrowUpDown className="w-3.5 h-3.5 text-foreground/25" />
                                                        ))}
                                                </span>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr
                                        key={index}
                                        onClick={() => setDetailRow(row)}
                                        className="border-t border-border/50 hover:bg-foreground/5 cursor-pointer transition-colors"
                                    >
                                        {visibleColumns.map((col) => (
                                            <td key={col.key} className="px-4 py-3 align-middle">
                                                <CellValue value={getByPath(row, col.key)} type={col.type} template={col.template} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cards */}
            {rows.length > 0 && layout === 'cards' && (
                <div
                    className={cn(
                        'grid gap-3',
                        compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                        loading && 'opacity-60'
                    )}
                >
                    {rows.map((row, index) => {
                        const title = card.titleKey ? getByPath(row, card.titleKey) : null;
                        const subtitle = card.subtitleKey ? getByPath(row, card.subtitleKey) : null;
                        const badge = card.badgeKey ? getByPath(row, card.badgeKey) : null;
                        // Route the card image through the matching column's template
                        // (S3 keys → full URLs); arrays fall back to their first entry.
                        const imageCol = card.imageKey ? columns.find((c) => c.key === card.imageKey) : undefined;
                        const imageRaw = card.imageKey
                            ? resolveTemplate(getByPath(row, card.imageKey), imageCol?.template)
                            : null;
                        const image = Array.isArray(imageRaw) ? imageRaw[0] : imageRaw;
                        return (
                            <button
                                key={index}
                                onClick={() => setDetailRow(row)}
                                className="text-left p-4 rounded-2xl border border-border bg-background/50 hover:bg-foreground/5 hover:border-primary/40 transition-all"
                            >
                                <div className="flex items-start gap-3">
                                    {image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={String(image)}
                                            alt=""
                                            loading="lazy"
                                            className="w-11 h-11 rounded-xl object-cover border border-border shrink-0"
                                        />
                                    ) : null}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-medium truncate">
                                                {title !== null && title !== undefined ? String(title) : `Record ${index + 1}`}
                                            </div>
                                            {badge !== null && badge !== undefined && badge !== '' && (
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                                                    {String(badge)}
                                                </span>
                                            )}
                                        </div>
                                        {subtitle !== null && subtitle !== undefined && (
                                            <div className="text-sm text-foreground/60 truncate mt-0.5">{String(subtitle)}</div>
                                        )}
                                    </div>
                                </div>

                                {card.fieldKeys.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                                        {card.fieldKeys.map((key) => {
                                            const col = columns.find((c) => c.key === key);
                                            return (
                                                <div key={key} className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="text-foreground/50 shrink-0">{col?.label || key}</span>
                                                    <CellValue
                                                        value={getByPath(row, key)}
                                                        type={col?.type || 'text'}
                                                        template={col?.template}
                                                        className="text-right"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {controls.paginationEnabled && rows.length > 0 && (
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-foreground/60">
                        {total !== null ? (
                            <>
                                Page {pageIndex + 1}
                                {totalPages !== null && ` of ${totalPages}`} · {total.toLocaleString()} total
                            </>
                        ) : (
                            <>
                                Page {pageIndex + 1} · showing {rows.length}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setState((prev) => ({ ...prev, page: prev.page - 1 }))}
                            disabled={state.page <= controls.startPage || loading}
                            className="h-9 px-3 inline-flex items-center gap-1 rounded-lg border border-border bg-background/50 text-sm hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <button
                            onClick={() => setState((prev) => ({ ...prev, page: prev.page + 1 }))}
                            disabled={isLastPage || loading}
                            className="h-9 px-3 inline-flex items-center gap-1 rounded-lg border border-border bg-background/50 text-sm hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Row detail */}
            {detailRow && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex justify-end"
                    onClick={() => setDetailRow(null)}
                >
                    <div
                        className="w-full max-w-lg h-full bg-background border-l border-border overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between">
                            <h3 className="font-semibold">Record details</h3>
                            <button onClick={() => setDetailRow(null)} className="p-2 rounded-lg hover:bg-foreground/10">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            {columns.map((col) => (
                                <div key={col.key} className="grid grid-cols-3 gap-3 items-start">
                                    <div className="text-sm text-foreground/50 break-words">{col.label}</div>
                                    <div className="col-span-2 text-sm break-words">
                                        <CellValue value={getByPath(detailRow, col.key)} type={col.type} template={col.template} />
                                    </div>
                                </div>
                            ))}
                            <details className="pt-3 border-t border-border/50">
                                <summary className="text-sm text-foreground/60 cursor-pointer inline-flex items-center gap-1.5">
                                    <Code2 className="w-3.5 h-3.5" /> Raw JSON
                                </summary>
                                <pre className="mt-2 p-3 rounded-xl bg-foreground/5 text-xs overflow-x-auto">
                                    {JSON.stringify(detailRow, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>
                </div>
            )}

            {result && (
                <div className="text-xs text-foreground/40 space-y-0.5">
                    <div>
                        {rows.length} record{rows.length === 1 ? '' : 's'} · {result.durationMs}ms
                        {result.status ? ` · HTTP ${result.status}` : ''}
                        {controls.searchEnabled && searchMode === 'client' && searchInput.trim() && ' · filtered in browser'}
                    </div>
                    {result.requestedUrl && (
                        <div className="font-mono truncate" title={result.requestedUrl}>
                            {result.requestedUrl}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
