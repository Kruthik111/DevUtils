"use client";

import { useState } from 'react';
import { Plus, Clipboard } from 'lucide-react';
import { NoteType, CopyMode, TextBlock } from '@/lib/notes/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddNoteFormProps {
    onAdd: (title: string, blocks: TextBlock[]) => void;
    onQuickAdd: () => void;
}

export function AddNoteForm({ onAdd, onQuickAdd }: AddNoteFormProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [noteType, setNoteType] = useState<NoteType>('snippet');
    const [copyMode, setCopyMode] = useState<CopyMode>('passive');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const handleAdd = () => {
        if (title.trim() && content.trim()) {
            const initialBlock: TextBlock = {
                id: `block-${Date.now()}`,
                type: noteType,
                content: content.trim(),
                copyMode,
                completed: noteType === 'todo' ? false : undefined,
            };

            onAdd(title.trim(), [initialBlock]);
            setTitle('');
            setContent('');
            setIsExpanded(false);
            setIsFormVisible(false);
        }
    };

    const handleQuickAdd = async () => {
        await onQuickAdd();
    };

    if (!isFormVisible) {
        return (
            <TooltipProvider>
                <div className="flex gap-3 mb-6">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setIsFormVisible(true)}
                                className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Add Note</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleQuickAdd}
                                className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg"
                            >
                                <Clipboard className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Quick Add</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        );
    }
    return (
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
                {/* Note Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Note Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-medium"
                        placeholder="Enter note title..."
                        autoFocus
                    />
                </div>

                {/* Note Type Selector */}
                <div>
                    <label className="block text-sm font-medium mb-2">First Block Type</label>
                    <div className="flex gap-2">
                        {(['link', 'snippet', 'todo'] as NoteType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setNoteType(type)}
                                className={`px-4 py-2 rounded-lg border transition-colors capitalize font-medium ${noteType === type
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-border/50 hover:bg-foreground/5 text-foreground'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y font-mono text-sm transition-all"
                        placeholder={
                            noteType === 'link'
                                ? 'Enter URL...'
                                : noteType === 'snippet'
                                    ? 'Enter code or text...'
                                    : 'Enter todo item...'
                        }
                        rows={isExpanded ? 4 : 2}
                    />
                </div>

                {/* Copy Mode (shown when expanded) */}
                {isExpanded && noteType === 'snippet' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium mb-2">Copy Mode</label>
                        <div className="flex gap-2">
                            {(['active', 'passive'] as CopyMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setCopyMode(mode)}
                                    className={`px-4 py-2 rounded-lg border transition-colors capitalize font-medium ${copyMode === mode
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-border/50 hover:bg-foreground/5 text-foreground'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-foreground/50 mt-1">
                            {copyMode === 'active'
                                ? 'Click anywhere on the block to copy'
                                : 'Click the copy icon to copy'}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleAdd}
                        disabled={!title.trim() || !content.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Create Note
                    </button>
                    <button
                        onClick={() => {
                            setIsFormVisible(false);
                            setTitle('');
                            setContent('');
                            setIsExpanded(false);
                        }}
                        className="px-4 py-3 rounded-lg border border-border/50 hover:bg-foreground/5 transition-all text-foreground font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
