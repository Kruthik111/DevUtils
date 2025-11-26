import { NotesData, Group, Tab, Note, TextBlock } from './types';

const STORAGE_KEY = 'devutils-notes-data';

export function createDefaultData(): NotesData {
    // Create sample note with multiple blocks
    const sampleBlocks: TextBlock[] = [
        {
            id: 'block-1',
            type: 'snippet',
            content: 'npm install express',
            copyMode: 'passive',
        },
        {
            id: 'block-2',
            type: 'link',
            content: 'https://expressjs.com',
            copyMode: 'passive',
        },
    ];

    const sampleNote: Note = {
        id: 'note-1',
        title: 'Getting Started',
        blocks: sampleBlocks,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    const workTab: Tab = {
        id: 'work-tab-1',
        name: 'Tab 1',
        notes: [sampleNote],
    };

    const homeTab: Tab = {
        id: 'home-tab-1',
        name: 'Tab 1',
        notes: [],
    };

    const workGroup: Group = {
        id: 'work',
        name: 'Work',
        tabs: [workTab],
    };

    const homeGroup: Group = {
        id: 'home',
        name: 'Home',
        tabs: [homeTab],
    };

    return {
        groups: [workGroup, homeGroup],
        activeGroupId: 'work',
        activeTabId: 'work-tab-1',
    };
}

export function loadNotesData(): NotesData {
    if (typeof window === 'undefined') {
        return createDefaultData();
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading notes data:', error);
    }

    return createDefaultData();
}

export function saveNotesData(data: NotesData): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving notes data:', error);
    }
}
