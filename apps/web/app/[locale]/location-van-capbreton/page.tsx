import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { JsonLd } from "@/components/schema/JsonLd";
import { Link } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";
import { vans } from "@/lib/vans/data";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";

const TITLE = "Location van aménagé Capbreton (Landes) · RB-CapSO";
const DESC =
  "Louez un van aménagé à Capbreton, fait main par notre atelier landais. Pénélope ou Peggy, retrait sur place, dès 90 €/nuit. Surf, route, sommeil sur le toit.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESC,
    alternates: {
      canonical: `${SITE_URL}/location-van-capbreton`,
      languages: {
        fr: `${SITE_URL}/location-van-capbreton`,
        "x-default": `${SITE_URL}/location-van-capbreton`,
      },
    },
    openGraph: {
      title: TITLE,
      description: DESC,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/api/og?title=${encodeURIComponent("Location van à Capbreton")}&subtitle=${encodeURIComponent("Fait main dans les Landes")}&eyebrow=${encodeURIComponent("Capbreton, Landes")}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function LocationCapbretonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Landing SEO française uniquement (mot-clé "location van Capbreton")
  if (locale !== "fr") notFound();
  setRequestLocale(locale);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Où récupère-t-on le van à Capbreton ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "À l'atelier RB-CapSO, 9 Rue du Hapchot, 40130 Capbreton. Remise en main propre, tour du van, check-list, café.",
        },
      },
      {
        "@type": "Question",
        name: "Combien coûte la location d'un van aménagé à Capbreton ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pénélope (Ford Transit Custom + tente de toit) : à partir de 90 €/nuit. Peggy (Fiat Ducato L2H2 aménagé) : à partir de 130 €/nuit. Caution 1 500 €, kilométrage inclus 200 km/jour.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle distance entre l'atelier et la plage Notre-Dame ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "1,2 km, soit 4 minutes en voiture ou 15 minutes à pied depuis l'atelier. La plage du Prévent et le port sont à 5 minutes à pied.",
        },
      },
      {
        "@type": "Question",
        name: "Faut-il un permis spécial pour conduire le van ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Non. Nos deux vans se conduisent avec un permis B classique. Poids total inférieur à 3,5 tonnes.",
        },
      },
      {
        "@type": "Question",
        name: "Animaux acceptés dans le van ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, avec supplément nettoyage de 40 €. Un chien samoyède vit à l'atelier, vous verrez qu'ils sont les bienvenus.",
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <Header />
      <main id="main" className="pt-16">
        {/* Hero */}
        <section className="bg-ink text-cream py-20 md:py-28 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative mx-auto max-w-[1240px] px-6 md:px-12">
            <div className="max-w-3xl">
                <span className="eyebrow text-sage-deep">
                  Capbreton · Landes · 40130
                </span>
                <h1
                  className="mt-5 leading-[0.95]"
                  style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)" }}
                >
                  Location de van aménagé à Capbreton.
                </h1>
                <p className="mt-8 max-w-xl text-lg text-cream/85 leading-relaxed">
                  Deux vans faits main, à louer à l&apos;atelier RB-CapSO : Pénélope pour les duos
                  qui dorment haut, Peggy pour la vie à bord à deux ou à quatre. Retrait
                  sur place, 1,2 km de la plage Notre-Dame.
                </p>
                <div className="mt-10 flex flex-wrap gap-6 items-center">
                  <Link href="/vans" className="btn-primary">
                    Voir les deux vans
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link href="/tarifs" className="text-cream underline underline-offset-8 decoration-cream/35 hover:decoration-cream font-medium">
                    Tarifs détaillés
                  </Link>
                </div>
            </div>
          </div>
        </section>

        {/* Two vans mini listing */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <Reveal as="header" className="mb-12">
              <span className="eyebrow">La flotte à Capbreton</span>
              <h2
                className="leading-[0.95]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", }}
              >
                Deux vans, deux usages.
              </h2>
            </Reveal>

            <RevealStagger className="grid md:grid-cols-2 gap-10 md:gap-14">
              {Object.values(vans).map((van, idx) => (
                <RevealItem key={van.slug} lift>
                <Link
                  href={{ pathname: "/vans/[slug]", params: { slug: van.slug } }}
                  className="group block"
                >
                  <div className="flex items-start justify-between mb-3 font-mono text-xs text-ink/65">
                    <span>Fiche N° P-{String(idx + 1).padStart(2, "0")}</span>
                    <span>{van.model}</span>
                  </div>
                  <div className="relative aspect-[16/11] overflow-hidden bg-cream-deep border border-ink">
                    <Image
                      src={van.gallery[0]}
                      alt={`${van.name}, ${van.model} à louer à Capbreton`}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <h3
                      className="font-display italic"
                      style={{
                        fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                        
                      }}
                    >
                      {van.name}
                    </h3>
                    <span
                      className="font-display tabular-nums"
                      style={{ fontSize: "1.25rem" }}
                    >
                      dès {van.priceFromEuros} €
                      <span className="text-sm text-ink/55">/n</span>
                    </span>
                  </div>
                  <p className="mt-2 text-ink/70 italic font-display leading-snug">
                    « {van.tagline} »
                  </p>
                </Link>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* Pourquoi Capbreton */}
        <section className="py-20 md:py-28 bg-cream-dark/40 border-y border-ink/10">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <Reveal as="header" className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 items-end">
              <div>
                <span className="eyebrow">Terrain</span>
              </div>
              <h2
                className="leading-[0.95] max-w-2xl md:pb-3"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", }}
              >
                Pourquoi Capbreton, pour partir en van ?
              </h2>
            </Reveal>

            <RevealStagger className="grid md:grid-cols-3 gap-10" staggerDelay={0.1}>
              {[
                {
                  title: "Le gouf",
                  body: "Un canyon sous-marin à quelques encablures. Vagues solides toute l'année. Pénélope a vu lever le soleil sur La Piste plus souvent qu'à son tour.",
                },
                {
                  title: "La pinède des Landes",
                  body: "85 km de forêt, 150 km de plages droites. De Capbreton à Messanges, pas une agglomération avant Mimizan. C'est vide, c'est odorant, c'est long.",
                },
                {
                  title: "La frontière basque",
                  body: "Hendaye à 25 min, Saint-Sébastien à 1h20. En van, vous partez petit-déjeuner à Hossegor et vous dînez à Zarautz.",
                },
              ].map((item, i) => (
                <RevealItem as="article" key={item.title} className="border-t border-ink pt-6">
                  <span className="font-mono text-xs text-ink/55 block mb-3">
                    N° {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className="text-2xl font-medium"
                   
                  >
                    {item.title}
                  </h3>
                  <p className="mt-4 text-ink/75 leading-relaxed">{item.body}</p>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* Spots around */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <Reveal as="header" className="mb-12">
              <span className="eyebrow">Aux alentours</span>
              <h2
                className="leading-[0.95]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", }}
              >
                Depuis l&apos;atelier, compteur à zéro.
              </h2>
            </Reveal>

            <RevealStagger className="grid md:grid-cols-2 gap-x-12 gap-y-2 max-w-[900px]" staggerDelay={0.05}>
              {[
                ["Plage Notre-Dame", "4 min"],
                ["Port de plaisance", "5 min"],
                ["Hossegor centre", "7 min"],
                ["Seignosse · Le Penon", "15 min"],
                ["Bayonne", "30 min"],
                ["Biarritz · Côte des Basques", "35 min"],
                ["Saint-Jean-de-Luz", "50 min"],
                ["Hendaye, frontière", "55 min"],
                ["San Sebastián", "1 h 20"],
                ["Mimizan · aire du Courant", "1 h 10"],
              ].map(([place, time]) => (
                <RevealItem
                  key={place}
                  className="flex items-baseline justify-between border-b border-ink/15 py-3"
                >
                  <span className="font-display italic text-lg">{place}</span>
                  <span className="font-mono text-xs text-ink/65 tabular-nums">{time}</span>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28 bg-cream-dark/40 border-y border-ink/10">
          <div className="mx-auto max-w-[820px] px-6 md:px-10">
            <Reveal as="header" className="mb-12">
              <span className="eyebrow">Questions</span>
              <h2
                className="leading-[0.95]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", }}
              >
                Ce qu&apos;on nous demande à Capbreton.
              </h2>
            </Reveal>

            <Reveal className="border-t border-ink" delay={0.1}>
              {(faqSchema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map(
                (q, i) => (
                  <details key={q.name} className="group border-b border-ink">
                    <summary className="py-6 cursor-pointer list-none flex items-baseline justify-between gap-6">
                      <span className="flex items-baseline gap-4">
                        <span className="font-mono text-xs text-ink/65 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="font-display italic text-xl md:text-2xl"
                          style={{ }}
                        >
                          {q.name}
                        </span>
                      </span>
                      <span className="font-display text-2xl text-wood group-open:rotate-45 transition-transform duration-300 leading-none">
                        +
                      </span>
                    </summary>
                    <p className="pb-6 pl-14 text-ink/80 leading-relaxed">
                      {q.acceptedAnswer.text}
                    </p>
                  </details>
                )
              )}
            </Reveal>
          </div>
        </section>

        {/* À lire aussi — internal linking entre landings FR-only */}
        <section className="py-16 md:py-20 border-t border-ink/10">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <span className="eyebrow">À lire aussi</span>
            <RevealStagger as="ul" className="grid md:grid-cols-3 gap-8 mt-6">
              <RevealItem as="li">
                <a href="/location-van-amenage-landes-hossegor-seignosse" className="block group">
                  <span className="font-mono text-xs text-ink/55 block mb-2">Côte landaise</span>
                  <span className="text-xl font-medium group-hover:text-ocean transition-colors" style={{ }}>
                    Location van Hossegor &amp; Seignosse
                  </span>
                </a>
              </RevealItem>
              <RevealItem as="li">
                <a href="/amenagement-van-sur-mesure-landes" className="block group">
                  <span className="font-mono text-xs text-ink/55 block mb-2">Sur mesure</span>
                  <span className="text-xl font-medium group-hover:text-ocean transition-colors" style={{ }}>
                    Aménagement van sur mesure
                  </span>
                </a>
              </RevealItem>
              <RevealItem as="li">
                <Link href="/conception" className="block group">
                  <span className="font-mono text-xs text-ink/55 block mb-2">L&apos;atelier</span>
                  <span className="text-xl font-medium group-hover:text-ocean transition-colors" style={{ }}>
                    Le processus en 5 étapes
                  </span>
                </Link>
              </RevealItem>
            </RevealStagger>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 bg-ink text-cream text-center">
          <Reveal className="mx-auto max-w-[820px] px-6 md:px-10">
            <span className="serial text-cream/55">Prêt à partir</span>
            <h2
              className="mt-6 font-display leading-[1.02] tracking-[-0.025em]"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
              }}
            >
              Capbreton vous attend.
              <br />
              <span
                className="italic text-accent"
                style={{ }}
              >
                Pénélope et Peggy aussi.
              </span>
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link href="/vans" className="btn-primary">
                Voir les deux vans
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="text-cream underline underline-offset-8 decoration-cream/35 hover:decoration-cream font-light"
              >
                Poser une question
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
