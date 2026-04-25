import { routing } from "@/i18n/routing";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rb-capso.fr";

/**
 * Localized pathname segments — must mirror i18n/routing.ts pathnames.
 * Used to build canonical + hreflang URLs for any page across locales.
 */
const SEGMENTS: Record<string, Record<string, string>> = {
  "/": { fr: "/", en: "/", es: "/" },
  "/vans": { fr: "/vans", en: "/vans", es: "/furgonetas" },
  "/vans/[slug]": { fr: "/vans", en: "/vans", es: "/furgonetas" },
  "/conception": { fr: "/conception", en: "/bespoke-builds", es: "/montaje-a-medida" },
  "/carnet-de-route": { fr: "/carnet-de-route", en: "/road-journal", es: "/cuaderno-de-ruta" },
  "/carnet-de-route/[slug]": { fr: "/carnet-de-route", en: "/road-journal", es: "/cuaderno-de-ruta" },
  "/a-propos": { fr: "/a-propos", en: "/about", es: "/sobre" },
  "/contact": { fr: "/contact", en: "/contact", es: "/contact" },
  "/mentions-legales": { fr: "/mentions-legales", en: "/legal-notice", es: "/aviso-legal" },
  "/cgv": { fr: "/cgv", en: "/terms", es: "/condiciones" },
  "/tarifs": { fr: "/tarifs", en: "/pricing", es: "/tarifas" },
};

/**
 * Build the absolute URL for a given page key + locale, optionally
 * appending a dynamic slug for `/vans/[slug]` etc.
 */
export function localizedUrl(
  pathKey: keyof typeof SEGMENTS,
  locale: string,
  slug?: string
): string {
  const seg = SEGMENTS[pathKey]?.[locale] ?? pathKey;
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const slugSuffix = slug ? `/${slug}` : "";
  const path = pathKey === "/" ? "" : `${seg}${slugSuffix}`;
  return `${SITE_URL}${prefix}${path}` || SITE_URL;
}

/**
 * Build the alternates block (canonical + language alternates + x-default)
 * for any page. Returns the URL part of `Metadata.alternates`.
 */
export function alternatesFor(
  pathKey: keyof typeof SEGMENTS,
  locale: string,
  slug?: string
) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = localizedUrl(pathKey, l, slug);
  }
  // x-default → canonical (default locale) URL
  languages["x-default"] = localizedUrl(pathKey, routing.defaultLocale, slug);

  return {
    canonical: localizedUrl(pathKey, locale, slug),
    languages,
  };
}

/**
 * OG image URL builder using the dynamic /api/og endpoint.
 */
export function ogImage(params: { title: string; subtitle?: string; eyebrow?: string }) {
  const qs = new URLSearchParams();
  qs.set("title", params.title);
  if (params.subtitle) qs.set("subtitle", params.subtitle);
  if (params.eyebrow) qs.set("eyebrow", params.eyebrow);
  return `${SITE_URL}/api/og?${qs.toString()}`;
}

export function localeTag(locale: string): string {
  if (locale === "fr") return "fr_FR";
  if (locale === "en") return "en_GB";
  if (locale === "es") return "es_ES";
  return "fr_FR";
}
