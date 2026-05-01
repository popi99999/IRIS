import { normalizeEmail, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { fetchOrderById, getRequestUser, isUserAdmin, tryInsertIntoTable, tryUpsertIntoTable, upsertNotification } from "../_shared/supabase.ts";
import { releaseStripePayoutForOrder } from "../_shared/payouts.ts";

type Body = {
  orderId?: string;
  confirm?: boolean;
};

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const body = await readJsonBody<Body>(request);
    const orderId = String(body.orderId ?? "").trim();
    if (!orderId) {
      throw new HttpError("Missing order id", 400);
    }

    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new HttpError("Order not found", 404);
    }

    const currentUserEmail = normalizeEmail(user.email);
    const isAdmin = await isUserAdmin(user);
    const isBuyer = normalizeEmail(order.buyer_email ?? "") === currentUserEmail || String(order.buyer_id ?? "") === String(user.id);
    if (!isBuyer || isAdmin) {
      throw new HttpError("Only the buyer can confirm that everything is OK", 403);
    }
    if (body.confirm !== true) {
      throw new HttpError("Confirmation is required", 400);
    }
    const currentStatus = String(order.status ?? "");
    const shipping = (order.shipping ?? {}) as Record<string, unknown>;
    const shipmentStatus = String(shipping.shipmentStatus ?? shipping.status ?? "").toLowerCase();
    const isDelivered = ["delivered", "awaiting_buyer_confirmation"].includes(currentStatus) || shipmentStatus === "delivered";
    if (!isDelivered) {
      throw new HttpError("Order is not delivered yet", 409);
    }

    const now = new Date().toISOString();
    const updatedOrder = {
      ...order,
      status: "buyer_confirmed_ok",
      buyer_confirmed_at: now,
      payment: {
        ...(order.payment ?? {}),
        payoutStatus: "release_requested",
        buyerConfirmedAt: now,
      },
      shipping: {
        ...shipping,
        shipmentStatus: "delivered",
        deliveredAt: shipping.deliveredAt ?? order.delivered_at ?? now,
      },
    };
    await tryUpsertIntoTable("orders", updatedOrder, "id");
    await tryInsertIntoTable("order_status_events", {
      order_id: order.id,
      actor_id: user.id,
      actor_role: "buyer",
      previous_status: currentStatus,
      new_status: "buyer_confirmed_ok",
      message: "Buyer confirmed that everything is OK",
      metadata: { source: "confirm-order-delivery" },
    });
    await tryInsertIntoTable("audit_logs", {
      actor_id: user.id,
      actor_role: "buyer",
      actor_email: currentUserEmail,
      seller_id: null,
      entity_type: "order",
      entity_id: String(order.id ?? ""),
      action: "buyer_confirmed_ok",
      before_value: { status: currentStatus },
      after_value: { status: "buyer_confirmed_ok" },
      metadata: { payoutReleaseRequested: true },
    });

    await upsertNotification({
      recipient_id: order.buyer_id ?? null,
      recipient_email: normalizeEmail(order.buyer_email ?? ""),
      audience: "user",
      kind: "delivery",
      title: "Conferma ricevuta",
      body: String(order.number ?? order.id ?? ""),
      order_id: order.id,
      product_id: String((order.items?.[0] as any)?.productId ?? ""),
      scope: "delivery",
      unread: true,
    });
    for (const sellerEmail of Array.isArray(order.seller_emails) ? order.seller_emails : []) {
      await upsertNotification({
        recipient_id: null,
        recipient_email: normalizeEmail(sellerEmail),
        audience: "user",
        kind: "sale",
        title: "Il buyer ha confermato l'ordine",
        body: String(order.number ?? order.id ?? ""),
        order_id: order.id,
        product_id: String((order.items?.[0] as any)?.productId ?? ""),
        scope: "payout",
        unread: true,
      });
    }

    let payout = null;
    try {
      payout = await releaseStripePayoutForOrder(updatedOrder, undefined, {
        triggeredBy: user.id,
        triggeredByRole: "buyer",
        releaseReason: "buyer_confirmed_ok",
      });
    } catch (error) {
      console.warn("[confirm-order-delivery] payout release pending", error);
    }

    return jsonResponse({
      ok: true,
      order: payout && payout.order ? payout.order : updatedOrder,
      transfer: payout ? payout.transfer : null,
      payoutReleased: Boolean(payout && payout.transfer),
      payoutStatus: payout && payout.transfer ? "released" : "release_requested",
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[confirm-order-delivery] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
