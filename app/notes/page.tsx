"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NotesData, Note, TextBlock, NoteType, CopyMode, Tab, Group } from '@/lib/notes/types';
import { fetchNotesData, persistNotesData } from '@/lib/notes/storage';
import { GroupSelector } from '@/components/notes/group-selector';
import { TabBar } from '@/components/notes/tab-bar';
import { AddNoteForm } from '@/components/notes/add-note-form';
import { NotesList } from '@/components/notes/notes-list';
import { NoteEditModal } from '@/components/notes/note-edit-modal';
import { BlockEditModal } from '@/components/notes/block-edit-modal';
import { ConfirmDialog } from '@/components/notes/confirm-dialog';
import { ContextMenu } from '@/components/notes/context-menu';
import { Loading } from '@/components/ui/loading';

export default function NotesPage() {
  const router = useRouter();
  const { status } = useSession();

  // All hooks must be called before any conditional returns
  const [data, setData] = useState<NotesData | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingBlock, setEditingBlock] = useState<{ note: Note; block: TextBlock } | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<{ noteId: string; blockId: string } | null>(null);
  const [tabDeleteWarning, setTabDeleteWarning] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    note: Note;
    block: TextBlock;
  } | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedData = await fetchNotesData();
      setData(loadedData);
    };
    loadData();
  }, []);

  // Save data on change
  useEffect(() => {
    if (data) {
      persistNotesData(data);
    }
  }, [data]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return <Loading fullScreen />;
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  if (!data) {
    return <Loading fullScreen />;
  }

  const activeGroup = data.groups.find((g) => g.id === data.activeGroupId);
  const activeTab = activeGroup?.tabs.find((t) => t.id === data.activeTabId);

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
    // Limit to maximum 3 groups
    if (data.groups.length >= 3) {
      alert('You can have at most 3 groups. Please delete a group before creating a new one.');
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

  const handleDeleteGroup = (groupId: string) => {
    const filteredGroups = data.groups.filter((g) => g.id !== groupId);
    if (filteredGroups.length === 0) return;

    setData({
      ...data,
      groups: filteredGroups,
      activeGroupId: filteredGroups[0].id,
      activeTabId: filteredGroups[0].tabs[0].id,
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

  // Note Management
  const handleAddNote = (title: string, blocks: TextBlock[]) => {
    if (!activeGroup || !activeTab) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title,
      blocks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
    const updatedGroups = data.groups.map((g) =>
      g.id === data.activeGroupId
        ? {
          ...g,
          tabs: g.tabs.map((t) =>
            t.id === data.activeTabId ? { ...t, notes: reorderedNotes } : t
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
    <div className="p-2 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Notes</h1>
          <GroupSelector
            groups={data.groups}
            activeGroupId={data.activeGroupId}
            onGroupChange={handleGroupChange}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        </div>

        {/* Tab Bar */}
        {activeGroup && (
          <TabBar
            tabs={activeGroup.tabs}
            activeTabId={data.activeTabId}
            onTabChange={handleTabChange}
            onAddTab={handleAddTab}
            onDeleteTab={handleDeleteTab}
          />
        )}

        {/* Add Note Form */}
        <AddNoteForm onAdd={handleAddNote} onQuickAdd={handleQuickAdd} />

        {/* Notes List */}
        {activeTab && (
          <NotesList
            notes={activeTab.notes}
            onReorder={handleReorderNotes}
            onEditNote={setEditingNote}
            onDeleteNote={setDeletingNoteId}
            onAddBlock={handleAddBlock}
            onToggleTodo={handleToggleTodo}
            onBlockContextMenu={handleBlockContextMenu}
          />
        )}

        {/* Modals */}
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
      </div>
    </div>
  );
}
