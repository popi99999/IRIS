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

const ORDER_STATUS_RANK: Record<string, number> = {
  pending: 0,
  pending_payment: 1,
  pending_capture: 2,
  payment_review: 3,
  paid: 4,
  awaiting_shipment: 5,
  shipped: 6,
  in_authentication: 7,
  dispatched_to_buyer: 8,
  delivered: 9,
  buyer_confirmed_delivery: 10,
  completed: 11,
  partially_refunded: 12,
  refunded: 13,
  cancelled: 13,
  payment_failed: 13,
};

const PAYMENT_STATUS_RANK: Record<string, number> = {
  pending: 0,
  requires_action: 0,
  authorized: 1,
  authorization_pending: 1,
  pending_capture: 2,
  processing: 2,
  captured: 3,
  paid: 3,
  partially_refunded: 4,
  refunded: 5,
  reversed: 5,
};

function getOrderStatusRank(status: unknown) {
  return ORDER_STATUS_RANK[String(status ?? "").toLowerCase()] ?? -1;
}

function shouldPromoteOrderStatus(currentStatus: unknown, targetStatus: unknown) {
  return getOrderStatusRank(targetStatus) >= getOrderStatusRank(currentStatus);
}

function canTransitionOrderToFailure(status: unknown) {
  return ["pending", "pending_payment", "pending_capture", "payment_review"].includes(String(status ?? "").toLowerCase());
}

function getPaymentStatusRank(status: unknown) {
  return PAYMENT_STATUS_RANK[String(status ?? "").toLowerCase()] ?? -1;
}

function shouldPromotePaymentStatus(currentStatus: unknown, targetStatus: unknown) {
  const normalizedCurrent = String(currentStatus ?? "").toLowerCase();
  const normalizedTarget = String(targetStatus ?? "").toLowerCase();
  if (!normalizedTarget) return false;
  if (["refunded", "partially_refunded", "reversed"].includes(normalizedCurrent) && normalizedTarget === "captured") {
    return false;
  }
  if (["failed", "payment_failed", "cancelled", "canceled"].includes(normalizedTarget)) {
    return !["captured", "paid", "partially_refunded", "refunded", "reversed"].includes(normalizedCurrent);
  }
  return getPaymentStatusRank(normalizedTarget) >= getPaymentStatusRank(normalizedCurrent);
}

function normalizeFailureOrderStatus(status: string) {
  return status === "payment_failed" ? "payment_failed" : "cancelled";
}

