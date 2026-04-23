import { Star } from "lucide-react";

const testimonials = [
  {
    author: "Marion H.",
    city: "Bordeaux",
    date: "juin 2026",
    van: "Marceau",
    stars: 5,
    quote:
      "Quatre jours à Zarautz avec Marceau. Pas un défaut. On revient l'été prochain.",
  },
  {
    author: "Paul L.",
    city: "Toulouse",
    date: "mai 2026",
    van: "Lazare",
    stars: 5,
    quote:
      "Le van est impeccable, Romain encore plus. Remise de clés, conseils, tout est soigné.",
  },
  {
    author: "Claire M.",
    city: "Biarritz",
    date: "avril 2026",
    van: "Lazare",
    stars: 5,
    quote: "Du soin dans chaque détail. On n'a jamais dormi aussi bien dans un van.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <h2 className="font-display text-4xl md:text-5xl leading-tight text-center">
          Ce qu'en disent les locataires.
        </h2>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure
              key={t.author}
              className="p-6 bg-white/60 rounded-lg border border-ink/5"
            >
              <div
                className="flex gap-0.5 mb-4"
                aria-label={`${t.stars} étoiles sur 5`}
              >
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-wood text-wood" aria-hidden />
                ))}
              </div>
              <blockquote className="text-ink/90 text-lg leading-relaxed">
                « {t.quote} »
              </blockquote>
              <figcaption className="mt-4 text-sm text-ink/60">
                {t.author}, {t.city}
                <span className="block text-xs text-ink/50 mt-0.5">
                  {t.van} — {t.date}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
