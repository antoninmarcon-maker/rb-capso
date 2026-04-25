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
        {/* Editorial breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-[1440px] px-6 md:px-10 pt-8 catalog-tag text-ink/55 flex items-center gap-3"
        >
          <LocalizedLink href="/" className="hover:text-ink transition-colors">
            RB-CapSO
          </LocalizedLink>
          <span aria-hidden>·</span>
          <LocalizedLink href="/vans" className="hover:text-ink transition-colors">
            {tNav("rent")}
          </LocalizedLink>
          <span aria-hidden>·</span>
          <span className="text-ink/85">{van.name}</span>
        </nav>

        {/* Hero — viewTransitionName mirror */}
        <section className="mx-auto max-w-[1440px] px-6 md:px-10 pt-6">
          <div
            className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden border border-ink"
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

          <div className="mt-4 grid grid-cols-4 gap-2">
            {van.gallery.slice(1).map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden border border-ink/40">
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

          {/* Above-the-fold action band — mobile-first, hidden on desktop where aside takes over */}
          <div className="md:hidden mt-6 border border-ink p-4 bg-cream-deep/50 flex items-center justify-between gap-4">
            <div>
              <span className="catalog-tag text-ink/65 block mb-0.5">Dès</span>
              <span
                className="font-display"
                style={{
                  fontSize: "1.5rem",
                  fontStyle: "italic",
                  fontVariationSettings: "'opsz' 48, 'SOFT' 100, 'WONK' 1",
                  fontFeatureSettings: "'onum', 'pnum'",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {van.priceFromEuros}
                <span className="text-ember not-italic"> €</span>
                <span className="serial text-ink/65 not-italic"> / nuitée</span>
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

        {/* Editorial header — chapter + eyebrow + italic name */}
        <section className="mx-auto max-w-[1440px] px-6 md:px-10 py-16 md:py-20 grid md:grid-cols-[1fr_380px] gap-12 md:gap-16">
          <div>
            <div
              className="grid grid-cols-[100px_1fr] gap-6 items-start"
              style={{ viewTransitionName: `van-${van.slug}` }}
            >
              <div className="pt-2">
                <span className="serial text-ink/65">Fiche</span>
                <span className="block chapter-number -ml-0.5">
                  {van.slug === "penelope" ? "I" : "II"}
                </span>
                <span className="serial text-ink/65 block mt-1">— {van.model}</span>
              </div>
              <div>
                <span className="eyebrow text-sage-deep">Flotte · Atlantique nord</span>
                <h1
                  className="mt-4 font-display"
                  style={{
                    fontSize: "clamp(2.5rem, 6vw, 5rem)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.03em",
                    fontStyle: "italic",
                    fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
                    fontWeight: 350,
                  }}
                >
                  {van.name}
                </h1>
                <p
                  className="mt-5 font-display italic text-xl md:text-2xl text-ink/75 max-w-lg leading-snug"
                  style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 80" }}
                >
                  « {van.tagline} »
                </p>
                <hr className="rule-double mt-8 max-w-[50%]" />
              </div>
            </div>

            <p className="drop-cap prose-editorial mt-12 text-ink/85 leading-relaxed text-lg">
              {van.story}
            </p>

            <div className="mt-16">
              <header className="mb-8">
                <span className="serial text-ink/55 block mb-2">— § iii.</span>
                <h2
                  className="font-display"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                    fontStyle: "italic",
                    fontVariationSettings: "'opsz' 96, 'SOFT' 80, 'WONK' 1",
                  }}
                >
                  Équipement
                </h2>
              </header>
              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
                {van.equipment.map((group) => (
                  <div key={group.group}>
                    <h3 className="catalog-tag text-ink/65 mb-3 pb-2 border-b border-ink/30">
                      {group.group}
                    </h3>
                    <ul className="space-y-1.5 text-ink/80">
                      {group.items.map((item) => (
                        <li key={item} className="text-[0.95rem] font-display italic" style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 100" }}>
                          — {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16">
              <header className="mb-8">
                <span className="serial text-ink/55 block mb-2">— § iv.</span>
                <h2
                  className="font-display"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                    fontStyle: "italic",
                    fontVariationSettings: "'opsz' 96, 'SOFT' 80, 'WONK' 1",
                  }}
                >
                  Disponibilités
                </h2>
              </header>
              <AvailabilityCalendar vanSlug={van.slug} yescapaUrl={withYescapaUtm(van.yescapaUrl, van.slug, locale)} />
            </div>

            <div className="mt-16">
              <header className="mb-8">
                <span className="serial text-ink/55 block mb-2">— § v.</span>
                <h2
                  className="font-display"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                    fontStyle: "italic",
                    fontVariationSettings: "'opsz' 96, 'SOFT' 80, 'WONK' 1",
                  }}
                >
                  Règles et infos pratiques
                </h2>
              </header>
              <ul className="space-y-2 text-ink/80">
                {van.rules.map((rule) => (
                  <li
                    key={rule}
                    className="text-[0.95rem] font-display italic"
                    style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 100" }}
                  >
                    — {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Aside — catalog ledger */}
          <aside className="md:sticky md:top-24 self-start catalog-frame">
            <div className="catalog-tag text-ink/55 mb-3">Tarif · Saison 2026</div>
            <div className="flex items-baseline justify-between">
              <span
                className="font-display"
                style={{
                  fontSize: "1.85rem",
                  fontStyle: "italic",
                  fontVariationSettings: "'opsz' 48, 'SOFT' 100, 'WONK' 1",
                  fontFeatureSettings: "'onum', 'pnum', 'ss01'",
                }}
              >
                dès {van.priceFromEuros}
                <span className="text-ember not-italic"> €</span>
              </span>
              <span className="serial text-ink/55">par nuitée</span>
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

            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {van.features.map((f) => (
                <li
                  key={f.label}
                  className="catalog-tag text-ink/75"
                >
                  · {f.label}
                </li>
              ))}
            </ul>

            <a
              href={withYescapaUtm(van.yescapaUrl, van.slug, locale)}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary mt-7 w-full justify-center"
            >
              {tCta("book_on_yescapa")}
              <ExternalLink className="w-4 h-4" aria-hidden />
            </a>

            <LocalizedLink
              href={{ pathname: "/contact" }}
              className="mt-4 block text-center catalog-tag text-ink/65 hover:text-ember transition-colors"
            >
              · {tCta("ask_question")}
            </LocalizedLink>

            {/* Cross-link to the other van — saves the 4-click memorize-and-back comparison */}
            {(() => {
              const others = Object.values(vans).filter((v) => v.slug !== van.slug);
              const other = others[0];
              if (!other) return null;
              return (
                <LocalizedLink
                  href={{ pathname: "/vans/[slug]", params: { slug: other.slug } }}
                  className="mt-3 block text-center catalog-tag text-ink/65 hover:text-ember transition-colors"
                >
                  · Comparer avec {other.name}
                </LocalizedLink>
              );
            })()}

            <p className="mt-6 catalog-tag text-ink/65 text-center">
              Réservation via Yescapa · paiement sécurisé · assurance incluse
            </p>
          </aside>
        </section>

        {/* Footer rule + page mark */}
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 pb-16 flex items-center gap-4 text-ink/65 serial">
          <span>p. 02-{van.slug === "penelope" ? "01" : "02"}</span>
          <span className="flex-1 h-px bg-ink/15" />
          <span className="font-display italic">§</span>
          <span className="flex-1 h-px bg-ink/15" />
          <span>{van.name} · {van.model}</span>
        </div>
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
