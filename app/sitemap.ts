import type { MetadataRoute } from "next";

export const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://devutils.vercel.app";

// Public pages only — anything behind auth is left out
const routes = ["", "/json-tools", "/qr-generator", "/quick-share", "/tasks", "/better-prompts", "/readme-preview"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
