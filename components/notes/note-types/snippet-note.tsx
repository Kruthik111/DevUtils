"use client";

import { useState } from 'react';
import { Copy, Code, Check, Zap } from 'lucide-react';
import { copyToClipboard } from '@/lib/notes/clipboard';

interface SnippetNoteProps {
    content: string;
    copyMode: 'active' | 'passive';
}

export function SnippetNote({ content, copyMode }: SnippetNoteProps) {
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

    const handleClick = () => {
        if (copyMode === 'active') {
            handleCopy();
        }
    };

    return (
        <div
            className={`group relative flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border transition-all ${isGlowing
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'border-purple-500/20 hover:border-purple-500/40'
                } ${copyMode === 'active' ? 'cursor-pointer' : ''}`}
            onClick={handleClick}
        >
         {
             copyMode === 'active' ? (
                 <Zap className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            ) : (
                <Code className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            )
         }   
            <pre className="flex-1 text-sm font-mono whitespace-pre-wrap break-words text-foreground/90">
                {content}
            </pre>
            {copyMode === 'passive' && (
                <button
                    onClick={handleCopy}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-purple-500/20 transition-all"
                    title="Copy snippet"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4 text-purple-500" />
                    )}
                </button>
            )}
            {copyMode === 'active' && copied && (
                <Check className="w-4 h-4 text-green-500" />
            )}
        </div>
    );
}
