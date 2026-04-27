"use client";

import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const nav = [
    { href: "/vans", label: t("rent") },
    { href: "/conception", label: t("build") },
    { href: "/carnet-de-route", label: t("journal") },
    { href: "/a-propos", label: t("workshop") },
    { href: "/contact", label: t("contact") },
  ] as const;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-sm border-b border-ink/10">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          aria-label="RB-CapSO"
          className="flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="font-display text-xl font-semibold tracking-tight">
            RB-CapSO
          </span>
        </Link>

        <nav aria-label={t("primary")} className="hidden md:flex items-center gap-8">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "relative text-sm transition-colors " +
                  (active
                    ? "text-ink after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-px after:bg-accent"
                    : "text-ink/80 hover:text-ink")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/vans"
            className="bg-ink text-cream text-sm px-4 py-2 rounded-md hover:bg-ocean transition-colors"
          >
            {t("book")}
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t("close_menu") : t("open_menu")}
          onClick={() => setOpen(!open)}
          className="md:hidden p-3 -mr-2 text-ink"
        >
          {open ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label={t("primary")}
          className="md:hidden border-t border-ink/10 bg-cream"
        >
          <ul className="px-6 py-4 flex flex-col gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-ink/80 hover:text-ink border-b border-ink/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-4 flex items-center justify-between gap-4">
              <LanguageSwitcher />
              <Link
                href="/vans"
                onClick={() => setOpen(false)}
                className="bg-ink text-cream text-sm px-4 py-2 rounded-md"
              >
                {t("book")}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
