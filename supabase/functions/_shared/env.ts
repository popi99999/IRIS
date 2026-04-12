export const PUBLIC_SITE_URL_FALLBACK = "https://popi99999.github.io/IRIS";

export function getEnv(name: string, fallback = ""): string {
  return Deno.env.get(name) ?? fallback;
}

export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getPublicSiteUrl(): string {
  return trimTrailingSlash(getEnv("PUBLIC_SITE_URL", PUBLIC_SITE_URL_FALLBACK));
}

export async function readJsonBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  const raw = await request.text();
  if (!raw.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(lower)) return true;
    if (["false", "0", "no", "n", "off"].includes(lower)) return false;
  }
  return fallback;
}

export function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeAmount(value: unknown, fallback = 0): number {
  return Math.max(0, normalizeNumber(value, fallback));
}

export function ensureArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function toIsoString(value: number | Date = Date.now()): string {
  return new Date(value).toISOString();
}

export function uuid(prefix = "iris"): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
