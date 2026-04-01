(function () {
  const STORAGE_KEYS = {
    users: "iris-users",
    session: "iris-user-session",
    cart: "iris-cart",
    listings: "iris-local-listings",
    orders: "iris-orders",
    favorites: "iris-favorites",
    notifications: "iris-notifications",
    emailOutbox: "iris-email-outbox",
    supportTickets: "iris-support-tickets",
    auditLog: "iris-audit-log",
    chats: "iris-chats",
    reviews: "iris-reviews"
  };

  const PLATFORM_CONFIG = {
    ownerEmail: "owner@iris-fashion.it",
    adminEmails: ["owner@iris-fashion.it", "admin@iris-fashion.it"],
    supportEmail: "support@iris-fashion.it",
    emailFrom: "IRIS <noreply@iris-fashion.it>",
    platformFeeRate: 0.12
  };

  const LOCALE_SETTINGS = window.IRIS_LOCALE_SETTINGS || {
    it: { label: "IT", nativeLabel: "Italiano", locale: "it-IT", currency: "EUR", rate: 1, dir: "ltr" },
    en: { label: "EN", nativeLabel: "English", locale: "en-US", currency: "USD", rate: 1.09, dir: "ltr" }
  };
  const HOME_COPY = window.IRIS_HOME_COPY || {};
  const FACET_TRANSLATIONS = window.IRIS_FACET_TRANSLATIONS || {};
  const I18N_PACKS = window.IRIS_I18N_PACKS || {};

  const SHIPPING_COST = 25;
  const state = {
    users: loadJson(STORAGE_KEYS.users, []),
    currentUser: loadJson(STORAGE_KEYS.session, null),
    cart: loadJson(STORAGE_KEYS.cart, []),
    listings: loadJson(STORAGE_KEYS.listings, []),
    orders: loadJson(STORAGE_KEYS.orders, []),
    notifications: loadJson(STORAGE_KEYS.notifications, []),
    emailOutbox: loadJson(STORAGE_KEYS.emailOutbox, []),
    supportTickets: loadJson(STORAGE_KEYS.supportTickets, []),
    auditLog: loadJson(STORAGE_KEYS.auditLog, []),
    reviews: loadJson(STORAGE_KEYS.reviews, []),
    pendingAction: null,
    authMode: "login",
    authReturnView: "home",
    checkoutItems: [],
    checkoutSource: "cart",
    sellPhotos: [],
    activeDetailImage: 0,
    lastNonDetailView: "home",
    opsModalMode: null,
    opsModalPayload: null
  };

  const existingFavorites = loadJson(STORAGE_KEYS.favorites, []);
  if (existingFavorites.length) {
    favorites = new Set(existingFavorites);
  }

  extendTranslations();
  injectShellUi();
  injectHomeView();
  assignSellFormIds();
  injectSellHelpers();
  ensureLanguageSelector();
  rebindMarketplaceSearch();
  normalizeMarketState();
  hydrateLocalListings();
  ensureOpsShell();
  syncCurrentUserSeller();
  overrideMarketplaceFunctions();
  overrideOperationalFlows();
  bindStaticEnhancements();
  initializeSimplifiedShell();
  syncSessionUi();
  updateCartBadge();
  updateFavBadge();
  renderProfilePanel();
  renderOpsView();
  renderNotifications();
  renderHomeView();
  renderSellPhotoPreview();
  if (typeof applyLang === "function") {
    applyLang();
  } else if (typeof render === "function") {
    render();
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getLocaleConfig() {
    return LOCALE_SETTINGS[curLang] || LOCALE_SETTINGS.en || LOCALE_SETTINGS.it;
  }

  function isRtlLocale() {
    return getLocaleConfig().dir === "rtl";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function convertBaseEurAmount(value) {
    const rate = Number(getLocaleConfig().rate || 1);
    return Number(value || 0) * rate;
  }

  function parseLocalizedNumberInput(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number(String(value).replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function normalizeCategoryValue(value) {
    if (value === "Abbigliamento donna" || value === "Abbigliamento uomo") {
      return "Abbigliamento";
    }
    return value;
  }

  function getFacetLabel(type, value) {
    const scoped = FACET_TRANSLATIONS[type] || {};
    const direct = scoped[value];
    if (direct && direct[curLang]) {
      return direct[curLang];
    }
    if (direct && direct.en && curLang !== "it") {
      return direct.en;
    }
    return value;
  }

  function formatCurrency(value) {
    const locale = getLocaleConfig();
    return new Intl.NumberFormat(locale.locale, {
      style: "currency",
      currency: locale.currency,
      maximumFractionDigits: locale.currency === "JPY" ? 0 : 2
    }).format(convertBaseEurAmount(value));
  }

  function formatLocalCurrencyValue(value) {
    const locale = getLocaleConfig();
    return new Intl.NumberFormat(locale.locale, {
      style: "currency",
      currency: locale.currency,
      maximumFractionDigits: locale.currency === "JPY" ? 0 : 2
    }).format(Number(value || 0));
  }

  function getAvailableBrands() {
    return [...new Set(getVisibleCatalogProducts().map((product) => product.brand))].sort();
  }

  function getAvailableCategories() {
    return [...new Set(getVisibleCatalogProducts().map((product) => normalizeCategoryValue(product.cat)))].sort();
  }

  function getAvailableConditions() {
    return [...new Set(getVisibleCatalogProducts().map((product) => product.cond))];
  }

  function getAvailableFits() {
    return [...new Set(getVisibleCatalogProducts().map((product) => product.fit).filter((fit) => fit && fit !== "—"))];
  }

  function getAvailableColors() {
    return [...new Set(getVisibleCatalogProducts().map((product) => product.color))];
  }

  function getColorSwatch(value) {
    if (colorMap[value]) {
      return colorMap[value];
    }
    const normalized = normalizeSearchText(value);
    let hash = 0;
    for (let index = 0; index < normalized.length; index += 1) {
      hash = normalized.charCodeAt(index) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return "hsl(" + hue + ",55%,55%)";
  }

  function setLanguage(nextLang) {
    const fallback = LOCALE_SETTINGS.en ? "en" : Object.keys(LOCALE_SETTINGS)[0];
    curLang = LOCALE_SETTINGS[nextLang] ? nextLang : fallback;
    localStorage.setItem("iris-lang", curLang);
    document.documentElement.lang = curLang;
    document.documentElement.dir = isRtlLocale() ? "rtl" : "ltr";
    document.body.classList.toggle("irisx-rtl", isRtlLocale());
    if (typeof applyLang === "function") {
      applyLang();
    }
  }

  function ensureLanguageSelector() {
    const current = document.getElementById("langToggle");
    if (!current) {
      return;
    }

    if (current.tagName === "SELECT") {
      current.value = LOCALE_SETTINGS[curLang] ? curLang : "en";
      return;
    }

    const select = document.createElement("select");
    select.id = "langToggle";
    select.className = "lang-toggle irisx-lang-select";
    select.setAttribute("aria-label", "Language");
    Object.keys(LOCALE_SETTINGS).forEach(function (code) {
      const locale = LOCALE_SETTINGS[code];
      const option = document.createElement("option");
      option.value = code;
      option.textContent = locale.label + " · " + locale.currency;
      select.appendChild(option);
    });
    select.value = LOCALE_SETTINGS[curLang] ? curLang : "en";
    select.addEventListener("change", function () {
      setLanguage(this.value);
    });
    current.replaceWith(select);
  }

  function getProductSearchIndex(product) {
    const translatedValues = [
      getFacetLabel("cats", normalizeCategoryValue(product.cat)),
      getFacetLabel("conds", product.cond),
      getFacetLabel("fits", product.fit),
      getFacetLabel("colors", product.color)
    ];

    return normalizeSearchText(
      [
        product.brand,
        product.name,
        product.cat,
        normalizeCategoryValue(product.cat),
        product.sz,
        product.color,
        product.material,
        product.desc,
        product.seller && product.seller.name,
        product.seller && product.seller.city,
        translatedValues.join(" "),
        (product.chips || []).join(" ")
      ].join(" ")
    );
  }

  function applyAutocompleteSelection(type, value) {
    const dropdown = document.getElementById("acDropdown");
    if (dropdown) {
      dropdown.classList.remove("open");
    }

    if (type === "product") {
      showDetail(Number(value));
      return;
    }

    showBuyView("shop");
    if (type === "brand") {
      filters.brands = [value];
    }
    if (type === "category") {
      filters.cats = [value];
    }
    if (type === "seller") {
      filters.search = value;
      const input = document.getElementById("searchInput");
      if (input) {
        input.value = value;
      }
    }
    initFilters();
    render();
  }

  function renderAutocompleteSuggestions(query) {
    const dropdown = document.getElementById("acDropdown");
    if (!dropdown) {
      return;
    }

    const normalized = normalizeSearchText(query);
    if (normalized.length < 2) {
      dropdown.classList.remove("open");
      dropdown.innerHTML = "";
      return;
    }

    const products = getVisibleCatalogProducts().filter(function (product) {
      return getProductSearchIndex(product).includes(normalized);
    }).slice(0, 4);
    const brands = getAvailableBrands().filter(function (brand) {
      return normalizeSearchText(brand).includes(normalized);
    }).slice(0, 4);
    const categories = getAvailableCategories().filter(function (category) {
      return normalizeSearchText(category + " " + getFacetLabel("cats", category)).includes(normalized);
    }).slice(0, 3);
    const sellers = [...new Set(getVisibleCatalogProducts().map(function (product) { return product.seller; }))]
      .filter(Boolean)
      .filter(function (seller) {
        return normalizeSearchText(seller.name + " " + seller.city).includes(normalized);
      })
      .slice(0, 3);

    let html = "";
    if (products.length) {
      html += "<div class=\"ac-group-title\">" + escapeHtml(t("sg_products")) + "</div>";
      html += products
        .map(function (product) {
          return "<div class=\"ac-item\" onclick=\"applyAutocompleteSelection('product','" + product.id + "')\"><span class=\"ac-item-icon\">" + escapeHtml(product.emoji) + "</span>" + escapeHtml(product.brand + " — " + product.name) + "<span style=\"margin-left:auto;font-size:.7rem;opacity:.4\">" + escapeHtml(formatCurrency(product.price)) + "</span></div>";
        })
        .join("");
    }
    if (brands.length) {
      html += "<div class=\"ac-group-title\">" + escapeHtml(t("sg_brands")) + "</div>";
      html += brands
        .map(function (brand) {
          return "<div class=\"ac-item\" onclick=\"applyAutocompleteSelection('brand','" + escapeHtml(brand) + "')\"><span class=\"ac-item-icon\">🏷️</span>" + escapeHtml(brand) + "</div>";
        })
        .join("");
    }
    if (categories.length) {
      html += "<div class=\"ac-group-title\">" + escapeHtml(t("category")) + "</div>";
      html += categories
        .map(function (category) {
          return "<div class=\"ac-item\" onclick=\"applyAutocompleteSelection('category','" + escapeHtml(category) + "')\"><span class=\"ac-item-icon\">◻</span>" + escapeHtml(getFacetLabel("cats", category)) + "</div>";
        })
        .join("");
    }
    if (sellers.length) {
      html += "<div class=\"ac-group-title\">" + escapeHtml(t("sg_sellers")) + "</div>";
      html += sellers
        .map(function (seller) {
          return "<div class=\"ac-item\" onclick=\"applyAutocompleteSelection('seller','" + escapeHtml(seller.name) + "')\"><span class=\"ac-item-icon\">" + escapeHtml(seller.avatar || "👤") + "</span>" + escapeHtml(seller.name) + "<span style=\"margin-left:auto;font-size:.65rem;opacity:.3\">" + escapeHtml(seller.city) + "</span></div>";
        })
        .join("");
    }

    dropdown.innerHTML = html;
    dropdown.classList.toggle("open", Boolean(html));
  }

  function rebindMarketplaceSearch() {
    const original = document.getElementById("searchInput");
    if (!original) {
      return;
    }

    const input = original.cloneNode(true);
    input.removeAttribute("oninput");
    input.value = filters.search || "";
    input.addEventListener("input", function () {
      handleSearch(this.value);
      renderAutocompleteSuggestions(this.value);
    });
    input.addEventListener("focus", function () {
      renderAutocompleteSuggestions(this.value);
    });
    input.addEventListener("blur", function () {
      setTimeout(function () {
        const dropdown = document.getElementById("acDropdown");
        if (dropdown) {
          dropdown.classList.remove("open");
        }
      }, 180);
    });
    original.replaceWith(input);
    window.applyAutocompleteSelection = applyAutocompleteSelection;
  }

  function getMyListings() {
    if (!state.currentUser) {
      return [];
    }
    return state.listings
      .filter((listing) => listing.ownerEmail === state.currentUser.email)
      .sort((a, b) => b.date - a.date);
  }

  function getMyOrders() {
    if (!state.currentUser) {
      return [];
    }
    return state.orders
      .filter((order) => order.buyerEmail === state.currentUser.email)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function getCurrentUserSeller() {
    if (!state.currentUser) {
      return null;
    }

    const ownListings = getMyListings();
    return {
      id: "seller-" + slugify(state.currentUser.email),
      name: state.currentUser.name,
      avatar: state.currentUser.avatar || "👤",
      email: normalizeEmail(state.currentUser.email),
      rating: 5,
      sales: ownListings.length,
      city: state.currentUser.city || (curLang === "it" ? "Italia" : "Italy"),
      since: state.currentUser.memberSince || "2026"
    };
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function langText(it, en) {
    return curLang === "it" ? it : en;
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function createId(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 10);
  }

  function formatDateTime(value) {
    if (!value) {
      return t("not_available");
    }

    return new Date(value).toLocaleString(getLocaleConfig().locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatRelativeTime(value) {
    const diffMinutes = Math.max(0, Math.round((Date.now() - Number(value || 0)) / 60000));
    const formatter = new Intl.RelativeTimeFormat(getLocaleConfig().locale, { numeric: "auto" });

    if (diffMinutes < 1) {
      return formatter.format(0, "minute");
    }
    if (diffMinutes < 60) {
      return formatter.format(-diffMinutes, "minute");
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
      return formatter.format(-diffHours, "hour");
    }

    const diffDays = Math.round(diffHours / 24);
    return formatter.format(-diffDays, "day");
  }

  function deriveUserRole(email) {
    return PLATFORM_CONFIG.adminEmails.includes(normalizeEmail(email)) ? "admin" : "member";
  }

  function isAdminUser(user) {
    return Boolean(user && deriveUserRole(user.email) === "admin");
  }

  function isCurrentUserAdmin() {
    return isAdminUser(state.currentUser);
  }

  function ensureSellerEmail(seller) {
    if (!seller) {
      return "";
    }

    if (!seller.email) {
      seller.email = slugify(seller.name || seller.id || "seller") + "@iris-seller.local";
    }

    return seller.email;
  }

  function getPlatformFee(subtotal) {
    return Math.round(Number(subtotal || 0) * PLATFORM_CONFIG.platformFeeRate);
  }

  function inferOrderTimeline(createdAt, status) {
    const timeline = [
      {
        id: createId("evt"),
        type: "order_created",
        at: createdAt,
        label: langText("Ordine creato", "Order created")
      },
      {
        id: createId("evt"),
        type: "payment_captured",
        at: createdAt,
        label: langText("Pagamento confermato", "Payment confirmed")
      }
    ];

    if (status === "shipped" || status === "delivered") {
      timeline.push({
        id: createId("evt"),
        type: "order_shipped",
        at: createdAt,
        label: langText("Ordine spedito", "Order shipped")
      });
    }

    if (status === "delivered") {
      timeline.push({
        id: createId("evt"),
        type: "order_delivered",
        at: createdAt,
        label: langText("Ordine consegnato", "Order delivered")
      });
    }

    return timeline;
  }

  function normalizeListingRecord(listing) {
    const seller = listing.seller || null;
    if (seller) {
      ensureSellerEmail(seller);
    }

    return Object.assign(
      {
        inventoryStatus: "active",
        listingStatus: "published",
        orderId: null,
        soldAt: null
      },
      listing,
      {
        seller: seller
      }
    );
  }

  function normalizeOrderRecord(order) {
    const createdAt = Number(order.createdAt || Date.now());
    const normalizedStatus = order.status === "created" ? "paid" : (order.status || "paid");
    const items = Array.isArray(order.items)
      ? order.items.map(function (item) {
          const product =
            prods.find(function (candidate) { return candidate.id === item.productId; }) ||
            state.listings.find(function (candidate) { return candidate.id === item.productId; });
          const seller = product && product.seller
            ? product.seller
            : {
                id: item.sellerId || "seller-unknown",
                name: item.sellerName || langText("Venditore sconosciuto", "Unknown seller"),
                email: item.sellerEmail || ""
              };

          ensureSellerEmail(seller);

          return Object.assign(
            {
              qty: 1,
              lineStatus: normalizedStatus
            },
            item,
            {
              name: item.name || (product ? product.name : langText("Articolo", "Item")),
              brand: item.brand || (product ? product.brand : "IRIS"),
              price: Number(item.price || (product ? product.price : 0)),
              sellerId: item.sellerId || seller.id,
              sellerName: item.sellerName || seller.name,
              sellerEmail: normalizeEmail(item.sellerEmail || seller.email)
            }
          );
        })
      : [];
    const subtotal = typeof order.subtotal === "number"
      ? order.subtotal
      : items.reduce(function (sum, item) { return sum + Number(item.price || 0) * Number(item.qty || 1); }, 0);
    const shippingCost = typeof order.shippingCost === "number" ? order.shippingCost : SHIPPING_COST;
    const total = typeof order.total === "number" ? order.total : subtotal + shippingCost;

    return Object.assign({}, order, {
      id: order.id || createId("ord"),
      number: order.number || ("IRIS-" + String(createdAt).slice(-8)),
      buyerEmail: normalizeEmail(order.buyerEmail),
      buyerName: order.buyerName || (order.shipping && order.shipping.name) || langText("Cliente IRIS", "IRIS customer"),
      items: items,
      sellerEmails: Array.from(new Set(items.map(function (item) { return normalizeEmail(item.sellerEmail); }).filter(Boolean))),
      shipping: Object.assign(
        {
          name: "",
          address: "",
          city: "",
          country: langText("Italia", "Italy"),
          note: "",
          carrier: "",
          trackingNumber: "",
          method: langText("Spedizione assicurata", "Insured shipping"),
          labelStatus: "pending",
          shippedAt: null,
          deliveredAt: null
        },
        order.shipping || {}
      ),
      status: normalizedStatus,
      payment: Object.assign(
        {
          provider: "prototype_manual",
          status: "captured",
          capturedAt: createdAt,
          receiptNumber: "RCPT-" + String(createdAt).slice(-8),
          platformFee: getPlatformFee(subtotal),
          sellerNet: Math.max(0, subtotal - getPlatformFee(subtotal)),
          refundStatus: "none",
          payoutStatus: normalizedStatus === "delivered" ? "ready" : "pending_shipment"
        },
        order.payment || {}
      ),
      timeline: Array.isArray(order.timeline) && order.timeline.length ? order.timeline : inferOrderTimeline(createdAt, normalizedStatus),
      supportTicketIds: Array.isArray(order.supportTicketIds) ? order.supportTicketIds : [],
      emailIds: Array.isArray(order.emailIds) ? order.emailIds : [],
      notificationIds: Array.isArray(order.notificationIds) ? order.notificationIds : [],
      reviewStatus: order.reviewStatus || "pending",
      createdAt: createdAt,
      subtotal: subtotal,
      shippingCost: shippingCost,
      total: total
    });
  }

  function mergeStoredChatThreads(storedChats) {
    if (!Array.isArray(storedChats) || typeof chats === "undefined") {
      return;
    }

    chats.splice(0, chats.length);
    storedChats.forEach(function (thread) {
      chats.push(thread);
    });
  }

  function hydrateStoredReviews() {
    state.reviews.forEach(function (review) {
      if (!reviewsData[review.sellerId]) {
        reviewsData[review.sellerId] = [];
      }

      if (!reviewsData[review.sellerId].some(function (entry) { return entry.id === review.id; })) {
        reviewsData[review.sellerId].push(review);
      }
    });
  }

  function syncInventoryFromOrders() {
    state.orders.forEach(function (order) {
      order.items.forEach(function (item) {
        const product = prods.find(function (candidate) { return candidate.id === item.productId; });
        if (product) {
          product.inventoryStatus = "sold";
          product.listingStatus = "sold";
          product.orderId = order.id;
          product.soldAt = order.createdAt;
        }

        state.listings = state.listings.map(function (listing) {
          if (listing.id !== item.productId) {
            return listing;
          }

          return Object.assign({}, listing, {
            inventoryStatus: "sold",
            listingStatus: "sold",
            orderId: order.id,
            soldAt: order.createdAt
          });
        });
      });
    });
    saveJson(STORAGE_KEYS.listings, state.listings);
  }

  function normalizeMarketState() {
    sellers.forEach(function (seller) {
      ensureSellerEmail(seller);
    });

    state.users = state.users.map(function (user) {
      return Object.assign({}, user, {
        email: normalizeEmail(user.email),
        role: user.role || deriveUserRole(user.email)
      });
    });
    saveJson(STORAGE_KEYS.users, state.users);

    state.listings = state.listings.map(normalizeListingRecord);
    state.orders = state.orders.map(normalizeOrderRecord);
    state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
    state.emailOutbox = Array.isArray(state.emailOutbox) ? state.emailOutbox : [];
    state.supportTickets = Array.isArray(state.supportTickets) ? state.supportTickets : [];
    state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];
    state.reviews = Array.isArray(state.reviews) ? state.reviews : [];

    if (state.currentUser) {
      state.currentUser = Object.assign({}, state.currentUser, {
        email: normalizeEmail(state.currentUser.email),
        role: state.currentUser.role || deriveUserRole(state.currentUser.email)
      });
      saveJson(STORAGE_KEYS.session, state.currentUser);
    }

    const storedChats = loadJson(STORAGE_KEYS.chats, null);
    if (storedChats) {
      mergeStoredChatThreads(storedChats);
    }

    hydrateStoredReviews();
    syncInventoryFromOrders();

    saveJson(STORAGE_KEYS.listings, state.listings);
    saveJson(STORAGE_KEYS.orders, state.orders);
    saveJson(STORAGE_KEYS.notifications, state.notifications);
    saveJson(STORAGE_KEYS.emailOutbox, state.emailOutbox);
    saveJson(STORAGE_KEYS.supportTickets, state.supportTickets);
    saveJson(STORAGE_KEYS.auditLog, state.auditLog);
    saveJson(STORAGE_KEYS.reviews, state.reviews);
  }

  function extendTranslations() {
    Object.assign(i18n.it, {
      login: "Accedi",
      home: "Home",
      register: "Registrati",
      logout: "Esci",
      cart: "Carrello",
      checkout: "Vai al checkout",
      add_to_cart: "Aggiungi al carrello",
      cart_added: "Articolo aggiunto al carrello.",
      empty_cart: "Il carrello e' vuoto. Esplora lo shop e aggiungi i pezzi che vuoi acquistare.",
      cart_total: "Totale",
      continue_shopping: "Continua a esplorare",
      checkout_title: "Checkout",
      checkout_sub: "Inserisci i dati di spedizione e conferma l'ordine.",
      order_summary: "Riepilogo ordine",
      shipping_name: "Nome e cognome",
      shipping_address: "Indirizzo",
      shipping_city: "Citta'",
      shipping_country: "Paese",
      shipping_note: "Note per il corriere",
      confirm_order: "Conferma ordine",
      auth_title_login: "Bentornata su IRIS",
      auth_title_register: "Crea il tuo account",
      auth_sub_login: "Accedi per chattare, comprare e pubblicare i tuoi articoli.",
      auth_sub_register: "Registrazione locale di prototipo. Per il live servira' auth server-side.",
      auth_cta_login: "Entra nel tuo account",
      auth_cta_register: "Crea account",
      full_name: "Nome completo",
      email: "Email",
      password: "Password",
      auth_switch_login: "Hai gia' un account?",
      auth_switch_register: "Non hai ancora un account?",
      cart_items: "articoli",
      manual_payment_note: "Questo checkout funziona lato interfaccia e salva l'ordine nel browser. Per pagamenti reali serve collegare Stripe o un backend.",
      publish_success: "Annuncio pubblicato con successo.",
      publish_error: "Completa tutti i campi obbligatori e aggiungi almeno una foto.",
      photos_ready: "Foto pronte. Verranno salvate in versione ottimizzata nel browser.",
      my_listings: "I tuoi annunci",
      my_orders: "I tuoi ordini",
      profile_guest_title: "Accedi per attivare il tuo profilo",
      profile_guest_body: "Login, registrazione, publish flow e checkout adesso sono attivi lato browser.",
      sign_in_to_continue: "Accedi per continuare",
      checkout_success: "Ordine registrato con successo.",
      login_success: "Accesso effettuato.",
      logout_success: "Sessione chiusa.",
      register_success: "Account creato con successo.",
      remove: "Rimuovi",
      qty: "Quantita'",
      cart_open: "Apri carrello",
      account_area: "Account",
      profile_nav: "Profilo",
      profile_details: "Dati profilo",
      save_profile: "Salva profilo",
      profile_saved: "Profilo aggiornato.",
      profile_city: "Citta'",
      profile_country: "Paese",
      profile_bio: "Bio",
      favorites_section: "Preferiti",
      no_orders_yet: "Nessun ordine ancora.",
      no_favorites_yet: "Non hai ancora preferiti salvati.",
      account_summary: "Panoramica account",
      sell_status_idle: "Pubblica un annuncio con foto reali, dettagli e prezzo.",
      sell_status_ready: "Le foto sono state caricate e il form e' pronto.",
      sell_status_auth: "Per pubblicare davvero serve autenticarti.",
      shipping: "Spedizione",
      prototype_mode: "Modalita' prototipo avanzata",
      search_short: "Ricerca",
      size_placeholder: "es. M, 42, 30cm...",
      price_min: "Min",
      price_max: "Max",
      dimensions: "Dimensioni",
      material: "Materiale",
      not_available: "N/A"
    });

    Object.assign(i18n.en, {
      login: "Login",
      home: "Home",
      register: "Register",
      logout: "Logout",
      cart: "Cart",
      checkout: "Go to checkout",
      add_to_cart: "Add to cart",
      cart_added: "Item added to cart.",
      empty_cart: "Your cart is empty. Explore the shop and add the pieces you want.",
      cart_total: "Total",
      continue_shopping: "Keep browsing",
      checkout_title: "Checkout",
      checkout_sub: "Add shipping details and confirm the order.",
      order_summary: "Order summary",
      shipping_name: "Full name",
      shipping_address: "Address",
      shipping_city: "City",
      shipping_country: "Country",
      shipping_note: "Delivery note",
      confirm_order: "Confirm order",
      auth_title_login: "Welcome back to IRIS",
      auth_title_register: "Create your account",
      auth_sub_login: "Sign in to chat, buy and publish your listings.",
      auth_sub_register: "This is a local prototype account. Production auth still needs a backend.",
      auth_cta_login: "Sign in",
      auth_cta_register: "Create account",
      full_name: "Full name",
      email: "Email",
      password: "Password",
      auth_switch_login: "Already have an account?",
      auth_switch_register: "Need an account?",
      cart_items: "items",
      manual_payment_note: "This checkout works in the UI and stores the order locally. Real payments still need Stripe or a backend.",
      publish_success: "Listing published successfully.",
      publish_error: "Complete the required fields and add at least one photo.",
      photos_ready: "Photos are ready and will be stored in an optimized browser format.",
      my_listings: "Your listings",
      my_orders: "Your orders",
      profile_guest_title: "Sign in to unlock your profile",
      profile_guest_body: "Login, registration, publish flow and checkout now work inside the browser prototype.",
      sign_in_to_continue: "Sign in to continue",
      checkout_success: "Order stored successfully.",
      login_success: "Signed in successfully.",
      logout_success: "Signed out successfully.",
      register_success: "Account created successfully.",
      remove: "Remove",
      qty: "Qty",
      cart_open: "Open cart",
      account_area: "Account",
      profile_nav: "Profile",
      profile_details: "Profile details",
      save_profile: "Save profile",
      profile_saved: "Profile updated.",
      profile_city: "City",
      profile_country: "Country",
      profile_bio: "Bio",
      favorites_section: "Favorites",
      no_orders_yet: "No orders yet.",
      no_favorites_yet: "You have no saved favorites yet.",
      account_summary: "Account overview",
      sell_status_idle: "Publish a listing with real photos, details and price.",
      sell_status_ready: "Photos uploaded and form ready to publish.",
      sell_status_auth: "You need to sign in before publishing.",
      shipping: "Shipping",
      prototype_mode: "Advanced prototype mode",
      search_short: "Search",
      size_placeholder: "e.g. M, 42, 30cm...",
      price_min: "Min",
      price_max: "Max",
      dimensions: "Dimensions",
      material: "Material",
      not_available: "N/A"
    });

    Object.keys(I18N_PACKS).forEach(function (code) {
      i18n[code] = Object.assign({}, i18n.en, I18N_PACKS[code]);
    });

    t = function (key) {
      return (i18n[curLang] && i18n[curLang][key]) || i18n.en[key] || i18n.it[key] || key;
    };
  }

  function getHomeCopy() {
    return HOME_COPY[curLang] || HOME_COPY.en || HOME_COPY.it || {
      sectionKicker: "IRIS edit",
      kicker: "IRIS — Curated Luxury",
      title: "Authentic luxury.\nFinally accessible.",
      text: "Every piece certified by our team of experts. Hermès, Chanel, Louis Vuitton — authenticated one by one, delivered to your door.",
      primaryCta: "Browse the collection",
      secondaryCta: "Sell with IRIS",
      featuredTitle: "Collector's Pieces",
      featuredNote: "A curated selection of the most sought-after pieces.",
      buyTitle: "Shop with confidence",
      buyText: "A rigorous selection of authenticated pieces from the finest Maisons.",
      buyPoints: ["100% Authenticated", "Insured shipping", "14-day returns"],
      sellTitle: "Sell with elegance",
      sellText: "Upload your photos, set your price. We handle the rest.",
      sellPoints: ["Authentication included", "Maximum visibility", "Guaranteed payment"],
      sideCards: [],
      strip: []
    };
  }

  function injectHomeView() {
    const pageBuy = qs("#page-buy");
    const topnav = qs("#topnav");
    if (!pageBuy || !topnav || qs("#home-view")) {
      return;
    }

    topnav.insertAdjacentHTML("afterend", "<div id=\"home-view\" class=\"irisx-home active\"></div>");
  }

  function injectShellUi() {
    const navLinks = qs(".tn-links");
    if (navLinks && !qs("#cartBtn")) {
      const cartButton = document.createElement("button");
      cartButton.className = "tn-btn";
      cartButton.id = "cartBtn";
      cartButton.innerHTML = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1 1h2l1.5 8h8L15 3.5H4\"/><circle cx=\"6\" cy=\"12.5\" r=\"1\"/><circle cx=\"11\" cy=\"12.5\" r=\"1\"/></svg><span class=\"badge\" id=\"cart-badge\" style=\"display:none\">0</span>";
      cartButton.setAttribute("aria-label", t("cart_open"));
      cartButton.addEventListener("click", openCart);
      navLinks.insertBefore(cartButton, qs(".notif-wrap"));
    }

    if (navLinks && !qs("#authBtn")) {
      const authButton = document.createElement("button");
      authButton.className = "tn-btn";
      authButton.id = "authBtn";
      authButton.addEventListener("click", handleAuthButtonClick);
      navLinks.insertBefore(authButton, qs("#profile-view") ? qs(".mode-toggle") : null);
    }

    if (!qs("#irisxAuthModal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        "<div class=\"irisx-modal\" id=\"irisxAuthModal\"></div>" +
          "<div class=\"irisx-drawer\" id=\"irisxCartDrawer\"></div>" +
          "<div class=\"irisx-modal\" id=\"irisxCheckoutModal\"></div>" +
          "<div class=\"irisx-toast-stack\" id=\"irisxToastStack\"></div>"
      );
    }

    renderAuthModal();
    renderCartDrawer();
    renderCheckoutModal();
  }

  function assignSellFormIds() {
    const labelMap = {
      "Categoria *": "sf-cat",
      "Brand / Designer *": "sf-brand",
      "Nome articolo *": "sf-name",
      Taglia: "sf-size",
      Colore: "sf-color",
      "Vestibilità": "sf-fit",
      "Vestibilita'": "sf-fit",
      Vestibilita: "sf-fit",
      Materiale: "sf-material",
      Dimensioni: "sf-dims",
      "Descrizione *": "sf-desc",
      "Il tuo prezzo (€) *": "sf-price"
    };

    qsa(".form-fields .fg").forEach((group) => {
      const label = group.querySelector(".fl");
      const field = group.querySelector("input, select, textarea");
      if (!label || !field) {
        return;
      }

      const normalizedLabel = label.textContent.trim();
      const id = labelMap[normalizedLabel];
      if (id) {
        field.id = id;
      }
    });

    const submitButton = qs(".sell-submit");
    if (submitButton) {
      submitButton.id = "sf-submit";
    }
  }

  function injectSellHelpers() {
    const fileInput = qs("#fileIn");
    if (fileInput && !qs("#sellPreviewGrid")) {
      fileInput.insertAdjacentHTML(
        "afterend",
        "<div class=\"irisx-photo-grid\" id=\"sellPreviewGrid\"></div><div class=\"irisx-status\" id=\"sellStatus\"></div>"
      );
    }

    const profileContainer = qs("#profile-view .container");
    if (profileContainer && !qs("#profileListingsPanel")) {
      profileContainer.insertAdjacentHTML("beforeend", "<div class=\"irisx-profile-panel\" id=\"profileListingsPanel\"></div>");
    }

    const legacyEmptyState = qs("#profile-view .container > div[style*='padding:3rem']");
    if (legacyEmptyState) {
      legacyEmptyState.style.display = "none";
    }
  }

  function renderHomeView() {
    const container = qs("#home-view");
    if (!container) {
      return;
    }

    const copy = getHomeCopy();
    const featured = getVisibleCatalogProducts().slice(0, 4);

    container.innerHTML =
      "<div class=\"irisx-home-shell\"><section class=\"irisx-home-hero\">" +
      "<video class=\"irisx-hero-video\" id=\"heroVid\" autoplay muted loop playsinline preload=\"auto\">" +
      "<source src=\"https://videos.pexels.com/video-files/6649983/6649983-hd_2048_1080_25fps.mp4\" type=\"video/mp4\">" +
      "<source src=\"https://videos.pexels.com/video-files/7677253/7677253-hd_1920_1080_25fps.mp4\" type=\"video/mp4\">" +
      "</video>" +
      "<div class=\"irisx-hero-lux\"><div class=\"irisx-hero-shine\"></div></div>" +
      "<div class=\"irisx-hero-grain\"></div>" +
      "<div class=\"irisx-ambient\">" +
      "<span class=\"irisx-particle\" style=\"left:5%;top:30%;font-size:1.6rem;animation-duration:16s\">◆</span>" +
      "<span class=\"irisx-particle\" style=\"left:90%;top:20%;font-size:.9rem;animation-duration:22s;animation-delay:-8s\">◇</span>" +
      "<span class=\"irisx-particle\" style=\"left:60%;top:75%;font-size:2rem;animation-duration:14s;animation-delay:-5s\">✦</span>" +
      "<span class=\"irisx-particle\" style=\"left:25%;top:80%;font-size:1.1rem;animation-duration:19s;animation-delay:-11s\">◆</span>" +
      "</div>" +
      "<div class=\"irisx-home-copy\"><div class=\"irisx-home-kicker\">" +
      escapeHtml(copy.kicker) +
      "</div><h1 class=\"irisx-home-title\">" +
      escapeHtml(copy.title) +
      "</h1><p class=\"irisx-home-text\">" +
      escapeHtml(copy.text) +
      "</p><div class=\"irisx-home-actions\"><button class=\"irisx-home-action primary\" onclick=\"showBuyView('shop')\">" +
      escapeHtml(copy.primaryCta) +
      "</button><button class=\"irisx-home-action secondary\" onclick=\"showPage('sell')\">" +
      escapeHtml(copy.secondaryCta) +
      "</button></div><div class=\"irisx-home-strip\">" +
      copy.strip
        .map(function (item) {
          return "<div><strong>" + escapeHtml(item.value) + "</strong><span>" + escapeHtml(item.label) + "</span></div>";
        })
        .join("") +
      "</div></div><aside class=\"irisx-home-side\"><div class=\"irisx-home-side-grid\">" +
      copy.sideCards
        .map(function (card) {
          return "<div class=\"irisx-home-card\"><strong>" + escapeHtml(card.title) + "</strong><span>" + escapeHtml(card.text) + "</span><em>" + escapeHtml(card.tag) + "</em></div>";
        })
        .join("") +
      "</div></aside></section><section class=\"irisx-home-story\"><div class=\"irisx-home-section-head\"><div><div class=\"irisx-home-section-kicker\">" +
      escapeHtml(copy.sectionKicker || "IRIS edit") +
      "</div><div class=\"irisx-home-section-title\">" +
      escapeHtml(copy.featuredTitle) +
      "</div></div><div class=\"irisx-home-section-note\">" +
      escapeHtml(copy.featuredNote) +
      "</div></div><div class=\"irisx-home-grid\">" +
      featured.map(function (product) { return productCardMarkup(product); }).join("") +
      "</div><div class=\"irisx-home-columns\"><article class=\"irisx-home-column\"><h3>" +
      escapeHtml(copy.buyTitle) +
      "</h3><p>" +
      escapeHtml(copy.buyText) +
      "</p><ul>" +
      copy.buyPoints.map(function (point) { return "<li>" + escapeHtml(point) + "</li>"; }).join("") +
      "</ul></article><article class=\"irisx-home-column\"><h3>" +
      escapeHtml(copy.sellTitle) +
      "</h3><p>" +
      escapeHtml(copy.sellText) +
      "</p><ul>" +
      copy.sellPoints.map(function (point) { return "<li>" + escapeHtml(point) + "</li>"; }).join("") +
      "</ul></article></div></section></div>";

    // Fade in hero video when ready
    var hv = document.getElementById("heroVid");
    if (hv) {
      hv.load();
      hv.addEventListener("canplay", function() { hv.classList.add("on"); }, { once: true });
      setTimeout(function() { if (hv && !hv.classList.contains("on")) hv.classList.add("on"); }, 2000);
    }
  }

  function setActiveNav(view) {
    qsa("[data-nav-view]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-nav-view") === view);
    });
  }

  function getCurrentReturnView() {
    if (qs("#page-sell.active")) {
      return "sell";
    }

    const activeView = ["home", "shop", "fav", "chat", "profile", "seller", "ops"].find(function (view) {
      const node = qs("#" + view + "-view");
      return node && node.classList.contains("active");
    });

    if (activeView) {
      return activeView;
    }

    if (qs("#detail-view.active")) {
      return state.lastNonDetailView || "home";
    }

    return "home";
  }

  function initializeSimplifiedShell() {
    document.body.classList.add("irisx-simple-state");

    const intro = qs("#intro");
    const choice = qs("#choice");

    // Keep intro visible — it's the cinematic entry point
    if (intro && intro.style.display === "none") {
      intro.style.display = "";
    }
    // Hide old choice screen — we go straight to buy after intro
    if (choice) {
      choice.style.display = "none";
      choice.classList.remove("show");
    }

    // If intro exists and is visible, keep body locked until user clicks
    if (intro && intro.style.display !== "none") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    skipIntro = function () {
      if (typeof introDone !== "undefined" && introDone) return;
      if (typeof introDone !== "undefined") introDone = true;
      const iEl = document.getElementById("itext");
      const introDiv = document.getElementById("intro");
      if (iEl) iEl.classList.add("out");
      if (introDiv) introDiv.classList.add("out");
      setTimeout(function () {
        if (introDiv) introDiv.style.display = "none";
        document.body.style.overflow = "";
        showPage("buy");
      }, 1100);
    };

    showChoiceScreen = function () {
      showPage("buy");
    };

    backToChoice = function () {
      showPage("buy");
      showBuyView("home");
    };

    showPage = function (type) {
      const buyPage = qs("#page-buy");
      const sellPage = qs("#page-sell");
      const topnav = qs("#topnav");
      const sellTopbar = qs("#sellTopbar");

      document.body.style.overflow = "";

      if (type === "sell") {
        buyPage.classList.remove("active");
        sellPage.classList.add("active");
        topnav.classList.remove("show");
        sellTopbar.classList.add("show");
        window.scrollTo(0, 0);
        return;
      }

      sellPage.classList.remove("active");
      buyPage.classList.add("active");
      topnav.classList.add("show");
      sellTopbar.classList.remove("show");
      showBuyView("home");
    };

    // Only auto-show buy page if intro is already hidden
    const introEl = qs("#intro");
    if (!introEl || introEl.style.display === "none") {
      showPage("buy");
    }
  }

  function bindStaticEnhancements() {
    const fileInput = qs("#fileIn");
    if (fileInput) {
      fileInput.addEventListener("change", handleSellPhotosSelected);
    }

    const submitButton = qs("#sf-submit");
    if (submitButton) {
      submitButton.addEventListener("click", function () {
        requireAuth(publishListing);
      });
    }

    qsa("#irisxAuthModal, #irisxCheckoutModal, #irisxCartDrawer, #irisxOpsModal").forEach((node) => {
      node.addEventListener("click", function (event) {
        if (event.target.classList.contains("irisx-modal-backdrop") || event.target.classList.contains("irisx-drawer-backdrop")) {
          closeAuthModal();
          closeCheckout();
          closeCart();
          closeOpsModal();
        }
      });
    });
  }

  function hydrateLocalListings() {
    state.listings.forEach((listing) => {
      if (!prods.some((product) => product.id === listing.id)) {
        prods.unshift(listing);
      }
      if (listing.seller && !sellers.some((seller) => seller.id === listing.seller.id)) {
        sellers.push(listing.seller);
      }
    });
  }

  function syncCurrentUserSeller() {
    const seller = getCurrentUserSeller();
    if (!seller) {
      return;
    }

    const existingIndex = sellers.findIndex((item) => item.id === seller.id);
    if (existingIndex === -1) {
      sellers.push(seller);
      return;
    }

    sellers[existingIndex] = seller;
  }

  function persistChats() {
    saveJson(STORAGE_KEYS.chats, typeof chats === "undefined" ? [] : chats);
  }

  function persistOrders() {
    saveJson(STORAGE_KEYS.orders, state.orders);
  }

  function persistNotifications() {
    saveJson(STORAGE_KEYS.notifications, state.notifications);
  }

  function persistEmailOutbox() {
    saveJson(STORAGE_KEYS.emailOutbox, state.emailOutbox);
  }

  function persistSupportTickets() {
    saveJson(STORAGE_KEYS.supportTickets, state.supportTickets);
  }

  function persistAuditLog() {
    saveJson(STORAGE_KEYS.auditLog, state.auditLog);
  }

  function persistReviews() {
    saveJson(STORAGE_KEYS.reviews, state.reviews);
  }

  function isProductPurchasable(product) {
    return Boolean(product && (product.inventoryStatus || "active") === "active");
  }

  function getVisibleCatalogProducts() {
    return prods.filter(isProductPurchasable);
  }

  function getProductStatusLabel(product) {
    if (isProductPurchasable(product)) {
      return "";
    }

    return langText("Venduto", "Sold");
  }

  function getOrderStatusLabel(order) {
    if (order.status === "paid") {
      return langText("Pagato - in attesa di spedizione", "Paid - awaiting shipment");
    }
    if (order.status === "shipped") {
      return langText("Spedito", "Shipped");
    }
    if (order.status === "delivered") {
      return langText("Consegnato", "Delivered");
    }
    return order.status;
  }

  function appendOrderEvent(order, type, label, meta) {
    order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
    order.timeline.unshift({
      id: createId("evt"),
      type: type,
      at: Date.now(),
      label: label,
      meta: meta || null
    });
  }

  function recordAuditEvent(type, summary, meta) {
    state.auditLog.unshift({
      id: createId("log"),
      type: type,
      summary: summary,
      meta: meta || null,
      at: Date.now()
    });
    persistAuditLog();
  }

  function createNotification(payload) {
    const notification = {
      id: createId("ntf"),
      kind: payload.kind || "system",
      title: payload.title || "IRIS",
      body: payload.body || "",
      recipientEmail: normalizeEmail(payload.recipientEmail),
      audience: payload.audience || "user",
      unread: true,
      link: payload.link || "",
      createdAt: Date.now()
    };

    state.notifications.unshift(notification);
    persistNotifications();
    return notification;
  }

  function getVisibleNotifications() {
    if (isCurrentUserAdmin()) {
      return state.notifications.filter(function (notification) {
        return notification.audience === "admin" || notification.recipientEmail === normalizeEmail(state.currentUser.email);
      });
    }

    if (!state.currentUser) {
      return [];
    }

    return state.notifications.filter(function (notification) {
      return notification.recipientEmail === normalizeEmail(state.currentUser.email);
    });
  }

  function buildEmailMessage(type, payload) {
    if (type === "welcome-user") {
      return {
        subject: langText("Benvenuta su IRIS", "Welcome to IRIS"),
        body: langText(
          "Ciao " + payload.name + ", il tuo account IRIS e' stato creato. Completa la verifica email prima del go-live del backend.",
          "Hi " + payload.name + ", your IRIS account is ready. Complete email verification before backend go-live."
        )
      };
    }

    if (type === "verify-account") {
      return {
        subject: langText("Verifica il tuo account IRIS", "Verify your IRIS account"),
        body: langText(
          "Attiva il tuo account confermando l'indirizzo email " + payload.email + ".",
          "Activate your account by confirming the email address " + payload.email + "."
        )
      };
    }

    if (type === "order-buyer") {
      return {
        subject: langText("Ordine ricevuto " + payload.orderNumber, "Order received " + payload.orderNumber),
        body: langText(
          "Abbiamo registrato l'ordine " + payload.orderNumber + " per " + payload.total + ". Ti aggiorneremo quando il seller spedisce.",
          "We recorded order " + payload.orderNumber + " for " + payload.total + ". We will update you once the seller ships."
        )
      };
    }

    if (type === "order-admin") {
      return {
        subject: langText("Nuovo ordine marketplace", "New marketplace order"),
        body: langText(
          "Nuovo ordine " + payload.orderNumber + " creato da " + payload.buyerEmail + ".",
          "New order " + payload.orderNumber + " created by " + payload.buyerEmail + "."
        )
      };
    }

    if (type === "payment-confirmed") {
      return {
        subject: langText("Pagamento confermato " + payload.orderNumber, "Payment confirmed " + payload.orderNumber),
        body: langText(
          "Pagamento registrato con ricevuta " + payload.receiptNumber + ".",
          "Payment recorded with receipt " + payload.receiptNumber + "."
        )
      };
    }

    if (type === "order-receipt") {
      return {
        subject: langText("Ricevuta ordine " + payload.orderNumber, "Order receipt " + payload.orderNumber),
        body: langText(
          "Riepilogo ordine: " + payload.itemsSummary + ". Totale " + payload.total + ".",
          "Order summary: " + payload.itemsSummary + ". Total " + payload.total + "."
        )
      };
    }

    if (type === "item-sold-seller") {
      return {
        subject: langText("Articolo venduto su IRIS", "Item sold on IRIS"),
        body: langText(
          "Hai venduto " + payload.itemsSummary + ". Prepara la spedizione per l'ordine " + payload.orderNumber + ".",
          "You sold " + payload.itemsSummary + ". Prepare shipment for order " + payload.orderNumber + "."
        )
      };
    }

    if (type === "new-message") {
      return {
        subject: langText("Nuovo messaggio su IRIS", "New IRIS message"),
        body: payload.preview
      };
    }

    if (type === "new-offer") {
      return {
        subject: langText("Nuova offerta ricevuta", "New offer received"),
        body: payload.preview
      };
    }

    if (type === "item-shipped") {
      return {
        subject: langText("Ordine spedito " + payload.orderNumber, "Order shipped " + payload.orderNumber),
        body: langText(
          "Il tuo ordine e' stato spedito con " + payload.carrier + " - tracking " + payload.trackingNumber + ".",
          "Your order was shipped with " + payload.carrier + " - tracking " + payload.trackingNumber + "."
        )
      };
    }

    if (type === "support-request") {
      return {
        subject: langText("Nuova richiesta supporto", "New support request"),
        body: payload.preview
      };
    }

    if (type === "issue-reported") {
      return {
        subject: langText("Segnalazione problema ordine", "Order issue reported"),
        body: payload.preview
      };
    }

    return {
      subject: "IRIS",
      body: payload.preview || "IRIS event"
    };
  }

  function enqueueEmail(type, to, payload) {
    const email = buildEmailMessage(type, payload || {});
    const queued = {
      id: createId("mail"),
      type: type,
      to: normalizeEmail(to),
      subject: email.subject,
      body: email.body,
      templatePath: "docs/email-trigger-matrix.md#" + type,
      payload: payload || {},
      status: "queued",
      createdAt: Date.now()
    };

    state.emailOutbox.unshift(queued);
    persistEmailOutbox();
    return queued;
  }

  function getBuyerOrders() {
    if (!state.currentUser) {
      return [];
    }

    return state.orders
      .filter(function (order) { return normalizeEmail(order.buyerEmail) === normalizeEmail(state.currentUser.email); })
      .sort(function (left, right) { return right.createdAt - left.createdAt; });
  }

  function getSellerOrdersForCurrentUser() {
    if (!state.currentUser) {
      return [];
    }

    return state.orders
      .filter(function (order) {
        return order.items.some(function (item) { return normalizeEmail(item.sellerEmail) === normalizeEmail(state.currentUser.email); });
      })
      .sort(function (left, right) { return right.createdAt - left.createdAt; });
  }

  function getTicketsForCurrentUser() {
    if (!state.currentUser) {
      return [];
    }

    if (isCurrentUserAdmin()) {
      return state.supportTickets;
    }

    return state.supportTickets.filter(function (ticket) {
      return (
        normalizeEmail(ticket.buyerEmail) === normalizeEmail(state.currentUser.email) ||
        normalizeEmail(ticket.sellerEmail) === normalizeEmail(state.currentUser.email)
      );
    });
  }

  function getRecentAdminUsers() {
    return state.users.slice().sort(function (left, right) {
      return String(right.memberSince || "").localeCompare(String(left.memberSince || ""));
    });
  }

  function ensureOpsShell() {
    const navLinks = qs(".tn-links");
    if (navLinks && !qs("#opsBtn")) {
      const opsButton = document.createElement("button");
      opsButton.className = "tn-btn";
      opsButton.id = "opsBtn";
      opsButton.setAttribute("data-nav-view", "ops");
      opsButton.addEventListener("click", function () {
        showBuyView("ops");
      });
      navLinks.appendChild(opsButton);
    }

    const sellerView = qs("#seller-view");
    if (sellerView && !qs("#ops-view")) {
      sellerView.insertAdjacentHTML("afterend", "<section id=\"ops-view\" class=\"container\"></section>");
    }

    if (!qs("#irisxOpsModal")) {
      document.body.insertAdjacentHTML("beforeend", "<div class=\"irisx-modal\" id=\"irisxOpsModal\"></div>");
    }

    renderOpsModal();
  }

  function openOpsModal(mode, payload) {
    state.opsModalMode = mode;
    state.opsModalPayload = payload || null;
    renderOpsModal();
    qs("#irisxOpsModal").classList.add("open");
  }

  function closeOpsModal() {
    state.opsModalMode = null;
    state.opsModalPayload = null;
    const modal = qs("#irisxOpsModal");
    if (modal) {
      modal.classList.remove("open");
    }
  }

  function renderOpsModal() {
    const modal = qs("#irisxOpsModal");
    if (!modal) {
      return;
    }

    if (!state.opsModalMode) {
      modal.innerHTML = "";
      return;
    }

    if (state.opsModalMode === "ship") {
      modal.innerHTML =
        "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card\"><div class=\"irisx-card-head\"><div><div class=\"irisx-title\">" +
        langText("Segna ordine spedito", "Mark order as shipped") +
        "</div><div class=\"irisx-subtitle\">" +
        langText("Inserisci carrier e tracking per il buyer.", "Add carrier and tracking for the buyer.") +
        "</div></div><button class=\"irisx-close\" onclick=\"closeOpsModal()\">✕</button></div><div class=\"irisx-card-body\"><div class=\"irisx-form-grid\"><div class=\"irisx-field\"><label for=\"opsCarrier\">" +
        langText("Corriere", "Carrier") +
        "</label><input id=\"opsCarrier\" type=\"text\" placeholder=\"DHL\"></div><div class=\"irisx-field\"><label for=\"opsTracking\">" +
        langText("Tracking number", "Tracking number") +
        "</label><input id=\"opsTracking\" type=\"text\" placeholder=\"IRIS-TRACK-001\"></div></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"submitOpsModal()\">" +
        langText("Conferma spedizione", "Confirm shipment") +
        "</button><button class=\"irisx-secondary\" onclick=\"closeOpsModal()\">" +
        langText("Annulla", "Cancel") +
        "</button></div></div></div>";
      return;
    }

    if (state.opsModalMode === "support") {
      modal.innerHTML =
        "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card\"><div class=\"irisx-card-head\"><div><div class=\"irisx-title\">" +
        langText("Richiedi supporto", "Request support") +
        "</div><div class=\"irisx-subtitle\">" +
        langText("Apri un ticket legato all'ordine selezionato.", "Open a ticket for the selected order.") +
        "</div></div><button class=\"irisx-close\" onclick=\"closeOpsModal()\">✕</button></div><div class=\"irisx-card-body\"><div class=\"irisx-form-grid\"><div class=\"irisx-field\"><label for=\"opsTicketReason\">" +
        langText("Motivo", "Reason") +
        "</label><select id=\"opsTicketReason\"><option value=\"shipping\">" +
        langText("Problema spedizione", "Shipping issue") +
        "</option><option value=\"item_not_as_described\">" +
        langText("Articolo non conforme", "Item not as described") +
        "</option><option value=\"payment\">" +
        langText("Problema pagamento", "Payment issue") +
        "</option><option value=\"other\">" +
        langText("Altro", "Other") +
        "</option></select></div><div class=\"irisx-field\"><label for=\"opsTicketMessage\">" +
        langText("Dettagli", "Details") +
        "</label><textarea id=\"opsTicketMessage\"></textarea></div></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"submitOpsModal()\">" +
        langText("Apri ticket", "Open ticket") +
        "</button><button class=\"irisx-secondary\" onclick=\"closeOpsModal()\">" +
        langText("Annulla", "Cancel") +
        "</button></div></div></div>";
      return;
    }

    if (state.opsModalMode === "review") {
      modal.innerHTML =
        "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card\"><div class=\"irisx-card-head\"><div><div class=\"irisx-title\">" +
        langText("Lascia una recensione", "Leave a review") +
        "</div><div class=\"irisx-subtitle\">" +
        langText("Valuta la tua esperienza con il seller.", "Rate your experience with the seller.") +
        "</div></div><button class=\"irisx-close\" onclick=\"closeOpsModal()\">✕</button></div><div class=\"irisx-card-body\"><div class=\"irisx-form-grid\"><div class=\"irisx-field\"><label for=\"opsReviewRating\">" +
        langText("Valutazione", "Rating") +
        "</label><select id=\"opsReviewRating\"><option value=\"5\">5</option><option value=\"4\">4</option><option value=\"3\">3</option><option value=\"2\">2</option><option value=\"1\">1</option></select></div><div class=\"irisx-field\"><label for=\"opsReviewMessage\">" +
        langText("Commento", "Comment") +
        "</label><textarea id=\"opsReviewMessage\"></textarea></div></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"submitOpsModal()\">" +
        langText("Invia recensione", "Submit review") +
        "</button><button class=\"irisx-secondary\" onclick=\"closeOpsModal()\">" +
        langText("Annulla", "Cancel") +
        "</button></div></div></div>";
      return;
    }
  }

  function submitOpsModal() {
    if (state.opsModalMode === "ship") {
      submitShipmentForOrder(state.opsModalPayload.orderId);
      return;
    }

    if (state.opsModalMode === "support") {
      submitSupportTicket(state.opsModalPayload.orderId);
      return;
    }

    if (state.opsModalMode === "review") {
      submitOrderReview(state.opsModalPayload.orderId);
    }
  }

  function renderOpsView() {
    const container = qs("#ops-view");
    if (!container) {
      return;
    }

    if (!isCurrentUserAdmin()) {
      container.innerHTML = "";
      return;
    }

    const pendingShipments = state.orders.filter(function (order) { return order.status === "paid"; }).length;
    const openTickets = state.supportTickets.filter(function (ticket) { return ticket.status !== "resolved"; }).length;
    const readyPayouts = state.orders.filter(function (order) { return order.payment && order.payment.payoutStatus === "ready"; }).length;

    container.innerHTML =
      "<div class=\"irisx-ops-shell\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">OPS</div><div class=\"irisx-kicker\">" +
      langText("Console owner", "Owner console") +
      "</div></div><div class=\"irisx-ops-grid\"><section class=\"irisx-account-card\"><h3>" +
      langText("Panoramica", "Overview") +
      "</h3><div class=\"irisx-account-stats\"><div class=\"irisx-account-stat\"><strong>" +
      state.orders.length +
      "</strong><span>" +
      langText("ordini", "orders") +
      "</span></div><div class=\"irisx-account-stat\"><strong>" +
      pendingShipments +
      "</strong><span>" +
      langText("da spedire", "to ship") +
      "</span></div><div class=\"irisx-account-stat\"><strong>" +
      openTickets +
      "</strong><span>" +
      langText("ticket aperti", "open tickets") +
      "</span></div><div class=\"irisx-account-stat\"><strong>" +
      readyPayouts +
      "</strong><span>" +
      langText("payout ready", "payout ready") +
      "</span></div></div></section><section class=\"irisx-account-card\"><h3>" +
      langText("Outbox email", "Email outbox") +
      "</h3><div class=\"irisx-order-list\">" +
      (state.emailOutbox.length
        ? state.emailOutbox.slice(0, 6).map(function (mail) {
            return "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" + escapeHtml(mail.subject) + "</strong><span>" + escapeHtml(mail.to) + "</span></div><div class=\"irisx-order-items\"><div>" + escapeHtml(mail.type) + "</div><div>" + formatRelativeTime(mail.createdAt) + "</div></div></div>";
          }).join("")
        : "<div class=\"irisx-empty-state\">" + langText("Nessuna email in coda.", "No queued emails.") + "</div>") +
      "</div></section></div><div class=\"irisx-profile-section\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">" +
      langText("Ordini", "Orders") +
      "</div></div><div class=\"irisx-order-list\">" +
      (state.orders.length
        ? state.orders.map(function (order) {
            const canMarkPayout = order.payment && order.payment.payoutStatus === "ready";
            return "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" + escapeHtml(order.number) + "</strong><span>" + escapeHtml(getOrderStatusLabel(order)) + "</span></div><div class=\"irisx-order-items\"><div>" + escapeHtml(order.buyerEmail) + " - " + escapeHtml(formatCurrency(order.total)) + "</div><div>" + escapeHtml(order.items.map(function (item) { return item.brand + " " + item.name; }).join(", ")) + "</div></div>" + (canMarkPayout ? "<div class=\"irisx-actions\"><button class=\"irisx-secondary\" onclick=\"markOrderPayoutPaid('" + order.id + "')\">" + langText("Segna payout pagato", "Mark payout paid") + "</button></div>" : "") + "</div>";
          }).join("")
        : "<div class=\"irisx-empty-state\">" + langText("Nessun ordine ancora.", "No orders yet.") + "</div>") +
      "</div></div><div class=\"irisx-profile-section\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">" +
      langText("Supporto", "Support") +
      "</div></div><div class=\"irisx-order-list\">" +
      (state.supportTickets.length
        ? state.supportTickets.map(function (ticket) {
            return "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" + escapeHtml(ticket.id) + "</strong><span>" + escapeHtml(ticket.status) + "</span></div><div class=\"irisx-order-items\"><div>" + escapeHtml(ticket.reason) + " - " + escapeHtml(ticket.buyerEmail) + "</div><div>" + escapeHtml(ticket.message) + "</div></div>" + (ticket.status !== "resolved" ? "<div class=\"irisx-actions\"><button class=\"irisx-secondary\" onclick=\"resolveSupportTicket('" + ticket.id + "')\">" + langText("Segna risolto", "Mark resolved") + "</button></div>" : "") + "</div>";
          }).join("")
        : "<div class=\"irisx-empty-state\">" + langText("Nessun ticket aperto.", "No open tickets.") + "</div>") +
      "</div></div><div class=\"irisx-profile-section\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">" +
      langText("Utenti recenti", "Recent users") +
      "</div></div><div class=\"irisx-order-list\">" +
      getRecentAdminUsers().slice(0, 6).map(function (user) {
        return "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" + escapeHtml(user.name || user.email) + "</strong><span>" + escapeHtml(user.role || "member") + "</span></div><div class=\"irisx-order-items\"><div>" + escapeHtml(user.email) + "</div></div></div>";
      }).join("") +
      "</div></div></div>";
  }

  function createOrderFromCheckout(items, shipping) {
    const createdAt = Date.now();
    const normalizedItems = items.map(function (entry) {
      const product = entry.product;
      const seller = product.seller || {};
      ensureSellerEmail(seller);
      return {
        productId: product.id,
        name: product.name,
        brand: product.brand,
        qty: entry.qty,
        price: product.price,
        sellerId: seller.id || "seller-unknown",
        sellerName: seller.name || langText("Venditore sconosciuto", "Unknown seller"),
        sellerEmail: normalizeEmail(seller.email),
        lineStatus: "paid"
      };
    });
    const subtotal = getCartSubtotal(items);
    const platformFee = getPlatformFee(subtotal);
    const order = {
      id: createId("ord"),
      number: "IRIS-" + String(createdAt).slice(-8),
      buyerEmail: normalizeEmail(state.currentUser.email),
      buyerName: shipping.name,
      items: normalizedItems,
      sellerEmails: Array.from(new Set(normalizedItems.map(function (item) { return normalizeEmail(item.sellerEmail); }).filter(Boolean))),
      shipping: {
        name: shipping.name,
        address: shipping.address,
        city: shipping.city,
        country: shipping.country,
        note: shipping.note,
        carrier: "",
        trackingNumber: "",
        method: langText("Spedizione assicurata", "Insured shipping"),
        labelStatus: "pending",
        shippedAt: null,
        deliveredAt: null
      },
      status: "paid",
      payment: {
        provider: "prototype_manual",
        status: "captured",
        capturedAt: createdAt,
        receiptNumber: "RCPT-" + String(createdAt).slice(-8),
        platformFee: platformFee,
        sellerNet: Math.max(0, subtotal - platformFee),
        refundStatus: "none",
        payoutStatus: "pending_shipment"
      },
      timeline: inferOrderTimeline(createdAt, "paid"),
      supportTicketIds: [],
      emailIds: [],
      notificationIds: [],
      reviewStatus: "pending",
      createdAt: createdAt,
      subtotal: subtotal,
      shippingCost: SHIPPING_COST,
      total: subtotal + SHIPPING_COST
    };

    return order;
  }

  function notifyNewUser(user) {
    enqueueEmail("welcome-user", user.email, {
      name: user.name,
      email: user.email
    });
    enqueueEmail("verify-account", user.email, {
      email: user.email
    });
    createNotification({
      audience: "admin",
      kind: "user",
      title: langText("Nuova registrazione", "New registration"),
      body: user.email,
      recipientEmail: PLATFORM_CONFIG.ownerEmail
    });
    recordAuditEvent("user_registered", user.email);
  }

  function notifyNewListing(listing) {
    createNotification({
      audience: "admin",
      kind: "listing",
      title: langText("Nuovo annuncio", "New listing"),
      body: listing.brand + " " + listing.name,
      recipientEmail: PLATFORM_CONFIG.ownerEmail
    });
    recordAuditEvent("listing_created", listing.brand + " " + listing.name, {
      ownerEmail: listing.ownerEmail
    });
  }

  function notifyNewOrder(order) {
    const itemsSummary = order.items.map(function (item) { return item.brand + " " + item.name; }).join(", ");
    const buyerPayload = {
      orderNumber: order.number,
      total: formatCurrency(order.total),
      itemsSummary: itemsSummary,
      receiptNumber: order.payment.receiptNumber
    };

    order.emailIds.push(enqueueEmail("order-buyer", order.buyerEmail, buyerPayload).id);
    order.emailIds.push(enqueueEmail("payment-confirmed", order.buyerEmail, buyerPayload).id);
    order.emailIds.push(enqueueEmail("order-receipt", order.buyerEmail, buyerPayload).id);
    order.emailIds.push(enqueueEmail("order-admin", PLATFORM_CONFIG.ownerEmail, {
      orderNumber: order.number,
      buyerEmail: order.buyerEmail
    }).id);

    order.items.forEach(function (item) {
      order.emailIds.push(enqueueEmail("item-sold-seller", item.sellerEmail, {
        orderNumber: order.number,
        itemsSummary: item.brand + " " + item.name
      }).id);
      order.notificationIds.push(createNotification({
        audience: "user",
        kind: "sale",
        title: langText("Articolo venduto", "Item sold"),
        body: item.brand + " " + item.name,
        recipientEmail: item.sellerEmail
      }).id);
    });

    order.notificationIds.push(createNotification({
      audience: "user",
      kind: "order",
      title: langText("Nuovo ordine", "New order"),
      body: order.number + " - " + formatCurrency(order.total),
      recipientEmail: order.buyerEmail
    }).id);
    order.notificationIds.push(createNotification({
      audience: "admin",
      kind: "order",
      title: langText("Nuovo ordine marketplace", "New marketplace order"),
      body: order.number + " - " + order.buyerEmail,
      recipientEmail: PLATFORM_CONFIG.ownerEmail
    }).id);
    recordAuditEvent("order_created", order.number, {
      buyerEmail: order.buyerEmail
    });
  }

  function updateOrderRecord(orderId, updater) {
    let updatedOrder = null;
    state.orders = state.orders.map(function (order) {
      if (order.id !== orderId) {
        return order;
      }

      updatedOrder = updater(order);
      return updatedOrder;
    });

    persistOrders();
    renderProfilePanel();
    renderOpsView();
    return updatedOrder;
  }

  function openShipmentModal(orderId) {
    openOpsModal("ship", { orderId: orderId });
  }

  function submitShipmentForOrder(orderId) {
    const carrierField = qs("#opsCarrier");
    const trackingField = qs("#opsTracking");
    const carrier = carrierField ? carrierField.value.trim() : "";
    const trackingNumber = trackingField ? trackingField.value.trim() : "";

    if (!carrier || !trackingNumber) {
      showToast(langText("Inserisci corriere e tracking.", "Please add carrier and tracking."));
      return;
    }

    const updated = updateOrderRecord(orderId, function (order) {
      order.status = "shipped";
      order.shipping.carrier = carrier;
      order.shipping.trackingNumber = trackingNumber;
      order.shipping.shippedAt = Date.now();
      order.shipping.labelStatus = "generated";
      order.payment.payoutStatus = "pending_delivery";
      appendOrderEvent(order, "order_shipped", langText("Ordine spedito", "Order shipped"), {
        carrier: carrier,
        trackingNumber: trackingNumber
      });
      return order;
    });

    if (!updated) {
      return;
    }

    enqueueEmail("item-shipped", updated.buyerEmail, {
      orderNumber: updated.number,
      carrier: carrier,
      trackingNumber: trackingNumber
    });
    createNotification({
      audience: "user",
      kind: "shipping",
      title: langText("Ordine spedito", "Order shipped"),
      body: carrier + " - " + trackingNumber,
      recipientEmail: updated.buyerEmail
    });
    recordAuditEvent("order_shipped", updated.number, {
      carrier: carrier,
      trackingNumber: trackingNumber
    });

    closeOpsModal();
    showToast(langText("Spedizione aggiornata.", "Shipment updated."));
  }

  function confirmOrderDelivered(orderId) {
    const updated = updateOrderRecord(orderId, function (order) {
      order.status = "delivered";
      order.shipping.deliveredAt = Date.now();
      order.payment.payoutStatus = "ready";
      appendOrderEvent(order, "order_delivered", langText("Ordine consegnato", "Order delivered"));
      return order;
    });

    if (!updated) {
      return;
    }

    createNotification({
      audience: "user",
      kind: "delivery",
      title: langText("Ordine consegnato", "Order delivered"),
      body: updated.number,
      recipientEmail: updated.buyerEmail
    });
    updated.items.forEach(function (item) {
      createNotification({
        audience: "user",
        kind: "delivery",
        title: langText("Consegna confermata", "Delivery confirmed"),
        body: updated.number,
        recipientEmail: item.sellerEmail
      });
    });
    recordAuditEvent("order_delivered", updated.number);
    renderProfilePanel();
    renderOpsView();
  }

  function openSupportModal(orderId) {
    openOpsModal("support", { orderId: orderId });
  }

  function submitSupportTicket(orderId) {
    const reasonField = qs("#opsTicketReason");
    const messageField = qs("#opsTicketMessage");
    const reason = reasonField ? reasonField.value.trim() : "other";
    const message = messageField ? messageField.value.trim() : "";

    if (!message) {
      showToast(langText("Inserisci i dettagli della richiesta.", "Please enter request details."));
      return;
    }

    const order = state.orders.find(function (candidate) { return candidate.id === orderId; });
    if (!order) {
      return;
    }

    const ticket = {
      id: createId("tkt"),
      orderId: order.id,
      orderNumber: order.number,
      buyerEmail: order.buyerEmail,
      sellerEmail: order.items[0] ? order.items[0].sellerEmail : "",
      status: "open",
      reason: reason,
      message: message,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    state.supportTickets.unshift(ticket);
    persistSupportTickets();

    updateOrderRecord(orderId, function (currentOrder) {
      currentOrder.supportTicketIds.push(ticket.id);
      appendOrderEvent(currentOrder, "support_ticket_opened", langText("Ticket supporto aperto", "Support ticket opened"), {
        ticketId: ticket.id
      });
      return currentOrder;
    });

    enqueueEmail("support-request", PLATFORM_CONFIG.supportEmail, {
      preview: order.number + " - " + message
    });
    enqueueEmail("issue-reported", order.buyerEmail, {
      preview: message
    });
    createNotification({
      audience: "admin",
      kind: "support",
      title: langText("Nuovo ticket supporto", "New support ticket"),
      body: order.number + " - " + reason,
      recipientEmail: PLATFORM_CONFIG.ownerEmail
    });
    createNotification({
      audience: "user",
      kind: "support",
      title: langText("Ticket aperto", "Ticket opened"),
      body: order.number,
      recipientEmail: order.buyerEmail
    });
    recordAuditEvent("support_ticket_opened", order.number, {
      ticketId: ticket.id
    });

    closeOpsModal();
    renderProfilePanel();
    renderOpsView();
    showToast(langText("Ticket creato.", "Ticket created."));
  }

  function resolveSupportTicket(ticketId) {
    state.supportTickets = state.supportTickets.map(function (ticket) {
      if (ticket.id !== ticketId) {
        return ticket;
      }

      return Object.assign({}, ticket, {
        status: "resolved",
        updatedAt: Date.now()
      });
    });
    persistSupportTickets();
    renderOpsView();
  }

  function openReviewModal(orderId) {
    openOpsModal("review", { orderId: orderId });
  }

  function submitOrderReview(orderId) {
    const ratingField = qs("#opsReviewRating");
    const messageField = qs("#opsReviewMessage");
    const rating = ratingField ? Number(ratingField.value) : 5;
    const message = messageField ? messageField.value.trim() : "";
    const order = state.orders.find(function (candidate) { return candidate.id === orderId; });

    if (!order || !order.items[0]) {
      return;
    }

    const review = {
      id: createId("rev"),
      sellerId: order.items[0].sellerId,
      buyer: state.currentUser ? state.currentUser.name : langText("Cliente IRIS", "IRIS customer"),
      rating: rating,
      text: message || langText("Esperienza positiva.", "Positive experience."),
      date: new Date().toLocaleDateString(curLang === "it" ? "it-IT" : "en-US", {
        month: "short",
        year: "numeric"
      }),
      product: order.items.map(function (item) { return item.name; }).join(", ")
    };

    state.reviews.unshift(review);
    persistReviews();
    hydrateStoredReviews();

    updateOrderRecord(orderId, function (currentOrder) {
      currentOrder.reviewStatus = "submitted";
      appendOrderEvent(currentOrder, "buyer_review_submitted", langText("Recensione buyer inviata", "Buyer review submitted"));
      return currentOrder;
    });

    closeOpsModal();
    renderProfilePanel();
    showToast(langText("Recensione salvata.", "Review saved."));
  }

  function markOrderPayoutPaid(orderId) {
    const updated = updateOrderRecord(orderId, function (order) {
      order.payment.payoutStatus = "paid";
      appendOrderEvent(order, "seller_payout_paid", langText("Payout seller completato", "Seller payout completed"));
      return order;
    });

    if (!updated) {
      return;
    }

    recordAuditEvent("seller_payout_paid", updated.number);
    renderOpsView();
  }

  function overrideOperationalFlows() {
    renderNotifications = function () {
      const panel = qs("#notifPanel");
      const badge = qs("#notifBadge");
      if (!panel || !badge) {
        return;
      }

      const visibleNotifications = getVisibleNotifications();
      const unread = visibleNotifications.filter(function (notification) { return notification.unread; }).length;
      badge.textContent = unread;
      badge.style.display = unread ? "flex" : "none";
      panel.innerHTML = "<div class=\"notif-head\"><span class=\"notif-title\">" +
        langText("Notifiche", "Notifications") +
        "</span><button class=\"notif-clear\" onclick=\"markAllRead()\">" +
        langText("Segna tutto letto", "Mark all read") +
        "</button></div>" +
        (visibleNotifications.length
          ? visibleNotifications.map(function (notification) {
              return "<div class=\"notif-item" + (notification.unread ? " unread" : "") + "\" onclick=\"readNotif('" + notification.id + "')\"><div class=\"notif-icon\">•</div><div class=\"notif-content\"><div class=\"notif-text\">" + escapeHtml(notification.title) + "</div><div class=\"notif-time\">" + escapeHtml(notification.body) + " - " + formatRelativeTime(notification.createdAt) + "</div></div>" + (notification.unread ? "<div class=\"notif-dot\"></div>" : "") + "</div>";
            }).join("")
          : "<div class=\"notif-empty\">" + langText("Nessuna notifica", "No notifications") + "</div>");
    };

    readNotif = function (id) {
      state.notifications = state.notifications.map(function (notification) {
        if (notification.id !== id) {
          return notification;
        }

        return Object.assign({}, notification, {
          unread: false
        });
      });
      persistNotifications();
      renderNotifications();
    };

    markAllRead = function () {
      state.notifications = state.notifications.map(function (notification) {
        const isVisibleToCurrentUser = getVisibleNotifications().some(function (visible) { return visible.id === notification.id; });
        return isVisibleToCurrentUser ? Object.assign({}, notification, { unread: false }) : notification;
      });
      persistNotifications();
      renderNotifications();
    };

    sendChat = function () {
      if (!curChat) {
        return;
      }
      const input = qs("#chatInput");
      if (!input || !input.value.trim()) {
        return;
      }

      const conversation = chats.find(function (thread) { return thread.id === curChat; });
      if (!conversation) {
        return;
      }

      const message = input.value.trim();
      conversation.msgs.push({
        from: "me",
        text: message,
        time: langText("Ora", "Now")
      });
      persistChats();
      input.value = "";
      openChatById(curChat);

      ensureSellerEmail(conversation.with);
      createNotification({
        audience: "user",
        kind: "message",
        title: langText("Nuovo messaggio", "New message"),
        body: message,
        recipientEmail: conversation.with.email
      });
      enqueueEmail("new-message", conversation.with.email, {
        preview: message
      });
      renderNotifications();
    };

    sendOffer = function () {
      const input = qs("#offerInput");
      const amount = input ? input.value : "";
      if (!amount) {
        return;
      }

      const product = prods.find(function (candidate) { return candidate.id === offerProdId; });
      if (!product || !isProductPurchasable(product)) {
        showToast(langText("Questo articolo non e' piu' disponibile.", "This item is no longer available."));
        return;
      }

      openChat(product.seller.id, product.id);
      const conversation = chats.find(function (thread) { return thread.with.id === product.seller.id; });
      if (conversation) {
        conversation.msgs.push({
          from: "me",
          text: langText("Offerta inviata: ", "Offer sent: ") + formatLocalCurrencyValue(amount) + " - " + product.name,
          time: langText("Ora", "Now")
        });
        persistChats();
      }

      ensureSellerEmail(product.seller);
      createNotification({
        audience: "user",
        kind: "offer",
        title: langText("Nuova offerta", "New offer"),
        body: product.name + " - " + formatLocalCurrencyValue(amount),
        recipientEmail: product.seller.email
      });
      enqueueEmail("new-offer", product.seller.email, {
        preview: product.name + " - " + formatLocalCurrencyValue(amount)
      });
      closeOffer();
      if (conversation) {
        openChatById(conversation.id);
      }
      renderNotifications();
    };

    window.closeOpsModal = closeOpsModal;
    window.submitOpsModal = submitOpsModal;
    window.openShipmentModal = openShipmentModal;
    window.openSupportModal = openSupportModal;
    window.confirmOrderDelivered = confirmOrderDelivered;
    window.resolveSupportTicket = resolveSupportTicket;
    window.markOrderPayoutPaid = markOrderPayoutPaid;
    window.openReviewModal = openReviewModal;
    window.readNotif = readNotif;
    window.markAllRead = markAllRead;
  }

  function overrideMarketplaceFunctions() {
    const originalApplyLang = applyLang;
    applyLang = function () {
      originalApplyLang();
      const locale = getLocaleConfig();
      ensureLanguageSelector();
      document.documentElement.lang = curLang;
      document.documentElement.dir = isRtlLocale() ? "rtl" : "ltr";
      document.body.classList.toggle("irisx-rtl", isRtlLocale());
      const homeButton = qs(".tn-home");
      if (homeButton) {
        homeButton.textContent = t("home");
      }
      const backButton = qs("#tnBackBtn");
      if (backButton) {
        backButton.textContent = t("home");
      }
      const authBadge = qs("#authBadge");
      if (authBadge) {
        const homeCopy = getHomeCopy();
        const badgeLabel = homeCopy && Array.isArray(homeCopy.strip) && homeCopy.strip[0] && homeCopy.strip[0].label
          ? homeCopy.strip[0].label
          : "Authenticated";
        authBadge.textContent = "✦ 100% " + badgeLabel;
      }
      const opsButton = qs("#opsBtn");
      if (opsButton) {
        opsButton.textContent = "Ops";
      }
      const langSelect = qs("#langToggle");
      if (langSelect) {
        langSelect.value = curLang;
        langSelect.setAttribute("title", locale.nativeLabel + " · " + locale.currency);
      }
      const cartButton = qs("#cartBtn");
      if (cartButton) {
        cartButton.setAttribute("aria-label", t("cart_open"));
      }
      const searchInput = qs("#searchInput");
      if (searchInput) {
        searchInput.placeholder = t("search_placeholder");
        renderAutocompleteSuggestions(searchInput.value || "");
      }
      const filterSearchInputs = qsa(".filters .f-search");
      if (filterSearchInputs[0]) {
        filterSearchInputs[0].placeholder = t("search_brand");
      }
      if (filterSearchInputs[1]) {
        filterSearchInputs[1].placeholder = t("size_placeholder");
      }
      const minInput = qs("#f-pmin");
      const maxInput = qs("#f-pmax");
      if (minInput) {
        minInput.placeholder = t("price_min");
      }
      if (maxInput) {
        maxInput.placeholder = t("price_max");
      }
      const count = qs("#resultCount");
      const countWrap = count ? count.parentElement : null;
      if (countWrap) {
        countWrap.innerHTML = "<span id=\"resultCount\">" + (count.textContent || "0") + "</span> " + escapeHtml(t("results"));
      }
      initFilters();
      syncSessionUi();
      renderHomeView();
      if (typeof renderFooters === "function") {
        renderFooters();
      }
      renderCartDrawer();
      renderCheckoutModal();
      renderOpsModal();
      renderOpsView();
      renderProfilePanel();
      updateSellStatus(t("sell_status_idle"));
    };

    switchLang = function (nextLang) {
      const localeCodes = Object.keys(LOCALE_SETTINGS);
      if (nextLang && LOCALE_SETTINGS[nextLang]) {
        setLanguage(nextLang);
        return;
      }
      const currentIndex = Math.max(0, localeCodes.indexOf(curLang));
      setLanguage(localeCodes[(currentIndex + 1) % localeCodes.length]);
    };

    renderBrandFilters = function (query) {
      const brands = getAvailableBrands();
      const filtered = query ? brands.filter((brand) => normalizeSearchText(brand).includes(normalizeSearchText(query))) : brands;
      qs("#f-brands").innerHTML = filtered
        .map(
          (brand) =>
            "<div class=\"f-opt" +
            (filters.brands.includes(brand) ? " on" : "") +
            "\" onclick=\"toggleOpt(this,'brands','" +
            escapeHtml(brand) +
            "')\"><div class=\"f-check\">✓</div>" +
            escapeHtml(brand) +
            "</div>"
        )
        .join("");
    };

    initFilters = function () {
      const brandSearch = qs(".filters .f-search");
      const brandQuery = brandSearch ? brandSearch.value : "";
      qs("#f-cats").innerHTML = getAvailableCategories()
        .map(
          (category) =>
            "<div class=\"f-opt" + (filters.cats.includes(category) ? " on" : "") + "\" onclick=\"toggleOpt(this,'cats','" +
            escapeHtml(category) +
            "')\"><div class=\"f-check\">✓</div>" +
            escapeHtml(getFacetLabel("cats", category)) +
            "</div>"
        )
        .join("");
      renderBrandFilters(brandQuery);
      qs("#f-conds").innerHTML = getAvailableConditions()
        .map(
          (condition) =>
            "<div class=\"f-opt" + (filters.conds.includes(condition) ? " on" : "") + "\" onclick=\"toggleOpt(this,'conds','" +
            escapeHtml(condition) +
            "')\"><div class=\"f-check\">✓</div>" +
            escapeHtml(getFacetLabel("conds", condition)) +
            "</div>"
        )
        .join("");
      qs("#f-fit").innerHTML = getAvailableFits()
        .map(
          (fit) =>
            "<button class=\"f-fit-btn" + (filters.fits.includes(fit) ? " on" : "") + "\" onclick=\"toggleFit(this,'" +
            escapeHtml(fit) +
            "')\">" +
            escapeHtml(getFacetLabel("fits", fit)) +
            "</button>"
        )
        .join("");
      qs("#f-colors").innerHTML = getAvailableColors()
        .map(
          (color) =>
            "<div class=\"f-color" + (filters.colors.includes(color) ? " on" : "") + "\" onclick=\"toggleColor(this,'" +
            escapeHtml(color) +
            "')\" style=\"background:" +
            escapeHtml(getColorSwatch(color)) +
            "\" title=\"" +
            escapeHtml(getFacetLabel("colors", color)) +
            "\"></div>"
        )
        .join("");

      if (qs("#f-size")) {
        qs("#f-size").value = filters.size || "";
      }
      if (qs("#f-pmin")) {
        qs("#f-pmin").value = filters.pmin || "";
      }
      if (qs("#f-pmax")) {
        qs("#f-pmax").value = filters.pmax || "";
      }
    };

    clearFilters = function () {
      filters = { cats: [], brands: [], conds: [], fits: [], colors: [], size: "", pmin: "", pmax: "", search: "" };
      const searchInput = qs("#searchInput");
      if (searchInput) {
        searchInput.value = "";
      }
      const brandSearch = qs(".filters .f-search");
      if (brandSearch) {
        brandSearch.value = "";
      }
      initFilters();
      render();
    };

    applyFilters = function () {
      const sizeInput = qs("#f-size");
      const minInput = qs("#f-pmin");
      const maxInput = qs("#f-pmax");
      filters.size = sizeInput ? sizeInput.value.trim() : "";
      filters.pmin = minInput ? minInput.value.trim() : "";
      filters.pmax = maxInput ? maxInput.value.trim() : "";
      render();
    };

    handleSearch = function (value) {
      filters.search = (value || "").trim();
      if (filters.search && !qs("#shop-view.active")) {
        showBuyView("shop");
      } else {
        render();
      }
    };

    getFiltered = function () {
      const minPrice = parseLocalizedNumberInput(filters.pmin);
      const maxPrice = parseLocalizedNumberInput(filters.pmax);
      const sizeQuery = normalizeSearchText(filters.size);
      const searchQuery = normalizeSearchText(filters.search);

      const items = getVisibleCatalogProducts().filter(function (product) {
        const normalizedCategory = normalizeCategoryValue(product.cat);
        const convertedPrice = convertBaseEurAmount(product.price);
        const searchable = getProductSearchIndex(product);

        if (filters.cats.length && !filters.cats.includes(normalizedCategory)) return false;
        if (filters.brands.length && !filters.brands.includes(product.brand)) return false;
        if (filters.conds.length && !filters.conds.includes(product.cond)) return false;
        if (filters.fits.length && !filters.fits.includes(product.fit)) return false;
        if (filters.colors.length && !filters.colors.includes(product.color)) return false;
        if (sizeQuery && !normalizeSearchText(product.sz + " " + product.dims).includes(sizeQuery)) return false;
        if (minPrice !== null && convertedPrice < minPrice) return false;
        if (maxPrice !== null && convertedPrice > maxPrice) return false;
        if (searchQuery && !searchable.includes(searchQuery)) return false;
        return true;
      });

      if (curSort === "price_asc") items.sort(function (a, b) { return a.price - b.price; });
      else if (curSort === "price_desc") items.sort(function (a, b) { return b.price - a.price; });
      else if (curSort === "discount") items.sort(function (a, b) { return (1 - b.price / b.orig) - (1 - a.price / a.orig); });
      else items.sort(function (a, b) { return b.date - a.date; });
      return items;
    };

    removeChip = function (type, value) {
      if (type === "size" || type === "pmin" || type === "pmax" || type === "search") {
        filters[type] = "";
        if (type === "search" && qs("#searchInput")) {
          qs("#searchInput").value = "";
        }
      } else {
        const index = filters[type].indexOf(value);
        if (index > -1) {
          filters[type].splice(index, 1);
        }
      }
      initFilters();
      render();
    };

    const originalToggleFav = toggleFav;
    toggleFav = function (id, button) {
      originalToggleFav(id, button);
      saveJson(STORAGE_KEYS.favorites, [...favorites]);
      renderProfilePanel();
    };

    const originalOpenChat = openChat;
    openChat = function (sellerId, productId) {
      requireAuth(function () {
        originalOpenChat(sellerId, productId);
      });
    };

    const originalOpenOffer = openOffer;
    openOffer = function (id) {
      requireAuth(function () {
        originalOpenOffer(id);
      });
    };

    showBuyView = function (view) {
      const targetView = view || "home";
      const ids = ["home-view", "shop-view", "detail-view", "fav-view", "chat-view", "profile-view", "seller-view", "ops-view"];

      ids.forEach(function (id) {
        const element = qs("#" + id);
        if (!element) {
          return;
        }
        element.classList.remove("active", "view-enter");
        if (id !== "detail-view") {
          element.style.display = "";
        }
      });

      const detailView = qs("#detail-view");
      if (detailView) {
        detailView.style.display = "none";
      }

      state.lastNonDetailView = targetView === "detail" ? state.lastNonDetailView : targetView;

      const mobileFilterButton = qs(".mob-filter-btn");
      if (mobileFilterButton) {
        mobileFilterButton.style.display = targetView === "shop" ? "" : "none";
      }

      const topnav = qs("#topnav");
      if (topnav) {
        topnav.classList.toggle("irisx-search-hidden", !(targetView === "home" || targetView === "shop"));
      }

      if (targetView === "home") {
        renderHomeView();
        qs("#home-view").classList.add("active");
        setActiveNav("home");
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "shop") {
        showSkeleton("grid", "grid");
        qs("#shop-view").classList.add("active");
        setActiveNav("shop");
        setTimeout(function () {
          render();
          renderFooters();
        }, 180);
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "fav") {
        qs("#fav-view").classList.add("active", "view-enter");
        renderFavorites();
        setActiveNav("fav");
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "chat") {
        const chatView = qs("#chat-view");
        chatView.classList.add("active");
        showSkeleton("chatList", "chat");
        setActiveNav("chat");
        setTimeout(function () {
          renderChats();
        }, 200);
        return;
      }

      if (targetView === "profile") {
        qs("#profile-view").classList.add("active", "view-enter");
        renderProfilePanel();
        setActiveNav("profile");
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "seller") {
        qs("#seller-view").classList.add("active", "view-enter");
        setActiveNav("");
        return;
      }

      if (targetView === "ops") {
        qs("#ops-view").classList.add("active", "view-enter");
        renderOpsView();
        setActiveNav("ops");
      }
    };

    render = function () {
      const items = getFiltered().filter(isProductPurchasable);
      const grid = qs("#grid");
      const activeFilters = qs("#activeFilters");

      qs("#resultCount").textContent = items.length;

      const chips = [];
      filters.cats.forEach((value) => chips.push({ label: getFacetLabel("cats", value), type: "cats", value: value }));
      filters.brands.forEach((value) => chips.push({ label: value, type: "brands", value: value }));
      filters.conds.forEach((value) => chips.push({ label: getFacetLabel("conds", value), type: "conds", value: value }));
      filters.fits.forEach((value) => chips.push({ label: getFacetLabel("fits", value), type: "fits", value: value }));
      filters.colors.forEach((value) => chips.push({ label: getFacetLabel("colors", value), type: "colors", value: value }));
      if (filters.size) chips.push({ label: t("size") + ": " + filters.size, type: "size", value: filters.size });
      if (filters.pmin) chips.push({ label: t("price_min") + ": " + formatLocalCurrencyValue(filters.pmin), type: "pmin", value: filters.pmin });
      if (filters.pmax) chips.push({ label: t("price_max") + ": " + formatLocalCurrencyValue(filters.pmax), type: "pmax", value: filters.pmax });
      if (filters.search) chips.push({ label: t("search_short") + ": " + filters.search, type: "search", value: filters.search });

      activeFilters.innerHTML = chips
        .map(
          (chip) =>
            "<div class=\"af-chip\">" +
            escapeHtml(chip.label) +
            "<button onclick=\"removeChip('" +
            chip.type +
            "','" +
            escapeHtml(chip.value) +
            "')\">✕</button></div>"
        )
        .join("");

      grid.innerHTML = items.map((product) => productCardMarkup(product)).join("");
      renderHomeView();
    };

    renderFavorites = function () {
      const items = prods.filter((product) => favorites.has(product.id));
      qs("#favCountText").textContent =
        items.length + " " + (items.length === 1 ? t("cart_items").replace(/s$/, "") : t("items_saved"));

      const grid = qs("#favGrid");
      const empty = qs("#favEmpty");
      if (!items.length) {
        grid.innerHTML = "";
        empty.style.display = "block";
        return;
      }

      empty.style.display = "none";
      grid.innerHTML = items
        .map((product) => {
          const safeName = escapeHtml(product.name);
          const safeBrand = escapeHtml(product.brand);
          return (
            "<div class=\"pc\" onclick=\"showDetail(" +
            product.id +
            ")\">" +
            "<button class=\"pc-heart liked\" onclick=\"event.stopPropagation();toggleFav(" +
            product.id +
            ",this);renderFavorites()\">♥</button>" +
            productVisualMarkup(product) +
            "<div class=\"pinfo\"><div class=\"p-brand\">" +
            safeBrand +
            "</div><div class=\"p-name\">" +
            safeName +
            "</div><div class=\"p-footer\"><span class=\"p-price\">" +
            formatCurrency(product.price) +
            "</span></div></div></div>"
          );
        })
        .join("");
    };

    showDetail = function (id) {
      const product = prods.find((item) => item.id === id);
      if (!product) {
        return;
      }

      ["home-view", "shop-view", "fav-view", "chat-view", "profile-view", "seller-view"].forEach(function (viewId) {
        const view = qs("#" + viewId);
        if (view) {
          view.classList.remove("active", "view-enter");
        }
      });

      state.activeDetailImage = 0;
      const discount = Math.round((1 - product.price / product.orig) * 100);
      const liked = favorites.has(product.id);
      const fitLabel = getFacetLabel("fits", product.fit === "—" ? "—" : product.fit);
      const colorLabel = getFacetLabel("colors", product.color);
      const conditionLabel = getFacetLabel("conds", product.cond);
      const similar = prods.filter((item) => item.id !== product.id && (item.brand === product.brand || item.cat === product.cat)).slice(0, 4);
      const detailView = qs("#detail-view");
      const chips = product.chips
        .map(function (chip) {
          return "<span class=\"det-chip\">" + escapeHtml(chip) + "</span>";
        })
        .join("");
      const similarHtml = similar.length
        ? "<div class=\"det-similar\"><div class=\"det-similar-title\">" +
          t("similar") +
          "</div><div class=\"det-similar-grid\">" +
          similar
            .map(function (item) {
              return (
                "<div class=\"pc\" onclick=\"showDetail(" +
                item.id +
                ")\" style=\"min-width:160px\">" +
                productVisualMarkup(item, true) +
                "<div class=\"pinfo\" style=\"padding:.8rem\"><div class=\"p-brand\">" +
                escapeHtml(item.brand) +
                "</div><div class=\"p-name\" style=\"font-size:.78rem\">" +
                escapeHtml(item.name) +
                "</div><div class=\"p-price\" style=\"font-size:.78rem;margin-top:.3rem\">" +
                formatCurrency(item.price) +
                "</div></div></div>"
              );
            })
            .join("") +
          "</div></div>"
        : "";

      detailView.innerHTML =
        "<div class=\"det-layout view-enter\"><div class=\"det-imgs\">" +
        detailMediaMarkup(product) +
        "</div><div class=\"det-body\"><button class=\"det-back\" onclick=\"closeDetail()\">" +
        t("back_shop") +
        "</button><div class=\"det-brand\">" +
        escapeHtml(product.brand) +
        "</div><div class=\"det-name\">" +
        escapeHtml(product.name) +
        "</div><div class=\"det-prices\"><span class=\"det-price\">" +
        formatCurrency(product.price) +
        "</span><span class=\"det-orig\">" +
        formatCurrency(product.orig) +
        "</span><span class=\"det-save\">-" +
        discount +
        "%</span></div><div class=\"det-div\"></div><div class=\"det-section\"><div class=\"det-section-title\">" +
        t("details") +
        "</div><div class=\"det-chips\">" +
        chips +
        "</div></div><div class=\"det-section\"><div class=\"det-section-title\">" +
        t("fit_dims") +
        "</div><div class=\"det-fit\"><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        t("size") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(product.sz) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        t("fit_label") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(product.fit === "—" ? t("not_available") : fitLabel) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        t("color") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(colorLabel) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        t("dimensions") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(product.dims) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        t("material") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(product.material) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        t("condition") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(conditionLabel) +
        "</div></div></div></div><div class=\"det-section\"><div class=\"det-section-title\">" +
        t("description") +
        "</div><div class=\"det-desc\">" +
        escapeHtml(product.desc) +
        "</div></div><div class=\"det-section\"><div class=\"det-section-title\">" +
        t("seller") +
        "</div><div class=\"seller-card\" onclick=\"showSeller('" +
        escapeHtml(product.seller.id) +
        "')\"><div class=\"seller-av\">" +
        escapeHtml(product.seller.avatar) +
        "</div><div class=\"seller-info\"><div class=\"seller-name\">" +
        escapeHtml(product.seller.name) +
        "</div><div class=\"seller-meta\"><span>★ " +
        escapeHtml(product.seller.rating) +
        "</span> " +
        escapeHtml(product.seller.sales) +
        " " +
        t("sales") +
        " · " +
        escapeHtml(product.seller.city) +
        "</div></div><button class=\"seller-chat\" onclick=\"event.stopPropagation();openChat('" +
        escapeHtml(product.seller.id) +
        "'," +
        product.id +
        ")\">" +
        t("chat") +
        "</button></div></div>" +
        getDetailActionsMarkup(product, liked) +
        "<div class=\"det-auth\"><div class=\"det-auth-t\">" +
        t("guarantee") +
        "</div><ul><li>" +
        t("auth_1") +
        "</li><li>" +
        t("auth_2") +
        "</li><li>" +
        t("auth_3") +
        "</li><li>" +
        t("auth_4") +
        "</li></ul></div>" +
        similarHtml +
        "</div></div>";

      qs("#shop-view").style.display = "none";
      detailView.style.display = "block";
      detailView.classList.add("active");
      window.scrollTo(0, 0);
      updateMeta("IRIS - " + product.brand + " " + product.name, product.desc.substring(0, 160));
    };

    closeDetail = function () {
      showBuyView(state.lastNonDetailView || "home");
    };

    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.openAuthModal = openAuthModal;
    window.closeAuthModal = closeAuthModal;
    window.switchAuthMode = switchAuthMode;
    window.submitAuth = submitAuth;
    window.logout = logout;
    window.buyNow = buyNow;
    window.openCheckout = openCheckout;
    window.closeCheckout = closeCheckout;
    window.submitCheckout = submitCheckout;
    window.removeSellPhoto = removeSellPhoto;
    window.setDetailImage = setDetailImage;
    window.saveProfileDetails = saveProfileDetails;
    window.irisFormatCurrency = formatCurrency;
  }

  function productVisualMarkup(product, compact) {
    const hasImages = Array.isArray(product.images) && product.images.length > 0;
    const conditionLabel = getFacetLabel("conds", product.cond);
    const fitLabel = getFacetLabel("fits", product.fit);
    const soldTag = !isProductPurchasable(product) ? "<span class=\"pi-tag sold\">" + escapeHtml(getProductStatusLabel(product)) + "</span>" : "";
    const media = hasImages
      ? "<div class=\"pi\"><div class=\"pi-bg irisx-media\"><img class=\"irisx-card-image\" src=\"" +
        product.images[0] +
        "\" alt=\"" +
        escapeHtml(product.name) +
        "\"></div>" +
        (compact ? "" : "<div class=\"pi-tags\"><span class=\"pi-tag avail\">" + escapeHtml(conditionLabel) + "</span>" + (product.fit !== "—" ? "<span class=\"pi-tag fit\">" + escapeHtml(fitLabel) + "</span>" : "") + soldTag + "</div>") +
        "</div>"
      : "<div class=\"pi\"><div class=\"pi-bg\"><div class=\"pi-emoji\">" + escapeHtml(product.emoji || "👜") + "</div></div>" + (compact ? "" : "<div class=\"pi-tags\"><span class=\"pi-tag avail\">" + escapeHtml(conditionLabel) + "</span>" + (product.fit !== "—" ? "<span class=\"pi-tag fit\">" + escapeHtml(fitLabel) + "</span>" : "") + soldTag + "</div>") + "</div>";
    return media;
  }

  function getDetailActionsMarkup(product, liked) {
    if (!isProductPurchasable(product)) {
      return (
        "<div class=\"irisx-note\">" +
        langText("Questo articolo risulta gia' venduto o non disponibile per nuovi acquisti.", "This item is already sold or unavailable.") +
        "</div><div class=\"irisx-detail-actions\"><button class=\"det-fav\" onclick=\"toggleFav(" +
        product.id +
        ",null)\">" +
        (liked ? "♥ " + t("saved_fav") : "♡ " + t("add_fav")) +
        "</button></div>"
      );
    }

    return (
      "<div class=\"irisx-detail-actions\"><button class=\"det-buy\" onclick=\"buyNow(" +
      product.id +
      ")\">" +
      t("buy_now") +
      " · " +
      formatCurrency(product.price) +
      "</button><button class=\"irisx-secondary\" onclick=\"addToCart(" +
      product.id +
      ")\">" +
      t("add_to_cart") +
      "</button><button class=\"det-offer\" onclick=\"openOffer(" +
      product.id +
      ")\">" +
      t("make_offer") +
      "</button><button class=\"det-fav\" onclick=\"toggleFav(" +
      product.id +
      ",null)\">" +
      (liked ? "♥ " + t("saved_fav") : "♡ " + t("add_fav")) +
      "</button></div>"
    );
  }

  function getProductCardMarkupDiscount(discount) {
    return "-" + discount + "%";
  }

  function getProductCardMarkupFooter(product, discount) {
    return isProductPurchasable(product) ? getProductCardMarkupDiscount(discount) : getProductStatusLabel(product);
  }

  function productCardMarkup(product) {
    const discount = Math.round((1 - product.price / product.orig) * 100);
    const liked = favorites.has(product.id);
    const colorLabel = getFacetLabel("colors", product.color);
    return (
      "<div class=\"pc\" onclick=\"showDetail(" +
      product.id +
      ")\"><button class=\"pc-heart" +
      (liked ? " liked" : "") +
      "\" onclick=\"event.stopPropagation();toggleFav(" +
      product.id +
      ",this)\">" +
      (liked ? "♥" : "♡") +
      "</button>" +
      productVisualMarkup(product) +
      "<div class=\"pinfo\"><div class=\"p-brand\">" +
      escapeHtml(product.brand) +
      "</div><div class=\"p-name\">" +
      escapeHtml(product.name) +
      "</div><div class=\"p-meta\">" +
      escapeHtml(product.sz) +
      " · " +
      escapeHtml(colorLabel) +
      " · " +
      escapeHtml(product.seller.name) +
      "</div><div class=\"p-footer\"><div><span class=\"p-price\">" +
      formatCurrency(product.price) +
      "</span><span class=\"p-orig\">" +
      formatCurrency(product.orig) +
      "</span></div><span class=\"p-disc\">" +
      escapeHtml(getProductCardMarkupFooter(product, discount)) +
      "</span></div></div></div>"
    );
  }

  function detailMediaMarkup(product) {
    const images = Array.isArray(product.images) ? product.images : [];
    if (!images.length) {
      return "<div class=\"det-img-main\">" + escapeHtml(product.emoji || "👜") + "</div>";
    }

    const thumbs = images
      .map(function (src, index) {
        return (
          "<button class=\"irisx-detail-thumb" +
          (index === state.activeDetailImage ? " on" : "") +
          "\" onclick=\"setDetailImage(" +
          index +
          ")\"><img src=\"" +
          src +
          "\" alt=\"" +
          escapeHtml(product.name) +
          " " +
          (index + 1) +
          "\"></button>"
        );
      })
      .join("");

    return (
      "<div><div class=\"irisx-detail-stage\"><img class=\"irisx-detail-image\" id=\"detailMainImage\" src=\"" +
      images[state.activeDetailImage] +
      "\" alt=\"" +
      escapeHtml(product.name) +
      "\"></div>" +
      (images.length > 1 ? "<div class=\"irisx-detail-thumbs\">" + thumbs + "</div>" : "") +
      "</div>"
    );
  }

  function setDetailImage(index) {
    const mainImage = qs("#detailMainImage");
    const currentProduct = qs("#detail-view.active") ? prods.find((item) => mainImage && item.images && item.images.includes(mainImage.src)) : null;
    if (!mainImage || !currentProduct || !currentProduct.images[index]) {
      return;
    }

    state.activeDetailImage = index;
    mainImage.src = currentProduct.images[index];
    qsa(".irisx-detail-thumb").forEach(function (thumb, thumbIndex) {
      thumb.classList.toggle("on", thumbIndex === index);
    });
  }

  function handleAuthButtonClick() {
    if (state.currentUser) {
      logout();
      return;
    }
    openAuthModal("login");
  }

  function openAuthModal(mode) {
    state.authMode = mode || "login";
    state.authReturnView = getCurrentReturnView();
    renderAuthModal();
    qs("#irisxAuthModal").classList.add("open");
  }

  function closeAuthModal() {
    state.authReturnView = "home";
    qs("#irisxAuthModal").classList.remove("open");
  }

  function switchAuthMode(mode) {
    state.authMode = mode;
    renderAuthModal();
  }

  function renderAuthModal() {
    const modal = qs("#irisxAuthModal");
    if (!modal) {
      return;
    }

    const isLogin = state.authMode === "login";
    const googleSvg = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.87 7.34 2.44 10.52l8.09-5.93z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
    const googleBtnText = curLang === "it" ? "Continua con Google" : "Continue with Google";
    const orText = curLang === "it" ? "oppure" : "or";

    modal.innerHTML =
      "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card\"><div class=\"irisx-card-head\"><div><div class=\"irisx-title\">" +
      t(isLogin ? "auth_title_login" : "auth_title_register") +
      "</div><div class=\"irisx-subtitle\">" +
      t(isLogin ? "auth_sub_login" : "auth_sub_register") +
      "</div></div><button class=\"irisx-close\" onclick=\"closeAuthModal()\">✕</button></div><div class=\"irisx-card-body\">" +
      "<button class=\"irisx-google-btn\" onclick=\"signInWithGoogle()\">" + googleSvg + " " + googleBtnText + "</button>" +
      "<div class=\"irisx-divider\"><span>" + orText + "</span></div>" +
      "<div class=\"irisx-segment\"><button class=\"" +
      (isLogin ? "on" : "") +
      "\" onclick=\"switchAuthMode('login')\">" +
      t("login") +
      "</button><button class=\"" +
      (!isLogin ? "on" : "") +
      "\" onclick=\"switchAuthMode('register')\">" +
      t("register") +
      "</button></div><div class=\"irisx-form-grid\"><div class=\"irisx-field" +
      (isLogin ? " irisx-hidden" : "") +
      "\"><label for=\"irisxAuthName\">" +
      t("full_name") +
      "</label><input id=\"irisxAuthName\" type=\"text\" autocomplete=\"name\"></div><div class=\"irisx-field\"><label for=\"irisxAuthEmail\">" +
      t("email") +
      "</label><input id=\"irisxAuthEmail\" type=\"email\" autocomplete=\"email\"></div><div class=\"irisx-field\"><label for=\"irisxAuthPassword\">" +
      t("password") +
      "</label><input id=\"irisxAuthPassword\" type=\"password\" autocomplete=\"" +
      (isLogin ? "current-password" : "new-password") +
      "\"></div></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"submitAuth()\">" +
      t(isLogin ? "auth_cta_login" : "auth_cta_register") +
      "</button></div><div class=\"irisx-auth-switch\">" +
      t(isLogin ? "auth_switch_register" : "auth_switch_login") +
      " <button onclick=\"switchAuthMode('" +
      (isLogin ? "register" : "login") +
      "')\">" +
      t(isLogin ? "register" : "login") +
      "</button></div><div class=\"irisx-status irisx-hidden\" id=\"irisxAuthStatus\"></div></div></div>";
  }

  function signInWithGoogle() {
    // Check if Firebase is configured
    if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0) {
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).then(function(result) {
        var u = result.user;
        state.currentUser = {
          id: u.uid,
          name: u.displayName || "Utente Google",
          email: u.email,
          role: deriveUserRole(u.email),
          city: "",
          country: "Italia",
          bio: "",
          memberSince: new Date().toISOString().slice(0, 10),
          avatar: u.photoURL || ""
        };
        if (!state.users.some(function (user) { return normalizeEmail(user.email) === normalizeEmail(u.email); })) {
          state.users.push(Object.assign({}, state.currentUser, { password: "" }));
          saveJson(STORAGE_KEYS.users, state.users);
          notifyNewUser(state.currentUser);
        }
        saveJson(STORAGE_KEYS.session, state.currentUser);
        syncCurrentUserSeller();
        syncSessionUi();
        renderProfilePanel();
        renderNotifications();
        renderOpsView();
        closeAuthModal();
        showToast(t("login_success"));
        showPage("buy");
        showBuyView("home");
      }).catch(function(error) {
        var status = qs("#irisxAuthStatus");
        if (status) setInlineStatus(status, error.message, true);
      });
      return;
    }

    // Fallback: simulated Google sign-in for prototype
    var mockName = "Utente IRIS";
    var mockEmail = "utente@iris-marketplace.it";
    state.currentUser = {
      id: "google_" + Date.now(),
      name: mockName,
      email: mockEmail,
      role: deriveUserRole(mockEmail),
      city: "Milano",
      country: "Italia",
      bio: "",
      memberSince: new Date().toISOString().slice(0, 10),
      avatar: ""
    };
    // Save new user
    var existing = state.users.find(function(u) { return u.email === mockEmail; });
    if (!existing) {
      state.users.push(Object.assign({}, state.currentUser, { password: "" }));
      saveJson(STORAGE_KEYS.users, state.users);
      notifyNewUser(state.currentUser);
    }
    saveJson(STORAGE_KEYS.session, state.currentUser);
    syncCurrentUserSeller();
    syncSessionUi();
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
    closeAuthModal();
    showToast(curLang === "it" ? "Accesso con Google effettuato." : "Signed in with Google.");
    showPage("buy");
    showBuyView("home");
  }
  window.signInWithGoogle = signInWithGoogle;

  function submitAuth() {
    const isLogin = state.authMode === "login";
    const status = qs("#irisxAuthStatus");
    const nameField = qs("#irisxAuthName");
    const emailField = qs("#irisxAuthEmail");
    const passwordField = qs("#irisxAuthPassword");

    const name = nameField ? nameField.value.trim() : "";
    const email = emailField ? emailField.value.trim().toLowerCase() : "";
    const password = passwordField ? passwordField.value : "";

    if ((!isLogin && !name) || !email || !password) {
      setInlineStatus(status, curLang === "it" ? "Compila tutti i campi richiesti." : "Please fill in all required fields.", true);
      return;
    }

    if (isLogin) {
      const existingUser = state.users.find(function (user) {
        return user.email === email && user.password === password;
      });

      if (!existingUser) {
        setInlineStatus(status, curLang === "it" ? "Email o password non corretti." : "Incorrect email or password.", true);
        return;
      }

      state.currentUser = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role || deriveUserRole(existingUser.email),
        city: existingUser.city,
        country: existingUser.country,
        bio: existingUser.bio,
        memberSince: existingUser.memberSince,
        avatar: existingUser.avatar
      };
      saveJson(STORAGE_KEYS.session, state.currentUser);
      syncCurrentUserSeller();
      syncSessionUi();
      renderProfilePanel();
      renderNotifications();
      renderOpsView();
      const returnView = state.authReturnView;
      closeAuthModal();
      showToast(t("login_success"));
      if (state.pendingAction) {
        flushPendingAction();
        return;
      }
      if (returnView === "sell") {
        showPage("sell");
        return;
      }
      showPage("buy");
      showBuyView(returnView || "profile");
      return;
    }

    if (state.users.some(function (user) { return user.email === email; })) {
      setInlineStatus(status, curLang === "it" ? "Esiste gia' un account con questa email." : "An account with this email already exists.", true);
      return;
    }

    const newUser = {
      id: "user-" + Date.now(),
      name: name,
      email: email,
      role: deriveUserRole(email),
      password: password,
      city: curLang === "it" ? "Italia" : "Italy",
      country: curLang === "it" ? "Italia" : "Italy",
      bio: "",
      memberSince: String(new Date().getFullYear()),
      avatar: "👤"
    };

    state.users.push(newUser);
    saveJson(STORAGE_KEYS.users, state.users);
    state.currentUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      city: newUser.city,
      country: newUser.country,
      bio: newUser.bio,
      memberSince: newUser.memberSince,
      avatar: newUser.avatar
    };
    saveJson(STORAGE_KEYS.session, state.currentUser);
    syncCurrentUserSeller();
    syncSessionUi();
    renderProfilePanel();
    notifyNewUser(newUser);
    renderNotifications();
    renderOpsView();
    const returnView = state.authReturnView;
    closeAuthModal();
    showToast(t("register_success"));
    if (state.pendingAction) {
      flushPendingAction();
      return;
    }
    if (returnView === "sell") {
      showPage("sell");
      return;
    }
    showPage("buy");
    showBuyView(returnView || "profile");
  }

  function setInlineStatus(element, message, isError) {
    if (!element) {
      return;
    }
    element.classList.remove("irisx-hidden", "error");
    element.textContent = message;
    if (isError) {
      element.classList.add("error");
    }
  }

  function flushPendingAction() {
    if (!state.pendingAction) {
      return;
    }
    const callback = state.pendingAction;
    state.pendingAction = null;
    callback();
  }

  function logout() {
    state.currentUser = null;
    saveJson(STORAGE_KEYS.session, null);
    syncSessionUi();
    renderProfilePanel();
    renderOpsView();
    renderNotifications();
    showToast(t("logout_success"));
  }

  function syncSessionUi() {
    const authButton = qs("#authBtn");
    if (authButton) {
      authButton.textContent = state.currentUser ? t("logout") : t("login");
    }

    const opsButton = qs("#opsBtn");
    if (opsButton) {
      opsButton.style.display = isCurrentUserAdmin() ? "" : "none";
    }

    const profileButton = qs(".tn-profile") || qs(".tn-btn[data-nav-view=\"profile\"]") || qs(".tn-btn[onclick*=\"profile\"]");
    if (profileButton) {
      profileButton.setAttribute("aria-label", t("profile_nav"));
      profileButton.textContent = "👤 " + t("profile_nav");
    }
  }

  function requireAuth(callback) {
    if (state.currentUser) {
      callback();
      return;
    }

    state.pendingAction = callback;
    openAuthModal("register");
    showToast(t("sign_in_to_continue"));
  }

  function addToCart(productId) {
    const product = prods.find(function (candidate) {
      return candidate.id === productId;
    });

    if (!isProductPurchasable(product)) {
      showToast(langText("Questo articolo non e' piu' disponibile.", "This item is no longer available."));
      return;
    }

    const existing = state.cart.find(function (item) {
      return item.productId === productId;
    });

    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ productId: productId, qty: 1 });
    }

    persistCart();
    updateCartBadge();
    renderCartDrawer();
    showToast(t("cart_added"));
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(function (item) {
      return item.productId !== productId;
    });
    persistCart();
    updateCartBadge();
    renderCartDrawer();
  }

  function persistCart() {
    saveJson(STORAGE_KEYS.cart, state.cart);
  }

  function getCartDetails() {
    return state.cart
      .map(function (item) {
        const product = prods.find(function (candidate) {
          return candidate.id === item.productId;
        });
        if (!product) {
          return null;
        }
        return { product: product, qty: item.qty };
      })
      .filter(Boolean);
  }

  function getCartSubtotal(items) {
    return items.reduce(function (sum, entry) {
      return sum + entry.product.price * entry.qty;
    }, 0);
  }

  function updateCartBadge() {
    const badge = qs("#cart-badge");
    if (!badge) {
      return;
    }
    const count = state.cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);

    if (!count) {
      badge.style.display = "none";
      return;
    }

    badge.style.display = "flex";
    badge.textContent = count;
  }

  function openCart() {
    renderCartDrawer();
    qs("#irisxCartDrawer").classList.add("open");
  }

  function closeCart() {
    qs("#irisxCartDrawer").classList.remove("open");
  }

  function renderCartDrawer() {
    const drawer = qs("#irisxCartDrawer");
    if (!drawer) {
      return;
    }

    const items = getCartDetails();
    const subtotal = getCartSubtotal(items);
    const itemsHtml = items.length
      ? "<div class=\"irisx-cart-items\">" +
        items
          .map(function (entry) {
            const product = entry.product;
            const image = Array.isArray(product.images) && product.images[0];
            return (
              "<div class=\"irisx-cart-item\"><div class=\"irisx-cart-thumb\">" +
              (image ? "<img src=\"" + image + "\" alt=\"" + escapeHtml(product.name) + "\">" : "<div class=\"irisx-cart-emoji\">" + escapeHtml(product.emoji || "👜") + "</div>") +
              "</div><div class=\"irisx-cart-meta\"><div class=\"irisx-cart-brand\">" +
              escapeHtml(product.brand) +
              "</div><div class=\"irisx-cart-name\">" +
              escapeHtml(product.name) +
              "</div><div class=\"irisx-cart-subline\">" +
              t("qty") +
              ": " +
              entry.qty +
              "</div><div class=\"irisx-cart-price\">" +
              formatCurrency(product.price * entry.qty) +
              "</div><button class=\"irisx-cta-link\" onclick=\"removeFromCart(" +
              product.id +
              ")\">" +
              t("remove") +
              "</button></div></div>"
            );
          })
          .join("") +
        "</div><div class=\"irisx-cart-row\"><span>Subtotal</span><strong>" +
        formatCurrency(subtotal) +
        "</strong></div><div class=\"irisx-cart-row\"><span>" +
        t("shipping") +
        "</span><strong>" +
        formatCurrency(SHIPPING_COST) +
        "</strong></div><div class=\"irisx-cart-row total\"><span>" +
        t("cart_total") +
        "</span><strong>" +
        formatCurrency(subtotal + SHIPPING_COST) +
        "</strong></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"openCheckout('cart')\">" +
        t("checkout") +
        "</button><button class=\"irisx-secondary\" onclick=\"closeCart()\">" +
        t("continue_shopping") +
        "</button></div>"
      : "<div class=\"irisx-empty-state\">" + t("empty_cart") + "</div>";

    drawer.innerHTML =
      "<div class=\"irisx-drawer-backdrop\"></div><div class=\"irisx-drawer-panel\"><div class=\"irisx-drawer-head\"><div><div class=\"irisx-kicker\">" +
      t("prototype_mode") +
      "</div><div class=\"irisx-title\">" +
      t("cart") +
      "</div><div class=\"irisx-subtitle\">" +
      items.length +
      " " +
      t("cart_items") +
      "</div></div><button class=\"irisx-close\" onclick=\"closeCart()\">✕</button></div><div class=\"irisx-drawer-body\">" +
      itemsHtml +
      "</div></div>";
  }

  function buyNow(productId) {
    requireAuth(function () {
      openCheckout("buyNow", productId);
    });
  }

  function openCheckout(source, productId) {
    if (!state.currentUser) {
      requireAuth(function () {
        openCheckout(source, productId);
      });
      return;
    }

    state.checkoutSource = source || "cart";
    if (state.checkoutSource === "buyNow") {
      const product = prods.find(function (candidate) {
        return candidate.id === productId;
      });
      state.checkoutItems = product ? [{ product: product, qty: 1 }] : [];
    } else {
      state.checkoutItems = getCartDetails();
      closeCart();
    }

    if (!state.checkoutItems.length) {
      showToast(t("empty_cart"));
      return;
    }

    if (state.checkoutItems.some(function (entry) { return !isProductPurchasable(entry.product); })) {
      showToast(langText("Uno o piu' articoli non sono piu' acquistabili.", "One or more items are no longer available."));
      state.checkoutItems = state.checkoutItems.filter(function (entry) { return isProductPurchasable(entry.product); });
      return;
    }

    renderCheckoutModal();
    qs("#irisxCheckoutModal").classList.add("open");
  }

  function closeCheckout() {
    qs("#irisxCheckoutModal").classList.remove("open");
  }

  function renderCheckoutModal() {
    const modal = qs("#irisxCheckoutModal");
    if (!modal) {
      return;
    }

    const items = state.checkoutItems;
    const subtotal = getCartSubtotal(items);
    const total = subtotal + SHIPPING_COST;
    const user = state.currentUser || {};

    const summaryHtml = items
      .map(function (entry) {
        return (
          "<div class=\"irisx-summary-item\"><span><strong>" +
          escapeHtml(entry.product.name) +
          "</strong><br>" +
          escapeHtml(entry.product.brand) +
          " · " +
          t("qty") +
          ": " +
          entry.qty +
          "</span><span>" +
          formatCurrency(entry.product.price * entry.qty) +
          "</span></div>"
        );
      })
      .join("");

    modal.innerHTML =
      "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card\"><div class=\"irisx-card-head\"><div><div class=\"irisx-kicker\">" +
      t("prototype_mode") +
      "</div><div class=\"irisx-title\">" +
      t("checkout_title") +
      "</div><div class=\"irisx-subtitle\">" +
      t("checkout_sub") +
      "</div></div><button class=\"irisx-close\" onclick=\"closeCheckout()\">✕</button></div><div class=\"irisx-card-body\"><div class=\"irisx-checkout-grid\"><div class=\"irisx-form-grid\"><div class=\"irisx-field\"><label for=\"checkoutName\">" +
      t("shipping_name") +
      "</label><input id=\"checkoutName\" type=\"text\" value=\"" +
      escapeHtml(user.name || "") +
      "\"></div><div class=\"irisx-field\"><label for=\"checkoutAddress\">" +
      t("shipping_address") +
      "</label><input id=\"checkoutAddress\" type=\"text\" value=\"" +
      escapeHtml(user.address || "") +
      "\"></div><div class=\"irisx-field\"><label for=\"checkoutCity\">" +
      t("shipping_city") +
      "</label><input id=\"checkoutCity\" type=\"text\" value=\"" +
      escapeHtml(user.city || "") +
      "\"></div><div class=\"irisx-field\"><label for=\"checkoutCountry\">" +
      t("shipping_country") +
      "</label><input id=\"checkoutCountry\" type=\"text\" value=\"" +
      escapeHtml(user.country || (curLang === "it" ? "Italia" : "Italy")) +
      "\"></div><div class=\"irisx-field\"><label for=\"checkoutNote\">" +
      t("shipping_note") +
      "</label><textarea id=\"checkoutNote\"></textarea></div></div><div class=\"irisx-checkout-summary\"><div class=\"irisx-kicker\">" +
      t("order_summary") +
      "</div><div class=\"irisx-summary-items\">" +
      summaryHtml +
      "</div><div class=\"irisx-checkout-row\"><span>Subtotal</span><strong>" +
      formatCurrency(subtotal) +
      "</strong></div><div class=\"irisx-checkout-row\"><span>" +
      t("shipping") +
      "</span><strong>" +
      formatCurrency(SHIPPING_COST) +
      "</strong></div><div class=\"irisx-checkout-row total\"><span>" +
      t("cart_total") +
      "</span><strong>" +
      formatCurrency(total) +
      "</strong></div></div><div class=\"irisx-note\">" +
      t("manual_payment_note") +
      "</div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"submitCheckout()\">" +
      t("confirm_order") +
      "</button><button class=\"irisx-secondary\" onclick=\"closeCheckout()\">" +
      t("cancel") +
      "</button></div></div></div></div>";
  }

  function submitCheckout() {
    const name = qs("#checkoutName").value.trim();
    const address = qs("#checkoutAddress").value.trim();
    const city = qs("#checkoutCity").value.trim();
    const country = qs("#checkoutCountry").value.trim();
    const note = qs("#checkoutNote").value.trim();

    if (!name || !address || !city || !country) {
      showToast(curLang === "it" ? "Inserisci tutti i dati di spedizione." : "Please complete all shipping fields.");
      return;
    }

    state.currentUser = Object.assign({}, state.currentUser, {
      name: name,
      address: address,
      city: city,
      country: country
    });
    saveJson(STORAGE_KEYS.session, state.currentUser);

    state.users = state.users.map(function (user) {
      if (normalizeEmail(user.email) !== normalizeEmail(state.currentUser.email)) {
        return user;
      }

      return Object.assign({}, user, {
        name: name,
        city: city,
        country: country,
        address: address
      });
    });
    saveJson(STORAGE_KEYS.users, state.users);

    const order = createOrderFromCheckout(state.checkoutItems, {
      name: name,
      address: address,
      city: city,
      country: country,
      note: note
    });

    if (order.items.some(function (item) {
      const product = prods.find(function (candidate) { return candidate.id === item.productId; });
      return !isProductPurchasable(product);
    })) {
      showToast(langText("Uno o piu' articoli non sono piu' disponibili.", "One or more items are no longer available."));
      closeCheckout();
      render();
      return;
    }

    state.orders.unshift(order);
    notifyNewOrder(order);
    persistOrders();
    syncInventoryFromOrders();

    if (state.checkoutSource === "cart") {
      state.cart = [];
      persistCart();
      updateCartBadge();
    }

    renderCartDrawer();
    renderProfilePanel();
    renderOpsView();
    renderNotifications();
    syncSessionUi();
    closeCheckout();
    showToast(t("checkout_success"));
  }

  async function handleSellPhotosSelected(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const selected = files.slice(0, 8);
    const processed = [];
    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        continue;
      }
      try {
        const imageData = await resizeImage(file, 1200, 0.78);
        processed.push({
          id: "photo-" + Math.random().toString(36).slice(2, 8),
          name: file.name,
          src: imageData
        });
      } catch (error) {
        continue;
      }
    }

    state.sellPhotos = processed;
    renderSellPhotoPreview();
    updateSellStatus(processed.length ? t("sell_status_ready") : t("sell_status_idle"));
  }

  function renderSellPhotoPreview() {
    const grid = qs("#sellPreviewGrid");
    if (!grid) {
      return;
    }

    if (!state.sellPhotos.length) {
      grid.innerHTML = "";
      updateSellStatus(t("sell_status_idle"));
      return;
    }

    grid.innerHTML = state.sellPhotos
      .map(function (photo, index) {
        return (
          "<div class=\"irisx-photo-card\"><img class=\"irisx-photo-thumb\" src=\"" +
          photo.src +
          "\" alt=\"" +
          escapeHtml(photo.name) +
          "\"><div class=\"irisx-photo-meta\"><span>" +
          (index === 0 ? "Cover" : "#" + (index + 1)) +
          "</span><button class=\"irisx-photo-remove\" onclick=\"removeSellPhoto(" +
          index +
          ")\">" +
          t("remove") +
          "</button></div></div>"
        );
      })
      .join("");
  }

  function removeSellPhoto(index) {
    state.sellPhotos.splice(index, 1);
    renderSellPhotoPreview();
  }

  function updateSellStatus(message, isError) {
    const status = qs("#sellStatus");
    if (!status) {
      return;
    }
    status.textContent = message;
    status.classList.toggle("error", Boolean(isError));
  }

  function publishListing() {
    const category = readSellField("#sf-cat");
    const brand = readSellField("#sf-brand");
    const name = readSellField("#sf-name");
    const size = readSellField("#sf-size");
    const color = readSellField("#sf-color");
    const fit = readSellField("#sf-fit") || "Regular";
    const material = readSellField("#sf-material");
    const dimensions = readSellField("#sf-dims");
    const description = readSellField("#sf-desc");
    const price = Number(readSellField("#sf-price"));
    const selectedCondition = qs(".cond-btn.sel");
    const condition = selectedCondition ? selectedCondition.textContent.trim() : "";

    if (!category || !brand || !name || !condition || !description || !price || !state.sellPhotos.length) {
      updateSellStatus(t("publish_error"), true);
      return;
    }

    const seller = getCurrentUserSeller();
    if (!seller) {
      updateSellStatus(t("sell_status_auth"), true);
      return;
    }

    syncCurrentUserSeller();

    const listing = {
      id: Date.now(),
      ownerEmail: state.currentUser.email,
      name: name,
      brand: brand,
      cat: category,
      sz: size || "One size",
      cond: condition,
      fit: fit || "Regular",
      dims: dimensions || "N/A",
      price: price,
      orig: Math.round(price * 1.35),
      color: color || (curLang === "it" ? "Non indicato" : "Not specified"),
      material: material || (curLang === "it" ? "Non indicato" : "Not specified"),
      emoji: "👜",
      desc: description,
      chips: [condition, material || "Material", category].filter(Boolean),
      seller: seller,
      date: Date.now(),
      images: state.sellPhotos.map(function (photo) { return photo.src; }),
      isUserListing: true,
      inventoryStatus: "active",
      listingStatus: "published",
      orderId: null,
      soldAt: null
    };

    state.listings.unshift(listing);
    saveJson(STORAGE_KEYS.listings, state.listings);
    prods.unshift(listing);
    notifyNewListing(listing);
    render();
    renderProfilePanel();
    renderOpsView();
    renderNotifications();
    showToast(t("publish_success"));
    resetSellForm();
    updateSellStatus(t("publish_success"));
    showPage("buy");
    showBuyView("profile");
  }

  function readSellField(selector) {
    const field = qs(selector);
    return field ? field.value.trim() : "";
  }

  function resetSellForm() {
    const form = qs(".sell-form");
    if (!form) {
      return;
    }
    qsa("input, textarea, select", form).forEach(function (field) {
      if (field.type === "file") {
        field.value = "";
      } else {
        field.value = "";
      }
    });
    qsa(".cond-btn.sel", form).forEach(function (button) {
      button.classList.remove("sel");
    });
    state.sellPhotos = [];
    renderSellPhotoPreview();
    updateFee();
  }

  function renderOrderTimeline(order) {
    if (!Array.isArray(order.timeline) || !order.timeline.length) {
      return "";
    }

    return "<div class=\"irisx-order-timeline\">" +
      order.timeline
        .slice(0, 4)
        .map(function (event) {
          return "<div class=\"irisx-order-event\"><strong>" + escapeHtml(event.label) + "</strong><span>" + escapeHtml(formatDateTime(event.at)) + "</span></div>";
        })
        .join("") +
      "</div>";
  }

  function renderBuyerOrdersMarkup(orders) {
    if (!orders.length) {
      return "<div class=\"irisx-empty-state\">" + t("no_orders_yet") + "</div>";
    }

    return "<div class=\"irisx-order-list\">" +
      orders
        .map(function (order) {
          const actions = [];
          if (order.status === "shipped") {
            actions.push("<button class=\"irisx-secondary\" onclick=\"confirmOrderDelivered('" + order.id + "')\">" + langText("Conferma consegna", "Confirm delivery") + "</button>");
          }
          actions.push("<button class=\"irisx-secondary\" onclick=\"openSupportModal('" + order.id + "')\">" + langText("Supporto", "Support") + "</button>");
          if (order.status === "delivered" && order.reviewStatus !== "submitted") {
            actions.push("<button class=\"irisx-secondary\" onclick=\"openReviewModal('" + order.id + "')\">" + langText("Lascia recensione", "Leave review") + "</button>");
          }

          return "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" +
            escapeHtml(order.number) +
            "</strong><span>" +
            escapeHtml(getOrderStatusLabel(order)) +
            "</span></div><div class=\"irisx-order-items\"><div>" +
            escapeHtml(order.items.map(function (item) { return item.brand + " " + item.name; }).join(", ")) +
            "</div><div>" +
            escapeHtml(order.shipping.method) +
            (order.shipping.trackingNumber ? " - " + escapeHtml(order.shipping.trackingNumber) : "") +
            "</div><div>" +
            escapeHtml(formatCurrency(order.total)) +
            " - " +
            escapeHtml(formatDateTime(order.createdAt)) +
            "</div></div>" +
            renderOrderTimeline(order) +
            (actions.length ? "<div class=\"irisx-actions\">" + actions.join("") + "</div>" : "") +
            "</div>";
        })
        .join("") +
      "</div>";
  }

  function renderSellerOrdersMarkup(orders) {
    if (!orders.length) {
      return "<div class=\"irisx-empty-state\">" + langText("Nessun ordine seller ancora.", "No seller orders yet.") + "</div>";
    }

    return "<div class=\"irisx-order-list\">" +
      orders
        .map(function (order) {
          const sellerItems = order.items.filter(function (item) {
            return normalizeEmail(item.sellerEmail) === normalizeEmail(state.currentUser.email);
          });
          const actions = [];
          if (order.status === "paid") {
            actions.push("<button class=\"irisx-secondary\" onclick=\"openShipmentModal('" + order.id + "')\">" + langText("Segna spedito", "Mark shipped") + "</button>");
          }
          if (order.status === "shipped") {
            actions.push("<button class=\"irisx-secondary\" disabled>" + langText("In transito", "In transit") + "</button>");
          }

          return "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" +
            escapeHtml(order.number) +
            "</strong><span>" +
            escapeHtml(getOrderStatusLabel(order)) +
            "</span></div><div class=\"irisx-order-items\"><div>" +
            escapeHtml(langText("Buyer", "Buyer")) +
            ": " +
            escapeHtml(order.buyerEmail) +
            "</div><div>" +
            escapeHtml(sellerItems.map(function (item) { return item.brand + " " + item.name; }).join(", ")) +
            "</div><div>" +
            escapeHtml(order.shipping.address + ", " + order.shipping.city + ", " + order.shipping.country) +
            "</div></div>" +
            renderOrderTimeline(order) +
            (actions.length ? "<div class=\"irisx-actions\">" + actions.join("") + "</div>" : "") +
            "</div>";
        })
        .join("") +
      "</div>";
  }

  function renderSupportTicketsMarkup(tickets) {
    if (!tickets.length) {
      return "<div class=\"irisx-empty-state\">" + langText("Nessun ticket aperto.", "No open tickets.") + "</div>";
    }

    return "<div class=\"irisx-order-list\">" +
      tickets
        .map(function (ticket) {
          return "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" +
            escapeHtml(ticket.orderNumber || ticket.orderId) +
            "</strong><span>" +
            escapeHtml(ticket.status) +
            "</span></div><div class=\"irisx-order-items\"><div>" +
            escapeHtml(ticket.reason) +
            "</div><div>" +
            escapeHtml(ticket.message) +
            "</div><div>" +
            escapeHtml(formatDateTime(ticket.createdAt)) +
            "</div></div></div>";
        })
        .join("") +
      "</div>";
  }

  function renderProfilePanel() {
    const container = qs("#profile-view .container");
    if (!container) {
      return;
    }

    const favoritesItems = prods.filter(function (product) {
      return favorites.has(product.id);
    });

    if (!state.currentUser) {
      container.innerHTML =
        "<div class=\"prof-header\"><div class=\"prof-av\">👤</div><div class=\"prof-info\"><div class=\"prof-name\">" +
        t("profile_guest_title") +
        "</div><div class=\"prof-bio\">" +
        t("profile_guest_body") +
        "</div></div></div><div class=\"irisx-account-grid\"><section class=\"irisx-account-card\"><h3>" +
        t("account_area") +
        "</h3><p>" +
        t("profile_guest_body") +
        "</p><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"openAuthModal('register')\">" +
        t("register") +
        "</button><button class=\"irisx-secondary\" onclick=\"openAuthModal('login')\">" +
        t("login") +
        "</button></div></section><section class=\"irisx-account-card\"><h3>" +
        t("account_summary") +
        "</h3><div class=\"irisx-account-stats\"><div class=\"irisx-account-stat\"><strong>0</strong><span>" +
        t("my_listings") +
        "</span></div><div class=\"irisx-account-stat\"><strong>0</strong><span>" +
        t("my_orders") +
        "</span></div><div class=\"irisx-account-stat\"><strong>" +
        favoritesItems.length +
        "</strong><span>" +
        t("favorites_section") +
        "</span></div><div class=\"irisx-account-stat\"><strong>" +
        state.cart.reduce(function (sum, item) { return sum + item.qty; }, 0) +
        "</strong><span>" +
        t("cart") +
        "</span></div></div></section></div>";
      return;
    }

    const listings = getMyListings();
    const orders = getBuyerOrders();
    const sellerOrders = getSellerOrdersForCurrentUser();
    const tickets = getTicketsForCurrentUser();
    const bio = state.currentUser.bio || "";

    const listingsHtml = listings.length
      ? "<div class=\"pgrid\">" + listings.map(function (listing) { return productCardMarkup(listing); }).join("") + "</div>"
      : "<div class=\"irisx-empty-state\">" + t("not_selling") + "</div>";
    const ordersHtml = renderBuyerOrdersMarkup(orders);
    const sellerOrdersHtml = renderSellerOrdersMarkup(sellerOrders);
    const ticketsHtml = renderSupportTicketsMarkup(tickets);

    const favoritesHtml = favoritesItems.length
      ? "<div class=\"irisx-favorites-grid\">" + favoritesItems.map(function (item) { return productCardMarkup(item); }).join("") + "</div>"
      : "<div class=\"irisx-empty-state\">" + t("no_favorites_yet") + "</div>";

    container.innerHTML =
      "<div class=\"prof-header\"><div class=\"prof-av\">" +
      escapeHtml(state.currentUser.avatar || "👤") +
      "</div><div class=\"prof-info\"><div class=\"prof-name\">" +
      escapeHtml(state.currentUser.name) +
      "</div><div class=\"prof-bio\">" +
      escapeHtml(state.currentUser.email) +
      " · " +
      (curLang === "it" ? "Membro dal " : "Member since ") +
      escapeHtml(state.currentUser.memberSince) +
      "</div><div class=\"prof-stats\"><div class=\"prof-stat\"><div class=\"prof-stat-n\">" +
      listings.length +
      "</div><div class=\"prof-stat-l\">" +
      t("my_listings") +
      "</div></div><div class=\"prof-stat\"><div class=\"prof-stat-n\">" +
      orders.length +
      "</div><div class=\"prof-stat-l\">" +
      t("my_orders") +
      "</div></div><div class=\"prof-stat\"><div class=\"prof-stat-n\">" +
      favoritesItems.length +
      "</div><div class=\"prof-stat-l\">" +
      t("favorites_section") +
      "</div></div></div></div><div class=\"irisx-inline-actions\"><button class=\"irisx-secondary\" onclick=\"showPage('sell')\">" +
      t("sell") +
      "</button><button class=\"irisx-danger\" onclick=\"logout()\">" +
      t("logout") +
      "</button>" +
      (isCurrentUserAdmin() ? "<button class=\"irisx-secondary\" onclick=\"showBuyView('ops')\">Ops</button>" : "") +
      "</div></div><div class=\"irisx-account-grid\"><section class=\"irisx-account-card\"><h3>" +
      t("profile_details") +
      "</h3><p>" +
      (curLang === "it" ? "Qui puoi aggiornare le informazioni del tuo account." : "Update your account details here.") +
      "</p><div class=\"irisx-account-form\"><div class=\"irisx-account-row\"><div class=\"irisx-field\"><label for=\"profileNameInput\">" +
      t("full_name") +
      "</label><input id=\"profileNameInput\" type=\"text\" value=\"" +
      escapeHtml(state.currentUser.name || "") +
      "\"></div><div class=\"irisx-field\"><label for=\"profileEmailInput\">" +
      t("email") +
      "</label><input id=\"profileEmailInput\" type=\"text\" value=\"" +
      escapeHtml(state.currentUser.email || "") +
      "\" readonly></div></div><div class=\"irisx-account-row\"><div class=\"irisx-field\"><label for=\"profileCityInput\">" +
      t("profile_city") +
      "</label><input id=\"profileCityInput\" type=\"text\" value=\"" +
      escapeHtml(state.currentUser.city || "") +
      "\"></div><div class=\"irisx-field\"><label for=\"profileCountryInput\">" +
      t("profile_country") +
      "</label><input id=\"profileCountryInput\" type=\"text\" value=\"" +
      escapeHtml(state.currentUser.country || (curLang === "it" ? "Italia" : "Italy")) +
      "\"></div></div><div class=\"irisx-field\"><label for=\"profileBioInput\">" +
      t("profile_bio") +
      "</label><textarea id=\"profileBioInput\">" +
      escapeHtml(bio) +
      "</textarea></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"saveProfileDetails()\">" +
      t("save_profile") +
      "</button></div></div></section><section class=\"irisx-account-card\"><h3>" +
      t("account_summary") +
      "</h3><div class=\"irisx-account-stats\"><div class=\"irisx-account-stat\"><strong>" +
      listings.length +
      "</strong><span>" +
      t("my_listings") +
      "</span></div><div class=\"irisx-account-stat\"><strong>" +
      orders.length +
      "</strong><span>" +
      t("my_orders") +
      "</span></div><div class=\"irisx-account-stat\"><strong>" +
      favoritesItems.length +
      "</strong><span>" +
      t("favorites_section") +
      "</span></div><div class=\"irisx-account-stat\"><strong>" +
      state.cart.reduce(function (sum, item) { return sum + item.qty; }, 0) +
      "</strong><span>" +
      t("cart") +
      "</span></div></div><p style=\"margin-top:1rem\">" +
      (curLang === "it" ? "Usa questa area per tenere insieme account, vendite e cronologia ordini." : "Use this area to keep account details, sales and order history together.") +
      "</p></section></div><div class=\"irisx-profile-section\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">" +
      t("my_listings") +
      "</div></div>" +
      listingsHtml +
      "</div><div class=\"irisx-profile-section\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">" +
      langText("Ordini buyer", "Buyer orders") +
      "</div></div>" +
      ordersHtml +
      "</div><div class=\"irisx-profile-section\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">" +
      langText("Seller workflow", "Seller workflow") +
      "</div></div>" +
      sellerOrdersHtml +
      "</div><div class=\"irisx-profile-section\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">" +
      langText("Supporto / dispute", "Support / disputes") +
      "</div></div>" +
      ticketsHtml +
      "</div><div class=\"irisx-profile-section\"><div class=\"irisx-profile-head\"><div class=\"irisx-profile-title\">" +
      t("favorites_section") +
      "</div></div>" +
      favoritesHtml +
      "</div>";
  }

  function saveProfileDetails() {
    if (!state.currentUser) {
      openAuthModal("login");
      return;
    }

    const nextName = readProfileField("#profileNameInput");
    const nextCity = readProfileField("#profileCityInput");
    const nextCountry = readProfileField("#profileCountryInput");
    const nextBio = readProfileField("#profileBioInput");

    if (!nextName) {
      showToast(curLang === "it" ? "Inserisci almeno il nome del profilo." : "Please enter at least your profile name.");
      return;
    }

    state.currentUser = Object.assign({}, state.currentUser, {
      name: nextName,
      city: nextCity || (curLang === "it" ? "Italia" : "Italy"),
      country: nextCountry || (curLang === "it" ? "Italia" : "Italy"),
      bio: nextBio
    });
    saveJson(STORAGE_KEYS.session, state.currentUser);

    state.users = state.users.map(function (user) {
      if (user.email !== state.currentUser.email) {
        return user;
      }
      return Object.assign({}, user, {
        name: state.currentUser.name,
        city: state.currentUser.city,
        country: state.currentUser.country,
        bio: state.currentUser.bio
      });
    });
    saveJson(STORAGE_KEYS.users, state.users);

    const updatedSeller = getCurrentUserSeller();
    state.listings = state.listings.map(function (listing) {
      if (listing.ownerEmail !== state.currentUser.email) {
        return listing;
      }
      return Object.assign({}, listing, { seller: updatedSeller });
    });
    saveJson(STORAGE_KEYS.listings, state.listings);

    for (let index = 0; index < prods.length; index += 1) {
      const product = prods[index];
      if (!product.ownerEmail || product.ownerEmail !== state.currentUser.email) {
        continue;
      }
      prods[index] = Object.assign({}, product, { seller: updatedSeller });
    }

    syncCurrentUserSeller();
    syncSessionUi();
    render();
    renderProfilePanel();
    renderOpsView();
    showToast(t("profile_saved"));
  }

  function readProfileField(selector) {
    const field = qs(selector);
    return field ? field.value.trim() : "";
  }

  function resizeImage(file, maxSize, quality) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function (event) {
        const originalDataUrl = event.target.result;
        const image = new Image();
        image.onerror = function () {
          resolve(originalDataUrl);
        };
        image.onload = function () {
          const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));
          const context = canvas.getContext("2d");
          if (!context) {
            resolve(originalDataUrl);
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          try {
            resolve(canvas.toDataURL("image/jpeg", quality));
          } catch (error) {
            resolve(originalDataUrl);
          }
        };
        image.src = originalDataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  function showToast(message) {
    const stack = qs("#irisxToastStack");
    if (!stack) {
      return;
    }
    const toast = document.createElement("div");
    toast.className = "irisx-toast";
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 3200);
  }
})();
