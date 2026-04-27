import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/Reveal";

export function ConceptionTeaser() {
  const t = useTranslations("conception");
  const steps = t.raw("steps") as string[];

  return (
    <section className="relative py-24 md:py-32 bg-cream">
      <div className="relative mx-auto max-w-[1240px] px-6 md:px-12">
        <Reveal as="header" className="mb-14 max-w-3xl">
          <span className="eyebrow">Sur-mesure</span>
          <h2
            className="mt-5 leading-[1.05]"
            style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)" }}
          >
            {t("h2")}
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/atelier-menuiserie.jpg"
                alt="Atelier RB-CapSO"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-lg text-ink/80 leading-relaxed max-w-xl">{t("body")}</p>

            <ol className="mt-10 space-y-4 max-w-xl">
              {steps.map((step, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[2.5rem_1fr] gap-4 items-baseline border-b border-ink/10 pb-4"
                >
                  <span className="font-mono text-sm text-ocean tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-ink/80 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-10">
              <Link href="/conception" className="btn-primary">
                {t("cta")}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
