import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { ExternalLink } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing, Link as LocalizedLink } from "@/i18n/routing";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { StickyMobileCTA } from "@/components/booking/StickyMobileCTA";
import { vans, type VanSlug } from "@/lib/vans/data";
import { euros } from "@/lib/stripe/pricing";
import { SITE_URL, alternatesFor, localeTag, ogImage as buildOgImage, localizedUrl } from "@/lib/seo";

export async function generateStaticParams() {
  const out: Array<{ locale: string; slug: string }> = [];
  for (const locale of routing.locales) {
    for (const slug of Object.keys(vans)) {
      out.push({ locale, slug });
    }
  }
  return out;
}

const TITLES: Record<string, (van: { name: string; model: string }) => { title: string; description: (tagline: string) => string }> = {
  fr: (van) => ({
    title: `${van.name} (${van.model}) — Location van aménagé Capbreton`,
    description: (tagline) =>
      `Louez ${van.name}, ${van.model} aménagé main par RB-CapSO à Capbreton. ${tagline}`,
  }),
  en: (van) => ({
    title: `${van.name} (${van.model}) — Hand-built campervan in the Landes`,
    description: (tagline) =>
      `Hire ${van.name}, a ${van.model} built by hand at the RB-CapSO workshop in Capbreton. ${tagline}`,
  }),
  es: (van) => ({
    title: `${van.name} (${van.model}) — Furgoneta artesanal en Capbreton`,
    description: (tagline) =>
      `Alquile ${van.name}, ${van.model} fabricada a mano en el taller RB-CapSO de Capbreton. ${tagline}`,
  }),
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const van = vans[slug as VanSlug];
  if (!van) return {};

  const builder = TITLES[locale] ?? TITLES.fr;
  const { title, description } = builder({ name: van.name, model: van.model });
  const desc = description(van.tagline);

  const og = buildOgImage({
    title: van.name,
    eyebrow: van.model,
    subtitle: van.tagline,
  });

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: desc,
    alternates: alternatesFor("/vans/[slug]", locale, slug),
    openGraph: {
      type: "website",
      locale: localeTag(locale),
      siteName: "RB-CapSO",
      title: `${van.name} — RB-CapSO`,
      description: desc,
      images: [{ url: og, width: 1200, height: 630, alt: `${van.name} — ${van.model}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${van.name} — RB-CapSO`,
      description: desc,
      images: [og],
    },
  };
}

export default async function VanPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("nav");
  const tCta = await getTranslations("cta");
  const van = vans[slug as VanSlug];
  if (!van) notFound();

  const vanCanonical = localizedUrl("/vans/[slug]", locale, slug);
  const vansIndexUrl = localizedUrl("/vans", locale);
  const homeUrl = localizedUrl("/", locale);

  // JSON-LD: Vehicle / Product / Offer for rich results
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${van.name} — ${van.model}`,
    description: van.tagline,
    brand: { "@type": "Brand", name: "RB-CapSO" },
    image: `${SITE_URL}${van.gallery[0]}`,
    category: "Campervan rental",
    offers: {
      "@type": "Offer",
      url: vanCanonical,
      priceCurrency: "EUR",
      price: String(van.priceFromEuros),
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      seller: { "@type": "LocalBusiness", name: "RB-CapSO" },
    },
  };

  const vansIndexName =
    locale === "en" ? "Vans" : locale === "es" ? "Furgonetas" : "Vans";
  const homeName =
    locale === "en" ? "Home" : locale === "es" ? "Inicio" : "Accueil";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeName, item: homeUrl },
      { "@type": "ListItem", position: 2, name: vansIndexName, item: vansIndexUrl },
      { "@type": "ListItem", position: 3, name: van.name, item: vanCanonical },
    ],
  };

  return (
    <>
      <Script
        id={`van-${van.slug}-schema`}
        type="application/ld+json"
      >{JSON.stringify(productSchema)}</Script>
      <Script
        id={`van-${van.slug}-breadcrumb`}
        type="application/ld+json"
      >{JSON.stringify(breadcrumbSchema)}</Script>
      <Header />
      <main id="main">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-[1240px] px-6 pt-6 text-sm text-ink/60"
        >
          <LocalizedLink href="/" className="hover:underline">
            RB-CapSO
          </LocalizedLink>
          <span aria-hidden> / </span>
          <LocalizedLink href="/vans" className="hover:underline">
            {tNav("rent")}
          </LocalizedLink>
          <span aria-hidden> / </span>
          <span>{van.name}</span>
        </nav>

        <section className="mx-auto max-w-[1440px] px-6 pt-8">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-lg overflow-hidden">
            <Image
              src={van.gallery[0]}
              alt={`${van.name}, ${van.tagline}`}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {van.gallery.slice(1).map((src, i) => (
              <div key={i} className="relative aspect-square rounded overflow-hidden">
                <Image
                  src={src}
                  alt={`${van.name} — vue ${i + 2}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-6 py-12 grid md:grid-cols-[1fr_380px] gap-12">
          <div>
            <p className="text-sm text-sage uppercase tracking-widest">{van.model}</p>
            <h1 className="mt-2 font-display text-5xl md:text-6xl">{van.name}</h1>
            <p className="mt-4 text-xl text-ink/80">{van.tagline}</p>

            <div className="mt-10">
              <h2 className="font-display text-3xl mb-4">Une semaine avec {van.name}</h2>
              <p className="prose text-ink/90 leading-relaxed">{van.story}</p>
            </div>

            <div className="mt-12">
              <h2 className="font-display text-3xl mb-6">Équipement</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {van.equipment.map((group) => (
                  <div key={group.group}>
                    <h3 className="font-medium text-lg text-ocean">{group.group}</h3>
                    <ul className="mt-2 space-y-1.5 text-ink/80">
                      {group.items.map((item) => (
                        <li key={item} className="text-sm">
                          — {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <h2 className="font-display text-3xl mb-6">Disponibilités</h2>
              <AvailabilityCalendar vanSlug={van.slug} yescapaUrl={van.yescapaUrl} />
            </div>

            <div className="mt-12">
              <h2 className="font-display text-3xl mb-4">Règles et infos pratiques</h2>
              <ul className="space-y-2 text-ink/80">
                {van.rules.map((rule) => (
                  <li key={rule} className="text-sm">
                    — {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="sticky top-24 self-start bg-white/70 rounded-lg p-6 border border-ink/10">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl">dès {euros(van.priceFromEuros * 100)}</span>
              <span className="text-sm text-ink/60">/nuit</span>
            </div>

            <div className="mt-4 flex gap-4 text-sm text-ink/70">
              <span>{van.sleeps} couchages</span>
              <span>•</span>
              <span>{van.length}</span>
            </div>

            <ul className="mt-6 flex flex-wrap gap-2">
              {van.features.map((f) => (
                <li
                  key={f.label}
                  className="text-xs px-2.5 py-1 bg-sage/20 text-ink/80 rounded-full"
                >
                  {f.label}
                </li>
              ))}
            </ul>

            <a
              href={van.yescapaUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 flex items-center justify-center gap-2 w-full bg-ink text-cream text-center py-3 rounded-md font-medium hover:bg-ocean transition-colors"
            >
              {tCta("book_on_yescapa")}
              <ExternalLink className="w-4 h-4" aria-hidden />
            </a>

            <LocalizedLink
              href={{ pathname: "/contact" }}
              className="mt-4 block text-center text-sm text-ink/70 hover:text-ocean underline underline-offset-2"
            >
              {tCta("ask_question")}
            </LocalizedLink>
          </aside>
        </section>
      </main>
      <Footer />
      <StickyMobileCTA
        price={van.priceFromEuros}
        yescapaUrl={van.yescapaUrl}
        ctaLabel={tCta("book_on_yescapa")}
        vanName={van.name}
      />
    </>
  );
}
