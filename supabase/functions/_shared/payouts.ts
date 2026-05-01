import { normalizeEmail, normalizeString } from "./env.ts";
import {
  fetchProfileByEmail,
  getSupabaseAdmin,
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
  // A delivered tracking event is not enough. Money can move only after buyer OK
  // or an explicit admin resolution.
  return ["buyer_confirmed_ok", "payout_pending"].includes(String(status || ""));
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

function buildPayoutIdempotencyKey(orderId: string) {
  return `iris_payout_${orderId}`;
}

async function fetchPayoutRelease(orderId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("payout_releases")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

async function claimPayoutRelease(order: Record<string, unknown>, sellerEmail: string, accountId: string, payoutAmount: number, currency: string, transferGroup: string) {
  const admin = getSupabaseAdmin();
  const orderId = String(order.id ?? "");
  const idempotencyKey = buildPayoutIdempotencyKey(orderId);
  const record = {
    order_id: orderId,
    seller_email: sellerEmail,
    payout_account_id: accountId,
    payout_amount: payoutAmount,
    currency,
    transfer_group: transferGroup,
    idempotency_key: idempotencyKey,
    status: "processing",
    last_error: "",
  };

  try {
    const { data, error } = await admin
      .from("payout_releases")
      .insert(record)
      .select("*")
      .maybeSingle();
    if (error) {
      throw error;
    }
    return { claimed: true, release: data ?? record, idempotencyKey };
  } catch (error: any) {
    if (error?.code !== "23505") {
      throw error;
    }
  }

  const existing = await fetchPayoutRelease(orderId);
  if (!existing) {
    throw new HttpError("Unable to acquire payout lock", 500);
  }
  if (String(existing.status ?? "") === "released" && String(existing.stripe_transfer_id ?? "")) {
    return { claimed: false, release: existing, idempotencyKey: String(existing.idempotency_key ?? idempotencyKey) };
  }
  if (String(existing.status ?? "") === "processing") {
    throw new HttpError("Payout is already being released", 409);
  }

  const { data, error } = await admin
    .from("payout_releases")
    .update({
      seller_email: sellerEmail,
      payout_account_id: accountId,
      payout_amount: payoutAmount,
      currency,
      transfer_group: transferGroup,
      idempotency_key: idempotencyKey,
      status: "processing",
      last_error: "",
    })
    .eq("order_id", orderId)
    .in("status", ["failed", "blocked"])
    .select("*")
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new HttpError("Payout is not releasable", 409);
  }
  return { claimed: true, release: data, idempotencyKey };
}

async function markPayoutReleaseStatus(orderId: string, patch: Record<string, unknown>) {
  const { error } = await getSupabaseAdmin()
    .from("payout_releases")
    .update(patch)
    .eq("order_id", orderId);
  if (error) {
    throw error;
  }
}

export type PayoutReleaseContext = {
  triggeredBy?: string | null;
  triggeredByRole?: "buyer" | "admin" | "system" | "seller";
  releaseReason?: string;
  adminReason?: string;
  afterAdminResolution?: boolean;
};

async function findBlockingPayoutReason(order: Record<string, unknown>, context: PayoutReleaseContext) {
  const orderId = String(order.id ?? "");
  const status = String(order.status ?? "");
  const payment = (order.payment ?? {}) as Record<string, unknown>;
  const actorRole = context.triggeredByRole ?? "system";
  if (actorRole === "seller") {
    return "seller_cannot_release_own_payout";
  }
  if (actorRole === "buyer" && !["buyer_confirmed_ok", "payout_pending"].includes(status)) {
    return "buyer_confirmation_required";
  }
  if (actorRole === "admin" && !normalizeString(context.adminReason ?? context.releaseReason ?? "")) {
    return "admin_reason_required";
  }
  if (!context.afterAdminResolution && !isEligibleForPayout(status)) {
    return "order_not_ready_for_payout";
  }
  if (["released", "paid"].includes(String(payment.payoutStatus ?? order.payout_status ?? ""))) {
    return "payout_already_released";
  }
  if (["processing", "refunded", "refund_requested"].includes(String(payment.refundStatus ?? "")) || ["refunded", "refund_requested"].includes(status)) {
    return "refund_blocks_payout";
  }
  if (["open", "needs_response", "under_review"].includes(String(payment.chargebackStatus ?? ""))) {
    return "chargeback_blocks_payout";
  }
  if (String(order.authentication_status ?? order.authenticationStatus ?? "") === "failed") {
    return "authentication_failure_blocks_payout";
  }

  const admin = getSupabaseAdmin();
  const { data: activeDisputes, error: disputeError } = await admin
    .from("disputes")
    .select("id")
    .eq("order_id", orderId)
    .not("status", "in", '("resolved","closed")')
    .limit(1);
  if (!disputeError && activeDisputes && activeDisputes.length > 0 && !context.afterAdminResolution) {
    return "active_dispute_blocks_payout";
  }

  const { data: activeIssues, error: issueError } = await admin
    .from("order_issues")
    .select("id")
    .eq("order_id", orderId)
    .eq("payout_blocked", true)
    .not("status", "in", '("resolved","closed")')
    .limit(1);
  if (!issueError && activeIssues && activeIssues.length > 0 && !context.afterAdminResolution) {
    return "active_issue_blocks_payout";
  }

  const { data: activeChargebacks, error: chargebackError } = await admin
    .from("chargebacks")
    .select("id")
    .eq("order_id", orderId)
    .not("status", "in", '("won","lost","closed")')
    .limit(1);
  if (!chargebackError && activeChargebacks && activeChargebacks.length > 0) {
    return "chargeback_blocks_payout";
  }

  return "";
}

async function logPayoutAudit(order: Record<string, unknown>, action: string, context: PayoutReleaseContext, metadata: Record<string, unknown> = {}) {
  await tryInsertIntoTable("audit_logs", {
    actor_id: context.triggeredBy ?? null,
    actor_role: context.triggeredByRole ?? "system",
    actor_email: "",
    seller_id: null,
    entity_type: "order",
    entity_id: String(order.id ?? ""),
    action,
    before_value: null,
    after_value: null,
    metadata,
  });
  await tryInsertIntoTable("order_status_events", {
    order_id: String(order.id ?? ""),
    actor_id: context.triggeredBy ?? null,
    actor_role: context.triggeredByRole ?? "system",
    previous_status: String(order.status ?? ""),
    new_status: action,
    message: normalizeString(metadata.message ?? action),
    metadata,
  });
}

export async function releaseStripePayoutForOrder(order: Record<string, unknown>, sellerEmail?: string, context: PayoutReleaseContext = {}) {
  const releaseContext = {
    triggeredBy: context.triggeredBy ?? null,
    triggeredByRole: context.triggeredByRole ?? "system",
    releaseReason: context.releaseReason ?? "buyer_confirmed_ok",
    adminReason: context.adminReason ?? "",
    afterAdminResolution: context.afterAdminResolution ?? false,
  } satisfies PayoutReleaseContext;

  const blockingReason = await findBlockingPayoutReason(order, releaseContext);
  if (blockingReason === "payout_already_released") {
    const existing = await fetchPayoutRelease(String(order.id ?? ""));
    return {
      order,
      transfer: existing?.stripe_transfer_id ? await getStripe().transfers.retrieve(String(existing.stripe_transfer_id)) : null,
      sellerEmail: normalizeEmail(sellerEmail ?? ""),
      payoutAmount: computePayoutAmount(order),
      currency: String(((order.payment ?? {}) as Record<string, unknown>).currency ?? order.currency ?? "EUR").toUpperCase(),
      idempotent: true,
    };
  }
  if (blockingReason) {
    await markPayoutReleaseStatus(String(order.id ?? ""), {
      status: "blocked",
      blocked_reason: blockingReason,
      last_error: blockingReason,
    }).catch(() => null);
    await logPayoutAudit(order, "payout_release_blocked", releaseContext, { reason: blockingReason });
    throw new HttpError(`Payout cannot be released: ${blockingReason}`, 409);
  }

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
  const transferGroup = String(payment.transferGroup ?? `iris_${order.id}`);
  const payoutClaim = await claimPayoutRelease(order, normalizedSellerEmail, accountId, payoutAmount, currency, transferGroup);
  await markPayoutReleaseStatus(String(order.id ?? ""), {
    seller_id: sellerProfile.id ?? null,
    buyer_id: order.buyer_id ?? null,
    provider_payment_id: String(payment.paymentIntentId ?? payment.payment_intent_id ?? order.payment_intent_id ?? ""),
    amount: payoutAmount,
    release_reason: releaseContext.releaseReason ?? "buyer_confirmed_ok",
    triggered_by: releaseContext.triggeredBy ?? null,
    triggered_by_role: releaseContext.triggeredByRole ?? "system",
    release_attempt_count: Number(payoutClaim.release.release_attempt_count ?? 0) + 1,
  }).catch(() => null);

  let transfer;
  if (!payoutClaim.claimed) {
    transfer = await getStripe().transfers.retrieve(String(payoutClaim.release.stripe_transfer_id ?? ""));
  } else {
    try {
      transfer = await getStripe().transfers.create({
        amount: Math.round(payoutAmount * 100),
        currency: currency.toLowerCase(),
        destination: accountId,
        transfer_group: transferGroup,
        metadata: {
          iris_order_id: String(order.id ?? ""),
          iris_order_number: String(order.number ?? ""),
          iris_seller_email: normalizedSellerEmail,
        },
      }, {
        idempotencyKey: payoutClaim.idempotencyKey,
      });
    } catch (error) {
      await markPayoutReleaseStatus(String(order.id ?? ""), {
        status: "failed",
        last_error: error instanceof Error ? error.message : String(error ?? "transfer_failed"),
      });
      throw error;
    }
  }

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
    payout_status: "released",
    status: "payout_released",
    delivered_at: order.delivered_at ?? null,
  };

  await markPayoutReleaseStatus(String(order.id ?? ""), {
    status: "released",
    stripe_transfer_id: transfer.id,
    provider_payout_id: transfer.id,
    released_at: new Date().toISOString(),
    last_error: "",
    failure_reason: "",
    blocked_reason: "",
  });
  await tryUpsertIntoTable("orders", updatedOrder, "id");
  await logPayoutAudit(order, "payout_released", releaseContext, {
    transferId: transfer.id,
    amount: payoutAmount,
    currency,
  });
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
