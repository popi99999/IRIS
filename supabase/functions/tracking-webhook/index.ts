import { getEnv } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { fetchOrderById, getSupabaseAdmin, tryInsertIntoTable, tryUpsertIntoTable, upsertNotification } from "../_shared/supabase.ts";
import {
  generateTrackingUrl,
  normalizeCarrier,
  normalizeTrackingStatus,
  orderStatusFromTrackingStatus,
  sanitizeTrackingNumber,
  sanitizeTrackingText,
  shouldApplyTrackingEvent,
  verifyTrackingWebhookSignature,
} from "../_shared/tracking.ts";

type TrackingWebhookBody = {
  eventId?: string;
  orderId?: string;
  carrier?: string;
  trackingNumber?: string;
  status?: string;
  rawStatus?: string;
  description?: string;
  location?: string;
  occurredAt?: string;
  estimatedDeliveryAt?: string;
  rawPayload?: Record<string, unknown>;
};

function isPaidOrder(order: Record<string, unknown>) {
  const payment = (order.payment ?? {}) as Record<string, unknown>;
  return ["paid", "order_paid", "seller_to_ship", "shipping_label_created", "shipped", "in_transit", "out_for_delivery", "delivered", "awaiting_buyer_confirmation", "buyer_confirmed_ok", "payout_pending", "payout_released", "payout_paid", "completed"].includes(String(order.status ?? "")) ||
    ["paid", "authorized", "captured", "succeeded"].includes(String(payment.status ?? payment.paymentStatus ?? ""));
}

