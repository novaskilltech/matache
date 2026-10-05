import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MaTache — Suivi client",
    short_name: "MaTache",
    description: "Capture, action, rappel : aucun client oublié.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7f6",
    theme_color: "#087b68",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [
          { name: "images", accept: ["image/jpeg", "image/png", "image/webp"] },
        ],
      },
    },
  } as MetadataRoute.Manifest & { share_target: unknown };
}
