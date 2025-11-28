"use client";

import { useState } from 'react';
import { Copy, CheckSquare, Square, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/notes/clipboard';

interface TodoNoteProps {
    content: string;
    completed: boolean;
    copyMode: 'active' | 'passive';
    onToggle: () => void;
}

export function TodoNote({ content, completed, copyMode, onToggle }: TodoNoteProps) {
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
        if (copyMode === 'active' && !completed) {
            handleCopy();
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
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
            onDoubleClick={handleDoubleClick}
        >
            {completed ? (
                <CheckSquare className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
                <Square className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            )}
            <span
                className={`flex-1 text-sm ${completed ? 'line-through text-foreground/50' : 'text-foreground/90'
                    }`}
            >
                {content}
            </span>
        </div>
    );
}
