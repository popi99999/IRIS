import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuditLog,
  calculateSellerPayout,
  canAccessOrder,
  canBuyerConfirmOk,
  canReleaseSellerPayout,
  dedupeWebhookEvent,
  generateTrackingUrl,
  normalizeCarrier,
  normalizeTrackingStatus,
  orderStatusFromTrackingStatus,
  sanitizeText,
  sanitizeTrackingNumber,
  shouldApplyTrackingEvent,
  validateTrackingUrl,
} from "../order-tracking-core.mjs";

describe("order tracking carrier and URL safety", () => {
  it("normalizes supported carrier aliases", () => {
    assert.equal(normalizeCarrier("Bartolini").key, "brt");
    assert.equal(normalizeCarrier("Poste Italiane").key, "poste_italiane");
    assert.equal(normalizeCarrier("Royal Mail").key, "royal_mail");
    assert.equal(normalizeCarrier("not a carrier"), null);
  });

  it("generates official tracking links only", () => {
    const url = generateTrackingUrl("DHL", "abc12345");
    assert.match(url, /^https:\/\/www\.dhl\.com\//);
    assert.match(url, /ABC12345/);
  });

  it("rejects malicious and phishing tracking URLs", () => {
    assert.equal(validateTrackingUrl("javascript:alert(1)", "DHL").ok, false);
    assert.equal(validateTrackingUrl("http://www.dhl.com/track/ABC", "DHL").ok, false);
    assert.equal(validateTrackingUrl("https://dhl.com.phishing.test/track/ABC", "DHL").ok, false);
    assert.equal(validateTrackingUrl("https://localhost/track/ABC", "DHL").ok, false);
    assert.equal(validateTrackingUrl("https://127.0.0.1/track/ABC", "DHL").ok, false);
    assert.equal(validateTrackingUrl("https://www.ups.com/track?tracknum=ABC", "DHL").ok, false);
  });

  it("sanitizes tracking numbers and rejects URL-like payloads", () => {
    assert.equal(sanitizeTrackingNumber(" 1z 999-aa "), "1Z999-AA");
    assert.equal(sanitizeTrackingNumber("https://evil.test"), "");
    assert.equal(sanitizeTrackingNumber("<script>"), "");
    assert.equal(sanitizeTrackingNumber("abc"), "");
  });
});

describe("tracking state normalization", () => {
  it("normalizes carrier statuses into IRIS statuses", () => {
    assert.equal(normalizeTrackingStatus("In consegna"), "out_for_delivery");
    assert.equal(normalizeTrackingStatus("consegnato"), "delivered");
    assert.equal(normalizeTrackingStatus("Return to sender"), "returned_to_sender");
    assert.equal(normalizeTrackingStatus("mystery"), "unknown");
  });

  it("derives order status from tracking status", () => {
    assert.equal(orderStatusFromTrackingStatus("delivered"), "awaiting_buyer_confirmation");
    assert.equal(orderStatusFromTrackingStatus("in_transit"), "in_transit");
    assert.equal(orderStatusFromTrackingStatus("exception"), "shipping_exception");
  });

  it("ignores older lower-rank events and duplicate-like regressions", () => {
    assert.equal(shouldApplyTrackingEvent("out_for_delivery", "in_transit", "2026-05-01T10:00:00Z", "2026-05-01T09:00:00Z"), false);
    assert.equal(shouldApplyTrackingEvent("in_transit", "out_for_delivery", "2026-05-01T09:00:00Z", "2026-05-01T10:00:00Z"), true);
    assert.equal(shouldApplyTrackingEvent("delivered", "in_transit", "2026-05-01T10:00:00Z", "2026-05-01T11:00:00Z"), false);
    assert.equal(shouldApplyTrackingEvent("delivered", "exception", "2026-05-01T10:00:00Z", "2026-05-01T11:00:00Z"), true);
  });
});

describe("buyer confirmation and payout rules", () => {
  const baseOrder = {
    id: "ord_1",
    buyer_id: "buyer_1",
    seller_id: "seller_1",
    seller_emails: ["seller@iris.test"],
    status: "awaiting_buyer_confirmation",
    payment: { status: "paid", payoutStatus: "pending_delivery" },
    shipping: { status: "delivered" },
  };

  it("lets only the actual buyer confirm delivered item OK", () => {
    assert.equal(canBuyerConfirmOk(baseOrder, { id: "buyer_1", role: "buyer" }).ok, true);
    assert.equal(canBuyerConfirmOk(baseOrder, { id: "seller_1", role: "seller" }).reason, "not_buyer");
    assert.equal(canBuyerConfirmOk(baseOrder, { id: "buyer_2", role: "buyer" }).reason, "not_buyer");
  });

  it("blocks buyer confirmation when order is not delivered or has disputes/refunds/auth failures", () => {
    assert.equal(canBuyerConfirmOk({ ...baseOrder, status: "shipped", shipping: { status: "in_transit" } }, { id: "buyer_1", role: "buyer" }).reason, "not_delivered");
    assert.equal(canBuyerConfirmOk({ ...baseOrder, openDispute: true }, { id: "buyer_1", role: "buyer" }).reason, "blocked_by_issue");
    assert.equal(canBuyerConfirmOk({ ...baseOrder, refundInProgress: true }, { id: "buyer_1", role: "buyer" }).reason, "blocked_by_issue");
    assert.equal(canBuyerConfirmOk({ ...baseOrder, authenticationStatus: "failed" }, { id: "buyer_1", role: "buyer" }).reason, "blocked_by_issue");
  });

  it("blocks seller-triggered payout release and allows buyer after OK", () => {
    assert.equal(canReleaseSellerPayout({ ...baseOrder, status: "buyer_confirmed_ok" }, { id: "seller_1", role: "seller" }).reason, "seller_cannot_release_own_payout");
    assert.equal(canReleaseSellerPayout({ ...baseOrder, status: "buyer_confirmed_ok" }, { id: "buyer_1", role: "buyer" }).ok, true);
    assert.equal(canReleaseSellerPayout({ ...baseOrder, status: "awaiting_buyer_confirmation" }, { id: "buyer_1", role: "buyer" }).reason, "buyer_confirmation_required");
  });

  it("requires admin reason and blocks disputes unless admin resolved them", () => {
    assert.equal(canReleaseSellerPayout({ ...baseOrder, status: "buyer_confirmed_ok" }, { id: "admin_1", role: "admin" }).reason, "admin_reason_required");
    assert.equal(canReleaseSellerPayout({ ...baseOrder, status: "buyer_confirmed_ok", openDispute: true }, { id: "admin_1", role: "admin" }, { reason: "resolved" }).reason, "blocked_by_issue");
    assert.equal(canReleaseSellerPayout({ ...baseOrder, status: "buyer_confirmed_ok", openDispute: true }, { id: "admin_1", role: "admin" }, { reason: "resolved", afterAdminResolution: true }).ok, true);
  });

  it("treats already released payout as idempotent, not payable twice", () => {
    const result = canReleaseSellerPayout({ ...baseOrder, status: "buyer_confirmed_ok", payment: { status: "paid", payoutStatus: "released" } }, { id: "buyer_1", role: "buyer" });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "payout_already_released");
    assert.equal(result.idempotent, true);
  });
});

