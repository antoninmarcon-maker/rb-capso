import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { getAllArticles } from "@/lib/blog";
import { alternatesFor } from "@/lib/seo";

const DESC: Record<string, string> = {
  fr: "Spots, itinéraires et conseils pour voyager en van aménagé dans les Landes, le Pays basque et les Asturies.",
  en: "Spots, routes and advice for travelling by hand-built campervan in the Landes, Basque Country and Asturias.",
  es: "Sitios, itinerarios y consejos para viajar en furgoneta en Las Landas, el País Vasco y Asturias.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("journal"),
    description: DESC[locale] ?? DESC.fr,
    alternates: alternatesFor("/carnet-de-route", locale),
  };
}

export default async function JournalIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const tCommon = await getTranslations();
  const articles = await getAllArticles(locale);

  const dateLocale =
    locale === "en" ? "en-GB" : locale === "es" ? "es-ES" : "fr-FR";

  return (
    <>
      <Header />
      <main id="main">
        <section className="mx-auto max-w-[1240px] px-6 py-20">
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mb-4">
            {t("journal")}
          </h1>
          <p className="text-lg text-ink/70 max-w-2xl">{tCommon("journal_intro")}</p>

          <ul className="mt-16 grid md:grid-cols-2 gap-8">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={{
                    pathname: "/carnet-de-route/[slug]",
                    params: { slug: article.slug },
                  }}
                  className="group block p-6 rounded-lg bg-white/50 border border-ink/5 hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-sage/20 text-ink/80 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl leading-tight group-hover:text-ocean transition-colors">
                    {article.title}
                  </h2>
                  <p className="mt-3 text-ink/75">{article.excerpt}</p>
                  <time
                    className="mt-4 block text-xs text-ink/50"
                    dateTime={article.publishedAt}
                  >
                    {new Date(article.publishedAt).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
