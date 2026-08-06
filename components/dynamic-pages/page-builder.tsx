"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Eye,
    EyeOff,
    LayoutGrid,
    Loader2,
    Play,
    Plus,
    Save,
    Settings2,
    Table2,
    Terminal,
    Trash2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    ColumnType,
    DynamicPageConfig,
    FilterConfig,
    HttpMethod,
    KeyValue,
} from '@/lib/dynamic-pages/types';
import {
    detectColumns,
    detectScalarPaths,
    findArrayCandidates,
    getByPath,
    humanizeKey,
} from '@/lib/dynamic-pages/introspect';
import { initialQueryState, isValidUrl, runRequest } from '@/lib/dynamic-pages/runner';
import { parseCurl } from '@/lib/parse-curl';
import { PageRenderer } from './page-renderer';

const COLUMN_TYPES: ColumnType[] = ['text', 'number', 'date', 'boolean', 'badge', 'link', 'image', 'json'];
const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const inputCls = cn(
    'w-full h-10 px-3 rounded-lg border border-border bg-background/50 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
);
const smallInputCls = cn(
    'h-9 px-2.5 rounded-lg border border-border bg-background/50 text-sm',
    'focus:outline-none focus:border-primary'
);

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

function Section({ step, title, hint, children }: { step: number; title: string; hint?: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-border bg-background/50 p-5">
            <div className="flex items-baseline gap-2.5 mb-1">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 translate-y-0.5">
                    {step}
                </span>
                <h2 className="font-semibold">{title}</h2>
            </div>
            {hint && <p className="text-xs text-foreground/60 ml-[34px] mb-3">{hint}</p>}
            <div className="ml-0 sm:ml-[34px] mt-3">{children}</div>
        </section>
    );
}

