import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { JsonLd } from "@/components/schema/JsonLd";
import { Link } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";

const TITLE = "Aménagement van sur mesure — Atelier menuiserie Landes, Capbreton";
const DESC =
  "Aménagement de van artisanal dans les Landes. Menuisier à Capbreton. Bois massif, cannage rotin, finitions à la main. Devis sur plan, délai 6 à 10 semaines.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESC,
    alternates: {
      canonical: `${SITE_URL}/amenagement-van-sur-mesure-landes`,
      languages: {
        fr: `${SITE_URL}/amenagement-van-sur-mesure-landes`,
        "x-default": `${SITE_URL}/amenagement-van-sur-mesure-landes`,
      },
    },
    openGraph: {
      title: TITLE,
      description: DESC,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/api/og?title=${encodeURIComponent("Aménagement van sur mesure")}&subtitle=${encodeURIComponent("Menuiserie, Landes")}&eyebrow=${encodeURIComponent("Atelier Capbreton")}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function AmenagementLandesPage({
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
        name: "Quel est le prix d'un aménagement de van sur mesure ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "À partir de 14 000 € pour un L2H2 standard avec banquette-lit, cuisine, rangements et isolation. Jusqu'à 28 000 € pour un L3H2 avec cellule humide, électronique solaire et finitions cannage. Devis sur plan, jamais sur coin de table.",
        },
      },
      {
        "@type": "Question",
        name: "Quel est le délai pour un aménagement complet ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "6 à 10 semaines selon la complexité. L'atelier ne prend qu'un projet à la fois pour garantir la qualité de finition. Créneau confirmé après acompte.",
        },
      },
      {
        "@type": "Question",
        name: "Quels matériaux sont utilisés ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bois massif (chêne, frêne), contreplaqué peuplier bouleau cintrable pour les arrondis, cannage rotin pour les portes ventilées, lin pour les textiles, laine de bois pour l'isolation. Aucun mélaminé, aucune finition plastique.",
        },
      },
      {
        "@type": "Question",
        name: "Travaillez-vous sur tous les modèles de van ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, nous aménageons Ford Transit Custom, Fiat Ducato, Mercedes Sprinter, Volkswagen Crafter, Peugeot Boxer, Renault Master. L'atelier reçoit votre véhicule ou vous aide à le sourcer.",
        },
      },
      {
        "@type": "Question",
        name: "Proposez-vous aussi l'électricité solaire et la plomberie ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, circuit 12 V avec batterie lithium LiFePO4, panneau solaire 200 à 400 W selon usage, plomberie froide + chaude (chauffe-eau Propex), douchette extérieure en option. Tout est certifié et documenté.",
        },
      },
      {
        "@type": "Question",
        name: "Peut-on visiter l'atelier avant de décider ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bien sûr. L'atelier est ouvert du lundi au samedi, 9 h à 19 h, sur rendez-vous. 9 Rue du Hapchot, 40130 Capbreton. Vous verrez les vans en cours, vous touchez les matériaux, vous repartez avec un devis sur plan.",
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
        <section className="bg-ink text-cream py-24 md:py-32 relative overflow-hidden">
          <span
            aria-hidden
            className="absolute -top-10 md:-top-16 -left-6 md:-left-10 font-display text-cream/[0.06] pointer-events-none select-none"
            style={{
              fontSize: "clamp(18rem, 35vw, 32rem)",
              lineHeight: 0.75,
              letterSpacing: "-0.06em",
              WebkitTextStroke: "1px rgb(244 240 230 / 0.14)",
              color: "transparent",
              fontVariationSettings: "'opsz' 144, 'SOFT' 30",
            }}
          >
            IV
          </span>
          <div className="relative mx-auto max-w-[1240px] px-6 md:px-10">
            <div className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 items-end">
              <div>
                <span className="serial text-cream/65">Métier</span>
                <span className="coords block mt-2 text-cream/65">
                  Menuiserie · Capbreton
                </span>
              </div>
              <div>
                <span className="eyebrow text-sage-soft">
                  Aménagement sur mesure
                </span>
                <h1
                  className="mt-6 font-display leading-[0.92] tracking-[-0.025em]"
                  style={{
                    fontSize: "var(--t-display-xl)",
                    fontVariationSettings: "'opsz' 144, 'SOFT' 100",
                    fontWeight: 350,
                  }}
                >
                  Votre van,
                  <br />
                  <span
                    className="italic text-ember"
                    style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}
                  >
                    fait à la main.
                  </span>
                </h1>
                <p className="mt-8 max-w-xl text-lg text-cream/85 leading-relaxed">
                  Atelier de menuiserie à Capbreton, Landes. Bois massif, cannage rotin,
                  lin, laine de bois. Un projet à la fois, jamais deux. Ce que vous avez
                  en tête, je le dessine. Ce que vous avez dessiné, je le fabrique.
                </p>
                <div className="mt-10 flex flex-wrap gap-6 items-center">
                  <Link href="/conception" className="btn-primary">
                    Voir le processus
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link href="/contact" className="text-cream underline underline-offset-8 decoration-cream/35 hover:decoration-cream font-light">
                    Demander un devis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 pillars — métier */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <Reveal as="header" className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 items-end">
              <div>
                <span className="serial text-ink/55">— Méthode</span>
              </div>
              <h2
                className="font-display leading-[0.95] tracking-[-0.025em] max-w-2xl md:pb-3"
                style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
              >
                Ce qui fait qu&apos;un van dure
                <br />
                <span
                  className="italic text-wood"
                  style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 80, 'WONK' 1" }}
                >
                  dix ans, pas deux.
                </span>
              </h2>
            </Reveal>

            <RevealStagger className="grid md:grid-cols-3 gap-14" staggerDelay={0.1}>
              {[
                {
                  n: "01",
                  title: "Bois massif, pas de mélaminé",
                  body: "Les meubles sont en chêne, frêne et contreplaqué peuplier-bouleau. Les panneaux vibrent, les chants s'usent : un mélaminé s'écaille en six mois, un massif prend une patine en dix ans.",
                },
                {
                  n: "02",
                  title: "Un projet à la fois",
                  body: "L'atelier ne mène jamais deux vans en parallèle. Vous avez l'entière attention du menuisier pendant votre créneau. Pas de sous-traitance, pas de chaîne de montage.",
                },
                {
                  n: "03",
                  title: "Dessiné avec vous, pas pour vous",
                  body: "La première étape, c'est un aller-retour de plans au crayon. On ajuste jusqu'à ce que vous visualisiez où vous rangerez votre tasse à café à 7 h du matin.",
                },
              ].map((p) => (
                <RevealItem as="article" key={p.n} className="border-t border-ink pt-6">
                  <span className="catalog-tag text-ink/55 block mb-3">N° {p.n}</span>
                  <h3
                    className="font-display italic text-3xl leading-tight"
                    style={{ fontVariationSettings: "'opsz' 96, 'WONK' 1" }}
                  >
                    {p.title}
                  </h3>
                  <p className="mt-4 text-ink/75 leading-relaxed">{p.body}</p>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* Pricing table */}
        <section className="py-20 md:py-28 bg-cream-dark/40 border-y border-ink/10">
          <div className="mx-auto max-w-[1000px] px-6 md:px-10">
            <Reveal as="header" className="mb-10">
              <span className="serial text-ink/55 block mb-3">— Échelle de prix</span>
              <h2
                className="font-display leading-[0.95] tracking-[-0.025em]"
                style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
              >
                Trois formats, trois budgets.
              </h2>
              <p className="mt-4 text-ink/70 max-w-xl">
                Indicatif, hors véhicule. Chaque projet reçoit un devis nominatif
                après dessin des plans.
              </p>
            </Reveal>

            <RevealStagger className="border border-ink bg-cream" staggerDelay={0.1}>
              {[
                {
                  name: "Compact",
                  sub: "L1H1 · banquette-lit, cuisine froide, rangements",
                  price: "14 000 — 17 000 €",
                  weeks: "6 sem.",
                },
                {
                  name: "Voyage",
                  sub: "L2H2 · lit fixe, cuisine chaude, solaire 200 W, isolation",
                  price: "18 000 — 23 000 €",
                  weeks: "7 sem.",
                },
                {
                  name: "Expédition",
                  sub: "L3H2 · cellule humide, douche, solaire 400 W, cannage rotin",
                  price: "24 000 — 28 000 €",
                  weeks: "10 sem.",
                },
              ].map((row, i) => (
                <RevealItem
                  key={row.name}
                  className={`grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto] gap-4 md:gap-10 px-6 md:px-8 py-6 ${
                    i > 0 ? "border-t border-ink/25" : ""
                  }`}
                >
                  <div>
                    <h3
                      className="font-display italic text-2xl md:text-3xl"
                      style={{ fontVariationSettings: "'opsz' 96, 'WONK' 1" }}
                    >
                      {row.name}
                    </h3>
                    <p className="mt-1 text-ink/65 text-sm md:text-base">{row.sub}</p>
                  </div>
                  <div className="hidden md:block text-right">
                    <span className="catalog-tag text-ink/55">Délai</span>
                    <p className="font-display tabular-nums text-lg">{row.weeks}</p>
                  </div>
                  <div className="text-right">
                    <span className="catalog-tag text-ink/55">Budget</span>
                    <p className="font-display tabular-nums text-lg md:text-xl">
                      {row.price}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[820px] px-6 md:px-10">
            <Reveal as="header" className="mb-12">
              <span className="serial text-ink/55 block mb-3">— Questions</span>
              <h2
                className="font-display leading-[0.95] tracking-[-0.025em]"
                style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
              >
                Avant de dessiner le plan.
              </h2>
            </Reveal>

            <Reveal className="border-t border-ink" delay={0.1}>
              {(faqSchema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map(
                (q, i) => (
                  <details key={q.name} className="group border-b border-ink">
                    <summary className="py-6 cursor-pointer list-none flex items-baseline justify-between gap-6">
                      <span className="flex items-baseline gap-4">
                        <span className="catalog-tag text-ink/65 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="font-display italic text-xl md:text-2xl"
                          style={{ fontVariationSettings: "'opsz' 36, 'WONK' 1" }}
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
            <span className="serial text-ink/55 block mb-3">— À lire aussi</span>
            <RevealStagger as="ul" className="grid md:grid-cols-3 gap-8 mt-6">
              <RevealItem as="li">
                <a href="/location-van-capbreton" className="block group">
                  <span className="catalog-tag text-ink/55 block mb-2">Location</span>
                  <span className="font-display italic text-2xl group-hover:text-ember transition-colors" style={{ fontVariationSettings: "'opsz' 48, 'WONK' 1" }}>
                    Location van à Capbreton
                  </span>
                </a>
              </RevealItem>
              <RevealItem as="li">
                <a href="/location-van-amenage-landes-hossegor-seignosse" className="block group">
                  <span className="catalog-tag text-ink/55 block mb-2">Côte landaise</span>
                  <span className="font-display italic text-2xl group-hover:text-ember transition-colors" style={{ fontVariationSettings: "'opsz' 48, 'WONK' 1" }}>
                    Hossegor &amp; Seignosse
                  </span>
                </a>
              </RevealItem>
              <RevealItem as="li">
                <Link href="/vans" className="block group">
                  <span className="catalog-tag text-ink/55 block mb-2">La flotte</span>
                  <span className="font-display italic text-2xl group-hover:text-ember transition-colors" style={{ fontVariationSettings: "'opsz' 48, 'WONK' 1" }}>
                    Pénélope &amp; Peggy
                  </span>
                </Link>
              </RevealItem>
            </RevealStagger>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 md:py-32 bg-ink text-cream text-center">
          <Reveal className="mx-auto max-w-[820px] px-6 md:px-10">
            <span className="serial text-cream/55">— Un projet, un devis</span>
            <h2
              className="mt-6 font-display leading-[1.02] tracking-[-0.025em]"
              style={{
                fontSize: "var(--t-display-l)",
                fontVariationSettings: "'opsz' 144, 'SOFT' 100",
              }}
            >
              Dessinons le vôtre.
            </h2>
            <p className="mt-6 text-cream/75 max-w-xl mx-auto leading-relaxed">
              Une visite à l&apos;atelier, une tasse de café, quarante minutes de
              discussion. Vous repartez avec un devis sur plan, pas sur coin de table.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link href="/contact" className="btn-primary">
                Prendre rendez-vous
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/conception"
                className="text-cream underline underline-offset-8 decoration-cream/35 hover:decoration-cream font-light"
              >
                Voir le processus complet
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
