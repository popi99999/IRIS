import { normalizeAmount, normalizeEmail, normalizeString, toIsoString, uuid } from "./env.ts";

export const BUYER_FEE_RATE = 0.05;
export const SELLER_FEE_RATE = 0.05;
export const CONCIERGE_SELLER_FEE_RATE = 0.15;
export const DEFAULT_AUTH_FEE = 10;
export const PREMIUM_AUTH_FEE = 20;
export const OFFER_EXPIRY_HOURS = 24;
export const STANDARD_SHIPPING_FEE = 25;
export const EXPRESS_SHIPPING_FEE = 40;

export function resolveShippingMethod(value: unknown): "insured" | "express_insured" {
  const normalized = normalizeString(value).toLowerCase();
  if (
    normalized === "express_insured" ||
    normalized === "express-insured" ||
    normalized === "spedizione espressa assicurata" ||
    normalized === "express insured" ||
    normalized.includes("express")
  ) {
    return "express_insured";
  }
  return "insured";
}

export function resolveShippingFee(value: unknown): number {
  return resolveShippingMethod(value) === "express_insured"
    ? EXPRESS_SHIPPING_FEE
    : STANDARD_SHIPPING_FEE;
}

export function getServiceMode(listing: Record<string, unknown> | null | undefined): string {
  return normalizeString((listing as { service_mode?: unknown; serviceMode?: unknown } | null | undefined)?.service_mode
    ?? (listing as { service_mode?: unknown; serviceMode?: unknown } | null | undefined)?.serviceMode
    ?? "self_serve").toLowerCase();
}

export function getListingCurrency(listing: Record<string, unknown> | null | undefined): string {
  const priceCurrency = normalizeString((listing as { price_currency?: unknown; priceCurrency?: unknown } | null | undefined)?.price_currency
    ?? (listing as { price_currency?: unknown; priceCurrency?: unknown } | null | undefined)?.priceCurrency
    ?? (listing as { currency?: unknown } | null | undefined)?.currency
    ?? "EUR");
  return priceCurrency || "EUR";
}

export function getAuthenticationFeeAmount(listing: Record<string, unknown> | null | undefined): number {
  const raw = (listing as { authentication_fee_amount?: unknown; authFeeAmount?: unknown } | null | undefined)?.authentication_fee_amount
    ?? (listing as { authentication_fee_amount?: unknown; authFeeAmount?: unknown } | null | undefined)?.authFeeAmount;
  const configured = normalizeAmount(raw, NaN);
  if (Number.isFinite(configured)) {
    return configured;
  }
  const mode = getServiceMode(listing);
  return mode === "concierge" ? PREMIUM_AUTH_FEE : DEFAULT_AUTH_FEE;
}

