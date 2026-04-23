import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Hero } from "@/components/marketing/Hero";
import { ProofBar } from "@/components/marketing/ProofBar";
import { VansListing } from "@/components/marketing/VansListing";
import { ConceptionTeaser } from "@/components/marketing/ConceptionTeaser";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Manifesto } from "@/components/marketing/Manifesto";
import { Footer } from "@/components/marketing/Footer";
import { LocalBusinessSchema } from "@/components/schema/LocalBusinessSchema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  return {
    title: t("h1"),
    description: t("subtitle"),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <LocalBusinessSchema />
      <Header />
      <main id="main">
        <Hero />
        <ProofBar />
        <VansListing />
        <ConceptionTeaser />
        <Testimonials />
        <Manifesto />
      </main>
      <Footer />
    </>
  );
}
