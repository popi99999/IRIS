import { normalizeAmount, normalizeEmail, normalizeString } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import {
  fetchListingById,
  fetchOfferById,
  fetchOrderById,
  getSupabaseAdmin,
  tryInsertIntoTable,
  tryUpsertIntoTable,
  upsertNotification,
} from "../_shared/supabase.ts";
import { buildOrderPayload, buildOfferOrderPayload, calculateCheckoutTotals, buildTransferGroup } from "../_shared/marketplace.ts";
import { getStripe, getWebhookSecret } from "../_shared/stripe.ts";
import { sendTransactionalEmail } from "../_shared/email.ts";

function parseJsonMaybe(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseMetadataList(value: unknown): string[] {
  const raw = String(value ?? "");
  if (!raw.trim()) return [];
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function buildShippingFromSession(session: any, fallback: Record<string, unknown>) {
  const shippingAddress = session.shipping_details?.address ?? session.customer_details?.address ?? {};
  return {
    name: normalizeString(session.shipping_details?.name ?? session.customer_details?.name ?? fallback.name ?? ""),
    address: normalizeString([
      shippingAddress.line1,
      shippingAddress.line2,
    ].filter(Boolean).join(", ") || fallback.address || ""),
    city: normalizeString(shippingAddress.city ?? fallback.city ?? ""),
    country: normalizeString(shippingAddress.country ?? fallback.country ?? ""),
    phone: normalizeString(session.customer_details?.phone ?? fallback.phone ?? ""),
    note: normalizeString(fallback.note ?? ""),
    carrier: normalizeString(fallback.carrier ?? ""),
    tracking_number: normalizeString(fallback.tracking_number ?? ""),
  };
}

async function persistOrderItemsIfAvailable(orderPayload: Record<string, unknown>) {
  const items = Array.isArray(orderPayload.items) ? orderPayload.items : [];
  if (!items.length) return;
  const rows = items.map((item: any) => ({
    id: `oi_${crypto.randomUUID()}`,
    order_id: orderPayload.id,
    listing_id: item.listingId ?? item.productId ?? "",
    seller_id: item.sellerId ?? null,
    seller_email: item.sellerEmail ?? "",
    quantity: item.quantity ?? 1,
    unit_amount: item.unitAmount ?? 0,
    buyer_fee_amount: item.buyerFeeAmount ?? 0,
    seller_fee_amount: item.sellerFeeAmount ?? 0,
    authentication_fee_amount: item.authenticationFeeAmount ?? 0,
    line_total_amount: item.lineTotalAmount ?? 0,
    service_mode: item.serviceMode ?? "self_serve",
    line_status: item.lineStatus ?? "paid",
  }));
  await tryInsertIntoTable("order_items", rows);
}

async function persistPaymentRecordIfAvailable(record: Record<string, unknown>) {
  await tryUpsertIntoTable("payments", record, "provider_payment_intent_id");
}

async function updateListingSold(listingId: string, orderId: string) {
  if (!listingId) return;
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
    console.warn("[stripe-webhook] unable to update listing status", error);
  }
}

async function handleOfferCheckoutCompleted(session: any) {
  const metadata = session.metadata || {};
  const offerId = String(metadata.offerId ?? metadata.offer_id ?? "");
  const listingId = String(metadata.listingId ?? metadata.listing_id ?? "");
  if (!offerId || !listingId) {
    throw new HttpError("Missing offer metadata", 400);
  }

  const listing = await fetchListingById(listingId);
  if (!listing) {
    throw new HttpError("Listing not found", 404);
  }

  const offerAmount = normalizeAmount(metadata.offerAmount ?? metadata.offer_amount ?? 0, 0);
  const authorizedAmount = normalizeAmount(metadata.authorizedAmount ?? metadata.authorized_amount ?? session.amount_total ?? 0, 0);
  const currency = String(metadata.currency ?? session.currency ?? "EUR").toUpperCase();
  const buyerEmail = normalizeEmail(metadata.buyerEmail ?? session.customer_details?.email ?? session.customer_email ?? "");
  const buyerName = normalizeString(metadata.buyerName ?? session.customer_details?.name ?? "");
  const sellerEmail = normalizeEmail(metadata.sellerEmail ?? listing.owner_email ?? listing.ownerEmail ?? "");
  const existing = await fetchOfferById(offerId);

  const offerRecord = {
    ...(existing ?? {}),
    id: offerId,
    listing_id: listingId,
    product_id: listing.id ?? listingId,
    product_name: listing.name ?? "",
    product_brand: listing.brand ?? "",
    buyer_id: String(metadata.buyerId ?? metadata.buyer_id ?? existing?.buyer_id ?? ""),
    buyer_email: buyerEmail,
    buyer_name: buyerName,
    seller_id: listing.owner_id ?? existing?.seller_id ?? null,
    seller_email: sellerEmail,
    seller_name: normalizeString(metadata.sellerName ?? listing.seller_snapshot?.name ?? listing.owner_name ?? ""),
    offer_amount: offerAmount,
    currency,
    status: "pending",
    created_at_ms: Number(existing?.created_at_ms ?? Date.now()),
    updated_at_ms: Date.now(),
    expires_at_ms: Number(existing?.expires_at_ms ?? Date.now() + 24 * 60 * 60 * 1000),
    payment_authorization_status: "payment_authorized",
    payment_intent_reference: String(session.payment_intent ?? existing?.payment_intent_reference ?? ""),
    authorization_reference: normalizeString(existing?.authorization_reference ?? `AUTH-${String(Date.now()).slice(-8)}`),
    checkout_session_id: String(session.id ?? ""),
    authorization_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    order_id: String(existing?.order_id ?? ""),
    shipping_snapshot: parseJsonMaybe(metadata.shippingSnapshot ?? metadata.shipping_snapshot) ?? {},
    payment_method_snapshot: parseJsonMaybe(metadata.paymentMethodSnapshot ?? metadata.payment_method_snapshot) ?? {},
    minimum_offer_amount: normalizeAmount(metadata.minimumOfferAmount ?? metadata.minimum_offer_amount ?? 0, 0) || null,
    captured_at_ms: existing?.captured_at_ms ?? null,
    released_at_ms: existing?.released_at_ms ?? null,
    release_reason: normalizeString(existing?.release_reason ?? ""),
  };

  await tryUpsertIntoTable("offers", offerRecord, "id");
  await persistPaymentRecordIfAvailable({
    id: `pay_${crypto.randomUUID()}`,
    order_id: null,
    offer_id: offerId,
    provider: "stripe",
    provider_payment_intent_id: String(session.payment_intent ?? ""),
    provider_checkout_session_id: String(session.id ?? ""),
    provider_charge_id: "",
    provider_transfer_group: "",
    status: "authorized",
    amount: authorizedAmount,
    buyer_fee_amount: normalizeAmount(metadata.buyerFeeAmount ?? metadata.buyer_fee_amount ?? 0, 0),
    seller_fee_amount: normalizeAmount(metadata.sellerFeeAmount ?? metadata.seller_fee_amount ?? 0, 0),
    authentication_fee_amount: normalizeAmount(metadata.authenticationFeeAmount ?? metadata.authentication_fee_amount ?? 0, 0),
    fee_amount: normalizeAmount(metadata.buyerFeeAmount ?? metadata.buyer_fee_amount ?? 0, 0) + normalizeAmount(metadata.authenticationFeeAmount ?? metadata.authentication_fee_amount ?? 0, 0),
    currency,
    receipt_number: "",
    payout_account_id: "",
    payout_transfer_ids: [],
    metadata,
    raw_payload: session,
    authorized_at: new Date().toISOString(),
  });

  await upsertNotification({
    recipient_id: listing.owner_id ?? null,
    recipient_email: sellerEmail,
    audience: "user",
    kind: "offer",
    title: "Nuova offerta",
    body: `${listing.brand ?? ""} ${listing.name ?? ""}`.trim(),
    order_id: "",
    product_id: listingId,
    scope: "offer",
    unread: true,
  });
  await upsertNotification({
    recipient_id: offerRecord.buyer_id || null,
    recipient_email: buyerEmail,
    audience: "user",
    kind: "offer",
    title: "Offerta autorizzata",
    body: `${offerAmount.toFixed(2)} ${currency}`,
    order_id: "",
    product_id: listingId,
    scope: "offer",
    unread: true,
  });

  await sendTransactionalEmail("offer-created", sellerEmail, {
    offerId,
    listingId,
    productTitle: `${listing.brand ?? ""} ${listing.name ?? ""}`.trim(),
    amount: `${offerAmount.toFixed(2)} ${currency}`,
    buyerEmail,
    buyerName,
  });
}

async function handleCheckoutCompleted(session: any) {
  const metadata = session.metadata || {};
  if (String(metadata.flow ?? "") === "offer_authorization") {
    await handleOfferCheckoutCompleted(session);
    return;
  }
  const orderId = String(metadata.orderId ?? metadata.order_id ?? "");
  if (!orderId) {
    throw new HttpError("Missing order id in checkout metadata", 400);
  }
  const orderNumber = String(metadata.orderNumber ?? metadata.order_number ?? "");
  const listingIds = parseMetadataList(metadata.listingIds ?? metadata.listing_ids);
  const itemsFromMetadata = parseJsonMaybe(metadata.itemsJson ?? metadata.items_json) ?? [];
  const shippingSnapshot = parseJsonMaybe(metadata.shippingSnapshot ?? metadata.shipping_snapshot) ?? {};
  const shippingFee = normalizeAmount(metadata.shippingFee ?? metadata.shipping_fee ?? session.amount_shipping ?? 0, 0);
  const currency = String(metadata.currency ?? session.currency ?? "EUR").toUpperCase();
  const buyerEmail = normalizeEmail(metadata.buyerEmail ?? session.customer_details?.email ?? session.customer_email ?? "");
  const buyerName = normalizeString(metadata.buyerName ?? session.customer_details?.name ?? "");
  const buyerId = String(metadata.buyerId ?? metadata.buyer_id ?? "");

  const listingsQuery = await getSupabaseAdmin()
    .from("listings")
    .select("*")
    .in("id", listingIds.length ? listingIds : itemsFromMetadata.map((item: any) => String(item.listingId ?? item.productId ?? "")));
  const listings = listingsQuery.data ?? [];
  const listingsById = new Map(listings.map((listing) => [String(listing.id), listing]));

  const normalizedItems = (itemsFromMetadata.length ? itemsFromMetadata : (listingIds.map((listingId) => ({ listingId, quantity: 1 })))).map((item: any) => {
    const listing = listingsById.get(String(item.listingId ?? item.productId ?? ""));
    if (!listing) {
      throw new HttpError(`Listing not found: ${item.listingId ?? item.productId ?? ""}`, 404);
    }
    return {
      listing,
      quantity: Number(item.quantity ?? item.qty ?? 1) > 0 ? Math.floor(Number(item.quantity ?? item.qty ?? 1)) : 1,
    };
  });

  const totals = calculateCheckoutTotals(normalizedItems, shippingFee);
  totals.currency = currency;

  const orderPayload = buildOrderPayload({
    orderId,
    orderNumber: orderNumber || undefined,
    buyer: {
      id: buyerId || undefined,
      email: buyerEmail,
      name: buyerName,
    },
    items: normalizedItems,
    shipping: buildShippingFromSession(session, shippingSnapshot as Record<string, unknown>),
    totals,
    source: String(metadata.source ?? "checkout"),
    status: "paid",
    paymentStatus: "captured",
    payment: {
      checkoutSessionId: session.id,
      paymentIntentId: String(session.payment_intent ?? ""),
      chargeId: String(session.payment_intent?.charges?.data?.[0]?.id ?? ""),
      transferGroup: String(metadata.transferGroup ?? metadata.transfer_group ?? buildTransferGroup(orderId)),
      stripeEventId: session.id,
      sessionStatus: session.status,
      amountTotal: session.amount_total ?? 0,
      amountSubtotal: session.amount_subtotal ?? 0,
    },
  });
  orderPayload.payment.transferGroup = String(metadata.transferGroup ?? metadata.transfer_group ?? buildTransferGroup(orderId));

  const existing = await fetchOrderById(orderId);
  await tryUpsertIntoTable("orders", orderPayload, "id");
  await persistOrderItemsIfAvailable(orderPayload);
  await persistPaymentRecordIfAvailable({
    id: `pay_${crypto.randomUUID()}`,
    order_id: orderId,
    offer_id: null,
    provider: "stripe",
    provider_payment_intent_id: String(session.payment_intent ?? ""),
    provider_checkout_session_id: String(session.id ?? ""),
    provider_charge_id: String(session.payment_intent?.charges?.data?.[0]?.id ?? ""),
    provider_transfer_group: String(metadata.transferGroup ?? metadata.transfer_group ?? ""),
    status: "captured",
    amount: totals.total,
    buyer_fee_amount: totals.buyerFee,
    seller_fee_amount: totals.sellerFee,
    authentication_fee_amount: totals.authFee,
    fee_amount: totals.buyerFee + totals.authFee,
    currency,
    receipt_number: String(session.payment_intent?.charges?.data?.[0]?.receipt_number ?? ""),
    payout_account_id: "",
    payout_transfer_ids: [],
    metadata: metadata,
    raw_payload: session,
    captured_at: new Date().toISOString(),
  });

  for (const item of normalizedItems) {
    const listing = item.listing as Record<string, unknown>;
    await updateListingSold(String(listing.id ?? ""), orderId);
  }

  if (!existing || String(existing.status ?? "") !== "paid") {
    const buyerPhone = normalizeString((orderPayload.shipping as any)?.phone ?? "");
    await upsertNotification({
      recipient_id: buyerId || null,
      recipient_email: buyerEmail,
      audience: "user",
      kind: "order",
      title: "Ordine confermato",
      body: `${orderPayload.number} · ${orderPayload.total}`,
      order_id: orderId,
      product_id: listingIds[0] ?? "",
      scope: "checkout",
      unread: true,
    });
    for (const sellerEmail of orderPayload.seller_emails || []) {
      await upsertNotification({
        recipient_id: null,
        recipient_email: sellerEmail,
        audience: "user",
        kind: "sale",
        title: "Nuovo ordine",
        body: `${orderPayload.number} · ${orderPayload.total}${buyerPhone ? ` · ${buyerPhone}` : ""}`,
        order_id: orderId,
        product_id: listingIds[0] ?? "",
        scope: "checkout",
        unread: true,
      });
      await sendTransactionalEmail("generic", normalizeEmail(sellerEmail), {
        orderId,
        orderNumber: orderPayload.number,
        body: `Hai ricevuto un nuovo ordine per ${normalizedItems.map((entry) => `${entry.listing.brand ?? ""} ${entry.listing.name ?? ""}`.trim()).join(", ")}.${buyerPhone ? ` Telefono buyer: ${buyerPhone}.` : ""}`,
      }, {
        subject: `IRIS - Articolo venduto ${orderPayload.number}`,
      });
    }
    await sendTransactionalEmail("checkout-confirmation", buyerEmail, {
      orderId,
      orderNumber: orderPayload.number,
      productTitle: normalizedItems.map((entry) => `${entry.listing.brand ?? ""} ${entry.listing.name ?? ""}`.trim()).join(", "),
      amount: `${orderPayload.total.toFixed(2)} ${currency}`,
    });
  }
}

async function handlePaymentIntentCaptured(intent: any) {
  const metadata = intent.metadata || {};
  const offerId = String(metadata.offerId ?? metadata.offer_id ?? "");
  const orderId = String(metadata.orderId ?? metadata.order_id ?? "");
  if (offerId) {
    const offer = await fetchOfferById(offerId);
    if (offer) {
      const listing = await fetchListingById(String(offer.listing_id ?? offer.listingId ?? metadata.listingId ?? ""));
      const existingOrderId = String(offer.order_id ?? offer.orderId ?? "");
      const paidOffer = {
        ...offer,
        status: "paid",
        payment_authorization_status: "paid",
        captured_at_ms: Date.now(),
        updated_at_ms: Date.now(),
      };
      let orderPayload = null;
      if (listing) {
        const buyerPhone = normalizeString(((offer.shipping_snapshot ?? offer.shippingSnapshot ?? {}) as Record<string, unknown>).phone ?? "");
        if (existingOrderId) {
          const existingOrder = await fetchOrderById(existingOrderId);
          if (existingOrder) {
            orderPayload = {
              ...existingOrder,
              payment: {
                ...(existingOrder.payment ?? {}),
                paymentIntentId: String(intent.id ?? ""),
                paymentIntentStatus: String(intent.status ?? ""),
                chargeId: String(intent.charges?.data?.[0]?.id ?? ""),
                transferGroup: String(metadata.transferGroup ?? metadata.transfer_group ?? existingOrder.payment?.transferGroup ?? buildTransferGroup(existingOrderId)),
                status: "captured",
                capturedAt: new Date().toISOString(),
              },
              status: "paid",
            };
            await tryUpsertIntoTable("orders", orderPayload, "id");
          }
        } else {
          orderPayload = buildOfferOrderPayload({
            buyer: {
              id: String(offer.buyer_id ?? ""),
              email: normalizeEmail(offer.buyer_email ?? ""),
              name: normalizeString(offer.buyer_name ?? ""),
            },
            offer,
            listing,
            payment: {
              paymentIntentId: String(intent.id ?? ""),
              paymentIntentStatus: String(intent.status ?? ""),
              chargeId: String(intent.charges?.data?.[0]?.id ?? ""),
              transferGroup: String(metadata.transferGroup ?? metadata.transfer_group ?? buildTransferGroup(String(offerId))),
            },
          });
          orderPayload.payment.transferGroup = String(metadata.transferGroup ?? metadata.transfer_group ?? buildTransferGroup(orderPayload.id));
          await tryUpsertIntoTable("orders", orderPayload, "id");
          await persistOrderItemsIfAvailable(orderPayload);
          await updateListingSold(String(listing.id ?? ""), orderPayload.id);
        }
        if (orderPayload && !existingOrderId) {
          await upsertNotification({
            recipient_id: null,
            recipient_email: normalizeEmail(offer.seller_email ?? ""),
            audience: "user",
            kind: "sale",
            title: "Offerta accettata",
            body: `${orderPayload.number} · ${normalizeAmount(offer.offer_amount ?? offer.offerAmount ?? 0, 0).toFixed(2)} ${String(orderPayload.payment.currency ?? "EUR")}${buyerPhone ? ` · ${buyerPhone}` : ""}`,
            order_id: orderPayload.id,
            product_id: String(listing.id ?? ""),
            scope: "offer",
            unread: true,
          });
          await sendTransactionalEmail("generic", normalizeEmail(offer.seller_email ?? ""), {
            orderId: orderPayload.id,
            orderNumber: orderPayload.number,
            body: `L'offerta per ${offer.product_brand ?? offer.productBrand ?? ""} ${offer.product_name ?? offer.productName ?? ""} è stata pagata.${buyerPhone ? ` Telefono buyer: ${buyerPhone}.` : ""}`,
          }, {
            subject: `IRIS - Offerta pagata ${orderPayload.number}`,
          });
          await sendTransactionalEmail("offer-accepted", normalizeEmail(offer.buyer_email ?? ""), {
            offerId,
            orderId: orderPayload.id,
            orderNumber: orderPayload.number,
            listingId: listing.id,
            productTitle: `${offer.product_brand ?? offer.productBrand ?? ""} ${offer.product_name ?? offer.productName ?? ""}`.trim(),
            amount: `${normalizeAmount(offer.offer_amount ?? offer.offerAmount ?? 0, 0).toFixed(2)} ${String(orderPayload.payment.currency ?? "EUR")}`,
            sellerEmail: normalizeEmail(offer.seller_email ?? ""),
          });
        }
      }
      await tryUpsertIntoTable("offers", {
        ...paidOffer,
        order_id: orderPayload?.id ?? existingOrderId ?? String(offer.order_id ?? ""),
      }, "id");
    }
    return;
  }

  if (orderId) {
    const existing = await fetchOrderById(orderId);
    if (!existing) return;
    const payment = {
      ...(existing.payment ?? {}),
      paymentIntentId: String(intent.id ?? ""),
      paymentIntentStatus: String(intent.status ?? ""),
      chargeId: String(intent.charges?.data?.[0]?.id ?? ""),
      transferGroup: String(metadata.transferGroup ?? metadata.transfer_group ?? existing.payment?.transferGroup ?? ""),
      status: "captured",
      capturedAt: new Date().toISOString(),
    };
    const orderPayload = {
      ...existing,
      payment,
      status: "paid",
    };
    await tryUpsertIntoTable("orders", orderPayload, "id");
  }
}

async function handlePaymentIntentClosed(intent: any, status: string) {
  const metadata = intent.metadata || {};
  const offerId = String(metadata.offerId ?? metadata.offer_id ?? "");
  const orderId = String(metadata.orderId ?? metadata.order_id ?? "");
  if (offerId) {
    const offer = await fetchOfferById(offerId);
    if (!offer) return;
    const updatedOffer = {
      ...offer,
      status: "declined",
      payment_authorization_status: status === "canceled" ? "authorization_released" : "payment_failed",
      released_at_ms: Date.now(),
      release_reason: status,
      updated_at_ms: Date.now(),
    };
    await tryUpsertIntoTable("offers", updatedOffer, "id");
    return;
  }
  if (orderId) {
    const order = await fetchOrderById(orderId);
    if (!order) return;
    const payment = {
      ...(order.payment ?? {}),
      paymentIntentId: String(intent.id ?? ""),
      paymentIntentStatus: status,
      status,
      canceledAt: status === "canceled" ? new Date().toISOString() : undefined,
    };
    await tryUpsertIntoTable("orders", {
      ...order,
      payment,
      status,
    }, "id");
  }
}

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const signature = request.headers.get("stripe-signature") || request.headers.get("Stripe-Signature");
    if (!signature) {
      throw new HttpError("Missing Stripe signature", 400);
    }
    const rawBody = await request.text();
    const event = getStripe().webhooks.constructEvent(rawBody, signature, getWebhookSecret());

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await handlePaymentIntentClosed({
          id: event.data.object.payment_intent,
          metadata: event.data.object.metadata ?? {},
        }, "canceled");
        break;
      case "payment_intent.captured":
        await handlePaymentIntentCaptured(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentClosed(event.data.object, "payment_failed");
        break;
      case "payment_intent.canceled":
        await handlePaymentIntentClosed(event.data.object, "canceled");
        break;
      default:
        break;
    }

    return jsonResponse({ ok: true, received: true, event: event.type });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[stripe-webhook] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
