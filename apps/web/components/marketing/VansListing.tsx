import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { vans } from "@/lib/vans/data";

export function VansListing() {
  const t = useTranslations("vans_listing");
  const list = Object.values(vans);

  return (
    <section className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        {/* Editorial header */}
        <header className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 mb-16 md:mb-20 items-end">
          <div>
            <span className="serial text-ink/55">Chapitre</span>
            <span className="block chapter-roman -ml-1 -mb-3">II</span>
            <span className="serial text-ink/55">— La Flotte</span>
          </div>
          <div className="max-w-2xl md:pb-3">
            <h2
              className="font-display leading-[0.95] tracking-[-0.025em]"
              style={{ fontSize: "var(--t-display-l)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
            >
              {t("title")}
            </h2>
            <p className="mt-6 text-lg text-ink/75 leading-relaxed max-w-xl">{t("subtitle")}</p>
            <hr className="rule-double mt-8 max-w-[60%]" />
          </div>
        </header>

        {/* Vans as TECHNICAL SHEETS — not polaroids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {list.map((van, idx) => {
            const sheetNum = `P-${String(idx + 1).padStart(2, "0")}`;
            return (
              <Link
                key={van.slug}
                href={{ pathname: "/vans/[slug]", params: { slug: van.slug } }}
                className="group block"
              >
                <article
                  className="relative"
                  style={{ viewTransitionName: `van-${van.slug}` }}
                >
                  {/* Sheet header — N° / Model / Year */}
                  <header className="flex items-start justify-between mb-3 catalog-tag text-ink/65">
                    <span>Fiche N° {sheetNum}</span>
                    <span className="text-right">
                      {van.model}
                      <span className="block text-ink/40 mt-0.5">Capbreton · 40130</span>
                    </span>
                  </header>

                  {/* Image — full width, sharp edges, surgical hover (translate, no scale) */}
                  <div
                    className="relative aspect-[16/11] w-full overflow-hidden bg-cream-deep border border-ink/85"
                    style={{ viewTransitionName: `van-image-${van.slug}` }}
                  >
                    <Image
                      src={van.gallery[0]}
                      alt={`${van.name} — ${van.model}`}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[-1.5%]"
                    />
                    {/* Cream filet that breathes inward */}
                    <div className="absolute inset-0 border border-cream/0 group-hover:border-cream/55 group-hover:inset-[10px] transition-all duration-[650ms] ease-[cubic-bezier(0.7,0,0.2,1)] pointer-events-none" aria-hidden />
                  </div>

                  {/* Caption row — name + price */}
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <h3
                      className="font-display italic leading-none"
                      style={{
                        fontSize: "clamp(2rem, 4vw, 3rem)",
                        fontVariationSettings: "'opsz' 96, 'SOFT' 80, 'WONK' 1",
                        fontWeight: 400,
                      }}
                    >
                      {van.name}
                    </h3>
                    <div className="text-right">
                      <span className="catalog-tag text-ink/55 block">Dès</span>
                      <span
                        className="font-display"
                        style={{
                          fontSize: "1.75rem",
                          fontStyle: "italic",
                          fontVariationSettings: "'opsz' 48, 'SOFT' 100, 'WONK' 1",
                          fontFeatureSettings: "'onum', 'pnum', 'ss01'",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {van.priceFromEuros}
                        <span className="text-ember not-italic"> €</span>
                      </span>
                      <span className="block serial text-ink/65 mt-0.5">par nuitée</span>
                    </div>
                  </div>

                  <p className="mt-2 text-[0.95rem] text-ink/70 italic font-display leading-snug max-w-xl">
                    « {van.tagline} »
                  </p>

                  {/* Specs table — ledger style */}
                  <table className="specs mt-6">
                    <tbody>
                      <tr>
                        <td>Modèle</td>
                        <td>{van.model}</td>
                      </tr>
                      <tr>
                        <td>Couchages</td>
                        <td>{van.sleeps} pers.</td>
                      </tr>
                      <tr>
                        <td>Longueur</td>
                        <td>{van.length}</td>
                      </tr>
                      <tr>
                        <td>Permis</td>
                        <td>B</td>
                      </tr>
                      <tr>
                        <td>Caution</td>
                        <td>1 500 €</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="marker-underline font-medium text-ink">
                      Voir la fiche {van.name}
                    </span>
                    <svg width="22" height="14" viewBox="0 0 24 14" fill="none" className="transition-transform group-hover:translate-x-1.5" aria-hidden>
                      <path d="M0 7h22m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* Footer rule with pagination mark */}
        <div className="mt-24 flex items-center gap-4 text-ink/65 serial">
          <span>p. 02</span>
          <span className="flex-1 h-px bg-ink/15" />
          <span className="font-display italic text-base">§</span>
          <span className="flex-1 h-px bg-ink/15" />
          <span>RB · CapSO — 2026</span>
        </div>
      </div>
    </section>
  );
}
