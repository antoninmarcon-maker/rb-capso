import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { alternatesFor } from "@/lib/seo";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Aménagement van sur-mesure dans les Landes · Atelier",
    description:
      "Transformez votre van en atelier landais. Conception bois massif, cannage, vert sauge. Devis gratuit, pose soignée à Capbreton.",
  },
  en: {
    title: "Bespoke camper conversion in the Landes",
    description:
      "Have your van converted by hand in our Capbreton workshop. Solid wood, cane, sage green, sheep's wool insulation. Free quote.",
  },
  es: {
    title: "Montaje de furgoneta a medida en Las Landas",
    description:
      "Convertimos su furgoneta en nuestro taller de Capbreton. Madera maciza, ratán, verde salvia. Presupuesto gratuito.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META.fr;
  return {
    title: m.title,
    description: m.description,
    alternates: alternatesFor("/conception", locale),
  };
}

const FAQS_FR = [
  {
    q: "Combien de temps prend un aménagement complet ?",
    a: "Entre 4 et 8 semaines de chantier, après devis signé. Le délai dépend de la complexité.",
  },
  {
    q: "Travaillez-vous sur tous les modèles de van ?",
    a: "Trafic, Ducato, Sprinter, Transporter. Chaque modèle demande ses propres gabarits.",
  },
  {
    q: "Quel budget prévoir ?",
    a: "À partir de 9 000 € pour un aménagement simple (Trafic) et 18 000 € pour un complet (Ducato L2H2). Devis précis après RDV.",
  },
  {
    q: "Quels matériaux utilisez-vous ?",
    a: "Bois massif (pin, chêne, frêne), cannage naturel, isolation laine de mouton, finitions à l'huile dure.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Échelonné : 30 % à la signature, 40 % au démarrage, 30 % à la livraison.",
  },
  {
    q: "Où se trouve l'atelier ?",
    a: "À Capbreton, 9 Rue du Hapchot. Vous apportez votre van, vous le récupérez fini.",
  },
];

const STEPS_FR = [
  "Rendez-vous découverte à l'atelier",
  "Moodboard et trois esquisses à main levée",
  "Devis détaillé sous sept jours",
  "Quatre à huit semaines de chantier",
  "Remise en main propre avec un café",
];

const MATIERES = [
  {
    title: "Bois massif",
    body: "Pin, chêne, frêne. Jamais de mélaminé. Le bois travaille, il vit, il marque le temps. C'est son métier.",
  },
  {
    title: "Cannage naturel",
    body: "Placards et rangements en cannage rattan. Respire, allège visuellement, rappelle le mobilier de campagne.",
  },
  {
    title: "Vert sauge",
    body: "Le blanc s'use. Le sauge se patine. Au bout d'un été, il raconte déjà quelque chose.",
  },
];

