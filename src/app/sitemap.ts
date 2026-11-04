import type { MetadataRoute } from "next";

import { LEGAL_PAGES } from "@/lib/legal";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Each public page in both languages, linked to each other. */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();
  const pages = [
    { de: "/", en: "/en", changeFrequency: "weekly" as const, priority: 1 },
    { de: "/preise", en: "/en/preise", changeFrequency: "monthly" as const, priority: 0.6 },
    ...LEGAL_PAGES.map(({ path }) => ({
      de: path,
      en: `/en${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
  return pages.flatMap(({ de, en, changeFrequency, priority }) => {
    const languages = { de: `${site}${de}`, en: `${site}${en}` };
    return [
      { url: `${site}${de}`, lastModified: updated, changeFrequency, priority, alternates: { languages } },
      { url: `${site}${en}`, lastModified: updated, changeFrequency, priority, alternates: { languages } },
    ];
  });
}
