"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, X, Ban, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

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
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

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

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            setCreateError('All fields are required');
            return;
        }

        if (newUser.password.length < 6) {
            setCreateError('Password must be at least 6 characters');
            return;
        }

        setCreating(true);
        setCreateError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            const data = await res.json();

            if (res.ok) {
                await loadUsers();
                setShowCreateUser(false);
                setNewUser({ name: '', email: '', password: '' });
            } else {
                setCreateError(data.message || 'Failed to create user');
            }
        } catch (error: any) {
            setCreateError(error.message || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    if (status === 'loading') {
        return <Loading fullScreen />;
    }

    if (status === 'unauthenticated' || !isAdmin) {
        return null;
    }

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">User Access Management</h1>
                    <button
                        onClick={() => setShowCreateUser(true)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl",
                            "bg-primary text-background",
                            "hover:bg-primary/90 transition-all",
                            "font-medium"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        Create User
                    </button>
                </div>
                
                {loading ? (
                    <Loading text="Loading users..." fullScreen={false} />
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

            {/* Create User Modal */}
            {showCreateUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-3xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Create New User</h2>
                            <button
                                onClick={() => {
                                    setShowCreateUser(false);
                                    setNewUser({ name: '', email: '', password: '' });
                                    setCreateError('');
                                }}
                                className="p-2 rounded-lg hover:bg-background/80"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="John Doe"
                                    className={cn(
                                        "w-full px-4 py-2 rounded-xl border border-border/50",
                                        "bg-background/50 focus:outline-none focus:border-primary"
                                    )}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="user@example.com"
                                    className={cn(
                                        "w-full px-4 py-2 rounded-xl border border-border/50",
                                        "bg-background/50 focus:outline-none focus:border-primary"
                                    )}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                    className={cn(
                                        "w-full px-4 py-2 rounded-xl border border-border/50",
                                        "bg-background/50 focus:outline-none focus:border-primary"
                                    )}
                                />
                            </div>
                            {createError && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                    {createError}
                                </div>
                            )}
                            <button
                                onClick={handleCreateUser}
                                disabled={creating}
                                className={cn(
                                    "w-full px-4 py-2 rounded-xl",
                                    "bg-primary text-background",
                                    "hover:bg-primary/90 transition-all",
                                    "font-medium disabled:opacity-50"
                                )}
                            >
                                {creating ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

