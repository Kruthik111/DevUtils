"use client";

import { createContext, useContext, useState, ReactNode } from "react";

const SidebarContext = createContext<{
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}>({
  isMobileSidebarOpen: false,
  setIsMobileSidebarOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isMobileSidebarOpen, setIsMobileSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

