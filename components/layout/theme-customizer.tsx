"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
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
  const { theme, setTheme, setCustomTheme: setProviderCustomTheme } = useTheme();
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
    setProviderCustomTheme(customTheme);
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
          <Button
            variant="ghost"
            onClick={handleOpen}
            className={cn(
              "relative w-12 h-12 rounded-xl border-2 transition-all p-0 overflow-hidden",
              "hover:scale-110 active:scale-95",
              theme === "custom" ? "border-primary shadow-lg" : "border-border/50"
            )}
          >
            <div className="w-full h-full from-purple-400 via-pink-400 to-orange-400" />
            {theme === "custom" && (
              <div className="absolute inset-0 rounded-xl border-2 border-primary" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Custom Theme</p>
        </TooltipContent>
      </Tooltip>

      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 z-[100]"
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
            className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden relative z-[101]"
            style={{
              maxHeight: 'calc(100vh - 2rem)',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h3 className="text-lg font-bold">Custom Theme</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (controlledIsOpen !== undefined) {
                    onClose?.();
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
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

            <div className="flex gap-2 p-6 border-t border-border/50">
              <Button
                onClick={handleApply}
                className="flex-1"
              >
                Apply Theme
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (controlledIsOpen !== undefined) {
                    onClose?.();
                  } else {
                    setIsOpen(false);
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

