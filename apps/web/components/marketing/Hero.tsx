import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { HeroVideo } from "./HeroVideo";

/**
 * Splits a sentence into a fractured H1 with three typographic registers.
 */
function splitHeadline(h1: string): { lead: string; accent: string; tail: string } {
  const lines = h1.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 2) {
    return { lead: lines[0], accent: "", tail: lines[1] };
  }
  const words = h1.replace(/\.$/, "").split(/\s+/);
  if (words.length < 4) return { lead: h1, accent: "", tail: "" };
  const lead = words.slice(0, words.length - 3).join(" ");
  const accent = words[words.length - 3];
  const tail = words.slice(-2).join(" ");
  return { lead, accent, tail };
}

export async function Hero() {
  const t = await getTranslations("hero");
  const h1 = t("h1");
  const { lead, accent, tail } = splitHeadline(h1);

  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="relative h-[88vh] min-h-[660px] max-h-[880px] w-full">
        {/* Masthead bar — overlaid on hero so the LCP image is in viewport */}
        <div className="absolute top-0 inset-x-0 z-30 bg-cream text-ink border-b border-ink/20">
          <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-2.5 flex items-center justify-between gap-4">
            <span className="serial flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-ember" />
              <span className="hidden sm:inline">Dossier I —</span>
              <span>Atelier &amp; Route</span>
            </span>
            <span className="hidden md:inline coords text-ink/65">
              43°38&apos;37&quot;N · 1°25&apos;46&quot;W
            </span>
            <span className="serial italic font-display text-ink/65">
              Vol. 01 · 2026
            </span>
          </div>
        </div>
        <div className="absolute inset-0 hero-parallax">
          {/* Direct <img> — no _next/image roundtrip, no <picture> fallback (WebP is universal). LCP element. */}
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

        {/* Layered gradient — readability + atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent" aria-hidden />

        {/* Roman numeral I — outline only, monumental */}
        <div
          aria-hidden
          className="hidden lg:block absolute right-[3%] top-[6%] font-display italic leading-none select-none pointer-events-none"
          style={{
            fontSize: "clamp(14rem, 30vw, 28rem)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(239, 232, 220, 0.18)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 80",
            fontWeight: 200,
          }}
        >
          I
        </div>

        {/* Vertical text — left rail */}
        <div
          aria-hidden
          className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 text-cream/55 serial gap-6 origin-center"
        >
          <span>Capbreton — 40130</span>
          <span className="opacity-60">Atlantique nord</span>
        </div>

        {/* Horizontal rule across hero */}
        <div className="absolute bottom-[28%] md:bottom-[34%] left-0 right-0 px-6 md:px-10 flex items-center gap-4 text-cream/55 serial">
          <span className="hidden md:inline">N° 01</span>
          <span className="flex-1 h-px bg-cream/20" />
          <span className="hidden md:inline italic font-display">Saison 2026</span>
        </div>

        {/* Main content — bottom-left, asymmetric */}
        <div className="absolute inset-0 flex items-end pb-16 md:pb-24">
          <div className="mx-auto max-w-[1440px] w-full px-6 md:px-10">
            <div className="max-w-4xl text-cream">
              <span className="eyebrow text-cream/75 fade-up fade-up-delay-1">
                Capbreton · Landes
              </span>

              {/* Fractured H1 — three registers — no fade-in (LCP element) */}
              <h1
                className="mt-6 font-display leading-[0.92] tracking-[-0.025em]"
                style={{
                  fontSize: "clamp(3rem, 8vw, 7rem)",
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100",
                  fontWeight: 350,
                }}
              >
                {tail ? (
                  <>
                    <span className="block">{lead}</span>
                    {accent && (
                      <span className="block">
                        <span className="h1-accent text-cream/95">{accent}</span>{" "}
                        <span className="smcp text-cream font-normal">{tail}</span>
                      </span>
                    )}
                  </>
                ) : (
                  <span className="block whitespace-pre-line">{h1}</span>
                )}
              </h1>

              <p className="mt-8 max-w-md text-lg md:text-xl text-cream/85 font-light leading-relaxed fade-up fade-up-delay-3">
                {t("subtitle")}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 fade-up fade-up-delay-4">
                <Link href="/vans" className="btn-primary group">
                  {t("cta_primary")}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1" aria-hidden>
                    <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href="/conception"
                  className="text-cream underline underline-offset-8 decoration-cream/35 hover:decoration-cream font-light transition-all"
                >
                  {t("cta_secondary")}
                </Link>
              </div>

              <div className="mt-14 flex items-center gap-4 text-cream/55 fade-up fade-up-delay-5">
                <span className="serial italic font-display">— Vendredi · vent d&apos;ouest · marée descendante</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip — series number, type-set */}
      <div className="bg-ink text-cream/55 border-t border-cream/15">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-3 flex items-center justify-between serial">
          <span>RB · CapSO — N° 01-26</span>
          <span className="hidden md:inline italic font-display">Fait main, à Capbreton.</span>
          <span>Édition limitée</span>
        </div>
      </div>
    </section>
  );
}
