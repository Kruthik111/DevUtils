"use client";

import { TextBlock } from '@/lib/notes/types';
import { LinkNote } from './note-types/link-note';
import { SnippetNote } from './note-types/snippet-note';
import { TodoNote } from './note-types/todo-note';

interface TextBlockItemProps {
    block: TextBlock;
    onToggleTodo: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

export function TextBlockItem({ block, onToggleTodo, onContextMenu }: TextBlockItemProps) {
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

    return <div onContextMenu={onContextMenu}>{renderBlock()}</div>;
}
