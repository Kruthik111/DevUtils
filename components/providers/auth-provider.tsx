"use client";

import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const { data: session, status } = useSession();

  // Cache allowed access paths in localStorage after session loads
  if (typeof window !== "undefined" && status === "authenticated") {
    const accessFromSession = (session?.user as any)?.hasAccess as string[] | undefined;
    const cached = window.localStorage.getItem("devutils.access");
    const existing = cached ? JSON.parse(cached) : null;

    if (accessFromSession && accessFromSession.length) {
      window.localStorage.setItem("devutils.access", JSON.stringify(accessFromSession));
    } else if (!existing) {
      // Fetch user access (works for non-admin too)
      fetch("/api/user/access")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.hasAccess) {
            window.localStorage.setItem("devutils.access", JSON.stringify(data.hasAccess));
          } else {
            // As a last resort, probe admin-only endpoint once to grant wildcard
            const alreadyChecked = window.sessionStorage.getItem("devutils.admin-probe");
            if (!alreadyChecked) {
              window.sessionStorage.setItem("devutils.admin-probe", "1");
              fetch("/api/users/access")
                .then((res) => {
                  if (res.ok) {
                    window.localStorage.setItem("devutils.access", JSON.stringify(["*"]));
                  }
                })
                .catch(() => { /* ignore */ });
            }
          }
        })
        .catch(() => { /* ignore */ });
    }
  } else if (typeof window !== "undefined" && status === "unauthenticated") {
    window.localStorage.removeItem("devutils.access");
    window.sessionStorage.removeItem("devutils.admin-probe");
  }

  return {
    authState: {
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      user: session?.user,
    },
    signIn,
    signOut,
  };
}

