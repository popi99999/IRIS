export const PROFESSIONAL_SELLER_STATUSES = Object.freeze([
  "pending_verification",
  "approved",
  "rejected",
  "suspended"
]);

export const PROFESSIONAL_ROLES = Object.freeze({
  normal: "normal_user",
  pending: "professional_seller_pending",
  approved: "professional_seller_approved",
  rejected: "professional_seller_rejected",
  suspended: "professional_seller_suspended",
  admin: "admin"
});

export const INVENTORY_SOURCE_TYPES = Object.freeze([
  "google_sheets",
  "csv_feed",
  "manual_upload",
  "future_shopify",
  "future_woocommerce",
  "future_custom_api"
]);

export const IRIS_INVENTORY_FIELDS = Object.freeze([
  "external_id",
  "sku",
  "title",
  "brand",
  "category",
  "subcategory",
  "size",
  "colour",
  "condition",
  "price",
  "currency",
  "description",
  "material",
  "measurements",
  "image_urls",
  "quantity",
  "shipping_origin",
  "authentication_required",
  "status"
]);

export const REQUIRED_IMPORT_FIELDS = Object.freeze([
  "title",
  "brand",
  "category",
  "condition",
  "price",
  "currency",
  "image_urls"
]);

export const VALID_LISTING_STATUSES = Object.freeze([
  "active",
  "draft",
  "sold",
  "disabled",
  "archived"
]);

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 10000;

const COLUMN_ALIASES = Object.freeze({
  external_id: ["external id", "external_id", "source id", "feed id", "item id", "id prodotto", "id esterno"],
  sku: ["sku", "internal code", "seller sku", "codice interno", "codice seller", "codice articolo", "ref", "rif"],
  title: ["title", "name", "product name", "item name", "nome", "nome articolo", "titolo", "articolo"],
  brand: ["brand", "designer", "maison", "marchio", "marca", "brand designer", "designer brand"],
  category: ["category", "categoria", "type", "tipo", "department", "reparto"],
  subcategory: ["subcategory", "sottocategoria", "sub category", "modello categoria"],
  size: ["size", "taglia", "it size", "eu size", "misura", "dimensione", "waist size"],
  colour: ["colour", "color", "colore", "couleur"],
  condition: ["condition", "stato", "condizione", "grade", "conditions"],
  price: ["price", "prezzo", "selling price", "sale price", "retail price", "prezzo vendita", "amount", "importo"],
  currency: ["currency", "valuta", "coin", "currency code"],
  description: ["description", "descrizione", "details", "dettagli", "note", "notes"],
  material: ["material", "materiale", "fabric", "tessuto", "composition", "composizione"],
  measurements: ["measurements", "misure", "dimensioni", "measure", "fit measurements"],
  image_urls: ["photos", "images", "image urls", "image url", "foto", "immagini", "photo urls", "url immagini", "url foto"],
  quantity: ["quantity", "stock", "qty", "quantita", "quantità", "disponibilita", "disponibilità"],
  shipping_origin: ["shipping origin", "ship from", "origine spedizione", "da dove spedisci", "country origin", "warehouse"],
  authentication_required: ["authentication required", "auth required", "autenticazione richiesta", "authenticate", "verified"],
  status: ["status", "stato annuncio", "listing status", "inventory status", "publish status"]
});

const COLOUR_ALIASES = Object.freeze({
  black: ["black", "nero", "noir", "schwarz"],
  white: ["white", "bianco", "blanc", "weiss", "weiß"],
  brown: ["brown", "marrone", "cuoio", "camel", "tabacco"],
  red: ["red", "rosso", "rouge"],
  blue: ["blue", "blu", "bleu", "navy"],
  grey: ["grey", "gray", "grigio", "gris"],
  green: ["green", "verde", "vert"],
  pink: ["pink", "rosa", "rose"],
  beige: ["beige", "cream", "crema", "avorio", "ivory"],
  gold: ["gold", "oro", "dorato"],
  silver: ["silver", "argento", "argentato"],
  purple: ["purple", "viola", "lilla", "lilac"]
});

