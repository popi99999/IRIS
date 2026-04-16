import { normalizeEmail, normalizeString, readJsonBody, uuid } from "../_shared/env.ts";
import { handleOptions, errorResponse, HttpError, jsonResponse } from "../_shared/http.ts";
import { getRequestUser, getSupabaseAdmin, isUserAdmin } from "../_shared/supabase.ts";
import {
  applyModerationEscalation,
  moderateChatMessage,
  normalizeChatModerationState,
  redactMessageForAudit,
} from "../../../moderation/chat-moderation-engine.mjs";

type ConversationSnapshot = {
  id?: string;
  listingId?: string;
  productId?: string;
  sellerId?: string;
  sellerEmail?: string;
  sellerName?: string;
  buyerId?: string;
  buyerEmail?: string;
  buyerName?: string;
};

type SendChatMessageBody = {
  conversationId?: string;
  body?: string;
  conversation?: ConversationSnapshot;
};

function normalizeUuid(value: unknown) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function buildConversationPayload(snapshot: ConversationSnapshot, now: number) {
  return {
    id: String(snapshot.id || ""),
    listing_id: normalizeString(snapshot.listingId || snapshot.productId || "") || null,
    product_id: normalizeString(snapshot.productId || snapshot.listingId || "") || null,
    seller_id: normalizeUuid(snapshot.sellerId),
    seller_email: normalizeEmail(snapshot.sellerEmail),
    seller_name: normalizeString(snapshot.sellerName),
    buyer_id: normalizeUuid(snapshot.buyerId),
    buyer_email: normalizeEmail(snapshot.buyerEmail),
    buyer_name: normalizeString(snapshot.buyerName),
    unread_count: 0,
    updated_at_ms: now,
    created_at_ms: now,
  };
}

function serializeModerationState(record: Record<string, unknown> | null | undefined) {
  const normalized = normalizeChatModerationState(record ?? {});
  return {
    userId: normalized.userId,
    violationCount: normalized.violationCount,
    lastViolationAtMs: normalized.lastViolationAtMs,
    lastViolationReason: normalized.lastViolationReason,
    lastAction: normalized.lastAction,
    chatBanned: normalized.chatBanned,
    chatBannedUntil: normalized.chatBannedUntil,
    isSuspended: normalized.isSuspended,
    moderationNotes: normalized.moderationNotes,
  };
}

function resolveConversationRole(
  conversation: Record<string, unknown>,
  user: { id?: string | null; email?: string | null },
  adminAllowed: boolean,
) {
  if (adminAllowed) {
    return "admin";
  }
  const userId = String(user.id || "");
  const userEmail = normalizeEmail(user.email || "");
  const buyerId = String(conversation.buyer_id ?? conversation.buyerId ?? "");
  const sellerId = String(conversation.seller_id ?? conversation.sellerId ?? "");
  const buyerEmail = normalizeEmail(conversation.buyer_email ?? conversation.buyerEmail ?? "");
  const sellerEmail = normalizeEmail(conversation.seller_email ?? conversation.sellerEmail ?? "");

  if (buyerId && buyerId === userId && buyerEmail && buyerEmail === userEmail) {
    return "buyer";
  }
  if (sellerId && sellerId === userId && sellerEmail && sellerEmail === userEmail) {
    return "seller";
  }
  if (!buyerId && buyerEmail && buyerEmail === userEmail) {
    return "buyer";
  }
  if (!sellerId && sellerEmail && sellerEmail === userEmail) {
    return "seller";
  }
  throw new HttpError("Conversation access denied", 403);
}

async function fetchConversation(conversationId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) {
    throw new HttpError("Unable to load conversation", 500, error.message);
  }
  return data ?? null;
}

async function ensureConversation(
  conversationId: string,
  snapshot: ConversationSnapshot | undefined,
  user: { id?: string | null; email?: string | null },
  adminAllowed: boolean,
) {
  let conversation = await fetchConversation(conversationId);
  if (conversation) {
    return conversation;
  }
  if (!snapshot || String(snapshot.id || "") !== conversationId) {
    throw new HttpError("Conversation not found", 404);
  }
  const role = resolveConversationRole({
    buyer_id: snapshot.buyerId,
    buyer_email: snapshot.buyerEmail,
    seller_id: snapshot.sellerId,
    seller_email: snapshot.sellerEmail,
  }, user, adminAllowed);
  const now = Date.now();
  const payload = buildConversationPayload({
    ...snapshot,
    buyerId: role === "buyer" ? String(user.id || snapshot.buyerId || "") : snapshot.buyerId,
    buyerEmail: role === "buyer" ? String(user.email || snapshot.buyerEmail || "") : snapshot.buyerEmail,
    sellerId: role === "seller" ? String(user.id || snapshot.sellerId || "") : snapshot.sellerId,
    sellerEmail: role === "seller" ? String(user.email || snapshot.sellerEmail || "") : snapshot.sellerEmail,
  }, now);
  const { data, error } = await getSupabaseAdmin()
    .from("conversations")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) {
    throw new HttpError("Unable to create conversation", 500, error.message);
  }
  return data;
}

async function fetchModerationState(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("chat_moderation_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new HttpError("Unable to load moderation state", 500, error.message);
  }
  return data ?? null;
}

