import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ConceptionTeaser } from "@/components/marketing/ConceptionTeaser";

export const metadata: Metadata = {
  title: "Aménagement van sur-mesure dans les Landes — Atelier RB-CapSO",
  description:
    "Transformez votre van en atelier landais. Conception bois massif, cannage, vert sauge. Devis gratuit, pose soignée.",
};

const faqs = [
  {
    q: "Combien de temps prend un aménagement complet ?",
    a: "Entre 4 et 8 semaines de chantier, après devis signé. Le délai dépend de la complexité : un simple couchage prend 3 semaines, un aménagement complet 8.",
  },
  {
    q: "Travaillez-vous sur tous les modèles de van ?",
    a: "Oui, du Trafic au Ducato en passant par le Sprinter et le Transporter. Chaque modèle demande ses propres gabarits, c'est ce qui prend du temps en amont.",
  },
  {
    q: "Quel budget prévoir ?",
    a: "Un aménagement complet en bois massif sur un Ducato L2H2 commence autour de 18 000 €. Un aménagement plus simple sur Trafic autour de 9 000 €. Devis précis après RDV.",
  },
  {
    q: "Quels matériaux utilisez-vous ?",
    a: "Bois massif (pin, chêne, frêne), cannage naturel, isolation laine de mouton, finitions à l'huile dure. Aucun contreplaqué mélaminé, aucun tissu synthétique.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Échelonné en trois fois : 30 % à la signature, 40 % au démarrage du chantier, 30 % à la livraison.",
  },
  {
    q: "Où se trouve l'atelier ?",
    a: "Près de Capbreton, dans les Landes. Vous apportez votre van, vous le récupérez fini. Pas de déplacement.",
  },
];

export default async function ConceptionPage({
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
        <section className="relative h-[60vh] min-h-[480px] overflow-hidden">
          <Image
            src="/atelier-hero.jpg"
            alt="Atelier RB-CapSO, vue en contre-plongée avec copeaux et van en cours d'aménagement"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent" />

          <div className="relative h-full flex items-center">
            <div className="mx-auto max-w-[1240px] px-6">
              <div className="text-cream max-w-2xl">
                <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">
                  Votre van. Notre atelier.
                </h1>
                <p className="mt-6 text-lg text-cream/90">
                  De la première esquisse à la dernière vis, on le fait à la main.
                </p>
                <a
                  href="/contact?objet=conception"
                  className="mt-8 inline-block bg-cream text-ink px-6 py-3 rounded-md font-medium hover:bg-wood transition-colors"
                >
                  Raconter votre projet
                </a>
              </div>
            </div>
          </div>
        </section>

        <ConceptionTeaser />

        <section className="py-20 bg-cream">
          <div className="mx-auto max-w-[1240px] px-6">
            <h2 className="font-display text-4xl md:text-5xl leading-tight mb-12">
              Matières et principes.
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Bois massif",
                  body: "Pin, chêne, frêne. Jamais de mélaminé. Le bois travaille, il vit, il marque le temps. C'est son métier.",
                },
                {
                  title: "Cannage naturel",
                  body: "Placards et rangements en cannage rattan. Respire, allège visuellement, et rappelle le mobilier de campagne.",
                },
                {
                  title: "Vert sauge",
                  body: "Le blanc s'use. Le sauge se patine. Au bout d'un été, il raconte déjà quelque chose.",
                },
              ].map((item) => (
                <article key={item.title}>
                  <h3 className="font-display text-2xl">{item.title}</h3>
                  <p className="mt-3 text-ink/80 leading-relaxed">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-sage/15">
          <div className="mx-auto max-w-[820px] px-6">
            <h2 className="font-display text-4xl md:text-5xl text-center mb-12">
              Questions fréquentes.
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="p-6 bg-cream rounded-lg border border-ink/10 group"
                >
                  <summary className="font-display text-xl cursor-pointer list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-sage text-2xl group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-4 text-ink/80 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 text-center">
          <div className="mx-auto max-w-[680px] px-6">
            <h2 className="font-display text-4xl md:text-5xl leading-tight">
              Un projet ?
            </h2>
            <p className="mt-4 text-lg text-ink/80">
              Un rendez-vous d'une heure. On parle usage, couchage, autonomie, budget.
            </p>
            <a
              href="/contact?objet=conception"
              className="mt-8 inline-block bg-ink text-cream px-6 py-3 rounded-md font-medium hover:bg-ocean transition-colors"
            >
              Passer à l'atelier
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
