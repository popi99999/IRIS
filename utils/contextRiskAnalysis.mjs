import { normalizeMessageForModeration } from "./textNormalization.mjs";

function collectEntityFragments(entity, forms) {
  const tokens = forms.tokenizedDeobfuscated;
  const windows = forms.deobfuscatedWindows;
  const fragments = Array.isArray(entity.fragments) ? entity.fragments : [];
  return fragments.filter(function (fragment) {
    return tokens.includes(fragment) || windows.some(function (entry) { return entry.spaced === fragment || entry.condensed === fragment; });
  });
}

export function analyzeConversationContext({ rawText, recentMessages = [], entityCatalog = [], priorViolationCount = 0 }) {
  const semanticSignals = [];
  const matchedTerms = [];
  const reasonCodes = [];
  let scoreBonus = 0;

  if (priorViolationCount > 0) {
    scoreBonus += 25;
    reasonCodes.push("repeated_attempt_after_warning");
    semanticSignals.push({
      type: "repeated_attempt_after_warning",
      evidence: `prior_violations:${priorViolationCount}`,
      confidence: 0.95,
      score: 25,
    });
  }

  const history = recentMessages.slice(-6).filter(Boolean);
  if (!history.length) {
    return { scoreBonus, semanticSignals, matchedTerms, reasonCodes };
  }

  const combined = normalizeMessageForModeration(history.concat([rawText]).join(" "));
  entityCatalog.forEach(function (entity) {
    const contributors = history.map(function (message) {
      return collectEntityFragments(entity, normalizeMessageForModeration(message)).length;
    }).filter(function (count) {
      return count > 0;
    });
    const currentContribution = collectEntityFragments(entity, normalizeMessageForModeration(rawText)).length;
    const combinedContribution = collectEntityFragments(entity, combined).length;
    if (combinedContribution >= 2 && contributors.length >= 1 && currentContribution >= 1) {
      scoreBonus += 35;
      reasonCodes.push(`context_fragment_reconstruction:${entity.id}`);
      matchedTerms.push({
        raw: history.concat([rawText]).join(" / "),
        normalized: entity.label,
        category: entity.category,
        method: "context_fragment_reconstruction",
        confidence: 0.95,
        reasonCode: `context_fragment_reconstruction:${entity.id}`,
      });
      semanticSignals.push({
        type: "context_fragment_reconstruction",
        evidence: entity.label,
        confidence: 0.95,
        score: 35,
      });
    }
  });

  if (/hai capito|ci siamo capiti|non posso scriverlo qui|te lo faccio intuire/.test(combined.deobfuscated)) {
    scoreBonus += 18;
    reasonCodes.push("context_confirmation_signal");
    semanticSignals.push({
      type: "context_confirmation_signal",
      evidence: "conversation_confirmation",
      confidence: 0.82,
      score: 18,
    });
  }

  return {
    scoreBonus,
    semanticSignals,
    matchedTerms,
    reasonCodes,
  };
}
