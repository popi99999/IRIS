import { ALLOWLIST_PHRASES, NEGATION_TOKENS } from "../config/moderation/allowlist.mjs";
import { BANNED_PAYMENTS } from "../config/moderation/bannedPayments.mjs";
import { DIRECT_CONTACT_TERMS, EXTERNAL_CHANNELS } from "../config/moderation/bannedContactSignals.mjs";
import { BANNED_PLATFORMS } from "../config/moderation/bannedPlatforms.mjs";
import { OFF_PLATFORM_PHRASES } from "../config/moderation/offPlatformPhrases.mjs";
import { RECONSTRUCTION_CUES } from "../config/moderation/reconstructionPatterns.mjs";
import { SEMANTIC_HINTS } from "../config/moderation/semanticHints.mjs";
import {
  detectContactPatterns,
  EMAIL_OBFUSCATED_REGEX,
  EMAIL_REGEX,
  DOMAIN_REGEX,
  HANDLE_REGEX,
  IBAN_REGEX,
  PHONE_REGEX,
  URL_REGEX,
} from "../utils/contactDetection.mjs";
import { analyzeConversationContext } from "../utils/contextRiskAnalysis.mjs";
import { fuzzyCandidateMatches } from "../utils/fuzzyMatch.mjs";
import { detectReconstructionSignals } from "../utils/reconstructionDetection.mjs";
import { EMOJI_REGEX, normalizeMessageForModeration } from "../utils/textNormalization.mjs";

const MAX_AUDIT_LENGTH = 220;

const SCORE_THRESHOLDS = {
  safe: 24,
  suspicious: 49,
  highRiskReview: 69,
};

function slug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function compileEntity(definition) {
  const sourceTerms = []
    .concat(definition.terms || [])
    .concat(definition.aliases || []);
  const normalizedTerms = Array.from(new Set(sourceTerms.map(function (term) {
    return normalizeMessageForModeration(term).deobfuscated;
  }).filter(Boolean)));
  const condensedTerms = Array.from(new Set(sourceTerms.map(function (term) {
    return normalizeMessageForModeration(term).condensedDeobfuscated;
  }).filter(Boolean)));
  const fuzzyTerms = Array.from(new Set(
    sourceTerms.concat(definition.fuzzy || []).map(function (term) {
      return normalizeMessageForModeration(term).condensedDeobfuscated;
    }).filter(Boolean),
  ));
  return {
    ...definition,
    compiled: {
      normalized: normalizedTerms,
      condensed: condensedTerms,
      fuzzy: fuzzyTerms,
    },
  };
}

export const ENTITY_CATALOG = []
  .concat(BANNED_PLATFORMS)
  .concat(EXTERNAL_CHANNELS)
  .concat(BANNED_PAYMENTS)
  .map(compileEntity);

const PHRASE_CATALOG = OFF_PLATFORM_PHRASES.map(function (entry) {
  const forms = normalizeMessageForModeration(entry.phrase);
  return {
    ...entry,
    normalized: forms.deobfuscated,
    condensed: forms.condensedDeobfuscated,
  };
});

const SEMANTIC_HINT_CATALOG = SEMANTIC_HINTS.map(function (entry) {
  return {
    ...entry,
    normalizedPhrases: entry.phrases.map(function (phrase) {
      return normalizeMessageForModeration(phrase).deobfuscated;
    }),
    condensedPhrases: entry.phrases.map(function (phrase) {
      return normalizeMessageForModeration(phrase).condensedDeobfuscated;
    }),
  };
});

function createMatchedTerm(raw, normalized, category, method, confidence, reasonCode, score) {
  return {
    raw,
    normalized,
    category,
    method,
    confidence: Number(confidence.toFixed(2)),
    reasonCode,
    score,
  };
}

function containsPhraseWithBoundaries(text, phrase) {
  const paddedText = ` ${String(text || "").trim()} `;
  const paddedPhrase = ` ${String(phrase || "").trim()} `;
  return paddedText.includes(paddedPhrase);
}

