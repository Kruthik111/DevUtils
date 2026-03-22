"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { themes, themeConfig, type Theme } from "@/lib/theme-config";
import { cn } from "@/lib/utils";
import { Palette, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ThemeSelectorProps {
  collapsed?: boolean;
}

export function ThemeSelector({ collapsed }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-300",
            "text-foreground/50 hover:text-foreground hover:bg-foreground/5",
            collapsed && "justify-center px-0"
          )}
          title="Change Theme"
        >
          <Palette className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Appearance</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? "right" : "start"} className="w-56 p-2 bg-background border-border shadow-2xl rounded-2xl">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2 py-1.5">
          Select Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <div className="grid grid-cols-1 gap-1 pt-1">
          {themes.filter(t => t !== "custom").map((t) => {
            const config = themeConfig[t as keyof typeof themeConfig];
            if (!config) return null;
            
            return (
              <DropdownMenuItem
                key={t}
                onClick={() => setTheme(t as Theme)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all",
                  theme === t ? "bg-primary/10 text-primary" : "hover:bg-foreground/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: config.primary }}
                  />
                  <span className="text-sm font-bold lowercase first-letter:uppercase">{config.name}</span>
                </div>
                {theme === t && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
