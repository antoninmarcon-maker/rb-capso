import Image from "next/image";
import { useTranslations } from "next-intl";

export function Manifesto() {
  const t = useTranslations();
  const tagline = t("tagline");

  const paragraphs = [t("about.p1"), t("about.p2"), t("about.p3")];

  return (
    <section className="relative bg-ink text-cream py-24 md:py-32 overflow-hidden">
      {/* Paper/grain overlay subtle on dark */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-16 items-start">
          {/* Chapter number */}
          <div className="md:pt-6">
            <span className="chapter-number text-wood block">02</span>
            <span className="eyebrow text-wood/70 mt-4">L'atelier</span>
          </div>

          <div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-10 max-w-2xl">
              {t("about_h1")}
            </h2>

            <div className="grid md:grid-cols-[1fr_minmax(auto,320px)] gap-10 md:gap-16 items-start">
              <div className="prose prose-invert max-w-none">
                <p className="drop-cap text-lg md:text-xl text-cream/90 leading-relaxed">
                  {paragraphs[0]}
                </p>
                <p className="mt-6 text-base md:text-lg text-cream/75 leading-relaxed">
                  {paragraphs[1]}
                </p>
                <p className="mt-6 text-base md:text-lg text-cream/75 leading-relaxed">
                  {paragraphs[2]}
                </p>

                <div className="mt-10 pt-8 border-t border-cream/15">
                  <p className="font-display text-3xl md:text-4xl text-wood italic leading-tight">
                    « {tagline} »
                  </p>
                  <p className="mt-4 text-sm text-cream/55 tracking-wider">
                    — Romain, atelier de Capbreton
                  </p>
                </div>
              </div>

              <div className="relative aspect-[4/5] overflow-hidden hidden md:block polaroid rotate-[1.5deg]">
                <Image
                  src="/mains-atelier.jpg"
                  alt="Mains du fondateur RB-CapSO à l'atelier"
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
