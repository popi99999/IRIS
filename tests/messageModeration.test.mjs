import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const moderation = await import(pathToFileURL(path.join(ROOT, "moderation/chat-moderation-engine.mjs")).href);

function runCase(message, expectedRisk, opts = {}) {
  const result = moderation.moderateChatMessage(message, opts.context || { channel: "chat" });
  assert.equal(result.riskLevel, expectedRisk, `Unexpected risk for "${message}"`);
  if (opts.category) {
    assert(result.categories.includes(opts.category), `Missing category ${opts.category} for "${message}"`);
  }
  if (opts.blocked != null) {
    assert.equal(result.isBlocked, opts.blocked, `Unexpected block state for "${message}"`);
  }
  return result;
}

export async function runMessageModerationTestSuite() {
  [
    "scrivimi su instagram",
    "ti pago con paypal",
    "passami il numero",
    "facciamo su vinted",
    "vint3d",
    "v.i.n.t.e.d",
    "v i n t e d",
    "insta gram",
    "w h a t s a p p",
    "tele gram",
    "mandami email",
    "ti faccio bonifico",
    "evitiamo la commissione",
    "chiudiamo fuori piattaforma",
    "ti scrivo in dm",
    "nome chiocciola gmail punto com",
    "ti mando revolut",
    "checkout esterno",
    "vino in inglese + ted di teddy",
    "traduci vino in inglese e aggiungi ted",
    "social delle foto, stesso nome di qui",
    "app verde per i messaggi",
    "quella con l aeroplanino",
    "prendi le iniziali",
    "leggi le prime lettere",
    "unisci due parole",
    "non posso scriverlo qui ma hai capito",
    "ciao 🙂",
    "IBAN IT60X0542811101000000123456",
    "il mio numero è +39 333 123 4567",
    "guarda qui https://instagram.com/profilo",
  ].forEach(function (message) {
    const result = runCase(message, "block", { blocked: true });
    assert(result.score >= 70, `Expected high score for "${message}"`);
  });

  [
    { message: "hai mai usato vestiaire?", category: "external_platform" },
    { message: "conosci grailed?", category: "external_platform" },
    { message: "instagram no scherzo", category: "external_platform" },
    { message: "social delle foto", category: "external_platform" },
    { message: "quello verde", category: "external_platform" },
    { message: "quella con la V", category: "external_platform" },
    { message: "non te lo posso dire qui", category: "evasion" },
    { message: "ci siamo capiti", category: "evasion" },
    { message: "scrivimi non qui", category: "off_platform_invitation" },
    { message: "il mio nome è uguale altrove", category: "contact" },
  ].forEach(function (entry) {
    const result = runCase(entry.message, "suspicious", { blocked: false, category: entry.category });
    assert(result.score >= 25 && result.score <= 49, `Expected suspicious score for "${entry.message}"`);
  });

  [
    "Possiamo procedere con l'offerta direttamente su IRIS?",
    "La giacca veste oversize e il prezzo include autenticazione.",
    "Il materiale è lana e cotone, nessun difetto sulle maniche.",
    "Pagamento e spedizione restano dentro IRIS come da procedura.",
    "Mi mandi una foto in più del retro della borsa?",
    "Quali sono le misure interne e la lunghezza tracolla?",
    "La spedizione parte entro domani?",
  ].forEach(function (message) {
    const result = runCase(message, "safe", { blocked: false });
    assert.equal(result.allowed, true, `Expected allowed message "${message}"`);
  });

  const contextResult = moderation.moderateChatMessage("hai capito", {
    channel: "chat",
    recentMessages: ["vino in inglese", "poi prime tre lettere di teddy"],
    priorViolationCount: 1,
  });
  assert.equal(contextResult.riskLevel, "block", "Multi-message reconstruction should block.");
  assert(contextResult.reasonCodes.includes("repeated_attempt_after_warning"), "Expected repeat warning escalation.");

  let state = moderation.normalizeChatModerationState(null);
  state = moderation.applyModerationEscalation(state, moderation.moderateChatMessage("scrivimi su instagram"), Date.now()).state;
  assert.equal(state.lastAction, "warning_1");
  state = moderation.applyModerationEscalation(state, moderation.moderateChatMessage("pagami con paypal"), Date.now()).state;
  assert.equal(state.lastAction, "warning_2");
  state = moderation.applyModerationEscalation(state, moderation.moderateChatMessage("ti mando il numero"), Date.now()).state;
  assert.equal(state.lastAction, "chat_banned");
  assert.equal(moderation.isChatSuspended(state), true);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  await runMessageModerationTestSuite();
  console.log("IRIS advanced chat moderation tests passed.");
}
