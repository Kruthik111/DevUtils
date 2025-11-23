"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/color-picker";
import type { CustomTheme } from "@/lib/theme-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CUSTOM_THEME_KEY = "devutils-custom-theme";

const defaultCustomTheme: CustomTheme = {
  background: "#f5f5f5",
  foreground: "#1a1a1a",
  primary: "#3b82f6",
  secondary: "#e5e7eb",
  accent: "#d1d5db",
};

interface ThemeCustomizerProps {
  onOpen?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ThemeCustomizer({ onOpen, isOpen: controlledIsOpen, onClose }: ThemeCustomizerProps = {}) {
  const { theme, setTheme } = useTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [customTheme, setCustomTheme] = useState<CustomTheme>(defaultCustomTheme);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledIsOpen !== undefined 
    ? (value: boolean) => { if (!value) onClose?.(); }
    : setInternalIsOpen;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CUSTOM_THEME_KEY);
      if (stored) {
        try {
          setCustomTheme(JSON.parse(stored));
        } catch {
          // Use default
        }
      }
    }
  }, []);

  useEffect(() => {
    if (theme === "custom" && typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--background", customTheme.background);
      root.style.setProperty("--foreground", customTheme.foreground);
      root.style.setProperty("--primary", customTheme.primary);
      root.style.setProperty("--secondary", customTheme.secondary);
      root.style.setProperty("--accent", customTheme.accent);
      
      // Save to localStorage
      localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(customTheme));
    }
  }, [customTheme, theme]);

  const handleColorChange = (key: keyof CustomTheme, value: string) => {
    setCustomTheme((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setTheme("custom");
    if (controlledIsOpen !== undefined) {
      onClose?.();
    } else {
      setIsOpen(false);
    }
  };

  const handleOpen = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(true);
    }
    onOpen?.(); // Close the parent menu and open modal
  };

  return (
    <>
      {/* Always render button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleOpen}
            className={cn(
              "relative w-12 h-12 rounded-xl border-2 transition-all",
              "hover:scale-110 active:scale-95",
              theme === "custom" ? "border-primary shadow-lg" : "border-border/50"
            )}
          >
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />
            {theme === "custom" && (
              <div className="absolute inset-0 rounded-xl border-2 border-primary" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Custom Theme</p>
        </TooltipContent>
      </Tooltip>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (controlledIsOpen !== undefined) {
                onClose?.();
              } else {
                setIsOpen(false);
              }
            }
          }}
        >
          <div 
            className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
            style={{ 
              maxHeight: 'calc(100vh - 2rem)',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50 flex-shrink-0">
              <h3 className="text-lg font-bold">Custom Theme</h3>
              <button
                onClick={() => {
                  if (controlledIsOpen !== undefined) {
                    onClose?.();
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background/80 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1 min-h-0">
              <ColorPicker
                label="Background"
                value={customTheme.background}
                onChange={(color) => handleColorChange("background", color)}
              />
              <ColorPicker
                label="Foreground"
                value={customTheme.foreground}
                onChange={(color) => handleColorChange("foreground", color)}
              />
              <ColorPicker
                label="Primary"
                value={customTheme.primary}
                onChange={(color) => handleColorChange("primary", color)}
              />
              <ColorPicker
                label="Secondary"
                value={customTheme.secondary}
                onChange={(color) => handleColorChange("secondary", color)}
              />
              <ColorPicker
                label="Accent"
                value={customTheme.accent}
                onChange={(color) => handleColorChange("accent", color)}
              />
            </div>

            <div className="flex gap-2 p-6 border-t border-border/50 flex-shrink-0">
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium"
              >
                Apply Theme
              </button>
              <button
                onClick={() => {
                  if (controlledIsOpen !== undefined) {
                    onClose?.();
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="px-4 py-2 rounded-xl border border-border/50 hover:bg-background/80 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

