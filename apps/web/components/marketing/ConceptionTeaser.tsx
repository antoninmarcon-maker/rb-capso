import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function ConceptionTeaser() {
  const t = useTranslations("conception");
  const steps = t.raw("steps") as string[];

  return (
    <section className="bg-sage/15 py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image
              src="/atelier-menuiserie.jpg"
              alt="Atelier RB-CapSO"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl leading-tight">
              {t("h2")}
            </h2>
            <p className="mt-4 text-lg text-ink/80">{t("body")}</p>

            <ol className="mt-8 space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sage text-cream text-sm flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="text-ink/80 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-10">
              <Link
                href="/conception"
                className="inline-block bg-ink text-cream px-6 py-3 rounded-md font-medium hover:bg-ocean transition-colors"
              >
                {t("cta")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
