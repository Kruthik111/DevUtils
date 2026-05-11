"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const SidebarContext = createContext<{
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}>({
  isMobileSidebarOpen: false,
  setIsMobileSidebarOpen: () => {},
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const STORAGE_KEY = "devutils:sidebar-collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsedState] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setIsCollapsedState(true);
    } catch {}
  }, []);

  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {}
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const isEditable =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target?.isContentEditable;
        if (isEditable) return;
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
          setIsCollapsed(!isCollapsed);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed, isMobileSidebarOpen]);

  return (
    <SidebarContext.Provider value={{ isMobileSidebarOpen, setIsMobileSidebarOpen, isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}