export default async function ConceptionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <Header />
      <main id="main" className="pt-16">
        {/* Editorial hero · dark with image right */}
        <section className="bg-ink text-cream relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative mx-auto max-w-[1440px] px-6 md:px-10 py-20 md:py-32 grid md:grid-cols-[1fr_1fr] gap-12 md:gap-16 items-center">
            <div>
              <span className="serial text-cream/65">Chapitre</span>
              <span
                className="block chapter-roman -ml-1 -mb-3 my-3"
                style={{ WebkitTextStroke: "1px rgba(198, 163, 107, 0.5)" }}
              >
                IV
              </span>
              <span className="serial text-cream/65">— Sur-mesure</span>

              <h1
                className="mt-8 font-display leading-[0.92] tracking-[-0.025em]"
                style={{
                  fontSize: "var(--t-display-xl)",
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100",
                  fontWeight: 350,
                }}
              >
                Votre van.
                <br />
                <span
                  className="italic text-ember"
                  style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}
                >
                  Notre atelier.
                </span>
              </h1>

              <p className="mt-8 text-lg text-cream/85 leading-relaxed max-w-xl">
                De la première esquisse à la dernière vis, on le fait à la main. Bois
                massif, cannage, vert sauge, isolation laine de mouton, tableau électrique
                soigné.
              </p>

              <div className="mt-12 flex items-center gap-6">
                <a href="/contact?objet=conception" className="btn-primary">
                  Raconter votre projet
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <span className="serial text-cream/55 italic font-display hidden sm:inline">
                  Devis gratuit · Sous 7 jours
                </span>
              </div>
            </div>

            <Reveal className="relative" delay={0.15}>
              <div className="relative aspect-[4/5] overflow-hidden border border-cream/30 p-2.5 bg-cream/5">
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src="/atelier-hero.jpg"
                    alt="Atelier RB-CapSO · copeaux, outils, cannage en cours"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
              <p className="mt-3 catalog-tag text-cream/55 italic text-center font-display">
                Cliché · atelier, Capbreton 2026
              </p>
            </Reveal>
          </div>
        </section>

        {/* Process · numbered steps */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <Reveal as="header" className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 items-end">
              <div>
                <span className="serial text-ink/55">— Procédé</span>
              </div>
              <div className="max-w-2xl md:pb-3">
                <h2
                  className="font-display leading-[0.95] tracking-[-0.025em]"
                  style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
                >
                  En cinq étapes, sans surprise.
                </h2>
                <hr className="rule-double mt-8 max-w-[60%]" />
              </div>
            </Reveal>

            <Reveal as="ol" className="grid md:grid-cols-[140px_1fr] gap-y-6 gap-x-6 md:gap-x-12 max-w-[900px]" delay={0.1}>
              {STEPS_FR.map((step, i) => (
                <li
                  key={i}
                  className="contents"
                >
                  <span className="font-display italic text-wood font-light tabular-nums md:pt-1" style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontVariationSettings: "'opsz' 96, 'SOFT' 100" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="pb-6 md:pb-8 border-b border-ink/15">
                    <p className="font-display italic text-xl md:text-2xl" style={{ fontVariationSettings: "'opsz' 36, 'WONK' 1" }}>
                      {step}
                    </p>
                  </div>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Materials */}
        <section className="py-20 md:py-28 bg-cream-dark/40 border-y border-ink/10">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <Reveal as="header" className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 items-end">
              <div>
                <span className="serial text-ink/55">— Matières</span>
              </div>
              <h2
                className="font-display leading-[0.95] tracking-[-0.025em] max-w-2xl md:pb-3"
                style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
              >
                Trois principes, tenus.
              </h2>
            </Reveal>

            <RevealStagger className="grid md:grid-cols-3 gap-10">
              {MATIERES.map((item, i) => (
                <RevealItem as="article" key={item.title} className="border-t border-ink pt-6">
                  <span className="catalog-tag text-ink/55 block mb-3">
                    N° {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display italic text-3xl" style={{ fontVariationSettings: "'opsz' 96, 'WONK' 1" }}>
                    {item.title}
                  </h3>
                  <p className="mt-4 text-ink/75 leading-relaxed">{item.body}</p>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* FAQ · editorial accordion */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[820px] px-6 md:px-10">
            <Reveal as="header" className="mb-12">
              <span className="serial text-ink/55 block mb-3">— Questions</span>
              <h2
                className="font-display leading-[0.95] tracking-[-0.025em]"
                style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
              >
                Ce qu&apos;on nous demande.
              </h2>
            </Reveal>

            <Reveal className="space-y-0 border-t border-ink" delay={0.1}>
              {FAQS_FR.map((faq, i) => (
                <details
                  key={faq.q}
                  className="group border-b border-ink"
                >
                  <summary className="py-6 cursor-pointer list-none flex items-baseline justify-between gap-6">
                    <span className="flex items-baseline gap-4">
                      <span className="catalog-tag text-ink/65 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display italic text-xl md:text-2xl" style={{ fontVariationSettings: "'opsz' 36, 'WONK' 1" }}>
                        {faq.q}
                      </span>
                    </span>
                    <span className="font-display text-2xl text-wood group-open:rotate-45 transition-transform duration-300 leading-none">
                      +
                    </span>
                  </summary>
                  <p className="pb-6 pl-14 text-ink/80 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 bg-ink text-cream text-center">
          <Reveal className="mx-auto max-w-[820px] px-6 md:px-10">
            <span className="serial text-cream/55">— Passer à l&apos;atelier</span>
            <h2
              className="mt-6 font-display leading-[1.02] tracking-[-0.025em]"
              style={{
                fontSize: "var(--t-display-l)",
                fontVariationSettings: "'opsz' 144, 'SOFT' 100",
              }}
            >
              Un projet ?
              <br />
              <span
                className="italic text-ember"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}
              >
                Parlons-en.
              </span>
            </h2>
            <p className="mt-6 text-lg text-cream/75 leading-relaxed">
              Un rendez-vous d&apos;une heure, à l&apos;atelier ou en visio. On parle usage,
              couchage, autonomie, budget.
            </p>
            <div className="mt-10">
              <a href="/contact?objet=conception" className="btn-primary">
                Passer à l&apos;atelier
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <p className="mt-12 flex items-center justify-center gap-4 text-cream/65 serial">
              <span>p. 04</span>
              <span className="w-16 h-px bg-cream/15" />
              <span className="font-display italic">§</span>
              <span className="w-16 h-px bg-cream/15" />
              <span>RB · CapSO</span>
            </p>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
