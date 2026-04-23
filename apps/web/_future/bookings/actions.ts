"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/client";
import { computeBookingPrice } from "@/lib/stripe/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  vanSlug: z.enum(["marceau", "lazare"]),
  startDate: z.string().date(),
  endDate: z.string().date(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  terms: z.literal("on"),
});

export async function createBooking(formData: FormData) {
  const parsed = schema.safeParse({
    vanSlug: formData.get("vanSlug"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    terms: formData.get("terms"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Formulaire invalide." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // 1. Get van
  const { data: van, error: vanErr } = await supabase
    .from("vans")
    .select("id, name, daily_rate_cents")
    .eq("slug", data.vanSlug)
    .single();

  if (vanErr || !van) {
    return { ok: false, error: "Van introuvable." };
  }

  // 2. Check availability (no overlap)
  const { data: conflicts } = await supabase
    .from("availability_blocks")
    .select("id")
    .eq("van_id", van.id)
    .or(`start_date.lte.${data.endDate},end_date.gte.${data.startDate}`);

  if (conflicts && conflicts.length > 0) {
    return { ok: false, error: "Ces dates ne sont plus disponibles." };
  }

  // 3. Compute pricing
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const price = computeBookingPrice(van.daily_rate_cents, start, end);

  // 4. Upsert customer
  const { data: customer } = await supabase
    .from("customers")
    .upsert(
      {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (!customer) {
    return { ok: false, error: "Erreur enregistrement client." };
  }

  // 5. Create pending booking
  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .insert({
      van_id: van.id,
      customer_id: customer.id,
      start_date: data.startDate,
      end_date: data.endDate,
      status: "pending",
      total_cents: price.totalCents,
    })
    .select()
    .single();

  if (bookingErr || !booking) {
    return { ok: false, error: "Erreur création réservation." };
  }

  // 6. Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Acompte 30% — ${van.name}`,
            description: `Réservation du ${data.startDate} au ${data.endDate}`,
          },
          unit_amount: price.upfrontCents,
        },
        quantity: 1,
      },
    ],
    metadata: { booking_id: booking.id },
    customer_email: data.email,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/reserver/confirmation?booking=${booking.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/vans/${data.vanSlug}`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  if (!session.url) {
    return { ok: false, error: "Erreur paiement." };
  }

  redirect(session.url);
}
