"use client";

import React from 'react';
import { Environment } from '@/lib/notes/env';

interface HighlightedContentProps {
    text: string;
    environment: Environment | null;
}

// Renders text, highlighting any {{variable}} tokens as chips.
// The chip title shows the resolved value from the selected environment.
export function HighlightedContent({ text, environment }: HighlightedContentProps) {
    if (!text) return null;

    const regex = /\{\{(\w+)\}\}/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const varName = match[1];
        const varValue = environment?.variables?.[varName];
        const isKnown = varValue !== undefined;

        parts.push(
            <span
                key={`var-${match.index}`}
                className={
                    isKnown
                        ? 'bg-primary/20 text-primary font-medium px-1 py-0.5 rounded border border-primary/40'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium px-1 py-0.5 rounded border border-amber-500/40'
                }
                title={isKnown ? `${varName} = ${varValue || '(empty)'}` : `${varName} is not defined in the selected environment`}
            >
                {match[0]}
            </span>
        );

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
}
