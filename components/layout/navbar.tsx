"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Palette, Menu, X, LogOut, Bell, Plus, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { themes, type Theme } from "@/lib/theme-config";
import { ThemeCustomizer } from "./theme-customizer";
import { ThemeSwatch } from "./theme-swatch";
import { PulseDot } from "@/components/ui/pulse-dot";
import { BackgroundUpload } from "./background-upload";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { useSession, signOut } from "next-auth/react";
import { ConfirmDialog } from "@/components/notes/confirm-dialog";
import { Notifications } from "./notifications";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { isMobileSidebarOpen, setIsMobileSidebarOpen, isCollapsed } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  if (!mounted) {
    return null;
  }

  const presetThemes = themes.filter((t) => t !== "custom");

  return (
    <TooltipProvider>
      <nav 
        className={cn(
          "fixed top-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border z-40 flex items-center justify-between px-3 md:px-6 h-14 transition-all duration-500 ease-in-out"
        )}
        style={{
          left: typeof window !== 'undefined' && window.innerWidth < 768 
            ? '0' 
            : (isCollapsed ? '4rem' : '16rem'),
          transition: 'left 500ms ease-in-out'
        }}
      >
        {/* Left side - DevUtils */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* DevUtils */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded overflow-hidden border border-border/50 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold text-foreground">DevUtils</span>
          </div>
        </div>

        {/* Right side - Actions and user controls */}
        <div className="flex items-center gap-3">
          {/* Online/Offline Indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-foreground/10 transition-colors cursor-pointer">
                <PulseDot isOnline={isOnline} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isOnline ? "Online" : "Offline"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Selector */}
          <div className="relative" ref={menuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="h-8 w-8"
                >
                  <Palette className="w-4 h-4 text-foreground/70" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Change Theme</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Notifications />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>

          {/* User Avatar with Dropdown */}
          {session?.user && (
            <div className="relative" ref={profileMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-pink-500 text-white text-xs font-semibold hover:ring-2 hover:ring-foreground/20"
              >
                {session.user.name?.charAt(0) || 'U'}
              </Button>
              
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border/50 rounded-lg shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-100">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push('/profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full justify-start px-4 h-10"
                  >
                    <User className="w-4 h-4 text-foreground/70" />
                    <span className="text-sm text-foreground">Profile</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowLogoutConfirm(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full justify-start px-4 h-10 text-red-500 hover:text-red-500"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>
      </nav>

      {/* Theme Menu Modal - Rendered outside nav */}
      {showThemeMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-100"
            onClick={() => setShowThemeMenu(false)}
          />
          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-101">
            <div
              className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden pointer-events-auto"
              style={{
                maxHeight: 'calc(100vh - 2rem)',
                margin: 'auto'
              }}
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h3 className="text-lg font-bold">Theme</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowThemeMenu(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div 
                className="overflow-y-auto p-6 space-y-4 flex-1 min-h-0"
              >
                <div className="grid grid-cols-4 gap-3">
                  {presetThemes.map((themeOption) => (
                    <ThemeSwatch
                      key={themeOption}
                      themeKey={themeOption}
                      isActive={theme === themeOption}
                      onClick={(e) => {
                        e?.stopPropagation();
                        setTheme(themeOption);
                        setShowThemeMenu(false);
                      }}
                    />
                  ))}
                </div>
                <div className="pt-4 border-t border-border/50">
                  <ThemeCustomizer
                    onOpen={() => {
                      setShowThemeMenu(false);
                      setShowCustomTheme(true);
                    }}
                    isOpen={showCustomTheme}
                    onClose={() => setShowCustomTheme(false)}
                  />
                </div>
                <div>
                  <BackgroundUpload />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Render custom theme modal outside dropdown so it persists */}
      {showCustomTheme && (
        <ThemeCustomizer
          isOpen={showCustomTheme}
          onClose={() => setShowCustomTheme(false)}
        />
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        onConfirm={() => {
          signOut({ callbackUrl: "/login" });
          setShowLogoutConfirm(false);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        showCancel={true}
        confirmText="Sign Out"
        destructive={false}
      />
    </TooltipProvider>
  );
}
