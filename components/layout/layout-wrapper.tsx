"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/components/providers/sidebar-provider";
import { RefreshProvider } from "@/components/providers/refresh-provider";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { InstallPrompt } from "./install-prompt";
import { Footer } from "@/components/landing/footer";

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const [paddingLeft, setPaddingLeft] = useState('0');
  
  useEffect(() => {
    const updatePadding = () => {
      // Only add padding on desktop (md breakpoint and above)
      // On mobile, sidebar is overlay and doesn't need padding
      if (window.innerWidth >= 768) {
        setPaddingLeft(isCollapsed ? '4rem' : '16rem');
      } else {
        setPaddingLeft('0');
      }
    };
    
    // Set initial padding
    if (typeof window !== 'undefined') {
      updatePadding();
      window.addEventListener('resize', updatePadding);
      return () => window.removeEventListener('resize', updatePadding);
    }
  }, [isCollapsed]);
  
  return (
    <main 
      className="pt-14 min-h-screen transition-all duration-500 ease-in-out bg-background"
      style={{ 
        paddingLeft,
        transition: 'padding-left 500ms ease-in-out'
      }}
    >
      <div className="w-full h-full px-4 md:px-8 pb-8">{children}</div>
    </main>
  );
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login") || pathname.startsWith("/signin");
  const isLandingPage = pathname === "/";
  
  // Pages that should have footer
  const pagesWithFooter = ["/notes", "/api", "/profile"];
  const shouldShowFooter = pagesWithFooter.some(page => pathname.startsWith(page));

  // On login/signin page or landing page, hide sidebar and navbar
  if (isLoginPage || isLandingPage) {
    return <div className="w-full h-full">{children}</div>;
  }

  // Show layout for all other pages
  return (
    <RefreshProvider>
      <SidebarProvider>
        <Navbar />
        <Sidebar />
        <MainContent>{children}</MainContent>
        <Footer />
        <InstallPrompt />
      </SidebarProvider>
    </RefreshProvider>
  );
}

