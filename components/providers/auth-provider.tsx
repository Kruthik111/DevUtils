"use client";

import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const { data: session, status } = useSession();

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

