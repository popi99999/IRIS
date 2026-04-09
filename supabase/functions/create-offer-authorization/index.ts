import { normalizeAmount, normalizeEmail, normalizeString, readJsonBody, uuid } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import {
  fetchListingById,
  getRequestUser,
  getSupabaseAdmin,
  tryInsertIntoTable,
  tryUpsertIntoTable,
  upsertNotification,
} from "../_shared/supabase.ts";
import { calculateLineFees, OFFER_EXPIRY_HOURS } from "../_shared/marketplace.ts";
import { getStripe, stringifyStripeMetadata, toStripeAmount } from "../_shared/stripe.ts";
import { sendTransactionalEmail } from "../_shared/email.ts";

type OfferAuthorizationBody = {
  listingId?: string;
  offerAmount?: number;
  authorizedAmount?: number;
  shippingFee?: number;
  currency?: string;
  shippingSnapshot?: Record<string, unknown>;
  paymentMethodSnapshot?: Record<string, unknown>;
  paymentMethodId?: string;
  paymentMethodLabel?: string;
};

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const body = await readJsonBody<OfferAuthorizationBody>(request);
    const listingId = String(body.listingId ?? "").trim();
    const offerAmount = normalizeAmount(body.offerAmount, 0);
    if (!listingId) {
      throw new HttpError("Missing listing id", 400);
    }
    if (!Number.isFinite(offerAmount) || offerAmount <= 0) {
      throw new HttpError("Missing valid offer amount", 400);
    }

    const listing = await fetchListingById(listingId);
    if (!listing) {
      throw new HttpError("Listing not found", 404);
    }
    if (String(listing.listing_status ?? listing.listingStatus ?? "") !== "published") {
      throw new HttpError("Listing not available for offers", 409);
    }
    if (String(listing.inventory_status ?? listing.inventoryStatus ?? "") === "archived") {
      throw new HttpError("Listing already archived", 409);
    }
    if (normalizeAmount(listing.minimum_offer_amount ?? listing.minimumOfferAmount ?? 0, 0) > 0 && offerAmount < normalizeAmount(listing.minimum_offer_amount ?? listing.minimumOfferAmount ?? 0, 0)) {
      throw new HttpError("Offer is below the minimum offer amount", 409, {
        minimumOfferAmount: normalizeAmount(listing.minimum_offer_amount ?? listing.minimumOfferAmount ?? 0, 0),
      });
    }

    const ownerEmail = normalizeEmail(listing.owner_email ?? listing.ownerEmail ?? "");
    const buyerEmail = normalizeEmail(user.email);
    if (buyerEmail && buyerEmail === ownerEmail) {
      throw new HttpError("Cannot offer on your own listing", 409);
    }

    const { data: existingOffers, error: existingError } = await getSupabaseAdmin()
      .from("offers")
      .select("id,status,buyer_email")
      .eq("listing_id", listingId)
      .eq("buyer_email", buyerEmail)
      .eq("status", "pending");
    if (existingError) {
      throw new HttpError("Unable to validate existing offers", 500, existingError.message);
    }
    if ((existingOffers ?? []).length > 0) {
      throw new HttpError("You already have an active offer on this listing", 409);
    }

    const lineFees = calculateLineFees(listing, 1);
    const shippingFee = normalizeAmount(body.shippingFee ?? body.shippingSnapshot?.shippingFee ?? body.shippingSnapshot?.shipping_fee ?? 0, 0);
    const authorizedAmount = normalizeAmount(
      body.authorizedAmount,
      offerAmount + shippingFee + lineFees.buyerFee + lineFees.authFee,
    );
    const currency = String(body.currency ?? lineFees.currency ?? listing.price_currency ?? listing.currency ?? "EUR").toUpperCase();
    const offerId = `off_${uuid("iris")}`;
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: toStripeAmount(authorizedAmount, currency),
      currency: currency.toLowerCase(),
      capture_method: "manual",
      confirmation_method: "automatic",
      automatic_payment_methods: {
        enabled: true,
      },
      customer_email: buyerEmail || undefined,
      metadata: stringifyStripeMetadata({
        offerId,
        listingId,
        listingTitle: listing.name ?? "",
        listingBrand: listing.brand ?? "",
        buyerId: user.id,
        buyerEmail,
        sellerId: listing.owner_id ?? "",
        sellerEmail: ownerEmail,
        offerAmount,
        shippingFee,
        flow: "offer_authorization",
      }),
    });

    const offerRecord = {
      id: offerId,
      listing_id: listingId,
      product_id: listing.id ?? listingId,
      product_name: listing.name ?? "",
      product_brand: listing.brand ?? "",
      buyer_id: user.id,
      buyer_email: buyerEmail,
      buyer_name: normalizeString(user.user_metadata?.full_name ?? user.email ?? ""),
      seller_id: listing.owner_id ?? null,
      seller_email: ownerEmail,
      seller_name: normalizeString(listing.seller_snapshot?.name ?? listing.owner_name ?? ""),
      offer_amount: offerAmount,
      currency,
      status: "pending",
      created_at_ms: Date.now(),
      updated_at_ms: Date.now(),
      expires_at_ms: Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000,
      payment_authorization_status: "payment_authorized",
      payment_intent_reference: paymentIntent.id,
      authorization_reference: `AUTH-${String(Date.now()).slice(-8)}`,
      order_id: "",
      shipping_snapshot: body.shippingSnapshot ?? {},
      payment_method_snapshot: {
        ...(body.paymentMethodSnapshot ?? {}),
        id: body.paymentMethodId ?? body.paymentMethodSnapshot?.id ?? "",
        label: body.paymentMethodLabel ?? body.paymentMethodSnapshot?.label ?? "",
      },
      minimum_offer_amount: normalizeAmount(listing.minimum_offer_amount ?? listing.minimumOfferAmount ?? 0, 0) || null,
      captured_at_ms: null,
      released_at_ms: null,
      release_reason: "",
    };

    await tryUpsertIntoTable("offers", offerRecord, "id");
    await tryInsertIntoTable("notifications", {
      id: `ntf_${uuid("offer")}`,
      recipient_id: listing.owner_id ?? null,
      recipient_email: ownerEmail,
      audience: "user",
      kind: "offer",
      title: "Nuova offerta",
      body: `${listing.brand ?? ""} ${listing.name ?? ""}`.trim(),
      link: "",
      conversation_id: "",
      order_id: "",
      product_id: listingId,
      scope: "offer",
      unread: true,
      created_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    });

    await sendTransactionalEmail("offer-created", ownerEmail, {
      offerId,
      listingId,
      productTitle: `${listing.brand ?? ""} ${listing.name ?? ""}`.trim(),
      amount: `${offerAmount.toFixed(2)} ${currency}`,
      buyerEmail,
      buyerName: normalizeString(user.user_metadata?.full_name ?? user.email ?? ""),
    });

    return jsonResponse({
      ok: true,
      offer: {
        ...offerRecord,
        payment_intent_client_secret: paymentIntent.client_secret,
      },
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      },
      checkout: {
        amount: authorizedAmount,
        currency,
        shippingFee,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[create-offer-authorization] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
