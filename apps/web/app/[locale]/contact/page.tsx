import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import { alternatesFor } from "@/lib/seo";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Contact — RB-CapSO Capbreton",
    description: "Un projet de location ou d'aménagement de van ? Atelier à Capbreton, Landes. Réponse sous 3 h en journée.",
  },
  en: {
    title: "Contact — RB-CapSO Capbreton",
    description: "Hiring or building a van? Workshop in Capbreton, Landes. Reply within 3 hours during the day.",
  },
  es: {
    title: "Contacto — RB-CapSO Capbreton",
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
  return (
    <>
      <Header />
      <main id="main">
        <section className="mx-auto max-w-[1240px] px-6 py-20 grid md:grid-cols-2 gap-16">
          <div>
            <span className="text-sm text-sage uppercase tracking-widest">Contact</span>
            <h1 className="mt-2 font-display text-5xl md:text-6xl leading-[1.05]">
              Parlons de votre projet.
            </h1>
            <p className="mt-6 text-lg text-ink/80 leading-relaxed">
              Location, aménagement sur-mesure, ou simple question : j'essaie de répondre
              dans les trois heures en journée, jamais après 18h. Les dimanches ne sont
              jamais pressés.
            </p>

            <div className="mt-12 space-y-4 text-ink/90">
              <a
                href="mailto:bonjour@rb-capso.fr"
                className="flex items-center gap-3 hover:text-ocean transition-colors"
              >
                <Mail className="w-5 h-5 text-sage" aria-hidden />
                bonjour@rb-capso.fr
              </a>
              <a
                href="tel:+33600000000"
                className="flex items-center gap-3 hover:text-ocean transition-colors"
              >
                <Phone className="w-5 h-5 text-sage" aria-hidden />
                +33 6 00 00 00 00
              </a>
              <p className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-sage" aria-hidden />
                Atelier à Capbreton, Landes
              </p>
              <a
                href="https://www.instagram.com/Rb.capso/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-ocean transition-colors"
              >
                <Instagram className="w-5 h-5 text-sage" aria-hidden />
                @Rb.capso
              </a>
            </div>
          </div>

          <form action="/api/contact" method="POST" className="bg-white/70 p-8 rounded-lg border border-ink/10">
            <div className="space-y-5">
              <div>
                <label htmlFor="objet" className="block text-sm font-medium text-ink/80 mb-1">
                  Votre projet
                </label>
                <select
                  id="objet"
                  name="objet"
                  required
                  className="w-full border border-ink/20 rounded-md px-3 py-2 bg-cream"
                >
                  <option value="location">Louer un van</option>
                  <option value="conception">Aménagement sur-mesure</option>
                  <option value="autre">Autre question</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-ink/80 mb-1">
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="w-full border border-ink/20 rounded-md px-3 py-2 bg-cream"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-ink/80 mb-1">
                    Nom
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="w-full border border-ink/20 rounded-md px-3 py-2 bg-cream"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink/80 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full border border-ink/20 rounded-md px-3 py-2 bg-cream"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-ink/80 mb-1">
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full border border-ink/20 rounded-md px-3 py-2 bg-cream"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-ink/80 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Dates envisagées, modèle de van, ou simplement une question."
                  className="w-full border border-ink/20 rounded-md px-3 py-2 bg-cream resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-ink text-cream py-3 rounded-md font-medium hover:bg-ocean transition-colors"
              >
                Envoyer le brief
              </button>

              <p className="text-xs text-ink/60 text-center">
                Vos données servent uniquement à vous répondre. Aucun partage, aucune liste marketing.
              </p>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
