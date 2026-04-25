import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ArrowRight } from "lucide-react";
import { vans } from "@/lib/vans/data";
import { alternatesFor, ogImage as buildOg, localizedUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vans_listing" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: alternatesFor("/vans", locale),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      images: [
        {
          url: buildOg({ title: t("title"), subtitle: t("subtitle"), eyebrow: "La Flotte" }),
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function VansListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("vans_listing");
  const list = Object.values(vans);

  return (
    <>
      <Header />
      <main id="main">
        <section className="mx-auto max-w-[1240px] px-6 py-20">
          <div className="max-w-2xl">
            <h1 className="mt-2 font-display text-5xl md:text-6xl leading-[1.05]">
              {t("title")}
            </h1>
            <p className="mt-6 text-lg text-ink/80">{t("subtitle")}</p>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-8 md:gap-12">
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
                      <h2 className="font-display text-3xl">{van.name}</h2>
                      <span className="text-ink/60 text-sm">
                        dès {van.priceFromEuros} €/nuit
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-sage">{van.model}</p>
                    <p className="mt-3 text-ink/80">{van.tagline}</p>

                    <dl className="mt-4 flex gap-4 text-sm text-ink/70">
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink/50">
                          Couchages
                        </dt>
                        <dd>{van.sleeps}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink/50">
                          Longueur
                        </dt>
                        <dd>{van.length}</dd>
                      </div>
                    </dl>

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
        </section>
      </main>
      <Footer />
    </>
  );
}
