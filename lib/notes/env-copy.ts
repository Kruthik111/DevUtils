// Per-tab "copy on environment change" target for the Notes page.
// The chosen block's environment-resolved content is copied to the clipboard
// whenever the notes environment changes. Persisted in localStorage.

export interface EnvCopyTarget {
    noteId: string;
    blockId: string;
}

const storageKey = (tabId: string) => `notes-env-copy-target:${tabId}`;

export function getEnvCopyTarget(tabId: string): EnvCopyTarget | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(storageKey(tabId));
        return raw ? (JSON.parse(raw) as EnvCopyTarget) : null;
    } catch {
        return null;
    }
}

export function setEnvCopyTarget(tabId: string, target: EnvCopyTarget | null): void {
    if (typeof window === 'undefined') return;
    try {
        if (target) {
            localStorage.setItem(storageKey(tabId), JSON.stringify(target));
        } else {
            localStorage.removeItem(storageKey(tabId));
        }
    } catch {
        // localStorage unavailable (e.g. private mode) — non-fatal
    }
}
