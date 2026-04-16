import { RECONSTRUCTION_CUES, RECONSTRUCTION_GLUE_PHRASES } from "../config/moderation/reconstructionPatterns.mjs";
import { fuzzyCandidateMatches } from "./fuzzyMatch.mjs";

function findMatchingFragments(forms, entity) {
  const tokens = forms.tokenizedDeobfuscated;
  const windows = forms.deobfuscatedWindows;
  const fragments = Array.isArray(entity.fragments) ? entity.fragments : [];
  const found = fragments.filter(function (fragment) {
    return tokens.includes(fragment) || windows.some(function (entry) { return entry.condensed === fragment || entry.spaced === fragment; });
  });
  return Array.from(new Set(found));
}

export function detectReconstructionSignals(rawText, forms, entityCatalog) {
  const semanticSignals = [];
  const matchedTerms = [];
  const reasonCodes = [];
  const clueHits = RECONSTRUCTION_CUES.filter(function (cue) {
    return forms.deobfuscated.includes(cue.phrase);
  });
  const glueHits = RECONSTRUCTION_GLUE_PHRASES.filter(function (phrase) {
    return forms.deobfuscated.includes(phrase);
  });
  const hasInstructionCue = clueHits.length > 0 || glueHits.length > 0;

  entityCatalog.forEach(function (entity) {
    const fragmentHits = findMatchingFragments(forms, entity);
    if (fragmentHits.length >= 2) {
      matchedTerms.push({
        raw: fragmentHits.join(" + "),
        normalized: fragmentHits.join(""),
        category: entity.category,
        method: "fragment_recombine",
        confidence: 0.92,
        reasonCode: `fragment_recombine:${entity.id}`,
      });
      reasonCodes.push(`fragment_recombine:${entity.id}`);
      if (hasInstructionCue) {
        semanticSignals.push({
          type: "coded_reconstruction",
          evidence: `${entity.label}: ${fragmentHits.join(" + ")}`,
          confidence: 0.96,
          score: 45,
        });
      }
    }

    const fuzzyHits = fuzzyCandidateMatches(
      forms.deobfuscatedWindows.map(function (entry) { return entry.condensed; }).join(" "),
      entity.compiled.fuzzy,
      0.9,
    );
    if (hasInstructionCue && fuzzyHits.length) {
      semanticSignals.push({
        type: "instruction_guided_target",
        evidence: `${entity.label} via reconstruction cues`,
        confidence: Number(fuzzyHits[0].score.toFixed(2)),
        score: 42,
      });
      reasonCodes.push(`instruction_guided_target:${entity.id}`);
    }
  });

  if (hasInstructionCue) {
    clueHits.forEach(function (cue) {
      semanticSignals.push({
        type: "reconstruction_cue",
        evidence: cue.phrase,
        confidence: 0.86,
        score: cue.score,
      });
      reasonCodes.push(`reconstruction_cue:${cue.id}`);
    });
  }

  glueHits.forEach(function (phrase) {
    semanticSignals.push({
      type: "glue_phrase",
      evidence: phrase,
      confidence: 0.82,
      score: 20,
    });
    reasonCodes.push(`glue_phrase:${phrase.replace(/\s+/g, "_")}`);
  });

  if (hasInstructionCue && forms.initialisms.some(function (entry) {
    return entityCatalog.some(function (entity) {
      return entity.compiled.fuzzy.includes(entry.condensed) || entity.compiled.condensed.includes(entry.condensed);
    });
  })) {
    semanticSignals.push({
      type: "initialism_reconstruction",
      evidence: "initials",
      confidence: 0.9,
      score: 32,
    });
    reasonCodes.push("initialism_reconstruction");
  }

  return {
    semanticSignals,
    matchedTerms,
    reasonCodes,
  };
}