function normalizeFailurePaymentStatus(status: string) {
  return status === "payment_failed" ? "failed" : "cancelled";
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
    zip: normalizeString(shippingAddress.postal_code ?? fallback.zip ?? fallback.postcode ?? fallback.postalCode ?? fallback.shipping_zip ?? ""),
    province: normalizeString(shippingAddress.state ?? fallback.province ?? fallback.state ?? fallback.county ?? fallback.shipping_province ?? ""),
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
  const existingStatus = String(existing?.status ?? "");
  if (existing && !["awaiting_authorization", "pending"].includes(existingStatus)) {
    return;
  }

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
  const mergedOrder = existing
    ? {
        ...existing,
        ...orderPayload,
        status: shouldPromoteOrderStatus(existing.status, orderPayload.status) ? orderPayload.status : String(existing.status ?? ""),
        payment_status: shouldPromotePaymentStatus(existing.payment_status ?? existing.payment?.status, "captured")
          ? "captured"
          : String(existing.payment_status ?? existing.payment?.status ?? ""),
        payment: {
          ...(existing.payment ?? {}),
          ...(orderPayload.payment ?? {}),
          status: "captured",
        },
      }
    : orderPayload;
  await tryUpsertIntoTable("orders", mergedOrder, "id");
  await persistOrderItemsIfAvailable(mergedOrder);
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

  if (!existing || !["paid", "awaiting_shipment", "shipped", "in_authentication", "dispatched_to_buyer", "delivered", "buyer_confirmed_delivery", "completed"].includes(String(existing.status ?? ""))) {
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
      const productList = normalizedItems.map((entry) => `${entry.listing.brand ?? ""} ${entry.listing.name ?? ""}`.trim()).join(", ");
      const sellerNet = orderPayload.payment?.sellerNet ? ` · Netto: €${Number(orderPayload.payment.sellerNet).toFixed(2)}` : "";
      await sendTransactionalEmail("generic", normalizeEmail(sellerEmail), {
        orderId,
        orderNumber: orderPayload.number,
        body: `🎉 Hai venduto: ${productList}\n\nOrdine: ${orderPayload.number}\nImporto totale: €${Number(orderPayload.total ?? 0).toFixed(2)}${sellerNet}\n${buyerPhone ? `Telefono acquirente: ${buyerPhone}\n` : ""}\nPreparate il pacco e spedite entro 3 giorni lavorativi. Troverete i dettagli di spedizione nel vostro profilo IRIS.`,
      }, {
        subject: `🛍️ Venduto! ${productList} — ${orderPayload.number}`,
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
      if (["declined", "refunded"].includes(String(offer.status ?? ""))) {
        return;
      }
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
              payment_status: shouldPromotePaymentStatus(existingOrder.payment_status ?? existingOrder.payment?.status, "captured")
                ? "captured"
                : String(existingOrder.payment_status ?? existingOrder.payment?.status ?? ""),
              payment: {
                ...(existingOrder.payment ?? {}),
                paymentIntentId: String(intent.id ?? ""),
                paymentIntentStatus: String(intent.status ?? ""),
                chargeId: String(intent.charges?.data?.[0]?.id ?? ""),
                transferGroup: String(metadata.transferGroup ?? metadata.transfer_group ?? existingOrder.payment?.transferGroup ?? buildTransferGroup(existingOrderId)),
                status: "captured",
                capturedAt: new Date().toISOString(),
              },
              status: shouldPromoteOrderStatus(existingOrder.status, "paid") ? "paid" : String(existingOrder.status ?? ""),
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
    if (!shouldPromoteOrderStatus(existing.status, "paid")) {
      return;
    }
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
      payment_status: shouldPromotePaymentStatus(existing.payment_status ?? existing.payment?.status, "captured")
        ? "captured"
        : String(existing.payment_status ?? existing.payment?.status ?? ""),
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
    if (!["awaiting_authorization", "pending", "processing"].includes(String(offer.status ?? ""))) {
      return;
    }
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
    if (!canTransitionOrderToFailure(order.status)) {
      return;
    }
    const payment = {
      ...(order.payment ?? {}),
      paymentIntentId: String(intent.id ?? ""),
      paymentIntentStatus: status,
      status: normalizeFailurePaymentStatus(status),
      canceledAt: status === "canceled" ? new Date().toISOString() : undefined,
    };
    await tryUpsertIntoTable("orders", {
      ...order,
      payment_status: normalizeFailurePaymentStatus(status),
      payment,
      status: normalizeFailureOrderStatus(status),
    }, "id");
  }
}

async function claimStripeWebhookEvent(eventId: string, eventType: string, payload: Record<string, unknown>) {
  const admin = getSupabaseAdmin();
  try {
    const { data, error } = await admin
      .from("stripe_webhook_events")
      .insert({
        id: eventId,
        event_type: eventType,
        status: "processing",
        payload,
      })
      .select("*")
      .maybeSingle();
    if (error) {
      throw error;
    }
    return { claimed: true, duplicate: false, event: data ?? null };
  } catch (error: any) {
    if (error?.code !== "23505") {
      throw error;
    }
  }

  const { data: existing, error: existingError } = await admin
    .from("stripe_webhook_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (existingError) {
    throw existingError;
  }
  if (!existing) {
    throw new HttpError("Unable to resolve webhook lock", 500);
  }
  const existingStatus = String(existing.status ?? "");
  if (existingStatus === "processed" || existingStatus === "processing") {
    return { claimed: false, duplicate: true, event: existing };
  }

  const { data: retried, error: retryError } = await admin
    .from("stripe_webhook_events")
    .update({
      event_type: eventType,
      status: "processing",
      attempts_count: Number(existing.attempts_count ?? 1) + 1,
      payload,
      last_error: "",
    })
    .eq("id", eventId)
    .eq("status", "failed")
    .select("*")
    .maybeSingle();
  if (retryError) {
    throw retryError;
  }
  if (!retried) {
    return { claimed: false, duplicate: true, event: existing };
  }
  return { claimed: true, duplicate: false, event: retried };
}

async function markStripeWebhookProcessed(eventId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("stripe_webhook_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      last_error: "",
    })
    .eq("id", eventId);
  if (error) {
    throw error;
  }
}

async function markStripeWebhookFailed(eventId: string, errorMessage: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("stripe_webhook_events")
    .update({
      status: "failed",
      last_error: errorMessage,
    })
    .eq("id", eventId);
  if (error) {
    console.warn("[stripe-webhook] unable to mark failed event", eventId, error);
  }
}

// checkout.session.async_payment_failed: notify buyer, cancel order draft
async function handleAsyncPaymentFailed(session: any) {
  const metadata = session.metadata || {};
  const orderId = String(metadata.orderId ?? metadata.order_id ?? "");
  const buyerEmail = normalizeEmail(metadata.buyerEmail ?? session.customer_details?.email ?? session.customer_email ?? "");
  const buyerId = String(metadata.buyerId ?? metadata.buyer_id ?? "");

  console.log("[stripe-webhook] async_payment_failed", { orderId, buyerEmail });

  if (orderId) {
    const existing = await fetchOrderById(orderId);
    if (existing && canTransitionOrderToFailure(existing.status)) {
      await tryUpsertIntoTable("orders", {
        ...existing,
        status: "payment_failed",
        payment_status: "failed",
        payment: {
          ...(existing.payment ?? {}),
          status: "failed",
          paymentIntentStatus: "payment_failed",
          failedAt: new Date().toISOString(),
        },
      }, "id");
    }
  }

  if (buyerEmail) {
    await upsertNotification({
      recipient_id: buyerId || null,
      recipient_email: buyerEmail,
      audience: "user",
      kind: "payment",
      title: "Pagamento fallito",
      body: "Il pagamento non è andato a buon fine. Aggiorna il metodo di pagamento.",
      order_id: orderId,
      scope: "checkout",
      unread: true,
    });
    await sendTransactionalEmail("generic", buyerEmail, {
      orderId,
      body: "Il pagamento non è andato a buon fine. Accedi a IRIS per aggiornare il metodo di pagamento e riprovare.",
    }, { subject: "IRIS - Pagamento fallito" });
  }
}

// payment_intent.succeeded: sync payment status
async function handlePaymentIntentSucceeded(intent: any) {
  const metadata = intent.metadata || {};
  const orderId = String(metadata.orderId ?? metadata.order_id ?? "");
  if (!orderId) return;
  const existing = await fetchOrderById(orderId);
  if (!existing) return;
  const nextPaymentStatus = shouldPromotePaymentStatus(existing.payment_status ?? existing.payment?.status, "captured")
    ? "captured"
    : String(existing.payment_status ?? existing.payment?.status ?? "");
  const nextOrderStatus = shouldPromoteOrderStatus(existing.status, "paid")
    ? "paid"
    : String(existing.status ?? "");
  await tryUpsertIntoTable("orders", {
    ...existing,
    status: nextOrderStatus,
    payment_status: nextPaymentStatus,
    payment_captured_at: nextPaymentStatus === "captured" ? new Date().toISOString() : existing.payment_captured_at ?? null,
  }, "id");
  await tryUpsertIntoTable("payments", {
    provider_payment_intent_id: String(intent.id ?? ""),
    status: "captured",
  }, "provider_payment_intent_id");
}

// charge.refunded: update order, notify buyer
async function handleChargeRefunded(charge: any) {
  const piId = String(charge.payment_intent ?? "");
  const refundAmount = Number(charge.amount_refunded ?? 0);
  const currency = String(charge.currency ?? "eur").toUpperCase();
  const buyerEmail = normalizeEmail(charge.billing_details?.email ?? charge.receipt_email ?? "");

  console.log("[stripe-webhook] charge.refunded", { piId, refundAmount, buyerEmail });

  // Find order via JSONB payment field (paymentIntentId stored inside payment blob)
  const { data: orders } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .contains("payment", { paymentIntentId: piId })
    .limit(1);
  const order = Array.isArray(orders) && orders.length ? orders[0] : null;

  if (order) {
    const isFullRefund = refundAmount >= Number(order.total ?? 0) * 100;
    await tryUpsertIntoTable("orders", {
      ...order,
      status: isFullRefund ? "refunded" : "partially_refunded",
      payout_status: "blocked",
    }, "id");
    if (buyerEmail || order.buyer_email) {
      await upsertNotification({
        recipient_id: order.buyer_id || null,
        recipient_email: buyerEmail || order.buyer_email,
        audience: "user",
        kind: "refund",
        title: isFullRefund ? "Rimborso effettuato" : "Rimborso parziale effettuato",
        body: `${(refundAmount / 100).toFixed(2)} ${currency} sono stati rimborsati.`,
        order_id: order.id,
        scope: "refund",
        unread: true,
      });
    }
  }

  // Update payment record
  if (piId) {
    await getSupabaseAdmin()
      .from("payments")
      .update({ status: "refunded" })
      .eq("provider_payment_intent_id", piId)
      .neq("provider_payment_intent_id", "");
  }
}

// charge.dispute.created: create chargeback + dispute records, notify admin
async function handleDisputeCreated(dispute: any) {
  const piId = String(dispute.payment_intent ?? "");
  const stripeDisputeId = String(dispute.id ?? "");
  const amount = Number(dispute.amount ?? 0);
  const currency = String(dispute.currency ?? "eur");
  const reason = String(dispute.reason ?? "");
  const evidenceDueBy = dispute.evidence_details?.due_by
    ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
    : null;

  console.log("[stripe-webhook] charge.dispute.created", { stripeDisputeId, piId, amount, reason });

  // Find order via JSONB payment field (paymentIntentId stored inside payment blob)
  const { data: orders } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .contains("payment", { paymentIntentId: piId })
    .limit(1);
  const order = Array.isArray(orders) && orders.length ? orders[0] : null;

  if (order) {
    // Upsert chargeback record
    await tryUpsertIntoTable("chargebacks", {
      order_id: order.id,
      stripe_dispute_id: stripeDisputeId,
      amount,
      currency,
      reason,
      status: String(dispute.status ?? "warning_needs_response"),
      evidence_due_by: evidenceDueBy,
    }, "stripe_dispute_id");

    // Block payout on this order
    await tryUpsertIntoTable("orders", {
      ...order,
      payout_status: "blocked",
    }, "id");

    // Notify admin
    const adminEmails = String(getEnv("ADMIN_EMAILS", "admin@iris-fashion.it")).split(",").map((e: string) => e.trim()).filter(Boolean);
    for (const adminEmail of adminEmails.slice(0, 3)) {
      await sendTransactionalEmail("generic", adminEmail, {
        orderId: order.id,
        body: `Chargeback Stripe aperto (${stripeDisputeId}) per l'ordine ${order.number ?? order.id}. Importo: ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}. Motivo: ${reason}. Scadenza prove: ${evidenceDueBy ?? "N/A"}.`,
      }, { subject: `IRIS - Chargeback ${stripeDisputeId}` });
    }
  }
}

// charge.dispute.closed: update chargeback status
async function handleDisputeClosed(dispute: any) {
  const stripeDisputeId = String(dispute.id ?? "");
  const status = String(dispute.status ?? "lost");

  console.log("[stripe-webhook] charge.dispute.closed", { stripeDisputeId, status });

  await getSupabaseAdmin()
    .from("chargebacks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("stripe_dispute_id", stripeDisputeId);

  // If won, unblock payout
  if (status === "won") {
    const { data: cbs } = await getSupabaseAdmin()
      .from("chargebacks")
      .select("order_id")
      .eq("stripe_dispute_id", stripeDisputeId)
      .limit(1);
    const orderId = Array.isArray(cbs) && cbs.length ? String(cbs[0].order_id) : "";
    if (orderId) {
      await getSupabaseAdmin()
        .from("orders")
        .update({ payout_status: "pending" })
        .eq("id", orderId)
        .eq("payout_status", "blocked");
    }
  }
}

// transfer.created: confirm payout transfer to seller
async function handleTransferCreated(transfer: any) {
  const transferId = String(transfer.id ?? "");
  const amount = Number(transfer.amount ?? 0);
  const currency = String(transfer.currency ?? "eur").toUpperCase();
  const destination = String(transfer.destination ?? "");
  const orderId = String(transfer.metadata?.orderId ?? transfer.metadata?.order_id ?? "");

  console.log("[stripe-webhook] transfer.created", { transferId, amount, destination, orderId });

  if (orderId) {
    const existing = await fetchOrderById(orderId);
    if (existing) {
      await tryUpsertIntoTable("orders", {
        ...existing,
        payout_status: "paid",
      }, "id");
    }
    await tryUpsertIntoTable("payments", {
      provider_payment_intent_id: String(transfer.source_transaction ?? ""),
      payout_transfer_ids: [transferId],
      payout_account_id: destination,
    }, "provider_payment_intent_id");
  }

  // Notify seller via seller_profiles lookup by payout_account_id
  if (destination) {
    const { data: sellers } = await getSupabaseAdmin()
      .from("seller_profiles")
      .select("user_id, display_name")
      .eq("payout_account_id", destination)
      .limit(1);
    if (Array.isArray(sellers) && sellers.length) {
      const { data: profile } = await getSupabaseAdmin()
        .from("profiles")
        .select("email")
        .eq("id", sellers[0].user_id)
        .maybeSingle();
      if (profile?.email) {
        await sendTransactionalEmail("payout-released", normalizeEmail(profile.email), {
          orderId,
          amount: `${(amount / 100).toFixed(2)} ${currency}`,
          transferId,
        });
      }
    }
  }
}

// account.updated: sync seller verification status from Stripe Connect
async function handleAccountUpdated(account: any) {
  const accountId = String(account.id ?? "");
  if (!accountId) return;

  console.log("[stripe-webhook] account.updated", { accountId, chargesEnabled: account.charges_enabled });

  const { data: sellers } = await getSupabaseAdmin()
    .from("seller_profiles")
    .select("*")
    .eq("payout_account_id", accountId)
    .limit(1);

  if (!Array.isArray(sellers) || !sellers.length) return;
  const seller = sellers[0];

  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);
  const hasRestrictions = (account.requirements?.currently_due ?? []).length > 0 ||
    (account.requirements?.past_due ?? []).length > 0;

  const verificationStatus = chargesEnabled && payoutsEnabled
    ? "verified"
    : detailsSubmitted && !hasRestrictions
    ? "under_review"
    : detailsSubmitted
    ? "pending"
    : "pending";

  await getSupabaseAdmin()
    .from("seller_profiles")
    .update({
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      payout_details_submitted: detailsSubmitted,
      payout_status: chargesEnabled && payoutsEnabled ? "connected" : "pending",
      verification_status: verificationStatus,
      verified_seller: chargesEnabled && payoutsEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", seller.id);
}

function getEnv(key: string, fallback = ""): string {
  try {
    return Deno.env.get(key) ?? fallback;
  } catch {
    return fallback;
  }
}

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  let eventId = "";
  let eventType = "";

  try {
    const signature = request.headers.get("stripe-signature") || request.headers.get("Stripe-Signature");
    if (!signature) {
      throw new HttpError("Missing Stripe signature", 400);
    }
    const rawBody = await request.text();
    const event = getStripe().webhooks.constructEvent(rawBody, signature, getWebhookSecret());

    eventId = event.id;
    eventType = event.type;
    console.log(`[stripe-webhook] received event: ${eventType} (${eventId})`);

    const webhookClaim = await claimStripeWebhookEvent(eventId, eventType, {
      eventId,
      eventType,
    });
    if (!webhookClaim.claimed) {
      console.log(`[stripe-webhook] skipping duplicate event: ${eventId}`);
      return jsonResponse({ ok: true, received: true, duplicate: true, event: eventType });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await handlePaymentIntentClosed({
          id: (event.data.object as any).payment_intent,
          metadata: (event.data.object as any).metadata ?? {},
        }, "canceled");
        break;
      case "checkout.session.async_payment_failed":
        await handleAsyncPaymentFailed(event.data.object);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
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
      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object);
        break;
      case "charge.dispute.closed":
        await handleDisputeClosed(event.data.object);
        break;
      case "transfer.created":
        await handleTransferCreated(event.data.object);
        break;
      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;
      default:
        console.log(`[stripe-webhook] unhandled event type: ${eventType}`);
        break;
    }

    await markStripeWebhookProcessed(eventId);
    return jsonResponse({ ok: true, received: true, event: eventType });
  } catch (error) {
    if (eventId) {
      await markStripeWebhookFailed(eventId, error instanceof Error ? error.message : String(error ?? "Unexpected error"));
    }
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error(`[stripe-webhook] unexpected error for event ${eventType} (${eventId})`, error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
