import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook error: ${msg}`, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) break;

      const { data: booking } = await supabase
        .from("bookings")
        .select("id, van_id, start_date, end_date")
        .eq("id", bookingId)
        .single();

      if (!booking) break;

      // Re-check availability before confirming
      const { data: conflicts } = await supabase
        .from("availability_blocks")
        .select("id")
        .eq("van_id", booking.van_id)
        .or(`start_date.lte.${booking.end_date},end_date.gte.${booking.start_date}`);

      if (conflicts && conflicts.length > 0) {
        // Refund and cancel
        if (session.payment_intent) {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            reason: "requested_by_customer",
          });
        }
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId);
        break;
      }

      // Confirm booking
      await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("id", bookingId);

      // Create availability block
      await supabase.from("availability_blocks").insert({
        van_id: booking.van_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        source: "direct",
        booking_id: booking.id,
      });

      // TODO: trigger BookingConfirmation email via Resend
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) break;

      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
