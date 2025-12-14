export type NoteType = 'link' | 'snippet' | 'todo';
export type CopyMode = 'active' | 'passive';

// Individual text block within a note
export interface TextBlock {
    id: string;
    type: NoteType;
    content: string;
    copyMode: CopyMode;
    completed?: boolean; // For todo blocks
}

// A note contains multiple text blocks
export interface Note {
    id: string;
    title: string;
    blocks: TextBlock[];
    createdAt: number;
    updatedAt: number;
    pin?: number | null; // Pin number for pinned notes (1, 2, 3, etc.)
}

export interface Tab {
    id: string;
    name: string;
    notes: Note[];
}

export interface Group {
    id: string;
    name: string;
    tabs: Tab[];
}

export interface NotesData {
    groups: Group[];
    activeGroupId: string;
    activeTabId: string;
}
