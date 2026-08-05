import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SAF Layout",
    short_name: "SAF Layout",
    description:
      "Orchard layout editor for SAF. Create and edit layouts offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f2",
    theme_color: "#2f4034",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
