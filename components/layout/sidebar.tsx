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
  Sparkles,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  BookOpen,
  QrCode,
  Share2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ThemeSelector } from "./theme-selector";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  adminOnly?: boolean;
  authRequired?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      // { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", authRequired: true },
      { id: "notes", label: "Notes", icon: StickyNote, href: "/notes", authRequired: true },
      { id: "qr-generator", label: "Qr Code", icon: QrCode, href: "/qr-generator" },
      { id: "quick-share", label: "Quick Share", icon: Share2, href: "/quick-share" },
      { id: "api", label: "API", icon: Code, href: "/api", authRequired: true },
      { id: "json-tools", label: "JSON Tools", icon: Braces, href: "/json-tools" },
      { id: "better-prompts", label: "Better Prompts", icon: Sparkles, href: "/better-prompts" },
      { id: "readme-preview", label: "README Preview", icon: BookOpen, href: "/readme-preview" },
    ]
  },
  {
    label: "COMMUNITY",
    items: [
      { id: "feedback", label: "Feedback", icon: MessageSquare, href: "/feedback", authRequired: true },
      { id: "admin-users", label: "Users", icon: Shield, href: "/admin/users", adminOnly: true, authRequired: true },
      { id: "admin-notifications", label: "Notifications", icon: Bell, href: "/admin/notifications", adminOnly: true, authRequired: true },
      { id: "profile", label: "Profile", icon: User, href: "/profile", authRequired: true },
    ]
  }
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
      fetch('/api/users/access')
        .then(res => {
          if (res.ok) {
            setIsAdmin(true);
          }
        })
        .catch(() => { });
    }
  }, [session]);

  const renderNavItems = (items: NavItem[], mobile = false) => {
    return items.map((item) => {
      if (item.adminOnly && !isAdmin) return null;

      const Icon = item.icon;
      const isActive = pathname === item.href;

      const content = (
        <Link
          key={item.id}
          href={item.href}
          onClick={(e) => {
            if (item.authRequired && status === "unauthenticated") {
              e.preventDefault();
              if (mobile) setIsMobileSidebarOpen(false);
              toast.error("Please sign in or sign up to access this feature.");
              router.push("/signin");
            } else if (mobile) {
              setIsMobileSidebarOpen(false);
            }
          }}
          className={cn(
            "relative flex items-center gap-3 transition-all duration-300 ease-in-out px-4 py-3 rounded-2xl mx-2",
            isActive 
              ? "bg-primary/10 text-primary font-bold" 
              : "text-foreground hover:bg-foreground/5"
          )}
        >
          <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
          {(!isCollapsed || mobile) && (
            <span className="text-sm tracking-tight">{item.label}</span>
          )}
          {isActive && (
            <div className="absolute left-0 w-1 h-4 bg-primary rounded-full" />
          )}
        </Link>
      );

      if (isCollapsed && !mobile) {
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-bold">{item.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      }

      return content;
    });
  };

  return (
    <TooltipProvider>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen transition-all duration-500 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
        style={{ zIndex: 100 }}
      >
        <div className="h-full w-full bg-background border-r border-border flex flex-col overflow-hidden">
          {/* Brand Logo */}
          <div className={cn("p-6 flex items-center gap-3", isCollapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-border/50">
              <img src="/logo.png" alt="DevUtils Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-black text-foreground uppercase tracking-tighter leading-none">
                    DevUtils
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsCollapsed(true)}
                      className="p-1.5 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
                      aria-label="Collapse sidebar"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-bold">Collapse sidebar (Ctrl+B)</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
          {isCollapsed && (
            <div className="px-4 pb-2 flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-1.5 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
                    aria-label="Expand sidebar"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-bold">Expand sidebar (Ctrl+B)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Nav Groups */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                {group.label && !isCollapsed && (
                  <div className="px-7 pb-2">
                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                      {group.label}
                    </span>
                  </div>
                )}
                {renderNavItems(group.items)}
              </div>
            ))}
          </div>

          {/* User Profile */}
          <div className="p-4 bg-secondary/50 border-t border-border mt-auto">
            <div className="mb-4">
              <ThemeSelector collapsed={isCollapsed} />
            </div>
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black shadow-inner">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-foreground truncate uppercase">
                    {session?.user?.name || 'User'}
                  </div>
                  <div className="text-[10px] text-foreground/60 truncate font-bold">
                    {session?.user?.email}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <aside
          className="fixed left-0 top-0 h-full w-72 z-50 md:hidden bg-background border-r border-border shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-border/50">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-foreground uppercase tracking-tighter">DevUtils</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="text-foreground/30 hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 space-y-8">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                {group.label && (
                  <div className="px-6 pb-2">
                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                      {group.label}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {renderNavItems(group.items, true)}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile User Footer */}
          {session?.user && (
            <div className="p-6 border-t border-border bg-secondary/50 mt-auto">
              <div className="mb-6">
                <ThemeSelector />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black">
                  {session.user.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-black text-foreground uppercase">
                    {session.user.name || 'User'}
                  </div>
                  <div className="text-[10px] text-foreground/60 font-bold">
                    {session.user.email}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}
    </TooltipProvider>
  );
}

