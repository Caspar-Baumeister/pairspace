import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pairspace | Die passende WG für deine Zimmer",
    short_name: "Pairspace",
    description: "Bewerber bewerten sich gegenseitig, Pairspace findet die Gruppe, die zusammenpasst.",
    start_url: "/",
    display: "standalone",
    background_color: "#1e1e1e",
    theme_color: "#1e1e1e",
    // Rendered by scripts/icons.mjs.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
