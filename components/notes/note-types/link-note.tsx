"use client";

import { useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/notes/clipboard';

interface LinkNoteProps {
    content: string;
    copyMode: 'active' | 'passive';
}

export function LinkNote({ content, copyMode }: LinkNoteProps) {
    const [copied, setCopied] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);

    const handleCopy = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const success = await copyToClipboard(content);
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
            window.open(content, '_blank');
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
                href={content}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-blue-500 truncate"
                onClick={(e) => e.preventDefault()}
            >
                {content}
            </a>
                <button
                    onClick={handleCopy}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-blue-500/20 transition-all"
                    title="Copy link"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4 text-blue-500" />
                    )}
                </button>
        </div>
    );
}
