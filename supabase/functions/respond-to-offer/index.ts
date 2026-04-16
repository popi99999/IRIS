import { normalizeAmount, normalizeEmail, normalizeString, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import {
  fetchListingById,
  fetchOfferById,
  getRequestUser,
  getSupabaseAdmin,
  isUserAdmin,
  tryInsertIntoTable,
  tryUpsertIntoTable,
  upsertNotification,
} from "../_shared/supabase.ts";
import { buildOfferOrderPayload, buildTransferGroup } from "../_shared/marketplace.ts";
import { getStripe } from "../_shared/stripe.ts";
import { sendTransactionalEmail } from "../_shared/email.ts";

type RespondToOfferBody = {
  offerId?: string;
  decision?: "accepted" | "declined";
  reason?: string;
};

function normalizeDecision(decision: unknown): "accepted" | "declined" {
  return String(decision ?? "").toLowerCase() === "accepted" ? "accepted" : "declined";
}

async function cancelOfferPaymentIntent(offer: Record<string, unknown>) {
  const paymentIntentId = String(offer.payment_intent_reference ?? offer.paymentIntentReference ?? "");
  if (!paymentIntentId) {
    return null;
  }
  try {
    return await getStripe().paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: "requested_by_customer",
    });
  } catch (error) {
    console.warn("[respond-to-offer] unable to cancel payment intent", error);
    return null;
  }
}

async function captureOfferPaymentIntent(offer: Record<string, unknown>) {
  const paymentIntentId = String(offer.payment_intent_reference ?? offer.paymentIntentReference ?? "");
  if (!paymentIntentId) {
    throw new HttpError("Offer is missing Stripe payment intent reference", 409);
  }
  return await getStripe().paymentIntents.capture(paymentIntentId);
}

async function refundOfferPaymentIntent(paymentIntentId: string, offerId: string, orderId: string) {
  if (!paymentIntentId) {
    return null;
  }
  try {
    return await getStripe().refunds.create({
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        iris_flow: "offer_finalize_recovery",
        iris_offer_id: offerId,
        iris_order_id: orderId,
      },
    });
  } catch (error) {
    console.error("[respond-to-offer] unable to refund captured payment intent", error);
    return null;
  }
}

