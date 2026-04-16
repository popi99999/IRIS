const ZERO_WIDTH_REGEX = /[\u200B-\u200D\u2060\uFEFF\u00AD]/gu;
const DIACRITICS_REGEX = /[\u0300-\u036f]/gu;
const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|\uFE0F|\u20E3)/u;
const EMAIL_REGEX = /\b[a-z0-9._%+-]+(?:\s*@\s*|@)[a-z0-9.-]+(?:\s*\.\s*|\.)[a-z]{2,}\b/giu;
const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s]+/giu;
const DOMAIN_REGEX = /\b[a-z0-9-]+(?:\s*(?:\.|punto)\s*)+(?:it|com|net|org|io|me|co|eu|fr|de|uk)\b/giu;
const IBAN_REGEX = /\b[a-z]{2}\s*\d{2}(?:\s*[a-z0-9]{4}){3,7}\b/giu;
const HANDLE_REGEX = /(^|\s)@[a-z0-9_.]{2,32}\b/giu;
const SEPARATOR_REGEX = /[\s._\-\/\\|,:;'"`~()[\]{}<>+=!?]+/gu;
const NON_TEXT_REGEX = /[^a-z0-9@\s]/gu;
const PHONE_CANDIDATE_REGEX = /(?:\+?\d[\d\s().-]{6,}\d)/gu;
const MAX_AUDIT_LENGTH = 220;

const STRONG_PLATFORM_TERMS = [
  "instagram",
  "insta",
  "vinted",
  "vestiaire",
  "vestiaire collective",
  "grailed",
  "depop",
  "subito",
  "subito it",
  "subito.it",
  "snapchat",
  "telegram",
  "whatsapp",
  "tiktok",
  "tik tok",
  "facebook",
  "messenger",
  "discord",
  "signal",
  "gmail",
  "outlook",
  "imessage",
  "facetime",
  "skype",
  "twitter",
  "ebay",
  "wallapop",
];

const STRONG_PAYMENT_TERMS = [
  "paypal",
  "pay pal",
  "venmo",
  "cashapp",
  "cash app",
  "revolut",
  "postepay",
  "iban",
  "bonifico",
  "wire transfer",
  "bank transfer",
  "pagamento esterno",
  "fuori piattaforma",
  "fuori dal sito",
  "ti pago altrove",
  "facciamo fuori",
  "senza commissioni",
];

const DIRECT_CONTACT_TERMS = [
  "email",
  "e mail",
  "mail",
  "numero",
  "telefono",
  "cellulare",
  "chiamami",
  "scrivimi",
  "contattami",
  "dm",
  "direct",
  "privato",
  "mp",
  "messaggio privato",
  "handle",
  "username",
  "nickname",
  "taggami",
  "cercami",
  "trovami su",
  "ti scrivo su",
  "ci sentiamo su",
  "ci vediamo su",
  "altrove",
];

const CONTEXTUAL_ALIASES = [
  "ig",
  "vc",
  "tg",
  "wa",
  "snap",
  "tele",
];

const CONTACT_CONTEXT_TERMS = [
  "scrivimi",
  "scrivici",
  "contattami",
  "contattaci",
  "sentiamoci",
  "vediamoci",
  "cercami",
  "trovami",
  "taggami",
  "mandami",
  "lascio",
  "ti lascio",
  "ti mando",
  "chiamami",
  "su",
  "fuori",
  "altrove",
  "direttamente",
];

const EXTERNAL_PAYMENT_CONTEXT = [
  "commissioni",
  "pago",
  "pagami",
  "pagarti",
  "pagamento",
  "pagare",
  "accordiamo",
  "accordo",
  "fuori",
];

const ALL_FUZZY_TERMS = Array.from(
  new Set(
    STRONG_PLATFORM_TERMS
      .concat(STRONG_PAYMENT_TERMS)
      .concat([
        "instagram",
        "vinted",
        "vestiairecollective",
        "grailed",
        "depop",
        "subitopuntoit",
        "paypal",
        "telegram",
        "whatsapp",
        "snapchat",
        "discord",
        "revolut",
        "postepay",
      ]),
  ),
);

function stripDiacritics(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(DIACRITICS_REGEX, "");
}

function removeZeroWidth(value) {
  return String(value || "").replace(ZERO_WIDTH_REGEX, "");
}

function replaceLeetspeak(value) {
  return String(value || "").replace(/[013457@$]/g, function (character) {
    switch (character) {
      case "0":
        return "o";
      case "1":
        return "i";
      case "3":
        return "e";
      case "4":
      case "@":
        return "a";
      case "5":
      case "$":
        return "s";
      case "7":
        return "t";
      default:
        return character;
    }
  });
}

function collapseWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function collapseLetterRepeats(value) {
  return String(value || "").replace(/([a-z])\1{2,}/g, "$1");
}

function normalizeTerm(value) {
  const base = replaceLeetspeak(stripDiacritics(removeZeroWidth(String(value || "").toLowerCase())));
  return collapseWhitespace(base.replace(SEPARATOR_REGEX, " ").replace(NON_TEXT_REGEX, " "));
}

function normalizeCondensed(value) {
  return normalizeTerm(value).replace(/\s+/g, "");
}

function levenshteinDistance(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, function (_, rowIndex) {
    return Array.from({ length: b.length + 1 }, function (_, colIndex) {
      if (rowIndex === 0) return colIndex;
      if (colIndex === 0) return rowIndex;
      return 0;
    });
  });
  for (let row = 1; row <= a.length; row += 1) {
    for (let col = 1; col <= b.length; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

function similarityScore(left, right) {
  const longest = Math.max(String(left || "").length, String(right || "").length, 1);
  return 1 - levenshteinDistance(left, right) / longest;
}

function buildLexicon(terms, violationType, rulePrefix) {
  return terms.map(function (term) {
    const cleaned = normalizeTerm(term);
    return {
      term,
      violationType,
      ruleId: `${rulePrefix}:${normalizeCondensed(term) || cleaned}`,
      cleaned,
      condensed: cleaned.replace(/\s+/g, ""),
    };
  });
}

const PLATFORM_LEXICON = buildLexicon(STRONG_PLATFORM_TERMS, "external_platform", "platform");
const PAYMENT_LEXICON = buildLexicon(STRONG_PAYMENT_TERMS, "external_payment", "payment");
const CONTACT_LEXICON = buildLexicon(DIRECT_CONTACT_TERMS, "contact", "contact");
const FUZZY_LEXICON = buildLexicon(ALL_FUZZY_TERMS, "evasion", "evasion");

function uniquePush(target, value) {
  if (value && !target.includes(value)) {
    target.push(value);
  }
}

function findPhoneMatches(rawText) {
  const matches = String(rawText || "").match(PHONE_CANDIDATE_REGEX) || [];
  return matches.filter(function (candidate) {
    return candidate.replace(/\D/g, "").length >= 7;
  });
}

function generateTokenWindows(tokens, maxWindowSize) {
  const windows = [];
  const limit = Math.max(1, Number(maxWindowSize || 1));
  for (let start = 0; start < tokens.length; start += 1) {
    for (let length = 1; length <= limit && start + length <= tokens.length; length += 1) {
      const slice = tokens.slice(start, start + length);
      const joinedWithSpace = slice.join(" ");
      const joinedCondensed = slice.join("");
      if (joinedCondensed.length > 40) {
        continue;
      }
      windows.push({
        tokens: slice,
        spaced: joinedWithSpace,
        condensed: joinedCondensed,
      });
    }
  }
  return windows;
}

export function normalizeMessageForModeration(rawText) {
  const raw = String(rawText || "");
  const rawLower = removeZeroWidth(stripDiacritics(raw.toLowerCase()));
  const cleanedBase = collapseWhitespace(
    rawLower
      .replace(URL_REGEX, function (match) { return ` ${match.replace(/[:/?#.&=_-]+/g, " ")} `; })
      .replace(DOMAIN_REGEX, function (match) { return ` ${match.replace(/\s*(?:\.|punto)\s*/g, " punto ")} `; })
      .replace(SEPARATOR_REGEX, " ")
      .replace(NON_TEXT_REGEX, " "),
  );
  const deobfuscated = collapseWhitespace(collapseLetterRepeats(replaceLeetspeak(cleanedBase)));
  const cleaned = collapseWhitespace(collapseLetterRepeats(cleanedBase));
  const condensed = cleaned.replace(/\s+/g, "");
  const condensedDeobfuscated = deobfuscated.replace(/\s+/g, "");
  const tokenized = cleaned ? cleaned.split(" ").filter(Boolean) : [];
  const tokenizedDeobfuscated = deobfuscated ? deobfuscated.split(" ").filter(Boolean) : [];
  const windows = generateTokenWindows(tokenized, 6);
  const deobfuscatedWindows = generateTokenWindows(tokenizedDeobfuscated, 6);
  return {
    rawLower,
    cleaned,
    condensed,
    tokenized,
    deobfuscated,
    condensedDeobfuscated,
    tokenizedDeobfuscated,
    windows,
    deobfuscatedWindows,
  };
}

function findExactLexiconMatches(normalizedForms, lexicon) {
  const matches = [];
  const allSpacedCandidates = new Set(
    [normalizedForms.cleaned, normalizedForms.deobfuscated]
      .concat(normalizedForms.windows.map(function (entry) { return entry.spaced; }))
      .concat(normalizedForms.deobfuscatedWindows.map(function (entry) { return entry.spaced; }))
      .filter(Boolean),
  );
  const allCondensedCandidates = new Set(
    [normalizedForms.condensed, normalizedForms.condensedDeobfuscated]
      .concat(normalizedForms.windows.map(function (entry) { return entry.condensed; }))
      .concat(normalizedForms.deobfuscatedWindows.map(function (entry) { return entry.condensed; }))
      .filter(Boolean),
  );

  lexicon.forEach(function (entry) {
    const spacedMatch = Array.from(allSpacedCandidates).some(function (candidate) {
      const paddedCandidate = ` ${candidate} `;
      const paddedEntry = ` ${entry.cleaned} `;
      return candidate === entry.cleaned || paddedCandidate.includes(paddedEntry);
    });
    const condensedMatch = Array.from(allCondensedCandidates).some(function (candidate) {
      if (candidate === entry.condensed) {
        return true;
      }
      return entry.condensed.length >= 5 && candidate.includes(entry.condensed);
    });
    if (spacedMatch || condensedMatch) {
      matches.push({
        ruleId: entry.ruleId,
        fragment: entry.term,
        violationType: entry.violationType,
        confidence: entry.violationType === "contact" ? 0.95 : 0.98,
      });
    }
  });

  return matches;
}

function findContextualAliasMatches(normalizedForms) {
  const matches = [];
  const contextualHit = normalizedForms.tokenizedDeobfuscated.some(function (token) {
    return CONTACT_CONTEXT_TERMS.includes(token);
  }) || normalizedForms.deobfuscatedWindows.some(function (entry) {
    return CONTACT_CONTEXT_TERMS.includes(entry.spaced);
  });
  if (!contextualHit) {
    return matches;
  }
  normalizedForms.deobfuscatedWindows.forEach(function (entry) {
    if (CONTEXTUAL_ALIASES.includes(entry.spaced) || CONTEXTUAL_ALIASES.includes(entry.condensed)) {
      matches.push({
        ruleId: `alias:${entry.condensed}`,
        fragment: entry.spaced,
        violationType: "external_platform",
        confidence: 0.92,
      });
    }
  });
  return matches;
}

function findFuzzyMatches(normalizedForms) {
  const fuzzyMatches = [];
  const candidates = normalizedForms.deobfuscatedWindows
    .map(function (entry) { return entry.condensed; })
    .concat([normalizedForms.condensedDeobfuscated])
    .filter(Boolean)
    .filter(function (candidate) { return candidate.length >= 4 && candidate.length <= 28; });

  const seen = new Set();
  candidates.forEach(function (candidate) {
    FUZZY_LEXICON.forEach(function (entry) {
      if (Math.abs(candidate.length - entry.condensed.length) > 2) {
        return;
      }
      const score = similarityScore(candidate, entry.condensed);
      if (score < 0.84) {
        return;
      }
      const key = `${candidate}:${entry.condensed}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      fuzzyMatches.push({
        ruleId: entry.ruleId,
        fragment: candidate,
        violationType: "evasion",
        confidence: Number(score.toFixed(2)),
      });
    });
  });
  return fuzzyMatches;
}

function buildViolationSummary(matches) {
  const types = Array.from(new Set(matches.map(function (match) { return match.violationType; }).filter(Boolean)));
  if (!types.length) {
    return "mixed";
  }
  return types.length === 1 ? types[0] : "mixed";
}

function highestConfidence(matches) {
  return matches.reduce(function (max, match) {
    return Math.max(max, Number(match.confidence || 0));
  }, 0);
}

export function moderateChatMessage(rawText, context = {}) {
  const normalizedForms = normalizeMessageForModeration(rawText);
  const matchedRules = [];
  const matchedFragments = [];
  const matches = [];

  if (EMOJI_REGEX.test(String(rawText || ""))) {
    matches.push({
      ruleId: "emoji:any",
      fragment: "emoji",
      violationType: "emoji",
      confidence: 1,
    });
  }

  const emails = String(rawText || "").match(EMAIL_REGEX) || [];
  emails.forEach(function (entry) {
    matches.push({
      ruleId: "pattern:email",
      fragment: entry,
      violationType: "email",
      confidence: 0.99,
    });
  });

  const urls = String(rawText || "").match(URL_REGEX) || [];
  urls.forEach(function (entry) {
    matches.push({
      ruleId: "pattern:url",
      fragment: entry,
      violationType: "link",
      confidence: 0.99,
    });
  });

  const domains = String(rawText || "").match(DOMAIN_REGEX) || [];
  domains.forEach(function (entry) {
    matches.push({
      ruleId: "pattern:domain",
      fragment: entry,
      violationType: "link",
      confidence: 0.98,
    });
  });

  const phoneMatches = findPhoneMatches(rawText);
  phoneMatches.forEach(function (entry) {
    matches.push({
      ruleId: "pattern:phone",
      fragment: entry,
      violationType: "phone",
      confidence: 0.99,
    });
  });

  const ibanMatches = String(rawText || "").match(IBAN_REGEX) || [];
  ibanMatches.forEach(function (entry) {
    matches.push({
      ruleId: "pattern:iban",
      fragment: entry,
      violationType: "iban",
      confidence: 0.99,
    });
  });

  const handleMatches = String(rawText || "").match(HANDLE_REGEX) || [];
  handleMatches.forEach(function (entry) {
    matches.push({
      ruleId: "pattern:handle",
      fragment: entry.trim(),
      violationType: "contact",
      confidence: 0.98,
    });
  });

  findExactLexiconMatches(normalizedForms, PLATFORM_LEXICON).forEach(function (match) {
    matches.push(match);
  });
  findExactLexiconMatches(normalizedForms, PAYMENT_LEXICON).forEach(function (match) {
    matches.push(match);
  });
  findExactLexiconMatches(normalizedForms, CONTACT_LEXICON).forEach(function (match) {
    matches.push(match);
  });
  findContextualAliasMatches(normalizedForms).forEach(function (match) {
    matches.push(match);
  });

  const fuzzyMatches = findFuzzyMatches(normalizedForms);
  fuzzyMatches.forEach(function (match) {
    matches.push(match);
  });

  matches.forEach(function (match) {
    uniquePush(matchedRules, match.ruleId);
    uniquePush(matchedFragments, String(match.fragment || "").trim());
  });

  const violationType = buildViolationSummary(matches);
  const confidence = highestConfidence(matches);
  const allowed = matches.length === 0;

  return {
    allowed,
    violationType: allowed ? "none" : violationType,
    matchedRules,
    matchedFragments,
    normalizedForms: {
      rawLower: normalizedForms.rawLower,
      cleaned: normalizedForms.cleaned,
      condensed: normalizedForms.condensed,
      tokenized: normalizedForms.tokenized,
      deobfuscated: normalizedForms.deobfuscated,
      condensedDeobfuscated: normalizedForms.condensedDeobfuscated,
    },
    confidence: Number((allowed ? 0 : confidence).toFixed(2)),
    shouldIncrementStrike: !allowed,
    shouldBan: !allowed && (violationType === "iban" || violationType === "external_payment" || violationType === "mixed"),
    context: {
      channel: context.channel || "chat",
      actorRole: context.actorRole || "",
    },
  };
}

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
  const source = Object.assign({}, EMPTY_CHAT_MODERATION_STATE, record || {});
  const bannedUntilMs = source.chatBannedUntil
    ? new Date(source.chatBannedUntil).getTime()
    : 0;
  const isSuspended = Boolean(source.chatBanned || (bannedUntilMs && bannedUntilMs > now));
  return {
    userId: String(source.userId || source.user_id || ""),
    violationCount: Math.max(0, Number(source.violationCount ?? source.violation_count ?? 0)),
    lastViolationAtMs: Math.max(0, Number(source.lastViolationAtMs ?? source.last_violation_at_ms ?? 0)),
    lastViolationReason: String(source.lastViolationReason ?? source.last_violation_reason ?? ""),
    lastAction: String(source.lastAction ?? source.last_action ?? ""),
    chatBanned: Boolean(source.chatBanned ?? source.chat_banned ?? false),
    chatBannedUntil: source.chatBannedUntil ?? source.chat_banned_until ?? null,
    moderationNotes: source.moderationNotes ?? source.moderation_notes ?? {},
    isSuspended,
    activeWarningLevel: isSuspended ? 2 : Math.min(1, Math.max(0, Number(source.violationCount ?? source.violation_count ?? 0))),
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
  const shouldBan = Boolean(nextStrikeCount >= 2);
  const action = shouldBan ? "chat_banned" : "warning_1";
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
    }),
  }, now);

  return {
    action,
    strikeCount: nextStrikeCount,
    shouldBan,
    state: nextState,
  };
}

export function redactMessageForAudit(rawText) {
  const redacted = String(rawText || "")
    .replace(EMAIL_REGEX, "[email]")
    .replace(URL_REGEX, "[link]")
    .replace(DOMAIN_REGEX, "[domain]")
    .replace(IBAN_REGEX, "[iban]")
    .replace(HANDLE_REGEX, "$1[handle]")
    .replace(PHONE_CANDIDATE_REGEX, function (candidate) {
      return candidate.replace(/\D/g, "").length >= 7 ? "[phone]" : candidate;
    });
  return redacted.slice(0, MAX_AUDIT_LENGTH);
}

export function getModerationStageCopy(stage, locale = "it") {
  const isItalian = String(locale || "it").toLowerCase().startsWith("it");
  const copy = {
    warning_1: {
      title: isItalian ? "Messaggio bloccato" : "Message blocked",
      text: isItalian
        ? "Non puoi condividere contatti esterni, piattaforme esterne, metodi di pagamento esterni o emoji. Tutta la comunicazione e tutti i pagamenti devono restare su IRIS. Questa e' la tua prima e unica tolleranza: alla prossima violazione verrai bannato dalla chat."
        : "You cannot share external contacts, external platforms, external payment methods, or emoji. All communication and all payments must stay on IRIS. This is your first and only tolerance: one more violation will permanently ban you from chat.",
    },
    warning_2: {
      title: isItalian ? "Chat sospesa" : "Chat suspended",
      text: isItalian
        ? "Hai tentato di aggirare le regole della piattaforma. Il tuo accesso alla chat e' stato sospeso in modo definitivo. Puoi ancora acquistare e vendere su IRIS, ma non puoi piu usare la chat."
        : "You attempted to bypass the platform rules. Your chat access has been permanently suspended. You can still buy and sell on IRIS, but you can no longer use chat.",
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
