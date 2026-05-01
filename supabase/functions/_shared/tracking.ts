import { HttpError } from "./http.ts";

type CarrierConfig = {
  key: string;
  label: string;
  aliases: string[];
  domains: string[];
  url: string;
};

export const trackingStatuses = [
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
] as const;

export const carriers: Record<string, CarrierConfig> = {
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
};

const statusAliases = new Map<string, string>([
  ["label created", "label_created"],
  ["pre transit", "label_created"],
  ["accepted", "accepted_by_carrier"],
  ["accepted by carrier", "accepted_by_carrier"],
  ["picked up", "shipped"],
  ["pickup", "shipped"],
  ["shipped", "shipped"],
  ["in transit", "in_transit"],
  ["transit", "in_transit"],
  ["arrived", "arrived_at_facility"],
  ["arrived at facility", "arrived_at_facility"],
  ["out for delivery", "out_for_delivery"],
  ["in consegna", "out_for_delivery"],
  ["delivery attempted", "delivery_attempted"],
  ["delivered", "delivered"],
  ["consegnato", "delivered"],
  ["exception", "exception"],
  ["failed", "exception"],
  ["returned", "returned_to_sender"],
  ["return to sender", "returned_to_sender"],
  ["returned to sender", "returned_to_sender"],
]);

const trackingRank: Record<string, number> = {
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
};

const privateHostPatterns = [
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^\[?::1\]?$/i,
];

export function normalizeCarrier(value: unknown): CarrierConfig | null {
  const needle = String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!needle) return null;
  return Object.values(carriers).find((carrier) =>
    carrier.key.replace(/_/g, " ") === needle ||
    carrier.label.toLowerCase() === needle ||
    carrier.aliases.some((alias) => alias.toLowerCase() === needle)
  ) ?? null;
}

export function sanitizeTrackingNumber(value: unknown): string {
  const compact = String(value ?? "").trim().replace(/\s+/g, "");
  if (compact.length < 4 || compact.length > 80) return "";
  if (/https?:|javascript:|data:|<|>|\(|\)|;|\\/.test(compact.toLowerCase())) return "";
  if (!/^[a-z0-9._-]+$/i.test(compact)) return "";
  return compact.toUpperCase();
}

function isPrivateHost(hostname: string): boolean {
  return privateHostPatterns.some((pattern) => pattern.test(hostname.trim().toLowerCase()));
}

function hostMatches(hostname: string, domains: string[]): boolean {
  const host = hostname.toLowerCase();
  return domains.some((domain) => host === domain.toLowerCase() || host.endsWith(`.${domain.toLowerCase()}`));
}

export function validateTrackingUrl(url: unknown, carrierValue: unknown) {
  const carrier = normalizeCarrier(carrierValue);
  if (!carrier) return { ok: false, reason: "invalid_carrier" };
  try {
    const parsed = new URL(String(url ?? ""));
    if (parsed.protocol !== "https:") return { ok: false, reason: "invalid_protocol" };
    if (isPrivateHost(parsed.hostname)) return { ok: false, reason: "private_host" };
    if (!hostMatches(parsed.hostname, carrier.domains)) return { ok: false, reason: "untrusted_domain" };
    return { ok: true, url: parsed.toString(), carrier };
  } catch {
    return { ok: false, reason: "malformed_url" };
  }
}

export function generateTrackingUrl(carrierValue: unknown, trackingNumber: unknown): string {
  const carrier = normalizeCarrier(carrierValue);
  const safeTracking = sanitizeTrackingNumber(trackingNumber);
  if (!carrier) throw new HttpError("Invalid carrier", 400);
  if (!safeTracking) throw new HttpError("Invalid tracking number", 400);
  const url = carrier.url.replace("{tracking}", encodeURIComponent(safeTracking));
  const validation = validateTrackingUrl(url, carrier.key);
  if (!validation.ok) throw new HttpError("Unsafe tracking URL", 400, validation.reason);
  return validation.url as string;
}

export function normalizeTrackingStatus(value: unknown): string {
  const input = String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!input) return "unknown";
  const direct = input.replace(/\s+/g, "_");
  if ((trackingStatuses as readonly string[]).includes(direct)) return direct;
  if (statusAliases.has(input)) return statusAliases.get(input) ?? "unknown";
  if (input.includes("out") && input.includes("delivery")) return "out_for_delivery";
  if (input.includes("deliver")) return "delivered";
  if (input.includes("transit")) return "in_transit";
  if (input.includes("attempt")) return "delivery_attempted";
  if (input.includes("return")) return "returned_to_sender";
  if (input.includes("exception") || input.includes("failed")) return "exception";
  return "unknown";
}

export function orderStatusFromTrackingStatus(status: unknown): string {
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

export function shouldApplyTrackingEvent(currentStatus: unknown, nextStatus: unknown, currentOccurredAt?: unknown, nextOccurredAt?: unknown): boolean {
  const current = normalizeTrackingStatus(currentStatus);
  const next = normalizeTrackingStatus(nextStatus);
  if (next === "unknown") return false;
  if (current === "delivered" && !["exception", "returned_to_sender"].includes(next)) return false;
  const currentTime = currentOccurredAt ? Date.parse(String(currentOccurredAt)) : 0;
  const nextTime = nextOccurredAt ? Date.parse(String(nextOccurredAt)) : Date.now();
  if (Number.isFinite(currentTime) && Number.isFinite(nextTime) && nextTime < currentTime && (trackingRank[next] ?? 0) < (trackingRank[current] ?? 0)) {
    return false;
  }
  return (trackingRank[next] ?? 0) >= (trackingRank[current] ?? 0) || ["exception", "returned_to_sender"].includes(next);
}

export function sanitizeTrackingText(value: unknown, maxLength = 500): string {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyTrackingWebhookSignature(secret: string, rawBody: string, signatureHeader: string): Promise<boolean> {
  if (!secret || !signatureHeader) return false;
  const normalized = signatureHeader.replace(/^sha256=/i, "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) return false;
  const expected = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqual(expected, normalized);
}

