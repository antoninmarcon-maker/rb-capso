import Image from "next/image";
import { useTranslations } from "next-intl";
import { Signature } from "./Signature";
import { Reveal } from "@/components/motion/Reveal";

export function Manifesto() {
  const t = useTranslations();
  const tagline = t("tagline");
  const paragraphs = [t("about.p1"), t("about.p2"), t("about.p3")];

  return (
    <section className="relative bg-ink text-cream py-28 md:py-40 overflow-hidden">
      {/* Paper noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      {/* III watermark */}
      <div
        aria-hidden
        className="hidden lg:block absolute -right-[4%] top-[12%] font-display italic leading-none select-none pointer-events-none"
        style={{
          fontSize: "clamp(20rem, 32vw, 32rem)",
          color: "transparent",
          WebkitTextStroke: "1px rgba(239, 232, 220, 0.06)",
          fontVariationSettings: "'opsz' 144, 'SOFT' 80",
          fontWeight: 200,
        }}
      >
        III
      </div>

      <div className="relative mx-auto max-w-[1240px] px-6 md:px-10">
        <Reveal as="header" className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16">
          <div>
            <span className="serial text-cream/65">Chapitre</span>
            <span
              className="block chapter-roman -ml-1 -mb-3"
              style={{
                color: "transparent",
                WebkitTextStroke: "1px rgba(198, 163, 107, 0.6)",
              }}
            >
              III
            </span>
            <span className="serial text-cream/65">— L&apos;atelier</span>
          </div>
          <div className="md:pb-2">
            <h2
              className="font-display leading-[0.95] tracking-[-0.025em] max-w-2xl"
              style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
            >
              {t("about_h1")}
            </h2>
            <hr className="rule-double mt-8 max-w-[40%] border-cream/30" />
          </div>
        </Reveal>

        <div className="grid md:grid-cols-[140px_1fr_minmax(auto,300px)] gap-6 md:gap-12 items-start">
          <aside className="hidden md:block pt-6 sticky top-24 self-start">
            <p className="margin-note text-cream/65 border-cream/35">
              i. Avant l&apos;atelier, douze ans de caserne.
            </p>
            <p className="margin-note text-cream/65 border-cream/25 mt-6">
              ii. Capbreton, été 2025.
            </p>
            <p className="margin-note text-cream/65 border-cream/25 mt-6">
              iii. Bois clair, cannage, vert sauge.
            </p>
          </aside>

          <div>
            <Reveal>
              <p className="drop-cap text-lg md:text-xl text-cream/90 leading-relaxed">
                {paragraphs[0]}
              </p>
              <p className="mt-6 text-base md:text-lg text-cream/80 leading-relaxed">
                {paragraphs[1]}
              </p>
              <p className="mt-6 text-base md:text-lg text-cream/80 leading-relaxed">
                {paragraphs[2]}
              </p>
            </Reveal>

            {/* Pull quote */}
            <Reveal as="figure" className="mt-12 pt-8 border-t border-cream/20" delay={0.1}>
              <blockquote
                className="font-display italic text-3xl md:text-5xl text-ember leading-[1.05] tracking-tight"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1" }}
              >
                « {tagline} »
              </blockquote>
              <figcaption className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Signature className="text-cream/85" width={170} />
                <span className="serial text-cream/55">
                  Romain · Capbreton, 2026
                </span>
              </figcaption>
            </Reveal>
          </div>

          {/* Right — image with archive frame */}
          <div className="relative hidden md:block float-slow">
            <Reveal delay={0.2}>
              <div className="relative aspect-[4/5] overflow-hidden border border-cream/30 p-2.5 bg-cream/5">
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src="/mains-atelier.jpg"
                    alt="Mains du fondateur RB-CapSO à l'atelier"
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                </div>
              </div>
              <p className="mt-3 catalog-tag text-cream/55 italic text-center">
                Cliché — atelier, mai 2026
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 flex items-center gap-4 text-cream/60 serial">
          <span>p. 03</span>
          <span className="flex-1 h-px bg-cream/15" />
          <span className="font-display italic">§</span>
          <span className="flex-1 h-px bg-cream/15" />
          <span>RB · CapSO</span>
        </div>
      </div>
    </section>
  );
}
