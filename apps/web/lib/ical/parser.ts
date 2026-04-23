import ical from "node-ical";

export interface ExternalEvent {
  uid: string;
  startDate: Date;
  endDate: Date;
  source: "yescapa";
}

export async function fetchYescapaEvents(icalUrl: string): Promise<ExternalEvent[]> {
  const data = await ical.async.fromURL(icalUrl);
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
