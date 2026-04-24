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

  return (
    <section className="py-20 md:py-28 bg-wood/10">
      <div className="mx-auto max-w-[1240px] px-6">
        <h2 className="font-display text-4xl md:text-5xl leading-tight text-center">
          {t("title")}
        </h2>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {items.map((item) => (
            <figure
              key={item.author}
              className="p-6 bg-white/60 rounded-lg border border-ink/5"
            >
              <div
                className="flex gap-0.5 mb-4"
                aria-label={t("stars_aria", { count: 5 })}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-wood text-wood" aria-hidden />
                ))}
              </div>
              <blockquote className="text-ink/90 text-lg leading-relaxed">
                « {item.quote} »
              </blockquote>
              <figcaption className="mt-4 text-sm text-ink/60">
                {item.author}, {item.city}
                <span className="block text-xs text-ink/50 mt-0.5">
                  {item.van} — {item.date}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
