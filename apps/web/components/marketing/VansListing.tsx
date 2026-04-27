import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { vans } from "@/lib/vans/data";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/Reveal";

export function VansListing() {
  const t = useTranslations("vans_listing");
  const list = Object.values(vans);

  return (
    <section className="py-24 md:py-32 bg-cream">
      <div className="mx-auto max-w-[1240px] px-6 md:px-12">
        <Reveal as="header" className="mb-14 md:mb-20 max-w-3xl">
          <span className="eyebrow">La flotte</span>
          <h2
            className="mt-5 leading-[1.05]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
          >
            {t("title")}
          </h2>
          <p className="mt-6 text-lg text-ink/70 leading-relaxed max-w-xl">{t("subtitle")}</p>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
          {list.map((van, idx) => {
            return (
              <RevealItem key={van.slug} lift>
                <Link
                  href={{ pathname: "/vans/[slug]", params: { slug: van.slug } }}
                  className="group block"
                >
                  <article
                    className="relative"
                    style={{ viewTransitionName: `van-${van.slug}` }}
                  >
                    <div
                      className="relative aspect-[16/11] w-full overflow-hidden bg-cream-deep"
                      style={{ viewTransitionName: `van-image-${van.slug}` }}
                    >
                      <Image
                        src={van.gallery[0]}
                        alt={`${van.name} — ${van.model}`}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>

                    <div className="mt-6 flex items-baseline justify-between gap-4">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-xs text-ink/50 tabular-nums">
                          P-{String(idx + 1).padStart(2, "0")}
                        </span>
                        <h3
                          className="leading-none"
                          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
                        >
                          {van.name}
                        </h3>
                      </div>
                      <span className="text-lg font-medium tabular-nums">
                        dès <span className="text-ocean">{van.priceFromEuros} €</span>
                        <span className="text-ink/55"> /n</span>
                      </span>
                    </div>

                    <p className="mt-2 text-ink/65 text-base leading-snug max-w-md">
                      {van.model}. {van.tagline}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-2 text-ocean font-medium text-sm">
                      Voir la fiche
                      <svg width="14" height="14" viewBox="0 0 24 14" fill="none" className="transition-transform group-hover:translate-x-1" aria-hidden>
                        <path d="M0 7h22m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </article>
                </Link>
              </RevealItem>
            );
          })}
        </RevealStagger>
      </div>
    </section>
  );
}
