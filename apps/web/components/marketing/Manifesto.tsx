import Image from "next/image";
import { useTranslations } from "next-intl";

export function Manifesto() {
  const t = useTranslations();
  const manifesto = t("manifesto");
  const tagline = t("tagline");

  return (
    <section className="bg-ink text-cream py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid md:grid-cols-[1fr_1.3fr] gap-12 items-center">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src="/mains-atelier.jpg"
              alt="Mains du fondateur RB-CapSO à l'atelier"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="prose prose-invert">
            <p className="text-xl md:text-2xl leading-relaxed">{manifesto}</p>
            <p className="mt-8 font-display text-3xl text-wood">{tagline}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
