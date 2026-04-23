import { useTranslations } from "next-intl";
import { Star, MapPin, Hammer } from "lucide-react";

export function ProofBar() {
  const t = useTranslations("proof");

  return (
    <section aria-label="Proof" className="border-b border-ink/10 bg-cream">
      <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-4 text-sm text-ink/80">
        <span className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-wood text-wood" aria-hidden />
          {t("yescapa")}
        </span>
        <span className="flex items-center gap-2">
          <Hammer className="w-4 h-4 text-sage" aria-hidden />
          {t("locations")}
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-ocean" aria-hidden />
          {t("workshop")}
        </span>
      </div>
    </section>
  );
}
