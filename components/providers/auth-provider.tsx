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
    }
  } else if (typeof window !== "undefined" && status === "unauthenticated") {
    window.localStorage.removeItem("devutils.access");
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