function buildCandidateSets(forms) {
  const spaced = new Set(
    [forms.cleaned, forms.deobfuscated]
      .concat(forms.windows.map(function (entry) { return entry.spaced; }))
      .concat(forms.deobfuscatedWindows.map(function (entry) { return entry.spaced; }))
      .filter(Boolean),
  );
  const condensed = new Set(
    [forms.condensed, forms.condensedDeobfuscated, forms.alnumOnly, forms.alnumDeobfuscated]
      .concat(forms.windows.map(function (entry) { return entry.condensed; }))
      .concat(forms.deobfuscatedWindows.map(function (entry) { return entry.condensed; }))
      .concat(forms.initialisms.map(function (entry) { return entry.condensed; }))
      .filter(Boolean),
  );
  return { spaced, condensed };
}

function matchEntityExact(forms, entity, candidates) {
  let bestMatch = null;
  entity.compiled.normalized.forEach(function (term, index) {
    const condensed = entity.compiled.condensed[index] || term.replace(/\s+/g, "");
    const shortTerm = condensed.length <= 3;
    const spacedMatch = Array.from(candidates.spaced).some(function (candidate) {
      return shortTerm ? containsPhraseWithBoundaries(candidate, term) : containsPhraseWithBoundaries(candidate, term);
    });
    const condensedMatch = Array.from(candidates.condensed).some(function (candidate) {
      if (!candidate) return false;
      if (candidate === condensed) return true;
      return condensed.length >= 5 && candidate.includes(condensed);
    });
    if (spacedMatch || condensedMatch) {
      const method = spacedMatch ? "exact_match" : "normalized_match";
      const score = entity.category === "external_payment" ? 50 : 40;
      const nextMatch = createMatchedTerm(term, condensed, entity.category, method, 0.97, `${entity.id}:${method}`, score);
      if (!bestMatch || (bestMatch.method !== "exact_match" && nextMatch.method === "exact_match")) {
        bestMatch = nextMatch;
      }
    }
  });
  return bestMatch ? [bestMatch] : [];
}

function matchEntityObfuscated(forms, entity, candidates, existingReasonCodes) {
  const matches = [];
  Array.from(candidates.condensed).forEach(function (candidate) {
    if (!candidate || candidate.length < 4 || candidate.length > 32) {
      return;
    }
    const fuzzyMatches = fuzzyCandidateMatches(candidate, entity.compiled.fuzzy, 0.86);
    if (!fuzzyMatches.length) {
      return;
    }
    const best = fuzzyMatches[0];
    const reasonCode = `${entity.id}:obfuscated:${best.target}`;
    if (existingReasonCodes.has(reasonCode)) {
      return;
    }
    existingReasonCodes.add(reasonCode);
    matches.push(createMatchedTerm(candidate, best.target, entity.category, "obfuscated_fuzzy", best.score, reasonCode, 50));
  });
  return matches;
}

function detectPhraseMatches(forms) {
  return PHRASE_CATALOG.filter(function (entry) {
    return containsPhraseWithBoundaries(forms.deobfuscated, entry.normalized) || forms.condensedDeobfuscated.includes(entry.condensed);
  }).map(function (entry) {
    return createMatchedTerm(entry.phrase, entry.condensed, entry.category, "phrase_match", 0.96, `phrase:${entry.id}`, entry.score);
  });
}

function detectSemanticHints(forms) {
  const semanticSignals = [];
  SEMANTIC_HINT_CATALOG.forEach(function (entry) {
    entry.normalizedPhrases.forEach(function (phrase, index) {
      const condensed = entry.condensedPhrases[index];
      if (containsPhraseWithBoundaries(forms.deobfuscated, phrase) || forms.condensedDeobfuscated.includes(condensed)) {
        semanticSignals.push({
          type: entry.id,
          evidence: entry.phrases[index],
          confidence: 0.8,
          score: entry.score,
          category: entry.category,
          reasonCode: `semantic:${entry.id}`,
        });
      }
    });
  });
  return semanticSignals;
}

function hasNegationContext(forms) {
  return forms.tokenizedDeobfuscated.some(function (token) {
    return NEGATION_TOKENS.includes(token);
  });
}

function applyAllowlistDiscount(score, forms) {
  if (ALLOWLIST_PHRASES.some(function (phrase) {
    return containsPhraseWithBoundaries(forms.deobfuscated, phrase);
  })) {
    return Math.max(0, score - 20);
  }
  return score;
}

