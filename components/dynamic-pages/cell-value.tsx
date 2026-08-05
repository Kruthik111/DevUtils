"use client";

import { ColumnType } from '@/lib/dynamic-pages/types';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

/**
 * Apply a column's {{value}} template to the raw API value. Arrays are mapped
 * per element, so ["a.jpg","b.jpg"] + "https://cdn.x/{{value}}" gives two URLs.
 */
export function resolveTemplate(value: unknown, template?: string): unknown {
    if (!template || !template.trim() || value === null || value === undefined || value === '') return value;
    if (Array.isArray(value)) {
        return value.map((el) =>
            el === null || el === undefined ? el : template.replaceAll('{{value}}', String(el))
        );
    }
    return template.replaceAll('{{value}}', String(value));
}

// Renders one value according to its configured column type. Kept deliberately
// small — every layout (table, cards, detail) formats values through here.
export function CellValue({
    value: rawValue,
    type,
    template,
    className,
}: {
    value: unknown;
    type: ColumnType;
    template?: string;
    className?: string;
}) {
    const value = resolveTemplate(rawValue, template);

    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        return <span className={cn('text-foreground/30', className)}>—</span>;
    }

    // Arrays get type-aware handling before the scalar rendering below.
    if (Array.isArray(value)) {
        if (type === 'image') {
            const urls = value.filter((v) => v !== null && v !== undefined).slice(0, 4);
            const extra = value.length - urls.length;
            return (
                <span className={cn('inline-flex items-center gap-1', className)}>
                    {urls.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={i}
                            src={String(url)}
                            alt=""
                            loading="lazy"
                            title={String(url)}
                            className="w-10 h-10 rounded-lg object-cover border border-border"
                        />
                    ))}
                    {extra > 0 && <span className="text-xs text-foreground/50">+{extra}</span>}
                </span>
            );
        }
        if (type === 'badge') {
            const items = value.slice(0, 3);
            const extra = value.length - items.length;
            return (
                <span className={cn('inline-flex items-center gap-1 flex-wrap', className)}>
                    {items.map((item, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                            {String(item)}
                        </span>
                    ))}
                    {extra > 0 && <span className="text-xs text-foreground/50">+{extra}</span>}
                </span>
            );
        }
        if (type === 'link') {
            // Render the first link; the rest are one click away in the detail drawer.
            return <CellValue value={value[0]} type="link" className={className} />;
        }
        if (value.every((v) => v === null || typeof v !== 'object')) {
            return (
                <span className={cn('max-w-80 truncate inline-block align-bottom', className)} title={value.join(', ')}>
                    {value.join(', ')}
                </span>
            );
        }
        return (
            <code className={cn('text-xs text-foreground/70 font-mono max-w-64 truncate inline-block align-bottom', className)}>
                {JSON.stringify(value)}
            </code>
        );
    }

    switch (type) {
        case 'boolean': {
            const truthy = value === true || value === 'true' || value === 1;
            return (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-medium',
                        truthy ? 'text-green-600 dark:text-green-400' : 'text-foreground/50',
                        className
                    )}
                >
                    <span className={cn('w-1.5 h-1.5 rounded-full', truthy ? 'bg-green-500' : 'bg-foreground/30')} />
                    {truthy ? 'Yes' : 'No'}
                </span>
            );
        }

        case 'number':
            return (
                <span className={cn('tabular-nums', className)}>
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </span>
            );

        case 'date': {
            const date = new Date(String(value));
            if (Number.isNaN(date.getTime())) return <span className={className}>{String(value)}</span>;
            return (
                <span className={cn('whitespace-nowrap', className)} title={date.toISOString()}>
                    {date.toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            );
        }

        case 'badge':
            return (
                <span
                    className={cn(
                        'inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary',
                        className
                    )}
                >
                    {String(value)}
                </span>
            );

        case 'link':
            return (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cn('inline-flex items-center gap-1 text-primary hover:underline max-w-64 truncate', className)}
                >
                    <span className="truncate">{String(value)}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
            );

        case 'image':
            return (
                // Remote, user-configured hosts — next/image would need every host allowlisted.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={String(value)}
                    alt=""
                    loading="lazy"
                    className={cn('w-10 h-10 rounded-lg object-cover border border-border', className)}
                />
            );

        case 'json':
            return (
                <code className={cn('text-xs text-foreground/70 font-mono max-w-64 truncate inline-block align-bottom', className)}>
                    {JSON.stringify(value)}
                </code>
            );

        default:
            return (
                <span className={cn('max-w-80 truncate inline-block align-bottom', className)} title={String(value)}>
                    {String(value)}
                </span>
            );
    }
}
