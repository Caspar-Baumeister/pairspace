import type { MetadataRoute } from "next";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Only pages that actually exist. The landing page sections are anchors, so they
 * are covered by the homepage entry rather than by fake URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();
  return [
    { url: `${site}/`, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/privacy`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/terms`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
  ];
}
