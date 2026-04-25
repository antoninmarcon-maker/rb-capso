import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#1E2A24",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://rb-capso.fr"),
    title: {
      default: `RB-CapSO · ${t("h1")}`,
      template: "%s · RB-CapSO",
    },
    description: t("subtitle"),
    openGraph: {
      type: "website",
      locale: localeTag(locale),
      siteName: "RB-CapSO",
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(t("h1"))}&subtitle=${encodeURIComponent(t("subtitle"))}`,
          width: 1200,
          height: 630,
          alt: t("h1"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [
        `/api/og?title=${encodeURIComponent(t("h1"))}&subtitle=${encodeURIComponent(t("subtitle"))}`,
      ],
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${locale === "fr" ? "" : locale}`,
      languages: {
        fr: "/",
        en: "/en",
        es: "/es",
      },
    },
  };
}

function localeTag(locale: string): string {
  if (locale === "fr") return "fr_FR";
  if (locale === "en") return "en_GB";
  if (locale === "es") return "es_ES";
  return "fr_FR";
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const skipLabel =
    locale === "en" ? "Skip to content" : locale === "es" ? "Ir al contenido" : "Aller au contenu";

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-ink focus:text-cream focus:px-4 focus:py-2 focus:rounded"
        >
          {skipLabel}
        </a>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
