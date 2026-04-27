import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
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

  return (
    <>
      <Header />
      <main id="main" className="pt-16">
        <section className="bg-ink text-cream relative overflow-hidden">
          <div className="relative mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div>
              <span className="eyebrow text-sage-deep">Sur-mesure</span>
              <h1
                className="mt-6 leading-[0.95]"
                style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)" }}
              >
                Votre van, notre atelier.
              </h1>
              <p className="mt-7 text-lg text-cream/80 leading-relaxed max-w-xl">
                De la première esquisse à la dernière vis, on le fait à la main. Bois
                massif, cannage, vert sauge, isolation laine de mouton, tableau électrique
                soigné.
              </p>
              <div className="mt-10 flex items-center gap-6 flex-wrap">
                <a href="/contact?objet=conception" className="btn-primary">
                  Raconter votre projet
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <span className="font-mono text-xs text-cream/55 hidden sm:inline">
                  Devis gratuit · sous 7 jours
                </span>
              </div>
            </div>

            <Reveal delay={0.15}>
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src="/atelier-hero.jpg"
                  alt="Atelier RB-CapSO"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-cream">
          <div className="mx-auto max-w-[1240px] px-6 md:px-12">
            <Reveal as="header" className="mb-14 max-w-3xl">
              <span className="eyebrow">Procédé</span>
              <h2
                className="mt-5 leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                En cinq étapes, sans surprise.
              </h2>
            </Reveal>

            <Reveal as="ol" className="grid md:grid-cols-[3rem_1fr] gap-y-5 gap-x-6 md:gap-x-10 max-w-[820px]" delay={0.1}>
              {STEPS_FR.map((step, i) => (
                <li key={i} className="contents">
                  <span className="font-mono text-base text-ocean tabular-nums md:pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="pb-5 md:pb-6 border-b border-ink/10">
                    <p className="text-lg md:text-xl">{step}</p>
                  </div>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-cream-dark/40 border-y border-ink/10">
          <div className="mx-auto max-w-[1240px] px-6 md:px-12">
            <Reveal as="header" className="mb-14 max-w-3xl">
              <span className="eyebrow">Matières</span>
              <h2
                className="mt-5 leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                Trois principes, tenus.
              </h2>
            </Reveal>

            <RevealStagger className="grid md:grid-cols-3 gap-8">
              {MATIERES.map((item, i) => (
                <RevealItem as="article" key={item.title} className="border-t-2 border-ink pt-6">
                  <span className="font-mono text-xs text-ink/55 mb-3 inline-block">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-2xl md:text-3xl">{item.title}</h3>
                  <p className="mt-4 text-ink/75 leading-relaxed">{item.body}</p>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-cream">
          <div className="mx-auto max-w-[820px] px-6 md:px-12">
            <Reveal as="header" className="mb-12">
              <span className="eyebrow">Questions</span>
              <h2
                className="mt-5 leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                Ce qu&apos;on nous demande.
              </h2>
            </Reveal>

            <Reveal className="border-t border-ink/10" delay={0.1}>
              {FAQS_FR.map((faq, i) => (
                <details key={faq.q} className="group border-b border-ink/10">
                  <summary className="py-5 cursor-pointer list-none flex items-baseline justify-between gap-6">
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-xs text-ink/55 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-lg md:text-xl font-medium">{faq.q}</span>
                    </span>
                    <span className="text-2xl text-ocean group-open:rotate-45 transition-transform duration-300 leading-none">
                      +
                    </span>
                  </summary>
                  <p className="pb-6 pl-12 text-ink/75 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-ink text-cream text-center">
          <Reveal className="mx-auto max-w-[820px] px-6 md:px-12">
            <span className="eyebrow text-sage-deep">Passer à l&apos;atelier</span>
            <h2
              className="mt-6 leading-[1.05]"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
            >
              Un projet ? Parlons-en.
            </h2>
            <p className="mt-6 text-lg text-cream/75 leading-relaxed">
              Un rendez-vous d&apos;une heure, à l&apos;atelier ou en visio. On parle usage,
              couchage, autonomie, budget.
            </p>
            <div className="mt-10">
              <a href="/contact?objet=conception" className="btn-primary">
                Passer à l&apos;atelier
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
