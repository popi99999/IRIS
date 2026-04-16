#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const moderationModuleUrl = pathToFileURL(path.join(ROOT, "moderation/chat-moderation-engine.mjs")).href;
const moderation = await import(moderationModuleUrl);

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function expectBlocked(message, expectedType) {
  const result = moderation.moderateChatMessage(message, { channel: "chat" });
  assert(result.allowed === false, `Expected blocked message: ${message}`, result);
  if (expectedType) {
    assert(
      result.violationType === expectedType || result.violationType === "mixed",
      `Expected ${expectedType} for message: ${message}`,
      result,
    );
  }
  return result;
}

function expectAllowed(message) {
  const result = moderation.moderateChatMessage(message, { channel: "chat" });
  assert(result.allowed === true, `Expected allowed message: ${message}`, result);
  return result;
}

expectAllowed("Possiamo procedere con l'offerta direttamente su IRIS?");
expectAllowed("La giacca veste oversize e il prezzo include autenticazione.");
expectAllowed("Il materiale è lana e cotone, nessun difetto sulle maniche.");
expectAllowed("Pagamento e spedizione restano dentro IRIS come da procedura.");

expectBlocked("Ciao 🙂", "emoji");
expectBlocked("Scrivimi su instagram", "external_platform");
expectBlocked("ti contatto su vinted", "external_platform");
expectBlocked("ci sentiamo su vestiaire collective", "external_platform");
expectBlocked("spostiamoci su grailed", "external_platform");
expectBlocked("parliamone su depop", "external_platform");
expectBlocked("ci vediamo su subito.it", "link");
expectBlocked("v i n t e d", "external_platform");
expectBlocked("v.i.n.t.e.d", "external_platform");
expectBlocked("vin ted", "external_platform");
expectBlocked("pay pal", "external_payment");
expectBlocked("inst4gram", "external_platform");
expectBlocked("tele gram", "external_platform");
expectBlocked("ti lascio la mail marco@example.com", "email");
expectBlocked("Il mio numero è +39 333 123 4567", "phone");
expectBlocked("IBAN IT60X0542811101000000123456", "iban");
expectBlocked("Guarda qui https://instagram.com/profilo", "link");
expectBlocked("@luxury_handle scrivimi qui", "contact");
expectBlocked("ci sentiamo su ig", "external_platform");
expectBlocked("niente commissioni facciamo fuori", "external_payment");

let strikeState = moderation.normalizeChatModerationState(null);
strikeState = moderation.applyModerationEscalation(strikeState, expectBlocked("scrivimi su instagram", "external_platform"), Date.now()).state;
assert(strikeState.violationCount === 1, "First strike was not recorded correctly.", strikeState);
assert(strikeState.isSuspended === false, "First strike should not suspend chat.", strikeState);
assert(strikeState.lastAction === "warning_1", "First strike should trigger warning_1.", strikeState);

strikeState = moderation.applyModerationEscalation(strikeState, expectBlocked("pagami con paypal", "external_payment"), Date.now()).state;
assert(strikeState.violationCount === 2, "Second strike was not recorded correctly.", strikeState);
assert(strikeState.isSuspended === true, "Second strike should suspend chat immediately.", strikeState);
assert(strikeState.lastAction === "chat_banned", "Second strike should trigger chat_banned.", strikeState);
assert(moderation.isChatSuspended(strikeState) === true, "Suspended user should remain blocked.", strikeState);

const firstCopy = moderation.getModerationStageCopy("warning_1", "it");
const secondCopy = moderation.getModerationStageCopy("warning_2", "it");
const banCopy = moderation.getModerationStageCopy("chat_banned", "it");
assert(firstCopy.title === "Messaggio bloccato", "warning_1 copy mismatch", firstCopy);
assert(firstCopy.text.includes("prossima violazione"), "warning_1 escalation copy mismatch", firstCopy);
assert(secondCopy.title === "Chat sospesa", "warning_2 copy mismatch", secondCopy);
assert(secondCopy.text.includes("acquistare e vendere"), "warning_2 scope copy mismatch", secondCopy);
assert(banCopy.title === "Chat sospesa", "chat_banned copy mismatch", banCopy);
assert(banCopy.text.includes("acquistare e vendere"), "chat_banned scope copy mismatch", banCopy);

console.log("IRIS chat moderation validation passed.");
