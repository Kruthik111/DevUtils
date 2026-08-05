"use client";

import { useState } from 'react';
import { Copy, CheckSquare, Square, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/notes/clipboard';
import { Button } from '@/components/ui/button';
import { useEnvironment } from '@/components/providers/environment-provider';
import { HighlightedContent } from '@/components/notes/highlighted-content';

interface TodoNoteProps {
    content: string;
    completed: boolean;
    copyMode: 'active' | 'passive';
    onToggle: () => void;
}

export function TodoNote({ content, completed, copyMode, onToggle }: TodoNoteProps) {
    const [copied, setCopied] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);
    const env = useEnvironment();
    // Resolve {{variables}} against the selected environment for the copied value.
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

    const handleClick = () => {
        if (copyMode === 'active' && !completed) {
            handleCopy();
        }
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle();
    };

    return (
        <div
            className={`group relative flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border transition-all ${isGlowing
                    ? 'border-green-500 shadow-lg shadow-green-500/20'
                    : 'border-green-500/20 hover:border-green-500/40'
                } ${copyMode === 'active' && !completed ? 'cursor-pointer' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleToggle}
        >
            <span onClick={handleToggle}>
            {completed ? (
                <CheckSquare className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
                <Square className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            )}
            </span>
            <span
                className={`flex-1 text-sm ${completed ? 'line-through text-foreground/50' : 'text-foreground/90'
                    }`}
            >
                <HighlightedContent text={content} environment={env?.selectedEnvironment ?? null} />
            </span>
            {copyMode === 'passive' && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-8 w-8 text-green-500 hover:bg-green-500/20"
                    title="Copy todo"
                >
                    {copied ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </Button>
            )}
            {copyMode === 'active' && copied && (
                <Check className="w-4 h-4 text-green-500 shrink-0" />
            )}
        </div>
    );
}
