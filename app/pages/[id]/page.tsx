"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { DynamicPageConfig, DEFAULT_CONTROLS } from '@/lib/dynamic-pages/types';
import { PageRenderer } from '@/components/dynamic-pages/page-renderer';

// Viewer for one saved page — the whole UI comes from the stored config.
export default function ViewDynamicPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [config, setConfig] = useState<DynamicPageConfig | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/dynamic-pages?id=${id}`);
                if (!res.ok) {
                    setNotFound(true);
                    return;
                }
                const { page } = await res.json();
                // Backfill defaults so configs saved by older builds still render.
                setConfig({
                    ...page,
                    card: page.card || { fieldKeys: [] },
                    stats: page.stats || [],
                    controls: { ...DEFAULT_CONTROLS, filters: [], ...page.controls },
                });
            } catch {
                setNotFound(true);
            }
        })();
    }, [id]);

    if (notFound) {
        return (
            <div className="p-8 text-center">
                <div className="font-medium">Page not found</div>
                <button onClick={() => router.push('/pages')} className="mt-3 text-sm text-primary hover:underline">
                    Back to all pages
                </button>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="p-2 md:p-4">
                <div className="max-w-5xl mx-auto space-y-3 pt-4">
                    <div className="h-8 w-56 rounded-lg bg-foreground/5 animate-pulse" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-foreground/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 md:p-4 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push('/pages')}
                            className="p-2 rounded-lg hover:bg-foreground/10 shrink-0"
                            title="All pages"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h1 className="text-2xl font-semibold truncate">{config.name}</h1>
                    </div>
                    <button
                        onClick={() => router.push(`/pages/${id}/edit`)}
                        className="h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background/50 text-sm hover:bg-foreground/10 transition-all shrink-0"
                    >
                        <Pencil className="w-4 h-4" /> Edit
                    </button>
                </div>
                {config.description && (
                    <p className="text-sm text-foreground/60 mb-4 ml-11">{config.description}</p>
                )}
                <div className="mt-4">
                    <PageRenderer config={config} />
                </div>
            </div>
        </div>
    );
}