export function buildOrderNumber(prefix = "IR"): string {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

export function buildTransferGroup(orderId: string): string {
  return `iris_${orderId}`;
}

export function calculateLineFees(listing: Record<string, unknown>, quantity = 1) {
  const price = normalizeAmount((listing as { price?: unknown }).price, 0);
  const subtotal = price * Math.max(1, quantity);
  const mode = getServiceMode(listing);
  const buyerFee = subtotal * (mode === "concierge" ? 0 : BUYER_FEE_RATE);
  const sellerFee = subtotal * (mode === "concierge" ? CONCIERGE_SELLER_FEE_RATE : SELLER_FEE_RATE);
  const authFee = getAuthenticationFeeAmount(listing) * Math.max(1, quantity);
  return {
    price,
    subtotal,
    buyerFee,
    sellerFee,
    authFee,
    sellerNet: Math.max(0, subtotal - sellerFee - authFee),
    mode,
    currency: getListingCurrency(listing),
  };
}

export function calculateCheckoutTotals(items: Array<{ listing: Record<string, unknown>; quantity?: number }>, shippingFee = 0) {
  const totals = items.reduce((acc, entry) => {
    const line = calculateLineFees(entry.listing, entry.quantity || 1);
    acc.subtotal += line.subtotal;
    acc.buyerFee += line.buyerFee;
    acc.sellerFee += line.sellerFee;
    acc.authFee += line.authFee;
    acc.sellerNet += line.sellerNet;
    acc.currency = acc.currency || line.currency;
    acc.lineItems.push({
      listingId: String((entry.listing as { id?: unknown }).id ?? ""),
      title: normalizeString((entry.listing as { name?: unknown }).name ?? ""),
      brand: normalizeString((entry.listing as { brand?: unknown }).brand ?? ""),
      quantity: Math.max(1, entry.quantity || 1),
      unitAmount: line.price,
      subtotal: line.subtotal,
      buyerFee: line.buyerFee,
      sellerFee: line.sellerFee,
      authFee: line.authFee,
      serviceMode: line.mode,
      currency: line.currency,
      sellerEmail: normalizeEmail((entry.listing as { owner_email?: unknown; ownerEmail?: unknown }).owner_email
        ?? (entry.listing as { owner_email?: unknown; ownerEmail?: unknown }).ownerEmail
        ?? ""),
    });
    return acc;
  }, {
    subtotal: 0,
    buyerFee: 0,
    sellerFee: 0,
    authFee: 0,
    sellerNet: 0,
    shippingFee: normalizeAmount(shippingFee, 0),
    total: 0,
    currency: "EUR",
    lineItems: [] as Array<Record<string, unknown>>,
  });
  totals.total = totals.subtotal + totals.shippingFee + totals.buyerFee + totals.authFee;
  return totals;
}

export function buildOrderPayload(args: {
  buyer: { id?: string; email?: string; name?: string };
  items: Array<{ listing: Record<string, unknown>; quantity?: number }>;
  shipping?: Record<string, unknown>;
  totals: ReturnType<typeof calculateCheckoutTotals>;
  source?: string;
  status?: string;
  payment?: Record<string, unknown>;
  offerId?: string | null;
  paymentStatus?: string;
  orderId?: string;
  orderNumber?: string;
}) {
  const orderId = args.orderId ?? `ord_${uuid("iris")}`;
  const createdAt = Date.now();
  const sellerEmails = Array.from(new Set(args.items.map((entry) => {
    const listing = entry.listing as Record<string, unknown>;
    return normalizeEmail((listing.owner_email ?? listing.ownerEmail ?? listing.seller_email ?? listing.sellerEmail) as string);
  }).filter(Boolean)));
  const payloadItems = args.totals.lineItems.map((line, index) => {
    const item = args.items[index];
    const listing = item.listing;
    return {
      listingId: String((listing.id ?? line.listingId) ?? ""),
      productId: String((listing.id ?? line.listingId) ?? ""),
      productName: normalizeString(listing.name ?? line.title),
      productBrand: normalizeString(listing.brand ?? line.brand),
      sellerEmail: normalizeEmail((listing.owner_email ?? listing.ownerEmail ?? listing.seller_email ?? line.sellerEmail) as string),
      quantity: line.quantity,
      unitAmount: line.unitAmount,
      lineSubtotal: line.subtotal,
      buyerFeeAmount: line.buyerFee,
      sellerFeeAmount: line.sellerFee,
      authenticationFeeAmount: line.authFee,
      lineTotalAmount: line.subtotal + line.buyerFee + line.authFee,
      serviceMode: line.serviceMode,
      lineStatus: "paid",
      image: (listing.image_url ?? listing.imageUrl ?? ""),
      condition: listing.condition_label ?? listing.conditionLabel ?? "",
      currency: line.currency,
    };
  });
  return {
    id: orderId,
    number: args.orderNumber ?? buildOrderNumber(),
    buyer_id: args.buyer.id ?? null,
    buyer_email: normalizeEmail(args.buyer.email),
    buyer_name: normalizeString(args.buyer.name),
    seller_emails: sellerEmails,
    items: payloadItems,
    shipping: {
      name: normalizeString(args.shipping?.name ?? args.shipping?.shipping_name ?? ""),
      address: normalizeString(args.shipping?.address ?? args.shipping?.shipping_address ?? ""),
      city: normalizeString(args.shipping?.city ?? args.shipping?.shipping_city ?? ""),
      zip: normalizeString(args.shipping?.zip ?? args.shipping?.postcode ?? args.shipping?.postalCode ?? args.shipping?.shipping_zip ?? ""),
      province: normalizeString(args.shipping?.province ?? args.shipping?.state ?? args.shipping?.county ?? args.shipping?.shipping_province ?? ""),
      country: normalizeString(args.shipping?.country ?? args.shipping?.shipping_country ?? ""),
      phone: normalizeString(args.shipping?.phone ?? args.shipping?.shipping_phone ?? ""),
      note: normalizeString(args.shipping?.note ?? args.shipping?.shipping_note ?? ""),
      carrier: normalizeString(args.shipping?.carrier ?? ""),
      tracking_number: normalizeString(args.shipping?.tracking_number ?? ""),
    },
    status: args.status ?? "paid",
    payment: {
      provider: "stripe",
      status: args.paymentStatus ?? "captured",
      subtotal: args.totals.subtotal,
      buyerFeeAmount: args.totals.buyerFee,
      sellerFeeAmount: args.totals.sellerFee,
      authenticationFeeAmount: args.totals.authFee,
      shippingAmount: args.totals.shippingFee,
      totalAmount: args.totals.total,
      currency: args.totals.currency,
      source: args.source ?? "checkout",
      ...(args.payment ?? {}),
    },
    timeline: [
      {
        id: `timeline_${createdAt}`,
        kind: "order_created",
        title: "Order created",
        at: toIsoString(createdAt),
      },
    ],
    support_ticket_ids: [],
    email_ids: [],
    notification_ids: [],
    review_status: "pending",
    created_at_ms: createdAt,
    subtotal: args.totals.subtotal,
    shipping_cost: args.totals.shippingFee,
    total: args.totals.total,
    offer_id: args.offerId ?? null,
  };
}

export function buildOfferOrderPayload(args: {
  buyer: { id?: string; email?: string; name?: string };
  offer: Record<string, unknown>;
  listing: Record<string, unknown>;
  payment?: Record<string, unknown>;
}) {
  const listing = args.listing;
  const offerAmount = normalizeAmount((args.offer.offer_amount ?? args.offer.offerAmount ?? args.offer.amount), 0);
  const shippingSnapshot = (args.offer.shipping_snapshot ?? args.offer.shippingSnapshot ?? {}) as Record<string, unknown>;
  const totals = calculateCheckoutTotals([{ listing, quantity: 1 }], normalizeAmount(shippingSnapshot.shippingFee ?? shippingSnapshot.shipping_fee ?? 0, 0));
  totals.subtotal = offerAmount;
  totals.total = offerAmount + totals.shippingFee + totals.buyerFee + totals.authFee;
  totals.sellerNet = Math.max(0, offerAmount - totals.sellerFee - totals.authFee);
  return buildOrderPayload({
    buyer: args.buyer,
    items: [{ listing, quantity: 1 }],
    shipping: shippingSnapshot,
    totals,
    source: "offer",
    status: "paid",
    paymentStatus: "captured",
    offerId: String(args.offer.id ?? ""),
    payment: {
      offerId: String(args.offer.id ?? ""),
      authorizationReference: String(args.offer.authorization_reference ?? args.offer.authorizationReference ?? ""),
      paymentIntentReference: String(args.offer.payment_intent_reference ?? args.offer.paymentIntentReference ?? ""),
      paymentAuthorizationStatus: "paid",
      capturedAtMs: Date.now(),
      ...args.payment,
    },
  });
}
