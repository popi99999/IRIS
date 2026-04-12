import { normalizeAmount, normalizeEmail, normalizeString, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import {
  fetchListingById,
  fetchOfferById,
  getRequestUser,
  getSupabaseAdmin,
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
    const isAdmin = ["owner@iris-fashion.it", "admin@iris-fashion.it", "support@iris-fashion.it"].includes(userEmail);
    if (!isAdmin && userEmail !== sellerEmail) {
      throw new HttpError("You cannot manage this offer", 403);
    }

    if (String(offer.status ?? "") !== "pending") {
      throw new HttpError("This offer can no longer be managed", 409);
    }

    if (Number(offer.expires_at_ms ?? 0) > 0 && Date.now() > Number(offer.expires_at_ms ?? 0)) {
      await cancelOfferPaymentIntent(offer);
      const expiredOffer = {
        ...offer,
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

    if (decision === "declined") {
      const cancelledIntent = await cancelOfferPaymentIntent(offer);
      const declinedOffer = {
        ...offer,
        status: "declined",
        payment_authorization_status: "authorization_released",
        released_at_ms: Date.now(),
        release_reason: body.reason ?? "declined_by_seller",
        updated_at_ms: Date.now(),
      };
      await tryUpsertIntoTable("offers", declinedOffer, "id");
      await upsertNotification({
        recipient_id: offer.buyer_id ?? null,
        recipient_email: buyerEmail,
        audience: "user",
        kind: "offer",
        title: "Offerta rifiutata",
        body: `${offer.product_brand ?? offer.productBrand ?? ""} ${offer.product_name ?? offer.productName ?? ""}`.trim(),
        order_id: "",
        product_id: String(offer.product_id ?? offer.productId ?? listing.id ?? ""),
        scope: "offer",
        unread: true,
      });
      await sendTransactionalEmail("offer-declined", buyerEmail, {
        offerId,
        listingId: listing.id,
        productTitle: `${offer.product_brand ?? offer.productBrand ?? ""} ${offer.product_name ?? offer.productName ?? ""}`.trim(),
        sellerEmail,
        reason: body.reason ?? "",
        paymentIntentId: String(cancelledIntent?.id ?? offer.payment_intent_reference ?? ""),
      });
      return jsonResponse({
        ok: true,
        offer: declinedOffer,
        listing,
        releasedOffers: [],
        paymentIntent: cancelledIntent,
      });
    }

    const orderPayload = buildOfferOrderPayload({
      buyer: {
        id: String(offer.buyer_id ?? ""),
        email: buyerEmail,
        name: normalizeString(offer.buyer_name ?? offer.buyerName ?? ""),
      },
      offer,
      listing,
      payment: {
        paymentIntentId: String(offer.payment_intent_reference ?? offer.paymentIntentReference ?? ""),
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
      capturedIntent = await captureOfferPaymentIntent(offer);
    } catch (error) {
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
      ...offer,
      status: "paid",
      order_id: orderPayload.id,
      payment_authorization_status: "paid",
      captured_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    };
    const savedOrder = await tryUpsertIntoTable("orders", orderPayload, "id");
    if (!savedOrder) {
      console.error("[respond-to-offer] CRITICAL: order finalization failed after payment capture. orderId:", orderPayload.id, "paymentIntentId:", capturedIntent.id);
      throw new HttpError("Payment captured but order finalization failed. Contact support with reference: " + orderPayload.id, 500);
    }
    await tryUpsertIntoTable("offers", acceptedOffer, "id");
    await tryInsertIntoTable("notifications", {
      id: `ntf_${crypto.randomUUID()}`,
      recipient_id: offer.buyer_id ?? null,
      recipient_email: buyerEmail,
      audience: "user",
      kind: "offer",
      title: "Offerta accettata",
      body: `${orderPayload.number} · ${orderPayload.total}`,
      link: "",
      conversation_id: "",
      order_id: orderPayload.id,
      product_id: String(offer.product_id ?? offer.productId ?? listing.id ?? ""),
      scope: "offer",
      unread: true,
      created_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    });
    const releasedOffers = await declineCompetingOffers(String(offer.listing_id ?? offer.listingId ?? listing.id), offerId);

    await sendTransactionalEmail("offer-accepted", buyerEmail, {
      offerId,
      orderId: orderPayload.id,
      orderNumber: orderPayload.number,
      listingId: listing.id,
      productTitle: `${offer.product_brand ?? offer.productBrand ?? ""} ${offer.product_name ?? offer.productName ?? ""}`.trim(),
      amount: `${normalizeAmount(offer.offer_amount ?? offer.offerAmount ?? offer.amount, 0).toFixed(2)} ${String(orderPayload.payment.currency ?? "EUR")}`,
      sellerEmail,
    });
    await sendTransactionalEmail("checkout-confirmation", buyerEmail, {
      orderId: orderPayload.id,
      orderNumber: orderPayload.number,
      productTitle: `${offer.product_brand ?? offer.productBrand ?? ""} ${offer.product_name ?? offer.productName ?? ""}`.trim(),
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
