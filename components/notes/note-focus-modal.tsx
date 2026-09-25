"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Note, TextBlock } from '@/lib/notes/types';
import { TextBlockItem } from './text-block-item';

interface NoteFocusModalProps {
    note: Note | null;
    envCopyBlockId?: string | null;
    onToggleTodo: (noteId: string, blockId: string) => void;
    onContextMenu: (e: React.MouseEvent, note: Note, block: TextBlock) => void;
    onClose: () => void;
}

export function NoteFocusModal({ note, envCopyBlockId, onToggleTodo, onContextMenu, onClose }: NoteFocusModalProps) {
    useEffect(() => {
        if (!note) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [note, onClose]);

    if (!note) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
            <div
                className="relative bg-background border border-border/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 focus:outline-none"
                tabIndex={-1}
                ref={(el) => el?.focus()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <h2 className="text-xl font-bold truncate">{note.title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-foreground/5 transition-colors" title="Close (Esc)">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 py-4 space-y-2 overflow-y-auto">
                    {note.blocks.map((block) => (
                        <TextBlockItem
                            key={block.id}
                            block={block}
                            onToggleTodo={() => onToggleTodo(note.id, block.id)}
                            onContextMenu={(e) => onContextMenu(e, note, block)}
                            isEnvCopyTarget={block.id === envCopyBlockId}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
