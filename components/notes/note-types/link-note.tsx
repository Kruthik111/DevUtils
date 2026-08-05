"use client";

import { useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/notes/clipboard';
import { Button } from '@/components/ui/button';
import { useEnvironment } from '@/components/providers/environment-provider';
import { HighlightedContent } from '@/components/notes/highlighted-content';

interface LinkNoteProps {
    content: string;
    copyMode: 'active' | 'passive';
}

export function LinkNote({ content, copyMode }: LinkNoteProps) {
    const [copied, setCopied] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);
    const env = useEnvironment();
    // Resolve {{variables}} against the selected environment for the real link/copy value.
    const resolvedContent = env ? env.substitute(content) : content;

    const handleCopy = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const success = await copyToClipboard(resolvedContent);
        if (success) {
            setCopied(true);
            setIsGlowing(true);
            setTimeout(() => {
                setCopied(false);
                setIsGlowing(false);
            }, 2000);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            //redirect to the link
            window.open(resolvedContent, '_blank');
    };

    return (
        <div
            className={`group relative flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border transition-all ${isGlowing
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-blue-500/20 hover:border-blue-500/40'
                } ${copyMode === 'active' ? 'cursor-pointer' : ''}`}
            onClick={handleClick}
        >
            <ExternalLink className="w-4 h-4 text-blue-500 shrink-0" />
            <a
                href={resolvedContent}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-blue-500 break-all min-w-0"
                onClick={(e) => e.preventDefault()}
            >
                <HighlightedContent text={content} environment={env?.selectedEnvironment ?? null} />
            </a>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-8 w-8 text-blue-500 hover:bg-blue-500/20"
                    title="Copy link"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </Button>
        </div>
    );
}
