"use client";

import { useEffect, useRef } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface ContextMenuProps {
    x: number;
    y: number;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export function ContextMenu({ x, y, onEdit, onDelete, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-background border border-border/50 rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in zoom-in duration-100"
            style={{ left: x, top: y }}
        >
            <button
                onClick={() => {
                    onEdit();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left hover:bg-foreground/5 transition-colors flex items-center gap-2 text-sm"
            >
                <Edit2 className="w-4 h-4" />
                Edit
            </button>
            <button
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-2 text-sm"
            >
                <Trash2 className="w-4 h-4" />
                Delete
            </button>
        </div>
    );
}
