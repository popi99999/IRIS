const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^\[?::1\]?$/i,
];

export const TRACKING_STATUSES = Object.freeze([
  "label_created",
  "accepted_by_carrier",
  "shipped",
  "in_transit",
  "arrived_at_facility",
  "out_for_delivery",
  "delivery_attempted",
  "delivered",
  "exception",
  "returned_to_sender",
  "unknown",
]);

export const ORDER_STATUSES = Object.freeze([
  "order_paid",
  "seller_to_ship",
  "shipping_label_created",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "awaiting_buyer_confirmation",
  "buyer_confirmed_ok",
  "issue_reported",
  "dispute_open",
  "payout_pending",
  "payout_released",
  "payout_paid",
  "completed",
  "cancelled",
  "refunded",
  "returned",
]);

export const CARRIERS = Object.freeze({
  brt: {
    key: "brt",
    label: "BRT",
    aliases: ["brt", "bartolini"],
    domains: ["brt.it", "www.brt.it", "vas.brt.it"],
    url: "https://vas.brt.it/vas/sped_numspe_par.htm?lang=it&spediz={tracking}",
  },
  dhl: {
    key: "dhl",
    label: "DHL",
    aliases: ["dhl", "dhl express"],
    domains: ["dhl.com", "www.dhl.com"],
    url: "https://www.dhl.com/it-it/home/tracking/tracking-express.html?submit=1&tracking-id={tracking}",
  },
  ups: {
    key: "ups",
    label: "UPS",
    aliases: ["ups"],
    domains: ["ups.com", "www.ups.com"],
    url: "https://www.ups.com/track?tracknum={tracking}",
  },
  fedex: {
    key: "fedex",
    label: "FedEx",
    aliases: ["fedex", "fed ex", "federal express"],
    domains: ["fedex.com", "www.fedex.com"],
    url: "https://www.fedex.com/fedextrack/?trknbr={tracking}",
  },
  poste_italiane: {
    key: "poste_italiane",
    label: "Poste Italiane",
    aliases: ["poste", "poste italiane", "posteit", "posteitaliane"],
    domains: ["poste.it", "www.poste.it"],
    url: "https://www.poste.it/cerca/index.html#/risultati-spedizioni/{tracking}",
  },
  sda: {
    key: "sda",
    label: "SDA",
    aliases: ["sda", "sda express"],
    domains: ["sda.it", "www.sda.it"],
    url: "https://www.sda.it/wps/portal/Servizi_online/dettaglio-spedizione?tracing.letteraVettura={tracking}",
  },
  gls: {
    key: "gls",
    label: "GLS",
    aliases: ["gls", "gls italy", "gls italia"],
    domains: ["gls-italy.com", "www.gls-italy.com"],
    url: "https://www.gls-italy.com/it/servizi-online/ricerca-spedizioni?match={tracking}",
  },
  dpd: {
    key: "dpd",
    label: "DPD",
    aliases: ["dpd"],
    domains: ["dpd.com", "www.dpd.com"],
    url: "https://www.dpd.com/it/it/receiving/parcel-tracking/?parcelNumber={tracking}",
  },
  royal_mail: {
    key: "royal_mail",
    label: "Royal Mail",
    aliases: ["royal mail", "royalmail"],
    domains: ["royalmail.com", "www.royalmail.com"],
    url: "https://www.royalmail.com/track-your-item#/tracking-results/{tracking}",
  },
  colissimo: {
    key: "colissimo",
    label: "Colissimo",
    aliases: ["colissimo", "la poste", "laposte"],
    domains: ["laposte.fr", "www.laposte.fr"],
    url: "https://www.laposte.fr/outils/suivre-vos-envois?code={tracking}",
  },
});

