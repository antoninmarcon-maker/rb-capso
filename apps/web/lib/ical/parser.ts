import ical from "node-ical";

export interface ExternalEvent {
  uid: string;
  startDate: Date;
  endDate: Date;
  source: "yescapa";
}

export function parseICalText(text: string): ExternalEvent[] {
  const data = ical.sync.parseICS(text);
  const events: ExternalEvent[] = [];

  for (const key of Object.keys(data)) {
    const event = data[key];
    if (event.type !== "VEVENT") continue;

    events.push({
      uid: event.uid ?? key,
      startDate: event.start as Date,
      endDate: event.end as Date,
      source: "yescapa",
    });
  }

  return events;
}

// Fetch with Next.js cache so each render reuses the same iCal payload
// for an hour. Returns [] on any failure so the calendar still renders.
export async function fetchExternalEvents(
  icalUrl: string,
  revalidateSeconds = 3600,
): Promise<ExternalEvent[]> {
  try {
    const res = await fetch(icalUrl, {
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseICalText(text);
  } catch {
    return [];
  }
}
