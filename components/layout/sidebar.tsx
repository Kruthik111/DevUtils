"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  StickyNote,
  FlaskConical,
  Puzzle,
  User,
  Code,
  Shield,
  Bell,
  MessageSquare,
  Braces,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  adminOnly?: boolean;
  authRequired?: boolean;
}

const navItems: NavItem[] = [
  { id: "notes", label: "Notes", icon: StickyNote, href: "/notes", authRequired: true },
  { id: "api", label: "API", icon: Code, href: "/api", authRequired: true },
  { id: "json-tools", label: "JSON Tools", icon: Braces, href: "/json-tools" },
  // { id: "test-tool", label: "Test Tool", icon: FlaskConical, href: "/test-tool" },
  // { id: "extension", label: "Extension", icon: Puzzle, href: "/extension" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, href: "/feedback", authRequired: true },
  { id: "admin-users", label: "Users", icon: Shield, href: "/admin/users", adminOnly: true, authRequired: true },
  { id: "admin-notifications", label: "Notifications", icon: Bell, href: "/admin/notifications", adminOnly: true, authRequired: true },
  { id: "profile", label: "Profile", icon: User, href: "/profile", authRequired: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen, isCollapsed, setIsCollapsed } = useSidebar();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.email === 'gokruthik2003@gmail.com') {
      setIsAdmin(true);
    } else if (session?.user?.email) {
      // Check admin access
      fetch('/api/users/access')
        .then(res => {
          if (res.ok) {
            setIsAdmin(true);
          }
        })
        .catch(() => { });
    }
  }, [session]);

  return (
    <TooltipProvider>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-5 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Left side, collapsible */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen transition-all duration-500 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
        style={{
          zIndex: 10
        }}
      >
        <div className={cn(
          "h-full w-full bg-background/95 backdrop-blur-xl border-r border-border flex flex-col transition-all duration-500 ease-in-out",
          "shadow-md"
        )}>
          {/* Hamburger Menu Button */}
          <div className="flex items-center justify-between p-2  transition-all duration-500 ease-in-out">
            {!isCollapsed && (
              <span className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  D
                </div>
                <h2 className="text-lg font-bold text-foreground px-2 transition-opacity duration-500 ease-in-out">DevUtils</h2>
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                "hover:bg-foreground/10",
                "text-foreground hover:text-foreground"
              )}
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-2 overflow-y-auto">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;

              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        if (item.authRequired && status === "unauthenticated") {
                          e.preventDefault();
                          toast.error("Please sign in or sign up to access this feature.");
                          router.push("/signin");
                        }
                      }}
                      className={cn(
                        "relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-500 ease-in-out",
                        item.authRequired && status === "unauthenticated" ? "hover:cursor-not-allowed" : "hover:bg-foreground/10",
                        isActive && "bg-foreground/10 text-foreground",
                        !isActive && "text-foreground/70 hover:text-foreground"
                      )}
                    >
                      <Icon className="w-6 h-6 shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium text-sm transition-opacity duration-500 ease-in-out">{item.label}</span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p className="font-medium">{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
          <div className="p-4 border-t border-border/50 bg-background/95 backdrop-blur-sm shrink-0 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {session?.user?.name || 'User'}
                </div>
                <div className="text-xs text-foreground/60 truncate">{session?.user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar - Overlay style */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-19 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 h-full w-80 max-w-[85vw] z-20 md:hidden bg-background border-r border-border shadow-2xl overflow-hidden"
            style={{ zIndex: 20 }}
          >
            <div className="relative h-full w-full flex flex-col overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    D
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">DevUtils</div>
                    <div className="text-xs text-foreground/60">Development Tools</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:bg-foreground/10"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 py-2">
                {navItems.map((item) => {
                  if (item.adminOnly && !isAdmin) return null;

                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={(e) => {
                        if (item.authRequired && status === "unauthenticated") {
                          e.preventDefault();
                          setIsMobileSidebarOpen(false);
                          toast.error("Please sign in or sign up to access this feature.");
                          router.push("/signin");
                        } else {
                          setIsMobileSidebarOpen(false);
                        }
                      }}
                      className={cn(
                        "relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200",
                        item.authRequired && status === "unauthenticated" ? "hover:cursor-not-allowed" : "hover:bg-foreground/10",
                        isActive && "bg-foreground/10 text-foreground",
                        !isActive && "text-foreground/70 hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Footer - User Info */}
              {session?.user && (
                <div className="p-4 border-t border-border/50 bg-background/95 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                      {session.user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {session.user.name || 'User'}
                      </div>
                      <div className="text-xs text-foreground/60 truncate">
                        {session.user.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </TooltipProvider>
  );
}

