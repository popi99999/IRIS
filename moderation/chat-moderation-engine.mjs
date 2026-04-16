import {
  moderateChatMessage,
  normalizeMessageForModeration,
  redactMessageForAudit,
} from "../services/messageModeration.mjs";

export { moderateChatMessage, normalizeMessageForModeration, redactMessageForAudit };

export const EMPTY_CHAT_MODERATION_STATE = {
  violationCount: 0,
  lastViolationAtMs: 0,
  lastViolationReason: "",
  lastAction: "",
  chatBanned: false,
  chatBannedUntil: null,
  moderationNotes: {},
};

export function normalizeChatModerationState(record, now = Date.now()) {
  const source = record || {};
  const violationCount = Math.max(
    0,
    Number(source.violationCount ?? source.violation_count ?? EMPTY_CHAT_MODERATION_STATE.violationCount ?? 0),
  );
  const lastViolationAtMs = Math.max(
    0,
    Number(source.lastViolationAtMs ?? source.last_violation_at_ms ?? EMPTY_CHAT_MODERATION_STATE.lastViolationAtMs ?? 0),
  );
  const lastViolationReason = String(
    source.lastViolationReason ?? source.last_violation_reason ?? EMPTY_CHAT_MODERATION_STATE.lastViolationReason ?? "",
  );
  const lastAction = String(
    source.lastAction ?? source.last_action ?? EMPTY_CHAT_MODERATION_STATE.lastAction ?? "",
  );
  const chatBanned = Boolean(source.chatBanned ?? source.chat_banned ?? EMPTY_CHAT_MODERATION_STATE.chatBanned ?? false);
  const chatBannedUntil = source.chatBannedUntil ?? source.chat_banned_until ?? EMPTY_CHAT_MODERATION_STATE.chatBannedUntil ?? null;
  const moderationNotes = source.moderationNotes ?? source.moderation_notes ?? EMPTY_CHAT_MODERATION_STATE.moderationNotes ?? {};
  const bannedUntilMs = chatBannedUntil ? new Date(chatBannedUntil).getTime() : 0;
  const isSuspended = Boolean(chatBanned || (bannedUntilMs && bannedUntilMs > now));
  return {
    userId: String(source.userId || source.user_id || ""),
    violationCount,
    lastViolationAtMs,
    lastViolationReason,
    lastAction,
    chatBanned,
    chatBannedUntil,
    moderationNotes,
    isSuspended,
    activeWarningLevel: isSuspended ? 3 : Math.min(2, violationCount),
  };
}

export function applyModerationEscalation(currentState, moderationResult, now = Date.now()) {
  const current = normalizeChatModerationState(currentState, now);
  if (current.isSuspended) {
    return {
      action: "chat_banned",
      strikeCount: current.violationCount,
      shouldBan: true,
      state: current,
    };
  }
  if (!moderationResult || moderationResult.allowed || !moderationResult.shouldIncrementStrike) {
    return {
      action: "allow",
      strikeCount: current.violationCount,
      shouldBan: current.isSuspended,
      state: current,
    };
  }

  const nextStrikeCount = current.violationCount + 1;
  const shouldBan = Boolean(nextStrikeCount >= 3);
  const action = shouldBan ? "chat_banned" : nextStrikeCount === 2 ? "warning_2" : "warning_1";
  const nextState = normalizeChatModerationState({
    userId: current.userId,
    violationCount: nextStrikeCount,
    lastViolationAtMs: now,
    lastViolationReason: moderationResult.violationType || "mixed",
    lastAction: action,
    chatBanned: shouldBan,
    chatBannedUntil: null,
    moderationNotes: Object.assign({}, current.moderationNotes, {
      lastMatchedRules: moderationResult.matchedRules || [],
      lastRiskLevel: moderationResult.riskLevel || "",
      lastScore: Number(moderationResult.score || 0),
      lastReasonCodes: moderationResult.reasonCodes || [],
    }),
  }, now);

  return {
    action,
    strikeCount: nextStrikeCount,
    shouldBan,
    state: nextState,
  };
}

export function getModerationStageCopy(stage, locale = "it") {
  const isItalian = String(locale || "it").toLowerCase().startsWith("it");
  const copy = {
    warning_1: {
      title: isItalian ? "Messaggio bloccato" : "Message blocked",
      text: isItalian
        ? "Non puoi condividere contatti esterni, piattaforme esterne, metodi di pagamento esterni o emoji. Tutta la comunicazione e tutti i pagamenti devono restare su IRIS. Questa e' la tua prima violazione."
        : "You cannot share external contacts, external platforms, external payment methods, or emoji. All communication and all payments must stay on IRIS. This is your first violation.",
    },
    warning_2: {
      title: isItalian ? "Ultimo avvertimento" : "Final warning",
      text: isItalian
        ? "Hai tentato di aggirare le regole della piattaforma. Un'altra violazione comportera' la sospensione definitiva della chat. Potrai ancora acquistare e vendere su IRIS, ma non usare la chat."
        : "You attempted to bypass the platform rules. One more violation will permanently suspend chat. You will still be able to buy and sell on IRIS, but not use chat.",
    },
    chat_banned: {
      title: isItalian ? "Chat sospesa" : "Chat suspended",
      text: isItalian
        ? "Il tuo accesso alla chat e' stato sospeso in modo definitivo per violazione ripetuta delle regole di sicurezza di IRIS. Puoi ancora acquistare e vendere su IRIS, ma non puoi piu usare la chat. Contatta il supporto se ritieni che si tratti di un errore."
        : "Your chat access has been permanently suspended for repeated violations of IRIS security rules. You can still buy and sell on IRIS, but you can no longer use chat. Contact support if you believe this is an error.",
    },
  };
  return copy[stage] || copy.warning_1;
}

export function isChatSuspended(state, now = Date.now()) {
  return normalizeChatModerationState(state, now).isSuspended;
}
