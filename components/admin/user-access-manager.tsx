"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
    _id: string;
    email: string;
    name: string;
    role: string;
    hasAccess: string[];
}

const PROTECTED_PAGES = [
    { path: '/api', label: 'API Testing' },
    // Add more protected pages here as needed
];

export function UserAccessManager() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdminAndLoad();
    }, [session]);

    const checkAdminAndLoad = async () => {
        if (!session?.user?.email) return;
        
        // Check if user is admin
        if (session.user.email === 'gokruthik2003@gmail.com') {
            setIsAdmin(true);
            loadUsers();
        }
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/access');
            if (res.ok) {
                const { users } = await res.json();
                setUsers(users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAccess = async (userId: string, pagePath: string) => {
        const user = users.find(u => u._id === userId);
        if (!user) return;

        const newAccess = user.hasAccess?.includes(pagePath)
            ? user.hasAccess.filter(p => p !== pagePath)
            : [...(user.hasAccess || []), pagePath];

        try {
            const res = await fetch('/api/users/access', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, hasAccess: newAccess }),
            });

            if (res.ok) {
                await loadUsers();
            }
        } catch (error) {
            console.error('Error updating access:', error);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">User Access Management</h2>
            {loading ? (
                <div className="text-foreground/60">Loading users...</div>
            ) : (
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left p-2">User</th>
                                    {PROTECTED_PAGES.map((page) => (
                                        <th key={page.path} className="text-center p-2">
                                            {page.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} className="border-b border-border/30">
                                        <td className="p-2">
                                            <div>
                                                <div className="font-medium">{user.name || user.email}</div>
                                                <div className="text-xs text-foreground/60">{user.email}</div>
                                            </div>
                                        </td>
                                        {PROTECTED_PAGES.map((page) => {
                                            const hasAccess = user.hasAccess?.includes(page.path) || false;
                                            return (
                                                <td key={page.path} className="p-2 text-center">
                                                    <button
                                                        onClick={() => toggleAccess(user._id, page.path)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                            hasAccess
                                                                ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                                                : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                                        )}
                                                    >
                                                        {hasAccess ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : (
                                                            <X className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

