import "./globals.css";

// Root layout intentionally minimal — <html lang={locale}> + <body> live in app/[locale]/layout.tsx
// so locale is reflected in the lang attribute (critical for SEO / hreflang correctness).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
