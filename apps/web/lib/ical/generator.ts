import { createEvents, type EventAttributes } from "ics";

export interface Booking {
  id: string;
  startDate: Date;
  endDate: Date;
  vanName: string;
}

export function generateICalForVan(vanName: string, bookings: Booking[]): string {
  const events: EventAttributes[] = bookings.map((b) => ({
    uid: `rb-capso-${b.id}@rb-capso.fr`,
    start: [
      b.startDate.getUTCFullYear(),
      b.startDate.getUTCMonth() + 1,
      b.startDate.getUTCDate(),
    ],
    end: [
      b.endDate.getUTCFullYear(),
      b.endDate.getUTCMonth() + 1,
      b.endDate.getUTCDate(),
    ],
    title: `${vanName} — Réservé`,
    description: `Van ${vanName} indisponible (réservation directe).`,
    status: "CONFIRMED",
    productId: "rb-capso.fr",
    busyStatus: "BUSY",
  }));

  const { error, value } = createEvents(events);
  if (error) {
    throw error;
  }
  return value ?? "";
}
