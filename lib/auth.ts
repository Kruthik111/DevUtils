"use client";

const AUTH_KEY = "devutils-auth";

export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    email?: string;
    name?: string;
  };
}

export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { isAuthenticated: false };
  }
  
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { isAuthenticated: false };
    }
  }
  return { isAuthenticated: false };
}

export function setAuthState(state: AuthState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function clearAuthState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}

