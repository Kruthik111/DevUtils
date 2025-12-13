"use client";

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { NoteType, CopyMode } from '@/lib/notes/types';

interface AddBlockFormProps {
    onAdd: (type: NoteType, content: string, copyMode: CopyMode) => void;
    onCancel: () => void;
}

export function AddBlockForm({ onAdd, onCancel }: AddBlockFormProps) {
    const [content, setContent] = useState('');
    const [blockType, setBlockType] = useState<NoteType>('snippet');
    const [copyMode, setCopyMode] = useState<CopyMode>('passive');

    const handleAdd = () => {
        if (content.trim()) {
            onAdd(blockType, content.trim(), copyMode);
            setContent('');
        }
    };

    return (
        <div className="bg-foreground/5 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Block Type Selector */}
            <div className="flex gap-2">
                {(['link', 'snippet', 'todo'] as NoteType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setBlockType(type)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize font-medium ${blockType === type
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-border/50 hover:bg-foreground/5 text-foreground'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Content Input */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y font-mono"
                placeholder={
                    blockType === 'link'
                        ? 'Enter URL...'
                        : blockType === 'snippet'
                            ? 'Enter code or text...'
                            : 'Enter todo item...'
                }
                rows={2}
                autoFocus
            />

            {/* Copy Mode */}
            {blockType === 'snippet' && (
                < div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {(['active', 'passive'] as CopyMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setCopyMode(mode)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize font-medium ${copyMode === mode
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-border/50 hover:bg-foreground/5 text-foreground'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            )
            }

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleAdd}
                    disabled={!content.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Block
                </button>
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border/50 hover:bg-foreground/5 transition-all text-foreground font-medium"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
