"use client";

import { PageBuilder } from '@/components/dynamic-pages/page-builder';
import { createEmptyConfig } from '@/lib/dynamic-pages/types';

export default function NewDynamicPage() {
    return (
        <div className="p-2 md:p-4 min-h-screen">
            <PageBuilder initial={createEmptyConfig()} />
        </div>
    );
}
