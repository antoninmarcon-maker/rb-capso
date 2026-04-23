import type { Metadata } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Markdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site rb-capso.fr.",
};

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
