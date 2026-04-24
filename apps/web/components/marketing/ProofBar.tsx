import { useTranslations } from "next-intl";
import { Star, MapPin, Hammer } from "lucide-react";

export function ProofBar() {
  const t = useTranslations("proof");

  return (
    <section
      aria-label="Proof"
      className="border-y border-ink/10 bg-cream-dark/30"
    >
      <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-sm text-ink/75">
        <span className="flex items-center gap-2.5">
          <Star className="w-4 h-4 fill-wood text-wood" aria-hidden />
          {t("yescapa")}
        </span>
        <span aria-hidden className="text-ink/25">·</span>
        <span className="flex items-center gap-2.5">
          <Hammer className="w-4 h-4 text-sage-deep" aria-hidden />
          {t("locations")}
        </span>
        <span aria-hidden className="text-ink/25">·</span>
        <span className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-ocean" aria-hidden />
          {t("workshop")}
        </span>
      </div>
    </section>
  );
}
