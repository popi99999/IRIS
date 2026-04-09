import { normalizeEmail, normalizeString, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { fetchOrderById, getRequestUser, tryUpsertIntoTable, upsertNotification } from "../_shared/supabase.ts";
import { sendTransactionalEmail } from "../_shared/email.ts";

type Body = {
  orderId?: string;
  carrier?: string;
  trackingNumber?: string;
};

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const body = await readJsonBody<Body>(request);
    const orderId = String(body.orderId ?? "").trim();
    const carrier = normalizeString(body.carrier ?? "");
    const trackingNumber = normalizeString(body.trackingNumber ?? "");
    if (!orderId || !carrier || !trackingNumber) {
      throw new HttpError("Missing order shipping details", 400);
    }

    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new HttpError("Order not found", 404);
    }

    const currentUserEmail = normalizeEmail(user.email);
    const sellerEmails = Array.isArray(order.seller_emails) ? order.seller_emails.map((entry) => normalizeEmail(entry)) : [];
    const isAdmin = ["owner@iris-fashion.it", "admin@iris-fashion.it", "support@iris-fashion.it"].includes(currentUserEmail);
    if (!isAdmin && !sellerEmails.includes(currentUserEmail)) {
      throw new HttpError("You cannot update this shipment", 403);
    }

    const updatedOrder = {
      ...order,
      status: "shipped",
      shipped_at: new Date().toISOString(),
      payment: {
        ...(order.payment ?? {}),
        payoutStatus: "pending_delivery",
      },
      shipping: {
        ...(order.shipping ?? {}),
        carrier,
        tracking_number: trackingNumber,
        trackingNumber,
        shipmentStatus: "shipped",
        shippedAt: new Date().toISOString(),
      },
    };
    await tryUpsertIntoTable("orders", updatedOrder, "id");

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
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[mark-order-shipped] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
