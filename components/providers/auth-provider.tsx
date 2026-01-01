"use client";

import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const { data: session, status } = useSession();

  // Cache allowed access paths in localStorage after session loads
  if (typeof window !== "undefined" && status === "authenticated") {
    const access = (session?.user as any)?.hasAccess as string[] | undefined;
    if (access) {
      window.localStorage.setItem("devutils.access", JSON.stringify(access));
    } else {
      // If we don't have access list, probe admin-only endpoint once to grant wildcard
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

