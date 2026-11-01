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
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
