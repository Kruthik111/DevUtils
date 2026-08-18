import type { MetadataRoute } from "next";
import { baseUrl } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/notes", "/pages", "/load-test", "/profile", "/settings", "/dashboard"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
