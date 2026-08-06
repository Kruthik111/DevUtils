"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Pin, PinOff } from 'lucide-react';
import { Note, TextBlock, NoteType, CopyMode } from '@/lib/notes/types';
import { Button } from '@/components/ui/button';
import { themes, themeConfig, type Theme } from "@/lib/theme-config";
import { cn } from "@/lib/utils";

interface NoteEditModalProps {
    isOpen: boolean;
    note: Note | null;
    onSave: (note: Note) => void;
    onCancel: () => void;
    tabNotes?: Note[]; // Notes in current tab for pin uniqueness validation
}

export function NoteEditModal({
    isOpen,
    note,
    onSave,
    onCancel,
    tabNotes = [],
}: NoteEditModalProps) {
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<TextBlock[]>([]);
    const [pin, setPin] = useState<number | null>(null);
    const [newBlockContent, setNewBlockContent] = useState('');
    const [newBlockType, setNewBlockType] = useState<NoteType>('snippet');
    const [newBlockCopyMode, setNewBlockCopyMode] = useState<CopyMode>('passive');
    const [showAddBlock, setShowAddBlock] = useState(false);
    const [pinError, setPinError] = useState('');

    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setBlocks([...note.blocks]);
            setPin(note.pin ?? null);
            setPinError('');
        }
    }, [note]);

    if (!isOpen || !note) return null;

    const handleSave = () => {
        // Validate pin value (must be between 1-4)
        if (pin != null && pin > 0) {
            if (pin > 4) {
                setPinError('Pin number must be between 1 and 4.');
                return;
            }
            
            // Validate pin uniqueness
            const existingNoteWithPin = tabNotes.find(
                (n) => n.id !== note?.id && n.pin === pin
            );
            if (existingNoteWithPin) {
                setPinError(`Pin ${pin} is already assigned to another note. Please choose a different pin number.`);
                return;
            }
        }

        // Check total number of pinned notes (max 4)
        const currentPinnedCount = tabNotes.filter(
            (n) => n.id !== note?.id && n.pin != null && n.pin > 0
        ).length;
        
        if (pin != null && pin > 0 && currentPinnedCount >= 4) {
            setPinError('Maximum of 4 pins allowed per tab. Please remove a pin from another note first.');
            return;
        }

        onSave({
            ...note!,
            title,
            blocks,
            pin: pin && pin > 0 ? pin : null,
            updatedAt: Date.now(),
        });
    };

    const handlePinChange = (value: string) => {
        const numValue = value === '' ? null : parseInt(value, 10);
        if (value === '') {
            setPin(null);
            setPinError('');
        } else if (numValue && numValue > 0) {
            if (numValue > 4) {
                setPinError('Pin number must be between 1 and 4.');
                setPin(numValue); // Still set it so user can see their input
            } else {
                setPin(numValue);
                setPinError('');
            }
        }
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100" onClick={onCancel} />
            
            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] p-4 z-100 bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <h2 className="text-xl font-bold">Edit Note</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                    >
                        <X className="w-5 h-5" />
                    </Button>
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
                            className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                            placeholder="Enter note title..."
                        />
                    </div>

                    {/* Pin Position */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-3">
                            <Pin className="w-4 h-4 text-primary" />
                            Pin Position
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                            {[1, 2, 3, 4].map((p) => {
                                const isUsed = tabNotes.some(n => n.id !== note?.id && n.pin === p);
                                const isActive = pin === p;
                                
                                return (
                                    <Button
                                        key={p}
                                        variant={isActive ? 'default' : isUsed ? 'secondary' : 'outline'}
                                        onClick={() => {
                                            if (!isUsed) {
                                                setPin(isActive ? null : p);
                                                setPinError('');
                                            }
                                        }}
                                        disabled={isUsed}
                                        title={isUsed ? `Pin ${p} is already taken` : `Pin to position ${p}`}
                                        className={cn(
                                            "relative w-14 h-14 rounded-2xl p-0 flex flex-col items-center justify-center",
                                            isActive && "shadow-lg shadow-primary/30 scale-105",
                                            isUsed && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <Pin className={cn("w-5 h-5 mb-1", isActive ? "fill-current" : "")} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{p}</span>
                                        {isUsed && (
                                            <div className="absolute inset-0 flex items-center justify-center rotate-45 pointer-events-none">
                                                <div className="w-full h-px bg-red-500/30" />
                                            </div>
                                        )}
                                    </Button>
                                );
                            })}
                            
                            {pin != null && pin > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPin(null);
                                        setPinError('');
                                    }}
                                    className="w-14 h-14 rounded-2xl p-0 border-dashed hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-500 flex flex-col items-center justify-center group"
                                    title="Remove Pin"
                                >
                                    <PinOff className="w-5 h-5 mb-1 opacity-50 group-hover:opacity-100" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-100">Clear</span>
                                </Button>
                            )}
                        </div>
                        {pinError && (
                            <p className="mt-2 text-xs text-red-500 font-medium px-1 animate-in fade-in slide-in-from-top-1">{pinError}</p>
                        )}
                        <p className="mt-3 text-[10px] text-foreground/60 font-medium uppercase tracking-widest">
                            {pin != null ? `Selected: Position ${pin}` : "Select a position to pin this note to the top of your list"}
                        </p>
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
                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary capitalize">
                                                {block.type}
                                            </span>
                                            <span className="text-xs text-foreground/50 capitalize">
                                                {block.copyMode}
                                            </span>
                                        </div>
                                        <p className="text-sm font-mono text-foreground/80 wrap-break-words">
                                            {block.content}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteBlock(block.id)}
                                        className="hover:bg-red-500/20 text-red-500"
                                        title="Delete block"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New Block */}
                    {showAddBlock ? (
                        <div className="p-4 rounded-lg border border-border/30 bg-foreground/5 space-y-3">
                            <div className="flex gap-2">
                                {(['link', 'snippet', 'todo'] as NoteType[]).map((type) => (
                                    <Button
                                        key={type}
                                        variant={newBlockType === type ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setNewBlockType(type)}
                                        className="capitalize"
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                            <textarea
                                value={newBlockContent}
                                onChange={(e) => setNewBlockContent(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono"
                                placeholder="Enter block content..."
                                rows={2}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                {(['active', 'passive'] as CopyMode[]).map((mode) => (
                                    <Button
                                        key={mode}
                                        variant={newBlockCopyMode === mode ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setNewBlockCopyMode(mode)}
                                        className="capitalize h-7 px-3 text-[10px]"
                                    >
                                        {mode}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleAddBlock}
                                    disabled={!newBlockContent.trim()}
                                    className="flex-1"
                                >
                                    Add Block
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddBlock(false);
                                        setNewBlockContent('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setShowAddBlock(true)}
                            className="w-full border-dashed text-foreground/60 hover:text-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Add Block
                        </Button>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end px-6 py-4 border-t border-border/30">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!title.trim() || blocks.length === 0}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
