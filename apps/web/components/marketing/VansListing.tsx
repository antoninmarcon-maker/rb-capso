import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { vans } from "@/lib/vans/data";

export function VansListing() {
  const t = useTranslations("vans_listing");

  const list = Object.values(vans);
  const tilts = ["-rotate-1", "rotate-1"];

  return (
    <section className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-16 mb-16 md:mb-20 items-end">
          <div>
            <span className="chapter-number block">01</span>
            <span className="eyebrow text-sage-deep mt-4">La flotte</span>
          </div>
          <div className="max-w-2xl md:pb-2">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.02] tracking-tight">
              {t("title")}
            </h2>
            <p className="mt-5 text-lg text-ink/75 leading-relaxed">{t("subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
          {list.map((van, idx) => (
            <Link
              key={van.slug}
              href={{ pathname: "/vans/[slug]", params: { slug: van.slug } }}
              className={`group block ${tilts[idx % tilts.length]} md:hover:rotate-0 transition-transform duration-500`}
            >
              <article className="polaroid">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream-dark">
                  <Image
                    src={van.gallery[0]}
                    alt={`${van.name}, ${van.tagline}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />

                  {/* Corner price chip */}
                  <div className="absolute top-4 right-4 bg-cream/95 backdrop-blur-sm px-3 py-1.5 rounded-sm font-display text-sm">
                    dès {van.priceFromEuros} €
                    <span className="text-ink/55 text-xs"> /nuit</span>
                  </div>

                  {/* Little model chip */}
                  <div className="absolute bottom-4 left-4 bg-ink/85 text-cream/90 px-3 py-1 rounded-sm text-[0.7rem] tracking-widest uppercase backdrop-blur-sm">
                    {van.model}
                  </div>
                </div>

                <h3 className="polaroid-caption">
                  « {van.name} »
                </h3>
              </article>

              <div className="mt-6 px-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <p className="text-ink/80 text-[0.95rem] leading-relaxed italic">
                  {van.tagline}
                </p>
              </div>

              <div className="mt-4 px-2 flex items-center gap-3 text-sm text-ink/60">
                <span className="marker-underline font-medium text-ink">
                  Découvrir {van.name}
                </span>
                <svg
                  width="20"
                  height="14"
                  viewBox="0 0 24 14"
                  fill="none"
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden
                >
                  <path
                    d="M0 7h22m0 0-5-5m5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Ornament divider */}
        <div className="ornament mt-24 text-sage">
          <span aria-hidden className="font-display text-xl italic">§</span>
        </div>
      </div>
    </section>
  );
}
