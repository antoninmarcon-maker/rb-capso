import { useTranslations } from "next-intl";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";

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
    <section className="py-24 md:py-32 bg-cream-dark">
      <div className="relative mx-auto max-w-[1240px] px-6 md:px-12">
        <Reveal as="header" className="mb-14 max-w-3xl">
          <span className="eyebrow">Voix</span>
          <h2
            className="mt-5 leading-[1.05]"
            style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)" }}
          >
            {t("title")}
          </h2>
        </Reveal>

        <RevealStagger className="grid md:grid-cols-2 gap-6 md:gap-8">
          {items.map((item) => (
            <RevealItem
              key={item.author}
              as="figure"
              lift
              className="bg-cream p-8 md:p-10 border border-ink/10"
            >
              <span aria-hidden className="text-ocean text-2xl">★★★★★</span>

              <blockquote className="mt-5 text-xl md:text-2xl text-ink leading-snug font-medium">
                {item.quote}
              </blockquote>

              <figcaption className="mt-8 pt-5 border-t border-ink/10 flex items-end justify-between gap-4">
                <div>
                  <p className="font-medium">{item.author}</p>
                  <p className="font-mono text-xs text-ink/55 mt-1">
                    {item.city} · {item.date}
                  </p>
                </div>
                <span className="font-mono text-xs text-ink/55">
                  Avec {item.van}
                </span>
              </figcaption>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
