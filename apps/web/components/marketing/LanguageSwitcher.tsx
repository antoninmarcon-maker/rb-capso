"use client";

import { useLocale } from "next-intl";
import { useRouter as useNextRouter, usePathname as useNextPathname } from "next/navigation";
import { useTransition } from "react";
import { routing } from "@/i18n/routing";

const labels: Record<string, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = useNextPathname();
  const router = useNextRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (newLocale: string) => {
    const segments = pathname.split("/");
    // Replace the locale segment or prepend one
    const hasLocalePrefix = routing.locales.includes(
      segments[1] as (typeof routing.locales)[number]
    );
    if (hasLocalePrefix) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/") || "/";
    startTransition(() => {
      router.replace(newPath);
    });
  };

  return (
    <nav aria-label="Language switcher" className="flex gap-1 text-xs">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          disabled={l === locale || isPending}
          onClick={() => switchTo(l)}
          className={[
            "px-2 py-1 rounded transition-colors uppercase tracking-wider",
            l === locale
              ? "text-ink font-semibold"
              : "text-ink/50 hover:text-ink",
          ].join(" ")}
          aria-current={l === locale ? "true" : undefined}
        >
          {labels[l]}
        </button>
      ))}
    </nav>
  );
}
