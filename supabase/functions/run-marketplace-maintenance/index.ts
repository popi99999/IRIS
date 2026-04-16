import { getEnv, normalizeEmail } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { getSupabaseAdmin, tryUpsertIntoTable, upsertNotification } from "../_shared/supabase.ts";
import { getStripe } from "../_shared/stripe.ts";
import { isEligibleForPayout, releaseStripePayoutForOrder } from "../_shared/payouts.ts";
import { sendTransactionalEmail } from "../_shared/email.ts";

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

    const processingRecoveryMinutes = Number(getEnv("OFFER_PROCESSING_RECOVERY_MINUTES", "30"));
    const processingCutoff = now - processingRecoveryMinutes * 60 * 1000;
    const { data: staleProcessingOffers, error: staleProcessingError } = await admin
      .from("offers")
      .select("*")
      .eq("status", "processing")
      .lt("processing_started_at_ms", processingCutoff);
    if (staleProcessingError) {
      throw new HttpError("Unable to load stale processing offers", 500, staleProcessingError.message);
    }

    const recoveredProcessingOfferIds: string[] = [];
    for (const offer of staleProcessingOffers ?? []) {
      const paymentIntentId = String(offer.payment_intent_reference ?? "");
      const listingId = String(offer.listing_id ?? "");
      const orderId = String(offer.order_id ?? "");
      let paymentIntent: any = null;
      if (paymentIntentId) {
        try {
          paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
        } catch (error) {
          console.warn("[run-marketplace-maintenance] unable to inspect processing payment intent", paymentIntentId, error);
        }
      }
      const { data: linkedOrder } = orderId
        ? await admin.from("orders").select("*").eq("id", orderId).maybeSingle()
        : { data: null as any };
      const orderStatus = String(linkedOrder?.status ?? "");

      if (linkedOrder && ["paid", "awaiting_shipment", "shipped", "in_authentication", "dispatched_to_buyer", "delivered", "buyer_confirmed_delivery", "completed"].includes(orderStatus)) {
        await tryUpsertIntoTable("offers", {
          ...offer,
          status: "paid",
          payment_authorization_status: "paid",
          updated_at_ms: now,
        }, "id");
        if (listingId) {
          await admin.from("listings").update({
            inventory_status: "sold",
            order_id: linkedOrder.id,
            sold_at: linkedOrder.created_at ?? new Date().toISOString(),
          }).eq("id", listingId);
        }
        recoveredProcessingOfferIds.push(String(offer.id));
        continue;
      }

      if (paymentIntent && ["succeeded", "processing"].includes(String(paymentIntent.status ?? ""))) {
        const adminEmails = String(getEnv("ADMIN_EMAILS", "irisadminojmpx0nd@deltajohnsons.com"))
          .split(",")
          .map((entry: string) => normalizeEmail(entry))
          .filter(Boolean)
          .slice(0, 3);
        for (const adminEmail of adminEmails) {
          await sendTransactionalEmail("generic", adminEmail, {
            offerId: String(offer.id),
            orderId,
            body: `Offer ${offer.id} richiede riconciliazione manuale. Payment intent ${paymentIntentId} risulta ${paymentIntent.status}.`,
          }, {
            subject: `IRIS - Recovery offer ${offer.id}`,
          });
        }
        await tryUpsertIntoTable("offers", {
          ...offer,
          payment_authorization_status: "capture_recovery_pending",
          release_reason: "processing_timeout_manual_review",
          updated_at_ms: now,
        }, "id");
        continue;
      }

      if (paymentIntentId && paymentIntent && String(paymentIntent.status ?? "") === "requires_capture") {
        try {
          await getStripe().paymentIntents.cancel(paymentIntentId, {
            cancellation_reason: "abandoned",
          });
        } catch (error) {
          console.warn("[run-marketplace-maintenance] unable to cancel stale processing payment intent", paymentIntentId, error);
        }
      }

      await tryUpsertIntoTable("offers", {
        ...offer,
        status: "declined",
        payment_authorization_status: "authorization_released",
        released_at_ms: now,
        release_reason: "processing_timeout",
        updated_at_ms: now,
      }, "id");
      if (listingId) {
        await admin
          .from("listings")
          .update({ inventory_status: "published" })
          .eq("id", listingId)
          .eq("inventory_status", "offer_processing");
      }
      recoveredProcessingOfferIds.push(String(offer.id));
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
      if (["released", "paid", "processing"].includes(payoutStatus) || !isEligibleForPayout(String(order.status ?? ""))) {
        continue;
      }
      // Block payout if there is an active dispute or chargeback
      const { data: activeDisputes } = await admin
        .from("disputes")
        .select("id")
        .eq("order_id", String(order.id))
        .not("status", "in", '("resolved")')
        .limit(1);
      const { data: activeChargebacks } = await admin
        .from("chargebacks")
        .select("id")
        .eq("order_id", String(order.id))
        .not("status", "in", '("won","lost")')
        .limit(1);
      if ((activeDisputes && activeDisputes.length > 0) || (activeChargebacks && activeChargebacks.length > 0)) {
        console.log(`[run-marketplace-maintenance] payout blocked for order ${order.id} — active dispute/chargeback`);
        await admin.from("orders").update({ payout_status: "blocked" }).eq("id", String(order.id));
        continue;
      }
      try {
        const payout = await releaseStripePayoutForOrder(order);
        releasedPayoutOrderIds.push(String(payout.order.id ?? order.id));
      } catch (error) {
        console.warn("[run-marketplace-maintenance] unable to release payout", order.id, error);
      }
    }

    // Send reminders for unshipped orders
    const unshippedReminderDays = Number(getEnv("UNSHIPPED_REMINDER_DAYS", "3"));
    const unshippedCutoff = new Date(now - unshippedReminderDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: unshippedOrders } = await admin
      .from("orders")
      .select("*")
      .eq("status", "paid")
      .lt("created_at", unshippedCutoff)
      .is("shipped_at", null);

    const remindedOrderIds: string[] = [];
    for (const order of unshippedOrders ?? []) {
      for (const sellerEmail of (order.seller_emails ?? []) as string[]) {
        if (!sellerEmail) continue;
        await sendTransactionalEmail("generic", normalizeEmail(sellerEmail), {
          orderId: String(order.id),
          orderNumber: String(order.number ?? order.id),
          body: `Promemoria: l'ordine ${order.number ?? order.id} è in attesa di spedizione da ${unshippedReminderDays} giorni. Accedi a IRIS per generare l'etichetta di spedizione.`,
        }, { subject: `IRIS — Promemoria spedizione ordine ${order.number ?? order.id}` });
      }
      remindedOrderIds.push(String(order.id));
    }

    // Update seller stats (completed_sales and seller_rating)
    const { data: sellersToUpdate } = await admin
      .from("seller_profiles")
      .select("id, user_id")
      .limit(100);
    for (const seller of sellersToUpdate ?? []) {
      const { count: completedSales } = await admin
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", String(seller.user_id));
      const { data: ratings } = await admin
        .from("reviews")
        .select("rating")
        .eq("seller_id", String(seller.user_id));
      const avgRating = ratings && ratings.length
        ? ratings.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.rating ?? 5), 0) / ratings.length
        : 0;
      await admin
        .from("seller_profiles")
        .update({
          completed_sales: completedSales ?? 0,
          seller_rating: Math.round(avgRating * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq("id", String(seller.id));
    }

    console.log(`[run-marketplace-maintenance] done at ${new Date().toISOString()}`, {
      expiredOfferIds,
      recoveredProcessingOfferIds,
      releasedPayoutOrderIds,
      remindedOrderIds,
    });

    return jsonResponse({
      ok: true,
      expiredOfferIds,
      recoveredProcessingOfferIds,
      releasedPayoutOrderIds,
      remindedOrderIds,
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
