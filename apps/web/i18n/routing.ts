import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["fr", "en", "es"] as const,
  defaultLocale: "fr",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/vans": {
      fr: "/vans",
      en: "/vans",
      es: "/furgonetas",
    },
    "/vans/[slug]": {
      fr: "/vans/[slug]",
      en: "/vans/[slug]",
      es: "/furgonetas/[slug]",
    },
    "/conception": {
      fr: "/conception",
      en: "/bespoke-builds",
      es: "/montaje-a-medida",
    },
    "/carnet-de-route": {
      fr: "/carnet-de-route",
      en: "/road-journal",
      es: "/cuaderno-de-ruta",
    },
    "/carnet-de-route/[slug]": {
      fr: "/carnet-de-route/[slug]",
      en: "/road-journal/[slug]",
      es: "/cuaderno-de-ruta/[slug]",
    },
    "/a-propos": {
      fr: "/a-propos",
      en: "/about",
      es: "/sobre",
    },
    "/contact": "/contact",
    "/mentions-legales": {
      fr: "/mentions-legales",
      en: "/legal-notice",
      es: "/aviso-legal",
    },
    "/cgv": {
      fr: "/cgv",
      en: "/terms",
      es: "/condiciones",
    },
    "/tarifs": {
      fr: "/tarifs",
      en: "/pricing",
      es: "/tarifas",
    },
  },
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
