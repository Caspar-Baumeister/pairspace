import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // PostHog's API paths end in a slash, the proxy must pass them on unchanged.
  skipTrailingSlashRedirect: true,
  // The indicator sits on top of the ribbon's sign out button. Errors still show.
  devIndicators: false,
  experimental: { optimizePackageImports: ["firebase"] },
  // German pages have no prefix, they are served from the [lang] segment as "de".
  // afterFiles runs after app routes and public files, so /api, /video and
  // friends are never touched. English keeps its /en prefix.
  async rewrites() {
    return {
      // PostHog through our own domain, so blockers that list i.posthog.com do not drop the events.
      beforeFiles: [
        { source: "/ingest/static/:path*", destination: "https://eu-assets.i.posthog.com/static/:path*" },
        { source: "/ingest/:path*", destination: "https://eu.i.posthog.com/:path*" },
      ],
      afterFiles: [
        { source: "/", destination: "/de" },
        { source: "/:path((?!en(?:/|$)|de(?:/|$)|ingest(?:/|$)).*)", destination: "/de/:path" },
      ],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/de", destination: "/", permanent: true },
      { source: "/de/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
