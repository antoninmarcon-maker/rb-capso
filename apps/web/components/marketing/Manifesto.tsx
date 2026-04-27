import Image from "next/image";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";

export function Manifesto() {
  const t = useTranslations();
  const tagline = t("tagline");
  const paragraphs = [t("about.p1"), t("about.p2"), t("about.p3")];

  return (
    <section className="relative bg-ink text-cream py-24 md:py-32">
      <div className="relative mx-auto max-w-[1240px] px-6 md:px-12">
        <Reveal as="header" className="mb-14 max-w-3xl">
          <span className="eyebrow text-sage-deep">L&apos;atelier</span>
          <h2
            className="mt-5 leading-[1.05]"
            style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)" }}
          >
            {t("about_h1")}
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-[1.5fr_1fr] gap-12 md:gap-20 items-start">
          <Reveal>
            <p className="text-lg md:text-xl text-cream/85 leading-relaxed">
              {paragraphs[0]}
            </p>
            <p className="mt-5 text-base md:text-lg text-cream/75 leading-relaxed">
              {paragraphs[1]}
            </p>
            <p className="mt-5 text-base md:text-lg text-cream/75 leading-relaxed">
              {paragraphs[2]}
            </p>

            <p className="mt-12 pt-8 border-t border-cream/15 text-2xl md:text-3xl text-cream font-medium leading-snug">
              {tagline}
            </p>
            <p className="mt-4 text-sm text-cream/55 font-mono">
              Romain · Capbreton, 2026
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/mains-atelier.jpg"
                alt="Mains du fondateur RB-CapSO à l'atelier"
                fill
                sizes="(min-width: 768px) 380px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
