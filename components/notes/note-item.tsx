"use client";

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Note, TextBlock } from '@/lib/notes/types';
import { TextBlockItem } from './text-block-item';
import { AddBlockForm } from './add-block-form';
import { NoteType, CopyMode } from '@/lib/notes/types';
import { cn } from '@/lib/utils';

interface NoteItemProps {
    note: Note;
    onEdit: () => void;
    onDelete: () => void;
    onAddBlock: (type: NoteType, content: string, copyMode: CopyMode) => void;
    onToggleTodo: (blockId: string) => void;
    onBlockContextMenu: (e: React.MouseEvent, block: TextBlock) => void;
}

export function NoteItem({
    note,
    onEdit,
    onDelete,
    onAddBlock,
    onToggleTodo,
    onBlockContextMenu,
}: NoteItemProps) {
    const [showAddBlock, setShowAddBlock] = useState(false);
    // On mobile/tablet, start collapsed. On desktop, always expanded
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return false;
    });

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleAddBlock = (type: NoteType, content: string, copyMode: CopyMode) => {
        onAddBlock(type, content, copyMode);
        setShowAddBlock(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative"
        >
            {/* Drag Handle - Desktop only */}
            <div className="hidden md:block absolute -left-10 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 rounded hover:bg-foreground/10 cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-4 h-4 text-foreground/50" />
                </button>
            </div>

            {/* Note Card */}
            <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
                {/* Note Header */}
                <div 
                    className={cn(
                        "flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-border/30",
                        "md:border-b",
                        "cursor-pointer md:cursor-default"
                    )}
                    onClick={() => {
                        // Only toggle on mobile/tablet (below lg breakpoint)
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-foreground truncate flex-1">
                            {note.title}
                        </h3>
                        <div className="lg:hidden">
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-foreground/60" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-foreground/60" />
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 md:group-hover:opacity-100 md:transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="p-1.5 md:p-2 rounded-md hover:bg-blue-500/20 transition-colors"
                            title="Edit note"
                        >
                            <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-1.5 md:p-2 rounded-md hover:bg-red-500/20 transition-colors"
                            title="Delete note"
                        >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                        </button>
                    </div>
                </div>

                {/* Text Blocks - Collapsible on mobile/tablet */}
                <div className={cn(
                    "px-3 md:px-6 py-3 md:py-4 space-y-2",
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

                {/* Add Block Section - Collapsible on mobile/tablet */}
                <div className={cn(
                    "px-3 md:px-6 pb-3 md:pb-4",
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
                            className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg border border-dashed border-border/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-xs md:text-sm text-foreground/60 hover:text-blue-500 font-medium"
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
