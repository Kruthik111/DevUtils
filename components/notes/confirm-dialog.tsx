"use client";

import { X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    /**
     * If true, shows Cancel and Confirm buttons (for delete actions)
     * If false, shows only OK button (for info/acknowledgment)
     */
    showCancel?: boolean;
    /**
     * Custom text for confirm button (default: "OK" or "Confirm")
     */
    confirmText?: string;
    /**
     * Custom text for cancel button (default: "Cancel")
     */
    cancelText?: string;
    /**
     * If true, confirm button will be red (for destructive actions)
     */
    destructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    showCancel = false,
    confirmText,
    cancelText = "Cancel",
    destructive = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const defaultConfirmText = showCancel ? (confirmText || "Confirm") : (confirmText || "OK");
    const confirmButtonClass = destructive
        ? "px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all font-medium"
        : "px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium";

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

                {/* Footer with buttons */}
                <div className={`flex ${showCancel ? 'justify-end gap-3' : 'justify-end'} px-6 py-4 border-t border-border/30`}>
                    {showCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-2 rounded-lg bg-background border border-border/50 text-foreground hover:bg-foreground/5 transition-all font-medium"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={confirmButtonClass}
                    >
                        {defaultConfirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
