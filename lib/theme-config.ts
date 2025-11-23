export type Theme = "light" | "dark" | "orange" | "purple" | "blue" | "green" | "custom";

export const themes: Theme[] = ["light", "dark", "orange", "purple", "blue", "green", "custom"];

export interface CustomTheme {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const themeConfig = {
  light: {
    name: "Light",
    background: "#fef9f3",
    foreground: "#2d2d2d",
    primary: "#3b3b3b",
    secondary: "#f5f0e8",
    accent: "#e8e0d4",
  },
  dark: {
    name: "Dark",
    background: "#1f1f1f",
    foreground: "#e5e5e5",
    primary: "#ffffff",
    secondary: "#2d2d2d",
    accent: "#3a3a3a",
  },
  orange: {
    name: "Orange",
    background: "#fff7ed",
    foreground: "#431407",
    primary: "#ea580c",
    secondary: "#ffedd5",
    accent: "#fed7aa",
  },
  purple: {
    name: "Purple",
    background: "#faf5ff",
    foreground: "#3b0764",
    primary: "#9333ea",
    secondary: "#f3e8ff",
    accent: "#e9d5ff",
  },
  blue: {
    name: "Blue",
    background: "#eff6ff",
    foreground: "#1e3a8a",
    primary: "#3b82f6",
    secondary: "#dbeafe",
    accent: "#bfdbfe",
  },
  green: {
    name: "Green",
    background: "#f0fdf4",
    foreground: "#14532d",
    primary: "#22c55e",
    secondary: "#dcfce7",
    accent: "#bbf7d0",
  },
};

