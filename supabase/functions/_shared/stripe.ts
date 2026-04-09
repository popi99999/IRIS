import Stripe from "npm:stripe@16.12.0";
import { getEnv, normalizeAmount, requireEnv } from "./env.ts";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripeClient;
}

export function getWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF",
  "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

export function toStripeAmount(amount: number, currency = "EUR"): number {
  const normalized = normalizeAmount(amount, 0);
  if (ZERO_DECIMAL_CURRENCIES.has(String(currency).toUpperCase())) {
    return Math.round(normalized);
  }
  return Math.round(normalized * 100);
}

export function fromStripeAmount(amount: number, currency = "EUR"): number {
  if (ZERO_DECIMAL_CURRENCIES.has(String(currency).toUpperCase())) {
    return Math.max(0, amount);
  }
  return Math.max(0, amount) / 100;
}

export function buildTransferGroup(prefix: string, id: string): string {
  return `${prefix}_${id}`;
}

export function stringifyStripeMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {};
  }
  return Object.entries(value as Record<string, unknown>).reduce((acc, [key, rawValue]) => {
    if (rawValue === undefined || rawValue === null) {
      return acc;
    }
    acc[key] = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
    return acc;
  }, {} as Record<string, string>);
}

export function defaultSuccessUrl(path = "/"): string {
  return `${getEnv("PUBLIC_SITE_URL", "https://iris-fashion.it").replace(/\/+$/, "")}${path}`;
}

export function appendUrlParams(baseUrl: string, params: Record<string, string | number | boolean | null | undefined>): string {
  const url = new URL(baseUrl || defaultSuccessUrl("/"));
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}
