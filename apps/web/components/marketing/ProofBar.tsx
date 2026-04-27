import { useTranslations } from "next-intl";
import { Star, MapPin, Hammer } from "lucide-react";

export function ProofBar() {
  useTranslations("proof");

  return (
    <section
      aria-label="Proof"
      className="border-y border-ink/10 bg-cream-dark/40"
    >
      <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-sm">
        <span className="flex items-center gap-2 text-ink/85">
          <Star className="w-4 h-4 fill-ocean text-ocean" aria-hidden />
          <span className="font-medium">4,9 / 5</span>
          <span className="text-ink/55">sur Yescapa</span>
        </span>
        <span aria-hidden className="text-ink/20">·</span>
        <span className="flex items-center gap-2 text-ink/85">
          <Hammer className="w-4 h-4 text-sage-deep" aria-hidden />
          <span className="font-medium">40+</span>
          <span className="text-ink/55">locations honorées</span>
        </span>
        <span aria-hidden className="text-ink/20">·</span>
        <span className="flex items-center gap-2 text-ink/85">
          <MapPin className="w-4 h-4 text-ocean" aria-hidden />
          <span className="font-medium">Capbreton</span>
          <span className="text-ink/55">atelier 40130</span>
        </span>
      </div>
    </section>
  );
}