describe("permissions, audit, bad data and calculations", () => {
  const order = {
    buyer_id: "buyer_1",
    seller_id: "seller_1",
    seller_emails: ["seller@iris.test"],
  };

  it("enforces order ownership", () => {
    assert.equal(canAccessOrder(order, { id: "buyer_1", role: "buyer" }), true);
    assert.equal(canAccessOrder(order, { id: "buyer_2", role: "buyer" }), false);
    assert.equal(canAccessOrder(order, { id: "seller_1", role: "seller", email: "other@test" }), true);
    assert.equal(canAccessOrder(order, { id: "seller_2", role: "seller", email: "seller@iris.test" }), true);
    assert.equal(canAccessOrder(order, { id: "seller_1", role: "seller" }, "release_payout"), false);
    assert.equal(canAccessOrder(order, { id: "admin_1", role: "admin" }), true);
  });

  it("dedupes webhook events", () => {
    const seen = new Set();
    assert.equal(dedupeWebhookEvent(seen, "evt_1").ok, true);
    assert.equal(dedupeWebhookEvent(seen, "evt_1").reason, "duplicate_event");
    assert.equal(dedupeWebhookEvent(seen, "").reason, "missing_event_id");
  });

  it("does not allow delivered tracking alone to release payout", () => {
    const deliveredOrder = { status: "awaiting_buyer_confirmation", buyer_id: "buyer_1", payment: { status: "paid" }, shipping: { status: "delivered" } };
    assert.equal(canReleaseSellerPayout(deliveredOrder, { id: "buyer_1", role: "buyer" }).reason, "buyer_confirmation_required");
  });

  it("sanitizes tracking descriptions and builds audit logs", () => {
    assert.equal(sanitizeText("<script>alert(1)</script> Delivered\u0000"), "scriptalert(1)/script Delivered");
    const audit = buildAuditLog({
      actor: { id: "buyer_1", role: "buyer" },
      sellerId: "seller_1",
      entityType: "order",
      entityId: "ord_1",
      action: "buyer_confirmed_ok",
      metadata: { source: "test" },
    });
    assert.equal(audit.actor_id, "buyer_1");
    assert.equal(audit.action, "buyer_confirmed_ok");
    assert.equal(audit.metadata.source, "test");
  });

  it("calculates seller payout after commission", () => {
    assert.equal(calculateSellerPayout({ salePrice: 780, commissionRate: 0.07 }), 725.4);
    assert.equal(calculateSellerPayout({ salePrice: 780, commissionAmount: 100, fixedFees: 5 }), 675);
    assert.equal(calculateSellerPayout({ salePrice: -1, commissionRate: 0.07 }), 0);
  });
});

