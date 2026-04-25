import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Mail, Instagram, MapPin } from "lucide-react";
import { Signature } from "@/components/marketing/Signature";
import { alternatesFor } from "@/lib/seo";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Contact · Atelier Capbreton",
    description: "Un projet de location ou d'aménagement de van ? Atelier à Capbreton, Landes. Réponse sous 3 h en journée.",
  },
  en: {
    title: "Contact · Atelier Capbreton",
    description: "Hiring or building a van? Workshop in Capbreton, Landes. Reply within 3 hours during the day.",
  },
  es: {
    title: "Contacto · Taller Capbreton",
    description: "¿Alquiler o montaje de furgoneta? Taller en Capbreton, Las Landas. Respuesta en 3 h durante el día.",
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
    alternates: alternatesFor("/contact", locale),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const tForm = await getTranslations("form");

  return (
    <>
      <Header />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-24">
          <header className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 md:mb-20 items-end">
            <div>
              <span className="serial text-ink/55">Chapitre</span>
              <span className="block chapter-roman -ml-1 -mb-3">VII</span>
              <span className="serial text-ink/55">— Contact</span>
            </div>
            <div className="md:pb-3">
              <span className="eyebrow text-sage-deep">{t("nav.contact")}</span>
              <h1
                className="mt-5 font-display leading-[0.92] tracking-[-0.025em]"
                style={{
                  fontSize: "var(--t-display-xl)",
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100",
                  fontWeight: 350,
                }}
              >
                {t("contact.h1")}
              </h1>
              <p className="mt-6 text-lg text-ink/75 leading-relaxed max-w-xl">
                {t("contact.subtitle")}
              </p>
              <hr className="rule-double mt-8 max-w-[40%]" />
            </div>
          </header>

          <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 md:gap-20 items-start">
            {/* Left · coordonnées */}
            <aside className="space-y-10 md:sticky md:top-24 self-start">
              <div>
                <h3 className="serial text-ink/55 mb-5">— Adresse</h3>
                <p className="font-display italic text-2xl leading-snug">
                  9 Rue du Hapchot
                </p>
                <p className="font-display italic text-2xl leading-snug">
                  40130 Capbreton
                </p>
                <p className="coords text-ink/65 mt-3">
                  43°38&apos;37&quot;N · 1°25&apos;46&quot;W
                </p>
              </div>

              <hr className="rule-thin" />

              <div className="space-y-3">
                <h3 className="serial text-ink/55 mb-3">— Direct</h3>
                <a
                  href="mailto:bonjour@rb-capso.fr"
                  className="flex items-center gap-3 text-base hover:text-ember transition-colors group"
                >
                  <Mail className="w-4 h-4 text-sage-deep" aria-hidden />
                  <span className="font-display italic group-hover:underline">
                    bonjour@rb-capso.fr
                  </span>
                </a>
                <a
                  href="https://www.instagram.com/Rb.capso/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-base hover:text-ember transition-colors group"
                >
                  <Instagram className="w-4 h-4 text-sage-deep" aria-hidden />
                  <span className="font-display italic group-hover:underline">@Rb.capso</span>
                </a>
                <p className="flex items-center gap-3 text-base text-ink/75">
                  <MapPin className="w-4 h-4 text-sage-deep" aria-hidden />
                  <span className="font-display italic">Atelier à Capbreton</span>
                </p>
              </div>

              <hr className="rule-thin" />

              <div>
                <h3 className="serial text-ink/55 mb-3">— Horaires</h3>
                <p className="font-display italic">Lun. · Sam. · 9 h · 19 h</p>
                <p className="catalog-tag text-ink/55 mt-2">Sur rendez-vous</p>
                <p className="catalog-tag text-ink/55 mt-1">{tForm("response_time")}</p>
              </div>

              <hr className="rule-thin" />

              <div className="flex items-end gap-4">
                <Signature className="text-ink/85" width={140} />
                <span className="serial text-ink/55 italic font-display pb-1">
                  Romain
                </span>
              </div>
            </aside>

            {/* Right · form, ledger style */}
            <form
              action="/api/contact"
              method="POST"
              className="border border-ink p-6 md:p-10 bg-cream relative"
            >
              <div
                className="absolute inset-0 pointer-events-none border border-ink/40 m-1.5"
                aria-hidden
              />
              <div className="relative">
                <p className="catalog-tag text-ink/55 mb-8">
                  Formulaire N° 01 · Demande directe
                </p>

                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="absolute left-[-9999px]"
                  aria-hidden="true"
                  style={{ pointerEvents: "none" }}
                />

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="objet"
                      className="catalog-tag text-ink/65 mb-2 block"
                    >
                      · {tForm("project_label")}
                    </label>
                    <select
                      id="objet"
                      name="objet"
                      required
                      defaultValue="location"
                      className="w-full bg-transparent border-0 border-b border-ink/30 py-2 font-display italic text-lg focus:border-ember focus:outline-none transition-colors"
                    >
                      <option value="location">{tForm("project_rent")}</option>
                      <option value="conception">{tForm("project_build")}</option>
                      <option value="autre">{tForm("project_other")}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="catalog-tag text-ink/65 mb-2 block">
                        <span aria-hidden="true">· </span>{tForm("firstName")}
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        autoComplete="given-name"
                        placeholder="Romain"
                        className="w-full bg-transparent border-0 border-b border-ink/30 py-2 font-display italic text-lg focus:border-ember focus:outline-none transition-colors placeholder:text-ink/30"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="catalog-tag text-ink/65 mb-2 block">
                        <span aria-hidden="true">· </span>{tForm("lastName")}
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Dubois"
                        className="w-full bg-transparent border-0 border-b border-ink/30 py-2 font-display italic text-lg focus:border-ember focus:outline-none transition-colors placeholder:text-ink/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="catalog-tag text-ink/65 mb-2 block">
                        <span aria-hidden="true">· </span>{tForm("email")}
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder="vous@domaine.fr"
                        className="w-full bg-transparent border-0 border-b border-ink/30 py-2 text-base focus:border-ember focus:outline-none transition-colors placeholder:text-ink/30"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="catalog-tag text-ink/65 mb-2 block">
                        <span aria-hidden="true">· </span>{tForm("phone")}
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="06 ..."
                        className="w-full bg-transparent border-0 border-b border-ink/30 py-2 text-base focus:border-ember focus:outline-none transition-colors placeholder:text-ink/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="catalog-tag text-ink/65 mb-2 block">
                      <span aria-hidden="true">· </span>{tForm("message")}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      placeholder={tForm("message_placeholder")}
                      aria-describedby="form-privacy"
                      className="w-full bg-transparent border border-ink/20 px-3 py-3 text-base resize-y focus:border-ember focus:outline-none transition-colors placeholder:text-ink/30"
                    />
                  </div>

                  <hr className="rule-thin mt-2" />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p id="form-privacy" className="text-xs text-ink/65 max-w-sm leading-relaxed italic font-display">
                      {tForm("privacy")}
                    </p>
                    <button
                      type="submit"
                      className="btn-primary self-start sm:self-auto"
                    >
                      {tForm("submit")}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M5 12h14m0 0-5-5m5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-20 flex items-center gap-4 text-ink/65 serial">
            <span>p. 07</span>
            <span className="flex-1 h-px bg-ink/15" />
            <span className="font-display italic">§</span>
            <span className="flex-1 h-px bg-ink/15" />
            <span>RB · CapSO</span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
