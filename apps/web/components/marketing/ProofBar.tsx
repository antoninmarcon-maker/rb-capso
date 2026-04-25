import { useTranslations } from "next-intl";
import { Star, MapPin, Hammer } from "lucide-react";

export function ProofBar() {
  const t = useTranslations("proof");

  return (
    <section
      aria-label="Proof"
      className="border-y border-ink/15 bg-cream-deep/40"
    >
      <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-sm">
        <span className="flex items-center gap-2.5 text-ink/85">
          <Star className="w-3.5 h-3.5 fill-wood text-wood" aria-hidden />
          <span className="font-display italic text-ink">4,9</span>
          <span className="catalog-tag text-ink/55">/ 5 sur Yescapa</span>
        </span>
        <span aria-hidden className="text-ink/25 font-display italic">·</span>
        <span className="flex items-center gap-2.5 text-ink/85">
          <Hammer className="w-3.5 h-3.5 text-sage-deep" aria-hidden />
          <span className="font-display italic text-ink">40+</span>
          <span className="catalog-tag text-ink/55">locations honorées</span>
        </span>
        <span aria-hidden className="text-ink/25 font-display italic">·</span>
        <span className="flex items-center gap-2.5 text-ink/85">
          <MapPin className="w-3.5 h-3.5 text-ocean" aria-hidden />
          <span className="catalog-tag text-ink/55">Atelier</span>
          <span className="font-display italic text-ink">Capbreton</span>
        </span>
      </div>
    </section>
  );
}