const CONDITION_ALIASES = Object.freeze({
  New: ["new", "nuovo", "never worn", "mai indossato", "nuovo con tag", "nuovo senza tag", "10/10"],
  "Like New": ["like new", "come nuovo", "as new", "pari al nuovo", "9.5/10"],
  Excellent: ["excellent", "eccellente", "ottimo", "ottime condizioni", "9/10"],
  Good: ["good", "buono", "buone condizioni", "8/10", "7/10"],
  Fair: ["fair", "accettabile", "discreto", "discrete condizioni", "6/10"],
  "Needs Restoration": ["da restauro", "needs restoration", "restauro", "poor", "damaged"]
});

const CURRENCY_ALIASES = Object.freeze({
  EUR: ["eur", "euro", "€"],
  USD: ["usd", "dollar", "dollars", "$"],
  GBP: ["gbp", "pound", "pounds", "£"]
});

const BOOLEAN_TRUE = new Set(["yes", "true", "si", "sì", "y", "1", "vero", "oui"]);
const BOOLEAN_FALSE = new Set(["no", "false", "n", "0", "falso", "non", "nope"]);

function removeDiacritics(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeHeader(value) {
  return removeDiacritics(value)
    .toLowerCase()
    .replace(/[_/.-]+/g, " ")
    .replace(/[^a-z0-9€£$ ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeText(value, maxLength = 2000) {
  const cleaned = String(value ?? "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, maxLength);
}

export function sanitizeCsvCellForExport(value) {
  const cleaned = sanitizeText(value, 5000);
  return /^[=+\-@]/.test(cleaned) ? "'" + cleaned : cleaned;
}

function scoreHeaderAgainstField(normalizedHeader, field) {
  if (normalizedHeader === field.replace(/_/g, " ")) {
    return { confidence: 1, matchType: "field" };
  }
  const aliases = COLUMN_ALIASES[field] || [];
  if (aliases.includes(normalizedHeader)) {
    return { confidence: 0.94, matchType: "alias" };
  }
  const compact = normalizedHeader.replace(/\s+/g, "");
  const alias = aliases.find(function (candidate) {
    const normalizedAlias = normalizeHeader(candidate);
    return compact === normalizedAlias.replace(/\s+/g, "");
  });
  if (alias) {
    return { confidence: 0.9, matchType: "compact_alias" };
  }
  const fuzzy = aliases.find(function (candidate) {
    const normalizedAlias = normalizeHeader(candidate);
    return normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader);
  });
  if (fuzzy && normalizedHeader.length >= 3) {
    return { confidence: 0.62, matchType: "fuzzy" };
  }
  return { confidence: 0, matchType: "none" };
}

export function detectColumnMappings(headers) {
  const normalizedHeaders = (headers || []).map(function (header, index) {
    return {
      original: String(header || "").trim(),
      normalized: normalizeHeader(header),
      index
    };
  });

  const mappings = {};
  IRIS_INVENTORY_FIELDS.forEach(function (field) {
    let best = null;
    normalizedHeaders.forEach(function (header) {
      const score = scoreHeaderAgainstField(header.normalized, field);
      if (!best || score.confidence > best.confidence) {
        best = Object.assign({}, score, header);
      }
    });
    mappings[field] = {
      irisField: field,
      sourceColumn: best && best.confidence > 0 ? best.original : "",
      sourceIndex: best && best.confidence > 0 ? best.index : -1,
      confidence: best ? Number(best.confidence.toFixed(2)) : 0,
      matchType: best ? best.matchType : "none",
      required: REQUIRED_IMPORT_FIELDS.includes(field),
      needsConfirmation: !best || best.confidence < 0.8
    };
  });
  return mappings;
}

export function buildManualMappingFromObject(mappingObject) {
  const mapping = {};
  IRIS_INVENTORY_FIELDS.forEach(function (field) {
    const value = mappingObject && mappingObject[field] ? String(mappingObject[field]) : "";
    mapping[field] = {
      irisField: field,
      sourceColumn: value,
      sourceIndex: -1,
      confidence: value ? 1 : 0,
      matchType: value ? "manual" : "none",
      required: REQUIRED_IMPORT_FIELDS.includes(field),
      needsConfirmation: false
    };
  });
  return mapping;
}

function mapRow(row, mapping) {
  const mapped = {};
  IRIS_INVENTORY_FIELDS.forEach(function (field) {
    const entry = mapping[field] || {};
    mapped[field] = entry.sourceColumn ? row[entry.sourceColumn] ?? "" : "";
  });
  return mapped;
}

function findAliasMatch(value, aliasMap) {
  const normalized = normalizeHeader(value);
  if (!normalized) {
    return { value: "", confident: false };
  }
  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    if (aliases.includes(normalized)) {
      return { value: canonical, confident: true };
    }
  }
  return { value: sanitizeText(value, 80), confident: false };
}

export function normalizeColour(value) {
  const match = findAliasMatch(value, COLOUR_ALIASES);
  if (!match.value) {
    return { originalValue: value ?? "", normalizedValue: "", confident: false };
  }
  const labels = {
    black: "Black",
    white: "White",
    brown: "Brown",
    red: "Red",
    blue: "Blue",
    grey: "Grey",
    green: "Green",
    pink: "Pink",
    beige: "Beige",
    gold: "Gold",
    silver: "Silver",
    purple: "Purple"
  };
  return {
    originalValue: value ?? "",
    normalizedValue: labels[match.value] || match.value,
    confident: match.confident
  };
}

export function normalizeCondition(value) {
  const raw = String(value ?? "").trim();
  const rawNumeric = raw.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:\/\s*10)?$/);
  if (rawNumeric) {
    const score = Number(rawNumeric[1].replace(",", "."));
    if (score >= 9.5) return { originalValue: value ?? "", normalizedValue: "Like New", confident: true };
    if (score >= 9) return { originalValue: value ?? "", normalizedValue: "Excellent", confident: true };
    if (score >= 7) return { originalValue: value ?? "", normalizedValue: "Good", confident: true };
    if (score >= 5) return { originalValue: value ?? "", normalizedValue: "Fair", confident: true };
  }
  const normalized = normalizeHeader(value);
  if (!normalized) {
    return { originalValue: value ?? "", normalizedValue: "", confident: false };
  }
  for (const [canonical, aliases] of Object.entries(CONDITION_ALIASES)) {
    if (aliases.includes(normalized)) {
      return { originalValue: value ?? "", normalizedValue: canonical, confident: true };
    }
  }
  const numeric = normalized.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:\/\s*10)?$/);
  if (numeric) {
    const score = Number(numeric[1].replace(",", "."));
    if (score >= 9.5) return { originalValue: value ?? "", normalizedValue: "Like New", confident: true };
    if (score >= 9) return { originalValue: value ?? "", normalizedValue: "Excellent", confident: true };
    if (score >= 7) return { originalValue: value ?? "", normalizedValue: "Good", confident: true };
    if (score >= 5) return { originalValue: value ?? "", normalizedValue: "Fair", confident: true };
  }
  return { originalValue: value ?? "", normalizedValue: sanitizeText(value, 80), confident: false };
}

