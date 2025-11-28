"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TextBlock, NoteType, CopyMode } from '@/lib/notes/types';

interface BlockEditModalProps {
    isOpen: boolean;
    block: TextBlock | null;
    onSave: (block: TextBlock) => void;
    onCancel: () => void;
}

export function BlockEditModal({
    isOpen,
    block,
    onSave,
    onCancel,
}: BlockEditModalProps) {
    const [content, setContent] = useState('');
    const [blockType, setBlockType] = useState<NoteType>('snippet');
    const [copyMode, setCopyMode] = useState<CopyMode>('passive');

    useEffect(() => {
        if (block) {
            setContent(block.content);
            setBlockType(block.type);
            setCopyMode(block.copyMode);
        }
    }, [block]);

    if (!isOpen || !block) return null;

    const handleSave = () => {
        onSave({
            ...block,
            content: content.trim(),
            type: blockType,
            copyMode,
            completed: blockType === 'todo' ? block.completed : undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <h2 className="text-xl font-bold">Edit Block</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Block Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Block Type</label>
                        <div className="flex gap-2">
                            {(['link', 'snippet', 'todo'] as NoteType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setBlockType(type)}
                                    className={`px-4 py-2 rounded-lg border transition-colors capitalize font-medium ${blockType === type
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-border/50 hover:bg-foreground/5 text-foreground'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y font-mono text-sm"
                            placeholder={
                                blockType === 'link'
                                    ? 'Enter URL...'
                                    : blockType === 'snippet'
                                        ? 'Enter code or text...'
                                        : 'Enter todo item...'
                            }
                            rows={4}
                            autoFocus
                        />
                    </div>

                    {/* Copy Mode */}
                    { blockType === 'snippet' && (
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
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-border/50 hover:bg-foreground/5 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!content.trim()}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
