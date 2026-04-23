export interface PriceBreakdown {
  nights: number;
  ratePerNightCents: number;
  cleaningFeeCents: number;
  totalCents: number;
  depositHoldCents: number;
  upfrontCents: number;
  balanceCents: number;
}

const CLEANING_FEE_CENTS = 6000;
const DEPOSIT_HOLD_CENTS = 150000;
const UPFRONT_RATIO = 0.3;

export function computeBookingPrice(
  ratePerNightCents: number,
  startDate: Date,
  endDate: Date
): PriceBreakdown {
  const ms = endDate.getTime() - startDate.getTime();
  const nights = Math.round(ms / (1000 * 60 * 60 * 24));
  if (nights < 1) throw new Error("Invalid date range");

  const rentalCents = ratePerNightCents * nights;
  const totalCents = rentalCents + CLEANING_FEE_CENTS;
  const upfrontCents = Math.round(totalCents * UPFRONT_RATIO);
  const balanceCents = totalCents - upfrontCents;

  return {
    nights,
    ratePerNightCents,
    cleaningFeeCents: CLEANING_FEE_CENTS,
    totalCents,
    depositHoldCents: DEPOSIT_HOLD_CENTS,
    upfrontCents,
    balanceCents,
  };
}

export function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}
