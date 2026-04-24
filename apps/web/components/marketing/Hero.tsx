"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/routing";

export function Hero() {
  const t = useTranslations("hero");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const connection =
      (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
        .connection;
    const saveData = connection?.saveData === true;
    const slowNetwork =
      connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";

    if (prefersReducedMotion || saveData || slowNetwork) {
      return;
    }

    const isMobile = window.innerWidth < 768;
    setVideoSrc(isMobile ? "/video/hero-mobile.mp4" : "/video/hero.mp4");
  }, []);

  useEffect(() => {
    if (!videoSrc || !videoRef.current) return;
    const video = videoRef.current;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked; poster stays visible
      });
    }
  }, [videoSrc]);

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[90vh] min-h-[640px] max-h-[860px] w-full">
        <div className="absolute inset-0 hero-breathe">
          <Image
            src="/video/hero-poster.jpg"
            alt={t("h1")}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={82}
            className="object-cover"
          />

          {videoSrc && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              poster="/video/hero-poster.jpg"
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          )}
        </div>

        {/* Layered gradient for depth + readability */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-transparent"
          aria-hidden
        />

        {/* Decorative corner marks (editorial signature) */}
        <div aria-hidden className="absolute top-28 md:top-32 left-6 md:left-10 text-cream/60 font-display text-sm tracking-widest">
          N° 01
        </div>
        <div aria-hidden className="absolute top-28 md:top-32 right-6 md:right-10 text-cream/60 font-display text-sm tracking-widest italic">
          Atelier & Route
        </div>

        <div className="absolute inset-0 flex items-end pb-16 md:pb-24">
          <div className="mx-auto max-w-[1440px] w-full px-6 md:px-10">
            <div className="max-w-3xl text-cream">
              <span className="eyebrow text-sage-soft">Capbreton · Landes</span>

              <h1 className="mt-6 font-display leading-[0.95] tracking-tight whitespace-pre-line text-[3.25rem] sm:text-[4.5rem] lg:text-[6rem] xl:text-[7rem]">
                {t("h1")}
              </h1>

              <p className="mt-8 text-lg md:text-xl text-cream/85 max-w-md font-light leading-relaxed">
                {t("subtitle")}
              </p>

              <div className="mt-10 flex flex-wrap gap-4 items-center">
                <Link
                  href="/vans"
                  className="group inline-flex items-center gap-2 bg-cream text-ink px-7 py-3.5 font-medium hover:bg-wood transition-colors rounded-sm"
                >
                  {t("cta_primary")}
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
                <Link
                  href="/conception"
                  className="text-cream underline underline-offset-8 decoration-cream/40 hover:decoration-cream font-light transition-all"
                >
                  {t("cta_secondary")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/60 text-xs tracking-[0.3em] uppercase flex flex-col items-center gap-2"
        >
          <span>Descendez</span>
          <span className="block w-px h-8 bg-cream/40" />
        </div>
      </div>
    </section>
  );
}
