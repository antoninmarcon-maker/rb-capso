import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

interface Item {
  author: string;
  city: string;
  date: string;
  van: string;
  quote: string;
}

export function Testimonials() {
  const t = useTranslations("testimonials");
  const items = t.raw("items") as Item[];
  const tilts = ["rotate-1", "-rotate-1", "rotate-2"];

  return (
    <section className="py-24 md:py-32 bg-wood/10 relative overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="text-center mb-16">
          <span className="eyebrow text-wood-deep justify-center">Voix des locataires</span>
          <h2 className="mt-5 font-display text-4xl md:text-5xl leading-tight tracking-tight">
            {t("title")}
          </h2>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-10 md:gap-6">
          {items.map((item, idx) => (
            <figure
              key={item.author}
              className={`p-7 md:p-8 bg-cream border border-ink/10 shadow-[var(--shadow-soft)] ${tilts[idx % tilts.length]} md:hover:rotate-0 transition-transform duration-500`}
            >
              <div
                className="flex gap-0.5 mb-5"
                aria-label={t("stars_aria", { count: 5 })}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-wood text-wood" aria-hidden />
                ))}
              </div>

              <blockquote className="font-display text-xl md:text-2xl leading-snug text-ink italic">
                « {item.quote} »
              </blockquote>

              <figcaption className="mt-6 pt-4 border-t border-ink/10 text-sm text-ink/70 flex items-center justify-between">
                <span>
                  <span className="font-medium text-ink/90">{item.author}</span>, {item.city}
                </span>
                <span className="text-xs text-ink/50 tracking-wider">
                  {item.van} · {item.date}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
