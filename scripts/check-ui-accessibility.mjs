import fs from "fs";
import path from "path";

const projectRoot = path.resolve(process.cwd(), "IRIS");
const indexPath = path.join(projectRoot, "index.html");
const cssPath = path.join(projectRoot, "iris-foundation.css");
const jsPath = path.join(projectRoot, "iris-plus.js");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const indexHtml = read(indexPath);
const foundationCss = read(cssPath);
const appJs = read(jsPath);

assert(indexHtml.includes('href="./iris-foundation.css"'), "index.html must include iris-foundation.css");
assert(foundationCss.includes("--iris-color-text-strong"), "foundation file must define readable text tokens");
assert(foundationCss.includes("*:focus-visible"), "foundation file must define visible focus states");
assert(foundationCss.includes(".cookie-banner"), "foundation file must style the cookie banner");
assert(foundationCss.includes(".site-footer"), "foundation file must style the footer");
assert(foundationCss.includes(".det-section-title"), "foundation file must style detail section titles");
assert(foundationCss.includes(".p-name"), "foundation file must style product names");
assert(appJs.includes('aria-label="${escapeHtml(langText("Aggiungi ai preferiti", "Add to favorites"))}') || appJs.includes("aria-label="), "dynamic actions should expose aria labels");
assert(appJs.includes("<img") && appJs.includes('alt="${escapeHtml(product.brand + " " + product.name)}"'), "dynamic product imagery should provide descriptive alt text");

console.log("UI accessibility smoke checks passed.");
