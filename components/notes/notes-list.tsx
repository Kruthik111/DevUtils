"use client";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Note, TextBlock, NoteType, CopyMode } from '@/lib/notes/types';
import { NoteItem } from './note-item';

interface NotesListProps {
    notes: Note[];
    onReorder: (notes: Note[]) => void;
    onEditNote: (note: Note) => void;
    onDeleteNote: (noteId: string) => void;
    onAddBlock: (noteId: string, type: NoteType, content: string, copyMode: CopyMode) => void;
    onToggleTodo: (noteId: string, blockId: string) => void;
    onBlockContextMenu: (e: React.MouseEvent, note: Note, block: TextBlock) => void;
}

export function NotesList({
    notes,
    onReorder,
    onEditNote,
    onDeleteNote,
    onAddBlock,
    onToggleTodo,
    onBlockContextMenu,
}: NotesListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = notes.findIndex((note) => note.id === active.id);
            const newIndex = notes.findIndex((note) => note.id === over.id);

            const reorderedNotes = arrayMove(notes, oldIndex, newIndex);
            onReorder(reorderedNotes);
        }
    };

    if (notes.length === 0) {
        return (
            <div className="text-center py-12 text-foreground/50">
                <p>No notes yet. Add your first note above!</p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={notes} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 md:pl-12">
                    {notes.map((note) => (
                        <NoteItem
                            key={note.id}
                            note={note}
                            onEdit={() => onEditNote(note)}
                            onDelete={() => onDeleteNote(note.id)}
                            onAddBlock={(type, content, copyMode) => onAddBlock(note.id, type, content, copyMode)}
                            onToggleTodo={(blockId) => onToggleTodo(note.id, blockId)}
                            onBlockContextMenu={(e, block) => onBlockContextMenu(e, note, block)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
