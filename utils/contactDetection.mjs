import {
  CONTACT_CONTEXT_TERMS,
  CONTACT_INTRO_PHRASES,
  CONTEXTUAL_SHORT_ALIASES,
  DIRECT_CONTACT_TERMS,
} from "../config/moderation/bannedContactSignals.mjs";

export const EMAIL_REGEX = /\b[a-z0-9._%+-]+(?:\s*@\s*|@)[a-z0-9.-]+(?:\s*\.\s*|\.)[a-z]{2,}\b/giu;
export const EMAIL_OBFUSCATED_REGEX = /\b[a-z0-9._%+-]+\s*(?:chiocciola|at|@)\s*[a-z0-9.-]+\s*(?:punto|dot|\.)\s*[a-z]{2,}\b/giu;
export const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s]+/giu;
export const DOMAIN_REGEX = /\b[a-z0-9-]+(?:\s*(?:\.|punto|dot)\s*)+(?:it|com|net|org|io|me|co|eu|fr|de|uk)\b/giu;
export const IBAN_REGEX = /\b[a-z]{2}\s*\d{2}(?:\s*[a-z0-9]{4}){3,7}\b/giu;
export const HANDLE_REGEX = /(^|\s)@[a-z0-9_.]{2,32}\b/giu;
export const PHONE_REGEX = /(?:\+?\d[\d\s()./\-]{6,}\d)/gu;

function createMatch(raw, normalized, category, method, confidence, reasonCode) {
  return {
    raw,
    normalized,
    category,
    method,
    confidence,
    reasonCode,
  };
}

export function detectContactPatterns(rawText, normalizedForms) {
  const raw = String(rawText || "");
  const matches = [];

  (raw.match(EMAIL_REGEX) || []).forEach(function (value) {
    matches.push(createMatch(value, value.toLowerCase(), "email", "regex_email", 0.99, "contact_email"));
  });

  (raw.match(EMAIL_OBFUSCATED_REGEX) || []).forEach(function (value) {
    matches.push(createMatch(value, normalizedForms.deobfuscated, "email", "regex_email_obfuscated", 0.99, "contact_email_obfuscated"));
  });

  (raw.match(URL_REGEX) || []).forEach(function (value) {
    matches.push(createMatch(value, value.toLowerCase(), "link", "regex_url", 0.99, "contact_url"));
  });

  (raw.match(DOMAIN_REGEX) || []).forEach(function (value) {
    matches.push(createMatch(value, normalizedForms.deobfuscated, "link", "regex_domain", 0.98, "contact_domain"));
  });

  (raw.match(IBAN_REGEX) || []).forEach(function (value) {
    matches.push(createMatch(value, "iban", "iban", "regex_iban", 0.99, "contact_iban"));
  });

  (raw.match(HANDLE_REGEX) || []).forEach(function (value) {
    matches.push(createMatch(value.trim(), value.trim().toLowerCase(), "contact", "regex_handle", 0.98, "contact_handle"));
  });

  (raw.match(PHONE_REGEX) || []).forEach(function (value) {
    if (value.replace(/\D/g, "").length >= 7) {
      matches.push(createMatch(value, value.replace(/\D/g, ""), "phone", "regex_phone", 0.99, "contact_phone"));
    }
  });

  CONTACT_INTRO_PHRASES.forEach(function (phrase) {
    if (normalizedForms.deobfuscated.includes(phrase)) {
      matches.push(createMatch(phrase, phrase, "contact", "contact_intro", 0.93, `contact_intro:${phrase.replace(/\s+/g, "_")}`));
    }
  });

  DIRECT_CONTACT_TERMS.forEach(function (term) {
    const padded = ` ${normalizedForms.deobfuscated} `;
    const target = ` ${term} `;
    if (padded.includes(target)) {
      matches.push(createMatch(term, term, "contact", "contact_term", 0.9, `contact_term:${term.replace(/\s+/g, "_")}`));
    }
  });

  const hasContactContext = normalizedForms.tokenizedDeobfuscated.some(function (token) {
    return CONTACT_CONTEXT_TERMS.includes(token);
  });

  if (hasContactContext) {
    normalizedForms.deobfuscatedWindows.forEach(function (windowEntry) {
      if (CONTEXTUAL_SHORT_ALIASES.includes(windowEntry.spaced) || CONTEXTUAL_SHORT_ALIASES.includes(windowEntry.condensed)) {
        matches.push(createMatch(windowEntry.spaced, windowEntry.condensed, "contact", "contextual_alias", 0.84, `contact_alias:${windowEntry.condensed}`));
      }
    });
  }

  return matches;
}
