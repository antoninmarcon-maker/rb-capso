import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function ConceptionTeaser() {
  const t = useTranslations("conception");
  const steps = t.raw("steps") as string[];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-cream-dark/40">
      {/* Subtle additional grain on this section */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.118 0 0 0 0 0.165 0 0 0 0 0.141 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1240px] px-6 md:px-10">
        <header className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 items-end">
          <div>
            <span className="serial text-ink/55">Chapitre</span>
            <span className="block chapter-roman -ml-1 -mb-3">IV</span>
            <span className="serial text-ink/55">— Sur-mesure</span>
          </div>
          <div className="max-w-2xl md:pb-3">
            <h2
              className="font-display leading-[0.95] tracking-[-0.025em]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
            >
              {t("h2")}
            </h2>
            <hr className="rule-double mt-8 max-w-[60%]" />
          </div>
        </header>

        <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 md:gap-20 items-start">
          {/* Left — image stack */}
          <div className="relative">
            <div className="catalog-frame">
              <div className="flex items-baseline justify-between mb-3 px-1">
                <span className="catalog-tag text-ink/55">Atelier · Capbreton</span>
                <span className="catalog-tag text-ink/55">Cliché 03</span>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep">
                <Image
                  src="/atelier-menuiserie.jpg"
                  alt="Atelier RB-CapSO"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 px-1 catalog-tag text-ink/55 italic text-center">
                « Châssis cannage en cours d&apos;assemblage »
              </p>
            </div>

            {/* Floating archive ticket on desktop */}
            <div className="hidden md:flex absolute -bottom-8 -right-6 w-56 bg-wood/95 backdrop-blur-sm text-ink p-4 rotate-3 shadow-medium border border-wood-deep/30">
              <div className="flex flex-col gap-1">
                <span className="catalog-tag">Devis</span>
                <span className="font-display text-2xl italic leading-none">Gratuit</span>
                <span className="catalog-tag text-ink/65 mt-2">Sous 7 jours · Atelier ou visio</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-lg text-ink/85 leading-relaxed max-w-xl">{t("body")}</p>

            <ol className="mt-12 space-y-5 max-w-xl">
              {steps.map((step, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[3rem_1fr] gap-5 items-baseline border-b border-ink/10 pb-4"
                >
                  <span className="font-display italic text-3xl text-wood font-light tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-ink/85 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-12 flex items-center gap-6">
              <Link
                href="/conception"
                className="group inline-flex items-center gap-3 bg-ink text-cream px-7 py-3.5 font-medium hover:bg-ocean transition-colors"
              >
                {t("cta")}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1" aria-hidden>
                  <path
                    d="M5 12h14m0 0-5-5m5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <span className="serial text-ink/55 hidden sm:inline">
                — Aucun frais d&apos;étude
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
