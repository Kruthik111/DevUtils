"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Group } from '@/lib/notes/types';

interface GroupSelectorProps {
    groups: Group[];
    activeGroupId: string;
    onGroupChange: (groupId: string) => void;
    onAddGroup: (name: string) => void;
    onDeleteGroup: (groupId: string) => void;
}

export function GroupSelector({
    groups,
    activeGroupId,
    onGroupChange,
    onAddGroup,
    onDeleteGroup,
}: GroupSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const isPermanentGroup = (groupId: string) => ['work', 'home'].includes(groupId);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsAdding(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAddGroup = () => {
        if (newGroupName.trim()) {
            onAddGroup(newGroupName.trim());
            setNewGroupName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:bg-foreground/5 transition-all min-w-[200px]"
            >
                <span className="flex-1 text-left font-medium">{activeGroup?.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-background border border-border/50 rounded-lg shadow-xl z-10 py-2 animate-in fade-in zoom-in duration-100">
                    {groups.map((group) => (
                        <div
                            key={group.id}
                            className="group flex items-center justify-between px-4 py-2 hover:bg-foreground/5 transition-colors"
                        >
                            <button
                                onClick={() => {
                                    onGroupChange(group.id);
                                    setIsOpen(false);
                                }}
                                className="flex-1 text-left"
                            >
                                {group.name}
                            </button>
                            {!isPermanentGroup(group.id) && (
                                <button
                                    onClick={() => {
                                        onDeleteGroup(group.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                                    title="Delete group"
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="border-t border-border/30 mt-2 pt-2 px-4">
                        {isAdding ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddGroup();
                                        if (e.key === 'Escape') {
                                            setIsAdding(false);
                                            setNewGroupName('');
                                        }
                                    }}
                                    placeholder="Group name"
                                    className="flex-1 px-2 py-1 text-sm border border-border/50 rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddGroup}
                                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
                                >
                                    Add
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center gap-2 text-sm text-foreground/60 hover:text-primary transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New Group
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
