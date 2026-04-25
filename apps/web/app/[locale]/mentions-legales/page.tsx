import type { Metadata } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Markdown } from "@/lib/markdown";

import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Mentions légales · RB-CapSO",
    description: "Mentions légales du site rb-capso.fr.",
    alternates: alternatesFor("/mentions-legales", locale),
    robots: { index: false, follow: true },
  };
}

async function loadContent(): Promise<string> {
  return fs.readFile(
    path.join(process.cwd(), "content", "legal", "mentions-legales.md"),
    "utf8"
  );
}

export default async function MentionsLegalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const raw = await loadContent();

  return (
    <>
      <Header />
      <main id="main">
        <article className="mx-auto max-w-[720px] px-6 py-16">
          <Markdown source={raw} />
        </article>
      </main>
      <Footer />
    </>
  );
}
