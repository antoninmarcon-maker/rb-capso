import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Signature } from "@/components/marketing/Signature";
import { alternatesFor } from "@/lib/seo";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "L'atelier — Capbreton",
    description: "L'histoire d'un ex-sapeur-pompier devenu menuisier à Capbreton. Atelier, matière, route.",
  },
  en: {
    title: "The workshop — Capbreton",
    description: "The story of a former firefighter turned carpenter in Capbreton. Workshop, matter, road.",
  },
  es: {
    title: "El taller — Capbreton",
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
      <Header />
      <main id="main" className="pt-16">
        {/* Hero / chapter mark */}
        <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-24">
          <header className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 items-end">
            <div>
              <span className="serial text-ink/55">Chapitre</span>
              <span className="block chapter-roman -ml-1 -mb-3">VI</span>
              <span className="serial text-ink/55">— L&apos;atelier</span>
            </div>
            <div className="md:pb-3">
              <span className="eyebrow text-sage-deep">{t("about.eyebrow")}</span>
              <h1
                className="mt-5 font-display leading-[0.92] tracking-[-0.025em]"
                style={{
                  fontSize: "var(--t-display-xl)",
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100",
                  fontWeight: 350,
                }}
              >
                {t("about_h1")}
              </h1>
              <hr className="rule-double mt-8 max-w-[40%]" />
            </div>
          </header>
        </section>

        {/* Image archive frame */}
        <section className="mx-auto max-w-[1240px] px-6 md:px-10">
          <div className="relative max-w-[820px] mx-auto">
            <div className="relative aspect-[3/2] overflow-hidden border border-ink p-2.5 bg-cream-deep">
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src="/portrait-atelier.jpg"
                  alt="Portrait du fondateur de RB-CapSO dans son atelier à Capbreton"
                  fill
                  sizes="(min-width: 820px) 820px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <p className="mt-3 catalog-tag text-ink/55 italic text-center font-display">
              Cliché — atelier, Capbreton 2026
            </p>
          </div>
        </section>

        {/* Editorial body */}
        <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-20 md:py-28">
          <div className="grid md:grid-cols-[140px_1fr_minmax(auto,300px)] gap-6 md:gap-12 items-start">
            {/* Margin notes */}
            <aside className="hidden md:block pt-2 sticky top-24 self-start">
              <p className="margin-note text-ink/65">
                i. Avant l&apos;atelier, douze ans de caserne.
              </p>
              <p className="margin-note text-ink/55 mt-6">
                ii. Capbreton, été 2025.
              </p>
              <p className="margin-note text-ink/55 mt-6">
                iii. Bois clair, cannage, vert sauge.
              </p>
            </aside>

            <div>
              <p className="drop-cap text-lg md:text-xl text-ink/90 leading-relaxed">
                {t("about.p1")}
              </p>
              <p className="mt-6 text-base md:text-lg text-ink/80 leading-relaxed">
                {t("about.p2")}
              </p>
              <p className="mt-6 text-base md:text-lg text-ink/80 leading-relaxed">
                {t("about.p3")}
              </p>

              <figure className="mt-12 pt-8 border-t border-ink/15">
                <blockquote
                  className="font-display italic text-ember leading-[1.05] tracking-tight"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.5rem)",
                    fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
                  }}
                >
                  « {t("tagline")} »
                </blockquote>
                <figcaption className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Signature className="text-ink/85" width={170} />
                  <span className="serial text-ink/55">
                    Romain · Capbreton, 2026
                  </span>
                </figcaption>
              </figure>
            </div>

            {/* Right column — small archive ticket */}
            <aside className="hidden md:block pt-12 space-y-4">
              <div className="border border-ink/30 p-4 bg-cream/60">
                <p className="catalog-tag text-ink/55">— Coordonnées</p>
                <p className="font-display italic text-base mt-1">9 Rue du Hapchot</p>
                <p className="font-display italic text-base">40130 Capbreton</p>
                <p className="coords text-ink/65 mt-2">
                  43°38&apos;37&quot;N · 1°25&apos;46&quot;W
                </p>
              </div>

              <div className="border border-ink/30 p-4 bg-cream/60">
                <p className="catalog-tag text-ink/55">— Statut</p>
                <p className="font-display italic text-base mt-1">Auto-entrepreneur</p>
                <p className="text-sm text-ink/65 mt-1">Franchise TVA</p>
              </div>
            </aside>
          </div>
        </section>

        {/* "Ici" — what you'll find */}
        <section className="bg-cream-dark/50 py-20 md:py-28 border-y border-ink/10">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10">
            <header className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-12 items-end">
              <div>
                <span className="serial text-ink/55">— Sommaire</span>
              </div>
              <h2
                className="font-display leading-[0.95] tracking-[-0.025em] max-w-2xl"
                style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
              >
                {t("about.here_title")}
              </h2>
            </header>

            <dl className="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-[1100px] ml-auto">
              {items.map(([term, def], i) => (
                <div key={term} className="grid grid-cols-[3rem_1fr] gap-5 items-baseline border-b border-ink/15 pb-5">
                  <span className="font-display italic text-3xl text-wood font-light tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <dt
                      className="font-display italic text-xl"
                      style={{ fontVariationSettings: "'opsz' 36, 'WONK' 1" }}
                    >
                      {term}
                    </dt>
                    <dd className="mt-2 text-ink/75 leading-relaxed">{def}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="mt-16 flex items-center gap-4 text-ink/45 serial">
              <span>p. 06</span>
              <span className="flex-1 h-px bg-ink/15" />
              <span className="font-display italic">§</span>
              <span className="flex-1 h-px bg-ink/15" />
              <span>RB · CapSO</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
