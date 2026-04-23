import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

export default function NotFound() {
  const t = useTranslations("not_found");
  return (
    <>
      <Header />
      <main
        id="main"
        className="min-h-[60vh] flex items-center justify-center px-6 py-20 text-center"
      >
        <div className="max-w-md">
          <p className="font-display text-7xl text-sage">404</p>
          <h1 className="mt-4 font-display text-3xl">{t("h1")}</h1>
          <p className="mt-4 text-ink/70">{t("body")}</p>
          <Link
            href="/"
            className="mt-8 inline-block bg-ink text-cream px-6 py-3 rounded-md font-medium hover:bg-ocean transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
