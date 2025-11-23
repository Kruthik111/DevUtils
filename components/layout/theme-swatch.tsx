"use client";

import { cn } from "@/lib/utils";
import { themeConfig, type Theme } from "@/lib/theme-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThemeSwatchProps {
  themeKey: Theme;
  isActive: boolean;
  onClick: () => void;
}

export function ThemeSwatch({ themeKey, isActive, onClick }: ThemeSwatchProps) {
  if (themeKey === "custom") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "relative w-12 h-12 rounded-xl border-2 transition-all",
              "hover:scale-110 active:scale-95",
              isActive ? "border-primary shadow-lg" : "border-border/50"
            )}
          >
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />
            {isActive && (
              <div className="absolute inset-0 rounded-xl border-2 border-primary" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Custom</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const theme = themeConfig[themeKey];
  if (!theme) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "relative w-12 h-12 rounded-xl border-2 transition-all",
            "hover:scale-110 active:scale-95",
            isActive ? "border-primary shadow-lg" : "border-border/50"
          )}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.secondary} 50%, ${theme.accent} 100%)`,
            }}
          />
          {/* Primary color accent */}
          <div
            className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-background/50"
            style={{ backgroundColor: theme.primary }}
          />
          {isActive && (
            <div className="absolute inset-0 rounded-xl border-2 border-primary" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{theme.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

