import type { MetadataRoute } from "next";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();
  return [
    { url: `${site}/`, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/preise`, lastModified: updated, changeFrequency: "monthly", priority: 0.6 },
  ];
}
