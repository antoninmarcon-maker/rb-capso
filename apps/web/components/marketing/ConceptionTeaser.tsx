import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function ConceptionTeaser() {
  const t = useTranslations("conception");
  const steps = t.raw("steps") as string[];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background sage wash */}
      <div className="absolute inset-0 bg-sage/20" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.118 0 0 0 0 0.165 0 0 0 0 0.141 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 md:gap-20 items-center">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden polaroid -rotate-2">
              <Image
                src="/atelier-menuiserie.jpg"
                alt="Atelier RB-CapSO"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            {/* Second floating polaroid on desktop */}
            <div className="hidden md:block absolute -bottom-10 -right-4 w-52 aspect-[4/5] overflow-hidden polaroid rotate-3">
              <Image
                src="/van-peggy-3.jpg"
                alt="Intérieur aménagé à la main"
                fill
                sizes="208px"
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <span className="chapter-number block">03</span>
            <span className="eyebrow text-sage-deep mt-4">Sur-mesure</span>

            <h2 className="mt-6 font-display text-4xl md:text-5xl lg:text-6xl leading-[1.02] tracking-tight">
              {t("h2")}
            </h2>

            <p className="mt-6 text-lg text-ink/80 leading-relaxed max-w-xl">
              {t("body")}
            </p>

            <ol className="mt-10 space-y-4 max-w-xl">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-5 items-baseline">
                  <span className="font-display text-2xl text-wood font-light tabular-nums min-w-[2rem]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-ink/85 pt-1 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-12">
              <Link
                href="/conception"
                className="group inline-flex items-center gap-3 bg-ink text-cream px-7 py-3.5 font-medium hover:bg-ocean transition-colors rounded-sm"
              >
                {t("cta")}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden
                >
                  <path
                    d="M5 12h14m0 0-5-5m5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
