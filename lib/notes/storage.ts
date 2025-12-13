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

    // Generate unique IDs to avoid collision with existing data
    const timestamp = Date.now();
    const workGroupId = `work-${timestamp}`;
    const workTabId = `work-tab-${timestamp}`;

    const sampleNote: Note = {
        id: `note-${timestamp}`,
        title: 'Getting Started',
        blocks: sampleBlocks,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    const workTab: Tab = {
        id: workTabId,
        name: 'Tab 1',
        notes: [sampleNote],
    };

    const workGroup: Group = {
        id: workGroupId,
        name: 'Work',
        tabs: [workTab],
    };

    return {
        groups: [workGroup],
        activeGroupId: workGroupId,
        activeTabId: workTabId,
    };
}

export async function fetchNotesData(): Promise<NotesData> {
    try {
        const res = await fetch('/api/notes');
        if (!res.ok) {
            if (res.status === 401) {
                // Not authenticated, return default data or handle redirect
                return createDefaultData();
            }
            throw new Error('Failed to fetch notes');
        }

        const { groups, notes } = await res.json();

        // If no groups, return default data
        if (!groups || groups.length === 0) {
            return createDefaultData();
        }

        // Reconstruct the nested structure
        // The API returns flat lists of groups and notes.
        // We need to nest notes into tabs into groups.

        const reconstructedGroups = groups.map((group: any) => ({
            ...group,
            tabs: group.tabs.map((tab: any) => ({
                ...tab,
                notes: notes.filter((note: any) => note.groupId === group.id && note.tabId === tab.id)
            }))
        }));

        return {
            groups: reconstructedGroups,
            activeGroupId: groups[0].id,
            activeTabId: groups[0].tabs[0].id,
        };
    } catch (error) {
        console.error('Error loading notes data:', error);
        return createDefaultData();
    }
}

export async function persistNotesData(data: NotesData): Promise<void> {
    try {
        await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'sync',
                data,
            }),
        });
    } catch (error) {
        console.error('Error saving notes data:', error);
    }
}

// Deprecated synchronous functions - keeping for compatibility if needed, but should be removed
export function loadNotesData(): NotesData {
    return createDefaultData();
}

export function saveNotesData(data: NotesData): void {
    // No-op
}
