import type { MetadataRoute } from "next";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Event and profile pages hold participant data and must never be indexed.
        disallow: ["/e/", "/p/", "/dashboard", "/create", "/signin"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
