import test from "node:test";
import assert from "node:assert/strict";

import {
  assertProfessionalAccess,
  buildImportPreview,
  canAccessProfessionalSellerTool,
  detectColumnMappings,
  detectDuplicate,
  generateIrisTemplateCsv,
  isAllowedFeedUrl,
  isPublicSafeUrl,
  normalizeProductData,
  parseCsv,
  roleFromSellerStatus,
  sanitizeCsvCellForExport,
  validateProduct
} from "../professional-seller-core.mjs";

const goodProduct = {
  seller_id: "seller-1",
  title: "Speedy 25 Monogram",
  brand: "Louis Vuitton",
  category: "Borse",
  condition: "Excellent",
  price: 780,
  currency: "EUR",
  image_urls: ["https://example.com/photo-1.jpg"],
  quantity: 1
};

test("detects common mixed Italian and English seller columns", () => {
  const mappings = detectColumnMappings([
    "Marchio",
    "Prezzo vendita",
    "Foto",
    "Condizione",
    "Nome articolo",
    "Categoria",
    "Seller SKU",
    "Colore"
  ]);

  assert.equal(mappings.brand.sourceColumn, "Marchio");
  assert.equal(mappings.price.sourceColumn, "Prezzo vendita");
  assert.equal(mappings.image_urls.sourceColumn, "Foto");
  assert.equal(mappings.condition.sourceColumn, "Condizione");
  assert.equal(mappings.sku.sourceColumn, "Seller SKU");
  assert.ok(mappings.brand.confidence >= 0.9);
});

test("normalizes safe values while preserving originals for review", () => {
  const result = normalizeProductData({
    title: "  Speedy 25 Monogram  ",
    brand: "Louis Vuitton",
    category: "Borse",
    condition: "9/10",
    price: "€1.280,50",
    currency: "",
    colour: " nero ",
    size: "48 IT",
    image_urls: "https://example.com/a.jpg, https://example.com/b.jpg",
    authentication_required: "sì",
    quantity: "1"
  });

  assert.equal(result.normalized.condition, "Excellent");
  assert.equal(result.normalized.currency, "EUR");
  assert.equal(result.normalized.colour, "Black");
  assert.equal(result.normalized.size, "IT 48");
  assert.equal(result.normalized.price, 1280.5);
  assert.equal(result.normalized.authentication_required, true);
  assert.equal(result.originals.colour.originalValue, " nero ");
});

test("validates required fields and rejects unsafe image URLs", () => {
  assert.equal(validateProduct(goodProduct, { sellerId: "seller-1" }).status, "ready");

  const invalid = validateProduct({
    seller_id: "seller-1",
    title: "",
    brand: "",
    category: "",
    condition: "Unknown",
    price: -12,
    currency: "DOGE",
    image_urls: ["http://127.0.0.1/private.png"],
    quantity: -1
  }, { sellerId: "seller-1" });

  assert.equal(invalid.status, "error");
  assert.ok(invalid.errors.includes("Missing title"));
  assert.ok(invalid.errors.includes("Missing brand"));
  assert.ok(invalid.errors.includes("Invalid price"));
  assert.ok(invalid.errors.includes("Invalid image URL"));
  assert.ok(invalid.errors.includes("Invalid quantity"));
});

test("blocks products that claim another seller ownership", () => {
  const result = validateProduct(Object.assign({}, goodProduct, { seller_id: "seller-2" }), {
    expectedSellerId: "seller-1"
  });

  assert.equal(result.status, "error");
  assert.ok(result.errors.includes("Product belongs to another seller"));
});

test("blocks private feed URLs and permits public https feeds", () => {
  assert.equal(isAllowedFeedUrl("https://example.com/feed.csv"), true);
  assert.equal(isAllowedFeedUrl("http://example.com/feed.csv"), false);
  assert.equal(isAllowedFeedUrl("https://127.0.0.1/feed.csv"), false);
  assert.equal(isAllowedFeedUrl("https://169.254.169.254/latest/meta-data"), false);
  assert.equal(isPublicSafeUrl("http://192.168.1.10/image.jpg", { allowHttp: true }), false);
});

