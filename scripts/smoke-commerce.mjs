#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

async function loadAnonKey() {
  if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  const configSource = await readFile(path.join(ROOT, "supabase-config.js"), "utf8");
  const match = configSource.match(/anonKey:\s*"([^"]+)"/);
  return match ? match[1] : "";
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, text, json };
}

async function main() {
  const siteUrl = normalizeBaseUrl(process.env.PUBLIC_SITE_URL || "https://popi99999.github.io/IRIS/");
  const functionsBase = normalizeBaseUrl(process.env.SUPABASE_FUNCTIONS_BASE_URL || "https://xzhgyamzfthqrcaljdqv.supabase.co/functions/v1");
  const anonKey = await loadAnonKey();
  const report = [];

  const homepage = await fetch(siteUrl);
  report.push({
    step: "homepage",
    url: siteUrl,
    status: homepage.status,
    ok: homepage.ok,
  });
  if (!homepage.ok) {
    fail("Homepage smoke failed.", report.at(-1));
  }

  for (const endpoint of [
    "create-checkout-session",
    "create-offer-authorization",
    "release-payout",
  ]) {
    const { response, json, text } = await fetchJson(`${functionsBase}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const ok = response.status === 401 || response.status === 403;
    report.push({
      step: `${endpoint}-requires-auth`,
      status: response.status,
      ok,
      body: json ?? text,
    });
    if (!ok) {
      fail(`${endpoint} did not reject unauthenticated access.`, report.at(-1));
    }
  }

  const webhookProbe = await fetchJson(`${functionsBase}/stripe-webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  report.push({
    step: "stripe-webhook-rejects-missing-signature",
    status: webhookProbe.response.status,
    ok: webhookProbe.response.status === 400,
    body: webhookProbe.json ?? webhookProbe.text,
  });
  if (webhookProbe.response.status !== 400) {
    fail("stripe-webhook did not reject missing signature.", report.at(-1));
  }

  if (process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD && process.env.SMOKE_LISTING_ID) {
    const authUrl = `${functionsBase.replace(/\/functions\/v1$/, "")}/auth/v1/token?grant_type=password`;
    const login = await fetchJson(authUrl, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.SMOKE_EMAIL,
        password: process.env.SMOKE_PASSWORD,
      }),
    });
    report.push({
      step: "password-login",
      status: login.response.status,
      ok: login.response.ok && Boolean(login.json?.access_token),
      body: login.json ?? login.text,
    });
    if (!login.response.ok || !login.json?.access_token) {
      fail("Authenticated smoke login failed.", report.at(-1));
    }

    const authHeaders = {
      apikey: anonKey,
      Authorization: `Bearer ${login.json.access_token}`,
      "Content-Type": "application/json",
    };

    const checkout = await fetchJson(`${functionsBase}/create-checkout-session`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        items: [{ listingId: process.env.SMOKE_LISTING_ID, quantity: 1 }],
        shipping: { method: "insured" },
        successUrl: process.env.PUBLIC_SITE_URL || siteUrl,
        cancelUrl: process.env.PUBLIC_SITE_URL || siteUrl,
      }),
    });
    report.push({
      step: "authenticated-checkout-session",
      status: checkout.response.status,
      ok: checkout.response.ok && Boolean(checkout.json?.checkoutUrl),
      body: checkout.json ?? checkout.text,
    });
    if (!checkout.response.ok || !checkout.json?.checkoutUrl) {
      fail("Authenticated checkout smoke failed.", report.at(-1));
    }

    const offer = await fetchJson(`${functionsBase}/create-offer-authorization`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        listingId: process.env.SMOKE_LISTING_ID,
        offerAmount: Number(process.env.SMOKE_OFFER_AMOUNT || "10"),
        returnUrl: process.env.PUBLIC_SITE_URL || siteUrl,
      }),
    });
    report.push({
      step: "authenticated-offer-authorization",
      status: offer.response.status,
      ok: offer.response.ok && Boolean(offer.json?.checkoutUrl),
      body: offer.json ?? offer.text,
    });
    if (!offer.response.ok || !offer.json?.checkoutUrl) {
      fail("Authenticated offer smoke failed.", report.at(-1));
    }
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message,
    details: error.details ?? null,
  }, null, 2));
  process.exit(1);
});