export function normalizeCurrency(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return { originalValue: value ?? "", normalizedValue: "", confident: false };
  }
  const normalized = normalizeHeader(raw);
  for (const [canonical, aliases] of Object.entries(CURRENCY_ALIASES)) {
    if (aliases.includes(normalized) || aliases.includes(raw)) {
      return { originalValue: value ?? "", normalizedValue: canonical, confident: true };
    }
  }
  return /^[A-Z]{3}$/i.test(raw)
    ? { originalValue: value ?? "", normalizedValue: raw.toUpperCase(), confident: ["EUR", "USD", "GBP"].includes(raw.toUpperCase()) }
    : { originalValue: value ?? "", normalizedValue: sanitizeText(value, 12).toUpperCase(), confident: false };
}

export function normalizeBoolean(value) {
  const normalized = normalizeHeader(value);
  if (BOOLEAN_TRUE.has(normalized)) {
    return { originalValue: value ?? "", normalizedValue: true, confident: true };
  }
  if (BOOLEAN_FALSE.has(normalized)) {
    return { originalValue: value ?? "", normalizedValue: false, confident: true };
  }
  return { originalValue: value ?? "", normalizedValue: Boolean(value), confident: false };
}

export function normalizeSize(value) {
  const raw = sanitizeText(value, 40);
  const normalized = raw.toUpperCase().replace(/\s+/g, " ").trim();
  if (!normalized) {
    return { originalValue: value ?? "", normalizedValue: "", confident: false };
  }
  const alphaMap = {
    MEDIUM: "M",
    SMALL: "S",
    LARGE: "L",
    "EXTRA SMALL": "XS",
    "EXTRA LARGE": "XL"
  };
  if (alphaMap[normalized]) {
    return { originalValue: value ?? "", normalizedValue: alphaMap[normalized], confident: true };
  }
  if (/^(XS|S|M|L|XL|XXL)$/.test(normalized)) {
    return { originalValue: value ?? "", normalizedValue: normalized, confident: true };
  }
  let match = normalized.match(/^(?:IT|EU)\s*([0-9]{2,3})$/);
  if (match) {
    return { originalValue: value ?? "", normalizedValue: normalized.replace(/\s+/, " "), confident: true };
  }
  match = normalized.match(/^([0-9]{2,3})\s*(IT|EU)$/);
  if (match) {
    return { originalValue: value ?? "", normalizedValue: `${match[2]} ${match[1]}`, confident: true };
  }
  return { originalValue: value ?? "", normalizedValue: raw, confident: false };
}

