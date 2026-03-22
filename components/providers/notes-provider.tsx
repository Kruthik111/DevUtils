"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotesData } from '@/lib/notes/types';

interface NotesContextType {
    notesData: NotesData | null;
    setNotesData: (data: NotesData | null) => void;
    clearCache: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
    const [notesData, setNotesData] = useState<NotesData | null>(null);

    const clearCache = useCallback(() => {
        setNotesData(null);
    }, []);

    return (
        <NotesContext.Provider value={{ notesData, setNotesData, clearCache }}>
            {children}
        </NotesContext.Provider>
    );
}

export function useNotes() {
    const context = useContext(NotesContext);
    if (context === undefined) {
        throw new Error('useNotes must be used within a NotesProvider');
    }
    return context;
}
