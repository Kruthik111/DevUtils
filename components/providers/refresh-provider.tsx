"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface RefreshContextType {
  registerRefresh: (key: string, refreshFn: () => Promise<void> | void) => void;
  unregisterRefresh: (key: string) => void;
  refresh: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextType>({
  registerRefresh: () => {},
  unregisterRefresh: () => {},
  refresh: async () => {},
});

export const useRefresh = () => useContext(RefreshContext);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshFunctions, setRefreshFunctions] = useState<Map<string, () => Promise<void> | void>>(new Map());

  const registerRefresh = useCallback((key: string, refreshFn: () => Promise<void> | void) => {
    setRefreshFunctions((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, refreshFn);
      return newMap;
    });
  }, []);

  const unregisterRefresh = useCallback((key: string) => {
    setRefreshFunctions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const refresh = useCallback(async () => {
    const promises = Array.from(refreshFunctions.values()).map((fn) => fn());
    await Promise.all(promises);
  }, [refreshFunctions]);

  return (
    <RefreshContext.Provider value={{ registerRefresh, unregisterRefresh, refresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

