"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, X, Ban, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
    _id: string;
    email: string;
    name: string;
    role: string;
    hasAccess: string[];
    suspended?: boolean;
}

const PROTECTED_PAGES = [
    { path: '/api', label: 'API Testing' },
    // Add more protected pages here as needed
];

export default function AdminUsersPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/signin');
        } else if (status === 'authenticated') {
            checkAdminAndLoad();
        }
    }, [status, session, router]);

    const checkAdminAndLoad = async () => {
        if (!session?.user?.email) return;
        
        // Check if user is admin
        if (session.user.email === 'gokruthik2003@gmail.com') {
            setIsAdmin(true);
            loadUsers();
        } else {
            // Check from API
            try {
                const res = await fetch('/api/users/access');
                if (res.ok) {
                    setIsAdmin(true);
                    loadUsers();
                } else {
                    router.push('/profile');
                }
            } catch {
                router.push('/profile');
            }
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

    const toggleSuspension = async (userId: string, suspended: boolean) => {
        try {
            const res = await fetch('/api/users/suspend', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, suspended }),
            });

            if (res.ok) {
                await loadUsers();
            }
        } catch (error) {
            console.error('Error updating suspension:', error);
        }
    };

    if (status === 'loading') {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-foreground/60">Loading...</div>
            </div>
        );
    }

    if (status === 'unauthenticated' || !isAdmin) {
        return null;
    }

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">User Access Management</h1>
                
                {loading ? (
                    <div className="text-foreground/60">Loading users...</div>
                ) : (
                    <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="text-left p-3">User</th>
                                        <th className="text-center p-3">Status</th>
                                        {PROTECTED_PAGES.map((page) => (
                                            <th key={page.path} className="text-center p-3">
                                                {page.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id} className="border-b border-border/30">
                                            <td className="p-3">
                                                <div>
                                                    <div className="font-medium">{user.name || user.email}</div>
                                                    <div className="text-xs text-foreground/60">{user.email}</div>
                                                    {user.role === 'admin' && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary mt-1 inline-block">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => toggleSuspension(user._id, !user.suspended)}
                                                    className={cn(
                                                        "flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all",
                                                        user.suspended
                                                            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                                            : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                                    )}
                                                >
                                                    {user.suspended ? (
                                                        <>
                                                            <Ban className="w-3 h-3" />
                                                            Suspended
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-3 h-3" />
                                                            Active
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            {PROTECTED_PAGES.map((page) => {
                                                const hasAccess = user.hasAccess?.includes(page.path) || false;
                                                return (
                                                    <td key={page.path} className="p-3 text-center">
                                                        <button
                                                            onClick={() => toggleAccess(user._id, page.path)}
                                                            disabled={user.role === 'admin' || user.suspended}
                                                            className={cn(
                                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                                hasAccess
                                                                    ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                                                    : "bg-red-500/20 text-red-500 hover:bg-red-500/30",
                                                                (user.role === 'admin' || user.suspended) && "opacity-50 cursor-not-allowed"
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
        </div>
    );
}