const STATUS_ALIASES = new Map([
  ["label created", "label_created"],
  ["pre transit", "label_created"],
  ["pre-transit", "label_created"],
  ["accepted", "accepted_by_carrier"],
  ["accepted by carrier", "accepted_by_carrier"],
  ["picked up", "shipped"],
  ["pickup", "shipped"],
  ["shipped", "shipped"],
  ["in transit", "in_transit"],
  ["transit", "in_transit"],
  ["moving", "in_transit"],
  ["arrived", "arrived_at_facility"],
  ["arrived at facility", "arrived_at_facility"],
  ["at facility", "arrived_at_facility"],
  ["out for delivery", "out_for_delivery"],
  ["in consegna", "out_for_delivery"],
  ["delivery attempted", "delivery_attempted"],
  ["attempted", "delivery_attempted"],
  ["delivered", "delivered"],
  ["consegnato", "delivered"],
  ["exception", "exception"],
  ["failed", "exception"],
  ["problem", "exception"],
  ["returned", "returned_to_sender"],
  ["return to sender", "returned_to_sender"],
  ["returned to sender", "returned_to_sender"],
]);

const TRACKING_RANK = Object.freeze({
  unknown: 0,
  label_created: 1,
  accepted_by_carrier: 2,
  shipped: 3,
  in_transit: 4,
  arrived_at_facility: 5,
  out_for_delivery: 6,
  delivery_attempted: 6,
  delivered: 7,
  exception: 8,
  returned_to_sender: 9,
});

const NON_RELEASE_ORDER_STATUSES = new Set([
  "cancelled",
  "refunded",
  "returned",
  "issue_reported",
  "dispute_open",
]);

export function normalizeCarrier(value) {
  const needle = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (!needle) return null;
  return Object.values(CARRIERS).find((carrier) => {
    if (carrier.key.replace(/_/g, " ") === needle) return true;
    if (carrier.label.toLowerCase() === needle) return true;
    return carrier.aliases.some((alias) => alias.toLowerCase() === needle);
  }) ?? null;
}

export function sanitizeTrackingNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const compact = raw.replace(/\s+/g, "");
  if (compact.length < 4 || compact.length > 80) return "";
  if (/https?:|javascript:|data:|<|>|\(|\)|;|\\/.test(compact.toLowerCase())) return "";
  if (!/^[a-z0-9._-]+$/i.test(compact)) return "";
  return compact.toUpperCase();
}

function isPrivateHost(hostname) {
  const normalized = String(hostname ?? "").trim().toLowerCase();
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
}

function hostMatches(hostname, allowedDomains) {
  const host = String(hostname ?? "").toLowerCase();
  return allowedDomains.some((domain) => {
    const normalizedDomain = domain.toLowerCase();
    return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
  });
}

export function validateTrackingUrl(url, carrierValue) {
  const carrier = normalizeCarrier(carrierValue);
  if (!carrier) return { ok: false, reason: "invalid_carrier" };
  try {
    const parsed = new URL(String(url ?? ""));
    if (parsed.protocol !== "https:") {
      return { ok: false, reason: "invalid_protocol" };
    }
    if (isPrivateHost(parsed.hostname)) {
      return { ok: false, reason: "private_host" };
    }
    if (!hostMatches(parsed.hostname, carrier.domains)) {
      return { ok: false, reason: "untrusted_domain" };
    }
    return { ok: true, url: parsed.toString(), carrier };
  } catch {
    return { ok: false, reason: "malformed_url" };
  }
}

export function generateTrackingUrl(carrierValue, trackingNumber) {
  const carrier = normalizeCarrier(carrierValue);
  const safeTracking = sanitizeTrackingNumber(trackingNumber);
  if (!carrier) {
    throw new Error("Invalid carrier");
  }
  if (!safeTracking) {
    throw new Error("Invalid tracking number");
  }
  const url = carrier.url.replace("{tracking}", encodeURIComponent(safeTracking));
  const validation = validateTrackingUrl(url, carrier.key);
  if (!validation.ok) {
    throw new Error(`Unsafe tracking URL: ${validation.reason}`);
  }
  return validation.url;
}

export function normalizeTrackingStatus(value) {
  const input = String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!input) return "unknown";
  if (TRACKING_STATUSES.includes(input.replace(/\s+/g, "_"))) {
    return input.replace(/\s+/g, "_");
  }
  if (STATUS_ALIASES.has(input)) return STATUS_ALIASES.get(input);
  if (input.includes("out") && input.includes("delivery")) return "out_for_delivery";
  if (input.includes("deliver")) return "delivered";
  if (input.includes("transit")) return "in_transit";
  if (input.includes("attempt")) return "delivery_attempted";
  if (input.includes("return")) return "returned_to_sender";
  if (input.includes("exception") || input.includes("failed")) return "exception";
  return "unknown";
}

