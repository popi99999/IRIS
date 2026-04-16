export function splitTokens(value) {
  return String(value || "").split(/\s+/).map(function (token) {
    return token.trim();
  }).filter(Boolean);
}

export function generateTokenWindows(tokens, maxWindowSize = 6) {
  const normalizedTokens = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
  const windows = [];
  for (let start = 0; start < normalizedTokens.length; start += 1) {
    for (let size = 1; size <= maxWindowSize && start + size <= normalizedTokens.length; size += 1) {
      const slice = normalizedTokens.slice(start, start + size);
      const spaced = slice.join(" ");
      const condensed = slice.join("");
      windows.push({
        start,
        size,
        tokens: slice,
        spaced,
        condensed,
      });
    }
  }
  return windows;
}

export function buildNgrams(text, minSize = 3, maxSize = 24) {
  const source = String(text || "");
  const grams = new Set();
  if (!source) {
    return [];
  }
  for (let size = minSize; size <= maxSize; size += 1) {
    for (let index = 0; index + size <= source.length; index += 1) {
      grams.add(source.slice(index, index + size));
    }
  }
  return Array.from(grams);
}

export function buildInitialisms(tokens, maxWindowSize = 8) {
  const windows = generateTokenWindows(tokens, maxWindowSize);
  return windows.map(function (entry) {
    return {
      spaced: entry.spaced,
      condensed: entry.tokens.map(function (token) { return token[0] || ""; }).join(""),
      size: entry.size,
    };
  }).filter(function (entry) {
    return entry.condensed.length >= 2;
  });
}
