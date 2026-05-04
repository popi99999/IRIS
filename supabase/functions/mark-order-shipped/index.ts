import { normalizeEmail, normalizeString, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { fetchOrderById, getRequestUser, isUserAdmin, tryInsertIntoTable, tryUpsertIntoTable, upsertNotification } from "../_shared/supabase.ts";
import { sendTransactionalEmail } from "../_shared/email.ts";
import { generateTrackingUrl, normalizeCarrier, sanitizeTrackingNumber } from "../_shared/tracking.ts";

type Body = {
  orderId?: string;
  carrier?: string;
  trackingNumber?: string;
};

function canSellerUpdateManualTracking(order: Record<string, unknown>) {
  const status = String(order.status ?? "");
  const payment = (order.payment ?? {}) as Record<string, unknown>;
  const paymentStatus = String(payment.status ?? payment.paymentStatus ?? "").toLowerCase();
  const paidOrShippingStatus = new Set([
    "paid",
    "order_paid",
    "seller_to_ship",
    "shipping_label_created",
    "shipped",
    "in_transit",
    "out_for_delivery",
  ]);
  const blockedStatus = new Set([
    "cancelled",
    "refunded",
    "returned",
    "delivered",
    "awaiting_buyer_confirmation",
    "buyer_confirmed_ok",
    "issue_reported",
    "dispute_open",
    "payout_pending",
    "payout_released",
    "payout_paid",
    "completed",
  ]);

  if (blockedStatus.has(status)) return false;
  if (["processing", "refunded", "refund_requested"].includes(String(payment.refundStatus ?? "").toLowerCase())) return false;
  if (["open", "needs_response", "under_review"].includes(String(payment.chargebackStatus ?? "").toLowerCase())) return false;
  return paidOrShippingStatus.has(status) || ["paid", "authorized", "captured", "succeeded"].includes(paymentStatus);
}

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const body = await readJsonBody<Body>(request);
    const orderId = String(body.orderId ?? "").trim();
    const carrierConfig = normalizeCarrier(body.carrier ?? "");
    const carrier = carrierConfig?.label ?? "";
    const carrierKey = carrierConfig?.key ?? "";
    const trackingNumber = sanitizeTrackingNumber(body.trackingNumber ?? "");
    if (!orderId || !carrier || !trackingNumber) {
      throw new HttpError("Missing order shipping details", 400);
    }

    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new HttpError("Order not found", 404);
    }

    const currentUserEmail = normalizeEmail(user.email);
    const sellerEmails = Array.isArray(order.seller_emails) ? order.seller_emails.map((entry) => normalizeEmail(entry)) : [];
    const isAdmin = await isUserAdmin(user);
    if (!isAdmin && !sellerEmails.includes(currentUserEmail)) {
      throw new HttpError("You cannot update this shipment", 403);
    }
    if (!isAdmin && !canSellerUpdateManualTracking(order)) {
      throw new HttpError("Tracking can only be added to paid orders that are still eligible for shipping", 409);
    }
    if (!isAdmin && ["delivered", "awaiting_buyer_confirmation", "buyer_confirmed_ok", "payout_pending", "payout_released", "payout_paid", "completed"].includes(String(order.status ?? ""))) {
      throw new HttpError("Tracking cannot be changed after delivery", 409);
    }

    const now = new Date().toISOString();
    const trackingUrl = generateTrackingUrl(carrierKey, trackingNumber);
    const updatedOrder = {
      ...order,
      status: "shipped",
      shipped_at: order.shipped_at ?? now,
      last_tracking_status: "shipped",
      payment: {
        ...(order.payment ?? {}),
        payoutStatus: "pending_delivery",
      },
      shipping: {
        ...(order.shipping ?? {}),
        carrier,
        carrierKey,
        tracking_number: trackingNumber,
        trackingNumber,
        trackingUrl,
        shipmentStatus: "shipped",
        shippedAt: order.shipped_at ?? now,
      },
    };
    await tryUpsertIntoTable("orders", updatedOrder, "id");
    await tryUpsertIntoTable("shipments", {
      order_id: order.id,
      seller_id: isAdmin ? null : user.id,
      buyer_id: order.buyer_id ?? null,
      carrier: carrierKey,
      carrier_service: normalizeString(body.carrier ?? ""),
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      provider: "manual",
      shipping_flow: "direct_to_buyer",
      status: "shipped",
      raw_status: "shipped",
      shipped_at: order.shipped_at ?? now,
      last_event_at: now,
      raw_carrier_payload: { enteredBy: isAdmin ? "admin" : "seller" },
    }, "order_id,carrier,tracking_number");
    await tryInsertIntoTable("tracking_events", {
      order_id: order.id,
      carrier: carrierKey,
      tracking_number: trackingNumber,
      normalized_status: "shipped",
      raw_status: "shipped",
      description: "Tracking added by seller",
      location: "",
      occurred_at: now,
      received_at: now,
      raw_payload: {},
      source: "seller",
    });
    await tryInsertIntoTable("order_status_events", {
      order_id: order.id,
      actor_id: user.id,
      actor_role: isAdmin ? "admin" : "seller",
      previous_status: String(order.status ?? ""),
      new_status: "shipped",
      message: "Tracking added",
      metadata: { carrier: carrierKey, trackingNumber, trackingUrl },
    });
    await tryInsertIntoTable("audit_logs", {
      actor_id: user.id,
      actor_role: isAdmin ? "admin" : "seller",
      actor_email: currentUserEmail,
      seller_id: null,
      entity_type: "order",
      entity_id: String(order.id ?? ""),
      action: "tracking_added",
      before_value: { status: order.status ?? "" },
      after_value: { status: "shipped", carrier: carrierKey, trackingNumber },
      metadata: { trackingUrl },
    });
    await tryUpsertIntoTable("order_shipments", {
      order_id: order.id,
      carrier: carrierKey,
      tracking_number: trackingNumber,
      status: "in_transit",
      shipped_at: order.shipped_at ?? now,
    }, "order_id");

    await upsertNotification({
      recipient_id: order.buyer_id ?? null,
      recipient_email: normalizeEmail(order.buyer_email ?? ""),
      audience: "user",
      kind: "shipping",
      title: "Ordine spedito",
      body: `${carrier} · ${trackingNumber}`,
      order_id: order.id,
      product_id: String((order.items?.[0] as any)?.productId ?? ""),
      scope: "shipping",
      unread: true,
    });
    await sendTransactionalEmail("shipment-notice", normalizeEmail(order.buyer_email ?? ""), {
      orderId: order.id,
      orderNumber: order.number,
      carrier,
      trackingNumber,
      productTitle: Array.isArray(order.items) ? order.items.map((item: any) => `${item.productBrand ?? ""} ${item.productName ?? ""}`.trim()).join(", ") : "",
    });

    return jsonResponse({
      ok: true,
      order: updatedOrder,
      trackingUrl,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[mark-order-shipped] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
