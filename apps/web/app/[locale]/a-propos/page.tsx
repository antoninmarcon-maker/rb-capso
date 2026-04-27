import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { PersonSchema } from "@/components/schema/PersonSchema";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";
import { alternatesFor } from "@/lib/seo";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "L'atelier · Capbreton",
    description: "L'histoire d'un ex-sapeur-pompier devenu menuisier à Capbreton. Atelier, matière, route.",
  },
  en: {
    title: "The workshop · Capbreton",
    description: "The story of a former firefighter turned carpenter in Capbreton. Workshop, matter, road.",
  },
  es: {
    title: "El taller · Capbreton",
    description: "Historia de un ex-bombero reconvertido en carpintero en Capbreton. Taller, materia, ruta.",
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
    alternates: alternatesFor("/a-propos", locale),
  };
}

export default async function AProposPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = t.raw("about.here_items") as Array<[string, string]>;

  return (
    <>
      <PersonSchema />
      <Header />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1240px] px-6 md:px-12 py-20 md:py-28">
          <header className="max-w-3xl mb-16">
            <span className="eyebrow">{t("about.eyebrow")}</span>
            <h1
              className="mt-5 leading-[0.95]"
              style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)" }}
            >
              {t("about_h1")}
            </h1>
          </header>
        </section>

        <section className="mx-auto max-w-[1240px] px-6 md:px-12">
          <Reveal className="relative max-w-[920px] mx-auto">
            <div className="relative aspect-[3/2] overflow-hidden bg-cream-deep">
              <Image
                src="/portrait-atelier.jpg"
                alt="Portrait du fondateur de RB-CapSO dans son atelier à Capbreton"
                fill
                sizes="(min-width: 920px) 920px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-[1240px] px-6 md:px-12 py-20 md:py-28">
          <div className="grid md:grid-cols-[1fr_minmax(auto,300px)] gap-12 md:gap-16 items-start max-w-4xl">
            <Reveal>
              <p className="text-lg md:text-xl text-ink/85 leading-relaxed">
                {t("about.p1")}
              </p>
              <p className="mt-5 text-base md:text-lg text-ink/75 leading-relaxed">
                {t("about.p2")}
              </p>
              <p className="mt-5 text-base md:text-lg text-ink/75 leading-relaxed">
                {t("about.p3")}
              </p>

              <p className="mt-12 pt-8 border-t border-ink/10 text-2xl md:text-3xl text-ink leading-snug font-medium">
                {t("tagline")}
              </p>
              <p className="mt-3 text-sm text-ink/55 font-mono">
                Romain · Capbreton, 2026
              </p>
            </Reveal>

            <aside className="hidden md:block space-y-4">
              <Reveal delay={0.15}>
                <div className="border border-ink/10 p-5 bg-cream">
                  <p className="text-xs text-ink/55 font-mono uppercase tracking-wide mb-2">Adresse</p>
                  <p className="font-medium">9 Rue du Hapchot</p>
                  <p className="font-medium">40130 Capbreton</p>
                  <p className="text-xs text-ink/55 font-mono mt-2">
                    43°38&apos;37&quot;N · 1°25&apos;46&quot;W
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.25}>
                <div className="border border-ink/10 p-5 bg-cream">
                  <p className="text-xs text-ink/55 font-mono uppercase tracking-wide mb-2">Statut</p>
                  <p className="font-medium">Auto-entrepreneur</p>
                  <p className="text-sm text-ink/65 mt-1">Franchise TVA</p>
                </div>
              </Reveal>
            </aside>
          </div>
        </section>

        <section className="bg-cream-dark/40 py-20 md:py-28 border-y border-ink/10">
          <div className="mx-auto max-w-[1240px] px-6 md:px-12">
            <Reveal as="header" className="mb-12 max-w-3xl">
              <span className="eyebrow">Sommaire</span>
              <h2
                className="mt-5 leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                {t("about.here_title")}
              </h2>
            </Reveal>

            <RevealStagger as="dl" className="grid md:grid-cols-2 gap-x-12 gap-y-6 max-w-[1100px]" staggerDelay={0.06}>
              {items.map(([term, def], i) => (
                <RevealItem key={term} className="grid grid-cols-[2.5rem_1fr] gap-4 items-baseline border-b border-ink/10 pb-5">
                  <span className="font-mono text-sm text-ocean tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <dt className="font-medium text-lg">{term}</dt>
                    <dd className="mt-1.5 text-ink/70 leading-relaxed text-base">{def}</dd>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
