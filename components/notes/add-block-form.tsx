"use client";

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { NoteType, CopyMode } from '@/lib/notes/types';
import { Button } from '@/components/ui/button';

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
                    <Button
                        key={type}
                        variant={blockType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBlockType(type)}
                        className="capitalize"
                    >
                        {type}
                    </Button>
                ))}
            </div>

            {/* Content Input */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono"
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
                        <Button
                            key={mode}
                            variant={copyMode === mode ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCopyMode(mode)}
                            className="capitalize h-7 px-3 text-[10px]"
                        >
                            {mode}
                        </Button>
                    ))}
                </div>
            )
            }

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    onClick={handleAdd}
                    disabled={!content.trim()}
                    className="flex-1"
                >
                    <Plus className="w-4 h-4" />
                    Add Block
                </Button>
                <Button
                    variant="outline"
                    onClick={onCancel}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
