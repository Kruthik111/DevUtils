"use client";

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Tab } from '@/lib/notes/types';

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onTabChange: (tabId: string) => void;
    onAddTab: () => void;
    onDeleteTab: (tabId: string) => void;
    onUpdateTabName: (tabId: string, newName: string) => void;
}

export function TabBar({
    tabs,
    activeTabId,
    onTabChange,
    onAddTab,
    onDeleteTab,
    onUpdateTabName,
}: TabBarProps) {
    const canAddTab = tabs.length < 3;
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const startEditing = (tab: Tab, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTabId(tab.id);
        setEditValue(tab.name);
    };

    const saveEdit = (tabId: string) => {
        if (editValue.trim()) {
            onUpdateTabName(tabId, editValue.trim());
        }
        setEditingTabId(null);
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditingTabId(null);
        setEditValue('');
    };

    return (
        <div className="flex items-center gap-2 border-b border-border/30 pb-2 mb-6">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all cursor-pointer ${activeTabId === tab.id
                            ? 'bg-primary/10 border-b-2 border-primary text-primary'
                            : 'hover:bg-foreground/5 text-foreground/60'
                        }`}
                    onClick={() => {
                        if (editingTabId !== tab.id) {
                            onTabChange(tab.id);
                        }
                    }}
                >
                    {editingTabId === tab.id ? (
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(tab.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    saveEdit(tab.id);
                                } else if (e.key === 'Escape') {
                                    cancelEdit();
                                }
                            }}
                            className="text-sm font-medium bg-background border border-primary rounded px-2 py-1 min-w-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span 
                            className="text-sm font-medium"
                            onDoubleClick={(e) => startEditing(tab, e)}
                            title="Double-click to edit"
                        >
                            {tab.name}
                        </span>
                    )}
                    {tabs.length > 1 && editingTabId !== tab.id && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTab(tab.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                            title="Delete tab"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            ))}

            {canAddTab && (
                <button
                    onClick={onAddTab}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-foreground/60 hover:text-primary"
                    title="Add new tab (max 3)"
                >
                    <Plus className="w-4 h-4" />
                    Add Tab
                </button>
            )}
        </div>
    );
}
