"use client";

import { Note, TextBlock, NoteType, CopyMode } from '@/lib/notes/types';
import { NoteItem } from './note-item';

interface NotesListProps {
    notes: Note[];
    viewMode: 'grid' | 'list';
    onEditNote: (note: Note) => void;
    onDeleteNote: (noteId: string) => void;
    onUpdateTitle?: (noteId: string, newTitle: string) => void;
    onAddBlock: (noteId: string, type: NoteType, content: string, copyMode: CopyMode) => void;
    onToggleTodo: (noteId: string, blockId: string) => void;
    onBlockContextMenu: (e: React.MouseEvent, note: Note, block: TextBlock) => void;
}

export function NotesList({
    notes,
    viewMode,
    onEditNote,
    onDeleteNote,
    onUpdateTitle,
    onAddBlock,
    onToggleTodo,
    onBlockContextMenu,
}: NotesListProps) {
    if (notes.length === 0) {
        return (
            <div className="text-center py-12 text-foreground/50">
                <p>No notes yet. Add your first note above!</p>
            </div>
        );
    }

    return (
        <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
            : "flex flex-col gap-2"
        }>
            {notes.map((note) => (
                <NoteItem
                    key={note.id}
                    note={note}
                    viewMode={viewMode}
                    onEdit={() => onEditNote(note)}
                    onDelete={() => onDeleteNote(note.id)}
                    onUpdateTitle={onUpdateTitle}
                    onAddBlock={(type, content, copyMode) => onAddBlock(note.id, type, content, copyMode)}
                    onToggleTodo={(blockId) => onToggleTodo(note.id, blockId)}
                    onBlockContextMenu={(e, block) => onBlockContextMenu(e, note, block)}
                />
            ))}
        </div>
    );
}
