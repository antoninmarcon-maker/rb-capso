import { NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

export const runtime = "nodejs";

const schema = z.object({
  objet: z.enum(["location", "conception", "autre"]),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().min(5).max(5000),
  // honeypot: if filled, silently succeed (bot)
  website: z.string().optional(),
});

/**
 * Simple in-memory rate limiter (per IP). Good enough for a small site.
 * For real volume, use Upstash Redis or Vercel KV.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX) return false;
  bucket.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(ip)) {
    return new Response("Trop de demandes, réessayez dans une minute.", {
      status: 429,
    });
  }

  let payload: unknown;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
    }
  } catch {
    return new Response("Invalid body", { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return new Response("Formulaire invalide.", { status: 400 });
  }

  // Honeypot: bots fill this hidden field. We accept silently.
  if (parsed.data.website) {
    return Response.redirect(new URL("/contact?sent=1", req.url), 303);
  }

  const data = parsed.data;
  const adminEmail = process.env.ADMIN_EMAIL ?? "bonjour@rb-capso.fr";
  const resendKey = process.env.RESEND_API_KEY;

  const subject = `Nouveau message — ${data.objet} — ${data.firstName} ${data.lastName}`;
  const body = [
    `Projet : ${data.objet}`,
    `Nom : ${data.firstName} ${data.lastName}`,
    `Email : ${data.email}`,
    data.phone ? `Téléphone : ${data.phone}` : null,
    "",
    "Message :",
    data.message,
    "",
    `— IP : ${ip}`,
    `— Reçu : ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "RB-CapSO <bonjour@send.rb-capso.fr>",
        to: [adminEmail],
        replyTo: data.email,
        subject,
        text: body,
      });
    } catch (err) {
      console.error("[contact] Resend error", err);
      // Do not fail the user request if email delivery glitches. Log it.
    }
  } else {
    // No Resend key: log the submission for retrieval from server logs.
    console.log(`[contact] (no Resend key) ${subject}\n${body}`);
  }

  // Redirect the user to a success query flag that the form page can read.
  const isJson = (req.headers.get("accept") ?? "").includes("application/json");
  if (isJson) {
    return Response.json({ ok: true });
  }
  return Response.redirect(new URL("/contact?sent=1", req.url), 303);
}

export async function GET() {
  return new Response("POST only", { status: 405 });
}