function determineRiskLevel(score) {
  if (score <= SCORE_THRESHOLDS.safe) return "safe";
  if (score <= SCORE_THRESHOLDS.suspicious) return "suspicious";
  if (score <= SCORE_THRESHOLDS.highRiskReview) return "high_risk_review";
  return "block";
}

function buildExplanation(riskLevel, categories) {
  if (riskLevel === "block") {
    return "Per motivi di sicurezza, non e possibile condividere contatti esterni, piattaforme terze o metodi di pagamento fuori dalla piattaforma.";
  }
  if (riskLevel === "suspicious") {
    return "Per sicurezza, evita riferimenti a contatti esterni o metodi di pagamento fuori piattaforma.";
  }
  if (riskLevel === "high_risk_review") {
    return "Il messaggio contiene segnali forti di evasione o ricostruzione indiretta e richiede review.";
  }
  if (categories.length) {
    return `Segnali rilevati: ${categories.join(", ")}.`;
  }
  return "Messaggio consentito.";
}

function inferViolationType(categories) {
  const priority = ["emoji", "email", "phone", "iban", "external_payment", "payment_bypass", "off_platform_invitation", "external_platform", "contact", "link", "evasion"];
  const categorySet = new Set(categories);
  for (const entry of priority) {
    if (categorySet.has(entry)) {
      if (entry === "off_platform_invitation") return "mixed";
      if (entry === "payment_bypass") return "external_payment";
      return entry;
    }
  }
  return categories.length > 1 ? "mixed" : (categories[0] || "none");
}

export function redactMessageForAudit(rawText) {
  return String(rawText || "")
    .replace(EMAIL_REGEX, "[email]")
    .replace(EMAIL_OBFUSCATED_REGEX, "[email]")
    .replace(URL_REGEX, "[link]")
    .replace(DOMAIN_REGEX, "[domain]")
    .replace(IBAN_REGEX, "[iban]")
    .replace(HANDLE_REGEX, "$1[handle]")
    .replace(PHONE_REGEX, function (candidate) {
      return candidate.replace(/\D/g, "").length >= 7 ? "[phone]" : candidate;
    })
    .slice(0, MAX_AUDIT_LENGTH);
}

export { normalizeMessageForModeration };

