import { getEnv, normalizeEmail } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { getSupabaseAdmin, tryUpsertIntoTable, upsertNotification } from "../_shared/supabase.ts";
import { getStripe } from "../_shared/stripe.ts";
import { isEligibleForPayout, releaseStripePayoutForOrder } from "../_shared/payouts.ts";

function requireCronSecret(request: Request) {
  const configured = getEnv("CRON_SECRET", "");
  if (!configured) {
    return;
  }
  const provided = request.headers.get("x-cron-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  if (provided !== configured) {
    throw new HttpError("Unauthorized", 401);
  }
}

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    requireCronSecret(request);
    const admin = getSupabaseAdmin();
    const now = Date.now();

    const { data: expiredOffers, error: offersError } = await admin
      .from("offers")
      .select("*")
      .eq("status", "pending")
      .lt("expires_at_ms", now);
    if (offersError) {
      throw new HttpError("Unable to load expiring offers", 500, offersError.message);
    }

    const expiredOfferIds: string[] = [];
    for (const offer of expiredOffers ?? []) {
      const paymentIntentId = String(offer.payment_intent_reference ?? "");
      if (paymentIntentId) {
        try {
          await getStripe().paymentIntents.cancel(paymentIntentId, {
            cancellation_reason: "abandoned",
          });
        } catch (error) {
          console.warn("[run-marketplace-maintenance] unable to cancel expired payment intent", paymentIntentId, error);
        }
      }
      const updatedOffer = {
        ...offer,
        status: "declined",
        payment_authorization_status: "authorization_released",
        released_at_ms: now,
        release_reason: "expired",
        updated_at_ms: now,
      };
      await tryUpsertIntoTable("offers", updatedOffer, "id");
      expiredOfferIds.push(String(offer.id));
      await upsertNotification({
        recipient_id: offer.buyer_id ?? null,
        recipient_email: normalizeEmail(offer.buyer_email ?? ""),
        audience: "user",
        kind: "offer",
        title: "Offerta scaduta",
        body: `${offer.product_brand ?? ""} ${offer.product_name ?? ""}`.trim(),
        order_id: "",
        product_id: String(offer.product_id ?? offer.listing_id ?? ""),
        scope: "offer",
        unread: true,
      });
    }

    const { data: payoutOrders, error: payoutError } = await admin
      .from("orders")
      .select("*")
      .in("status", ["delivered", "completed", "buyer_confirmed_delivery", "paid"]);
    if (payoutError) {
      throw new HttpError("Unable to load payout candidates", 500, payoutError.message);
    }

    const releasedPayoutOrderIds: string[] = [];
    for (const order of payoutOrders ?? []) {
      const payment = (order.payment ?? {}) as Record<string, unknown>;
      const payoutStatus = String(payment.payoutStatus ?? order.payout_status ?? "");
      if (["released", "paid"].includes(payoutStatus) || !isEligibleForPayout(String(order.status ?? ""))) {
        continue;
      }
      try {
        const payout = await releaseStripePayoutForOrder(order);
        releasedPayoutOrderIds.push(String(payout.order.id ?? order.id));
      } catch (error) {
        console.warn("[run-marketplace-maintenance] unable to release payout", order.id, error);
      }
    }

    return jsonResponse({
      ok: true,
      expiredOfferIds,
      releasedPayoutOrderIds,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[run-marketplace-maintenance] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
