"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NotesData, Note, TextBlock, NoteType, CopyMode, Tab, Group } from '@/lib/notes/types';
import { fetchNotesData, persistNotesData } from '@/lib/notes/storage';
import { GroupSelector } from '@/components/notes/group-selector';
import { TabBar } from '@/components/notes/tab-bar';
import { AddNoteModal } from '@/components/notes/add-note-modal';
import { NotesList } from '@/components/notes/notes-list';
import { NoteEditModal } from '@/components/notes/note-edit-modal';
import { BlockEditModal } from '@/components/notes/block-edit-modal';
import { ConfirmDialog } from '@/components/notes/confirm-dialog';
import { ContextMenu } from '@/components/notes/context-menu';
import { Loading } from '@/components/ui/loading';
import { useRefresh } from '@/components/providers/refresh-provider';
import { RefreshCw, ArrowUpDown, ArrowDownUp, ArrowUp, ArrowDown, Search, Filter, Grid3x3, List, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export default function NotesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { registerRefresh, unregisterRefresh } = useRefresh();

  // All hooks must be called before any conditional returns
  const [data, setData] = useState<NotesData | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingBlock, setEditingBlock] = useState<{ note: Note; block: TextBlock } | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<{ noteId: string; blockId: string } | null>(null);
  const [tabDeleteWarning, setTabDeleteWarning] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [sortMode, setSortMode] = useState<'custom' | 'latest' | 'oldest'>('custom');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    note: Note;
    block: TextBlock;
  } | null>(null);

  // Load data function
  const loadData = async () => {
    const loadedData = await fetchNotesData();
    setData(loadedData);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  // Check access to notes page
  useEffect(() => {
    if (status === 'authenticated') {
      // Check notes access
      fetch('/api/notes')
        .then(async (res) => {
          if (!res.ok) {
            // Notes access denied, check API access
            setHasAccess(false);
            const apiRes = await fetch('/api/api-configs');
            if (apiRes.ok) {
              // Has API access, redirect to API page
              router.push('/api');
            } else {
              // No API access either, redirect to profile
              router.push('/profile');
            }
          } else {
            // Has access, load data
            setHasAccess(true);
            loadData();
          }
        })
        .catch(() => {
          // On error, redirect to profile as fallback
          setHasAccess(false);
          router.push('/profile');
        });
    }
  }, [status, router]);

  // Register refresh function
  useEffect(() => {
    if (hasAccess) {
      registerRefresh('notes', loadData);
      return () => {
        unregisterRefresh('notes');
      };
    }
  }, [hasAccess, registerRefresh, unregisterRefresh]);

  // Keyboard shortcut for Add New (Ctrl+N or Cmd+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowAddNoteModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save data on change
  useEffect(() => {
    if (data && hasAccess) {
      persistNotesData(data);
    }
  }, [data, hasAccess]);

  // Calculate active group and tab (before conditional returns)
  const activeGroup = data?.groups.find((g) => g.id === data?.activeGroupId);
  const activeTab = activeGroup?.tabs.find((t) => t.id === data?.activeTabId);

  // Sort and filter notes based on sortMode and search (must be before conditional returns)
  const sortedNotes = useMemo(() => {
    if (!activeTab) return [];
    
    let notes = [...activeTab.notes];
    
    // Ensure all notes have order field for custom sort
    if (sortMode === 'custom') {
      notes = notes.map((note, index) => ({
        ...note,
        order: note.order !== undefined ? note.order : index
      }));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      notes = notes.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.blocks.some(block => block.content.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    if (sortMode === 'custom') {
      return notes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } else if (sortMode === 'latest') {
      return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      return notes.sort((a, b) => a.createdAt - b.createdAt);
    }
  }, [activeTab, sortMode, searchQuery]);

  // Show loading while checking auth or access
  if (status === 'loading' || hasAccess === null) {
    return <Loading fullScreen />;
  }

  // Don't render if not authenticated or no access
  if (status === 'unauthenticated' || hasAccess === false) {
    return null;
  }

  if (!data) {
    return <Loading fullScreen />;
  }

  // Group Management
  const handleGroupChange = (groupId: string) => {
    const group = data.groups.find((g) => g.id === groupId);
    if (group) {
      setData({
        ...data,
        activeGroupId: groupId,
        activeTabId: group.tabs[0].id,
      });
    }
  };

  const handleAddGroup = (name: string) => {
    // Limit to maximum 2 groups
    if (data.groups.length >= 2) {
      alert('You can have at most 2 groups. Please delete a group before creating a new one.');
      return;
    }

    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name,
      tabs: [
        {
          id: `tab-${Date.now()}`,
          name: 'Tab 1',
          notes: [],
        },
      ],
    };

    setData({
      ...data,
      groups: [...data.groups, newGroup],
      activeGroupId: newGroup.id,
      activeTabId: newGroup.tabs[0].id,
    });
  };

  const handleDeleteGroup = async (groupId: string) => {
    // Prevent deletion of work group
    if (groupId.startsWith('work-')) {
      alert('The "Work" group cannot be deleted.');
      return;
    }

    try {
      // Call API to delete group and all its notes
      const response = await fetch(`/api/notes/group?id=${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to delete group:', error);
        alert('Failed to delete group. Please try again.');
        return;
      }

      // Update local state
      const filteredGroups = data.groups.filter((g) => g.id !== groupId);
      if (filteredGroups.length === 0) return;

      setData({
        ...data,
        groups: filteredGroups,
        activeGroupId: filteredGroups[0].id,
        activeTabId: filteredGroups[0].tabs[0].id,
      });

      setDeletingGroupId(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    }
  };

  const handleUpdateGroupName = (groupId: string, newName: string) => {
    const updatedGroups = data.groups.map((g) =>
      g.id === groupId ? { ...g, name: newName } : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });
  };

  // Tab Management
  const handleTabChange = (tabId: string) => {
    setData({
      ...data,
      activeTabId: tabId,
    });
  };

  const handleAddTab = () => {
    if (!activeGroup || activeGroup.tabs.length >= 3) return;

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      name: `Tab ${activeGroup.tabs.length + 1}`,
      notes: [],
    };

    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? { ...g, tabs: [...g.tabs, newTab] }
        : g
    );

    setData({
      ...data,
      groups: updatedGroups,
      activeTabId: newTab.id,
    });
  };

  const handleDeleteTab = (tabId: string) => {
    if (!activeGroup || activeGroup.tabs.length <= 1) return;

    // Check if tab has notes
    const tabToDelete = activeGroup.tabs.find((t) => t.id === tabId);
    if (tabToDelete && tabToDelete.notes.length > 0) {
      setTabDeleteWarning(true);
      return;
    }

    const updatedTabs = activeGroup.tabs.filter((t) => t.id !== tabId);
    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId ? { ...g, tabs: updatedTabs } : g
    );

    setData({
      ...data,
      groups: updatedGroups,
      activeTabId: updatedTabs[0].id,
    });
  };

  const handleUpdateTabName = (tabId: string, newName: string) => {
    if (!activeGroup) return;

    const updatedTabs = activeGroup.tabs.map((t) =>
      t.id === tabId ? { ...t, name: newName } : t
    );
    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId ? { ...g, tabs: updatedTabs } : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });
  };

  // Note Management
  const handleAddNote = (title: string, blocks: TextBlock[]) => {
    if (!activeGroup || !activeTab) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title,
      blocks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: activeTab.notes.length, // Assign order based on current length
    };

    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? {
          ...g,
          tabs: g.tabs.map((t) =>
            t.id === data.activeTabId
              ? { ...t, notes: [...t.notes, newNote] }
              : t
          ),
        }
        : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });
  };

  const handleQuickAdd = async () => {
    if (!activeGroup || !activeTab) return;

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        console.log('Clipboard is empty');
        return;
      }

      // Auto-detect note type
      let noteType: NoteType = 'snippet';
      if (clipboardText.startsWith('http://') || clipboardText.startsWith('https://')) {
        noteType = 'link';
      }

      const block: TextBlock = {
        id: `block-${Date.now()}`,
        type: noteType,
        content: clipboardText.trim(),
        copyMode: 'passive',
        completed: false,
      };

      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: `Note ${(activeTab.notes.length + 1)}`,
        blocks: [block],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: activeTab.notes.length, // Assign order based on current length
      };

      const updatedGroups = data.groups.map((g) =>
        g.id === data.activeGroupId
          ? {
            ...g,
            tabs: g.tabs.map((t) =>
              t.id === data.activeTabId
                ? { ...t, notes: [...t.notes, newNote] }
                : t
            ),
          }
          : g
      );

      setData({
        ...data,
        groups: updatedGroups,
      });

      console.log('✓ Note created from clipboard');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleAddBlock = (noteId: string, type: NoteType, content: string, copyMode: CopyMode) => {
    const newBlock: TextBlock = {
      id: `block-${Date.now()}`,
      type,
      content,
      copyMode,
      completed: type === 'todo' ? false : undefined,
    };

    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? {
          ...g,
          tabs: g.tabs.map((t) =>
            t.id === data.activeTabId
              ? {
                ...t,
                notes: t.notes.map((n) =>
                  n.id === noteId
                    ? { ...n, blocks: [...n.blocks, newBlock], updatedAt: Date.now() }
                    : n
                ),
              }
              : t
          ),
        }
        : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });
  };

  const handleReorderNotes = (reorderedNotes: Note[]) => {
    // Switch to custom sort mode when user drags to reorder
    setSortMode('custom');
    
    // Assign order indices to reordered notes
    const notesWithOrder = reorderedNotes.map((note, index) => ({
      ...note,
      order: index,
    }));

    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? {
          ...g,
          tabs: g.tabs.map((t) =>
            t.id === data.activeTabId ? { ...t, notes: notesWithOrder } : t
          ),
        }
        : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });
  };

  const handleEditNote = (updatedNote: Note) => {
    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? {
          ...g,
          tabs: g.tabs.map((t) =>
            t.id === data.activeTabId
              ? {
                ...t,
                notes: t.notes.map((n) =>
                  n.id === updatedNote.id ? updatedNote : n
                ),
              }
              : t
          ),
        }
        : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });

    setEditingNote(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      // Call DELETE API to soft delete the note
      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to delete note:', error);
        alert('Failed to delete note. Please try again.');
        return;
      }

      // Update local state to remove the note from UI
      const updatedGroups = data.groups.map((g) =>
        g.id === data.activeGroupId
          ? {
              ...g,
              tabs: g.tabs.map((t) =>
                t.id === data.activeTabId
                  ? { ...t, notes: t.notes.filter((n) => n.id !== noteId) }
                  : t
              ),
            }
          : g
      );

      setData({
        ...data,
        groups: updatedGroups,
      });

      setDeletingNoteId(null);
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleToggleTodo = (noteId: string, blockId: string) => {
    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? {
          ...g,
          tabs: g.tabs.map((t) =>
            t.id === data.activeTabId
              ? {
                ...t,
                notes: t.notes.map((n) =>
                  n.id === noteId
                    ? {
                      ...n,
                      blocks: n.blocks.map((b) =>
                        b.id === blockId && b.type === 'todo'
                          ? { ...b, completed: !b.completed }
                          : b
                      ),
                      updatedAt: Date.now(),
                    }
                    : n
                ),
              }
              : t
          ),
        }
        : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });
  };

  const handleBlockContextMenu = (e: React.MouseEvent, note: Note, block: TextBlock) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      note,
      block,
    });
  };

  const handleEditBlock = (updatedBlock: TextBlock) => {
    if (!editingBlock) return;

    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? {
          ...g,
          tabs: g.tabs.map((t) =>
            t.id === data.activeTabId
              ? {
                ...t,
                notes: t.notes.map((n) =>
                  n.id === editingBlock.note.id
                    ? {
                      ...n,
                      blocks: n.blocks.map((b) =>
                        b.id === editingBlock.block.id ? updatedBlock : b
                      ),
                      updatedAt: Date.now(),
                    }
                    : n
                ),
              }
              : t
          ),
        }
        : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });

    setEditingBlock(null);
  };

  const handleDeleteBlock = () => {
    if (!deletingBlock) return;

    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? {
          ...g,
          tabs: g.tabs.map((t) =>
            t.id === data.activeTabId
              ? {
                ...t,
                notes: t.notes.map((n) =>
                  n.id === deletingBlock.noteId
                    ? {
                      ...n,
                      blocks: n.blocks.filter((b) => b.id !== deletingBlock.blockId),
                      updatedAt: Date.now(),
                    }
                    : n
                ),
              }
              : t
          ),
        }
        : g
    );

    setData({
      ...data,
      groups: updatedGroups,
    });

    setDeletingBlock(null);
  };

  return (
    <div className="p-2 md:p-4 min-h-screen">
      <div className="w-full mx-auto">

        {/* Tab Bar - Moved above search */}
        {activeGroup && (
          <TabBar
            tabs={activeGroup.tabs}
            activeTabId={data.activeTabId}
            onTabChange={handleTabChange}
            onAddTab={handleAddTab}
            onDeleteTab={handleDeleteTab}
            onUpdateTabName={handleUpdateTabName}
          />
        )}

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Projects..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
            />
          </div>
          {/* Filter button - Commented out for now */}
          {/* <button
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background/50 flex-shrink-0",
              "hover:bg-foreground/10 transition-all"
            )}
            title="Filter"
          >
            <Filter className="w-4 h-4 text-foreground/70" />
          </button> */}
          {/* Grid/List View Toggle - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1 border border-border rounded-lg bg-background/50 p-1 flex-shrink-0">
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
          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border border-border",
                "bg-background/50 hover:bg-foreground/10 transition-all font-medium"
              )}
            >
              {sortMode === 'custom' && <ArrowUpDown className="w-4 h-4" />}
              {sortMode === 'latest' && <ArrowDown className="w-4 h-4" />}
              {sortMode === 'oldest' && <ArrowUp className="w-4 h-4" />}
            </button>
            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-xl z-20 py-2">
                  <button
                    onClick={() => {
                      setSortMode('custom');
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-foreground/5 transition-colors flex items-center gap-2",
                      sortMode === 'custom' && "bg-primary/10 text-primary"
                    )}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Custom Order
                  </button>
                  <button
                    onClick={() => {
                      setSortMode('latest');
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-foreground/5 transition-colors flex items-center gap-2",
                      sortMode === 'latest' && "bg-primary/10 text-primary"
                    )}
                  >
                    <ArrowDown className="w-4 h-4" />
                    Latest First
                  </button>
                  <button
                    onClick={() => {
                      setSortMode('oldest');
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-foreground/5 transition-colors flex items-center gap-2",
                      sortMode === 'oldest' && "bg-primary/10 text-primary"
                    )}
                  >
                    <ArrowUp className="w-4 h-4" />
                    Oldest First
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await loadData();
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg border border-border",
              "bg-background/50 hover:bg-foreground/10 transition-all",
              "disabled:opacity-50"
            )}
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
          {/* Add New Button */}
          <button
            onClick={() => setShowAddNoteModal(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border",
              "bg-background/50 hover:bg-foreground/10 transition-all font-medium text-sm flex-shrink-0",
              "hidden sm:flex"
            )}
            title="Add New Note (Ctrl+N)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Add New...</span>
            <ChevronDown className="w-3.5 h-3.5 hidden md:inline" />
            <span className="text-xs text-foreground/50 ml-1 hidden md:inline">^N</span>
          </button>
          <GroupSelector
            groups={data.groups}
            activeGroupId={data.activeGroupId}
            onGroupChange={handleGroupChange}
            onAddGroup={handleAddGroup}
            onDeleteGroup={(groupId) => setDeletingGroupId(groupId)}
            onUpdateGroupName={handleUpdateGroupName}
          />
        </div>

        {/* Notes List */}
        {activeTab && (
          <NotesList
            notes={sortedNotes}
            viewMode={viewMode}
            onReorder={handleReorderNotes}
            onEditNote={setEditingNote}
            onDeleteNote={setDeletingNoteId}
            onAddBlock={handleAddBlock}
            onToggleTodo={handleToggleTodo}
            onBlockContextMenu={handleBlockContextMenu}
          />
        )}

        {/* Modals */}
        <AddNoteModal
          isOpen={showAddNoteModal}
          onAdd={handleAddNote}
          onQuickAdd={handleQuickAdd}
          onCancel={() => setShowAddNoteModal(false)}
        />
        <NoteEditModal
          isOpen={!!editingNote}
          note={editingNote}
          onSave={handleEditNote}
          onCancel={() => setEditingNote(null)}
        />

        <ConfirmDialog
          isOpen={!!deletingNoteId}
          title="Delete Note"
          message="Are you sure you want to delete this note? This action cannot be undone."
          onConfirm={() => deletingNoteId && handleDeleteNote(deletingNoteId)}
          onCancel={() => setDeletingNoteId(null)}
        />

        {/* Block Edit Modal */}
        <BlockEditModal
          isOpen={!!editingBlock}
          block={editingBlock?.block || null}
          onSave={handleEditBlock}
          onCancel={() => setEditingBlock(null)}
        />

        {/* Block Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deletingBlock}
          title="Delete Block"
          message="Are you sure you want to delete this block? This action cannot be undone."
          onConfirm={handleDeleteBlock}
          onCancel={() => setDeletingBlock(null)}
        />

        {/* Tab Delete Warning */}
        <ConfirmDialog
          isOpen={tabDeleteWarning}
          title="Cannot Delete Tab"
          message="This tab contains notes and cannot be deleted. Please remove all notes from the tab before deleting it."
          onConfirm={() => setTabDeleteWarning(false)}
          onCancel={() => setTabDeleteWarning(false)}
        />

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onEdit={() => {
              setEditingBlock({ note: contextMenu.note, block: contextMenu.block });
              setContextMenu(null);
            }}
            onDelete={() => {
              setDeletingBlock({ noteId: contextMenu.note.id, blockId: contextMenu.block.id });
              setContextMenu(null);
            }}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Delete Group Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!deletingGroupId}
          title="Delete Group"
          message="Are you sure you want to delete this group? All notes in this group will be permanently deleted. This action cannot be undone."
          onConfirm={() => deletingGroupId && handleDeleteGroup(deletingGroupId)}
          onCancel={() => setDeletingGroupId(null)}
          showCancel={true}
          confirmText="Delete"
          destructive={true}
        />
      </div>
    </div>
  );
}
