import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ArrowRight } from "lucide-react";
import { vans } from "@/lib/vans/data";
import { alternatesFor, ogImage as buildOg, localizedUrl } from "@/lib/seo";
import { RevealStagger, RevealItem } from "@/components/motion/Reveal";

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
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1240px] px-6 md:px-12 py-20 md:py-28">
          <header className="max-w-3xl mb-14 md:mb-20">
            <span className="eyebrow">La flotte</span>
            <h1
              className="mt-5 leading-[0.95]"
              style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)" }}
            >
              {t("title")}
            </h1>
            <p className="mt-6 text-lg text-ink/70 leading-relaxed max-w-xl">{t("subtitle")}</p>
          </header>

          <RevealStagger className="grid md:grid-cols-2 gap-10 md:gap-14">
            {list.map((van, idx) => (
              <RevealItem key={van.slug} lift>
                <Link
                  href={{ pathname: "/vans/[slug]", params: { slug: van.slug } }}
                  className="group block"
                >
                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-cream-deep">
                    <Image
                      src={van.gallery[0]}
                      alt={`${van.name}, ${van.tagline}`}
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
                      <h2
                        className="leading-none"
                        style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
                      >
                        {van.name}
                      </h2>
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
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealStagger>
        </section>
      </main>
      <Footer />
    </>
  );
}
