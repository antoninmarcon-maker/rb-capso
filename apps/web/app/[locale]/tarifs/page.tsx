import type { Metadata } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Markdown } from "@/lib/markdown";
import { alternatesFor } from "@/lib/seo";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Tarifs · RB-CapSO Capbreton",
    description: "Tarifs location et aménagement sur-mesure RB-CapSO. Transparents, sans mauvaise surprise.",
  },
  en: {
    title: "Pricing · RB-CapSO Capbreton",
    description: "RB-CapSO rental and bespoke conversion pricing. Transparent, no nasty surprises.",
  },
  es: {
    title: "Tarifas · RB-CapSO Capbreton",
    description: "Tarifas de alquiler y montaje a medida RB-CapSO. Transparentes, sin sorpresas.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META.fr;
  return {
    title: m.title,
    description: m.description,
    alternates: alternatesFor("/tarifs", locale),
  };
}

async function loadContent(): Promise<string> {
  return fs.readFile(path.join(process.cwd(), "content", "legal", "tarifs.md"), "utf8");
}

export default async function TarifsPage({
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
