"use client";

import * as React from "react";
import { type Theme, themeConfig, type CustomTheme } from "@/lib/theme-config";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customTheme: CustomTheme | null;
  setCustomTheme: (theme: CustomTheme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);
  const [customTheme, setCustomTheme] = React.useState<CustomTheme | null>(null);
  const [mounted, setMounted] = React.useState(false);

  // Initialize from localStorage on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("devutils-theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedCustomTheme = localStorage.getItem("devutils-custom-theme");
    if (savedCustomTheme) {
      try {
        setCustomTheme(JSON.parse(savedCustomTheme));
      } catch (e) {
        console.error("Failed to parse custom theme", e);
      }
    }
    setMounted(true);
  }, []);

  // Save to localStorage when changed
  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("devutils-theme", theme);
    if (customTheme) {
      localStorage.setItem("devutils-custom-theme", JSON.stringify(customTheme));
    } else {
      localStorage.removeItem("devutils-custom-theme");
    }
  }, [theme, customTheme, mounted]);

  // Apply CSS variables when theme changes
  React.useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const config = theme === "custom" && customTheme ? customTheme : themeConfig[theme as keyof typeof themeConfig];

    if (config) {
      // Apply CSS variables
      root.style.setProperty("--background", config.background);
      root.style.setProperty("--foreground", config.foreground);
      root.style.setProperty("--primary", config.primary);
      root.style.setProperty("--secondary", config.secondary);
      root.style.setProperty("--accent", config.accent);

      // Also apply as classes for Tailwind if needed, though variables are better
      root.classList.remove("light", "dark");
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    }
  }, [theme, customTheme, mounted]);

  const value = React.useMemo(() => ({
    theme,
    setTheme,
    customTheme,
    setCustomTheme: (newCustomTheme: CustomTheme) => {
      setCustomTheme(newCustomTheme);
    }
  }), [theme, customTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
