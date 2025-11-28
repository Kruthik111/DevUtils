"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Palette, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { themes, type Theme } from "@/lib/theme-config";
import { ThemeCustomizer } from "./theme-customizer";
import { ThemeSwatch } from "./theme-swatch";
import { PulseDot } from "@/components/ui/pulse-dot";
import { BackgroundUpload } from "./background-upload";
import { useSidebar } from "@/components/providers/sidebar-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSidebar();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const presetThemes = themes.filter((t) => t !== "custom");

  return (
    <TooltipProvider>
      <nav className={cn(
        "fixed top-0 left-0 md:right-4 right-0 bg-background/80 backdrop-blur-xl border-b border-border/50 z-40 flex items-center justify-between px-4 md:px-6 transition-all duration-300",
        isHeaderCollapsed ? "h-0 -translate-y-full opacity-0" : "h-16 translate-y-0 opacity-100"
      )}>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">
            DevUtils
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Online/Offline Indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200">
                <PulseDot isOnline={isOnline} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-700 dark:border-gray-300">
              <p>{isOnline ? "Online" : "Offline"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Selector */}
          <div className="relative" ref={menuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl",
                    "bg-background/50 hover:bg-background/80",
                    "border border-border/50",
                    "transition-all duration-200 hover:scale-105 active:scale-95"
                  )}
                >
                  <Palette className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-700 dark:border-gray-300">
                <p>Change Theme</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Theme Menu Modal */}
          {showThemeMenu && (
            <div
              className="fixed h-screen inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowThemeMenu(false);
                }
              }}
            >
              <div
                className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
                style={{
                  maxHeight: 'calc(100vh - 2rem)',
                  margin: 'auto'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                  <h3 className="text-lg font-bold">Theme</h3>
                  <button
                    onClick={() => setShowThemeMenu(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background/80 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto p-6 space-y-4 flex-1 min-h-0">
                  <div className="grid grid-cols-4 gap-3" onClick={(e) => e.stopPropagation()}>
                    {presetThemes.map((themeOption) => (
                      <ThemeSwatch
                        key={themeOption}
                        themeKey={themeOption}
                        isActive={theme === themeOption}
                        onClick={async () => {
                          await new Promise(resolve => setTimeout(resolve, 100));
                          setTheme(themeOption);
                          setShowThemeMenu(false);
                        }}
                      />
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                    <ThemeCustomizer
                      onOpen={() => {
                        setShowThemeMenu(false);
                        setShowCustomTheme(true);
                      }}
                      isOpen={showCustomTheme}
                      onClose={() => setShowCustomTheme(false)}
                    />
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <BackgroundUpload />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Sidebar Toggle */}
          <div className="md:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl",
                    "bg-background/50 hover:bg-background/80",
                    "border border-border/50",
                    "transition-all duration-200 hover:scale-105 active:scale-95",
                    isMobileSidebarOpen && "bg-primary/20 border-primary/50"
                  )}
                >
                  <Menu className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-700 dark:border-gray-300">
                <p>Menu</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </nav>

      {/* Collapse/Expand Toggle */}
      <button
        onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 hover:bg-background transition-all duration-300 shadow-lg",
          isHeaderCollapsed ? "top-2" : "top-14"
        )}
        title={isHeaderCollapsed ? "Show Header" : "Hide Header"}
      >
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-300",
          isHeaderCollapsed ? "rotate-180" : "rotate-0"
        )} />
      </button>

      {/* Render custom theme modal outside dropdown so it persists */}
      {showCustomTheme && (
        <ThemeCustomizer
          isOpen={showCustomTheme}
          onClose={() => setShowCustomTheme(false)}
        />
      )}
    </TooltipProvider>
  );
}
