import type { MetadataRoute } from "next";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Flat links and the dashboard hold applicant data and must never be indexed.
        disallow: ["/w/", "/app", "/anmelden", "/en/w/", "/en/app", "/en/anmelden", "/api/", "/ingest/"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
