"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Clipboard } from 'lucide-react';
import { NoteType, CopyMode, TextBlock } from '@/lib/notes/types';

interface AddNoteModalProps {
    isOpen: boolean;
    onAdd: (title: string, blocks: TextBlock[]) => void;
    onQuickAdd: () => void;
    onCancel: () => void;
}

export function AddNoteModal({
    isOpen,
    onAdd,
    onQuickAdd,
    onCancel,
}: AddNoteModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [noteType, setNoteType] = useState<NoteType>('snippet');
    const [copyMode, setCopyMode] = useState<CopyMode>('passive');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setContent('');
            setNoteType('snippet');
            setCopyMode('passive');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (title.trim() && content.trim()) {
            const initialBlock: TextBlock = {
                id: `block-${Date.now()}`,
                type: noteType,
                content: content.trim(),
                copyMode,
                completed: noteType === 'todo' ? false : undefined,
            };

            onAdd(title.trim(), [initialBlock]);
            onCancel();
        }
    };

    const handleQuickAdd = async () => {
        await onQuickAdd();
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <h2 className="text-xl font-bold">Add New Note</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Note Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Note Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                            placeholder="Enter note title..."
                            autoFocus
                        />
                    </div>

                    {/* Note Type Selector */}
                    <div>
                        <label className="block text-sm font-medium mb-2">First Block Type</label>
                        <div className="flex gap-2">
                            {(['link', 'snippet', 'todo'] as NoteType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setNoteType(type)}
                                    className={`px-4 py-2 rounded-lg border transition-colors capitalize font-medium ${noteType === type
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-border/50 hover:bg-foreground/5 text-foreground'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y font-mono text-sm"
                            placeholder={
                                noteType === 'link'
                                    ? 'Enter URL...'
                                    : noteType === 'snippet'
                                        ? 'Enter code or text...'
                                        : 'Enter todo item...'
                            }
                            rows={4}
                        />
                    </div>

                    {/* Copy Mode (for snippets) */}
                    {noteType === 'snippet' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Copy Mode</label>
                            <div className="flex gap-2">
                                {(['active', 'passive'] as CopyMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setCopyMode(mode)}
                                        className={`px-4 py-2 rounded-lg border transition-colors capitalize font-medium ${copyMode === mode
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-border/50 hover:bg-foreground/5 text-foreground'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-foreground/50 mt-1">
                                {copyMode === 'active'
                                    ? 'Click anywhere on the block to copy'
                                    : 'Click the copy icon to copy'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end px-6 py-4 border-t border-border/30">
                    <button
                        onClick={handleQuickAdd}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:bg-foreground/5 transition-colors font-medium"
                    >
                        <Clipboard className="w-4 h-4" />
                        Quick Add from Clipboard
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-border/50 hover:bg-foreground/5 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!title.trim() || !content.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Create Note
                    </button>
                </div>
            </div>
        </div>
    );
}