function parsePriceCurrency(value) {
  const raw = String(value ?? "").trim();
  const currencySymbol = raw.includes("€") ? "EUR" : raw.includes("$") ? "USD" : raw.includes("£") ? "GBP" : "";
  let cleaned = raw.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) {
    return { price: NaN, currency: currencySymbol, confident: false };
  }
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  const price = Number(cleaned);
  return { price, currency: currencySymbol, confident: Number.isFinite(price) };
}

export function normalizeProductData(mappedData) {
  const mapped = mappedData || {};
  const priceParsed = parsePriceCurrency(mapped.price);
  const currencyNormalized = normalizeCurrency(mapped.currency || priceParsed.currency);
  const condition = normalizeCondition(mapped.condition);
  const colour = normalizeColour(mapped.colour);
  const size = normalizeSize(mapped.size);
  const authenticationRequired = normalizeBoolean(mapped.authentication_required);
  const statusRaw = normalizeHeader(mapped.status || "draft").replace(/\s+/g, "_");
  const status = VALID_LISTING_STATUSES.includes(statusRaw) ? statusRaw : "draft";
  const normalized = {
    external_id: sanitizeText(mapped.external_id, 120),
    sku: sanitizeText(mapped.sku, 120),
    title: sanitizeText(mapped.title, 180),
    brand: sanitizeText(mapped.brand, 80),
    category: sanitizeText(mapped.category, 80),
    subcategory: sanitizeText(mapped.subcategory, 80),
    size: size.normalizedValue,
    colour: colour.normalizedValue,
    condition: condition.normalizedValue,
    price: priceParsed.price,
    currency: currencyNormalized.normalizedValue,
    description: sanitizeText(mapped.description, 3000),
    material: sanitizeText(mapped.material, 140),
    measurements: sanitizeText(mapped.measurements, 1200),
    image_urls: splitImageUrls(mapped.image_urls),
    quantity: mapped.quantity === "" || mapped.quantity === null || mapped.quantity === undefined ? 1 : Number(String(mapped.quantity).replace(",", ".")),
    shipping_origin: sanitizeText(mapped.shipping_origin, 120),
    authentication_required: authenticationRequired.normalizedValue,
    status
  };
  return {
    normalized,
    originals: {
      size,
      colour,
      condition,
      currency: currencyNormalized,
      authentication_required: authenticationRequired
    },
    warnings: [
      !size.confident && mapped.size ? "Size needs seller review" : "",
      !colour.confident && mapped.colour ? "Colour needs seller review" : "",
      !condition.confident && mapped.condition ? "Condition needs seller review" : "",
      !currencyNormalized.confident && mapped.currency ? "Currency needs seller review" : ""
    ].filter(Boolean)
  };
}

