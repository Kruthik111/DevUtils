"use client";

import { cn } from "@/lib/utils";
import { themeConfig, type Theme } from "@/lib/theme-config";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThemeSwatchProps {
  themeKey: Theme;
  isActive: boolean;
  onClick: (e?: React.MouseEvent) => void;
}

export function ThemeSwatch({ themeKey, isActive, onClick }: ThemeSwatchProps) {
  if (themeKey === "custom") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={(e) => {
              e?.stopPropagation();
              onClick(e);
            }}
            className={cn(
              "relative w-12 h-12 rounded-xl border-2 transition-all p-0 overflow-hidden",
              "hover:scale-110 active:scale-95",
              isActive ? "border-primary shadow-lg" : "border-border/50"
            )}
          >
            <div className="w-full h-full bg-linear-to-br from-purple-400 via-pink-400 to-orange-400" />
            {isActive && (
              <div className="absolute inset-0 rounded-xl border-2 border-primary" />
            )}
          </Button>
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
        <Button
          variant="ghost"
          onClick={(e) => {
            e?.stopPropagation();
            onClick(e);
          }}
          className={cn(
            "relative w-12 h-12 rounded-xl border-2 transition-all p-0 overflow-hidden",
            "hover:scale-110 active:scale-95",
            isActive ? "border-primary shadow-lg" : "border-border/50"
          )}
        >
          <div
            className="w-full h-full"
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
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{theme.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

