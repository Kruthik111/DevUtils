export type Theme = "light" | "dark" | "orange" | "purple" | "blue" | "green" | "professional" | "custom";

export const themes: Theme[] = ["light", "dark", "orange", "purple", "blue", "green", "professional", "custom"];

export interface CustomTheme {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  border?: string;
}

export const themeConfig = {
  light: {
    name: "Light",
    background: "#f7f6f3",
    foreground: "#1a1a1a",
    primary: "#1f1f1f",
    secondary: "#ffffff",
    accent: "#eceae5",
    border: "rgba(0, 0, 0, 0.14)",
  },
  dark: {
    name: "Dark",
    background: "#0f0f0f",
    foreground: "#e5e5e5",
    primary: "#ffffff",
    secondary: "#2d2d2d",
    accent: "#3a3a3a",
  },
  orange: {
    name: "Orange",
    background: "#fdf7f1",
    foreground: "#2a1408",
    primary: "#c2410c",
    secondary: "#ffffff",
    accent: "#f9e7d6",
    border: "rgba(194, 65, 12, 0.22)",
  },
  purple: {
    name: "Purple",
    background: "#f9f6fd",
    foreground: "#1e1029",
    primary: "#7e22ce",
    secondary: "#ffffff",
    accent: "#ece0fa",
    border: "rgba(126, 34, 206, 0.22)",
  },
  blue: {
    name: "Blue",
    background: "#f5f9fe",
    foreground: "#0f1b2d",
    primary: "#1d4ed8",
    secondary: "#ffffff",
    accent: "#dbe9fb",
    border: "rgba(29, 78, 216, 0.22)",
  },
  green: {
    name: "Green",
    background: "#f5fbf7",
    foreground: "#0e2216",
    primary: "#15803d",
    secondary: "#ffffff",
    accent: "#d9f0e2",
    border: "rgba(21, 128, 61, 0.22)",
  },
  professional: {
    name: "Professional",
    background: "#1c1714",
    foreground: "#ffffff",
    primary: "#fb923c",
    secondary: "#241e1a",
    accent: "#2a231f",
    border: "#2c241e",
  },
};

