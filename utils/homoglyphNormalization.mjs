const HOMOGLYPH_MAP = new Map([
  ["а", "a"], ["Α", "a"], ["а", "a"], ["ɑ", "a"], ["ａ", "a"],
  ["е", "e"], ["Ε", "e"], ["ｅ", "e"], ["℮", "e"],
  ["і", "i"], ["Ι", "i"], ["ı", "i"], ["ｉ", "i"],
  ["ο", "o"], ["О", "o"], ["ο", "o"], ["ｏ", "o"], ["0", "0"],
  ["р", "p"], ["Ρ", "p"], ["ｐ", "p"],
  ["ѕ", "s"], ["Ｓ", "s"], ["ｓ", "s"],
  ["т", "t"], ["Τ", "t"], ["ｔ", "t"],
  ["у", "y"], ["Υ", "y"], ["ｙ", "y"],
  ["х", "x"], ["Χ", "x"], ["ｘ", "x"],
  ["Ｂ", "b"], ["ｂ", "b"],
  ["Ｇ", "g"], ["ｇ", "g"],
  ["Ｖ", "v"], ["ｖ", "v"],
  ["Ｗ", "w"], ["ｗ", "w"],
  ["＠", "@"], ["＋", "+"], ["＄", "$"], ["！", "!"],
]);

export function normalizeHomoglyphs(input) {
  return Array.from(String(input || "").normalize("NFKC")).map(function (character) {
    return HOMOGLYPH_MAP.get(character) || character;
  }).join("");
}
