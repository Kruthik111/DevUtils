"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, X, Ban, CheckCircle, Plus, Loader2, Trash2, RefreshCw, Search, Filter, Grid3x3, List, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';
import { ConfirmDialog } from '@/components/notes/confirm-dialog';
import { useRefresh } from '@/components/providers/refresh-provider';

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
    { path: '/notes', label: 'Notes' },
    { path: '/db-check', label: 'DB Check' },
    { path: '/handle-server', label: 'Handle Server' },
];

export default function AdminUsersPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { registerRefresh, unregisterRefresh } = useRefresh();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        // Set initial view mode based on screen size (grid for mobile, list for desktop)
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768 ? 'grid' : 'list'; // md breakpoint
        }
        return 'list'; // Default fallback
    });
    const [showAccessModal, setShowAccessModal] = useState<{ userId: string; userName: string } | null>(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        userType: 'all', // 'all', 'admin', 'user'
        status: 'all', // 'all', 'active', 'suspended'
        hasApiAccess: 'all', // 'all', 'yes', 'no'
        hasNotesAccess: 'all', // 'all', 'yes', 'no'
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/signin');
        } else if (status === 'authenticated') {
            checkAdminAndLoad();
        }
    }, [status, session?.user?.email, router]);

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

    // Register refresh function
    useEffect(() => {
        registerRefresh('users', loadUsers);
        return () => {
            unregisterRefresh('users');
        };
    }, [registerRefresh, unregisterRefresh]);

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

    const handleDeleteUser = async () => {
        if (!deleteConfirm) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/users/delete?userId=${deleteConfirm}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await loadUsers();
                setDeleteConfirm(null);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete user');
            }
        } catch (error: any) {
            alert(error.message || 'Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };

    if (status === 'loading') {
        return <Loading fullScreen />;
    }

    // Filter users based on search query and filters
    const filteredUsers = users.filter((user) => {
        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                user.name?.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.role.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        // User type filter
        if (filters.userType !== 'all') {
            if (filters.userType === 'admin' && user.role !== 'admin') return false;
            if (filters.userType === 'user' && user.role === 'admin') return false;
        }

        // Status filter
        if (filters.status !== 'all') {
            if (filters.status === 'active' && user.suspended) return false;
            if (filters.status === 'suspended' && !user.suspended) return false;
        }

        // API access filter
        if (filters.hasApiAccess !== 'all') {
            const hasApiAccess = user.hasAccess?.includes('/api') || false;
            if (filters.hasApiAccess === 'yes' && !hasApiAccess) return false;
            if (filters.hasApiAccess === 'no' && hasApiAccess) return false;
        }

        // Notes access filter
        if (filters.hasNotesAccess !== 'all') {
            const hasNotesAccess = user.hasAccess?.includes('/notes') || false;
            if (filters.hasNotesAccess === 'yes' && !hasNotesAccess) return false;
            if (filters.hasNotesAccess === 'no' && hasNotesAccess) return false;
        }

        return true;
    });

    if (status === 'unauthenticated' || !isAdmin) {
        return null;
    }

    return (
        <div className="p-2 md:p-4 min-h-screen">
            <div className="w-full mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold">User Access Management</h1>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background/50",
                            "hover:bg-foreground/10 transition-all"
                        )}
                        title="Filter"
                    >
                        <Filter className="w-4 h-4 text-foreground/70" />
                    </button>
                    {/* Grid/List View Toggle - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-1 border border-border rounded-lg bg-background/50 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded transition-all",
                                viewMode === 'grid'
                                    ? "bg-foreground/10 text-foreground"
                                    : "text-foreground/50 hover:text-foreground/70"
                            )}
                            title="Grid view"
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded transition-all",
                                viewMode === 'list'
                                    ? "bg-foreground/10 text-foreground"
                                    : "text-foreground/50 hover:text-foreground/70"
                            )}
                            title="List view"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={async () => {
                            setIsRefreshing(true);
                            try {
                                await loadUsers();
                            } finally {
                                setIsRefreshing(false);
                            }
                        }}
                        disabled={isRefreshing || loading}
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg border border-border",
                            "bg-background/50 hover:bg-foreground/10 transition-all",
                            "disabled:opacity-50"
                        )}
                        title="Refresh"
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => setShowCreateUser(true)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg border border-border",
                            "bg-background/50 hover:bg-foreground/10 transition-all font-medium text-sm"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        Create User
                    </button>
                </div>

                {loading ? (
                    <Loading text="Loading users..." fullScreen={false} />
                ) : (
                    <>
                        {viewMode === 'list' ? (
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
                                                <th className="text-center p-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((user) => (
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
                                                                    onClick={() => setShowAccessModal({ userId: user._id, userName: user.name || user.email })}
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
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => setDeleteConfirm(user._id)}
                                                            disabled={user.role === 'admin' || deleting}
                                                            className={cn(
                                                                "flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all",
                                                                "bg-red-500/20 text-red-500 hover:bg-red-500/30",
                                                                (user.role === 'admin' || deleting) && "opacity-50 cursor-not-allowed"
                                                            )}
                                                            title={user.role === 'admin' ? "Cannot delete admin users" : "Delete user and all their data"}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredUsers.map((user) => (
                                    <div key={user._id} className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="font-medium text-lg mb-1">{user.name || user.email}</div>
                                                <div className="text-xs text-foreground/60 mb-2">{user.email}</div>
                                                {user.role === 'admin' && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary inline-block">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-foreground/70">Status</span>
                                                <button
                                                    onClick={() => toggleSuspension(user._id, !user.suspended)}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all",
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
                                            </div>
                                            {PROTECTED_PAGES.map((page) => {
                                                const hasAccess = user.hasAccess?.includes(page.path) || false;
                                                return (
                                                    <div key={page.path} className="flex items-center justify-between">
                                                        <span className="text-sm text-foreground/70">{page.label}</span>
                                                        <button
                                                            onClick={() => setShowAccessModal({ userId: user._id, userName: user.name || user.email })}
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
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-2 pt-3 border-t border-border/30">
                                            <button
                                                onClick={() => setDeleteConfirm(user._id)}
                                                disabled={user.role === 'admin' || deleting}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                                    "bg-red-500/20 text-red-500 hover:bg-red-500/30",
                                                    (user.role === 'admin' || deleting) && "opacity-50 cursor-not-allowed"
                                                )}
                                                title={user.role === 'admin' ? "Cannot delete admin users" : "Delete user and all their data"}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Minimum 6 characters"
                                        className={cn(
                                            "w-full px-4 py-2 rounded-xl border border-border/50",
                                            "bg-background/50 focus:outline-none focus:border-primary",
                                            "pr-10"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
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

            {/* Access Management Modal */}
            {showAccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAccessModal(null)} />
                    <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                            <h2 className="text-xl font-bold">Manage Access - {showAccessModal.userName}</h2>
                            <button
                                onClick={() => setShowAccessModal(null)}
                                className="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            {PROTECTED_PAGES.map((page) => {
                                const user = users.find(u => u._id === showAccessModal.userId);
                                if (!user) return null;
                                const hasAccess = user.hasAccess?.includes(page.path) || false;
                                return (
                                    <div key={page.path} className="flex items-center justify-between p-4 rounded-lg border border-border/30 bg-foreground/5">
                                        <div>
                                            <div className="font-medium">{page.label}</div>
                                            <div className="text-sm text-foreground/60">{page.path}</div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                await toggleAccess(showAccessModal.userId, page.path);
                                                await loadUsers();
                                            }}
                                            disabled={user.role === 'admin' || user.suspended}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
                                                hasAccess
                                                    ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                                    : "bg-red-500/20 text-red-500 hover:bg-red-500/30",
                                                (user.role === 'admin' || user.suspended) && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {hasAccess ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Remove Access
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-4 h-4" />
                                                    Grant Access
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-3 justify-end px-6 py-4 border-t border-border/30">
                            <button
                                onClick={() => setShowAccessModal(null)}
                                className="px-4 py-2 rounded-lg border border-border/50 hover:bg-foreground/5 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-6">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />
                    <div className="relative bg-background border border-border/50 rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in fade-in slide-in-from-bottom-5 md:zoom-in duration-200 flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                            <h2 className="text-xl font-bold">Filters</h2>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            {/* User Type Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-3">User Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'admin', 'user'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilters({ ...filters, userType: type })}
                                            className={cn(
                                                "px-4 py-2 rounded-lg border transition-all font-medium text-sm capitalize",
                                                filters.userType === type
                                                    ? "bg-primary/20 text-primary border-primary"
                                                    : "bg-background/50 border-border hover:bg-foreground/5"
                                            )}
                                        >
                                            {type === 'all' ? 'All Users' : type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'active', 'suspended'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setFilters({ ...filters, status })}
                                            className={cn(
                                                "px-4 py-2 rounded-lg border transition-all font-medium text-sm capitalize",
                                                filters.status === status
                                                    ? status === 'active'
                                                        ? "bg-green-500/20 text-green-500 border-green-500"
                                                        : status === 'suspended'
                                                            ? "bg-red-500/20 text-red-500 border-red-500"
                                                            : "bg-primary/20 text-primary border-primary"
                                                    : "bg-background/50 border-border hover:bg-foreground/5"
                                            )}
                                        >
                                            {status === 'all' ? 'All Status' : status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* API Access Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-3">API Access</label>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'yes', 'no'].map((access) => (
                                        <button
                                            key={access}
                                            onClick={() => setFilters({ ...filters, hasApiAccess: access })}
                                            className={cn(
                                                "px-4 py-2 rounded-lg border transition-all font-medium text-sm capitalize",
                                                filters.hasApiAccess === access
                                                    ? "bg-primary/20 text-primary border-primary"
                                                    : "bg-background/50 border-border hover:bg-foreground/5"
                                            )}
                                        >
                                            {access === 'all' ? 'All' : access === 'yes' ? 'Has Access' : 'No Access'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes Access Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Notes Access</label>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'yes', 'no'].map((access) => (
                                        <button
                                            key={access}
                                            onClick={() => setFilters({ ...filters, hasNotesAccess: access })}
                                            className={cn(
                                                "px-4 py-2 rounded-lg border transition-all font-medium text-sm capitalize",
                                                filters.hasNotesAccess === access
                                                    ? "bg-primary/20 text-primary border-primary"
                                                    : "bg-background/50 border-border hover:bg-foreground/5"
                                            )}
                                        >
                                            {access === 'all' ? 'All' : access === 'yes' ? 'Has Access' : 'No Access'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-border/30">
                            <button
                                onClick={() => {
                                    setFilters({
                                        userType: 'all',
                                        status: 'all',
                                        hasApiAccess: 'all',
                                        hasNotesAccess: 'all',
                                    });
                                }}
                                className="flex-1 px-4 py-2 rounded-lg border border-border/50 hover:bg-foreground/5 transition-colors font-medium"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-primary text-background hover:bg-primary/90 transition-all font-medium"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete User Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                title="Delete User"
                message="Are you sure you want to delete this user? This will permanently delete all their notes, groups, API configs, and environments. The user account will be marked as suspended. This action cannot be undone."
                onConfirm={handleDeleteUser}
                onCancel={() => setDeleteConfirm(null)}
                showCancel={true}
                confirmText="Delete"
                destructive={true}
            />
        </div>
    );
}