test("sanitizes CSV formula injection payloads", () => {
  assert.equal(sanitizeCsvCellForExport("=IMPORTXML(\"https://evil.test\")").startsWith("'="), true);
  const parsed = parseCsv("Brand,Price,Images\n=CMD(),€120,https://example.com/a.jpg\n");
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.rows[0].Brand, "'=CMD()");
});

test("parses CSV and flags duplicate SKUs in one import preview", () => {
  const parsed = parseCsv([
    "Nome articolo,Marchio,Categoria,Condizione,Prezzo,Valuta,Foto,Seller SKU",
    "Speedy 25,Louis Vuitton,Borse,ottimo,780,EUR,https://example.com/a.jpg,SKU-1",
    "Speedy 25 Bis,Louis Vuitton,Borse,ottimo,790,EUR,https://example.com/b.jpg,SKU-1"
  ].join("\n"));
  const mapping = detectColumnMappings(parsed.headers);
  const preview = buildImportPreview(parsed.rows, mapping, [], { sellerId: "seller-1" });

  assert.equal(preview.totalRows, 2);
  assert.equal(preview.withBlockingErrors, 1);
  assert.ok(preview.rows[1].validationErrors.includes("Duplicate SKU"));
});

test("detects existing products by priority keys and does not create duplicates", () => {
  const duplicateBySku = detectDuplicate(
    Object.assign({}, goodProduct, { sku: "ABC-1" }),
    [{ id: "listing-1", seller_id: "seller-1", sku: "abc-1" }],
    { sellerId: "seller-1" }
  );
  assert.equal(duplicateBySku.duplicate, true);
  assert.equal(duplicateBySku.reason, "seller_id + sku");

  const fuzzy = detectDuplicate(
    Object.assign({}, goodProduct, { image_urls: ["https://example.com/photo-1.jpg"] }),
    [{ id: "listing-2", seller_id: "seller-1", title: "Speedy 25 Monogram", brand: "Louis Vuitton", price: 780, image_urls: ["https://example.com/photo-1.jpg"] }],
    { sellerId: "seller-1" }
  );
  assert.equal(fuzzy.duplicate, true);
  assert.equal(fuzzy.reviewRequired, true);
});

test("enforces professional seller role access rules", () => {
  const pending = roleFromSellerStatus("pending_verification");
  const approved = roleFromSellerStatus("approved");
  const suspended = roleFromSellerStatus("suspended");

  assert.equal(canAccessProfessionalSellerTool(pending, "dashboard"), false);
  assert.equal(canAccessProfessionalSellerTool(pending, "application_status"), true);
  assert.equal(canAccessProfessionalSellerTool(approved, "inventory_hub"), true);
  assert.equal(canAccessProfessionalSellerTool(suspended, "bulk_upload", "publish"), false);
  assert.equal(canAccessProfessionalSellerTool(roleFromSellerStatus("", true), "admin_review"), true);
  assert.throws(() => assertProfessionalAccess(pending, "bulk_upload", "import"), /permission denied/i);
});

test("generates the official IRIS inventory template columns", () => {
  const template = generateIrisTemplateCsv();
  const header = template.split("\n")[0].split(",");

  assert.ok(header.includes("external_id"));
  assert.ok(header.includes("sku"));
  assert.ok(header.includes("image_urls"));
  assert.ok(header.includes("authentication_required"));
  assert.ok(header.includes("status"));
});

test("rejects empty, headerless and oversized CSV inputs", () => {
  assert.ok(parseCsv("").errors.includes("Empty file"));
  assert.ok(parseCsv(", , \n").errors.includes("File has no headers"));

  const huge = ["Brand,Price"].concat(Array.from({ length: 4 }, (_, index) => `LV,${index + 1}`)).join("\n");
  assert.ok(parseCsv(huge, { maxRows: 2 }).errors[0].includes("more than 2 rows"));
});
