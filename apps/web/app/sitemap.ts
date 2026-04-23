import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rb-capso.fr";

const routes = [
  { path: "/", priority: 1, freq: "weekly" as const },
  { path: "/vans", priority: 0.9, freq: "weekly" as const },
  { path: "/vans/marceau", priority: 0.9, freq: "weekly" as const },
  { path: "/vans/lazare", priority: 0.9, freq: "weekly" as const },
  { path: "/conception", priority: 0.8, freq: "monthly" as const },
  { path: "/a-propos", priority: 0.7, freq: "monthly" as const },
  { path: "/contact", priority: 0.7, freq: "monthly" as const },
  { path: "/carnet-de-route", priority: 0.8, freq: "weekly" as const },
  { path: "/tarifs", priority: 0.6, freq: "monthly" as const },
  { path: "/mentions-legales", priority: 0.3, freq: "yearly" as const },
  { path: "/cgv", priority: 0.3, freq: "yearly" as const },
];

const blogSlugs = [
  "7-plus-beaux-spots-van-landes",
  "road-trip-van-capbreton-san-sebastian",
  "surf-van-landes-cinq-spots-accessibles",
];

// Translated pathname segments (kept in sync with i18n/routing.ts)
const localizedPath = (path: string, locale: string): string => {
  const map: Record<string, Record<string, string>> = {
    "/vans": { en: "/vans", es: "/furgonetas" },
    "/vans/marceau": { en: "/vans/marceau", es: "/furgonetas/marceau" },
    "/vans/lazare": { en: "/vans/lazare", es: "/furgonetas/lazare" },
    "/conception": { en: "/bespoke-builds", es: "/montaje-a-medida" },
    "/a-propos": { en: "/about", es: "/sobre" },
    "/carnet-de-route": { en: "/road-journal", es: "/cuaderno-de-ruta" },
    "/mentions-legales": { en: "/legal-notice", es: "/aviso-legal" },
    "/cgv": { en: "/terms", es: "/condiciones" },
    "/tarifs": { en: "/pricing", es: "/tarifas" },
  };
  if (locale === "fr") return path;
  return map[path]?.[locale] ?? path;
};

const prefix = (locale: string): string => (locale === "fr" ? "" : `/${locale}`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const items: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of routing.locales) {
      items.push({
        url: `${siteUrl}${prefix(locale)}${localizedPath(route.path, locale)}`,
        lastModified,
        changeFrequency: route.freq,
        priority: route.priority,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [
              l,
              `${siteUrl}${prefix(l)}${localizedPath(route.path, l)}`,
            ])
          ),
        },
      });
    }
  }

  // Blog articles
  for (const slug of blogSlugs) {
    for (const locale of routing.locales) {
      const base = localizedPath("/carnet-de-route", locale);
      items.push({
        url: `${siteUrl}${prefix(locale)}${base}/${slug}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return items;
}
