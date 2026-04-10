import { normalizeEmail, normalizeString } from "./env.ts";
import {
  fetchProfileByEmail,
  tryInsertIntoTable,
  tryUpsertIntoTable,
} from "./supabase.ts";
import { getStripe } from "./stripe.ts";
import { sendTransactionalEmail } from "./email.ts";
import { HttpError } from "./http.ts";

export function readConnectAccountId(profile: Record<string, unknown> | null | undefined): string {
  const payoutSettings = (profile?.payout_settings ?? {}) as Record<string, unknown>;
  const stripeConnect = (payoutSettings.stripe_connect ?? payoutSettings.stripeConnect ?? payoutSettings.connect ?? {}) as Record<string, unknown>;
  return normalizeString(stripeConnect.account_id ?? stripeConnect.accountId ?? payoutSettings.stripe_connect_account_id ?? "");
}

export function isEligibleForPayout(status: string) {
  // "paid" intentionally excluded: payout requires delivery confirmation, not just payment.
  // PAYOUT_HOLD_DAYS is enforced in the maintenance loop on top of this status check.
  return ["delivered", "completed", "buyer_confirmed_delivery", "payout_pending"].includes(String(status || ""));
}

export function computePayoutAmount(order: Record<string, unknown>): number {
  const payment = (order.payment ?? {}) as Record<string, unknown>;
  const value = Number(
    payment.sellerNet ??
    payment.sellerNetAmount ??
    payment.seller_payout_amount ??
    (
      Number(payment.subtotal ?? order.subtotal ?? 0) -
      Number(payment.sellerFeeAmount ?? 0) -
      Number(payment.authenticationFeeAmount ?? 0)
    )
  );
  return Number.isFinite(value) ? value : 0;
}

export async function releaseStripePayoutForOrder(order: Record<string, unknown>, sellerEmail?: string) {
  const normalizedSellerEmail = normalizeEmail(
    sellerEmail ??
    (Array.isArray(order.seller_emails) ? order.seller_emails[0] : "") ??
    ((Array.isArray(order.items) && order.items[0] && order.items[0].sellerEmail) || "")
  );
  if (!normalizedSellerEmail) {
    throw new HttpError("Seller email not found", 404);
  }

  const sellerProfile = await fetchProfileByEmail(normalizedSellerEmail);
  if (!sellerProfile) {
    throw new HttpError("Seller profile not found", 404);
  }

  const accountId = readConnectAccountId(sellerProfile);
  if (!accountId) {
    throw new HttpError("Seller has no connected payout account", 409);
  }

  const payoutAmount = computePayoutAmount(order);
  if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
    throw new HttpError("Invalid payout amount", 400);
  }

  const payment = (order.payment ?? {}) as Record<string, unknown>;
  const currency = String(payment.currency ?? order.currency ?? "EUR").toUpperCase();
  const transfer = await getStripe().transfers.create({
    amount: Math.round(payoutAmount * 100),
    currency: currency.toLowerCase(),
    destination: accountId,
    transfer_group: String(payment.transferGroup ?? `iris_${order.id}`),
    metadata: {
      iris_order_id: String(order.id ?? ""),
      iris_order_number: String(order.number ?? ""),
      iris_seller_email: normalizedSellerEmail,
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
    status: String(order.status || "") === "completed" ? "completed" : "completed",
    delivered_at: order.delivered_at ?? new Date().toISOString(),
  };

  await tryUpsertIntoTable("orders", updatedOrder, "id");
  await tryInsertIntoTable("notifications", {
    id: `ntf_${crypto.randomUUID()}`,
    recipient_id: sellerProfile.id ?? null,
    recipient_email: normalizedSellerEmail,
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
  await sendTransactionalEmail("payout-released", normalizedSellerEmail, {
    orderId: order.id,
    orderNumber: order.number,
    amount: `${payoutAmount.toFixed(2)} ${currency}`,
    transferId: transfer.id,
  });

  return {
    order: updatedOrder,
    transfer,
    sellerEmail: normalizedSellerEmail,
    payoutAmount,
    currency,
  };
}
