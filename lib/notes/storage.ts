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
            tabs: group.tabs.map((tab: any) => {
                const tabNotes = notes
                    .filter((note: any) => note.groupId === group.id && note.tabId === tab.id)
                    .map((note: any) => ({
                        ...note,
                        // Ensure pin is properly set (null if not present)
                        pin: note.pin != null && note.pin > 0 ? note.pin : null
                    }));
                
                // Sort notes: pinned first (by pin number), then unpinned (by createdAt desc)
                const pinnedNotes = tabNotes.filter((n: any) => n.pin != null && n.pin > 0);
                const unpinnedNotes = tabNotes.filter((n: any) => !n.pin || n.pin <= 0);
                
                pinnedNotes.sort((a: any, b: any) => (a.pin ?? 0) - (b.pin ?? 0));
                unpinnedNotes.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
                
                return {
                    ...tab,
                    notes: [...pinnedNotes, ...unpinnedNotes]
                };
            })
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
