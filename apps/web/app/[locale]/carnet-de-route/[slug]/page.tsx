import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Markdown } from "@/lib/markdown";
import { getAllArticles, getArticleBySlug } from "@/lib/blog";
import { routing } from "@/i18n/routing";
import { alternatesFor, ogImage as buildOgImage, localizedUrl, SITE_URL } from "@/lib/seo";

export async function generateStaticParams() {
  const out: Array<{ locale: string; slug: string }> = [];
  for (const locale of routing.locales) {
    const articles = await getAllArticles(locale);
    for (const article of articles) {
      out.push({ locale, slug: article.slug });
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug, locale);
  if (!article) return {};

  const og = buildOgImage({
    title: article.title,
    eyebrow: "Carnet de route",
    subtitle: article.excerpt,
  });

  return {
    title: `${article.title} — RB-CapSO`,
    description: article.metaDescription,
    alternates: alternatesFor("/carnet-de-route/[slug]", locale, slug),
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      type: "article",
      images: [{ url: og, width: 1200, height: 630, alt: article.title }],
    },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const article = await getArticleBySlug(slug, locale);
  if (!article) notFound();

  const canonical = localizedUrl("/carnet-de-route/[slug]", locale, slug);
  const blogIndex = localizedUrl("/carnet-de-route", locale);
  const homeUrl = localizedUrl("/", locale);
  const ogImageUrl = buildOgImage({
    title: article.title,
    eyebrow: "Carnet de route",
    subtitle: article.excerpt,
  });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonical}#article`,
    mainEntityOfPage: canonical,
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    inLanguage: locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-GB",
    keywords: article.tags.join(", "),
    image: [ogImageUrl],
    author: {
      "@type": "Person",
      name: "Romain",
      url: `${SITE_URL}/a-propos`,
    },
    publisher: {
      "@type": "Organization",
      name: "RB-CapSO",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.svg`,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: homeUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "en" ? "Road journal" : locale === "es" ? "Cuaderno de ruta" : "Carnet de route",
        item: blogIndex,
      },
      { "@type": "ListItem", position: 3, name: article.title, item: canonical },
    ],
  };

  return (
    <>
      <Script id={`article-schema-${slug}`} type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </Script>
      <Script id={`breadcrumb-schema-${slug}`} type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </Script>
      <Header />
      <main id="main">
        <article className="mx-auto max-w-[720px] px-6 py-16">
          <header className="mb-12">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-sage/20 text-ink/80 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <time
              className="text-sm text-ink/50 uppercase tracking-widest"
              dateTime={article.publishedAt}
            >
              {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </header>
          <Markdown source={article.body} className="text-lg" />
        </article>
      </main>
      <Footer />
    </>
  );
}
