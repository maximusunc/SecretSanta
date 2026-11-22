import type { MetadataRoute } from "next";

/** Lets the app be added to the Home Screen as a full-screen app (required for iPhone notifications). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Secret Santa",
    short_name: "Secret Santa",
    description: "Our family's Secret Santa headquarters",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f1b2d",
    theme_color: "#0f1b2d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