async function persistModerationState(userId: string, nextState: ReturnType<typeof normalizeChatModerationState>) {
  const payload = {
    user_id: userId,
    violation_count: nextState.violationCount,
    last_violation_at_ms: nextState.lastViolationAtMs,
    last_violation_at: nextState.lastViolationAtMs ? new Date(nextState.lastViolationAtMs).toISOString() : null,
    last_violation_reason: nextState.lastViolationReason,
    last_action: nextState.lastAction,
    chat_banned: nextState.chatBanned,
    chat_banned_until: nextState.chatBannedUntil,
    moderation_notes: nextState.moderationNotes ?? {},
  };
  const { data, error } = await getSupabaseAdmin()
    .from("chat_moderation_users")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) {
    throw new HttpError("Unable to store moderation state", 500, error.message);
  }
  return data;
}

async function insertModerationEvent(payload: Record<string, unknown>) {
  const { error } = await getSupabaseAdmin()
    .from("chat_moderation_events")
    .insert(payload);
  if (error) {
    throw new HttpError("Unable to store moderation audit event", 500, error.message);
  }
}

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const user = await getRequestUser(request);
    const adminAllowed = await isUserAdmin(user);
    const body = await readJsonBody<SendChatMessageBody>(request);
    const conversationId = String(body.conversationId ?? body.conversation?.id ?? "").trim();
    const rawMessage = String(body.body ?? "").trim();
    if (!conversationId) {
      throw new HttpError("Missing conversation id", 400);
    }
    if (!rawMessage) {
      throw new HttpError("Missing message body", 400);
    }
    if (rawMessage.length > 1800) {
      throw new HttpError("Message too long", 400);
    }

    const conversation = await ensureConversation(conversationId, body.conversation, user, adminAllowed);
    const senderRole = resolveConversationRole(conversation, user, adminAllowed);
    const now = Date.now();
    const moderationStateRow = await fetchModerationState(String(user.id || ""));
    const moderationState = normalizeChatModerationState({
      ...(moderationStateRow || {}),
      userId: String(user.id || ""),
    }, now);

    if (moderationState.isSuspended) {
      await insertModerationEvent({
        id: uuid("chatmod"),
        user_id: String(user.id || ""),
        conversation_id: conversationId,
        raw_message_redacted: redactMessageForAudit(rawMessage),
        normalized_forms: {},
        triggered_rules: [],
        matched_fragments: [],
        violation_type: "mixed",
        confidence: 1,
        strike_count: moderationState.violationCount,
        action_taken: "chat_banned",
        created_at_ms: now,
      });
      return jsonResponse({
        ok: true,
        allowed: false,
        blocked: true,
        action: "chat_banned",
        moderationState: serializeModerationState(moderationState),
      });
    }

    const moderation = moderateChatMessage(rawMessage, {
      channel: "chat",
      actorRole: senderRole,
    });

    if (!moderation.allowed) {
      const escalation = applyModerationEscalation(moderationState, moderation, now);
      const storedState = await persistModerationState(String(user.id || ""), escalation.state);
      await insertModerationEvent({
        id: uuid("chatmod"),
        user_id: String(user.id || ""),
        conversation_id: conversationId,
        raw_message_redacted: redactMessageForAudit(rawMessage),
        normalized_forms: moderation.normalizedForms,
        triggered_rules: moderation.matchedRules,
        matched_fragments: moderation.matchedFragments,
        violation_type: moderation.violationType,
        confidence: moderation.confidence,
        strike_count: escalation.strikeCount,
        action_taken: escalation.action,
        created_at_ms: now,
      });
      return jsonResponse({
        ok: true,
        allowed: false,
        blocked: true,
        action: escalation.action,
        moderation,
        moderationState: serializeModerationState({
          ...(storedState || {}),
          userId: String(user.id || ""),
        }),
      });
    }

    const messageId = uuid("msg");
    const { data: insertedMessage, error: insertError } = await getSupabaseAdmin()
      .from("conversation_messages")
      .insert({
        id: messageId,
        conversation_id: conversationId,
        sender_role: senderRole === "admin" ? "seller" : senderRole,
        sender_email: normalizeEmail(user.email || ""),
        body: rawMessage,
        sent_at_ms: now,
        time_label: "",
      })
      .select("*")
      .single();
    if (insertError) {
      throw new HttpError("Unable to persist chat message", 500, insertError.message);
    }

    const { error: conversationUpdateError } = await getSupabaseAdmin()
      .from("conversations")
      .update({
        updated_at_ms: now,
      })
      .eq("id", conversationId);
    if (conversationUpdateError) {
      throw new HttpError("Unable to update conversation", 500, conversationUpdateError.message);
    }

    return jsonResponse({
      ok: true,
      allowed: true,
      blocked: false,
      conversationId,
      message: insertedMessage,
      moderationState: serializeModerationState({
        ...(moderationStateRow || {}),
        userId: String(user.id || ""),
      }),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.details);
    }
    console.error("[IRIS] send-chat-message failed", error);
    return errorResponse("Unable to send chat message", 500, error instanceof Error ? error.message : String(error));
  }
});
