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

  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("devutils-theme", theme);

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
      localStorage.setItem("devutils-custom-theme", JSON.stringify(newCustomTheme));
      if (theme === "custom") {
        // Force re-render/update
        const root = document.documentElement;
        root.style.setProperty("--background", newCustomTheme.background);
        root.style.setProperty("--foreground", newCustomTheme.foreground);
        root.style.setProperty("--primary", newCustomTheme.primary);
        root.style.setProperty("--secondary", newCustomTheme.secondary);
        root.style.setProperty("--accent", newCustomTheme.accent);
      }
    }
  }), [theme, customTheme]);

  // Prevent hydration mismatch
  // if (!mounted) {
  //   return <>{children}</>;
  // }

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
