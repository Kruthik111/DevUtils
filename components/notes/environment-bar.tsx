"use client";

import { useState } from 'react';
import { Settings, X, Check, ChevronDown, Layers, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Environment } from '@/lib/notes/env';
import { useEnvironment } from '@/components/providers/environment-provider';
import { ConfirmDialog } from '@/components/notes/confirm-dialog';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Environment selector + management modal for the Notes page.
// Backed by /api/note-environments — these are notes-only variables and are
// kept completely separate from the API testing page's environments.
export function EnvironmentBar() {
    const env = useEnvironment();
    const [showModal, setShowModal] = useState(false);
    const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
    const [envName, setEnvName] = useState('');
    const [envVars, setEnvVars] = useState<{ id: string; key: string; value: string }[]>([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    if (!env) return null;
    const { environments, selectedEnvironment, setSelectedEnvironment, reloadEnvironments } = env;

    const resetForm = () => {
        setEditingEnv(null);
        setEnvName('');
        setEnvVars([]);
    };

    const openCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const loadEnvForEdit = (e: Environment) => {
        setEditingEnv(e);
        setEnvName(e.name);
        setEnvVars(
            Object.entries(e.variables || {}).map(([key, value], idx) => ({
                id: `var-${idx}`,
                key,
                value,
            }))
        );
        setShowModal(true);
    };

    const buildVariables = () => {
        const variables: Record<string, string> = {};
        envVars.forEach((v) => {
            if (v.key.trim()) variables[v.key.trim()] = v.value;
        });
        return variables;
    };

    const saveEnvironment = async () => {
        if (!envName.trim()) {
            toast.error('Environment name is required');
            return;
        }

        try {
            const variables = buildVariables();
            let res: Response;
            if (editingEnv) {
                res = await fetch('/api/note-environments', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingEnv._id,
                        name: envName,
                        variables,
                        isDefault: editingEnv.isDefault,
                    }),
                });
            } else {
                res = await fetch('/api/note-environments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: envName,
                        variables,
                        isDefault: environments.length === 0,
                    }),
                });
            }

            if (!res.ok) {
                toast.error('Failed to save environment. Please try again.');
                return;
            }

            await reloadEnvironments();
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving environment:', error);
            toast.error('Failed to save environment. Please try again.');
        }
    };

    const deleteEnvironment = async (id: string) => {
        try {
            const res = await fetch(`/api/note-environments?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                toast.error('Failed to delete environment. Please try again.');
                return;
            }
            if (selectedEnvironment?._id === id) setSelectedEnvironment(null);
            if (editingEnv?._id === id) {
                setShowModal(false);
                resetForm();
            }
            await reloadEnvironments();
        } catch (error) {
            console.error('Error deleting environment:', error);
            toast.error('Failed to delete environment. Please try again.');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2 shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                'group flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-lg border border-border',
                                'bg-background/50 hover:bg-foreground/5 transition-all',
                                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                                'data-[state=open]:ring-2 data-[state=open]:ring-primary/50 data-[state=open]:border-primary'
                            )}
                            title="Environment used to resolve {{variables}} in notes"
                        >
                            <Layers
                                className={cn(
                                    'w-4 h-4 shrink-0',
                                    selectedEnvironment ? 'text-primary' : 'text-foreground/40'
                                )}
                            />
                            <span
                                className={cn(
                                    'text-sm max-w-36 truncate',
                                    selectedEnvironment ? 'font-medium text-foreground' : 'text-foreground/60'
                                )}
                            >
                                {selectedEnvironment?.name || 'No Environment'}
                            </span>
                            {selectedEnvironment && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                                    {Object.keys(selectedEnvironment.variables || {}).length}
                                </span>
                            )}
                            <ChevronDown className="w-4 h-4 text-foreground/40 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="start"
                        className="w-64 rounded-2xl p-2 bg-background border-border shadow-2xl"
                    >
                        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
                            Notes Environment
                        </div>

                        <DropdownMenuItem
                            onSelect={() => setSelectedEnvironment(null)}
                            className="rounded-xl px-2.5 py-2 cursor-pointer focus:bg-foreground/10 hover:bg-foreground/10"
                        >
                            <span className="flex-1 text-sm text-foreground/70">No Environment</span>
                            {!selectedEnvironment && <Check className="w-4 h-4 text-primary" />}
                        </DropdownMenuItem>

                        {environments.map((e) => (
                            <DropdownMenuItem
                                key={e._id}
                                onSelect={() => setSelectedEnvironment(e)}
                                className="rounded-xl px-2.5 py-2 cursor-pointer gap-2 focus:bg-foreground/10 hover:bg-foreground/10"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium truncate">{e.name}</span>
                                        {e.isDefault && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground/60 shrink-0">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-foreground/50">
                                        {Object.keys(e.variables || {}).length} variables
                                    </div>
                                </div>
                                {selectedEnvironment?._id === e._id && (
                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                )}
                            </DropdownMenuItem>
                        ))}

                        {environments.length === 0 && (
                            <div className="px-2 py-3 text-xs text-foreground/50">
                                No environments yet. Create one to use {'{{variables}}'} in notes.
                            </div>
                        )}

                        <DropdownMenuSeparator className="my-1.5" />

                        <DropdownMenuItem
                            onSelect={openCreate}
                            className="rounded-xl px-2.5 py-2 cursor-pointer text-primary gap-2 focus:bg-primary/10 hover:bg-primary/10"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">New Environment</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <button
                    onClick={openCreate}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background/50 hover:bg-foreground/10 transition-all shrink-0"
                    title="Manage Environments"
                >
                    <Settings className="w-4 h-4 text-foreground/70" />
                </button>
            </div>

            {/* Environment Management Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Manage Note Environments</h2>
                                <p className="text-xs text-foreground/60 mt-0.5">
                                    Separate from API testing environments — used only for {'{{variables}}'} in notes.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="p-2 rounded-lg hover:bg-foreground/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Environment Name</label>
                                <input
                                    type="text"
                                    value={envName}
                                    onChange={(e) => setEnvName(e.target.value)}
                                    placeholder="e.g., Development, Production"
                                    className={cn(
                                        'w-full px-4 py-2 rounded-xl border border-border',
                                        'bg-background/50 focus:outline-none focus:border-primary'
                                    )}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium">Variables</label>
                                    <button
                                        onClick={() =>
                                            setEnvVars([...envVars, { id: `var-${Date.now()}`, key: '', value: '' }])
                                        }
                                        className="text-xs text-primary hover:underline"
                                    >
                                        + Add Variable
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {envVars.map((v) => (
                                        <div key={v.id} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={v.key}
                                                onChange={(e) =>
                                                    setEnvVars(envVars.map((v2) => (v2.id === v.id ? { ...v2, key: e.target.value } : v2)))
                                                }
                                                placeholder="Variable Name"
                                                className={cn(
                                                    'flex-1 px-3 py-2 rounded-lg border border-border',
                                                    'bg-background/50 focus:outline-none focus:border-primary text-sm'
                                                )}
                                            />
                                            <input
                                                type="text"
                                                value={v.value}
                                                onChange={(e) =>
                                                    setEnvVars(envVars.map((v2) => (v2.id === v.id ? { ...v2, value: e.target.value } : v2)))
                                                }
                                                placeholder="Variable Value"
                                                className={cn(
                                                    'flex-1 px-3 py-2 rounded-lg border border-border',
                                                    'bg-background/50 focus:outline-none focus:border-primary text-sm'
                                                )}
                                            />
                                            <button
                                                onClick={() => setEnvVars(envVars.filter((v2) => v2.id !== v.id))}
                                                className="px-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {envVars.length === 0 && (
                                        <div className="text-sm text-foreground/60 py-2">No variables added</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={saveEnvironment}
                                    className={cn(
                                        'flex-1 px-4 py-2 rounded-xl',
                                        'bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium'
                                    )}
                                >
                                    {editingEnv ? 'Update Environment' : 'Create Environment'}
                                </button>
                                {editingEnv && (
                                    <button
                                        onClick={() => setDeleteConfirmId(editingEnv._id)}
                                        className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all font-medium"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>

                            {environments.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium mb-2">Existing Environments</h3>
                                    <div className="space-y-2">
                                        {environments.map((e) => (
                                            <div
                                                key={e._id}
                                                className="p-3 rounded-xl bg-background/50 border border-border/30 flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        {e.name} {e.isDefault && '(Default)'}
                                                    </div>
                                                    <div className="text-xs text-foreground/60">
                                                        {Object.keys(e.variables || {}).length} variables
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => loadEnvForEdit(e)}
                                                    className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteConfirmId}
                title="Delete Environment"
                message="Are you sure you want to delete this environment? This action cannot be undone."
                onConfirm={() => deleteConfirmId && deleteEnvironment(deleteConfirmId)}
                onCancel={() => setDeleteConfirmId(null)}
                showCancel={true}
                confirmText="Delete"
                destructive={true}
            />
        </>
    );
}
