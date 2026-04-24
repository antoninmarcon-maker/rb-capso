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
      <div className="relative h-[85vh] min-h-[600px] max-h-[820px] w-full">
        <Image
          src="/video/hero-poster.jpg"
          alt={t("h1")}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={80}
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

        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-ink/20"
          aria-hidden
        />

        <div className="absolute inset-0 flex items-end md:items-center pb-16 md:pb-0">
          <div className="mx-auto max-w-[1440px] w-full px-6">
            <div className="max-w-2xl text-cream">
              <span className="text-xs md:text-sm text-sage-soft uppercase tracking-[0.25em] font-medium">
                Capbreton, Landes
              </span>
              <h1 className="mt-4 font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight whitespace-pre-line">
                {t("h1")}
              </h1>
              <p className="mt-6 text-lg md:text-xl text-cream/90 max-w-md">
                {t("subtitle")}
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/vans"
                  className="bg-cream text-ink px-6 py-3 rounded-md font-medium hover:bg-wood transition-colors"
                >
                  {t("cta_primary")}
                </Link>
                <Link
                  href="/conception"
                  className="border border-cream/70 text-cream px-6 py-3 rounded-md font-medium hover:bg-cream/10 transition-colors backdrop-blur-sm"
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
