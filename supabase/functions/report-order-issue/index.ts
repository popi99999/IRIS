import { normalizeEmail, readJsonBody } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { fetchOrderById, getRequestUser, isUserAdmin, tryInsertIntoTable, tryUpsertIntoTable, upsertNotification } from "../_shared/supabase.ts";
import { sanitizeTrackingText } from "../_shared/tracking.ts";

const ALLOWED_ISSUES = new Set([
  "item_not_received",
  "item_damaged",
  "item_not_as_described",
  "wrong_item",
  "authentication_concern",
  "other",
]);

type Body = {
  orderId?: string;
  issueType?: string;
  message?: string;
  evidence?: unknown[];
};

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const body = await readJsonBody<Body>(request);
    const orderId = String(body.orderId ?? "").trim();
    const issueType = String(body.issueType ?? "").trim();
    const message = sanitizeTrackingText(body.message ?? "", 1200);
    if (!orderId || !ALLOWED_ISSUES.has(issueType)) {
      throw new HttpError("Missing or invalid issue details", 400);
    }

    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new HttpError("Order not found", 404);
    }
    const isAdmin = await isUserAdmin(user);
    const isBuyer = String(order.buyer_id ?? "") === String(user.id) || normalizeEmail(order.buyer_email ?? "") === normalizeEmail(user.email);
    if (!isBuyer || isAdmin) {
      throw new HttpError("Only the buyer can report a problem for this order", 403);
    }

    const now = new Date().toISOString();
    const sellerEmails = Array.isArray(order.seller_emails) ? order.seller_emails : [];
    const issueRows = await tryInsertIntoTable("order_issues", {
      order_id: order.id,
      buyer_id: user.id,
      seller_id: null,
      issue_type: issueType,
      message,
      status: "open",
      payout_blocked: true,
      evidence: Array.isArray(body.evidence) ? body.evidence : [],
      created_at: now,
      updated_at: now,
    });
    await tryInsertIntoTable("disputes", {
      order_id: order.id,
      opened_by: user.id,
      reason: `${issueType}: ${message}`.slice(0, 500),
      status: "open",
      evidence: Array.isArray(body.evidence) ? body.evidence : [],
    });

    const updatedOrder = {
      ...order,
      status: "issue_reported",
      issue_status: "open",
      payment: {
        ...(order.payment ?? {}),
        payoutStatus: "blocked",
        payoutBlockedAt: now,
        payoutBlockedReason: issueType,
      },
    };
    await tryUpsertIntoTable("orders", updatedOrder, "id");
    await tryInsertIntoTable("order_status_events", {
      order_id: order.id,
      actor_id: user.id,
      actor_role: "buyer",
      previous_status: String(order.status ?? ""),
      new_status: "issue_reported",
      message: "Buyer reported a problem",
      metadata: { issueType, message },
    });
    await tryInsertIntoTable("audit_logs", {
      actor_id: user.id,
      actor_role: "buyer",
      actor_email: normalizeEmail(user.email),
      seller_id: null,
      entity_type: "order",
      entity_id: String(order.id ?? ""),
      action: "order_issue_reported",
      before_value: { status: order.status ?? "" },
      after_value: { status: "issue_reported", payoutStatus: "blocked" },
      metadata: { issueType, issueId: Array.isArray(issueRows) ? issueRows[0]?.id : null },
    });

    for (const sellerEmail of sellerEmails) {
      await upsertNotification({
        recipient_id: null,
        recipient_email: normalizeEmail(sellerEmail),
        audience: "user",
        kind: "support",
        title: "Problema segnalato su un ordine",
        body: String(order.number ?? order.id ?? ""),
        order_id: order.id,
        product_id: String((order.items?.[0] as any)?.productId ?? ""),
        scope: "dispute",
        unread: true,
      });
    }
    await upsertNotification({
      recipient_id: user.id,
      recipient_email: normalizeEmail(order.buyer_email ?? user.email),
      audience: "user",
      kind: "support",
      title: "Segnalazione ricevuta",
      body: "Il payout resta bloccato finche IRIS non chiude la verifica.",
      order_id: order.id,
      product_id: String((order.items?.[0] as any)?.productId ?? ""),
      scope: "dispute",
      unread: true,
    });

    return jsonResponse({ ok: true, order: updatedOrder, issue: Array.isArray(issueRows) ? issueRows[0] : null });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[report-order-issue] unexpected error", error);
    return errorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});

