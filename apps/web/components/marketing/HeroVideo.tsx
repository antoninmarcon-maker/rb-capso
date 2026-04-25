"use client";

import { useEffect, useRef, useState } from "react";

// Tiny client island — only handles the optional decorative video overlay.
// Splitting this out keeps the Hero (LCP element) fully server-rendered.
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    const slow = conn?.saveData === true || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
    if (reduce || slow) return;
    const isMobile = window.innerWidth < 768;
    setSrc(isMobile ? "/video/hero-mobile.mp4" : "/video/hero.mp4");
  }, []);

  useEffect(() => {
    if (!src || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  }, [src]);

  if (!src) return null;
  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
      poster="/video/hero-poster.webp"
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
