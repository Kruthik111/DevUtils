"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, LayoutGrid, Pencil, Plus, Table2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DynamicPageConfig, MAX_PAGES_PER_USER } from '@/lib/dynamic-pages/types';
import { ConfirmDialog } from '@/components/notes/confirm-dialog';

// Landing for configured pages: list what you have, open one, or build a new
// one (up to MAX_PAGES_PER_USER).
export default function DynamicPagesListPage() {
    const router = useRouter();
    const [pages, setPages] = useState<DynamicPageConfig[] | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/dynamic-pages');
            if (!res.ok) {
                setPages([]);
                return;
            }
            const body = await res.json();
            setPages(body.pages || []);
        } catch {
            setPages([]);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const remove = async (id: string) => {
        try {
            const res = await fetch(`/api/dynamic-pages?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                toast.error('Failed to delete page');
                return;
            }
            toast.success('Page deleted');
            await load();
        } catch {
            toast.error('Failed to delete page');
        } finally {
            setDeleteId(null);
        }
    };

    const atLimit = (pages?.length ?? 0) >= MAX_PAGES_PER_USER;

    return (
        <div className="p-2 md:p-4 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between gap-3 mb-1">
                    <h1 className="text-2xl font-semibold">API Pages</h1>
                    <button
                        onClick={() => {
                            if (atLimit) {
                                toast.error(`Limit reached — you can keep ${MAX_PAGES_PER_USER} pages. Delete one first.`);
                                return;
                            }
                            router.push('/pages/new');
                        }}
                        className={cn(
                            'h-10 px-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all',
                            atLimit
                                ? 'bg-foreground/10 text-foreground/40 cursor-not-allowed'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        )}
                    >
                        <Plus className="w-4 h-4" /> New page
                    </button>
                </div>
                <p className="text-sm text-foreground/60 mb-6">
                    Build a live page from any API — pick the fields, wire up search, filters and paging. No code.
                    {pages !== null && ` ${pages.length}/${MAX_PAGES_PER_USER} used.`}
                </p>

                {pages === null ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl bg-foreground/5 animate-pulse" />
                        ))}
                    </div>
                ) : pages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
                        <Globe className="w-10 h-10 text-foreground/20 mb-3" />
                        <div className="font-medium">No pages yet</div>
                        <div className="text-sm text-foreground/60 mt-1 max-w-sm">
                            Point a page at any JSON API, choose which fields to show, and save it for later.
                        </div>
                        <Link
                            href="/pages/new"
                            className="mt-4 h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Build your first page
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pages.map((page) => (
                            <div
                                key={page._id}
                                onClick={() => router.push(`/pages/${page._id}`)}
                                className="p-4 rounded-2xl border border-border bg-background/50 hover:border-primary/40 hover:bg-foreground/5 transition-all cursor-pointer flex items-center gap-4"
                            >
                                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    {page.layout === 'cards' ? (
                                        <LayoutGrid className="w-5 h-5 text-primary" />
                                    ) : (
                                        <Table2 className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{page.name}</div>
                                    <div className="text-sm text-foreground/60 truncate">
                                        {page.description || `${page.endpoint.method} ${page.endpoint.url}`}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/pages/${page._id}/edit`);
                                        }}
                                        className="p-2.5 rounded-lg hover:bg-foreground/10 transition-all"
                                        title="Edit configuration"
                                    >
                                        <Pencil className="w-4 h-4 text-foreground/60" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteId(page._id!);
                                        }}
                                        className="p-2.5 rounded-lg hover:bg-red-500/10 transition-all"
                                        title="Delete page"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <ConfirmDialog
                    isOpen={!!deleteId}
                    title="Delete Page"
                    message="Delete this configured page? The API it points to is not affected."
                    onConfirm={() => deleteId && remove(deleteId)}
                    onCancel={() => setDeleteId(null)}
                    showCancel={true}
                    confirmText="Delete"
                    destructive={true}
                />
            </div>
        </div>
    );
}
