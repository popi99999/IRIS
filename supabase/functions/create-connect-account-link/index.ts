import { getEnv, normalizeString, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { fetchProfileById, getRequestUser, updateProfilePayoutSettings } from "../_shared/supabase.ts";
import { getStripe } from "../_shared/stripe.ts";

type Body = {
  refreshUrl?: string;
  returnUrl?: string;
  mode?: "onboarding" | "update";
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

    let accountId = readConnectAccountId(profile);
    if (!accountId) {
      const created = await getStripe().accounts.create({
        type: "express",
        country: "IT",
        email: user.email ?? undefined,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          iris_user_id: user.id,
          iris_user_email: user.email ?? "",
        },
      });
      accountId = created.id;
      await updateProfilePayoutSettings(user.id, {
        stripe_connect: {
          account_id: created.id,
          country: "IT",
          last_synced_at: new Date().toISOString(),
        },
      });
    }

    const refreshUrl = body.refreshUrl || `${getEnv("PUBLIC_SITE_URL", "https://iris-fashion.it")}/?connect=refresh`;
    const returnUrl = body.returnUrl || `${getEnv("PUBLIC_SITE_URL", "https://iris-fashion.it")}/?connect=return`;
    const link = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: body.mode === "update" ? "account_update" : "account_onboarding",
    });

    await updateProfilePayoutSettings(user.id, {
      stripe_connect: {
        account_id: accountId,
        onboarding_link_created_at: new Date().toISOString(),
        onboarding_link_mode: body.mode === "update" ? "account_update" : "account_onboarding",
      },
      stripeConnect: {
        accountId,
        onboardingLinkCreatedAt: new Date().toISOString(),
        onboardingLinkMode: body.mode === "update" ? "account_update" : "account_onboarding",
      },
    });

    return jsonResponse({
      ok: true,
      accountId,
      url: link.url,
      expiresAt: link.expires_at,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[create-connect-account-link] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
