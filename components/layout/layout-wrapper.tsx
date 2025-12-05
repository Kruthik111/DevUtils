"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { InstallPrompt } from "./install-prompt";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login") || pathname.startsWith("/signin");

  // On login/signin page, hide sidebar and navbar
  if (isLoginPage) {
    return <div className="w-full h-full">{children}</div>;
  }

  // Show layout for all other pages
  return (
    <SidebarProvider>
      <Navbar />
      <Sidebar />
      <main className="pt-16 md:pr-20 pr-4 min-h-screen">{children}</main>
      <InstallPrompt />
    </SidebarProvider>
  );
}

