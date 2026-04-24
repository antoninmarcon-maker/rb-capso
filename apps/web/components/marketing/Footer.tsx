import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Instagram } from "lucide-react";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-cream border-t border-ink/10">
      <div className="mx-auto max-w-[1240px] px-6 py-16">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="font-display text-2xl">RB-CapSO</div>
            <p className="mt-3 text-sm text-ink/70 max-w-xs">
              {t("contact.h1")}
            </p>
            <p className="mt-6 text-sm">
              <a
                href="mailto:bonjour@rb-capso.fr"
                className="underline underline-offset-2 hover:text-ocean"
              >
                bonjour@rb-capso.fr
              </a>
            </p>
            <p className="mt-2 text-sm text-ink/70">
              9 Rue du Hapchot, 40130 Capbreton
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-ink/90">{t("nav.rent")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/70">
              <li>
                <Link
                  href={{ pathname: "/vans/[slug]", params: { slug: "penelope" } }}
                  className="hover:text-ink"
                >
                  Pénélope
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/vans/[slug]", params: { slug: "peggy" } }}
                  className="hover:text-ink"
                >
                  Peggy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-ink/90">{t("nav.workshop")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/70">
              <li>
                <Link href="/a-propos" className="hover:text-ink">
                  {t("nav.workshop")}
                </Link>
              </li>
              <li>
                <Link href="/conception" className="hover:text-ink">
                  {t("nav.build")}
                </Link>
              </li>
              <li>
                <Link href="/carnet-de-route" className="hover:text-ink">
                  {t("nav.journal")}
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="hover:text-ink">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-ink/90">Suivre</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/70">
              <li>
                <a
                  href="https://www.instagram.com/Rb.capso/"
                  className="inline-flex items-center gap-1.5 hover:text-ink"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Instagram className="w-4 h-4" aria-hidden /> Instagram
                </a>
              </li>
              <li>
                <Link href="/cgv" className="hover:text-ink">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-ink">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-ink/10 flex flex-wrap gap-4 items-center justify-between text-xs text-ink/60">
          <p className="font-display text-sm">{t("footer_tagline")}</p>
          <p>© {new Date().getFullYear()} RB-CapSO</p>
        </div>
      </div>
    </footer>
  );
}
