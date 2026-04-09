import { normalizeEmail, normalizeString, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import {
  fetchOrderById,
  fetchProfileByEmail,
  getRequestUser,
  getSupabaseAdmin,
  tryInsertIntoTable,
  tryUpsertIntoTable,
  upsertNotification,
} from "../_shared/supabase.ts";
import { getStripe } from "../_shared/stripe.ts";
import { sendTransactionalEmail } from "../_shared/email.ts";

type Body = {
  orderId?: string;
  sellerEmail?: string;
  force?: boolean;
};

function readConnectAccountId(profile: Record<string, unknown> | null | undefined): string {
  const payoutSettings = (profile?.payout_settings ?? {}) as Record<string, unknown>;
  const stripeConnect = (payoutSettings.stripe_connect ?? payoutSettings.stripeConnect ?? payoutSettings.connect ?? {}) as Record<string, unknown>;
  return normalizeString(stripeConnect.account_id ?? stripeConnect.accountId ?? payoutSettings.stripe_connect_account_id ?? "");
}

function isEligibleForPayout(status: string) {
  return ["delivered", "completed", "buyer_confirmed_delivery", "payout_pending", "paid"].includes(status);
}

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

    const sellerProfile = await fetchProfileByEmail(targetSellerEmail);
    if (!sellerProfile) {
      throw new HttpError("Seller profile not found", 404);
    }
    const accountId = readConnectAccountId(sellerProfile);
    if (!accountId) {
      throw new HttpError("Seller has no connected payout account", 409);
    }

    const payment = (order.payment ?? {}) as Record<string, unknown>;
    const currency = String(payment.currency ?? order.currency ?? "EUR").toUpperCase();
    const payoutAmount = Number(
      payment.sellerNet ??
      payment.sellerNetAmount ??
      payment.seller_payout_amount ??
      (
        Number(payment.subtotal ?? order.subtotal ?? 0) -
        Number(payment.sellerFeeAmount ?? 0) -
        Number(payment.authenticationFeeAmount ?? 0)
      ),
    );
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      throw new HttpError("Invalid payout amount", 400);
    }

    const transfer = await getStripe().transfers.create({
      amount: Math.round(payoutAmount * 100),
      currency: currency.toLowerCase(),
      destination: accountId,
      transfer_group: String(payment.transferGroup ?? `iris_${order.id}`),
      metadata: {
        iris_order_id: order.id,
        iris_order_number: String(order.number ?? ""),
        iris_seller_email: targetSellerEmail,
      },
    });

    const updatedPayment = {
      ...payment,
      payoutStatus: "released",
      payoutReleasedAt: new Date().toISOString(),
      payoutTransferIds: [...(Array.isArray(payment.payoutTransferIds) ? payment.payoutTransferIds : []), transfer.id],
      payoutAccountId: accountId,
      transferGroup: String(payment.transferGroup ?? `iris_${order.id}`),
    };

    const updatedOrder = {
      ...order,
      payment: updatedPayment,
      status: "completed",
      delivered_at: (order.delivered_at ?? new Date().toISOString()),
    };

    await tryUpsertIntoTable("orders", updatedOrder, "id");
    await tryInsertIntoTable("notifications", {
      id: `ntf_${crypto.randomUUID()}`,
      recipient_id: sellerProfile.id ?? null,
      recipient_email: targetSellerEmail,
      audience: "user",
      kind: "sale",
      title: "Payout rilasciato",
      body: `${order.number ?? order.id} · ${payoutAmount.toFixed(2)} ${currency}`,
      order_id: order.id,
      product_id: String((order.items?.[0] as any)?.productId ?? ""),
      scope: "payout",
      unread: true,
      created_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    });
    await sendTransactionalEmail("payout-released", targetSellerEmail, {
      orderId: order.id,
      orderNumber: order.number,
      amount: `${payoutAmount.toFixed(2)} ${currency}`,
      transferId: transfer.id,
    });

    return jsonResponse({
      ok: true,
      order: updatedOrder,
      transfer,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[release-payout] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
