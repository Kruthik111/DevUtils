"use client";

import { X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                {/* Header with X close */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Message */}
                <div className="px-6 py-4">
                    <p className="text-foreground/80">{message}</p>
                </div>

                {/* Footer with single OK button */}
                <div className="flex justify-end px-6 py-4 border-t border-border/30">
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
