import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { HeroVideo } from "./HeroVideo";

export async function Hero() {
  const t = await getTranslations("hero");
  const h1 = t("h1");

  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="relative h-[88vh] min-h-[640px] max-h-[860px] w-full">
        <div className="absolute inset-0 hero-parallax">
          <img
            src="/video/hero-poster.webp"
            alt=""
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <HeroVideo />
        </div>

        {/* Atmospheric gradient — readability for the H1 */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" aria-hidden />

        {/* Main content — bottom-left aligned, generous space */}
        <div className="absolute inset-0 flex items-end pb-20 md:pb-28">
          <div className="mx-auto max-w-[1280px] w-full px-6 md:px-12">
            <div className="max-w-3xl text-cream">
              <span className="eyebrow">Capbreton · Landes</span>

              <h1
                className="mt-6 leading-[0.95]"
                style={{ fontSize: "clamp(2.75rem, 7vw, 5.5rem)" }}
              >
                {h1.split("\n").map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </h1>

              <p className="mt-7 max-w-lg text-lg md:text-xl text-cream/80 leading-relaxed">
                {t("subtitle")}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/vans" className="btn-primary">
                  {t("cta_primary")}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href="/conception"
                  className="text-cream/85 hover:text-cream font-medium underline underline-offset-8 decoration-cream/30 hover:decoration-cream transition-all"
                >
                  {t("cta_secondary")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
