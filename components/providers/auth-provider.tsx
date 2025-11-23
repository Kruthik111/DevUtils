"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAuthState, setAuthState, clearAuthState, type AuthState } from "@/lib/auth";

interface AuthContextType {
  authState: AuthState;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthStateInternal] = useState<AuthState>({ isAuthenticated: false });

  useEffect(() => {
    const state = getAuthState();
    setAuthStateInternal(state);
  }, []);

  const signIn = () => {
    const newState: AuthState = {
      isAuthenticated: true,
      user: {
        email: "user@example.com", // Placeholder
        name: "User",
      },
    };
    setAuthState(newState);
    setAuthStateInternal(newState);
  };

  const signOut = () => {
    clearAuthState();
    setAuthStateInternal({ isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ authState, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

