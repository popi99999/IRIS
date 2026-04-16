import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";
import { getEnv, normalizeEmail, normalizeString, requireEnv } from "./env.ts";
import { HttpError } from "./http.ts";

type AdminClient = SupabaseClient;

let supabaseAdmin: AdminClient | null = null;

function createAdminClient(): AdminClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export function getSupabaseAdmin(): AdminClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createAdminClient();
  }
  return supabaseAdmin;
}

export function getSupabasePublicClient(): SupabaseClient {
  const key = requireEnv("SUPABASE_ANON_KEY");
  return createClient(requireEnv("SUPABASE_URL"), key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getRequestUser(request: Request): Promise<User> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    throw new HttpError("Unauthorized", 401);
  }
  const client = getSupabaseAdmin();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    throw new HttpError("Unauthorized", 401, error?.message ?? "Unable to resolve session");
  }
  return data.user;
}

export async function getRequestUserOrNull(request: Request): Promise<User | null> {
  try {
    return await getRequestUser(request);
  } catch {
    return null;
  }
}

export async function fetchProfileById(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function fetchProfileByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .ilike("email", normalized)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function fetchAdminAccessByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }
  const { data, error } = await getSupabaseAdmin()
    .from("admin_users")
    .select("*")
    .ilike("email", normalized)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function isUserAdmin(user: Pick<User, "id" | "email"> | null | undefined) {
  if (!user) {
    return false;
  }
  let adminAccess = null;
  if (user.id) {
    const { data, error } = await getSupabaseAdmin()
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      throw error;
    }
    adminAccess = data ?? null;
  }
  if (!adminAccess && user.email) {
    adminAccess = await fetchAdminAccessByEmail(user.email);
  }
  return Boolean(adminAccess && normalizeString(adminAccess.role ?? "admin").toLowerCase() === "admin");
}

export async function updateProfilePayoutSettings(
  userId: string,
  patch: Record<string, unknown>,
) {
  const current = await fetchProfileById(userId);
  const merged = {
    ...(current?.payout_settings ?? {}),
    ...patch,
  };
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .update({ payout_settings: merged })
    .eq("id", userId)
    .select("*")
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? current;
}

export async function fetchListingById(listingId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function fetchOfferById(offerId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function fetchOrderById(orderId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function upsertNotification(payload: Record<string, unknown>) {
  const record = {
    id: payload.id ?? `ntf_${crypto.randomUUID()}`,
    recipient_id: payload.recipient_id ?? null,
    recipient_email: payload.recipient_email ?? "",
    audience: payload.audience ?? "user",
    kind: payload.kind ?? "system",
    title: payload.title ?? "IRIS",
    body: payload.body ?? "",
    link: payload.link ?? "",
    conversation_id: payload.conversation_id ?? "",
    order_id: payload.order_id ?? "",
    product_id: payload.product_id ?? "",
    scope: payload.scope ?? "",
    unread: payload.unread ?? true,
    created_at_ms: payload.created_at_ms ?? Date.now(),
    updated_at_ms: payload.updated_at_ms ?? Date.now(),
  };
  const { data, error } = await getSupabaseAdmin()
    .from("notifications")
    .insert(record)
    .select("*")
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? record;
}

export async function tryInsertEmailOutbox(record: Record<string, unknown>) {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("email_outbox")
      .insert(record)
      .select("*")
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data ?? record;
  } catch (_error) {
    return null;
  }
}

export async function tryInsertIntoTable<T extends Record<string, unknown>>(
  table: string,
  record: T | T[],
) {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(table)
      .insert(record)
      .select("*");
    if (error) {
      throw error;
    }
    return data ?? null;
  } catch {
    return null;
  }
}

export async function tryUpsertIntoTable<T extends Record<string, unknown>>(
  table: string,
  record: T | T[],
  onConflict: string,
) {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(table)
      .upsert(record, { onConflict })
      .select("*");
    if (error) {
      throw error;
    }
    return data ?? null;
  } catch {
    return null;
  }
}
