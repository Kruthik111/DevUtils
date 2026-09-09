"use client";

import { TextBlock } from '@/lib/notes/types';
import { Crosshair } from 'lucide-react';
import { LinkNote } from './note-types/link-note';
import { SnippetNote } from './note-types/snippet-note';
import { TodoNote } from './note-types/todo-note';

interface TextBlockItemProps {
    block: TextBlock;
    onToggleTodo: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    isEnvCopyTarget?: boolean;
}

export function TextBlockItem({ block, onToggleTodo, onContextMenu, isEnvCopyTarget }: TextBlockItemProps) {
    const renderBlock = () => {
        switch (block.type) {
            case 'link':
                return <LinkNote content={block.content} copyMode={block.copyMode} />;
            case 'snippet':
                return <SnippetNote content={block.content} copyMode={block.copyMode} />;
            case 'todo':
                return (
                    <TodoNote
                        content={block.content}
                        completed={block.completed || false}
                        copyMode={block.copyMode}
                        onToggle={onToggleTodo}
                    />
                );
        }
    };

    return (
        <div
            className={`relative rounded-lg transition-shadow ${isEnvCopyTarget ? 'ring-2 ring-orange-500/70 shadow-lg shadow-orange-500/10' : ''}`}
            onContextMenu={onContextMenu}
        >
            {isEnvCopyTarget && (
                <span
                    className="absolute -top-1.5 -right-1.5 z-10 flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white"
                    title="Copied to clipboard when the environment changes"
                >
                    <Crosshair className="w-2.5 h-2.5" />
                </span>
            )}
            {renderBlock()}
        </div>
    );
}
