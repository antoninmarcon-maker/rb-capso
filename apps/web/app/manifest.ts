import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RB-CapSO — Vans faits main dans les Landes",
    short_name: "RB-CapSO",
    description:
      "Location et conception de vans aménagés à Capbreton. Fait main, pour prendre le large.",
    start_url: "/",
    display: "standalone",
    background_color: "#EFE8DC",
    theme_color: "#1E2A24",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}
