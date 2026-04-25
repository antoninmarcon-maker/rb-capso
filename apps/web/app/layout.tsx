import type { Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
  preload: true,
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#1E2A24",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        {/* Preload the LCP hero poster — must be in <head> to have effect */}
        <link
          rel="preload"
          as="image"
          href="/video/hero-poster.webp"
          type="image/webp"
          // @ts-expect-error fetchpriority is a valid HTML attr
          fetchpriority="high"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-ink focus:text-cream focus:px-4 focus:py-2 focus:rounded"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
