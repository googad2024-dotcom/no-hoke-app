import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Stripe.js は1度だけロードする（モジュールスコープでキャッシュ）。
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