function KeyValueEditor({
    pairs,
    onChange,
    keyPlaceholder,
    valuePlaceholder,
}: {
    pairs: KeyValue[];
    onChange: (pairs: KeyValue[]) => void;
    keyPlaceholder: string;
    valuePlaceholder: string;
}) {
    return (
        <div className="space-y-2">
            {pairs.map((pair) => (
                <div key={pair.id} className="flex gap-2 items-center">
                    <input
                        type="checkbox"
                        checked={pair.enabled !== false}
                        onChange={(e) => onChange(pairs.map((p) => (p.id === pair.id ? { ...p, enabled: e.target.checked } : p)))}
                        className="accent-[var(--primary)]"
                    />
                    <input
                        value={pair.key}
                        onChange={(e) => onChange(pairs.map((p) => (p.id === pair.id ? { ...p, key: e.target.value } : p)))}
                        placeholder={keyPlaceholder}
                        className={cn(smallInputCls, 'flex-1')}
                    />
                    <input
                        value={pair.value}
                        onChange={(e) => onChange(pairs.map((p) => (p.id === pair.id ? { ...p, value: e.target.value } : p)))}
                        placeholder={valuePlaceholder}
                        className={cn(smallInputCls, 'flex-1')}
                    />
                    <button
                        onClick={() => onChange(pairs.filter((p) => p.id !== pair.id))}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
            <button
                onClick={() => onChange([...pairs, { id: nextId('kv'), key: '', value: '', enabled: true }])}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
                <Plus className="w-3 h-3" /> Add
            </button>
        </div>
    );
}

// The page builder: configure the endpoint, fetch a sample, map fields, wire up
// controls, preview, save. No code involved anywhere.
export function PageBuilder({ initial, pageId }: { initial: DynamicPageConfig; pageId?: string }) {
    const router = useRouter();
    const [config, setConfig] = useState<DynamicPageConfig>(initial);
    const [sample, setSample] = useState<unknown>(null);
    const [fetching, setFetching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'configure' | 'preview'>('configure');
    const [showCurlImport, setShowCurlImport] = useState(false);
    const [curlText, setCurlText] = useState('');
    const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set());

    const patch = (partial: Partial<DynamicPageConfig>) => setConfig((prev) => ({ ...prev, ...partial }));
    const patchEndpoint = (partial: Partial<DynamicPageConfig['endpoint']>) =>
        setConfig((prev) => ({ ...prev, endpoint: { ...prev.endpoint, ...partial } }));
    const patchControls = (partial: Partial<DynamicPageConfig['controls']>) =>
        setConfig((prev) => ({ ...prev, controls: { ...prev.controls, ...partial } }));

    const candidates = useMemo(() => (sample ? findArrayCandidates(sample) : []), [sample]);
    const scalarPaths = useMemo(() => (sample ? detectScalarPaths(sample) : []), [sample]);

    const applyRowsPath = (data: unknown, path: string) => {
        const rows = getByPath(data, path);
        const detected = detectColumns(Array.isArray(rows) ? rows : []);
        setConfig((prev) => ({ ...prev, rowsPath: path, columns: detected }));
    };

    const importCurl = () => {
        try {
            const parsed = parseCurl(curlText);
            const method = (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(parsed.method)
                ? parsed.method
                : 'GET') as HttpMethod;
            patchEndpoint({
                method,
                url: parsed.url,
                headers: Object.entries(parsed.headers).map(([key, value]) => ({
                    id: nextId('kv'),
                    key,
                    value,
                    enabled: true,
                })),
                queryParams: Object.entries(parsed.queryParams).map(([key, value]) => ({
                    id: nextId('kv'),
                    key,
                    value,
                    enabled: true,
                })),
                body: parsed.body,
            });
            setShowCurlImport(false);
            setCurlText('');
            toast.success('cURL imported — hit Fetch to detect the fields');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not parse that cURL command');
        }
    };

    const fetchSample = async () => {
        if (!isValidUrl(config.endpoint.url)) {
            toast.error('Enter a valid http(s) URL first');
            return;
        }
        setFetching(true);
        try {
            const result = await runRequest(config, initialQueryState(config));
            if (!result.ok) {
                toast.error(result.error || 'Request failed');
                if (result.data === null) return;
            }
            setSample(result.data);
            const found = findArrayCandidates(result.data);
            if (found.length > 0) {
                applyRowsPath(result.data, found[0].path);
                toast.success(`Found ${found[0].length} rows at "${found[0].path || 'response root'}"`);
            } else {
                setConfig((prev) => ({ ...prev, rowsPath: '', columns: detectColumns([result.data]) }));
                toast.info('No array found — treating the response as a single record');
            }
        } finally {
            setFetching(false);
        }
    };

    const moveColumn = (index: number, dir: -1 | 1) => {
        setConfig((prev) => {
            const cols = [...prev.columns];
            const target = index + dir;
            if (target < 0 || target >= cols.length) return prev;
            [cols[index], cols[target]] = [cols[target], cols[index]];
            return { ...prev, columns: cols };
        });
    };

    const patchColumn = (index: number, partial: Partial<DynamicPageConfig['columns'][number]>) =>
        setConfig((prev) => ({
            ...prev,
            columns: prev.columns.map((c, i) => (i === index ? { ...c, ...partial } : c)),
        }));

    const addCustomColumn = () =>
        setConfig((prev) => ({
            ...prev,
            columns: [
                ...prev.columns,
                { key: '', label: '', type: 'text', visible: true, sortable: false },
            ],
        }));

    const addFilter = () =>
        patchControls({
            filters: [
                ...config.controls.filters,
                { id: nextId('filter'), label: '', param: '', type: 'text', options: [] } as FilterConfig,
            ],
        });

    const patchFilter = (id: string, partial: Partial<FilterConfig>) =>
        patchControls({
            filters: config.controls.filters.map((f) => (f.id === id ? { ...f, ...partial } : f)),
        });

    const save = async () => {
        if (!config.name.trim()) {
            toast.error('Give the page a name');
            return;
        }
        if (!isValidUrl(config.endpoint.url)) {
            toast.error('Enter a valid API URL');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/dynamic-pages', {
                method: pageId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pageId ? { ...config, id: pageId } : config),
            });
            const body = await res.json();
            if (!res.ok) {
                toast.error(body.message || 'Failed to save page');
                return;
            }
            toast.success(pageId ? 'Page updated' : 'Page created');
            router.push(`/pages/${body.page._id}`);
        } catch {
            toast.error('Failed to save page');
        } finally {
            setSaving(false);
        }
    };

    const previewReady = config.columns.some((c) => c.visible) || config.layout === 'cards';

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={() => router.push('/pages')}
                    className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4" /> All pages
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={save}
                        disabled={saving}
                        className={cn(
                            'h-10 px-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium',
                            'bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-60'
                        )}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {pageId ? 'Update page' : 'Save page'}
                    </button>
                </div>
            </div>

            {/* Configure / Preview tabs */}
            <div className="flex gap-1 p-1 rounded-xl border border-border bg-background/50 w-fit">
                {(
                    [
                        { value: 'configure', label: 'Configure', icon: Settings2 },
                        { value: 'preview', label: 'Preview', icon: Eye },
                    ] as const
                ).map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        onClick={() => {
                            if (value === 'preview' && !previewReady) {
                                toast.error('Fetch a sample and pick some fields first');
                                return;
                            }
                            setActiveTab(value);
                        }}
                        className={cn(
                            'h-9 px-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all',
                            activeTab === value
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground/60 hover:bg-foreground/5',
                            value === 'preview' && !previewReady && 'opacity-40'
                        )}
                    >
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            <div className={cn('space-y-4', activeTab !== 'configure' && 'hidden')}>
            {/* 1. Basics */}
            <Section step={1} title="Page basics">
                <div className="grid sm:grid-cols-2 gap-3">
                    <input
                        value={config.name}
                        onChange={(e) => patch({ name: e.target.value })}
                        placeholder="Page name, e.g. Orders"
                        className={inputCls}
                    />
                    <input
                        value={config.description || ''}
                        onChange={(e) => patch({ description: e.target.value })}
                        placeholder="Description (optional)"
                        className={inputCls}
                    />
                </div>
            </Section>

            {/* 2. Endpoint */}
            <Section
                step={2}
                title="API endpoint"
                hint="The page calls this API from your browser. Fetch a sample to auto-detect the fields."
            >
                {showCurlImport ? (
                    <div className="mb-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium inline-flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-primary" /> Import from cURL
                            </div>
                            <button
                                onClick={() => setShowCurlImport(false)}
                                className="p-1.5 rounded-lg hover:bg-foreground/10"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <textarea
                            value={curlText}
                            onChange={(e) => setCurlText(e.target.value)}
                            rows={5}
                            autoFocus
                            placeholder={`curl 'https://api.example.com/users?limit=20' \\\n  -H 'Authorization: Bearer ...'`}
                            className={cn(inputCls, 'h-auto py-2 font-mono text-xs')}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => setShowCurlImport(false)}
                                className="h-9 px-3 rounded-lg text-sm text-foreground/60 hover:bg-foreground/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={importCurl}
                                disabled={!curlText.trim()}
                                className={cn(
                                    'h-9 px-4 rounded-lg text-sm font-medium transition-all',
                                    'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                                )}
                            >
                                Import
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCurlImport(true)}
                        className="mb-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                        <Terminal className="w-3.5 h-3.5" /> Import from cURL
                    </button>
                )}
                <div className="flex gap-2">
                    <select
                        value={config.endpoint.method}
                        onChange={(e) => patchEndpoint({ method: e.target.value as HttpMethod })}
                        className={cn(smallInputCls, 'h-10 shrink-0 font-medium')}
                    >
                        {METHODS.map((m) => (
                            <option key={m}>{m}</option>
                        ))}
                    </select>
                    <input
                        value={config.endpoint.url}
                        onChange={(e) => patchEndpoint({ url: e.target.value })}
                        placeholder="https://api.example.com/users"
                        className={inputCls}
                    />
                    <button
                        onClick={fetchSample}
                        disabled={fetching}
                        className={cn(
                            'h-10 px-4 shrink-0 inline-flex items-center gap-2 rounded-lg text-sm font-medium',
                            'bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-60'
                        )}
                    >
                        {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Fetch
                    </button>
                </div>

                <details className="mt-3">
                    <summary className="text-xs text-foreground/60 cursor-pointer">Headers, params, body & CORS</summary>
                    <div className="mt-3 space-y-4">
                        <div>
                            <div className="text-xs font-medium mb-1.5">Headers</div>
                            <KeyValueEditor
                                pairs={config.endpoint.headers}
                                onChange={(headers) => patchEndpoint({ headers })}
                                keyPlaceholder="Authorization"
                                valuePlaceholder="Bearer ..."
                            />
                        </div>
                        <div>
                            <div className="text-xs font-medium mb-1.5">Fixed query params (always sent)</div>
                            <KeyValueEditor
                                pairs={config.endpoint.queryParams}
                                onChange={(queryParams) => patchEndpoint({ queryParams })}
                                keyPlaceholder="apiKey"
                                valuePlaceholder="value"
                            />
                        </div>
                        {config.endpoint.method !== 'GET' && (
                            <div>
                                <div className="text-xs font-medium mb-1.5">Request body (JSON)</div>
                                <textarea
                                    value={config.endpoint.body}
                                    onChange={(e) => patchEndpoint({ body: e.target.value })}
                                    rows={4}
                                    placeholder='{"query": "..."}'
                                    className={cn(inputCls, 'h-auto py-2 font-mono text-xs')}
                                />
                            </div>
                        )}
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={config.endpoint.useProxy}
                                onChange={(e) => patchEndpoint({ useProxy: e.target.checked })}
                                className="accent-[var(--primary)]"
                            />
                            Send via server (use when the API blocks browser requests / CORS)
                        </label>
                    </div>
                </details>
            </Section>

            {/* 3. Rows + columns */}
            <Section
                step={3}
                title="Fields to show"
                hint={sample ? 'Toggle, rename and reorder the fields for your page.' : 'Fetch a sample above to detect fields.'}
            >
                {candidates.length > 1 && (
                    <div className="mb-3">
                        <div className="text-xs font-medium mb-1.5">Rows found at</div>
                        <select
                            value={config.rowsPath}
                            onChange={(e) => applyRowsPath(sample, e.target.value)}
                            className={cn(smallInputCls, 'w-full h-10')}
                        >
                            {candidates.map((c) => (
                                <option key={c.path} value={c.path}>
                                    {c.path || '(response root)'} — {c.length} rows
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {config.columns.length === 0 ? (
                    <div className="text-sm text-foreground/50 py-2">No fields yet.</div>
                ) : (
                    <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1 -mr-1">
                        {config.columns.map((col, index) => {
                            const templateOpen =
                                expandedTemplates.has(index) || !!col.template || col.type === 'image' || col.type === 'link';
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        'p-2 rounded-xl border transition-colors',
                                        col.visible ? 'border-border bg-background/50' : 'border-border/40 opacity-50'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => patchColumn(index, { visible: !col.visible })}
                                            className="p-1.5 rounded-lg hover:bg-foreground/10 shrink-0"
                                            title={col.visible ? 'Hide' : 'Show'}
                                        >
                                            {col.visible ? (
                                                <Eye className="w-4 h-4 text-primary" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-foreground/60" />
                                            )}
                                        </button>
                                        <input
                                            value={col.key}
                                            onChange={(e) => patchColumn(index, { key: e.target.value })}
                                            placeholder="key.path"
                                            title="Dot path into the row — e.g. user.address.city, or images.0 for an array element"
                                            className={cn(smallInputCls, 'w-36 shrink-0 font-mono text-xs')}
                                        />
                                        <input
                                            value={col.label}
                                            onChange={(e) => patchColumn(index, { label: e.target.value })}
                                            placeholder="Label"
                                            className={cn(smallInputCls, 'flex-1 min-w-0')}
                                        />
                                        <select
                                            value={col.type}
                                            onChange={(e) => patchColumn(index, { type: e.target.value as ColumnType })}
                                            className={cn(smallInputCls, 'shrink-0')}
                                        >
                                            {COLUMN_TYPES.map((t) => (
                                                <option key={t}>{t}</option>
                                            ))}
                                        </select>
                                        {config.controls.sortEnabled && (
                                            <label
                                                className="flex items-center gap-1 text-xs text-foreground/60 shrink-0"
                                                title="Allow sorting by this column"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={col.sortable === true}
                                                    onChange={(e) => patchColumn(index, { sortable: e.target.checked })}
                                                    className="accent-[var(--primary)]"
                                                />
                                                sort
                                            </label>
                                        )}
                                        <button
                                            onClick={() =>
                                                setExpandedTemplates((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(index)) next.delete(index);
                                                    else next.add(index);
                                                    return next;
                                                })
                                            }
                                            className={cn(
                                                'p-1.5 rounded-lg hover:bg-foreground/10 shrink-0 text-xs font-mono',
                                                templateOpen ? 'text-primary' : 'text-foreground/60'
                                            )}
                                            title="Value template — wrap the API value with your own text"
                                        >
                                            {'{}'}
                                        </button>
                                        <div className="flex flex-col shrink-0">
                                            <button
                                                onClick={() => moveColumn(index, -1)}
                                                disabled={index === 0}
                                                className="p-0.5 rounded hover:bg-foreground/10 disabled:opacity-30"
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => moveColumn(index, 1)}
                                                disabled={index === config.columns.length - 1}
                                                className="p-0.5 rounded hover:bg-foreground/10 disabled:opacity-30"
                                            >
                                                <ArrowDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setConfig((prev) => ({
                                                    ...prev,
                                                    columns: prev.columns.filter((_, i) => i !== index),
                                                }))
                                            }
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 shrink-0"
                                            title="Remove field"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {templateOpen && (
                                        <div className="mt-2 ml-8">
                                            <input
                                                value={col.template || ''}
                                                onChange={(e) => patchColumn(index, { template: e.target.value })}
                                                placeholder="Value template, e.g. https://my-bucket.s3.amazonaws.com/{{value}}"
                                                className={cn(smallInputCls, 'w-full font-mono text-xs')}
                                            />
                                            <p className="text-[11px] text-foreground/50 mt-1">
                                                <code className="text-primary">{'{{value}}'}</code> is replaced with the API
                                                value — use it to turn IDs or S3 keys into full URLs, add units, etc. For
                                                arrays it applies to every element.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {config.columns.length > 0 && (
                    <button
                        onClick={addCustomColumn}
                        className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add field manually
                    </button>
                )}
            </Section>

            {/* 4. Layout */}
            <Section step={4} title="Layout">
                <div className="flex gap-2">
                    {(
                        [
                            { value: 'table', label: 'Table', icon: Table2 },
                            { value: 'cards', label: 'Cards', icon: LayoutGrid },
                        ] as const
                    ).map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => patch({ layout: value })}
                            className={cn(
                                'flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all',
                                config.layout === value
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-background/50 hover:bg-foreground/5'
                            )}
                        >
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>

                {config.layout === 'cards' && (
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                        {(
                            [
                                { key: 'titleKey', label: 'Title field' },
                                { key: 'subtitleKey', label: 'Subtitle field' },
                                { key: 'imageKey', label: 'Image field' },
                                { key: 'badgeKey', label: 'Badge field' },
                            ] as const
                        ).map(({ key, label }) => (
                            <div key={key}>
                                <div className="text-xs font-medium mb-1.5">{label}</div>
                                <select
                                    value={config.card[key] || ''}
                                    onChange={(e) =>
                                        patch({ card: { ...config.card, [key]: e.target.value || undefined } })
                                    }
                                    className={cn(smallInputCls, 'w-full h-10')}
                                >
                                    <option value="">None</option>
                                    {config.columns.map((c) => (
                                        <option key={c.key} value={c.key}>
                                            {c.label} ({c.key})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        <div className="sm:col-span-2">
                            <div className="text-xs font-medium mb-1.5">Extra fields on the card</div>
                            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                                {config.columns.map((c) => {
                                    const active = config.card.fieldKeys.includes(c.key);
                                    return (
                                        <button
                                            key={c.key}
                                            onClick={() =>
                                                patch({
                                                    card: {
                                                        ...config.card,
                                                        fieldKeys: active
                                                            ? config.card.fieldKeys.filter((k) => k !== c.key)
                                                            : [...config.card.fieldKeys, c.key],
                                                    },
                                                })
                                            }
                                            className={cn(
                                                'px-2.5 py-1 rounded-lg text-xs border transition-all',
                                                active
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border bg-background/50 hover:bg-foreground/5'
                                            )}
                                        >
                                            {c.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </Section>

            {/* 5. Controls */}
            <Section
                step={5}
                title="Search, sort, filters & paging"
                hint="These send query params to your API — configure the param names your API expects."
            >
                <div className="space-y-4">
                    {/* Search */}
                    <div className="p-3 rounded-xl border border-border/60">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={config.controls.searchEnabled}
                                onChange={(e) => patchControls({ searchEnabled: e.target.checked })}
                                className="accent-[var(--primary)]"
                            />
                            Search box
                        </label>
                        {config.controls.searchEnabled && (
                            <div className="mt-2.5 space-y-2">
                                <div className="grid sm:grid-cols-2 gap-2">
                                    <select
                                        value={config.controls.searchMode || 'param'}
                                        onChange={(e) =>
                                            patchControls({
                                                searchMode: e.target.value as 'param' | 'body' | 'template' | 'client',
                                            })
                                        }
                                        className={smallInputCls}
                                    >
                                        <option value="client">Filter loaded rows in browser</option>
                                        <option value="param">Send as query param</option>
                                        <option value="body">Send in JSON body</option>
                                        <option value="template">Replace {'{{search}}'} token</option>
                                    </select>
                                    <input
                                        value={config.controls.searchPlaceholder || ''}
                                        onChange={(e) => patchControls({ searchPlaceholder: e.target.value })}
                                        placeholder="placeholder text"
                                        className={smallInputCls}
                                    />
                                </div>

                                {(config.controls.searchMode || 'param') === 'param' && (
                                    <input
                                        value={config.controls.searchParam}
                                        onChange={(e) => patchControls({ searchParam: e.target.value })}
                                        placeholder="query param, e.g. q"
                                        className={cn(smallInputCls, 'w-full')}
                                    />
                                )}
                                {config.controls.searchMode === 'body' && (
                                    <>
                                        <input
                                            value={config.controls.searchBodyPath || ''}
                                            onChange={(e) => patchControls({ searchBodyPath: e.target.value })}
                                            placeholder="body field path, e.g. filters.query"
                                            className={cn(smallInputCls, 'w-full')}
                                        />
                                        <p className="text-xs text-foreground/50">
                                            The search text is written into the JSON request body at this path
                                            (needs a non-GET method).
                                        </p>
                                    </>
                                )}
                                {config.controls.searchMode === 'client' && (
                                    <p className="text-xs text-foreground/50">
                                        Nothing is sent to the API — the rows already on screen are filtered as you
                                        type. Works with any API, but only searches the current page of results.
                                    </p>
                                )}
                                {config.controls.searchMode === 'template' && (
                                    <p className="text-xs text-foreground/50">
                                        Put <code className="text-primary">{'{{search}}'}</code> anywhere in the URL or
                                        request body and it will be replaced with the search text — e.g.{' '}
                                        <code>https://api.example.com/search/{'{{search}}'}</code>.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sort */}
                    <div className="p-3 rounded-xl border border-border/60">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={config.controls.sortEnabled}
                                onChange={(e) => patchControls({ sortEnabled: e.target.checked })}
                                className="accent-[var(--primary)]"
                            />
                            Sorting (click column headers)
                        </label>
                        {config.controls.sortEnabled && (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
                                    <input
                                        value={config.controls.sortParam}
                                        onChange={(e) => patchControls({ sortParam: e.target.value })}
                                        placeholder="sort param (sortBy)"
                                        className={smallInputCls}
                                    />
                                    <input
                                        value={config.controls.sortOrderParam}
                                        onChange={(e) => patchControls({ sortOrderParam: e.target.value })}
                                        placeholder="order param (order)"
                                        className={smallInputCls}
                                    />
                                    <input
                                        value={config.controls.ascValue}
                                        onChange={(e) => patchControls({ ascValue: e.target.value })}
                                        placeholder="asc value"
                                        className={smallInputCls}
                                    />
                                    <input
                                        value={config.controls.descValue}
                                        onChange={(e) => patchControls({ descValue: e.target.value })}
                                        placeholder="desc value"
                                        className={smallInputCls}
                                    />
                                </div>
                                <p className="text-xs text-foreground/50 mt-2">
                                    Tick “sort” on the fields above to make their headers clickable.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="p-3 rounded-xl border border-border/60">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={config.controls.paginationEnabled}
                                onChange={(e) => patchControls({ paginationEnabled: e.target.checked })}
                                className="accent-[var(--primary)]"
                            />
                            Pagination
                        </label>
                        {config.controls.paginationEnabled && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2.5">
                                <input
                                    value={config.controls.pageParam}
                                    onChange={(e) => patchControls({ pageParam: e.target.value })}
                                    placeholder="page param (page)"
                                    className={smallInputCls}
                                />
                                <input
                                    value={config.controls.pageSizeParam}
                                    onChange={(e) => patchControls({ pageSizeParam: e.target.value })}
                                    placeholder="size param (limit)"
                                    className={smallInputCls}
                                />
                                <input
                                    type="number"
                                    value={config.controls.pageSize}
                                    onChange={(e) => patchControls({ pageSize: Number(e.target.value) || 20 })}
                                    placeholder="page size"
                                    className={smallInputCls}
                                />
                                <input
                                    type="number"
                                    value={config.controls.startPage}
                                    onChange={(e) => patchControls({ startPage: Number(e.target.value) })}
                                    placeholder="first page number (1 or 0)"
                                    className={smallInputCls}
                                />
                                <select
                                    value={config.controls.totalPath || ''}
                                    onChange={(e) => patchControls({ totalPath: e.target.value })}
                                    className={cn(smallInputCls, 'col-span-2')}
                                >
                                    <option value="">Total count field (optional)</option>
                                    {scalarPaths
                                        .filter((s) => typeof s.value === 'number')
                                        .map((s) => (
                                            <option key={s.path} value={s.path}>
                                                {s.path} = {String(s.value)}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="p-3 rounded-xl border border-border/60">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Filters</span>
                            <button onClick={addFilter} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add filter
                            </button>
                        </div>
                        {config.controls.filters.length > 0 && (
                            <div className="space-y-2 mt-2.5">
                                {config.controls.filters.map((filter) => (
                                    <div key={filter.id} className="flex flex-wrap gap-2 items-center">
                                        <input
                                            value={filter.label}
                                            onChange={(e) => patchFilter(filter.id, { label: e.target.value })}
                                            placeholder="Label (Status)"
                                            className={cn(smallInputCls, 'flex-1 min-w-24')}
                                        />
                                        <input
                                            value={filter.param}
                                            onChange={(e) => patchFilter(filter.id, { param: e.target.value })}
                                            placeholder="param (status)"
                                            className={cn(smallInputCls, 'flex-1 min-w-24')}
                                        />
                                        <select
                                            value={filter.type}
                                            onChange={(e) =>
                                                patchFilter(filter.id, { type: e.target.value as FilterConfig['type'] })
                                            }
                                            className={smallInputCls}
                                        >
                                            <option value="text">text</option>
                                            <option value="select">select</option>
                                            <option value="date">date</option>
                                            <option value="boolean">boolean</option>
                                        </select>
                                        {filter.type === 'select' && (
                                            <input
                                                value={filter.options.map((o) => o.value).join(', ')}
                                                onChange={(e) =>
                                                    patchFilter(filter.id, {
                                                        options: e.target.value
                                                            .split(',')
                                                            .map((s) => s.trim())
                                                            .filter(Boolean)
                                                            .map((v) => ({ label: humanizeKey(v), value: v })),
                                                    })
                                                }
                                                placeholder="options: active, banned"
                                                className={cn(smallInputCls, 'flex-1 min-w-32')}
                                            />
                                        )}
                                        <button
                                            onClick={() =>
                                                patchControls({
                                                    filters: config.controls.filters.filter((f) => f.id !== filter.id),
                                                })
                                            }
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    {scalarPaths.length > 0 && (
                        <div className="p-3 rounded-xl border border-border/60">
                            <div className="text-sm font-medium mb-1">Stat tiles</div>
                            <p className="text-xs text-foreground/50 mb-2">
                                Show top-level values from the response (totals, counts) above the list.
                            </p>
                            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                                {scalarPaths.slice(0, 12).map((s) => {
                                    const active = config.stats.some((st) => st.path === s.path);
                                    return (
                                        <button
                                            key={s.path}
                                            onClick={() =>
                                                patch({
                                                    stats: active
                                                        ? config.stats.filter((st) => st.path !== s.path)
                                                        : [
                                                              ...config.stats,
                                                              { id: nextId('stat'), label: humanizeKey(s.path), path: s.path },
                                                          ],
                                                })
                                            }
                                            className={cn(
                                                'px-2.5 py-1 rounded-lg text-xs border transition-all',
                                                active
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border bg-background/50 hover:bg-foreground/5'
                                            )}
                                            title={`${s.path} = ${String(s.value)}`}
                                        >
                                            {s.path}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </Section>
            </div>

            {/* Live preview */}
            {activeTab === 'preview' && previewReady && (
                <section className="rounded-2xl border border-primary/30 bg-background/50 p-5">
                    <h2 className="font-semibold mb-4">Live preview</h2>
                    <PageRenderer config={config} />
                </section>
            )}
        </div>
    );
}