async function reserveOfferForDecision(offerId: string, decision: "accepted" | "declined", actorEmail: string) {
  const admin = getSupabaseAdmin();
  const now = Date.now();
  const { data, error } = await admin
    .from("offers")
    .update({
      status: "processing",
      decision_in_progress: decision,
      processing_by_email: actorEmail,
      processing_started_at_ms: now,
      updated_at_ms: now,
    })
    .eq("id", offerId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (error) {
    throw new HttpError("Unable to reserve offer for processing", 500, error.message);
  }
  if (!data) {
    throw new HttpError("This offer can no longer be managed", 409);
  }
  return data as Record<string, unknown>;
}

async function claimListingForOfferProcessing(listingId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("listings")
    .update({
      inventory_status: "offer_processing",
    })
    .eq("id", listingId)
    .neq("inventory_status", "sold")
    .neq("inventory_status", "offer_processing")
    .select("*")
    .maybeSingle();
  if (error) {
    throw new HttpError("Unable to reserve listing for offer processing", 500, error.message);
  }
  if (!data) {
    throw new HttpError("Listing is no longer available for this offer", 409);
  }
  return data as Record<string, unknown>;
}

async function restoreListingInventory(listingId: string, previousInventoryStatus: string) {
  if (!listingId) {
    return;
  }
  try {
    await getSupabaseAdmin()
      .from("listings")
      .update({
        inventory_status: previousInventoryStatus || null,
      })
      .eq("id", listingId);
  } catch (error) {
    console.error("[respond-to-offer] unable to restore listing inventory status", error);
  }
}

async function markListingSold(listingId: string, orderId: string) {
  if (!listingId) {
    return;
  }
  try {
    await getSupabaseAdmin()
      .from("listings")
      .update({
        inventory_status: "sold",
        order_id: orderId,
        sold_at: new Date().toISOString(),
      })
      .eq("id", listingId);
  } catch (error) {
    console.error("[respond-to-offer] unable to mark listing sold", error);
  }
}

async function sendOfferEmailSafely(
  templateKey: string,
  email: string,
  context: Record<string, unknown>,
) {
  try {
    await sendTransactionalEmail(templateKey, email, context);
  } catch (error) {
    console.warn("[respond-to-offer] transactional email failed", templateKey, email, error);
  }
}

async function declineCompetingOffers(listingId: string, acceptedOfferId: string) {
  const admin = getSupabaseAdmin();
  const { data: competingOffers, error } = await admin
    .from("offers")
    .select("*")
    .eq("listing_id", listingId)
    .eq("status", "pending")
    .neq("id", acceptedOfferId);
  if (error) {
    throw new HttpError("Unable to load competing offers", 500, error.message);
  }
  const releasedOffers: Record<string, unknown>[] = [];
  for (const offer of competingOffers ?? []) {
    await cancelOfferPaymentIntent(offer);
    const releasedOffer = {
      ...offer,
      status: "declined",
      payment_authorization_status: "authorization_released",
      released_at_ms: Date.now(),
      release_reason: "competing_offer_accepted",
      updated_at_ms: Date.now(),
    };
    releasedOffers.push(releasedOffer);
    await tryUpsertIntoTable("offers", releasedOffer, "id");
  }
  return releasedOffers;
}

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const body = await readJsonBody<RespondToOfferBody>(request);
    const offerId = String(body.offerId ?? "").trim();
    if (!offerId) {
      throw new HttpError("Missing offer id", 400);
    }

    const decision = normalizeDecision(body.decision);
    const offer = await fetchOfferById(offerId);
    if (!offer) {
      throw new HttpError("Offer not found", 404);
    }

    const buyerEmail = normalizeEmail(offer.buyer_email ?? offer.buyerEmail ?? "");
    const sellerEmail = normalizeEmail(offer.seller_email ?? offer.sellerEmail ?? "");
    const userEmail = normalizeEmail(user.email);
    const isAdmin = await isUserAdmin(user);
    if (!isAdmin && userEmail !== sellerEmail) {
      throw new HttpError("You cannot manage this offer", 403);
    }

    if (String(offer.status ?? "") !== "pending") {
      throw new HttpError("This offer can no longer be managed", 409);
    }

    const reservedOffer = await reserveOfferForDecision(offerId, decision, userEmail);

    if (Number(reservedOffer.expires_at_ms ?? 0) > 0 && Date.now() > Number(reservedOffer.expires_at_ms ?? 0)) {
      await cancelOfferPaymentIntent(reservedOffer);
      const expiredOffer = {
        ...reservedOffer,
        status: "declined",
        payment_authorization_status: "authorization_released",
        released_at_ms: Date.now(),
        release_reason: "expired",
        updated_at_ms: Date.now(),
      };
      await tryUpsertIntoTable("offers", expiredOffer, "id");
      return jsonResponse({
        ok: false,
        error: "Offer expired",
        offer: expiredOffer,
      }, { status: 409 });
    }

    const listing = await fetchListingById(String(offer.listing_id ?? offer.listingId ?? ""));
    if (!listing) {
      throw new HttpError("Listing not found", 404);
    }
    const listingId = String(listing.id ?? reservedOffer.listing_id ?? reservedOffer.listingId ?? "");
    const previousInventoryStatus = String(listing.inventory_status ?? listing.inventoryStatus ?? "");

    if (decision === "declined") {
      const cancelledIntent = await cancelOfferPaymentIntent(reservedOffer);
      const declinedOffer = {
        ...reservedOffer,
        status: "declined",
        payment_authorization_status: "authorization_released",
        released_at_ms: Date.now(),
        release_reason: body.reason ?? "declined_by_seller",
        updated_at_ms: Date.now(),
      };
      await tryUpsertIntoTable("offers", declinedOffer, "id");
      await upsertNotification({
        recipient_id: reservedOffer.buyer_id ?? null,
        recipient_email: buyerEmail,
        audience: "user",
        kind: "offer",
        title: "Offerta rifiutata",
        body: `${reservedOffer.product_brand ?? reservedOffer.productBrand ?? ""} ${reservedOffer.product_name ?? reservedOffer.productName ?? ""}`.trim(),
        order_id: "",
        product_id: String(reservedOffer.product_id ?? reservedOffer.productId ?? listing.id ?? ""),
        scope: "offer",
        unread: true,
      });
      await sendOfferEmailSafely("offer-declined", buyerEmail, {
        offerId,
        listingId: listing.id,
        productTitle: `${reservedOffer.product_brand ?? reservedOffer.productBrand ?? ""} ${reservedOffer.product_name ?? reservedOffer.productName ?? ""}`.trim(),
        sellerEmail,
        reason: body.reason ?? "",
        paymentIntentId: String(cancelledIntent?.id ?? reservedOffer.payment_intent_reference ?? ""),
      });
      return jsonResponse({
        ok: true,
        offer: declinedOffer,
        listing,
        releasedOffers: [],
        paymentIntent: cancelledIntent,
      });
    }

    try {
      await claimListingForOfferProcessing(listingId);
    } catch (error) {
      await cancelOfferPaymentIntent(reservedOffer);
      await tryUpsertIntoTable("offers", {
        ...reservedOffer,
        status: "declined",
        payment_authorization_status: "authorization_released",
        release_reason: "listing_unavailable",
        released_at_ms: Date.now(),
        updated_at_ms: Date.now(),
      }, "id");
      throw error;
    }

    const orderPayload = buildOfferOrderPayload({
      buyer: {
        id: String(reservedOffer.buyer_id ?? ""),
        email: buyerEmail,
        name: normalizeString(reservedOffer.buyer_name ?? reservedOffer.buyerName ?? ""),
      },
      offer: reservedOffer,
      listing,
      payment: {
        paymentIntentId: String(reservedOffer.payment_intent_reference ?? reservedOffer.paymentIntentReference ?? ""),
        paymentIntentStatus: "requires_capture",
        chargeId: "",
        transferGroup: buildTransferGroup(`order_${offerId}`),
      },
    });
    orderPayload.payment.transferGroup = buildTransferGroup(orderPayload.id);
    orderPayload.status = "pending_capture";
    orderPayload.payment.status = "authorized";
    const provisionalOrder = await tryUpsertIntoTable("orders", orderPayload, "id");
    if (!provisionalOrder) {
      throw new HttpError("Unable to create order record before payment capture", 500);
    }

    let capturedIntent;
    try {
      capturedIntent = await captureOfferPaymentIntent(reservedOffer);
    } catch (error) {
      await restoreListingInventory(listingId, previousInventoryStatus);
      await tryUpsertIntoTable("orders", {
        ...orderPayload,
        status: "payment_failed",
        payment: {
          ...orderPayload.payment,
          status: "capture_failed",
          paymentIntentStatus: "capture_failed",
          captureFailedAt: new Date().toISOString(),
        },
      }, "id");
      await tryUpsertIntoTable("offers", {
        ...reservedOffer,
        status: "declined",
        payment_authorization_status: "capture_failed",
        release_reason: "capture_failed",
        updated_at_ms: Date.now(),
      }, "id");
      throw error;
    }

    orderPayload.status = "paid";
    orderPayload.payment.status = "captured";
    orderPayload.payment.paymentIntentId = capturedIntent.id;
    orderPayload.payment.paymentIntentStatus = capturedIntent.status;
    orderPayload.payment.chargeId = Array.isArray(capturedIntent.charges?.data) && capturedIntent.charges.data.length
      ? String(capturedIntent.charges.data[0]?.id ?? "")
      : "";
    orderPayload.payment.capturedAt = new Date().toISOString();

    const acceptedOffer = {
      ...reservedOffer,
      status: "paid",
      order_id: orderPayload.id,
      payment_authorization_status: "paid",
      captured_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    };
    const savedOrder = await tryUpsertIntoTable("orders", orderPayload, "id");
    if (!savedOrder) {
      console.error("[respond-to-offer] CRITICAL: order finalization failed after payment capture. orderId:", orderPayload.id, "paymentIntentId:", capturedIntent.id);
      const refund = await refundOfferPaymentIntent(capturedIntent.id, offerId, orderPayload.id);
      await restoreListingInventory(listingId, previousInventoryStatus);
      await tryUpsertIntoTable("orders", {
        ...orderPayload,
        status: refund ? "refunded" : "payment_review",
        payment: {
          ...orderPayload.payment,
          status: refund ? "refunded" : "capture_recovery_pending",
          paymentIntentStatus: refund ? "refunded" : String(capturedIntent.status ?? "succeeded"),
          refundId: refund ? String(refund.id ?? "") : "",
          refundedAt: refund ? new Date().toISOString() : null,
          recoveryReason: "order_finalize_failed",
        },
      }, "id");
      await tryUpsertIntoTable("offers", {
        ...reservedOffer,
        status: "declined",
        order_id: orderPayload.id,
        payment_authorization_status: refund ? "authorization_released" : "capture_recovery_pending",
        release_reason: "order_finalize_failed",
        updated_at_ms: Date.now(),
      }, "id");
      throw new HttpError(
        refund
          ? "Payment captured but automatically refunded after order finalization failure. Reference: " + orderPayload.id
          : "Payment captured but recovery requires manual support intervention. Reference: " + orderPayload.id,
        500,
      );
    }
    const savedAcceptedOffer = await tryUpsertIntoTable("offers", acceptedOffer, "id");
    if (!savedAcceptedOffer) {
      console.error("[respond-to-offer] CRITICAL: accepted offer finalization failed after payment capture. orderId:", orderPayload.id, "offerId:", offerId);
      const refund = await refundOfferPaymentIntent(capturedIntent.id, offerId, orderPayload.id);
      await restoreListingInventory(listingId, previousInventoryStatus);
      await tryUpsertIntoTable("orders", {
        ...orderPayload,
        status: refund ? "refunded" : "payment_review",
        payment: {
          ...orderPayload.payment,
          status: refund ? "refunded" : "capture_recovery_pending",
          paymentIntentStatus: refund ? "refunded" : String(capturedIntent.status ?? "succeeded"),
          refundId: refund ? String(refund.id ?? "") : "",
          refundedAt: refund ? new Date().toISOString() : null,
          recoveryReason: "offer_finalize_failed",
        },
      }, "id");
      throw new HttpError(
        refund
          ? "Payment captured but automatically refunded after offer finalization failure. Reference: " + orderPayload.id
          : "Payment captured but offer finalization requires manual support intervention. Reference: " + orderPayload.id,
        500,
      );
    }
    await markListingSold(listingId, orderPayload.id);
    await tryInsertIntoTable("notifications", {
      id: `ntf_${crypto.randomUUID()}`,
      recipient_id: reservedOffer.buyer_id ?? null,
      recipient_email: buyerEmail,
      audience: "user",
      kind: "offer",
      title: "Offerta accettata",
      body: `${orderPayload.number} · ${orderPayload.total}`,
      link: "",
      conversation_id: "",
      order_id: orderPayload.id,
      product_id: String(reservedOffer.product_id ?? reservedOffer.productId ?? listing.id ?? ""),
      scope: "offer",
      unread: true,
      created_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    });
    let releasedOffers: Record<string, unknown>[] = [];
    try {
      releasedOffers = await declineCompetingOffers(listingId, offerId);
    } catch (error) {
      console.error("[respond-to-offer] unable to decline competing offers after acceptance", error);
    }

    await sendOfferEmailSafely("offer-accepted", buyerEmail, {
      offerId,
      orderId: orderPayload.id,
      orderNumber: orderPayload.number,
      listingId: listing.id,
      productTitle: `${reservedOffer.product_brand ?? reservedOffer.productBrand ?? ""} ${reservedOffer.product_name ?? reservedOffer.productName ?? ""}`.trim(),
      amount: `${normalizeAmount(reservedOffer.offer_amount ?? reservedOffer.offerAmount ?? reservedOffer.amount, 0).toFixed(2)} ${String(orderPayload.payment.currency ?? "EUR")}`,
      sellerEmail,
    });
    await sendOfferEmailSafely("checkout-confirmation", buyerEmail, {
      orderId: orderPayload.id,
      orderNumber: orderPayload.number,
      productTitle: `${reservedOffer.product_brand ?? reservedOffer.productBrand ?? ""} ${reservedOffer.product_name ?? reservedOffer.productName ?? ""}`.trim(),
      amount: `${orderPayload.total.toFixed(2)} ${String(orderPayload.payment.currency ?? "EUR")}`,
    });

    return jsonResponse({
      ok: true,
      order: orderPayload,
      offer: acceptedOffer,
      listing,
      releasedOffers,
      paymentIntent: capturedIntent,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[respond-to-offer] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