async function claimWebhookEvent(eventId: string, payload: Record<string, unknown>) {
  const { data, error } = await getSupabaseAdmin()
    .from("tracking_webhook_events")
    .insert({
      id: eventId,
      carrier: String(payload.carrier ?? ""),
      tracking_number: String(payload.trackingNumber ?? payload.tracking_number ?? ""),
      status: "processing",
      payload,
    })
    .select("*")
    .maybeSingle();
  if (error) {
    if (String(error.code ?? "") === "23505") {
      return { claimed: false, event: null };
    }
    throw error;
  }
  return { claimed: true, event: data };
}

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  const rawBody = await request.text();
  try {
    const secret = getEnv("TRACKING_WEBHOOK_SECRET");
    if (!secret) {
      throw new HttpError("Tracking webhook secret is not configured", 500);
    }
    const signature = request.headers.get("x-webhook-signature") || request.headers.get("X-Webhook-Signature") || "";
    if (!(await verifyTrackingWebhookSignature(secret, rawBody, signature))) {
      throw new HttpError("Invalid tracking webhook signature", 401);
    }

    let body: TrackingWebhookBody;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new HttpError("Malformed tracking payload", 400);
    }

    const eventId = sanitizeTrackingText(body.eventId, 120);
    const orderId = sanitizeTrackingText(body.orderId, 120);
    const carrierConfig = normalizeCarrier(body.carrier ?? "");
    const carrier = carrierConfig?.key ?? "";
    const trackingNumber = sanitizeTrackingNumber(body.trackingNumber ?? "");
    const rawStatus = sanitizeTrackingText(body.rawStatus ?? body.status ?? "unknown", 160);
    const normalizedStatus = normalizeTrackingStatus(body.status ?? body.rawStatus ?? "");
    const occurredAt = body.occurredAt && !Number.isNaN(Date.parse(body.occurredAt)) ? new Date(body.occurredAt).toISOString() : new Date().toISOString();
    const receivedAt = new Date().toISOString();
    if (!eventId || !orderId || !carrier || !trackingNumber) {
      throw new HttpError("Missing required tracking fields", 400);
    }
    if (normalizedStatus === "unknown") {
      throw new HttpError("Unknown tracking status", 422);
    }

    const claim = await claimWebhookEvent(eventId, { ...body, carrier, trackingNumber });
    if (!claim.claimed) {
      return jsonResponse({ ok: true, duplicate: true });
    }

    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new HttpError("Order not found", 404);
    }
    if (!isPaidOrder(order)) {
      throw new HttpError("Tracking cannot update an unpaid order", 409);
    }

    const trackingUrl = generateTrackingUrl(carrier, trackingNumber);
    const { data: existingShipment } = await getSupabaseAdmin()
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .eq("carrier", carrier)
      .eq("tracking_number", trackingNumber)
      .maybeSingle();

    if (existingShipment && !shouldApplyTrackingEvent(existingShipment.status, normalizedStatus, existingShipment.last_event_at, occurredAt)) {
      await getSupabaseAdmin()
        .from("tracking_webhook_events")
        .update({ status: "ignored", processed_at: receivedAt })
        .eq("id", eventId);
      return jsonResponse({ ok: true, ignored: true, reason: "out_of_order" });
    }

    const shipmentRows = await tryUpsertIntoTable("shipments", {
      order_id: orderId,
      seller_id: null,
      buyer_id: order.buyer_id ?? null,
      carrier,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      provider: "carrier_webhook",
      shipping_flow: "direct_to_buyer",
      status: normalizedStatus,
      raw_status: rawStatus,
      estimated_delivery_at: body.estimatedDeliveryAt && !Number.isNaN(Date.parse(body.estimatedDeliveryAt)) ? new Date(body.estimatedDeliveryAt).toISOString() : existingShipment?.estimated_delivery_at ?? null,
      shipped_at: ["shipped", "in_transit", "arrived_at_facility", "out_for_delivery", "delivered"].includes(normalizedStatus) ? (existingShipment?.shipped_at ?? occurredAt) : existingShipment?.shipped_at ?? null,
      delivered_at: normalizedStatus === "delivered" ? occurredAt : existingShipment?.delivered_at ?? null,
      last_event_at: occurredAt,
      raw_carrier_payload: body.rawPayload ?? body,
    }, "order_id,carrier,tracking_number");
    const shipment = Array.isArray(shipmentRows) ? shipmentRows[0] : null;

    await tryInsertIntoTable("tracking_events", {
      shipment_id: shipment?.id ?? existingShipment?.id ?? null,
      order_id: orderId,
      carrier,
      tracking_number: trackingNumber,
      normalized_status: normalizedStatus,
      raw_status: rawStatus,
      description: sanitizeTrackingText(body.description ?? rawStatus, 500),
      location: sanitizeTrackingText(body.location ?? "", 160),
      occurred_at: occurredAt,
      received_at: receivedAt,
      raw_payload: body.rawPayload ?? body,
      source: "webhook",
      provider_event_id: eventId,
    });

    const previousStatus = String(order.status ?? "");
    const nextOrderStatus = orderStatusFromTrackingStatus(normalizedStatus);
    const orderPatch: Record<string, unknown> = {
      ...order,
      last_tracking_status: normalizedStatus,
      estimated_delivery_at: body.estimatedDeliveryAt && !Number.isNaN(Date.parse(body.estimatedDeliveryAt)) ? new Date(body.estimatedDeliveryAt).toISOString() : order.estimated_delivery_at ?? null,
      shipping: {
        ...(order.shipping ?? {}),
        carrier: carrierConfig?.label ?? carrier,
        carrierKey: carrier,
        trackingNumber,
        tracking_number: trackingNumber,
        trackingUrl,
        shipmentStatus: normalizedStatus,
        deliveredAt: normalizedStatus === "delivered" ? occurredAt : (order.shipping as Record<string, unknown> | undefined)?.deliveredAt,
      },
    };
    if (nextOrderStatus && nextOrderStatus !== "shipping_exception") {
      orderPatch.status = nextOrderStatus;
    }
    if (normalizedStatus === "delivered") {
      orderPatch.status = "awaiting_buyer_confirmation";
      orderPatch.delivered_at = occurredAt;
      orderPatch.payment = {
        ...(order.payment ?? {}),
        payoutStatus: "awaiting_buyer_confirmation",
      };
    }
    await tryUpsertIntoTable("orders", orderPatch, "id");
    await tryInsertIntoTable("order_status_events", {
      order_id: orderId,
      actor_id: null,
      actor_role: "system",
      previous_status: previousStatus,
      new_status: String(orderPatch.status ?? previousStatus),
      message: sanitizeTrackingText(body.description ?? rawStatus, 500),
      metadata: { carrier, trackingNumber, source: "tracking-webhook", normalizedStatus },
    });

    if (normalizedStatus === "delivered") {
      await upsertNotification({
        recipient_id: order.buyer_id ?? null,
        recipient_email: order.buyer_email ?? "",
        audience: "user",
        kind: "delivery",
        title: "Ordine consegnato",
        body: "Controlla l'articolo e conferma se va tutto bene.",
        order_id: order.id,
        product_id: String((order.items?.[0] as any)?.productId ?? ""),
        scope: "delivery",
        unread: true,
      });
    }

    await getSupabaseAdmin()
      .from("tracking_webhook_events")
      .update({ status: "processed", processed_at: receivedAt })
      .eq("id", eventId);

    return jsonResponse({ ok: true, order: orderPatch, status: normalizedStatus });
  } catch (error) {
    try {
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      if (parsed?.eventId) {
        await getSupabaseAdmin()
          .from("tracking_webhook_events")
          .update({ status: "failed", last_error: error instanceof Error ? error.message : String(error ?? "error") })
          .eq("id", String(parsed.eventId));
      }
    } catch {
      // noop
    }
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[tracking-webhook] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});

