import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Haraara · حرارة",
    short_name: "Haraara",
    description: "Community deals in the UAE",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#0b7464",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
