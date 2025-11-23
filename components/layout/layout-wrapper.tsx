"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { InstallPrompt } from "./install-prompt";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authState } = useAuth();
  const isSignInPage = pathname === "/sign-in";
  const shouldShowLayout = authState.isAuthenticated || !isSignInPage;

  // On sign-in page, hide sidebar and navbar
  if (isSignInPage) {
    return <>{children}</>;
  }

  // Show layout for authenticated users or other pages
  return (
    <SidebarProvider>
      <Navbar />
      <Sidebar />
      <main className="pt-16 md:pr-20 pr-4 min-h-screen">{children}</main>
      <InstallPrompt />
    </SidebarProvider>
  );
}

