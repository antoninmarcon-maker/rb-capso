import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { getAllArticles } from "@/lib/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("journal"),
    description:
      "Spots, itinéraires et conseils pour voyager en van aménagé dans les Landes, le Pays basque et les Asturies.",
  };
}

export default async function JournalIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const articles = await getAllArticles();

  return (
    <>
      <Header />
      <main id="main">
        <section className="mx-auto max-w-[1240px] px-6 py-20">
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mb-4">
            Carnet de route
          </h1>
          <p className="text-lg text-ink/70 max-w-2xl">
            Des spots, des itinéraires, des conseils. Ce qu'on glisse dans le van avant
            chaque départ.
          </p>

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
                    {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
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
