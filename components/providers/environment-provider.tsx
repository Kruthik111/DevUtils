"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Environment, substituteVariables } from '@/lib/notes/env';

interface EnvironmentContextType {
    environments: Environment[];
    selectedEnvironment: Environment | null;
    setSelectedEnvironment: (env: Environment | null) => void;
    // Resolve {{variable}} tokens using the currently selected environment.
    substitute: (text: string) => string;
    reloadEnvironments: () => Promise<void>;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);

    const reloadEnvironments = useCallback(async () => {
        try {
            const res = await fetch('/api/note-environments');
            if (!res.ok) return;
            const { environments } = await res.json();
            const normalized: Environment[] = (environments || []).map((e: Environment) => ({
                ...e,
                variables: e.variables || {},
            }));
            setEnvironments(normalized);
            // Keep the current selection if it still exists, otherwise fall back to default.
            setSelectedEnvironment((prev) => {
                if (prev) {
                    const updated = normalized.find((e) => e._id === prev._id);
                    if (updated) return updated;
                }
                return normalized.find((e) => e.isDefault) || normalized[0] || null;
            });
        } catch (error) {
            console.error('Error loading environments:', error);
        }
    }, []);

    useEffect(() => {
        reloadEnvironments();
    }, [reloadEnvironments]);

    const substitute = useCallback(
        (text: string) => substituteVariables(text, selectedEnvironment?.variables || {}),
        [selectedEnvironment]
    );

    return (
        <EnvironmentContext.Provider
            value={{ environments, selectedEnvironment, setSelectedEnvironment, substitute, reloadEnvironments }}
        >
            {children}
        </EnvironmentContext.Provider>
    );
}

// Safe to call outside a provider (returns undefined) so blocks degrade gracefully.
export function useEnvironment() {
    return useContext(EnvironmentContext);
}
