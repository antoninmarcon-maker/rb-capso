import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@rb-capso/design-tokens"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "rb-capso-media.r2.cloudflarestorage.com" },
    ],
  },
  async redirects() {
    return [
      // Legacy van names → new ones
      { source: "/vans/marceau", destination: "/vans/penelope", permanent: true },
      { source: "/vans/lazare", destination: "/vans/peggy", permanent: true },
      { source: "/:locale(en|es)/vans/marceau", destination: "/:locale/vans/penelope", permanent: true },
      { source: "/:locale(en|es)/vans/lazare", destination: "/:locale/vans/peggy", permanent: true },
      { source: "/es/furgonetas/marceau", destination: "/es/furgonetas/penelope", permanent: true },
      { source: "/es/furgonetas/lazare", destination: "/es/furgonetas/peggy", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
