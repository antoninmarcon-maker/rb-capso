import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { JsonLd } from "@/components/schema/JsonLd";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing, Link as LocalizedLink } from "@/i18n/routing";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { StickyMobileCTA } from "@/components/booking/StickyMobileCTA";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { vans, type VanSlug } from "@/lib/vans/data";
import { euros } from "@/lib/stripe/pricing";
import { SITE_URL, alternatesFor, localeTag, ogImage as buildOgImage, localizedUrl } from "@/lib/seo";
import { withYescapaUtm } from "@/lib/yescapa";

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
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Header />
      <main id="main" className="pt-16">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-[1440px] px-6 md:px-12 pt-8 font-mono text-xs text-ink/55 flex items-center gap-3"
        >
          <LocalizedLink href="/" className="hover:text-ink transition-colors">
            RB-CapSO
          </LocalizedLink>
          <span aria-hidden>/</span>
          <LocalizedLink href="/vans" className="hover:text-ink transition-colors">
            {tNav("rent")}
          </LocalizedLink>
          <span aria-hidden>/</span>
          <span className="text-ink/85">{van.name}</span>
        </nav>

        {/* Hero gallery */}
        <section className="mx-auto max-w-[1440px] px-6 md:px-12 pt-6">
          <div
            className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-cream-deep"
            style={{ viewTransitionName: `van-image-${van.slug}` }}
          >
            <Image
              src={van.gallery[0]}
              alt={`${van.name}, ${van.tagline}`}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>

          <RevealStagger className="mt-3 grid grid-cols-4 gap-2 md:gap-3" staggerDelay={0.06}>
            {van.gallery.slice(1).map((src, i) => (
              <RevealItem key={i} className="relative aspect-square overflow-hidden">
                <Image
                  src={src}
                  alt={`${van.name} — vue ${i + 2}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </RevealItem>
            ))}
          </RevealStagger>

          {/* Mobile action band */}
          <div className="md:hidden mt-6 p-4 bg-cream-dark flex items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-ink/55 block mb-0.5">Dès</span>
              <span className="text-2xl font-medium tabular-nums">
                {van.priceFromEuros} <span className="text-ocean">€</span>
                <span className="text-sm text-ink/55"> / nuit</span>
              </span>
            </div>
            <a
              href={withYescapaUtm(van.yescapaUrl, van.slug, locale)}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary !px-4 !py-2.5 text-sm"
            >
              {tCta("book_on_yescapa")}
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
            </a>
          </div>
        </section>

        {/* Editorial body */}
        <section className="mx-auto max-w-[1440px] px-6 md:px-12 py-16 md:py-20 grid md:grid-cols-[1fr_360px] gap-12 md:gap-16">
          <div>
            <div style={{ viewTransitionName: `van-${van.slug}` }}>
              <span className="eyebrow">Flotte · Atlantique nord</span>
              <h1
                className="mt-4 leading-[0.95]"
                style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
              >
                {van.name}
              </h1>
              <p className="mt-4 text-xl md:text-2xl text-ink/70 max-w-xl leading-snug">
                {van.tagline}
              </p>
              <p className="mt-3 font-mono text-sm text-ink/55">{van.model}</p>
            </div>

            <Reveal>
              <p className="mt-12 text-lg text-ink/80 leading-relaxed">
                {van.story}
              </p>
            </Reveal>

            <Reveal className="mt-16">
              <header className="mb-8">
                <span className="eyebrow">Équipement</span>
                <h2
                  className="mt-3 leading-[1.05]"
                  style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
                >
                  Ce qui est à bord
                </h2>
              </header>
              <RevealStagger className="grid sm:grid-cols-2 gap-x-10 gap-y-8" staggerDelay={0.08}>
                {van.equipment.map((group) => (
                  <RevealItem key={group.group}>
                    <h3 className="font-mono text-xs text-ink/55 uppercase tracking-wide mb-3 pb-2 border-b border-ink/15">
                      {group.group}
                    </h3>
                    <ul className="space-y-1.5 text-ink/80">
                      {group.items.map((item) => (
                        <li key={item} className="text-base">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </RevealItem>
                ))}
              </RevealStagger>
            </Reveal>

            <Reveal className="mt-16">
              <header className="mb-8">
                <span className="eyebrow">Disponibilités</span>
                <h2
                  className="mt-3 leading-[1.05]"
                  style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
                >
                  Quand louer
                </h2>
              </header>
              <AvailabilityCalendar vanSlug={van.slug} yescapaUrl={withYescapaUtm(van.yescapaUrl, van.slug, locale)} />
            </Reveal>

            <Reveal className="mt-16">
              <header className="mb-8">
                <span className="eyebrow">Pratique</span>
                <h2
                  className="mt-3 leading-[1.05]"
                  style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
                >
                  Règles et infos
                </h2>
              </header>
              <ul className="space-y-2 text-ink/80">
                {van.rules.map((rule) => (
                  <li key={rule} className="text-base flex gap-3">
                    <span className="text-ocean shrink-0">·</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Aside — clean ledger */}
          <Reveal as="aside" className="md:sticky md:top-24 self-start bg-cream-dark p-6 md:p-7" delay={0.15}>
            <p className="font-mono text-xs text-ink/55 uppercase tracking-wide mb-3">Tarif · Saison 2026</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-medium tabular-nums">
                dès {van.priceFromEuros} <span className="text-ocean">€</span>
              </span>
              <span className="font-mono text-xs text-ink/55">par nuit</span>
            </div>

            <hr className="rule-thin my-5" />

            <table className="specs">
              <tbody>
                <tr><td>Modèle</td><td>{van.model}</td></tr>
                <tr><td>Couchages</td><td>{van.sleeps} pers.</td></tr>
                <tr><td>Longueur</td><td>{van.length}</td></tr>
                <tr><td>Permis</td><td>B</td></tr>
                <tr><td>Caution</td><td>1 500 €</td></tr>
              </tbody>
            </table>

            <hr className="rule-thin my-5" />

            <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
              {van.features.map((f) => (
                <li
                  key={f.label}
                  className="font-mono text-xs text-ink/65"
                >
                  · {f.label}
                </li>
              ))}
            </ul>

            <a
              href={withYescapaUtm(van.yescapaUrl, van.slug, locale)}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary mt-6 w-full justify-center"
            >
              {tCta("book_on_yescapa")}
              <ExternalLink className="w-4 h-4" aria-hidden />
            </a>

            <LocalizedLink
              href={{ pathname: "/contact" }}
              className="mt-3 block text-center font-mono text-xs text-ink/65 hover:text-ocean transition-colors"
            >
              {tCta("ask_question")}
            </LocalizedLink>

            {(() => {
              const others = Object.values(vans).filter((v) => v.slug !== van.slug);
              const other = others[0];
              if (!other) return null;
              return (
                <LocalizedLink
                  href={{ pathname: "/vans/[slug]", params: { slug: other.slug } }}
                  className="mt-2 block text-center font-mono text-xs text-ink/65 hover:text-ocean transition-colors"
                >
                  Comparer avec {other.name}
                </LocalizedLink>
              );
            })()}

            <p className="mt-5 font-mono text-xs text-ink/55 text-center leading-relaxed">
              Réservation via Yescapa · paiement sécurisé · assurance incluse
            </p>
          </Reveal>
        </section>
      </main>
      <Footer />
      <StickyMobileCTA
        price={van.priceFromEuros}
        yescapaUrl={withYescapaUtm(van.yescapaUrl, van.slug, locale)}
        ctaLabel={tCta("book_on_yescapa")}
        vanName={van.name}
      />
    </>
  );
}
