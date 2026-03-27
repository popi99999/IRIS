(function () {
  const STORAGE_KEYS = {
    users: "iris-users",
    session: "iris-user-session",
    cart: "iris-cart",
    listings: "iris-local-listings",
    orders: "iris-orders",
    favorites: "iris-favorites"
  };

  const SHIPPING_COST = 25;
  const state = {
    users: loadJson(STORAGE_KEYS.users, []),
    currentUser: loadJson(STORAGE_KEYS.session, null),
    cart: loadJson(STORAGE_KEYS.cart, []),
    listings: loadJson(STORAGE_KEYS.listings, []),
    orders: loadJson(STORAGE_KEYS.orders, []),
    pendingAction: null,
    authMode: "login",
    authReturnView: "home",
    checkoutItems: [],
    checkoutSource: "cart",
    sellPhotos: [],
    activeDetailImage: 0,
    lastNonDetailView: "home"
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
  hydrateLocalListings();
  syncCurrentUserSeller();
  overrideMarketplaceFunctions();
  bindStaticEnhancements();
  initializeSimplifiedShell();
  syncSessionUi();
  updateCartBadge();
  updateFavBadge();
  renderProfilePanel();
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatCurrency(value) {
    return "€" + Number(value || 0).toLocaleString(curLang === "it" ? "it-IT" : "en-US");
  }

  function getAvailableBrands() {
    return [...new Set(prods.map((product) => product.brand))].sort();
  }

  function getAvailableCategories() {
    return [...new Set(prods.map((product) => product.cat))].sort();
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
      prototype_mode: "Modalita' prototipo avanzata"
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
      prototype_mode: "Advanced prototype mode"
    });
  }

  function getHomeCopy() {
    if (curLang === "it") {
      return {
        kicker: "IRIS — Moda d'Autore",
        title: "Il lusso autentico.\nFinalmente accessibile.",
        text: "Ogni articolo certificato dalla nostra équipe di esperti. Hermès, Chanel, Louis Vuitton — autenticati pezzo per pezzo, consegnati a casa tua.",
        primaryCta: "Scopri la collezione",
        secondaryCta: "Vendi con IRIS",
        featuredTitle: "Pezzi da Collezione",
        featuredNote: "Una selezione esclusiva dei pezzi più ricercati.",
        buyTitle: "Acquista con fiducia",
        buyText: "Una selezione rigorosa di pezzi autenticati dalle Maison più ambite. Ogni articolo ispezionato dalla nostra équipe prima della vendita.",
        buyPoints: ["100% Autenticato", "Spedizione assicurata", "Reso in 14 giorni"],
        sellTitle: "Vendi con eleganza",
        sellText: "Carica le foto, imposta il prezzo. Il resto lo facciamo noi — autenticazione, comunicazione, spedizione sicura.",
        sellPoints: ["Autenticazione inclusa", "Massima visibilità", "Pagamento garantito"],
        sideCards: [
          { title: "Autenticazione IRIS", text: "Ogni articolo esaminato da esperti certificati. Nessun compromesso sulla qualità.", tag: "GARANZIA" },
          { title: "Maison d'Eccellenza", text: "Hermès, Chanel, Balenciaga — solo pezzi selezionati con rigore editoriale.", tag: "SELEZIONE" },
          { title: "Consegna Premium", text: "Imballaggio di lusso, spedizione assicurata, reso garantito in 14 giorni.", tag: "AFFIDABILE" }
        ],
        strip: [
          { value: "100%", label: "Autenticato" },
          { value: "−40%", label: "vs retail" },
          { value: "48h", label: "Spedizione" }
        ]
      };
    }

    return {
      kicker: "IRIS — Curated Luxury",
      title: "Authentic luxury.\nFinally accessible.",
      text: "Every piece certified by our team of experts. Hermès, Chanel, Louis Vuitton — authenticated one by one, delivered to your door.",
      primaryCta: "Browse the collection",
      secondaryCta: "Sell with IRIS",
      featuredTitle: "Collector's Pieces",
      featuredNote: "A curated selection of the most sought-after pieces.",
      buyTitle: "Shop with confidence",
      buyText: "A rigorous selection of authenticated pieces from the finest Maisons. Every item inspected by our team before sale.",
      buyPoints: ["100% Authenticated", "Insured shipping", "14-day returns"],
      sellTitle: "Sell with elegance",
      sellText: "Upload your photos, set your price. We handle the rest — authentication, communication, insured shipping.",
      sellPoints: ["Authentication included", "Maximum visibility", "Guaranteed payment"],
      sideCards: [
        { title: "IRIS Authentication", text: "Every item examined by certified experts. No compromises on quality.", tag: "GUARANTEE" },
        { title: "Houses of Excellence", text: "Hermès, Chanel, Balenciaga — only editorially selected pieces.", tag: "CURATED" },
        { title: "Premium Delivery", text: "Luxury packaging, insured shipping, 14-day guaranteed returns.", tag: "TRUSTED" }
      ],
      strip: [
        { value: "100%", label: "Authenticated" },
        { value: "−40%", label: "vs retail" },
        { value: "48h", label: "Shipping" }
      ]
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
    const featured = prods.slice(0, 4);

    container.innerHTML =
      "<div class=\"irisx-home-shell\"><section class=\"irisx-home-hero\">" +
      "<div class=\"irisx-hero-lux\"><div class=\"irisx-hero-shine\"></div></div>" +
      "<div class=\"irisx-hero-grain\"></div>" +
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
      "</div></aside></section><section class=\"irisx-home-story\"><div class=\"irisx-home-section-head\"><div><div class=\"irisx-home-section-kicker\">IRIS edit</div><div class=\"irisx-home-section-title\">" +
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

    const activeView = ["home", "shop", "fav", "chat", "profile", "seller"].find(function (view) {
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

    qsa("#irisxAuthModal, #irisxCheckoutModal, #irisxCartDrawer").forEach((node) => {
      node.addEventListener("click", function (event) {
        if (event.target.classList.contains("irisx-modal-backdrop") || event.target.classList.contains("irisx-drawer-backdrop")) {
          closeAuthModal();
          closeCheckout();
          closeCart();
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

  function overrideMarketplaceFunctions() {
    const originalApplyLang = applyLang;
    applyLang = function () {
      originalApplyLang();
      const homeButton = qs(".tn-home");
      if (homeButton) {
        homeButton.textContent = t("home");
      }
      const backButton = qs("#tnBackBtn");
      if (backButton) {
        backButton.textContent = t("home");
      }
      syncSessionUi();
      renderHomeView();
      renderCartDrawer();
      renderCheckoutModal();
      renderProfilePanel();
      updateSellStatus(t("sell_status_idle"));
    };

    renderBrandFilters = function (query) {
      const brands = getAvailableBrands();
      const filtered = query ? brands.filter((brand) => brand.toLowerCase().includes(query.toLowerCase())) : brands;
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
      qs("#f-cats").innerHTML = getAvailableCategories()
        .map(
          (category) =>
            "<div class=\"f-opt\" onclick=\"toggleOpt(this,'cats','" +
            escapeHtml(category) +
            "')\"><div class=\"f-check\">✓</div>" +
            escapeHtml(category) +
            "</div>"
        )
        .join("");
      renderBrandFilters("");
      qs("#f-conds").innerHTML = allConds
        .map(
          (condition) =>
            "<div class=\"f-opt\" onclick=\"toggleOpt(this,'conds','" +
            escapeHtml(condition) +
            "')\"><div class=\"f-check\">✓</div>" +
            escapeHtml(condition) +
            "</div>"
        )
        .join("");
      qs("#f-fit").innerHTML = allFits
        .map(
          (fit) =>
            "<button class=\"f-fit-btn\" onclick=\"toggleFit(this,'" +
            escapeHtml(fit) +
            "')\">" +
            escapeHtml(fit) +
            "</button>"
        )
        .join("");
      qs("#f-colors").innerHTML = allColors
        .map(
          (color) =>
            "<div class=\"f-color\" onclick=\"toggleColor(this,'" +
            escapeHtml(color) +
            "')\" style=\"background:" +
            escapeHtml(colorMap[color]) +
            "\" title=\"" +
            escapeHtml(color) +
            "\"></div>"
        )
        .join("");
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
      const ids = ["home-view", "shop-view", "detail-view", "fav-view", "chat-view", "profile-view", "seller-view"];

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
      }
    };

    render = function () {
      const items = getFiltered();
      const grid = qs("#grid");
      const activeFilters = qs("#activeFilters");

      qs("#resultCount").textContent = items.length;

      const chips = [];
      filters.cats.forEach((value) => chips.push({ label: value, type: "cats", value: value }));
      filters.brands.forEach((value) => chips.push({ label: value, type: "brands", value: value }));
      filters.conds.forEach((value) => chips.push({ label: value, type: "conds", value: value }));
      filters.fits.forEach((value) => chips.push({ label: value, type: "fits", value: value }));
      filters.colors.forEach((value) => chips.push({ label: value, type: "colors", value: value }));

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
        escapeHtml(product.fit === "—" ? "N/A" : product.fit) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        t("color") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(product.color) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        (curLang === "it" ? "Dimensioni" : "Dimensions") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(product.dims) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        (curLang === "it" ? "Materiale" : "Material") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(product.material) +
        "</div></div><div class=\"det-fit-item\"><div class=\"det-fit-label\">" +
        t("condition") +
        "</div><div class=\"det-fit-value\">" +
        escapeHtml(product.cond) +
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
        "</button></div></div><div class=\"irisx-detail-actions\"><button class=\"det-buy\" onclick=\"buyNow(" +
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
        "</button></div><div class=\"det-auth\"><div class=\"det-auth-t\">" +
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
  }

  function productVisualMarkup(product, compact) {
    const hasImages = Array.isArray(product.images) && product.images.length > 0;
    const media = hasImages
      ? "<div class=\"pi\"><div class=\"pi-bg irisx-media\"><img class=\"irisx-card-image\" src=\"" +
        product.images[0] +
        "\" alt=\"" +
        escapeHtml(product.name) +
        "\"></div>" +
        (compact ? "" : "<div class=\"pi-tags\"><span class=\"pi-tag avail\">" + escapeHtml(product.cond) + "</span>" + (product.fit !== "—" ? "<span class=\"pi-tag fit\">" + escapeHtml(product.fit) + "</span>" : "") + "</div>") +
        "</div>"
      : "<div class=\"pi\"><div class=\"pi-bg\"><div class=\"pi-emoji\">" + escapeHtml(product.emoji || "👜") + "</div></div>" + (compact ? "" : "<div class=\"pi-tags\"><span class=\"pi-tag avail\">" + escapeHtml(product.cond) + "</span>" + (product.fit !== "—" ? "<span class=\"pi-tag fit\">" + escapeHtml(product.fit) + "</span>" : "") + "</div>") + "</div>";
    return media;
  }

  function productCardMarkup(product) {
    const discount = Math.round((1 - product.price / product.orig) * 100);
    const liked = favorites.has(product.id);
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
      escapeHtml(product.color) +
      " · " +
      escapeHtml(product.seller.name) +
      "</div><div class=\"p-footer\"><div><span class=\"p-price\">" +
      formatCurrency(product.price) +
      "</span><span class=\"p-orig\">" +
      formatCurrency(product.orig) +
      "</span></div><span class=\"p-disc\">-" +
      discount +
      "%</span></div></div></div>"
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
    modal.innerHTML =
      "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card\"><div class=\"irisx-card-head\"><div><div class=\"irisx-kicker\">" +
      t("prototype_mode") +
      "</div><div class=\"irisx-title\">" +
      t(isLogin ? "auth_title_login" : "auth_title_register") +
      "</div><div class=\"irisx-subtitle\">" +
      t(isLogin ? "auth_sub_login" : "auth_sub_register") +
      "</div></div><button class=\"irisx-close\" onclick=\"closeAuthModal()\">✕</button></div><div class=\"irisx-card-body\"><div class=\"irisx-segment\"><button class=\"" +
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
      "</button><button class=\"irisx-secondary\" onclick=\"closeAuthModal()\">" +
      t("cancel") +
      "</button></div><div class=\"irisx-auth-switch\">" +
      t(isLogin ? "auth_switch_register" : "auth_switch_login") +
      " <button onclick=\"switchAuthMode('" +
      (isLogin ? "register" : "login") +
      "')\">" +
      t(isLogin ? "register" : "login") +
      "</button></div><div class=\"irisx-status irisx-hidden\" id=\"irisxAuthStatus\"></div></div></div>";
  }

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
    showToast(t("logout_success"));
  }

  function syncSessionUi() {
    const authButton = qs("#authBtn");
    if (authButton) {
      authButton.textContent = state.currentUser ? t("logout") : t("login");
    }

    const profileButton = qs(".tn-btn[onclick*=\"profile\"]");
    if (profileButton) {
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

    const subtotal = getCartSubtotal(state.checkoutItems);
    const order = {
      id: "ord-" + Date.now(),
      buyerEmail: state.currentUser.email,
      items: state.checkoutItems.map(function (entry) {
        return {
          productId: entry.product.id,
          name: entry.product.name,
          brand: entry.product.brand,
          qty: entry.qty,
          price: entry.product.price
        };
      }),
      shipping: {
        name: name,
        address: address,
        city: city,
        country: country,
        note: note
      },
      status: "created",
      subtotal: subtotal,
      shippingCost: SHIPPING_COST,
      total: subtotal + SHIPPING_COST,
      createdAt: Date.now()
    };

    state.orders.unshift(order);
    saveJson(STORAGE_KEYS.orders, state.orders);

    if (state.checkoutSource === "cart") {
      state.cart = [];
      persistCart();
      updateCartBadge();
    }

    renderCartDrawer();
    renderProfilePanel();
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
      isUserListing: true
    };

    state.listings.unshift(listing);
    saveJson(STORAGE_KEYS.listings, state.listings);
    prods.unshift(listing);
    render();
    renderProfilePanel();
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
    const orders = getMyOrders();
    const bio = state.currentUser.bio || "";

    const listingsHtml = listings.length
      ? "<div class=\"pgrid\">" + listings.map(function (listing) { return productCardMarkup(listing); }).join("") + "</div>"
      : "<div class=\"irisx-empty-state\">" + t("not_selling") + "</div>";

    const ordersHtml = orders.length
      ? "<div class=\"irisx-order-list\">" +
        orders
          .map(function (order) {
            return (
              "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" +
              escapeHtml(order.id) +
              "</strong><span>" +
              new Date(order.createdAt).toLocaleDateString(curLang === "it" ? "it-IT" : "en-US") +
              " · " +
              formatCurrency(order.total) +
              "</span></div><div class=\"irisx-order-items\">" +
              order.items
                .map(function (item) {
                  return "<div>" + escapeHtml(item.brand) + " · " + escapeHtml(item.name) + " · " + t("qty") + ": " + item.qty + "</div>";
                })
                .join("") +
              "</div></div>"
            );
          })
          .join("") +
        "</div>"
      : "<div class=\"irisx-empty-state\">" + t("no_orders_yet") + "</div>";

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
      "</button></div></div><div class=\"irisx-account-grid\"><section class=\"irisx-account-card\"><h3>" +
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
      t("my_orders") +
      "</div></div>" +
      ordersHtml +
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
