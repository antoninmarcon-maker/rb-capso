import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Instagram } from "lucide-react";
import { Signature } from "./Signature";

export function Footer() {
  const t = useTranslations();
  const tagline = t("footer_tagline");
  // Find the "long" word to italicize. Heuristic: italicize last 2 words.
  const taglineWords = tagline.replace(/\.$/, "").split(/\s+/);
  const taglineLead = taglineWords.slice(0, taglineWords.length - 2).join(" ");
  const taglineAccent = taglineWords.slice(-2).join(" ");

  return (
    <footer className="bg-ink text-cream relative overflow-hidden">
      {/* Top serial bar */}
      <div className="border-t border-cream/15">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-3 flex items-center justify-between serial text-cream/55">
          <span className="flex items-center gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-ember" />
            Colophon — Vol. 01
          </span>
          <span className="hidden md:inline">43°38&apos;37&quot;N · 1°25&apos;46&quot;W</span>
          <span className="font-display italic">Fin de dossier</span>
        </div>
      </div>

      {/* GIANT TAGLINE — manifesto closing */}
      <div className="relative py-24 md:py-36 text-center">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative mx-auto max-w-[1240px] px-6 md:px-10">
          <p className="serial text-cream/45 mb-6">— Devise de l&apos;atelier —</p>
          <p
            className="font-display leading-[0.95] tracking-[-0.025em] text-cream"
            style={{
              fontSize: "clamp(2.5rem, 9vw, 8rem)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 100",
              fontWeight: 350,
            }}
          >
            {taglineLead}{" "}
            <span
              className="text-ember italic"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1", fontWeight: 300 }}
            >
              {taglineAccent}
            </span>
          </p>

          <div className="mt-10 flex items-center justify-center gap-6 text-cream/55 serial">
            <span className="flex-1 max-w-32 h-px bg-cream/20" />
            <span className="font-display italic text-base">§</span>
            <span className="flex-1 max-w-32 h-px bg-cream/20" />
          </div>
        </div>
      </div>

      {/* Three-column ledger */}
      <div className="relative mx-auto max-w-[1240px] px-6 md:px-10 pb-16">
        <div className="grid md:grid-cols-12 gap-10 md:gap-12 pt-10 border-t border-cream/15">
          {/* Atelier infos */}
          <div className="md:col-span-5">
            <h4 className="serial text-cream/45 mb-5">— Atelier</h4>
            <h3
              className="font-display tracking-[-0.025em] leading-[0.95]"
              style={{ fontSize: "clamp(2rem, 3vw, 3rem)", fontVariationSettings: "'opsz' 96, 'SOFT' 80" }}
            >
              RB · CapSO
            </h3>
            <p className="mt-6 text-cream/65 leading-relaxed max-w-sm font-display italic">
              Atelier de menuiserie et location de vans aménagés.
            </p>

            <dl className="mt-8 grid grid-cols-[110px_1fr] gap-y-2 catalog-tag">
              <dt className="text-cream/45">Adresse</dt>
              <dd>9 Rue du Hapchot, 40130 Capbreton</dd>
              <dt className="text-cream/45">Mél</dt>
              <dd>
                <a href="mailto:bonjour@rb-capso.fr" className="hover:text-ember underline-offset-4 underline decoration-cream/30">
                  bonjour@rb-capso.fr
                </a>
              </dd>
              <dt className="text-cream/45">Insta</dt>
              <dd>
                <a
                  href="https://www.instagram.com/Rb.capso/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-ember underline-offset-4 underline decoration-cream/30"
                >
                  <Instagram className="w-3 h-3" aria-hidden /> @rb.capso
                </a>
              </dd>
            </dl>

            <div className="mt-10 flex flex-col gap-2">
              <Signature className="text-cream/85" width={150} />
              <span className="serial text-cream/45 italic font-display">
                — Romain, Capbreton 2026
              </span>
            </div>
          </div>

          {/* Sommaire — vertical table of contents */}
          <nav aria-label="Sommaire" className="md:col-span-4 grid grid-cols-2 gap-6 md:gap-10">
            <div>
              <h4 className="serial text-cream/45 mb-5">— Sommaire</h4>
              <ul className="space-y-2">
                {[
                  ["01", t("nav.workshop"), "/a-propos"] as const,
                  ["02", t("nav.rent"), "/vans"] as const,
                  ["03", t("nav.build"), "/conception"] as const,
                  ["04", t("nav.journal"), "/carnet-de-route"] as const,
                  ["05", "Tarifs", "/tarifs"] as const,
                  ["06", t("nav.contact"), "/contact"] as const,
                ].map(([n, label, href]) => (
                  <li key={href}>
                    <Link href={href} className="inline-flex items-baseline gap-2 group">
                      <span className="catalog-tag text-cream/35 tabular-nums">{n}</span>
                      <span className="font-display italic group-hover:text-ember transition-colors">
                        {label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="serial text-cream/45 mb-5">— Vans</h4>
              <ul className="space-y-2 font-display italic">
                <li>
                  <Link
                    href={{ pathname: "/vans/[slug]", params: { slug: "penelope" } }}
                    className="hover:text-ember"
                  >
                    Pénélope
                  </Link>
                  <span className="ml-2 catalog-tag text-cream/35 not-italic">
                    Ford Transit
                  </span>
                </li>
                <li>
                  <Link
                    href={{ pathname: "/vans/[slug]", params: { slug: "peggy" } }}
                    className="hover:text-ember"
                  >
                    Peggy
                  </Link>
                  <span className="ml-2 catalog-tag text-cream/35 not-italic">
                    Fiat Ducato
                  </span>
                </li>
              </ul>

              <h4 className="serial text-cream/45 mt-10 mb-5">— Légal</h4>
              <ul className="space-y-2 catalog-tag text-cream/65">
                <li>
                  <Link href="/cgv" className="hover:text-ember">CGV</Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-ember">Mentions légales</Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Colophon technique */}
          <div className="md:col-span-3">
            <h4 className="serial text-cream/45 mb-5">— Colophon</h4>
            <p className="text-cream/65 text-sm leading-relaxed">
              Composé en{" "}
              <span className="font-display italic text-cream/85">Fraunces</span> &amp;{" "}
              <span className="font-display text-cream/85">Inter</span>.
            </p>
            <p className="mt-3 text-cream/65 text-sm leading-relaxed">
              Imprimé numériquement par Vercel. Encre <span className="text-ember">pin</span> sur fond <span className="italic">crème atelier</span>.
            </p>
            <p className="mt-3 text-cream/65 text-sm leading-relaxed">
              Photographies par Romain Blondel.
            </p>
            <p className="mt-3 text-cream/45 text-xs leading-relaxed italic">
              Aucun cookie de tracking. Analytics anonyme uniquement.
            </p>
          </div>
        </div>

        {/* Bottom — pagination */}
        <div className="flex items-center gap-4 pt-10 mt-10 border-t border-cream/15 serial text-cream/45">
          <span>RB · CapSO · MMXXVI</span>
          <span className="flex-1 h-px bg-cream/15" />
          <span className="font-display italic">§</span>
          <span className="flex-1 h-px bg-cream/15" />
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
