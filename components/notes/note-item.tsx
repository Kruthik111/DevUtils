"use client";

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Plus } from 'lucide-react';
import { Note, TextBlock } from '@/lib/notes/types';
import { TextBlockItem } from './text-block-item';
import { AddBlockForm } from './add-block-form';
import { NoteType, CopyMode } from '@/lib/notes/types';

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
            {/* Drag Handle */}
            <div className="absolute -left-10 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden">
                {/* Note Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <h3 className="text-lg font-semibold text-foreground">{note.title}</h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-md hover:bg-blue-500/20 transition-colors"
                            title="Edit note"
                        >
                            <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-md hover:bg-red-500/20 transition-colors"
                            title="Delete note"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                </div>

                {/* Text Blocks */}
                <div className="px-6 py-4 space-y-2">
                    {note.blocks.map((block) => (
                        <TextBlockItem
                            key={block.id}
                            block={block}
                            onToggleTodo={() => onToggleTodo(block.id)}
                            onContextMenu={(e) => onBlockContextMenu(e, block)}
                        />
                    ))}
                </div>

                {/* Add Block Section */}
                <div className="px-6 pb-4">
                    {showAddBlock ? (
                        <AddBlockForm
                            onAdd={handleAddBlock}
                            onCancel={() => setShowAddBlock(false)}
                        />
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
            </div>
        </div>
    );
}
