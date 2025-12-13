"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  StickyNote,
  FlaskConical,
  Server,
  Database,
  Puzzle,
  User,
  Code,
  Shield
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: "notes", label: "Notes", icon: StickyNote, href: "/notes" },
  { id: "api", label: "API", icon: Code, href: "/api" },
  // { id: "test-tool", label: "Test Tool", icon: FlaskConical, href: "/test-tool" },
  // { id: "handle-server", label: "Handle Server", icon: Server, href: "/handle-server" },
  // { id: "extension", label: "Extension", icon: Puzzle, href: "/extension" },
  { id: "admin-users", label: "Users", icon: Shield, href: "/admin/users", adminOnly: true },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSidebar();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasApiAccess, setHasApiAccess] = useState(false);
  const [hasNotesAccess, setHasNotesAccess] = useState(false);

  useEffect(() => {
    if (session?.user?.email === 'gokruthik2003@gmail.com') {
      setIsAdmin(true);
      setHasApiAccess(true); // Admin has access to everything
      setHasNotesAccess(true);
    } else if (session?.user?.email) {
      // Check admin access
      fetch('/api/users/access')
        .then(res => {
          if (res.ok) setIsAdmin(true);
        })
        .catch(() => {});
      
      // Check API access by trying to fetch API configs
      // This will return 403 if user doesn't have access
      fetch('/api/api-configs')
        .then(res => {
          setHasApiAccess(res.ok); // 200-299 means access granted
        })
        .catch(() => {
          setHasApiAccess(false);
        });

      // Check Notes access by trying to fetch notes
      fetch('/api/notes')
        .then(res => {
          setHasNotesAccess(res.ok); // 200-299 means access granted
        })
        .catch(() => {
          setHasNotesAccess(false);
        });
    } else {
      setHasApiAccess(false);
      setHasNotesAccess(false);
    }
  }, [session]);

  return (
    <TooltipProvider>
      {/* Sidebar - same position for mobile and desktop, toggle on mobile */}
      <aside
        className={cn(
          "fixed right-4 top-1/2 -translate-y-1/2 z-50",
          // On mobile: toggle visibility, on desktop: always visible
          isMobileSidebarOpen ? "block md:block" : "hidden md:block"
        )}
      >
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-3 shadow-xl flex flex-col gap-2">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            // Hide API icon if user doesn't have API access
            if (item.id === 'api' && !hasApiAccess) return null;
            // Hide Notes icon if user doesn't have notes access
            if (item.id === 'notes' && !hasNotesAccess) return null;
            
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={() => {
                      // Close mobile sidebar when item is clicked (mobile only)
                      setIsMobileSidebarOpen(false);
                    }}
                    className={cn(
                      "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200",
                      "hover:bg-primary/10 hover:scale-110",
                      "active:scale-95",
                      isActive && "bg-primary/20 text-primary",
                      !isActive && "text-foreground/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="font-medium">{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </aside>
    </TooltipProvider>
  );
}

