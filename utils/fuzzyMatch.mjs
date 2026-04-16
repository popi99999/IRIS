export function levenshteinDistance(left, right) {
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

export function similarityScore(left, right) {
  const longest = Math.max(String(left || "").length, String(right || "").length, 1);
  return 1 - levenshteinDistance(left, right) / longest;
}

export function fuzzyCandidateMatches(candidate, targets, threshold = 0.84) {
  const normalizedCandidate = String(candidate || "");
  return targets
    .map(function (target) {
      return {
        target,
        score: similarityScore(normalizedCandidate, target),
      };
    })
    .filter(function (entry) {
      return entry.score >= threshold;
    })
    .sort(function (left, right) {
      return right.score - left.score;
    });
}
