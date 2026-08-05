"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageBuilder } from '@/components/dynamic-pages/page-builder';
import { DynamicPageConfig, DEFAULT_CONTROLS } from '@/lib/dynamic-pages/types';

export default function EditDynamicPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [config, setConfig] = useState<DynamicPageConfig | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/dynamic-pages?id=${id}`);
                if (!res.ok) {
                    router.push('/pages');
                    return;
                }
                const { page } = await res.json();
                setConfig({
                    ...page,
                    card: page.card || { fieldKeys: [] },
                    stats: page.stats || [],
                    controls: { ...DEFAULT_CONTROLS, filters: [], ...page.controls },
                });
            } catch {
                router.push('/pages');
            }
        })();
    }, [id, router]);

    if (!config) {
        return (
            <div className="p-2 md:p-4">
                <div className="max-w-3xl mx-auto space-y-3 pt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-foreground/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 md:p-4 min-h-screen">
            <PageBuilder initial={config} pageId={id} />
        </div>
    );
}
