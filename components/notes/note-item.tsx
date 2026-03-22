"use client";

import { useState } from 'react';
import { Edit2, Trash2, Plus, Pin } from 'lucide-react';
import { Note, TextBlock } from '@/lib/notes/types';
import { TextBlockItem } from './text-block-item';
import { AddBlockForm } from './add-block-form';
import { NoteType, CopyMode } from '@/lib/notes/types';
import { cn } from '@/lib/utils';

interface NoteItemProps {
    note: Note;
    viewMode?: 'grid' | 'list';
    onEdit: () => void;
    onDelete: () => void;
    onUpdateTitle?: (noteId: string, newTitle: string) => void;
    onAddBlock: (type: NoteType, content: string, copyMode: CopyMode) => void;
    onToggleTodo: (blockId: string) => void;
    onBlockContextMenu: (e: React.MouseEvent, block: TextBlock) => void;
}

export function NoteItem({
    note,
    viewMode = 'grid',
    onEdit,
    onDelete,
    onUpdateTitle,
    onAddBlock,
    onToggleTodo,
    onBlockContextMenu,
}: NoteItemProps) {
    const [showAddBlock, setShowAddBlock] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitleValue, setEditTitleValue] = useState('');
    // On mobile/tablet, start collapsed. On desktop, always expanded
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return false;
    });

    const handleAddBlock = (type: NoteType, content: string, copyMode: CopyMode) => {
        onAddBlock(type, content, copyMode);
        setShowAddBlock(false);
    };

    const startEditingTitle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditingTitle(true);
        setEditTitleValue(note.title);
    };

    const saveTitleEdit = () => {
        if (editTitleValue.trim() && onUpdateTitle) {
            onUpdateTitle(note.id, editTitleValue.trim());
        }
        setIsEditingTitle(false);
        setEditTitleValue('');
    };

    const cancelTitleEdit = () => {
        setIsEditingTitle(false);
        setEditTitleValue('');
    };

    return (
        <div className="group relative">
            {/* Note Card */}
            <div className={cn(
                "bg-background/80 backdrop-blur-xl border border-border shadow-lg overflow-hidden relative",
                viewMode === 'grid' ? "rounded-xl md:rounded-2xl" : "rounded-lg"
            )}>

                {/* Note Header */}
                <div 
                    className={cn(
                        "flex items-center justify-between px-3 py-2 border-b border-border/30",
                        "cursor-pointer md:cursor-default"
                    )}
                    onClick={(e) => {
                        // Don't toggle if editing title
                        if (isEditingTitle) {
                            e.stopPropagation();
                            return;
                        }
                        // Only toggle on mobile/tablet (below lg breakpoint)
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {note.pin != null && note.pin > 0 && (
                            <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                                <Pin className="w-4 h-4 fill-amber-900" />
                                <span className="text-xs font-semibold">{note.pin}</span>
                            </div>
                        )}
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={editTitleValue}
                                onChange={(e) => setEditTitleValue(e.target.value)}
                                onBlur={saveTitleEdit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        saveTitleEdit();
                                    } else if (e.key === 'Escape') {
                                        cancelTitleEdit();
                                    }
                                }}
                                className="text-base md:text-lg font-semibold bg-background border border-primary rounded px-2 py-1 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <h3 
                                className="text-base md:text-lg font-semibold text-foreground truncate flex-1 cursor-text"
                                onDoubleClick={startEditingTitle}
                                title="Double-click to edit title"
                            >
                                {note.title}
                            </h3>
                        )}
                    </div>
                    {/* Edit/Delete buttons - visible in header on mobile, below on desktop */}
                    <div className="flex gap-2 md:hidden">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="p-1.5 rounded-md hover:bg-primary/20 active:bg-primary/30 transition-colors touch-manipulation"
                            title="Edit note"
                        >
                            <Edit2 className="w-4 h-4 text-primary" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-1.5 rounded-md hover:bg-red-500/20 active:bg-red-500/30 transition-colors touch-manipulation"
                            title="Delete note"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                </div>

                {/* Text Blocks - Collapsible on mobile/tablet */}
                <div className={cn(
                    "px-3 py-2 space-y-2",
                    "lg:block",
                    isExpanded ? "block" : "hidden"
                )}>
                    {note.blocks.map((block) => (
                        <TextBlockItem
                            key={block.id}
                            block={block}
                            onToggleTodo={() => onToggleTodo(block.id)}
                            onContextMenu={(e) => onBlockContextMenu(e, block)}
                        />
                    ))}
                </div>

                {/* Edit/Delete buttons - visible below note on desktop */}
                <div className="hidden md:flex items-center justify-end gap-2 px-3 py-2 border-t border-border/30">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="p-2 rounded-md hover:bg-primary/20 active:bg-primary/30 transition-colors"
                        title="Edit note"
                    >
                        <Edit2 className="w-4 h-4 text-primary" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 rounded-md hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
                        title="Delete note"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>

                {/* Add Block Section - Collapsible on mobile/tablet */}
                <div className={cn(
                    "px-3 pb-2",
                    "lg:block",
                    isExpanded ? "block" : "hidden"
                )}>
                    {showAddBlock ? (
                        <AddBlockForm
                            onAdd={handleAddBlock}
                            onCancel={() => setShowAddBlock(false)}
                        />
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowAddBlock(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs md:text-sm text-foreground/60 hover:text-primary font-medium"
                        >
                            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            Add Block
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
