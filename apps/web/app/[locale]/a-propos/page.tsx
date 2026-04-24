import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "L'atelier — RB-CapSO",
  description:
    "L'histoire d'un ex-sapeur-pompier devenu menuisier dans le sud des Landes. Atelier, matière, route.",
};

export default async function AProposPage({
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
        <section className="mx-auto max-w-[820px] px-6 py-20">
          <span className="text-sm text-sage uppercase tracking-widest">L'atelier</span>
          <h1 className="mt-2 font-display text-5xl md:text-6xl leading-[1.05]">
            Avant, il y avait la caserne.
          </h1>

          <div className="relative aspect-[3/2] mt-12 rounded-lg overflow-hidden">
            <Image
              src="/portrait-atelier.jpg"
              alt="Portrait du fondateur de RB-CapSO dans son atelier à Capbreton"
              fill
              sizes="(min-width: 820px) 820px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="prose prose-lg mt-12 space-y-6 text-ink/90 leading-relaxed">
            <p>
              Avant RB-CapSO, il y avait douze ans de caserne. Des gardes de nuit, des
              interventions, des gestes appris à répétition jusqu'à ce qu'ils deviennent
              naturels. Puis un week-end de 2023, dans un garage prêté par un voisin, j'ai
              passé deux jours entiers à transformer un vieux Transit pour partir surfer
              avec mes gamins. J'en suis sorti avec de la sciure dans les cheveux et une
              idée nette.
            </p>

            <p>
              J'ai appris la menuiserie comme j'avais appris les nœuds et les manœuvres :
              en recommençant. D'abord un établi, puis un deuxième van, puis une commande
              d'un ami, puis d'un inconnu. En 2025, j'ai installé l'atelier près de
              Capbreton. Deux vans à louer pour financer les outils, et des
              aménagements sur-mesure pour ceux qui veulent autre chose qu'un kit
              standard.
            </p>

            <p>
              Je travaille le bois clair, le cannage, le vert sauge. Je dessine chaque
              caisson à la main avant de tracer. Ce que j'aime dans ce métier, c'est la
              même chose qu'avant : faire des gestes utiles, à la bonne cote, pour que ça
              tienne.
            </p>

            <p className="font-display text-2xl text-wood pt-8 border-t border-ink/10">
              Fait main, pour prendre le large.
            </p>
          </div>
        </section>

        <section className="bg-sage/15 py-20">
          <div className="mx-auto max-w-[820px] px-6">
            <h2 className="font-display text-3xl md:text-4xl mb-8">
              Ce que vous trouverez ici.
            </h2>

            <dl className="space-y-6">
              {[
                ["Deux vans à louer", "Pénélope (Ford Transit Custom) et Peggy (Ducato L2H2), sur Yescapa ou en direct."],
                ["De la conception sur-mesure", "De la première esquisse à la dernière vis, à l'atelier."],
                ["Un carnet de route", "Des spots, des itinéraires, des conseils de partout où nos vans roulent."],
                ["Un homme, un atelier, un chien", "Pas d'équipe. Pas de sous-traitance. Le coup de fil arrive toujours à la même personne."],
              ].map(([term, def]) => (
                <div key={term}>
                  <dt className="font-display text-xl text-ink">{term}</dt>
                  <dd className="mt-1 text-ink/80">{def}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
