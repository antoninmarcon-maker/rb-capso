import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { vans } from "@/lib/vans/data";

export function VansListing() {
  const t = useTranslations("vans_listing");

  const list = Object.values(vans);

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-4xl md:text-5xl leading-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-ink/80">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {list.map((van) => (
            <Link
              key={van.slug}
              href={{ pathname: "/vans/[slug]", params: { slug: van.slug } }}
              className="group"
            >
              <article className="overflow-hidden rounded-lg bg-white/50 transition-shadow hover:shadow-xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={van.gallery[0]}
                    alt={`${van.name}, ${van.tagline}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-3xl">{van.name}</h3>
                    <span className="text-ink/60 text-sm">
                      dès {van.priceFromEuros} €/nuit
                    </span>
                  </div>
                  <p className="mt-2 text-ink/80">{van.tagline}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {van.features.slice(0, 3).map((f) => (
                      <li
                        key={f.label}
                        className="text-xs px-2.5 py-1 bg-sage/20 text-ink/80 rounded-full"
                      >
                        {f.label}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium">
                    <span>{van.name}</span>
                    <ArrowRight
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
