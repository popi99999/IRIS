import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, "index.html"), "utf8");
const js = readFileSync(join(root, "iris-plus.js"), "utf8");

test("IRIS Pro appears inside the profile account menu under the sales area", () => {
  const profileMenuStart = html.indexOf('id="tnProfileMenu"');
  const mobileMenuStart = html.indexOf('id="tnMobileMenu"');
  const profileMenu = html.slice(profileMenuStart, mobileMenuStart);

  const salesIndex = profileMenu.indexOf('id="tnMenuSalesBtn"');
  const irisProIndex = profileMenu.indexOf('id="tnMenuIrisProBtn"');
  const messagesIndex = profileMenu.indexOf('id="tnMenuMessagesBtn"');

  assert.ok(profileMenuStart > -1, "profile menu exists");
  assert.ok(salesIndex > -1, "sales entry exists");
  assert.ok(irisProIndex > salesIndex, "IRIS Pro is directly after the selling entry");
  assert.ok(messagesIndex > irisProIndex, "IRIS Pro remains inside the main profile menu group");
  assert.match(profileMenu, /data-menu-section="area-vendite"/);
  assert.match(profileMenu, /IRIS Pro/);
});

test("IRIS Pro is not added to the main navbar", () => {
  const beforeProfileMenu = html.slice(0, html.indexOf('id="tnProfileMenu"'));
  assert.equal(beforeProfileMenu.includes('id="tnMenuIrisProBtn"'), false);
  assert.equal(beforeProfileMenu.includes('id="tnMobileIrisProBtn"'), false);
});

test("mobile account menu includes the same IRIS Pro entry", () => {
  const mobileMenu = html.slice(html.indexOf('id="tnMobileMenu"'));
  const sellIndex = mobileMenu.indexOf('id="tnMobileSellBtn"');
  const irisProIndex = mobileMenu.indexOf('id="tnMobileIrisProBtn"');

  assert.ok(irisProIndex > sellIndex, "mobile IRIS Pro is placed near the mobile selling action");
  assert.match(mobileMenu, /openIrisProMenuEntry\(\)/);
});

test("profile menu uses status badges and correct routing targets", () => {
  [
    "Richiedi accesso",
    "Completa richiesta",
    "In revisione",
    "Serve integrazione",
    "Dashboard Pro",
    "Non approvato",
    "Sospeso"
  ].forEach(function (label) {
    assert.ok(js.includes(label), `missing status badge: ${label}`);
  });

  assert.match(js, /targetSection:\s*approved\s*\?\s*"professional_dashboard"\s*:\s*"professional"/);
  assert.match(js, /function openIrisProMenuEntry\(\)/);
  assert.match(js, /requireAuth\(openTarget\)/);
});

test("professional seller tools remain protected behind approved status checks", () => {
  assert.match(js, /if \(seller\.status !== "approved"\)/);
  assert.match(js, /requireProfessionalSellerTool\("inventory_hub"\)/);
  assert.match(js, /requireProfessionalSellerTool\("reports"\)/);
  assert.match(js, /role !== "professional_seller_approved"/);
});
