import { ExternalLink } from "lucide-react";

interface Props {
  price: number;
  yescapaUrl: string;
  ctaLabel: string;
  vanName: string;
}

/**
 * Mobile-only sticky bottom bar on van detail pages.
 * Keeps price + CTA visible while the user scrolls through gallery/equipment/calendar.
 */
export function StickyMobileCTA({ price, yescapaUrl, ctaLabel, vanName }: Props) {
  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-cream/95 backdrop-blur-sm border-t border-ink/10 px-4 py-3"
      role="region"
      aria-label={`Reserve ${vanName}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-ink/50 uppercase tracking-wider">{vanName}</div>
          <div className="font-display text-lg leading-tight">dès {price} €/nuit</div>
        </div>
        <a
          href={yescapaUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 bg-ink text-cream text-sm px-5 py-2.5 rounded-md font-medium hover:bg-ocean transition-colors"
        >
          {ctaLabel}
          <ExternalLink className="w-3.5 h-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