export function trackingStatusRank(status) {
  return TRACKING_RANK[normalizeTrackingStatus(status)] ?? 0;
}

export function shouldApplyTrackingEvent(currentStatus, nextStatus, currentOccurredAt, nextOccurredAt) {
  const normalizedCurrent = normalizeTrackingStatus(currentStatus);
  const normalizedNext = normalizeTrackingStatus(nextStatus);
  if (normalizedNext === "unknown") return false;
  if (normalizedCurrent === "delivered" && !["exception", "returned_to_sender"].includes(normalizedNext)) {
    return false;
  }
  const currentTime = currentOccurredAt ? Date.parse(currentOccurredAt) : 0;
  const nextTime = nextOccurredAt ? Date.parse(nextOccurredAt) : Date.now();
  if (Number.isFinite(currentTime) && Number.isFinite(nextTime) && nextTime < currentTime && trackingStatusRank(normalizedNext) < trackingStatusRank(normalizedCurrent)) {
    return false;
  }
  return trackingStatusRank(normalizedNext) >= trackingStatusRank(normalizedCurrent) || ["exception", "returned_to_sender"].includes(normalizedNext);
}

export function orderStatusFromTrackingStatus(status) {
  switch (normalizeTrackingStatus(status)) {
    case "label_created":
      return "shipping_label_created";
    case "accepted_by_carrier":
    case "shipped":
      return "shipped";
    case "in_transit":
    case "arrived_at_facility":
      return "in_transit";
    case "out_for_delivery":
    case "delivery_attempted":
      return "out_for_delivery";
    case "delivered":
      return "awaiting_buyer_confirmation";
    case "returned_to_sender":
      return "returned";
    case "exception":
      return "shipping_exception";
    default:
      return "";
  }
}

export function isOrderPaid(order) {
  const status = String(order?.status ?? "");
  const payment = order?.payment ?? {};
  return ["paid", "order_paid", "seller_to_ship", "shipping_label_created", "shipped", "in_transit", "out_for_delivery", "delivered", "awaiting_buyer_confirmation", "buyer_confirmed_ok", "payout_pending", "payout_released", "payout_paid", "completed"].includes(status) ||
    ["paid", "authorized", "captured", "succeeded"].includes(String(payment.status ?? payment.paymentStatus ?? ""));
}

export function hasBlockingOrderIssue(order) {
  const payment = order?.payment ?? {};
  return Boolean(
    order?.openDispute ||
    order?.open_dispute ||
    order?.chargebackOpen ||
    order?.chargeback_open ||
    order?.refundInProgress ||
    order?.refund_in_progress ||
    order?.authenticationStatus === "failed" ||
    order?.authentication_status === "failed" ||
    order?.issue_status === "open" ||
    order?.issueStatus === "open" ||
    String(order?.status ?? "") === "issue_reported" ||
    String(order?.status ?? "") === "dispute_open" ||
    String(payment.refundStatus ?? "") === "processing" ||
    String(payment.chargebackStatus ?? "") === "open" ||
    String(payment.payoutStatus ?? "") === "blocked"
  );
}

export function canBuyerConfirmOk(order, actor) {
  const buyerId = String(order?.buyer_id ?? order?.buyerId ?? "");
  const actorId = String(actor?.id ?? "");
  const actorRole = String(actor?.role ?? "");
  const isBuyer = actorRole === "buyer" && actorId && buyerId && actorId === buyerId;
  const shipment = order?.shipment ?? order?.shipping ?? {};
  const orderStatus = String(order?.status ?? "");
  const shipmentDelivered = normalizeTrackingStatus(shipment.status ?? shipment.shipmentStatus ?? "") === "delivered";
  const orderDelivered = ["delivered", "awaiting_buyer_confirmation"].includes(orderStatus);
  if (!isBuyer) return { ok: false, reason: "not_buyer" };
  if (!isOrderPaid(order)) return { ok: false, reason: "order_not_paid" };
  if (!orderDelivered && !shipmentDelivered) return { ok: false, reason: "not_delivered" };
  if (hasBlockingOrderIssue(order)) return { ok: false, reason: "blocked_by_issue" };
  if (["released", "paid"].includes(String((order?.payment ?? {}).payoutStatus ?? order?.payout_status ?? ""))) {
    return { ok: false, reason: "payout_already_released" };
  }
  return { ok: true };
}

