import { useTranslations } from "next-intl";

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
    <section className="py-24 md:py-32 bg-cream relative overflow-hidden">
      {/* Subtle grid bg for editorial feel */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1240px] px-6 md:px-10">
        <header className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 items-end">
          <div>
            <span className="serial text-ink/55">Chapitre</span>
            <span className="block chapter-roman -ml-1 -mb-3">V</span>
            <span className="serial text-ink/55">— Voix</span>
          </div>
          <div className="max-w-2xl md:pb-3">
            <h2
              className="font-display leading-[0.95] tracking-[-0.025em]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
            >
              {t("title")}
            </h2>
            <hr className="rule-double mt-8 max-w-[60%]" />
          </div>
        </header>

        <div className="grid md:grid-cols-12 gap-6 md:gap-8">
          {items.map((item, idx) => {
            // Asymmetric layout — first card bigger, others compact
            const isFeature = idx === 0;
            return (
              <figure
                key={item.author}
                className={[
                  "relative bg-cream border border-ink p-7 md:p-9 group",
                  isFeature
                    ? "md:col-span-7 md:row-span-2"
                    : idx === 1
                    ? "md:col-span-5"
                    : "md:col-span-5",
                ].join(" ")}
              >
                {/* Top serial */}
                <div className="flex items-center justify-between mb-6 catalog-tag text-ink/65">
                  <span>Lettre {String(idx + 1).padStart(2, "0")}/05</span>
                  <span>★★★★★</span>
                </div>

                <blockquote
                  className={[
                    "font-display italic leading-[1.1] text-ink",
                    isFeature ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl",
                  ].join(" ")}
                  style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
                >
                  « {item.quote} »
                </blockquote>

                <figcaption className="mt-10 pt-5 border-t border-ink/15 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-lg italic">{item.author}</p>
                    <p className="serial text-ink/55 mt-1">
                      {item.city} — {item.date}
                    </p>
                  </div>
                  <span className="catalog-tag text-ink/55 whitespace-nowrap">
                    Avec {item.van}
                  </span>
                </figcaption>

                {/* Decorative quotation mark in corner */}
                <span
                  aria-hidden
                  className="absolute -top-6 -left-3 font-display text-[8rem] leading-none text-wood/30 pointer-events-none select-none"
                  style={{ fontVariationSettings: "'opsz' 144" }}
                >
                  &ldquo;
                </span>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
