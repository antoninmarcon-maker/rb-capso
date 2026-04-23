"use client";

import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/vans", label: t("rent") },
    { href: "/conception", label: t("build") },
    { href: "/carnet-de-route", label: t("journal") },
    { href: "/a-propos", label: t("workshop") },
    { href: "/contact", label: t("contact") },
  ] as const;

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

        <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink/80 hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ))}
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
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 -mr-2 text-ink"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
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