export function canReleaseSellerPayout(order, actor, options = {}) {
  const actorRole = String(actor?.role ?? "");
  if (actorRole === "seller") {
    return { ok: false, reason: "seller_cannot_release_own_payout" };
  }
  if (actorRole !== "buyer" && actorRole !== "admin" && actorRole !== "system") {
    return { ok: false, reason: "unauthorized_actor" };
  }
  if (!isOrderPaid(order)) {
    return { ok: false, reason: "order_not_paid" };
  }
  if (hasBlockingOrderIssue(order) && !options.afterAdminResolution) {
    return { ok: false, reason: "blocked_by_issue" };
  }
  const status = String(order?.status ?? "");
  if (NON_RELEASE_ORDER_STATUSES.has(status)) {
    return { ok: false, reason: "invalid_order_status" };
  }
  const payoutStatus = String((order?.payment ?? {}).payoutStatus ?? order?.payout_status ?? "");
  if (["released", "paid"].includes(payoutStatus)) {
    return { ok: false, reason: "payout_already_released", idempotent: true };
  }
  if (actorRole === "buyer") {
    const buyerId = String(order?.buyer_id ?? order?.buyerId ?? "");
    if (!buyerId || String(actor?.id ?? "") !== buyerId) {
      return { ok: false, reason: "not_order_buyer" };
    }
    if (!["buyer_confirmed_ok", "payout_pending"].includes(status)) {
      return { ok: false, reason: "buyer_confirmation_required" };
    }
  }
  if (actorRole === "admin" && !options.reason) {
    return { ok: false, reason: "admin_reason_required" };
  }
  return { ok: true };
}

export function calculateSellerPayout({ salePrice, commissionAmount = 0, commissionRate = 0, fixedFees = 0 }) {
  const price = Number(salePrice);
  if (!Number.isFinite(price) || price < 0) return 0;
  const commission = Number.isFinite(Number(commissionAmount)) && Number(commissionAmount) > 0
    ? Number(commissionAmount)
    : price * Math.max(0, Number(commissionRate) || 0);
  const payout = price - commission - Math.max(0, Number(fixedFees) || 0);
  return Math.max(0, Math.round(payout * 100) / 100);
}

export function canAccessOrder(order, actor, scope = "view") {
  const role = String(actor?.role ?? "");
  const actorId = String(actor?.id ?? "");
  const actorEmail = String(actor?.email ?? "").trim().toLowerCase();
  if (role === "admin") return true;
  if (role === "buyer") return actorId && String(order?.buyer_id ?? order?.buyerId ?? "") === actorId;
  if (role === "seller") {
    const sellerId = String(order?.seller_id ?? order?.sellerId ?? "");
    const sellerEmails = Array.isArray(order?.seller_emails) ? order.seller_emails.map((email) => String(email).trim().toLowerCase()) : [];
    if (scope === "confirm_buyer_ok" || scope === "release_payout" || scope === "mark_delivered") return false;
    return (sellerId && sellerId === actorId) || (actorEmail && sellerEmails.includes(actorEmail));
  }
  return false;
}

export function sanitizeText(value, maxLength = 1000) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function buildAuditLog({ actor, sellerId, entityType, entityId, action, beforeValue, afterValue, metadata }) {
  return {
    actor_id: actor?.id ?? null,
    actor_role: actor?.role ?? "system",
    seller_id: sellerId ?? null,
    entity_type: entityType,
    entity_id: entityId,
    action,
    before_value: beforeValue ?? null,
    after_value: afterValue ?? null,
    metadata: metadata ?? {},
    timestamp: new Date().toISOString(),
  };
}

export function dedupeWebhookEvent(seenIds, eventId) {
  const id = String(eventId ?? "").trim();
  if (!id) return { ok: false, reason: "missing_event_id" };
  if (seenIds.has(id)) return { ok: false, reason: "duplicate_event" };
  seenIds.add(id);
  return { ok: true };
}

