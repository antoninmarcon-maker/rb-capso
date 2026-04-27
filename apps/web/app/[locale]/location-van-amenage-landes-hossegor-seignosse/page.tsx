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

const TITLE =
  "Location van aménagé Hossegor, Seignosse, Landes · RB-CapSO";
const DESC =
  "Louez un van aménagé au cœur des Landes : Hossegor, Seignosse, Capbreton. Pénélope et Peggy, faits main par un menuisier landais. Dès 90 €/nuit, retrait à Capbreton.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESC,
    alternates: {
      canonical: `${SITE_URL}/location-van-amenage-landes-hossegor-seignosse`,
      languages: {
        fr: `${SITE_URL}/location-van-amenage-landes-hossegor-seignosse`,
        "x-default": `${SITE_URL}/location-van-amenage-landes-hossegor-seignosse`,
      },
    },
    openGraph: {
      title: TITLE,
      description: DESC,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/api/og?title=${encodeURIComponent("Van Hossegor & Seignosse")}&subtitle=${encodeURIComponent("Fait main dans les Landes")}&eyebrow=${encodeURIComponent("Côte landaise")}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function LocationHossegorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "fr") notFound();
  setRequestLocale(locale);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Peut-on récupérer le van directement à Hossegor ou Seignosse ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "L'atelier est à Capbreton, à 7 minutes de Hossegor centre et 15 minutes du Penon, Seignosse. Pour un dépôt sur place à Hossegor, nous proposons un service de convoyage (+ 35 €).",
        },
      },
      {
        "@type": "Question",
        name: "Quelles plages pour surfer depuis le van ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Les Culs-Nus, La Gravière, La Nord à Hossegor. Le Penon, Les Bourdaines, Les Estagnots à Seignosse. Toutes accessibles en moins de 20 minutes depuis l'atelier.",
        },
      },
      {
        "@type": "Question",
        name: "Où dormir en van autour de Hossegor et Seignosse ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Deux camping municipaux (Les Oyats, Les Chevreuils), trois aires CamperContact à Hossegor et Seignosse. France Passion propose plusieurs domaines viticoles et ostréicoles à moins de 30 min. Nous donnons une sélection imprimée au départ.",
        },
      },
      {
        "@type": "Question",
        name: "La location inclut-elle le linge et l'équipement cuisine ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, draps housses en coton bio, serviettes, kit cuisine complet (gazinière 2 feux, vaisselle pour 4, cafetière italienne). Kit plage en supplément (5 € / location).",
        },
      },
      {
        "@type": "Question",
        name: "Peut-on partir pour un long week-end seulement ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, location à partir de 2 nuits en basse saison, 3 nuits en été. Retrait le vendredi 17 h, retour le dimanche ou lundi 11 h.",
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
                  Hossegor · Seignosse · Capbreton
                </span>
                <h1
                  className="mt-5 leading-[0.95]"
                  style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)" }}
                >
                  Van aménagé, côte landaise.
                </h1>
                <p className="mt-8 max-w-xl text-lg text-cream/85 leading-relaxed">
                  De Hossegor à Seignosse, 150 km de plages droites, une forêt de pins
                  odorante et deux vans qui savent où dormir. Retrait à notre atelier
                  de Capbreton, à sept minutes du centre d&apos;Hossegor.
                </p>
                <div className="mt-10 flex flex-wrap gap-6 items-center">
                  <Link href="/vans" className="btn-primary">
                    Choisir un van
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

        {/* Spots surf editorial */}
        <section className="py-20 md:py-28 bg-cream">
          <div className="mx-auto max-w-[1240px] px-6 md:px-12">
            <Reveal as="header" className="mb-14 max-w-3xl">
              <span className="eyebrow">Les vagues</span>
              <h2
                className="mt-5 leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                Six spots, vingt minutes, aucune excuse.
              </h2>
            </Reveal>

            <RevealStagger className="grid md:grid-cols-3 gap-10" staggerDelay={0.08}>
              {[
                {
                  n: "01",
                  title: "Les Culs-Nus",
                  city: "Hossegor",
                  body: "Beach break exigeant, sable qui bouge, locals patients. Mieux vaut arriver à 7 h avec un café et rentrer dans sa serviette.",
                },
                {
                  n: "02",
                  title: "La Gravière",
                  city: "Hossegor",
                  body: "Spot de l'Authentic Pro, barre de sable historique. On y regarde, on y surfe quand la houle est petite. Parking sous les pins.",
                },
                {
                  n: "03",
                  title: "La Nord",
                  city: "Capbreton",
                  body: "Jetée + canyon du gouf = épaule épaisse. Spot de compétition, niveau requis mais magnifique au crépuscule.",
                },
                {
                  n: "04",
                  title: "Le Penon",
                  city: "Seignosse",
                  body: "Beach break familial, plus doux. Pins maritimes au parking, souvent ombragé. Bon spot de repli quand la houle est musclée.",
                },
                {
                  n: "05",
                  title: "Les Bourdaines",
                  city: "Seignosse",
                  body: "Surf école, fond de sable, bars à tapas en bord de plage. Où Peggy attend sagement pendant que vous prenez votre premier take-off.",
                },
                {
                  n: "06",
                  title: "Les Estagnots",
                  city: "Seignosse",
                  body: "Le plus au nord des spots faciles avant Capbreton. Parking grand, propre, autorisé en stationnement de jour.",
                },
              ].map((spot) => (
                <RevealItem as="article" key={spot.n} className="border-t border-ink pt-6">
                  <div className="flex items-baseline justify-between mb-3 font-mono text-xs text-ink/55">
                    <span>N° {spot.n}</span>
                    <span>{spot.city}</span>
                  </div>
                  <h3
                    className="text-2xl font-medium"
                   
                  >
                    {spot.title}
                  </h3>
                  <p className="mt-4 text-ink/75 leading-relaxed">{spot.body}</p>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* Two vans */}
        <section className="py-20 md:py-28 bg-cream-dark/40 border-y border-ink/10">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <Reveal as="header" className="mb-12">
              <span className="eyebrow">La flotte</span>
              <h2
                className="leading-[0.95]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", }}
              >
                Deux vans, deux tempéraments.
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
                      alt={`${van.name}, location van ${van.model} à Hossegor Seignosse`}
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

        {/* FAQ */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[820px] px-6 md:px-10">
            <Reveal as="header" className="mb-12">
              <span className="eyebrow">Questions</span>
              <h2
                className="leading-[0.95]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", }}
              >
                Sur la côte, ce qu&apos;on nous demande.
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

        {/* À lire aussi */}
        <section className="py-16 md:py-20 border-t border-ink/10">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <span className="eyebrow">À lire aussi</span>
            <RevealStagger as="ul" className="grid md:grid-cols-3 gap-8 mt-6">
              <RevealItem as="li">
                <a href="/location-van-capbreton" className="block group">
                  <span className="font-mono text-xs text-ink/55 block mb-2">Capbreton</span>
                  <span className="text-xl font-medium group-hover:text-ocean transition-colors" style={{ }}>
                    Location van à Capbreton
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
                <Link href="/vans" className="block group">
                  <span className="font-mono text-xs text-ink/55 block mb-2">La flotte</span>
                  <span className="text-xl font-medium group-hover:text-ocean transition-colors" style={{ }}>
                    Pénélope &amp; Peggy
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
              Hossegor à 7 minutes.
              <br />
              <span
                className="italic text-accent"
                style={{ }}
              >
                Le van est prêt.
              </span>
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link href="/vans" className="btn-primary">
                Choisir un van
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
