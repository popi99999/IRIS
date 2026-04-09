import { normalizeAmount, normalizeEmail, normalizeString, readJsonBody, uuid } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { getRequestUser, getSupabaseAdmin, tryInsertIntoTable, tryUpsertIntoTable } from "../_shared/supabase.ts";
import { calculateCheckoutTotals, buildOrderPayload, buildTransferGroup } from "../_shared/marketplace.ts";
import { getStripe, stringifyStripeMetadata, toStripeAmount, defaultSuccessUrl } from "../_shared/stripe.ts";

type CheckoutItemInput = {
  listingId?: string;
  productId?: string;
  id?: string;
  quantity?: number;
  qty?: number;
  product?: Record<string, unknown>;
  listing?: Record<string, unknown>;
};

type CheckoutBody = {
  items?: CheckoutItemInput[];
  shipping?: Record<string, unknown>;
  source?: string;
  orderId?: string;
  orderNumber?: string;
  currency?: string;
  shippingFee?: number;
  successUrl?: string;
  cancelUrl?: string;
  allowedCountries?: string[];
};

function resolveListingId(item: CheckoutItemInput): string {
  return String(item.listingId ?? item.productId ?? item.id ?? item.listing?.id ?? item.product?.id ?? "");
}

function resolveQuantity(item: CheckoutItemInput): number {
  const value = Number(item.quantity ?? item.qty ?? 1);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

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

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const body = await readJsonBody<CheckoutBody>(request);
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    if (!requestedItems.length) {
      throw new HttpError("Missing checkout items", 400);
    }

    const listingIds = requestedItems.map(resolveListingId).filter(Boolean);
    if (!listingIds.length) {
      throw new HttpError("Missing listing ids", 400);
    }

    const admin = getSupabaseAdmin();
    const { data: listings, error } = await admin
      .from("listings")
      .select("*")
      .in("id", listingIds);
    if (error) {
      throw new HttpError("Unable to load listings", 500, error.message);
    }

    const listingsById = new Map((listings ?? []).map((listing) => [String(listing.id), listing]));
    const normalizedItems = requestedItems.map((item) => {
      const listing = listingsById.get(resolveListingId(item));
      if (!listing) {
        throw new HttpError(`Listing not found: ${resolveListingId(item)}`, 404);
      }
      const listingStatus = String(listing.listing_status ?? listing.listingStatus ?? "");
      const inventoryStatus = String(listing.inventory_status ?? listing.inventoryStatus ?? "");
      if (listingStatus !== "published" || inventoryStatus === "archived") {
        throw new HttpError(`Listing unavailable: ${normalizeString(listing.name ?? listing.brand ?? listing.id)}`, 409);
      }
      return {
        listing,
        quantity: resolveQuantity(item),
      };
    });

    const currency = normalizeString(body.currency || normalizedItems[0].listing.price_currency || normalizedItems[0].listing.currency || "EUR") || "EUR";
    const shippingFee = normalizeAmount(body.shippingFee ?? body.shipping?.shippingFee ?? body.shipping?.shipping_fee ?? 0, 0);
    const totals = calculateCheckoutTotals(normalizedItems, shippingFee);
    totals.currency = currency;

    const orderId = body.orderId ?? `ord_${uuid("checkout")}`;
    const orderNumber = body.orderNumber ?? `IR-${Date.now().toString().slice(-8)}`;
    const transferGroup = buildTransferGroup(orderId);

    const lineItems = normalizedItems.flatMap((entry) => {
      const listing = entry.listing;
      const quantity = entry.quantity;
      const price = normalizeAmount(listing.price ?? listing.original_price ?? 0, 0);
      const productLabel = [normalizeString(listing.brand), normalizeString(listing.name)]
        .filter(Boolean)
        .join(" - ") || normalizeString(listing.name ?? "IRIS");
      return [
        {
          quantity,
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: productLabel,
              description: normalizeString(listing.description ?? ""),
              metadata: stringifyStripeMetadata({
                listingId: listing.id,
                serviceMode: listing.service_mode ?? listing.serviceMode ?? "self_serve",
              }),
            },
            unit_amount: toStripeAmount(price, currency),
          },
        },
      ];
    });

    if (totals.buyerFee > 0) {
      lineItems.push(buildCheckoutLineItem("IRIS Buyer Protection", totals.buyerFee, currency));
    }
    if (totals.authFee > 0) {
      lineItems.push(buildCheckoutLineItem("IRIS Authentication", totals.authFee, currency));
    }
    if (totals.shippingFee > 0) {
      lineItems.push(buildCheckoutLineItem("Shipping", totals.shippingFee, currency));
    }

    const successUrl = body.successUrl || `${defaultSuccessUrl("/")}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${defaultSuccessUrl("/")}?checkout=cancelled`;

    const metadata = stringifyStripeMetadata({
      orderId,
      orderNumber,
      buyerId: user.id,
      buyerEmail: user.email ?? "",
      buyerName: user.user_metadata?.full_name ?? user.email ?? "",
      listingIds: listingIds.join(","),
      source: body.source ?? "cart",
      currency,
      shippingFee: String(shippingFee),
      shippingSnapshot: JSON.stringify(body.shipping ?? {}),
      itemsJson: JSON.stringify(requestedItems.map((item) => ({
        listingId: resolveListingId(item),
        quantity: resolveQuantity(item),
      }))),
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: normalizeEmail(user.email),
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      payment_intent_data: {
        metadata,
        transfer_group: transferGroup,
      },
      shipping_address_collection: {
        allowed_countries: Array.isArray(body.allowedCountries) && body.allowedCountries.length
          ? body.allowedCountries
          : ["IT"],
      },
      phone_number_collection: { enabled: true },
      allow_promotion_codes: false,
      billing_address_collection: "required",
    });

    const orderDraft = buildOrderPayload({
      orderId,
      orderNumber,
      buyer: {
        id: user.id,
        email: user.email ?? "",
        name: normalizeString(user.user_metadata?.full_name ?? user.email ?? ""),
      },
      items: normalizedItems,
      shipping: body.shipping ?? {},
      totals,
      source: body.source ?? "checkout",
      status: "pending_payment",
      paymentStatus: "pending",
      payment: {
        checkoutSessionId: session.id,
        transferGroup,
        flow: "checkout",
        stripeMode: "checkout_session",
      },
    });

    await tryUpsertIntoTable("orders", orderDraft, "id");
    await tryInsertIntoTable("notifications", {
      id: `ntf_${uuid("checkout")}`,
      recipient_id: user.id,
      recipient_email: normalizeEmail(user.email),
      audience: "user",
      kind: "system",
      title: "Checkout creato",
      body: `Sessione Stripe pronta per ${orderNumber}`,
      link: "",
      conversation_id: "",
      order_id: orderId,
      product_id: listingIds[0] ?? "",
      scope: "checkout",
      unread: true,
      created_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    });

    return jsonResponse({
      ok: true,
      sessionId: session.id,
      url: session.url,
      orderId,
      orderNumber,
      currency,
      totals,
      checkoutSession: session,
      orderDraft,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[create-checkout-session] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
