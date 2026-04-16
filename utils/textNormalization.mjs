import { normalizeHomoglyphs } from "./homoglyphNormalization.mjs";
import { splitTokens, generateTokenWindows, buildNgrams, buildInitialisms } from "./tokenJoiner.mjs";

export const ZERO_WIDTH_REGEX = /[\u200B-\u200D\u2060\uFEFF\u00AD]/gu;
export const DIACRITICS_REGEX = /[\u0300-\u036f]/gu;
export const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|\uFE0F|\u20E3)/u;
export const SEPARATOR_REGEX = /[\s._\-\/\\|,:;'"`~()[\]{}<>+=!?]+/gu;
export const NON_ALNUM_KEEP_CONTACT_REGEX = /[^a-z0-9@\s]/gu;
export const ONLY_ALNUM_REGEX = /[^a-z0-9]/gu;

const LEETSPEAK_MAP = {
  "0": "o",
  "1": "i",
  "2": "z",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  "$": "s",
  "!": "i",
  "+": "t",
};

export function stripDiacritics(value) {
  return String(value || "").normalize("NFKD").replace(DIACRITICS_REGEX, "");
}

export function removeZeroWidth(value) {
  return String(value || "").replace(ZERO_WIDTH_REGEX, "");
}

export function collapseWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function collapseRepeatedChars(value) {
  return String(value || "").replace(/([a-z])\1{2,}/g, "$1");
}

export function deobfuscateLeetspeak(value) {
  return Array.from(String(value || "")).map(function (character) {
    return LEETSPEAK_MAP[character] || character;
  }).join("");
}

export function normalizePlainText(value) {
  const lower = normalizeHomoglyphs(removeZeroWidth(stripDiacritics(String(value || "").toLowerCase())));
  return collapseWhitespace(lower);
}

export function normalizeMessageForModeration(rawText) {
  const raw = String(rawText || "");
  const rawLower = normalizePlainText(raw);
  const punctuationSoftened = rawLower
    .replace(/[.:/\\|_-]+/g, " ")
    .replace(/[“”"'`~()[\]{}<>]+/g, " ");
  const cleanedBase = collapseWhitespace(punctuationSoftened.replace(NON_ALNUM_KEEP_CONTACT_REGEX, " "));
  const repeatedCollapsed = collapseRepeatedChars(cleanedBase);
  const deobfuscated = collapseWhitespace(deobfuscateLeetspeak(repeatedCollapsed));
  const cleaned = collapseWhitespace(repeatedCollapsed);
  const condensed = cleaned.replace(/\s+/g, "");
  const condensedDeobfuscated = deobfuscated.replace(/\s+/g, "");
  const alnumOnly = cleaned.replace(ONLY_ALNUM_REGEX, "");
  const alnumDeobfuscated = deobfuscated.replace(ONLY_ALNUM_REGEX, "");
  const tokenized = splitTokens(cleaned);
  const tokenizedDeobfuscated = splitTokens(deobfuscated);
  const windows = generateTokenWindows(tokenized, 6);
  const deobfuscatedWindows = generateTokenWindows(tokenizedDeobfuscated, 6);
  const ngrams = buildNgrams(alnumDeobfuscated, 3, Math.min(20, alnumDeobfuscated.length || 3));
  const initialisms = buildInitialisms(tokenizedDeobfuscated, 8);
  return {
    raw,
    rawLower,
    cleaned,
    condensed,
    alnumOnly,
    tokenized,
    deobfuscated,
    condensedDeobfuscated,
    alnumDeobfuscated,
    tokenizedDeobfuscated,
    windows,
    deobfuscatedWindows,
    ngrams,
    initialisms,
  };
}
