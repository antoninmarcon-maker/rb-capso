import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

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
      default: `RB-CapSO — ${t("h1")}`,
      template: "%s — RB-CapSO",
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

  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
