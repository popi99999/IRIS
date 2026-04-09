import { normalizeEmail, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import {
  fetchOrderById,
  getRequestUser,
} from "../_shared/supabase.ts";
import { isEligibleForPayout, releaseStripePayoutForOrder } from "../_shared/payouts.ts";

type Body = {
  orderId?: string;
  sellerEmail?: string;
  force?: boolean;
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

    const orderSellerEmails = Array.isArray(order.seller_emails) ? order.seller_emails.map((email) => normalizeEmail(email)) : [];
    const targetSellerEmail = normalizeEmail(body.sellerEmail ?? orderSellerEmails[0] ?? "");
    const currentUserEmail = normalizeEmail(user.email);
    const isAdmin = ["owner@iris-fashion.it", "admin@iris-fashion.it", "support@iris-fashion.it"].includes(currentUserEmail);
    if (!isAdmin && !body.force && currentUserEmail !== targetSellerEmail && !orderSellerEmails.includes(currentUserEmail)) {
      throw new HttpError("Not allowed to release this payout", 403);
    }

    if (!body.force && !isEligibleForPayout(String(order.status ?? ""))) {
      throw new HttpError("Order is not ready for payout", 409);
    }

    const payoutResult = await releaseStripePayoutForOrder(order, targetSellerEmail);

    return jsonResponse({
      ok: true,
      order: payoutResult.order,
      transfer: payoutResult.transfer,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[release-payout] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