export function moderateChatMessage(rawText, context = {}) {
  const forms = normalizeMessageForModeration(rawText);
  const candidates = buildCandidateSets(forms);
  const matchedTerms = [];
  const semanticSignals = [];
  const reasonCodes = [];
  const rawMatches = [];
  const existingReasonCodes = new Set();

  if (EMOJI_REGEX.test(String(rawText || ""))) {
    rawMatches.push(createMatchedTerm("emoji", "emoji", "emoji", "emoji_detected", 1, "emoji_present", 95));
  }

  ENTITY_CATALOG.forEach(function (entity) {
    matchEntityExact(forms, entity, candidates).forEach(function (match) {
      rawMatches.push(match);
    });
    matchEntityObfuscated(forms, entity, candidates, existingReasonCodes).forEach(function (match) {
      rawMatches.push(match);
    });
  });

  detectPhraseMatches(forms).forEach(function (match) {
    rawMatches.push(match);
  });

  detectContactPatterns(rawText, forms).forEach(function (match) {
    const score = match.category === "iban"
      ? 90
      : match.category === "phone"
        ? 85
        : match.category === "email"
          ? 85
          : match.category === "link"
            ? 80
            : match.method === "regex_handle"
              ? 55
              : match.method === "contact_intro"
                ? 35
                : match.method === "contextual_alias"
                  ? 32
                  : 20;
    rawMatches.push({ ...match, score });
  });

  detectSemanticHints(forms).forEach(function (signal) {
    semanticSignals.push(signal);
  });

  const reconstruction = detectReconstructionSignals(rawText, forms, ENTITY_CATALOG);
  reconstruction.matchedTerms.forEach(function (match) {
    rawMatches.push({ ...match, score: 45 });
  });
  reconstruction.semanticSignals.forEach(function (signal) {
    semanticSignals.push(signal);
  });
  reconstruction.reasonCodes.forEach(function (reasonCode) {
    reasonCodes.push(reasonCode);
  });

  const contextAnalysis = analyzeConversationContext({
    rawText,
    recentMessages: Array.isArray(context.recentMessages) ? context.recentMessages : [],
    entityCatalog: ENTITY_CATALOG,
    priorViolationCount: Number(context.priorViolationCount || 0),
  });
  contextAnalysis.matchedTerms.forEach(function (match) {
    rawMatches.push({ ...match, score: 35 });
  });
  contextAnalysis.semanticSignals.forEach(function (signal) {
    semanticSignals.push(signal);
  });
  contextAnalysis.reasonCodes.forEach(function (reasonCode) {
    reasonCodes.push(reasonCode);
  });

  rawMatches.forEach(function (match) {
    if (!existingReasonCodes.has(match.reasonCode)) {
      existingReasonCodes.add(match.reasonCode);
      matchedTerms.push(match);
      reasonCodes.push(match.reasonCode);
    }
  });

  const rawLooksObfuscated = forms.cleaned !== forms.deobfuscated ||
    /[0-9@!$+]/.test(forms.rawLower) ||
    /(?:[a-z][._\-\/\\][a-z])/.test(forms.rawLower) ||
    /\b(?:[a-z]\s+){2,}[a-z]\b/.test(forms.rawLower);

  if (rawLooksObfuscated) {
    matchedTerms.forEach(function (match) {
      if (match.method === "exact_match" && ["external_platform", "external_payment", "contact"].includes(match.category)) {
        match.method = "obfuscated_exact";
        match.score = Math.max(Number(match.score || 0), 50);
        match.reasonCode = `${match.reasonCode}:obfuscated`;
      }
    });
  }

  const categories = Array.from(new Set(
    matchedTerms.map(function (match) { return match.category; })
      .concat(semanticSignals.map(function (signal) { return signal.category || "evasion"; }))
      .filter(Boolean),
  ));

  let score = matchedTerms.reduce(function (sum, match) {
    return sum + Number(match.score || 0);
  }, 0) + semanticSignals.reduce(function (sum, signal) {
    return sum + Number(signal.score || 0);
  }, 0) + Number(contextAnalysis.scoreBonus || 0);

  const strongSignalCount =
    matchedTerms.filter(function (match) { return Number(match.score || 0) >= 30; }).length +
    semanticSignals.filter(function (signal) { return Number(signal.score || 0) >= 25; }).length;

  if (strongSignalCount >= 2 || (strongSignalCount >= 1 && matchedTerms.length + semanticSignals.length >= 3)) {
    score += 20;
    reasonCodes.push("multi_signal_bonus");
  }

  if (matchedTerms.some(function (match) {
    return (match.method === "obfuscated_fuzzy" || match.method === "obfuscated_exact" || match.method === "fragment_recombine" || match.method === "context_fragment_reconstruction") &&
      ["external_platform", "external_payment", "contact"].includes(match.category);
  })) {
    score = Math.max(score, 72);
    reasonCodes.push("obfuscated_evasion_block");
  }

  if (categories.includes("external_platform") && categories.includes("external_payment")) {
    score = Math.max(score, 82);
    reasonCodes.push("platform_plus_payment");
  }

  if (categories.includes("external_payment") && /(ti pago|pagami|pago|bonifico|paypal|revolut|wise|postepay|satispay|checkout esterno)/.test(forms.deobfuscated)) {
    score = Math.max(score, 74);
    reasonCodes.push("explicit_external_payment");
  }

  if (categories.includes("payment_bypass") && /(evitiamo|commission|fee|checkout|fuori|risparmiamo|direttamente|accordiamo)/.test(forms.deobfuscated)) {
    score = Math.max(score, 74);
    reasonCodes.push("explicit_payment_bypass");
  }

  if (/(app verde per i messaggi|quella con l aeroplanino|quello con il paper plane|quella con il paper plane)/.test(forms.deobfuscated)) {
    score = Math.max(score, 74);
    reasonCodes.push("explicit_semantic_allusion");
  }

  if (/(prendi le iniziali|leggi le prime lettere|unisci due parole|unisci le sillabe|metti insieme i pezzi|prendi la prima lettera di ogni parola)/.test(forms.deobfuscated)) {
    score = Math.max(score, 74);
    reasonCodes.push("explicit_reconstruction_instruction");
  }

  if (/(non posso scriverlo qui|non lo posso scrivere qui|non te lo posso dire qui).*(hai capito|ci siamo capiti|basta interpretare)/.test(forms.deobfuscated)) {
    score = Math.max(score, 76);
    reasonCodes.push("explicit_coded_evasion");
  }

  if (categories.includes("external_platform") && /(scrivimi|contattami|ti contatto|spostiamoci|sentiamoci|vediamoci|facciamo|parliamone|vieni|scrivici)\s+su\b/.test(forms.deobfuscated)) {
    score = Math.max(score, 76);
    reasonCodes.push("explicit_platform_diversion");
  }

  if ((categories.includes("contact") || categories.includes("email") || categories.includes("phone")) &&
      /(mandami|passami|ti mando|ti lascio|scrivimi|contattami|chiamami).*(email|mail|numero|telefono|cellulare|contatto|handle|username)/.test(forms.deobfuscated)) {
    score = Math.max(score, 76);
    reasonCodes.push("explicit_contact_exchange");
  }

  if ((categories.includes("contact") || categories.includes("external_platform")) &&
      /(scrivimi|ti scrivo|contattami).*(dm|direct|privato|mp)/.test(forms.deobfuscated)) {
    score = Math.max(score, 76);
    reasonCodes.push("explicit_direct_message_diversion");
  }

  const hasConcreteContactSignal = matchedTerms.some(function (match) {
    return ["email", "phone", "link", "iban"].includes(match.category) ||
      (match.category === "contact" && match.method !== "contact_term");
  });

  if (hasConcreteContactSignal &&
      (categories.includes("off_platform_invitation") || categories.includes("external_platform"))) {
    score = Math.max(score, 82);
    reasonCodes.push("contact_plus_offplatform");
  }

  if (categories.includes("emoji")) {
    score = Math.max(score, 90);
    reasonCodes.push("emoji_zero_tolerance");
  }

  if (hasNegationContext(forms) && score > 0 && score < 70) {
    score = Math.max(25, score - 8);
    reasonCodes.push("negation_context_discount");
  }

  score = Math.min(100, applyAllowlistDiscount(score, forms));
  const riskLevel = determineRiskLevel(score);
  const isBlocked = riskLevel === "block";
  const requiresReview = riskLevel === "high_risk_review";
  const confidence = Math.max(
    matchedTerms.reduce(function (max, match) { return Math.max(max, Number(match.confidence || 0)); }, 0),
    semanticSignals.reduce(function (max, signal) { return Math.max(max, Number(signal.confidence || 0)); }, 0),
  );
  const violationType = inferViolationType(categories);
  const matchedFragments = Array.from(new Set(
    matchedTerms.map(function (match) { return String(match.raw || "").trim(); })
      .concat(semanticSignals.map(function (signal) { return String(signal.evidence || "").trim(); }))
      .filter(Boolean),
  )).slice(0, 8);
  const mergedReasonCodes = Array.from(new Set(
    reasonCodes.concat(matchedTerms.map(function (match) { return match.reasonCode; })).filter(Boolean),
  ));

  return {
    isBlocked,
    requiresReview,
    score,
    riskLevel,
    categories,
    matchedTerms,
    semanticSignals,
    reasonCodes: mergedReasonCodes,
    explanation: buildExplanation(riskLevel, categories),
    safePreview: redactMessageForAudit(rawText),
    allowed: !(isBlocked || requiresReview),
    violationType,
    matchedRules: mergedReasonCodes,
    matchedFragments,
    normalizedForms: {
      rawLower: forms.rawLower,
      cleaned: forms.cleaned,
      condensed: forms.condensed,
      tokenized: forms.tokenized,
      deobfuscated: forms.deobfuscated,
      alnumDeobfuscated: forms.alnumDeobfuscated,
    },
    confidence: Number(confidence.toFixed(2)),
    shouldIncrementStrike: isBlocked || requiresReview,
    shouldBan: isBlocked && score >= 90,
    context: {
      channel: context.channel || "chat",
      actorRole: context.actorRole || "",
      recentMessagesCount: Array.isArray(context.recentMessages) ? context.recentMessages.length : 0,
      priorViolationCount: Number(context.priorViolationCount || 0),
    },
  };
}