export function splitImageUrls(value) {
  if (Array.isArray(value)) {
    return value.map(String).map(sanitizeText).filter(Boolean);
  }
  return String(value || "")
    .split(/[,;\n]+/)
    .map(function (url) { return sanitizeText(url, 500); })
    .filter(Boolean);
}

function hostLooksPrivate(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host === "metadata.google.internal") return true;
  if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipv4) return false;
  const a = Number(ipv4[1]);
  const b = Number(ipv4[2]);
  if (a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function isPublicSafeUrl(value, options = {}) {
  try {
    const url = new URL(String(value || "").trim());
    const protocols = options.allowHttp ? ["http:", "https:"] : ["https:"];
    if (!protocols.includes(url.protocol)) {
      return false;
    }
    if (hostLooksPrivate(url.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function isAllowedFeedUrl(value) {
  return isPublicSafeUrl(value, { allowHttp: false });
}

export function validateProduct(normalizedData, context = {}) {
  const product = normalizedData || {};
  const errors = [];
  const warnings = [];
  const sellerId = context.sellerId || product.seller_id;
  const expectedSellerId = context.expectedSellerId || context.sellerId;

  if (!sellerId) errors.push("Missing seller_id");
  if (expectedSellerId && product.seller_id && String(product.seller_id) !== String(expectedSellerId)) {
    errors.push("Product belongs to another seller");
  }
  if (!product.title) errors.push("Missing title");
  if (!product.brand) errors.push("Missing brand");
  if (!product.category) errors.push("Missing category");
  if (!product.condition) errors.push("Missing condition");
  if (!["New", "Like New", "Excellent", "Good", "Fair", "Needs Restoration"].includes(product.condition)) errors.push("Invalid condition");
  if (!Number.isFinite(Number(product.price))) errors.push("Invalid price");
  if (Number(product.price) <= 0) errors.push("Invalid price");
  if (!["EUR", "USD", "GBP"].includes(product.currency)) errors.push("Invalid currency");
  if (!Array.isArray(product.image_urls) || product.image_urls.length === 0) {
    errors.push("Missing image");
  } else {
    product.image_urls.forEach(function (url) {
      if (!isPublicSafeUrl(url, { allowHttp: true })) {
        errors.push("Invalid image URL");
      }
    });
  }
  if (!Number.isFinite(Number(product.quantity)) || Number(product.quantity) < 0) {
    errors.push("Invalid quantity");
  }
  if (product.title && product.title.length > 180) {
    warnings.push("Title was truncated");
  }
  if (product.description && /javascript:/i.test(product.description)) {
    errors.push("Unsafe description content");
  }
  if (context.skus && product.sku && context.skus.has(String(product.sku).toLowerCase())) {
    errors.push("Duplicate SKU");
  }
  return {
    status: errors.length ? "error" : warnings.length ? "warning" : "ready",
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings))
  };
}

export function detectDuplicate(product, existingProducts = [], context = {}) {
  const sellerId = String(context.sellerId || product.seller_id || "");
  const comparablePrice = Number(product.price || 0);
  const imageUrls = Array.isArray(product.image_urls) ? product.image_urls : splitImageUrls(product.image_urls);
  for (const existing of existingProducts) {
    const existingSellerId = String(existing.seller_id || existing.sellerId || existing.ownerId || "");
    if (sellerId && existingSellerId && existingSellerId !== sellerId) {
      continue;
    }
    if (product.external_id && existing.external_id && String(product.external_id) === String(existing.external_id)) {
      return { duplicate: true, confidence: 1, reason: "seller_id + external_id", product: existing };
    }
    if (product.sku && existing.sku && String(product.sku).toLowerCase() === String(existing.sku).toLowerCase()) {
      return { duplicate: true, confidence: 0.98, reason: "seller_id + sku", product: existing };
    }
    if (product.source_id && existing.source_id && product.source_item_id && existing.source_item_id &&
      String(product.source_id) === String(existing.source_id) && String(product.source_item_id) === String(existing.source_item_id)) {
      return { duplicate: true, confidence: 0.98, reason: "seller_id + source_id + source_item_id", product: existing };
    }
    const sameText = normalizeHeader(product.title) && normalizeHeader(product.title) === normalizeHeader(existing.title || existing.name);
    const sameBrand = normalizeHeader(product.brand) && normalizeHeader(product.brand) === normalizeHeader(existing.brand);
    const samePrice = Math.abs(Number(existing.price || 0) - comparablePrice) < 0.01;
    const existingImages = Array.isArray(existing.image_urls) ? existing.image_urls : Array.isArray(existing.images) ? existing.images : splitImageUrls(existing.image || "");
    const sameImage = imageUrls.some(function (url) { return existingImages.includes(url); });
    if (sameText && sameBrand && samePrice && sameImage) {
      return { duplicate: true, confidence: 0.72, reason: "title + brand + price + image URL", product: existing, reviewRequired: true };
    }
  }
  return { duplicate: false, confidence: 0, reason: "" };
}

export function parseCsv(csvText, options = {}) {
  const maxRows = options.maxRows || MAX_IMPORT_ROWS;
  const text = String(csvText || "").replace(/^\uFEFF/, "");
  if (!text.trim()) {
    return { headers: [], rows: [], errors: ["Empty file"] };
  }
  const records = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      records.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell);
  records.push(row);
  const meaningfulRecords = records.filter(function (record) {
    return record.some(function (value) { return String(value || "").trim(); });
  });
  if (!meaningfulRecords.length) {
    return records.some(function (record) { return record.length > 1; })
      ? { headers: [], rows: [], errors: ["File has no headers"] }
      : { headers: [], rows: [], errors: ["Empty file"] };
  }
  const headers = meaningfulRecords[0].map(function (header) { return sanitizeText(header, 120); });
  if (!headers.some(Boolean)) {
    return { headers: [], rows: [], errors: ["File has no headers"] };
  }
  const dataRecords = meaningfulRecords.slice(1);
  if (dataRecords.length > maxRows) {
    return { headers, rows: [], errors: [`File has more than ${maxRows} rows`] };
  }
  const rows = dataRecords.map(function (record, index) {
    const output = { __rowNumber: index + 2 };
    headers.forEach(function (header, headerIndex) {
      output[header] = sanitizeCsvCellForExport(record[headerIndex] ?? "");
    });
    return output;
  });
  return { headers, rows, errors: [] };
}

export function buildImportPreview(rows, mapping, existingProducts = [], context = {}) {
  const seenSkus = new Set();
  const parsedRows = [];
  let ready = 0;
  let warning = 0;
  let error = 0;
  let duplicates = 0;
  let updates = 0;
  let creates = 0;
  rows.forEach(function (row, index) {
    const mapped = mapRow(row, mapping);
    const normalizedResult = normalizeProductData(mapped);
    const validation = validateProduct(normalizedResult.normalized, Object.assign({}, context, { skus: seenSkus }));
    const duplicate = detectDuplicate(normalizedResult.normalized, existingProducts, context);
    if (normalizedResult.normalized.sku) {
      seenSkus.add(String(normalizedResult.normalized.sku).toLowerCase());
    }
    const warnings = validation.warnings.concat(normalizedResult.warnings);
    if (duplicate.duplicate) {
      duplicates += 1;
      if (duplicate.reviewRequired) {
        warnings.push("Possible duplicate needs review");
      } else {
        updates += 1;
      }
    } else if (!validation.errors.length) {
      creates += 1;
    }
    const status = validation.errors.length ? "error" : warnings.length ? "warning" : "ready";
    if (status === "ready") ready += 1;
    if (status === "warning") warning += 1;
    if (status === "error") error += 1;
    parsedRows.push({
      rowNumber: row.__rowNumber || index + 2,
      rawData: row,
      mappedData: mapped,
      normalizedData: normalizedResult.normalized,
      validationErrors: validation.errors,
      validationWarnings: warnings,
      duplicate,
      status
    });
  });
  return {
    totalRows: rows.length,
    readyToPublish: ready,
    withWarnings: warning,
    withBlockingErrors: error,
    duplicateProducts: duplicates,
    rowsSkipped: 0,
    estimatedCreates: creates,
    estimatedUpdates: updates,
    rows: parsedRows
  };
}

export function generateIrisTemplateCsv() {
  const headers = IRIS_INVENTORY_FIELDS;
  const sample = [
    "ext-1001",
    "SKU-1001",
    "Speedy 25 Monogram",
    "Louis Vuitton",
    "Borse",
    "Top handle",
    "Taglia unica",
    "Marrone",
    "Ottimo",
    "780",
    "EUR",
    "Borsa con normali segni d'uso, zip funzionante e lucchetto incluso.",
    "Canvas Monogram",
    "25 x 19 x 15 cm",
    "https://example.com/photo-1.jpg, https://example.com/photo-2.jpg",
    "1",
    "Italia",
    "yes",
    "draft"
  ];
  return [headers, sample]
    .map(function (row) {
      return row.map(function (cell) {
        const safe = sanitizeCsvCellForExport(cell);
        return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
      }).join(",");
    })
    .join("\n");
}

export function roleFromSellerStatus(status, isAdmin = false) {
  if (isAdmin) return PROFESSIONAL_ROLES.admin;
  if (status === "approved") return PROFESSIONAL_ROLES.approved;
  if (status === "rejected") return PROFESSIONAL_ROLES.rejected;
  if (status === "suspended") return PROFESSIONAL_ROLES.suspended;
  if (status === "pending_verification") return PROFESSIONAL_ROLES.pending;
  return PROFESSIONAL_ROLES.normal;
}

export function canAccessProfessionalSellerTool(role, tool, action = "view") {
  if (role === PROFESSIONAL_ROLES.admin) return true;
  if (tool === "application_status") {
    return [
      PROFESSIONAL_ROLES.pending,
      PROFESSIONAL_ROLES.rejected,
      PROFESSIONAL_ROLES.suspended,
      PROFESSIONAL_ROLES.approved
    ].includes(role);
  }
  if (role !== PROFESSIONAL_ROLES.approved) return false;
  if (action === "publish" || action === "sync" || action === "import" || action === "update") {
    return role === PROFESSIONAL_ROLES.approved;
  }
  return [
    "dashboard",
    "inventory_hub",
    "bulk_upload",
    "live_sync",
    "orders",
    "revenue",
    "documents",
    "reports",
    "sync_history"
  ].includes(tool);
}

export function assertProfessionalAccess(role, tool, action = "view") {
  if (!canAccessProfessionalSellerTool(role, tool, action)) {
    const error = new Error("Professional seller permission denied");
    error.code = "PROFESSIONAL_SELLER_FORBIDDEN";
    error.status = 403;
    throw error;
  }
  return true;
}
