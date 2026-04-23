import { createAdminClient } from "@/lib/supabase/admin";
import { ExternalLink } from "lucide-react";

interface Props {
  vanSlug: "marceau" | "lazare";
  yescapaUrl: string;
  monthsToShow?: number;
}

interface DateBlock {
  start: Date;
  end: Date;
}

/**
 * Read-only availability calendar. Pulls blocked dates from Supabase
 * (populated by the iCal cron from Yescapa) and renders the next N months.
 * Booking still happens on Yescapa — CTA links out to the listing.
 */
export async function AvailabilityCalendar({ vanSlug, yescapaUrl, monthsToShow = 3 }: Props) {
  const blocks = await fetchBlockedDates(vanSlug, monthsToShow);
  const months = buildMonths(monthsToShow);

  return (
    <div className="rounded-lg border border-ink/10 bg-white/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-display text-xl">Disponibilités</h3>
          <p className="text-sm text-ink/60 mt-1">
            Dates grisées : indisponibles. Dates libres : cliquez pour réserver sur Yescapa.
          </p>
        </div>
        <a
          href={yescapaUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-sm text-ocean hover:text-ink transition-colors"
        >
          Voir sur Yescapa
          <ExternalLink className="w-3.5 h-3.5" aria-hidden />
        </a>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {months.map((m) => (
          <MonthGrid key={`${m.year}-${m.month}`} month={m} blocks={blocks} />
        ))}
      </div>

      <p className="mt-6 text-xs text-ink/50">
        Synchronisé depuis Yescapa. Actualisé toutes les 15 minutes.
      </p>
    </div>
  );
}

function parseDateLocal(s: string): Date {
  // 'YYYY-MM-DD' parsed as a calendar date in the viewer's locale (avoid UTC shift)
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

async function fetchBlockedDates(vanSlug: string, months: number): Promise<DateBlock[]> {
  // Skip Supabase entirely when credentials are placeholders or missing.
  // The calendar still renders with an empty set + a helpful message.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
    return [];
  }

  try {
    const supabase = createAdminClient();
    const today = new Date();
    const horizon = new Date(today);
    horizon.setMonth(horizon.getMonth() + months);

    const { data: van } = await supabase.from("vans").select("id").eq("slug", vanSlug).single();
    if (!van) return [];

    const todayISO = today.toISOString().split("T")[0];
    const horizonISO = horizon.toISOString().split("T")[0];

    const { data } = await supabase
      .from("availability_blocks")
      .select("start_date, end_date")
      .eq("van_id", van.id)
      .gte("end_date", todayISO)
      .lte("start_date", horizonISO);

    return (data ?? []).map((b) => ({
      start: parseDateLocal(b.start_date),
      end: parseDateLocal(b.end_date),
    }));
  } catch {
    return [];
  }
}

interface MonthData {
  year: number;
  month: number;
  label: string;
}

function buildMonths(n: number): MonthData[] {
  const out: MonthData[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    });
  }
  return out;
}

function MonthGrid({ month, blocks }: { month: MonthData; blocks: DateBlock[] }) {
  const firstDay = new Date(month.year, month.month, 1);
  const lastDay = new Date(month.year, month.month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday-first (European convention): getDay returns 0=Sun..6=Sat, we want 0=Mon..6=Sun
  const firstWeekday = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayLabels = ["L", "M", "M", "J", "V", "S", "D"];
  const today = new Date();

  return (
    <section aria-label={month.label}>
      <h4 className="font-medium text-sm uppercase tracking-wider text-ink/70 mb-3">
        {month.label}
      </h4>
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {dayLabels.map((l, i) => (
          <span key={i} className="text-ink/40 font-medium py-1">
            {l}
          </span>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <span key={`e${idx}`} />;
          const date = new Date(month.year, month.month, day);
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isBlocked = blocks.some((b) => date >= b.start && date < b.end);

          return (
            <span
              key={day}
              className={[
                "aspect-square flex items-center justify-center rounded text-sm",
                isPast
                  ? "text-ink/25"
                  : isBlocked
                  ? "bg-ink/15 text-ink/40 line-through"
                  : "bg-sage/20 text-ink hover:bg-sage/40 cursor-default",
              ].join(" ")}
              aria-label={
                isBlocked
                  ? `${day} ${month.label} — indisponible`
                  : isPast
                  ? `${day} ${month.label} — passé`
                  : `${day} ${month.label} — disponible`
              }
            >
              {day}
            </span>
          );
        })}
      </div>
    </section>
  );
}
