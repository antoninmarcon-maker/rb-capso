import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazy Stripe client.
 * Instantiating at module-load fails when STRIPE_SECRET_KEY is absent
 * (preview deployments or build machines without secrets). Defer to first call.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  cached = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    appInfo: { name: "rb-capso", version: "0.0.1" },
  });
  return cached;
}

// Proxy so existing callers using `stripe.xxx` still work but don't fail at import-time.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
