import { PwaRegister } from "@/components/pwa-register";
import type { Metadata, Viewport } from "next";
import "./globals.css";
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://matache.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MaTache — Aucun client oublié", template: "%s | MaTache" },
  description:
    "Suivi client intelligent : capturez vos échanges WhatsApp, retrouvez automatiquement les prochaines actions et relancez au bon moment.",
  applicationName: "MaTache",
  authors: [{ name: "MaTache" }],
  keywords: [
    "MaTache",
    "suivi client",
    "CRM",
    "WhatsApp",
    "gestion de tâches",
    "actions clients",
    "rappels",
    "productivité",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "MaTache",
    title: "MaTache — Suivi client intelligent",
    description:
      "Capture → Analyse IA → Action → Rappel : aucun client oublié. Transformez vos captures WhatsApp en actions claires.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MaTache — Application de suivi client intelligent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MaTache — Suivi client intelligent",
    description:
      "Capture → Analyse IA → Action → Rappel : aucun client oublié.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: "MaTache",
    statusBarStyle: "default",
  },
  robots: {
    index: true,
    follow: true,
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#087b68",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
