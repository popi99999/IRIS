export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, stripe-signature, x-request-id",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Security headers applied to all Edge Function responses
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=(self)",
};

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export function isOptionsRequest(request: Request): boolean {
  return request.method.toUpperCase() === "OPTIONS";
}

export function handleOptions(request: Request): Response | null {
  if (!isOptionsRequest(request)) {
    return null;
  }
  return new Response("ok", { headers: corsHeaders });
}

export function jsonResponse(
  data: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  Object.entries(securityHeaders).forEach(([key, value]) => headers.set(key, value));
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorResponse(
  message: string,
  status = 400,
  details?: unknown,
): Response {
  return jsonResponse({
    ok: false,
    error: message,
    details,
  }, { status });
}

export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  Object.entries(securityHeaders).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
