import { normalizeEmail, normalizeString, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import {
  fetchProfileById,
  getRequestUser,
  updateProfilePayoutSettings,
} from "../_shared/supabase.ts";
import { getStripe } from "../_shared/stripe.ts";

type Body = {
  country?: string;
};

function readConnectAccountId(profile: Record<string, unknown> | null | undefined): string {
  const payoutSettings = (profile?.payout_settings ?? {}) as Record<string, unknown>;
  const stripeConnect = (payoutSettings.stripe_connect ?? payoutSettings.stripeConnect ?? payoutSettings.connect ?? {}) as Record<string, unknown>;
  return normalizeString(stripeConnect.account_id ?? stripeConnect.accountId ?? payoutSettings.stripe_connect_account_id ?? "");
}

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const body = await readJsonBody<Body>(request);
    const profile = await fetchProfileById(user.id);
    if (!profile) {
      throw new HttpError("Profile not found", 404);
    }

    const stripe = getStripe();
    let accountId = readConnectAccountId(profile);
    let account = null;

    if (accountId) {
      try {
        account = await stripe.accounts.retrieve(accountId);
      } catch (error) {
        console.warn("[create-connect-account] existing Stripe account not retrievable", error);
      }
    }

    if (!account) {
      account = await stripe.accounts.create({
        type: "express",
        country: String(body.country ?? "IT").toUpperCase(),
        email: normalizeEmail(user.email),
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          iris_user_id: user.id,
          iris_user_email: normalizeEmail(user.email),
        },
      });
      accountId = account.id;
    }

    const payoutSettings = {
      stripe_connect: {
        account_id: account.id,
        payouts_enabled: Boolean(account.payouts_enabled),
        charges_enabled: Boolean(account.charges_enabled),
        details_submitted: Boolean(account.details_submitted),
        country: account.country ?? String(body.country ?? "IT").toUpperCase(),
        type: account.type,
        last_synced_at: new Date().toISOString(),
      },
      stripeConnect: {
        accountId: account.id,
        payoutsEnabled: Boolean(account.payouts_enabled),
        chargesEnabled: Boolean(account.charges_enabled),
        detailsSubmitted: Boolean(account.details_submitted),
        country: account.country ?? String(body.country ?? "IT").toUpperCase(),
        type: account.type,
        lastSyncedAt: new Date().toISOString(),
      },
    };
    const updatedProfile = await updateProfilePayoutSettings(user.id, payoutSettings);

    return jsonResponse({
      ok: true,
      accountId: account.id,
      account: {
        id: account.id,
        country: account.country,
        type: account.type,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
      },
      profile: updatedProfile,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[create-connect-account] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
