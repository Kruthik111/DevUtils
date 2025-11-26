"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Note, TextBlock, NoteType, CopyMode } from '@/lib/notes/types';

interface NoteEditModalProps {
    isOpen: boolean;
    note: Note | null;
    onSave: (note: Note) => void;
    onCancel: () => void;
}

export function NoteEditModal({
    isOpen,
    note,
    onSave,
    onCancel,
}: NoteEditModalProps) {
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<TextBlock[]>([]);
    const [newBlockContent, setNewBlockContent] = useState('');
    const [newBlockType, setNewBlockType] = useState<NoteType>('snippet');
    const [newBlockCopyMode, setNewBlockCopyMode] = useState<CopyMode>('passive');
    const [showAddBlock, setShowAddBlock] = useState(false);

    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setBlocks([...note.blocks]);
        }
    }, [note]);

    if (!isOpen || !note) return null;

    const handleSave = () => {
        onSave({
            ...note,
            title,
            blocks,
            updatedAt: Date.now(),
        });
    };

    const handleDeleteBlock = (blockId: string) => {
        setBlocks(blocks.filter((b) => b.id !== blockId));
    };

    const handleAddBlock = () => {
        if (newBlockContent.trim()) {
            const newBlock: TextBlock = {
                id: `block-${Date.now()}`,
                type: newBlockType,
                content: newBlockContent.trim(),
                copyMode: newBlockCopyMode,
                completed: newBlockType === 'todo' ? false : undefined,
            };
            setBlocks([...blocks, newBlock]);
            setNewBlockContent('');
            setShowAddBlock(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <h2 className="text-xl font-bold">Edit Note</h2>
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
                        />
                    </div>

                    {/* Blocks List */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Text Blocks</label>
                        <div className="space-y-2">
                            {blocks.map((block, index) => (
                                <div
                                    key={block.id}
                                    className="flex items-start gap-2 p-3 rounded-lg border border-border/30 bg-foreground/5"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 capitalize">
                                                {block.type}
                                            </span>
                                            <span className="text-xs text-foreground/50 capitalize">
                                                {block.copyMode}
                                            </span>
                                        </div>
                                        <p className="text-sm font-mono text-foreground/80 break-words">
                                            {block.content}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBlock(block.id)}
                                        className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors"
                                        title="Delete block"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New Block */}
                    {showAddBlock ? (
                        <div className="p-4 rounded-lg border border-border/30 bg-foreground/5 space-y-3">
                            <div className="flex gap-2">
                                {(['link', 'snippet', 'todo'] as NoteType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setNewBlockType(type)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize font-medium ${newBlockType === type
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-border/50 hover:bg-foreground/5 text-foreground'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={newBlockContent}
                                onChange={(e) => setNewBlockContent(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y font-mono"
                                placeholder="Enter block content..."
                                rows={2}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                {(['active', 'passive'] as CopyMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setNewBlockCopyMode(mode)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize font-medium ${newBlockCopyMode === mode
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-border/50 hover:bg-foreground/5 text-foreground'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddBlock}
                                    disabled={!newBlockContent.trim()}
                                    className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                                >
                                    Add Block
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddBlock(false);
                                        setNewBlockContent('');
                                    }}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-border/50 hover:bg-foreground/5 transition-all text-foreground font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddBlock(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-sm text-foreground/60 hover:text-blue-500 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Block
                        </button>
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
                        disabled={!title.trim() || blocks.length === 0}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
