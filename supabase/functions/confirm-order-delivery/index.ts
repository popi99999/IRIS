import { normalizeEmail, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { fetchOrderById, getRequestUser, isUserAdmin, tryUpsertIntoTable, upsertNotification } from "../_shared/supabase.ts";
import { releaseStripePayoutForOrder } from "../_shared/payouts.ts";

type Body = {
  orderId?: string;
  autoReleasePayout?: boolean;
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
    if (!isBuyer && !isAdmin) {
      throw new HttpError("You cannot confirm this delivery", 403);
    }

    const updatedOrder = {
      ...order,
      status: "delivered",
      delivered_at: new Date().toISOString(),
      payment: {
        ...(order.payment ?? {}),
        payoutStatus: "ready",
      },
      shipping: {
        ...(order.shipping ?? {}),
        shipmentStatus: "delivered",
        deliveredAt: new Date().toISOString(),
      },
    };
    await tryUpsertIntoTable("orders", updatedOrder, "id");

    await upsertNotification({
      recipient_id: order.buyer_id ?? null,
      recipient_email: normalizeEmail(order.buyer_email ?? ""),
      audience: "user",
      kind: "delivery",
      title: "Ordine consegnato",
      body: String(order.number ?? order.id ?? ""),
      order_id: order.id,
      product_id: String((order.items?.[0] as any)?.productId ?? ""),
      scope: "delivery",
      unread: true,
    });

    let payout = null;
    if (body.autoReleasePayout !== false) {
      try {
        payout = await releaseStripePayoutForOrder(updatedOrder);
      } catch (error) {
        console.warn("[confirm-order-delivery] payout release skipped", error);
      }
    }

    return jsonResponse({
      ok: true,
      order: payout && payout.order ? payout.order : updatedOrder,
      transfer: payout ? payout.transfer : null,
      payoutReleased: Boolean(payout && payout.transfer),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[confirm-order-delivery] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
