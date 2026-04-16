import { normalizeAmount, normalizeEmail, normalizeString, readJsonBody, uuid } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import {
  fetchListingById,
  getRequestUser,
  getSupabaseAdmin,
} from "../_shared/supabase.ts";
import { calculateLineFees, OFFER_EXPIRY_HOURS } from "../_shared/marketplace.ts";
import { appendUrlParams, defaultSuccessUrl, getStripe, stringifyStripeMetadata, toStripeAmount, sanitizeReturnUrl } from "../_shared/stripe.ts";

type OfferAuthorizationBody = {
  listingId?: string;
  offerAmount?: number;
  authorizedAmount?: number;
  shippingFee?: number;
  currency?: string;
  locale?: string;
  shippingSnapshot?: Record<string, unknown>;
  paymentMethodSnapshot?: Record<string, unknown>;
  paymentMethodId?: string;
  paymentMethodLabel?: string;
  returnUrl?: string;
};

function buildCheckoutLineItem(label: string, amount: number, currency: string) {
  return {
    quantity: 1,
    price_data: {
      currency: String(currency).toLowerCase(),
      product_data: {
        name: label,
      },
      unit_amount: toStripeAmount(amount, currency),
    },
  };
}

function buildOfferAuthorizationIdempotencyKey(offerId: string) {
  return `iris_offer_auth_${offerId}`;
}

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
    const inventoryStatus = String(listing.inventory_status ?? listing.inventoryStatus ?? "");
    if (inventoryStatus === "archived") {
      throw new HttpError("Listing already archived", 409);
    }
    if (inventoryStatus === "sold" || inventoryStatus === "offer_processing") {
      throw new HttpError("Listing is no longer available", 409);
    }
    const minimumOfferAmount = normalizeAmount(listing.minimum_offer_amount ?? listing.minimumOfferAmount ?? 0, 0);
    if (minimumOfferAmount > 0 && offerAmount < minimumOfferAmount) {
      throw new HttpError("Offer is below the minimum offer amount", 409, {
        minimumOfferAmount,
      });
    }

    const ownerEmail = normalizeEmail(listing.owner_email ?? listing.ownerEmail ?? "");
    const buyerEmail = normalizeEmail(user.email);
    if (buyerEmail && buyerEmail === ownerEmail) {
      throw new HttpError("Cannot offer on your own listing", 409);
    }

    const admin = getSupabaseAdmin();
    const { data: existingOffers, error: existingError } = await admin
      .from("offers")
      .select("*")
      .eq("listing_id", listingId)
      .eq("buyer_email", buyerEmail)
      .in("status", ["awaiting_authorization", "pending", "processing", "paid"]);
    if (existingError) {
      throw new HttpError("Unable to validate existing offers", 500, existingError.message);
    }
    const existingOffer = Array.isArray(existingOffers) && existingOffers.length ? existingOffers[0] : null;
    if (existingOffer) {
      const existingStatus = String(existingOffer.status ?? "");
      const existingSessionId = String(existingOffer.checkout_session_id ?? "");
      const expiresAt = existingOffer.authorization_expires_at
        ? new Date(String(existingOffer.authorization_expires_at)).getTime()
        : Number(existingOffer.expires_at_ms ?? 0);
      if (existingStatus === "awaiting_authorization" && existingSessionId && expiresAt > Date.now()) {
        const existingSession = await getStripe().checkout.sessions.retrieve(existingSessionId);
        return jsonResponse({
          ok: true,
          offerId: String(existingOffer.id ?? ""),
          sessionId: existingSession.id,
          checkoutUrl: existingSession.url,
          currency: String(existingOffer.currency ?? "EUR").toUpperCase(),
          authorizedAmount: normalizeAmount(body.authorizedAmount, offerAmount),
          expiresAt,
        });
      }
      if (["pending", "processing", "paid"].includes(existingStatus)) {
        throw new HttpError("You already have an active offer on this listing", 409);
      }
      if (existingStatus === "awaiting_authorization") {
        await admin
          .from("offers")
          .update({
            status: "declined",
            payment_authorization_status: "authorization_released",
            released_at_ms: Date.now(),
            release_reason: "authorization_expired",
            updated_at_ms: Date.now(),
          })
          .eq("id", String(existingOffer.id ?? ""));
      }
    }

    const lineFees = calculateLineFees(listing, 1);
    const shippingFee = normalizeAmount(body.shippingFee ?? body.shippingSnapshot?.shippingFee ?? body.shippingSnapshot?.shipping_fee ?? 0, 0);
    const authorizedAmount = normalizeAmount(
      body.authorizedAmount,
      offerAmount + shippingFee + lineFees.buyerFee + lineFees.authFee,
    );
    const currency = String(body.currency ?? lineFees.currency ?? listing.price_currency ?? listing.currency ?? "EUR").toUpperCase();
    const offerId = `off_${uuid("iris")}`;
    const expiresAt = Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000;

    const metadata = stringifyStripeMetadata({
      flow: "offer_authorization",
      offerId,
      listingId,
      listingTitle: listing.name ?? "",
      listingBrand: listing.brand ?? "",
      buyerId: user.id,
      buyerEmail,
      buyerName: normalizeString(user.user_metadata?.full_name ?? user.email ?? ""),
      sellerId: listing.owner_id ?? "",
      sellerEmail: ownerEmail,
      sellerName: normalizeString(listing.seller_snapshot?.name ?? listing.owner_name ?? ""),
      offerAmount,
      authorizedAmount,
      minimumOfferAmount,
      shippingFee,
      currency,
      buyerFeeAmount: lineFees.buyerFee,
      sellerFeeAmount: lineFees.sellerFee,
      authenticationFeeAmount: lineFees.authFee,
      paymentMethodId: body.paymentMethodId ?? "",
      paymentMethodLabel: body.paymentMethodLabel ?? "",
      shippingSnapshot: JSON.stringify(body.shippingSnapshot ?? {}),
      paymentMethodSnapshot: JSON.stringify({
        ...(body.paymentMethodSnapshot ?? {}),
        id: body.paymentMethodId ?? body.paymentMethodSnapshot?.id ?? "",
        label: body.paymentMethodLabel ?? body.paymentMethodSnapshot?.label ?? "",
      }),
    });

    try {
      const { error: provisionalOfferError } = await admin
        .from("offers")
        .insert({
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
          status: "awaiting_authorization",
          created_at_ms: Date.now(),
          updated_at_ms: Date.now(),
          expires_at_ms: expiresAt,
          payment_authorization_status: "authorization_pending",
          payment_intent_reference: "",
          authorization_reference: `AUTH-${offerId.slice(-8).toUpperCase()}`,
          checkout_session_id: "",
          authorization_expires_at: new Date(expiresAt).toISOString(),
          order_id: "",
          shipping_snapshot: body.shippingSnapshot ?? {},
          payment_method_snapshot: {
            ...(body.paymentMethodSnapshot ?? {}),
            id: body.paymentMethodId ?? body.paymentMethodSnapshot?.id ?? "",
            label: body.paymentMethodLabel ?? body.paymentMethodSnapshot?.label ?? "",
          },
          minimum_offer_amount: minimumOfferAmount || null,
          release_reason: "",
        });
      if (provisionalOfferError) {
        throw provisionalOfferError;
      }
    } catch (error: any) {
      if (error?.code === "23505") {
        const { data: conflictingOffer } = await admin
          .from("offers")
          .select("*")
          .eq("listing_id", listingId)
          .eq("buyer_email", buyerEmail)
          .in("status", ["awaiting_authorization", "pending", "processing"])
          .order("created_at_ms", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (conflictingOffer && String(conflictingOffer.status ?? "") === "awaiting_authorization" && String(conflictingOffer.checkout_session_id ?? "")) {
          const existingSession = await getStripe().checkout.sessions.retrieve(String(conflictingOffer.checkout_session_id ?? ""));
          return jsonResponse({
            ok: true,
            offerId: String(conflictingOffer.id ?? ""),
            sessionId: existingSession.id,
            checkoutUrl: existingSession.url,
            currency: String(conflictingOffer.currency ?? currency).toUpperCase(),
            authorizedAmount,
            expiresAt: conflictingOffer.authorization_expires_at
              ? new Date(String(conflictingOffer.authorization_expires_at)).getTime()
              : Number(conflictingOffer.expires_at_ms ?? expiresAt),
          });
        }
        throw new HttpError("You already have an active offer on this listing", 409);
      }
      throw error;
    }

    const lineItems = [
      buildCheckoutLineItem(
        [normalizeString(listing.brand), normalizeString(listing.name)].filter(Boolean).join(" - ") || "IRIS Offer",
        offerAmount,
        currency,
      ),
    ];
    if (lineFees.buyerFee > 0) {
      lineItems.push(buildCheckoutLineItem("IRIS Buyer Protection", lineFees.buyerFee, currency));
    }
    if (lineFees.authFee > 0) {
      lineItems.push(buildCheckoutLineItem("IRIS Authentication", lineFees.authFee, currency));
    }
    if (shippingFee > 0) {
      lineItems.push(buildCheckoutLineItem("Shipping", shippingFee, currency));
    }

    const baseReturnUrl = sanitizeReturnUrl(body.returnUrl, "/");
    const successUrl = appendUrlParams(baseReturnUrl, {
      stripe_flow: "offer",
      stripe_status: "success",
      offer_id: offerId,
      session_id: "{CHECKOUT_SESSION_ID}",
    });
    const cancelUrl = appendUrlParams(baseReturnUrl, {
      stripe_flow: "offer",
      stripe_status: "cancel",
      offer_id: offerId,
    });

    let session;
    try {
      session = await getStripe().checkout.sessions.create({
        mode: "payment",
        customer_email: buyerEmail || undefined,
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        payment_intent_data: {
          capture_method: "manual",
          metadata,
        },
        billing_address_collection: "required",
        phone_number_collection: { enabled: true },
        shipping_address_collection: {
          allowed_countries: ["IT"],
        },
        locale: typeof body.locale === "string" && body.locale.toLowerCase().startsWith("en") ? "en-GB" : "it",
      }, {
        idempotencyKey: buildOfferAuthorizationIdempotencyKey(offerId),
      });
    } catch (error) {
      await admin
        .from("offers")
        .update({
          status: "declined",
          payment_authorization_status: "authorization_failed",
          release_reason: "checkout_session_create_failed",
          released_at_ms: Date.now(),
          updated_at_ms: Date.now(),
        })
        .eq("id", offerId);
      throw error;
    }

    await admin
      .from("offers")
      .update({
        checkout_session_id: String(session.id ?? ""),
        authorization_expires_at: new Date(expiresAt).toISOString(),
        updated_at_ms: Date.now(),
      })
      .eq("id", offerId);

    return jsonResponse({
      ok: true,
      offerId,
      sessionId: session.id,
      checkoutUrl: session.url,
      currency,
      authorizedAmount,
      expiresAt,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[create-offer-authorization] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
