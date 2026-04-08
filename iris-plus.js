(function () {
  const STORAGE_KEYS = {
    users: "iris-users",
    banRegistry: "iris-ban-registry",
    session: "iris-user-session",
    cart: "iris-cart",
    listings: "iris-local-listings",
    orders: "iris-orders",
    offers: "iris-offers",
    favorites: "iris-favorites",
    notifications: "iris-notifications",
    emailOutbox: "iris-email-outbox",
    supportTickets: "iris-support-tickets",
    measurementRequests: "iris-measurement-requests",
    auditLog: "iris-audit-log",
    chats: "iris-chats",
    reviews: "iris-reviews"
  };
  const COOKIE_CONSENT_KEY = "iris-cookie-consent";
  const PLACEHOLDER_IMAGES = {
    borse: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop",
    scarpe: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
    orologi: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=500&fit=crop",
    abbigliamento: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop",
    accessori: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=500&fit=crop",
    gioielli: "https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=400&h=500&fit=crop"
  };

  const PLATFORM_CONFIG = {
    ownerEmail: "owner@iris-fashion.it",
    adminEmails: ["owner@iris-fashion.it", "admin@iris-fashion.it"],
    supportEmail: "support@iris-fashion.it",
    emailFrom: "IRIS <noreply@iris-fashion.it>",
    platformFeeRate: 0.12,
    selfServeFeeRate: 0.12,
    conciergeFeeRate: 0.22,
    shippingCost: 25,
    buyerProtectionWindowDays: 14
  };

  const ORDER_STATUS_META = {
    pending: { it: "In attesa", en: "Pending" },
    paid: { it: "Pagato", en: "Paid" },
    awaiting_shipment: { it: "In preparazione", en: "Awaiting shipment" },
    shipped: { it: "Spedito al centro", en: "Shipped" },
    in_authentication: { it: "In autenticazione", en: "In authentication" },
    dispatched_to_buyer: { it: "In consegna al buyer", en: "Dispatched to buyer" },
    delivered: { it: "Consegnato", en: "Delivered" },
    completed: { it: "Completato", en: "Completed" },
    cancelled: { it: "Annullato", en: "Cancelled" },
    refund_requested: { it: "Rimborso richiesto", en: "Refund requested" },
    refunded: { it: "Rimborsato", en: "Refunded" }
  };

  const LOCALE_SETTINGS = window.IRIS_LOCALE_SETTINGS || {
    it: { label: "IT", nativeLabel: "Italiano", locale: "it-IT", currency: "EUR", rate: 1, dir: "ltr" },
    en: { label: "UK", nativeLabel: "English", locale: "en-GB", currency: "GBP", rate: 0.86, dir: "ltr" }
  };
  const HOME_COPY = window.IRIS_HOME_COPY || {};
  const FACET_TRANSLATIONS = window.IRIS_FACET_TRANSLATIONS || {};
  const I18N_PACKS = window.IRIS_I18N_PACKS || {};
  const SELL_TAXONOMY = {
    clothing: {
      it: "Abbigliamento",
      en: "Clothing",
      sizeMode: "alpha",
      fitEnabled: true,
      dimensionsLabel: { it: "Misure / lunghezze", en: "Measurements / lengths" },
      dimensionsPlaceholder: {
        it: "es. spalla 45, torace 54, lunghezza 68 cm",
        en: "e.g. shoulder 45, chest 54, length 68 cm"
      },
      hint: {
        it: "Scegli il tipo di capo: cosi blocchiamo taglia, fit e campi coerenti.",
        en: "Choose the garment type so size, fit, and related fields stay coherent."
      },
      subcategories: {
        tshirt: {
          it: "T-shirt",
          en: "T-shirt",
          types: [
            { id: "short_sleeve", it: "Manica corta", en: "Short sleeve" },
            { id: "long_sleeve", it: "Manica lunga", en: "Long sleeve" }
          ]
        },
        polo: {
          it: "Polo",
          en: "Polo",
          types: [
            { id: "short_sleeve", it: "Manica corta", en: "Short sleeve" },
            { id: "long_sleeve", it: "Manica lunga", en: "Long sleeve" }
          ]
        },
        shirt: {
          it: "Camicia",
          en: "Shirt",
          types: [
            { id: "classic", it: "Classica", en: "Classic" },
            { id: "overshirt", it: "Overshirt", en: "Overshirt" },
            { id: "denim", it: "Denim", en: "Denim" }
          ]
        },
        sweatshirt: {
          it: "Felpa",
          en: "Sweatshirt",
          types: [
            { id: "crewneck", it: "Girocollo", en: "Crewneck" },
            { id: "hoodie", it: "Hoodie", en: "Hoodie" },
            { id: "zip", it: "Zip", en: "Zip-up" }
          ]
        },
        knitwear: {
          it: "Maglieria",
          en: "Knitwear",
          types: [
            { id: "crewneck", it: "Girocollo", en: "Crewneck" },
            { id: "turtleneck", it: "Dolcevita", en: "Turtleneck" },
            { id: "cardigan", it: "Cardigan", en: "Cardigan" }
          ]
        },
        jacket: {
          it: "Giacca",
          en: "Jacket",
          types: [
            { id: "bomber", it: "Bomber", en: "Bomber" },
            { id: "blazer", it: "Blazer", en: "Blazer" },
            { id: "denim", it: "Denim", en: "Denim" },
            { id: "leather", it: "Pelle", en: "Leather" },
            { id: "puffer", it: "Piumino", en: "Puffer" }
          ]
        },
        coat: {
          it: "Cappotto",
          en: "Coat",
          types: [
            { id: "single_breasted", it: "Monopetto", en: "Single-breasted" },
            { id: "double_breasted", it: "Doppiopetto", en: "Double-breasted" },
            { id: "trench", it: "Trench", en: "Trench" }
          ]
        },
        pants: {
          it: "Pantaloni",
          en: "Pants",
          types: [
            { id: "tailored", it: "Sartoriale", en: "Tailored" },
            { id: "cargo", it: "Cargo", en: "Cargo" },
            { id: "jogger", it: "Jogger", en: "Jogger" },
            { id: "chino", it: "Chino", en: "Chino" }
          ]
        },
        jeans: {
          it: "Jeans",
          en: "Jeans",
          types: [
            { id: "straight", it: "Straight", en: "Straight" },
            { id: "slim", it: "Slim", en: "Slim" },
            { id: "wide", it: "Wide", en: "Wide" },
            { id: "skinny", it: "Skinny", en: "Skinny" }
          ]
        },
        shorts: {
          it: "Shorts",
          en: "Shorts",
          types: [
            { id: "tailored", it: "Sartoriali", en: "Tailored" },
            { id: "denim", it: "Denim", en: "Denim" },
            { id: "sport", it: "Sportivi", en: "Sport" }
          ]
        },
        dress: {
          it: "Vestito",
          en: "Dress",
          types: [
            { id: "mini", it: "Mini", en: "Mini" },
            { id: "midi", it: "Midi", en: "Midi" },
            { id: "maxi", it: "Maxi", en: "Maxi" }
          ]
        },
        skirt: {
          it: "Gonna",
          en: "Skirt",
          types: [
            { id: "mini", it: "Mini", en: "Mini" },
            { id: "midi", it: "Midi", en: "Midi" },
            { id: "maxi", it: "Maxi", en: "Maxi" }
          ]
        }
      }
    },
    shoes: {
      it: "Scarpe",
      en: "Shoes",
      sizeMode: "eu_shoes",
      fitEnabled: false,
      dimensionsLabel: { it: "Dettagli scarpa", en: "Shoe details" },
      dimensionsPlaceholder: {
        it: "es. soletta 27 cm, heel 9 cm, box inclusa",
        en: "e.g. insole 27 cm, heel 9 cm, box included"
      },
      hint: {
        it: "Per le scarpe usiamo sempre una taglia EU standard. Se l'etichetta è US o UK, scrivila nel campo originale.",
        en: "Shoes always use a standard EU size. If the label is US or UK, add it as the original size."
      },
      subcategories: {
        sneakers: { it: "Sneakers", en: "Sneakers" },
        loafers: { it: "Loafers", en: "Loafers" },
        boots: { it: "Stivali / Boots", en: "Boots" },
        sandals: { it: "Sandali", en: "Sandals" },
        heels: { it: "Decollete", en: "Heels" },
        flats: { it: "Ballerine / Flats", en: "Flats" },
        mules: { it: "Mules", en: "Mules" }
      }
    },
    bags: {
      it: "Borse",
      en: "Bags",
      sizeMode: "one_size",
      fitEnabled: false,
      dimensionsLabel: { it: "Dimensioni borsa", en: "Bag dimensions" },
      dimensionsPlaceholder: {
        it: "es. 30 x 22 x 16 cm",
        en: "e.g. 30 x 22 x 16 cm"
      },
      hint: {
        it: "Per le borse non usiamo la taglia classica: scegli la sottocategoria giusta e inserisci le dimensioni.",
        en: "Bags do not use classic sizing: choose the right subcategory and add dimensions."
      },
      subcategories: {
        shoulder: { it: "Shoulder bag", en: "Shoulder bag" },
        crossbody: { it: "Tracolla", en: "Crossbody" },
        tote: { it: "Tote", en: "Tote" },
        shopper: { it: "Shopper", en: "Shopper" },
        pochette: { it: "Pochette", en: "Pochette" },
        clutch: { it: "Clutch", en: "Clutch" },
        top_handle: { it: "Top handle", en: "Top handle" },
        backpack: { it: "Backpack", en: "Backpack" },
        hobo: { it: "Hobo", en: "Hobo" },
        bucket: { it: "Bucket bag", en: "Bucket bag" },
        mini: { it: "Mini bag", en: "Mini bag" },
        travel: { it: "Travel bag", en: "Travel bag" }
      }
    },
    accessories: {
      it: "Accessori",
      en: "Accessories",
      sizeMode: "one_size",
      fitEnabled: false,
      dimensionsLabel: { it: "Dimensioni / dettagli", en: "Dimensions / details" },
      dimensionsPlaceholder: {
        it: "es. lunghezza 90 cm, custodia inclusa",
        en: "e.g. 90 cm length, case included"
      },
      hint: {
        it: "Gli accessori hanno campi diversi a seconda del tipo. Le cinture usano una taglia dedicata, gli altri articoli restano taglia unica.",
        en: "Accessories use different fields depending on type. Belts use a dedicated size, while others remain one size."
      },
      subcategories: {
        belt: { it: "Cintura", en: "Belt", sizeMode: "belt" },
        wallet: { it: "Portafoglio", en: "Wallet" },
        cardholder: { it: "Portacarte", en: "Cardholder" },
        eyewear: { it: "Occhiali", en: "Eyewear" },
        hat: { it: "Cappello", en: "Hat" },
        scarf: { it: "Sciarpa", en: "Scarf" },
        gloves: { it: "Guanti", en: "Gloves" }
      }
    },
    jewelry: {
      it: "Gioielli",
      en: "Jewelry",
      sizeMode: "one_size",
      fitEnabled: false,
      dimensionsLabel: { it: "Dimensioni / dettagli", en: "Dimensions / details" },
      dimensionsPlaceholder: {
        it: "es. lunghezza 18 cm, diametro 2 cm",
        en: "e.g. 18 cm length, 2 cm diameter"
      },
      hint: {
        it: "Per i gioielli lavoriamo con sottocategorie e dimensioni, non con una taglia standard rigida.",
        en: "Jewelry relies on subcategories and measurements rather than a rigid standard size."
      },
      subcategories: {
        ring: { it: "Anello", en: "Ring" },
        bracelet: { it: "Bracciale", en: "Bracelet" },
        necklace: { it: "Collana", en: "Necklace" },
        earrings: { it: "Orecchini", en: "Earrings" },
        brooch: { it: "Spilla", en: "Brooch" }
      }
    },
    watches: {
      it: "Orologi",
      en: "Watches",
      sizeMode: "one_size",
      fitEnabled: false,
      dimensionsLabel: { it: "Dettagli orologio", en: "Watch details" },
      dimensionsPlaceholder: {
        it: "es. cassa 36 mm, strap 18 cm",
        en: "e.g. 36 mm case, 18 cm strap"
      },
      hint: {
        it: "Gli orologi usano dettagli tecnici e misure di cassa/cinturino, non una taglia moda classica.",
        en: "Watches rely on technical details and case/strap measurements, not classic fashion sizing."
      },
      subcategories: {
        watch: { it: "Orologio", en: "Watch" },
        strap: { it: "Cinturino", en: "Strap" }
      }
    }
  };

  const MEASUREMENT_SCHEMAS = {
    upper: {
      title: { it: "Misure capo", en: "Garment measurements" },
      hint: {
        it: "Perfetto per t-shirt, felpe, camicie e giacche. Inserisci i valori in cm.",
        en: "Perfect for tees, sweatshirts, shirts, and jackets. Enter values in cm."
      },
      fields: [
        { id: "chest", it: "Torace", en: "Chest", placeholder: "54" },
        { id: "length", it: "Lunghezza", en: "Length", placeholder: "70" },
        { id: "shoulders", it: "Spalle", en: "Shoulders", placeholder: "46" },
        { id: "sleeve", it: "Manica", en: "Sleeve", placeholder: "64" }
      ]
    },
    bottom: {
      title: { it: "Misure pantalone", en: "Bottom measurements" },
      hint: {
        it: "Usa cm per vita, cavallo e fondo gamba.",
        en: "Use cm for waist, rise, inseam, and leg opening."
      },
      fields: [
        { id: "waist", it: "Vita", en: "Waist", placeholder: "42" },
        { id: "rise", it: "Cavallo", en: "Rise", placeholder: "31" },
        { id: "inseam", it: "Interno gamba", en: "Inseam", placeholder: "78" },
        { id: "leg_opening", it: "Fondo gamba", en: "Leg opening", placeholder: "18" }
      ]
    },
    dress: {
      title: { it: "Misure vestito", en: "Dress measurements" },
      hint: {
        it: "Aggiungi busto, vita, fianchi e lunghezza.",
        en: "Add bust, waist, hips, and length."
      },
      fields: [
        { id: "chest", it: "Torace", en: "Chest", placeholder: "44" },
        { id: "waist", it: "Vita", en: "Waist", placeholder: "36" },
        { id: "hips", it: "Fianchi", en: "Hips", placeholder: "48" },
        { id: "length", it: "Lunghezza", en: "Length", placeholder: "124" }
      ]
    },
    skirt: {
      title: { it: "Misure gonna", en: "Skirt measurements" },
      hint: {
        it: "Vita, fianchi e lunghezza aiutano molto il buyer.",
        en: "Waist, hips, and length help the buyer a lot."
      },
      fields: [
        { id: "waist", it: "Vita", en: "Waist", placeholder: "35" },
        { id: "hips", it: "Fianchi", en: "Hips", placeholder: "47" },
        { id: "length", it: "Lunghezza", en: "Length", placeholder: "68" }
      ]
    },
    bag: {
      title: { it: "Dimensioni borsa", en: "Bag measurements" },
      hint: {
        it: "Larghezza, altezza e profondita sono fondamentali. Aggiungi la luce tracolla se serve.",
        en: "Width, height, and depth are essential. Add strap drop when relevant."
      },
      fields: [
        { id: "width", it: "Larghezza", en: "Width", placeholder: "30" },
        { id: "height", it: "Altezza", en: "Height", placeholder: "22" },
        { id: "depth", it: "Profondita", en: "Depth", placeholder: "16" },
        { id: "strap_drop", it: "Luce tracolla", en: "Strap drop", placeholder: "48" }
      ]
    },
    shoes: {
      title: { it: "Dettagli scarpa", en: "Shoe measurements" },
      hint: {
        it: "Usa cm per soletta e base suola, oppure mm per il tacco se ti aiuta.",
        en: "Use cm for insole and sole width, or mm for heel height if useful."
      },
      fields: [
        { id: "insole", it: "Soletta", en: "Insole", placeholder: "27.5" },
        { id: "sole_width", it: "Base suola", en: "Sole width", placeholder: "10" },
        { id: "heel_height", it: "Altezza tacco", en: "Heel height", placeholder: "9" }
      ]
    },
    belt: {
      title: { it: "Misure cintura", en: "Belt measurements" },
      hint: {
        it: "Aggiungi lunghezza totale e foro centrale.",
        en: "Add total length and middle hole distance."
      },
      fields: [
        { id: "full_length", it: "Lunghezza totale", en: "Full length", placeholder: "102" },
        { id: "buckle_to_middle", it: "Fibbia a foro centrale", en: "Buckle to middle hole", placeholder: "85" },
        { id: "width", it: "Altezza cintura", en: "Belt width", placeholder: "4" }
      ]
    },
    jewelry: {
      title: { it: "Dimensioni gioiello", en: "Jewelry measurements" },
      hint: {
        it: "Usa le misure piu utili per il pezzo: lunghezza, diametro o pendente.",
        en: "Use the most relevant measurements: length, diameter, or drop."
      },
      fields: [
        { id: "length", it: "Lunghezza", en: "Length", placeholder: "18" },
        { id: "diameter", it: "Diametro", en: "Diameter", placeholder: "2.2" },
        { id: "drop", it: "Drop", en: "Drop", placeholder: "4" }
      ]
    },
    watch: {
      title: { it: "Misure orologio", en: "Watch measurements" },
      hint: {
        it: "Cassa, lug e cinturino rendono l'annuncio molto piu chiaro.",
        en: "Case, lug width, and strap length make the listing much clearer."
      },
      fields: [
        { id: "case_diameter", it: "Diametro cassa", en: "Case diameter", placeholder: "36" },
        { id: "lug_width", it: "Larghezza lug", en: "Lug width", placeholder: "20" },
        { id: "strap_length", it: "Lunghezza cinturino", en: "Strap length", placeholder: "18" }
      ]
    }
  };

  const SHIPPING_COST = PLATFORM_CONFIG.shippingCost;
  const state = {
    users: loadJson(STORAGE_KEYS.users, []),
    banRegistry: loadJson(STORAGE_KEYS.banRegistry, { emails: [], phones: [], entries: [] }),
    currentUser: loadJson(STORAGE_KEYS.session, null),
    cart: loadJson(STORAGE_KEYS.cart, []),
    listings: loadJson(STORAGE_KEYS.listings, []),
    orders: loadJson(STORAGE_KEYS.orders, []),
    offers: loadJson(STORAGE_KEYS.offers, []),
    notifications: loadJson(STORAGE_KEYS.notifications, []),
    emailOutbox: loadJson(STORAGE_KEYS.emailOutbox, []),
    supportTickets: loadJson(STORAGE_KEYS.supportTickets, []),
    measurementRequests: loadJson(STORAGE_KEYS.measurementRequests, []),
    auditLog: loadJson(STORAGE_KEYS.auditLog, []),
    reviews: loadJson(STORAGE_KEYS.reviews, []),
    pendingAction: null,
    authMode: "login",
    authReturnView: "home",
    checkoutItems: [],
    checkoutSource: "cart",
    checkoutStep: "address",
    checkoutDraft: null,
    checkoutStatus: null,
    sellPhotos: [],
    activeDetailImage: 0,
    lastNonDetailView: "home",
    activeOrderId: null,
    activeOrderScope: "buyer",
    opsModalMode: null,
    opsModalPayload: null
  };

  const existingFavorites = loadJson(STORAGE_KEYS.favorites, []);
  if (existingFavorites.length) {
    favorites = new Set(existingFavorites);
  }

  if (state.currentUser && normalizeEmail(state.currentUser.email) === "utente@iris-marketplace.it") {
    state.currentUser = null;
    removeStoredValue(STORAGE_KEYS.session);
  }

  if (!state.currentUser && Array.isArray(state.cart) && state.cart.length) {
    state.cart = [];
    removeStoredValue(STORAGE_KEYS.cart);
  }

  extendTranslations();
  injectShellUi();
  injectCookieConsentUi();
  injectHomeView();
  assignSellFormIds();
  injectSellHelpers();
  bindShellMenus();
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
  cleanupNavbar();
  setTimeout(cleanupNavbar, 300);
  setTimeout(cleanupNavbar, 800);
  setTimeout(cleanupNavbar, 2000);

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function getTaxonomyLabel(entry) {
    if (!entry) {
      return "";
    }
    return langText(entry.it || "", entry.en || entry.it || "");
  }

  function getSellCategoryDefinition(categoryKey) {
    return categoryKey ? SELL_TAXONOMY[categoryKey] || null : null;
  }

  function getSellSubcategoryDefinition(categoryKey, subcategoryKey) {
    const category = getSellCategoryDefinition(categoryKey);
    return category && subcategoryKey ? category.subcategories[subcategoryKey] || null : null;
  }

  function buildOptionList(entries) {
    return entries.map(function (entry) {
      return {
        id: entry.id,
        label: getTaxonomyLabel(entry)
      };
    });
  }

  function buildRangeOptions(start, end, step) {
    const options = [];
    for (let value = start; value <= end + 0.0001; value += step) {
      const label = Number.isInteger(value) ? String(value) : value.toFixed(1);
      options.push({ id: label, label: label });
    }
    return options;
  }

  function getSellSizeOptions(sizeMode) {
    if (sizeMode === "alpha") {
      return ["XXS", "XS", "S", "M", "L", "XL", "XXL"].map(function (value) {
        return { id: value, label: value };
      });
    }
    if (sizeMode === "eu_shoes") {
      return buildRangeOptions(34, 48, 0.5);
    }
    if (sizeMode === "belt") {
      return buildRangeOptions(65, 110, 5);
    }
    if (sizeMode === "one_size") {
      return [{ id: "one_size", label: langText("Taglia unica", "One size") }];
    }
    return [];
  }

  function syncSelectOptions(select, options, placeholder, selectedValue) {
    if (!select) {
      return;
    }
    const current = selectedValue !== undefined ? selectedValue : select.value;
    select.innerHTML = "";
    select.appendChild(new Option(placeholder, ""));
    options.forEach(function (option) {
      select.appendChild(new Option(option.label, option.id));
    });
    if (current !== undefined && current !== null && String(current) !== "") {
      if (!options.some(function (option) { return String(option.id) === String(current); })) {
        select.appendChild(new Option(String(current), String(current)));
      }
      select.value = String(current);
    } else {
      select.value = "";
    }
    select.disabled = options.length === 0;
  }

  function setSellFieldVisibility(selector, visible) {
    const element = qs(selector);
    if (!element) {
      return;
    }
    element.hidden = !visible;
    element.style.display = visible ? "" : "none";
  }

  function getSelectedOptionLabel(selector) {
    const field = qs(selector);
    if (!field || !field.options || field.selectedIndex < 0) {
      return "";
    }
    return String(field.options[field.selectedIndex].textContent || "").trim();
  }

  function getResolvedSellSizeMode(categoryKey, subcategoryKey) {
    const category = getSellCategoryDefinition(categoryKey);
    const subcategory = getSellSubcategoryDefinition(categoryKey, subcategoryKey);
    return (subcategory && subcategory.sizeMode) || (category && category.sizeMode) || "one_size";
  }

  function getMeasurementSchemaKey(categoryKey, subcategoryKey) {
    if (categoryKey === "clothing") {
      if (["pants", "jeans", "shorts"].includes(subcategoryKey)) {
        return "bottom";
      }
      if (subcategoryKey === "dress") {
        return "dress";
      }
      if (subcategoryKey === "skirt") {
        return "skirt";
      }
      return "upper";
    }
    if (categoryKey === "bags") {
      return "bag";
    }
    if (categoryKey === "shoes") {
      return "shoes";
    }
    if (categoryKey === "accessories" && subcategoryKey === "belt") {
      return "belt";
    }
    if (categoryKey === "jewelry") {
      return "jewelry";
    }
    if (categoryKey === "watches") {
      return "watch";
    }
    return null;
  }

  function getMeasurementSchema(categoryKey, subcategoryKey) {
    const schemaKey = getMeasurementSchemaKey(categoryKey, subcategoryKey);
    return schemaKey ? MEASUREMENT_SCHEMAS[schemaKey] || null : null;
  }

  function collectVisibleMeasurements() {
    const container = qs("#irisxMeasurementsFields");
    if (!container) {
      return {};
    }
    return qsa("[data-measurement-key]", container).reduce(function (accumulator, input) {
      const key = input.getAttribute("data-measurement-key");
      const value = input.value.trim();
      if (key && value) {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});
  }

  function renderSellMeasurementFields(categoryKey, subcategoryKey, preservedValues) {
    const schema = getMeasurementSchema(categoryKey, subcategoryKey);
    const group = qs("#irisxMeasurementsGroup");
    const title = qs("#irisxMeasurementsTitle");
    const hint = qs("#irisxMeasurementsHint");
    const grid = qs("#irisxMeasurementsFields");
    if (!group || !title || !hint || !grid) {
      return;
    }

    const values = preservedValues && typeof preservedValues === "object" ? preservedValues : collectVisibleMeasurements();
    setSellFieldVisibility("#irisxMeasurementsGroup", Boolean(schema));
    if (!schema) {
      grid.innerHTML = "";
      return;
    }

    title.textContent = getTaxonomyLabel(schema.title);
    hint.textContent = getTaxonomyLabel(schema.hint);
    grid.innerHTML = schema.fields.map(function (field) {
      const value = values[field.id] || "";
      return `<label class="irisx-measurement-field">
        <span>${escapeHtml(getTaxonomyLabel(field))}</span>
        <input class="fi" type="text" inputmode="decimal" data-measurement-key="${escapeHtml(field.id)}" placeholder="${escapeHtml(field.placeholder || "")}" value="${escapeHtml(value)}">
      </label>`;
    }).join("");
  }

  function collectSellMeasurements() {
    const values = collectVisibleMeasurements();
    return Object.keys(values).length ? values : null;
  }

  function getMeasurementFieldDefinition(fieldId, categoryKey, subcategoryKey) {
    const schema = getMeasurementSchema(categoryKey, subcategoryKey);
    if (schema) {
      const match = schema.fields.find(function (field) { return field.id === fieldId; });
      if (match) {
        return match;
      }
    }
    return null;
  }

  function getSellEmojiForTaxonomy(categoryKey, subcategoryKey) {
    if (categoryKey === "bags") return "👜";
    if (categoryKey === "shoes") return "👟";
    if (categoryKey === "accessories") return subcategoryKey === "belt" ? "🪢" : "🎀";
    if (categoryKey === "jewelry") return "💍";
    if (categoryKey === "watches") return "⌚";
    return "👕";
  }

  function getSellTaxonomyHaystack(listing) {
    return normalizeSearchText([
      listing && listing.cat,
      listing && listing.subcategory,
      listing && listing.productType,
      listing && listing.name,
      listing && listing.desc,
      listing && listing.dims,
      listing && listing.material
    ].join(" "));
  }

  function inferSellCategoryKey(listing) {
    if (listing && listing.categoryKey && SELL_TAXONOMY[listing.categoryKey]) {
      return listing.categoryKey;
    }
    const haystack = getSellTaxonomyHaystack(listing);
    if (/scarp|sneaker|loafer|boot|sandali|heels|mules/.test(haystack)) return "shoes";
    if (/bors|bag|pochette|clutch|tote|shopper|hobo|crossbody|tracolla/.test(haystack)) return "bags";
    if (/orolog|watch|strap/.test(haystack)) return "watches";
    if (/gioiell|ring|bracelet|necklace|orecchin|brooch/.test(haystack)) return "jewelry";
    if (/cintur|belt|wallet|portaf|cardholder|portacarte|occhial|eyewear|sciarp|guanti|hat|cappell/.test(haystack)) return "accessories";
    if (/abbigliament|shirt|polo|felpa|maglier|giacca|cappott|pantalon|jeans|dress|gonna/.test(haystack)) return "clothing";
    return "";
  }

  function inferSellSubcategoryKey(listing, explicitCategoryKey) {
    const categoryKey = explicitCategoryKey || inferSellCategoryKey(listing);
    const category = getSellCategoryDefinition(categoryKey);
    if (!category) {
      return "";
    }
    if (listing && listing.subcategoryKey && category.subcategories[listing.subcategoryKey]) {
      return listing.subcategoryKey;
    }

    const haystack = getSellTaxonomyHaystack(listing);
    const matcherMap = {
      clothing: [
        ["polo", /(^|\s)polo(\s|$)/],
        ["shirt", /camici|overshirt|shirt/],
        ["sweatshirt", /felpa|hoodie|crewneck|zip[\s-]?up/],
        ["knitwear", /maglier|knit|sweater|cardigan|dolcevita|turtleneck/],
        ["jacket", /giacca|bomber|blazer|piumin|puffer|denim jacket|leather jacket/],
        ["coat", /cappott|trench|overcoat/],
        ["jeans", /jeans|denim pants|selvedge/],
        ["pants", /pantalon|trouser|chino|cargo|jogger/],
        ["shorts", /shorts|bermuda/],
        ["dress", /vestit|dress|gown/],
        ["skirt", /gonna|skirt/],
        ["tshirt", /t[\s-]?shirt|tee|magliett/]
      ],
      shoes: [
        ["sneakers", /sneaker|trainer/],
        ["loafers", /loafer|mocassin/],
        ["boots", /boot|stival/],
        ["sandals", /sandal/],
        ["heels", /heel|decollete|pump/],
        ["flats", /flat|ballerin/],
        ["mules", /mule/]
      ],
      bags: [
        ["crossbody", /crossbody|tracolla/],
        ["shoulder", /shoulder bag/],
        ["tote", /tote/],
        ["shopper", /shopper/],
        ["pochette", /pochette/],
        ["clutch", /clutch/],
        ["top_handle", /top handle|top-handle/],
        ["backpack", /backpack|zaino/],
        ["hobo", /hobo/],
        ["bucket", /bucket/],
        ["mini", /mini bag|mini/],
        ["travel", /travel|weekend|duffle/]
      ],
      accessories: [
        ["belt", /belt|cintur/],
        ["wallet", /wallet|portafog/],
        ["cardholder", /cardholder|portacart/],
        ["eyewear", /eyewear|occhial|sunglass/],
        ["hat", /hat|cappell|beanie|cap\b/],
        ["scarf", /scarf|sciarp/],
        ["gloves", /glove|guant/]
      ],
      jewelry: [
        ["ring", /ring|anell/],
        ["bracelet", /bracelet|braccial/],
        ["necklace", /necklace|collan/],
        ["earrings", /earring|orecchin/],
        ["brooch", /brooch|spilla/]
      ],
      watches: [
        ["strap", /strap|cinturin/],
        ["watch", /watch|orolog/]
      ]
    };

    const matchers = matcherMap[categoryKey] || [];
    const match = matchers.find(function (entry) {
      return entry[1].test(haystack);
    });
    if (match) {
      return match[0];
    }
    return Object.keys(category.subcategories)[0] || "";
  }

  function inferSellTypeKey(listing, explicitCategoryKey, explicitSubcategoryKey) {
    const categoryKey = explicitCategoryKey || inferSellCategoryKey(listing);
    const subcategoryKey = explicitSubcategoryKey || inferSellSubcategoryKey(listing, categoryKey);
    const subcategory = getSellSubcategoryDefinition(categoryKey, subcategoryKey);
    if (!subcategory || !Array.isArray(subcategory.types) || !subcategory.types.length) {
      return "";
    }
    if (listing && listing.productTypeKey && subcategory.types.some(function (entry) { return entry.id === listing.productTypeKey; })) {
      return listing.productTypeKey;
    }

    const haystack = getSellTaxonomyHaystack(listing);
    const matcherMap = {
      tshirt: [
        ["long_sleeve", /long sleeve|manica lunga|ls tee/],
        ["short_sleeve", /short sleeve|manica corta|tee/]
      ],
      polo: [
        ["long_sleeve", /long sleeve|manica lunga/],
        ["short_sleeve", /short sleeve|manica corta|polo/]
      ],
      shirt: [
        ["overshirt", /overshirt/],
        ["denim", /denim/],
        ["classic", /camicia|shirt/]
      ],
      sweatshirt: [
        ["hoodie", /hoodie|hooded|cappucc/],
        ["zip", /zip[\s-]?up|zip hoodie|full zip/],
        ["crewneck", /crewneck|girocollo|sweatshirt|felpa/]
      ],
      knitwear: [
        ["cardigan", /cardigan/],
        ["turtleneck", /turtleneck|dolcevita/],
        ["crewneck", /crewneck|girocollo|sweater|knit/]
      ],
      jacket: [
        ["bomber", /bomber/],
        ["blazer", /blazer/],
        ["denim", /denim/],
        ["leather", /leather|pelle/],
        ["puffer", /puffer|down|piumin/]
      ],
      coat: [
        ["trench", /trench/],
        ["double_breasted", /double breasted|doppiopetto/],
        ["single_breasted", /single breasted|monopetto/]
      ],
      pants: [
        ["cargo", /cargo/],
        ["jogger", /jogger/],
        ["chino", /chino/],
        ["tailored", /tailored|sartorial/]
      ],
      jeans: [
        ["skinny", /skinny/],
        ["wide", /wide|baggy|loose/],
        ["slim", /slim/],
        ["straight", /straight/]
      ],
      shorts: [
        ["sport", /sport|running|mesh/],
        ["denim", /denim/],
        ["tailored", /tailored|sartorial/]
      ],
      dress: [
        ["maxi", /maxi/],
        ["midi", /midi/],
        ["mini", /mini/]
      ],
      skirt: [
        ["maxi", /maxi/],
        ["midi", /midi/],
        ["mini", /mini/]
      ]
    };

    const matchers = matcherMap[subcategoryKey] || [];
    const match = matchers.find(function (entry) {
      return entry[1].test(haystack);
    });
    if (match) {
      return match[0];
    }
    return subcategory.types[0].id;
  }

  function getSellCategoryLabel(categoryKey) {
    return getTaxonomyLabel(getSellCategoryDefinition(categoryKey));
  }

  function getSellSubcategoryLabel(categoryKey, subcategoryKey) {
    return getTaxonomyLabel(getSellSubcategoryDefinition(categoryKey, subcategoryKey));
  }

  function getSellTypeLabel(categoryKey, subcategoryKey, typeKey) {
    const subcategory = getSellSubcategoryDefinition(categoryKey, subcategoryKey);
    if (!subcategory || !Array.isArray(subcategory.types)) {
      return "";
    }
    return getTaxonomyLabel(subcategory.types.find(function (entry) {
      return entry.id === typeKey;
    }) || null);
  }

  function inferSellSizeSchema(listing) {
    if (listing && listing.sizeSchema) {
      return listing.sizeSchema;
    }
    const categoryKey = inferSellCategoryKey(listing);
    const subcategoryKey = (listing && listing.subcategoryKey) || inferSellSubcategoryKey(listing, categoryKey);
    if (categoryKey === "shoes") return "eu_shoes";
    if (categoryKey === "bags" || categoryKey === "jewelry" || categoryKey === "watches") return "one_size";
    if (categoryKey === "accessories" && subcategoryKey === "belt") return "belt";
    if (categoryKey === "accessories") return "one_size";
    if (categoryKey === "clothing") return "alpha";
    const normalizedSize = normalizeSearchText((listing && listing.sz) || "");
    if (normalizedSize === "one size" || normalizedSize === "taglia unica") return "one_size";
    if (/^(eu\s*)?\d+([.,]\d+)?$/.test(String((listing && listing.sz) || "").trim().toLowerCase())) return "eu_shoes";
    return "alpha";
  }

  function getSellFormSizeValue(listing, explicitCategoryKey, explicitSubcategoryKey) {
    const categoryKey = explicitCategoryKey || inferSellCategoryKey(listing);
    const subcategoryKey = explicitSubcategoryKey || inferSellSubcategoryKey(listing, categoryKey);
    const sizeMode = (listing && listing.sizeSchema) || getResolvedSellSizeMode(categoryKey, subcategoryKey);
    const rawSize = String((listing && listing.sz) || "").trim();
    if (sizeMode === "one_size") {
      return "one_size";
    }
    if (sizeMode === "eu_shoes") {
      return rawSize.replace(/^EU\s+/i, "").trim();
    }
    if (sizeMode === "belt") {
      const match = rawSize.match(/\d+([.,]\d+)?/);
      return match ? match[0].replace(",", ".") : rawSize;
    }
    return rawSize;
  }

  function getListingDisplaySize(listing) {
    if (inferSellSizeSchema(listing) === "one_size" || normalizeSearchText((listing && listing.sz) || "") === "one size" || normalizeSearchText((listing && listing.sz) || "") === "taglia unica") {
      return listing && listing.subcategory ? listing.subcategory : langText("Taglia unica", "One size");
    }
    return (listing && listing.sz) || langText("N/A", "N/A");
  }

  function inferListingGender(listing) {
    const explicit = String((listing && (listing.gender || listing.genderLabel)) || "").trim();
    if (explicit) {
      const normalizedExplicit = normalizeSearchText(explicit);
      if (normalizedExplicit.includes("uomo") || normalizedExplicit.includes("men")) return "Men";
      if (normalizedExplicit.includes("donna") || normalizedExplicit.includes("women")) return "Women";
      return "Unisex";
    }
    const haystack = normalizeSearchText([
      listing && listing.cat,
      listing && listing.category,
      listing && listing.subcategory,
      listing && listing.productType,
      listing && listing.name,
      listing && listing.desc
    ].join(" "));
    if (haystack.includes("uomo") || haystack.includes("men")) return "Men";
    if (haystack.includes("donna") || haystack.includes("women")) return "Women";
    return "Unisex";
  }

  function getListingTrustMeta(listing) {
    const verified = isListingVerified(listing);
    return {
      verified: verified,
      authenticated: verified || String((listing && listing.authenticationStatus) || "").toLowerCase() === "authenticated",
      guaranteed: Boolean(verified || (listing && listing.inventoryStatus !== "draft")),
      certificateCode: (listing && listing.certificateCode) || (verified ? `IRIS-CERT-${String(listing.id || "").slice(-6).toUpperCase()}` : ""),
      authenticatedAt: (listing && listing.authenticatedAt) || (verified ? Date.now() - 1000 * 60 * 60 * 24 * 7 : null)
    };
  }

  function isVerifiedSellerProfile(seller) {
    return Boolean((seller && seller.verified) || Number((seller && seller.sales) || 0) >= 5);
  }

  function getProductMetaSummary(listing) {
    const seller = buildListingSeller(listing || {});
    const colorLabel = getFacetLabel("colors", (listing && listing.color) || "");
    const gender = inferListingGender(listing);
    return [
      gender !== "Unisex" ? langText(gender === "Men" ? "Uomo" : "Donna", gender) : langText("Unisex", "Unisex"),
      getListingDisplaySize(listing),
      colorLabel,
      seller.name
    ].filter(function (value) {
      return value && value !== langText("Non indicato", "Not specified");
    }).join(" · ");
  }

  function getPlaceholderImageByCategory(category) {
    const normalized = normalizeSearchText(category || "");
    if (normalized.includes("scarpe")) return PLACEHOLDER_IMAGES.scarpe;
    if (normalized.includes("orologi")) return PLACEHOLDER_IMAGES.orologi;
    if (normalized.includes("accessori")) return PLACEHOLDER_IMAGES.accessori;
    if (normalized.includes("gioielli")) return PLACEHOLDER_IMAGES.gioielli;
    if (normalized.includes("abbigliamento")) return PLACEHOLDER_IMAGES.abbigliamento;
    return PLACEHOLDER_IMAGES.borse;
  }

  function getListingImageSources(listing) {
    const sources = [];
    if (Array.isArray(listing && listing.images)) {
      listing.images.filter(Boolean).forEach(function (src) {
        if (sources.indexOf(src) === -1) {
          sources.push(src);
        }
      });
    }
    if (listing && listing.image && sources.indexOf(listing.image) === -1) {
      sources.push(listing.image);
    }
    return sources;
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getCookieConsentStatus() {
    try {
      const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!raw) {
        return "";
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && parsed.level) {
          return parsed.level;
        }
      } catch (parseError) {
        // Support legacy string values.
      }
      if (raw === "accepted") {
        return "all";
      }
      if (raw === "rejected") {
        return "necessary";
      }
      return raw;
    } catch (error) {
      return "";
    }
  }

  function canPersistUserData() {
    return getCookieConsentStatus() === "all";
  }

  function persistPreference(key, value) {
    try {
      if (key !== COOKIE_CONSENT_KEY && !canPersistUserData()) {
        return;
      }
      localStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  }

  function removeStoredValue(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      return;
    }
  }

  function saveJson(key, value) {
    if (!canPersistUserData()) {
      return;
    }
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

  function convertLocalAmountToBase(value) {
    const rate = Number(getLocaleConfig().rate || 1);
    if (!rate) {
      return Number(value || 0);
    }
    return Number(value || 0) / rate;
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

  function getAvailableGenders() {
    return ["Men", "Women", "Unisex"].filter(function (gender) {
      return getVisibleCatalogProducts().some(function (product) {
        return inferListingGender(product) === gender;
      });
    });
  }

  function getAvailableMaterials() {
    return [...new Set(
      getVisibleCatalogProducts()
        .map(function (product) { return String(product.material || "").trim(); })
        .filter(Boolean)
    )].sort();
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
    persistPreference("iris-lang", curLang);
    document.documentElement.lang = curLang;
    document.documentElement.dir = isRtlLocale() ? "rtl" : "ltr";
    document.body.classList.toggle("irisx-rtl", isRtlLocale());
    if (typeof applyLang === "function") {
      applyLang();
    }
  }

  function getLocaleMenuLabel(code) {
    const locale = LOCALE_SETTINGS[code];
    if (!locale) {
      return code.toUpperCase();
    }
    return `${locale.nativeLabel} · ${locale.currency}`;
  }

  function syncLocaleTrigger() {
    const locale = getLocaleConfig();
    const trigger = qs("#tnLocaleTrigger");
    const triggerLabel = qs("#tnLocaleTriggerLabel");
    const mobileTrigger = qs("#tnMobileLangBtn");
    const profileTrigger = qs("#langToggle");

    if (triggerLabel) {
      triggerLabel.textContent = `${locale.label} · ${locale.currency}`;
    }
    if (trigger) {
      trigger.setAttribute("aria-label", langText("Cambia lingua e valuta", "Change language and currency"));
      trigger.setAttribute("title", `${locale.nativeLabel} · ${locale.currency}`);
    }
    if (mobileTrigger) {
      mobileTrigger.textContent = `${langText("Lingua", "Language")} · ${locale.label} · ${locale.currency}`;
    }
    if (profileTrigger && profileTrigger.tagName !== "SELECT") {
      profileTrigger.textContent = `${langText("Lingua", "Language")} · ${locale.label} · ${locale.currency}`;
      profileTrigger.setAttribute("title", `${locale.nativeLabel} · ${locale.currency}`);
    }
  }

  function renderLocaleMenu() {
    const menu = qs("#tnLocaleMenu");
    if (!menu) {
      return;
    }
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", langText("Selettore lingua e valuta", "Language and currency selector"));
    menu.innerHTML = Object.keys(LOCALE_SETTINGS).map(function (code) {
      const locale = LOCALE_SETTINGS[code];
      const active = code === curLang;
      return `<button class="tn-locale-option${active ? " is-active" : ""}" onclick="switchLang('${code}')" type="button" role="menuitemradio" aria-checked="${active ? "true" : "false"}">
        <strong>${escapeHtml(locale.label)}</strong>
        <span>${escapeHtml(getLocaleMenuLabel(code))}</span>
      </button>`;
    }).join("");
  }

  function closeLocaleMenu() {
    const menu = qs("#tnLocaleMenu");
    const trigger = qs("#tnLocaleTrigger");
    if (menu) {
      menu.classList.remove("open");
    }
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.classList.remove("is-open");
    }
  }

  function toggleLocaleMenu(forceOpen) {
    const menu = qs("#tnLocaleMenu");
    const trigger = qs("#tnLocaleTrigger");
    const nav = qs("#topnav");
    if (!menu || !trigger) {
      return;
    }
    closeProfileMenu();
    closeMobileNav();
    const willOpen = typeof forceOpen === "boolean" ? forceOpen : !menu.classList.contains("open");
    if (willOpen && nav) {
      const maxWidth = 240;
      const left = Math.max(16, trigger.offsetLeft + trigger.offsetWidth - maxWidth);
      menu.style.left = left + "px";
      menu.style.top = `calc(var(--iris-nav-height) - 2px)`;
    }
    menu.classList.toggle("open", willOpen);
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    trigger.classList.toggle("is-open", willOpen);
  }

  function ensureLanguageSelector() {
    const current = document.getElementById("langToggle");
    if (!current) {
      return;
    }

    if (current.tagName === "SELECT") {
      current.value = LOCALE_SETTINGS[curLang] ? curLang : "en";
      // Attach change handler if not already attached
      if (!current.dataset.irisxLangBound) {
        current.dataset.irisxLangBound = "1";
        current.addEventListener("change", function () {
          setLanguage(this.value);
        });
      }
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
      showDetail(value);
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

  function formatFeeRateLabel(rate) {
    return Math.round(Number(rate || 0) * 100) + "%";
  }

  function getWorkspaceDefaultCountry() {
    return curLang === "it" ? "Italia" : "Italy";
  }

  function normalizeAddressRecord(address, fallbackUser) {
    const user = fallbackUser || {};
    return Object.assign(
      {
        id: createId("adr"),
        label: langText("Principale", "Primary"),
        name: user.name || langText("Cliente IRIS", "IRIS customer"),
        address: "",
        city: user.city || "",
        country: user.country || getWorkspaceDefaultCountry(),
        phone: "",
        isDefault: false
      },
      address || {}
    );
  }

  function normalizePaymentMethodRecord(method) {
    return Object.assign(
      {
        id: createId("pay"),
        type: "card",
        brand: "Visa",
        last4: "4242",
        label: "Prototype card",
        status: "placeholder",
        isDefault: false
      },
      method || {}
    );
  }

  function normalizeSecurityRecord(security) {
    const normalized = Object.assign(
      {
        twoFactor: false,
        loginAlerts: true,
        passwordUpdatedAt: Date.now(),
        activeSessions: []
      },
      security || {}
    );

    if (!Array.isArray(normalized.activeSessions) || !normalized.activeSessions.length) {
      normalized.activeSessions = [
        {
          id: createId("sess"),
          device: langText("Browser corrente", "Current browser"),
          location: "IRIS Web",
          lastSeen: Date.now(),
          current: true
        }
      ];
    }

    return normalized;
  }

  function normalizeVerificationRecord(verification, user) {
    const normalizedEmail = normalizeEmail(user && user.email);
    const normalizedPhone = normalizePhoneNumber(user && user.phone);
    const normalized = Object.assign(
      {
        emailVerified: false,
        phoneVerified: false,
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        verifiedEmail: "",
        verifiedPhone: "",
        pendingEmailCode: "",
        pendingPhoneCode: "",
        pendingEmailCodeExpiresAt: null,
        pendingPhoneCodeExpiresAt: null,
        lastEmailVerificationSentAt: null,
        lastPhoneVerificationSentAt: null
      },
      verification || {}
    );

    if (normalized.verifiedEmail && normalized.verifiedEmail !== normalizedEmail) {
      normalized.emailVerified = false;
      normalized.emailVerifiedAt = null;
      normalized.verifiedEmail = "";
      normalized.pendingEmailCode = "";
      normalized.pendingEmailCodeExpiresAt = null;
    }

    if (normalized.verifiedPhone && normalized.verifiedPhone !== normalizedPhone) {
      normalized.phoneVerified = false;
      normalized.phoneVerifiedAt = null;
      normalized.verifiedPhone = "";
      normalized.pendingPhoneCode = "";
      normalized.pendingPhoneCodeExpiresAt = null;
    }

    if (normalized.emailVerified) {
      normalized.verifiedEmail = normalizedEmail;
    }

    if (normalized.phoneVerified) {
      normalized.verifiedPhone = normalizedPhone;
    }

    return normalized;
  }

  function normalizeBanRegistry(registry) {
    const source = Object.assign(
      {
        emails: [],
        phones: [],
        entries: []
      },
      registry || {}
    );
    const entries = Array.isArray(source.entries) ? source.entries.map(function (entry) {
      const type = entry && entry.type === "phone" ? "phone" : "email";
      const rawValue = entry && entry.value;
      const normalizedValue = type === "phone" ? normalizePhoneNumber(rawValue) : normalizeEmail(rawValue);
      return Object.assign(
        {
          id: createId("ban"),
          type: type,
          value: normalizedValue,
          reason: "",
          active: true,
          createdAt: Date.now()
        },
        entry || {},
        {
          type: type,
          value: normalizedValue
        }
      );
    }).filter(function (entry) {
      return entry.value;
    }) : [];

    const emails = Array.from(new Set(
      entries.filter(function (entry) { return entry.type === "email" && entry.active !== false; }).map(function (entry) { return entry.value; })
        .concat((Array.isArray(source.emails) ? source.emails : []).map(normalizeEmail).filter(Boolean))
    ));
    const phones = Array.from(new Set(
      entries.filter(function (entry) { return entry.type === "phone" && entry.active !== false; }).map(function (entry) { return entry.value; })
        .concat((Array.isArray(source.phones) ? source.phones : []).map(normalizePhoneNumber).filter(Boolean))
    ));

    return {
      emails: emails,
      phones: phones,
      entries: entries
    };
  }

  function normalizeNotificationSettings(settings) {
    return Object.assign(
      {
        orders: true,
        messages: true,
        offers: true,
        payouts: true,
        admin: true
      },
      settings || {}
    );
  }

  function normalizePayoutSettings(settings, user) {
    const accountHolder = (user && user.name) || langText("Venditore IRIS", "IRIS seller");
    return Object.assign(
      {
        method: "bank_transfer",
        accountHolder: accountHolder,
        iban: "",
        paypalEmail: user && user.email ? user.email : "",
        cadence: langText("Settimanale", "Weekly"),
        status: "setup_required",
        nextPayoutAt: null,
        lastPayoutAt: null
      },
      settings || {}
    );
  }

  function normalizePhoneNumber(phone) {
    const raw = String(phone || "").trim();
    if (!raw) {
      return "";
    }
    const hasPlus = raw.charAt(0) === "+";
    const digits = raw.replace(/\D/g, "");
    return (hasPlus ? "+" : "") + digits;
  }

  function isValidPhoneNumber(phone) {
    const normalized = normalizePhoneNumber(phone);
    const digits = normalized.replace(/\D/g, "");
    return digits.length >= 8;
  }

  function normalizeShoppingPreferences(preferences) {
    return Object.assign(
      {
        preferredCurrency: getLocaleConfig().currency,
        authenticatedOnly: true,
        sizeAlerts: true,
        offerAlerts: true,
        savedSearchAlerts: true
      },
      preferences || {}
    );
  }

  function normalizeSizeProfile(profile) {
    return Object.assign(
      {
        tops: "M",
        bottoms: "30",
        shoes: "42",
        fit: langText("Regular", "Regular"),
        preferredBrands: ""
      },
      profile || {}
    );
  }

  function normalizeSavedSearchRecord(search) {
    const createdAt = Number((search && search.createdAt) || Date.now());
    return Object.assign(
      {
        id: createId("search"),
        label: langText("Ricerca salvata", "Saved search"),
        query: "",
        filtersSummary: "",
        createdAt: createdAt,
        alertsEnabled: true
      },
      search || {},
      {
        createdAt: createdAt
      }
    );
  }

  function normalizeSellingPreferences(preferences, user) {
    return Object.assign(
      {
        handlingModel: langText("Gestione standard", "Standard handling"),
        offerStrategy: langText("Valuta ogni offerta", "Review every offer"),
        shipFromCity: (user && user.city) || "",
        shipFromCountry: (user && user.country) || getWorkspaceDefaultCountry(),
        publicLocation: true,
        autoMessages: true
      },
      preferences || {}
    );
  }

  function normalizeVacationModeRecord(record) {
    return Object.assign(
      {
        enabled: false,
        returnDate: "",
        note: langText("Le spedizioni riprenderanno alla data indicata.", "Shipping resumes on the selected date.")
      },
      record || {}
    );
  }

  function normalizeListingPreferences(settings) {
    return Object.assign(
      {
        defaultCondition: langText("Ottime condizioni", "Very good"),
        defaultProcessingDays: "2",
        defaultShippingMethod: langText("Spedizione assicurata", "Insured shipping"),
        offersDefault: true
      },
      settings || {}
    );
  }

  function normalizePrivacySettings(settings) {
    return Object.assign(
      {
        profileVisibility: langText("Solo membri", "Members only"),
        showActivityStatus: true,
        allowMessageRequests: true,
        personalizedRecommendations: true
      },
      settings || {}
    );
  }

  function normalizeUserWorkspace(user) {
    const normalizedUser = Object.assign({}, user || {});
    normalizedUser.email = normalizeEmail(normalizedUser.email || "");
    normalizedUser.phone = normalizePhoneNumber(normalizedUser.phone || "");
    normalizedUser.addresses = Array.isArray(normalizedUser.addresses) ? normalizedUser.addresses : [];
    normalizedUser.paymentMethods = Array.isArray(normalizedUser.paymentMethods) ? normalizedUser.paymentMethods : [];
    normalizedUser.addresses = normalizedUser.addresses.map(function (address) {
      return normalizeAddressRecord(address, normalizedUser);
    });
    normalizedUser.paymentMethods = normalizedUser.paymentMethods.map(normalizePaymentMethodRecord);

    if (!normalizedUser.addresses.length) {
      normalizedUser.addresses = [
        normalizeAddressRecord(
          {
            label: langText("Casa", "Home"),
            city: normalizedUser.city || "",
            country: normalizedUser.country || getWorkspaceDefaultCountry(),
            isDefault: true
          },
          normalizedUser
        )
      ];
    }

    normalizedUser.payoutSettings = normalizePayoutSettings(normalizedUser.payoutSettings, normalizedUser);
    normalizedUser.security = normalizeSecurityRecord(normalizedUser.security);
    normalizedUser.verification = normalizeVerificationRecord(normalizedUser.verification, normalizedUser);
    normalizedUser.notificationSettings = normalizeNotificationSettings(normalizedUser.notificationSettings);
    normalizedUser.shoppingPreferences = normalizeShoppingPreferences(normalizedUser.shoppingPreferences);
    normalizedUser.sizeProfile = normalizeSizeProfile(normalizedUser.sizeProfile);
    normalizedUser.savedSearches = Array.isArray(normalizedUser.savedSearches) ? normalizedUser.savedSearches.map(normalizeSavedSearchRecord) : [];
    normalizedUser.sellingPreferences = normalizeSellingPreferences(normalizedUser.sellingPreferences, normalizedUser);
    normalizedUser.vacationMode = normalizeVacationModeRecord(normalizedUser.vacationMode);
    normalizedUser.listingPreferences = normalizeListingPreferences(normalizedUser.listingPreferences);
    normalizedUser.privacySettings = normalizePrivacySettings(normalizedUser.privacySettings);
    normalizedUser.accountStatus = normalizedUser.accountStatus || "active";
    normalizedUser.banReason = normalizedUser.banReason || "";
    normalizedUser.bannedAt = normalizedUser.bannedAt || null;
    return normalizedUser;
  }

  function normalizeOfferRecord(offer) {
    const createdAt = Number((offer && offer.createdAt) || Date.now());
    const legacyStatusMap = {
      sent: "pending",
      rejected: "declined"
    };
    const normalizedStatus = legacyStatusMap[(offer && offer.status) || "pending"] || ((offer && offer.status) || "pending");
    const normalizedAmount = Number((offer && (offer.offerAmount !== undefined ? offer.offerAmount : offer.amount)) || 0);
    return Object.assign(
      {
        id: createId("off"),
        listingId: null,
        productId: null,
        productName: langText("Articolo", "Item"),
        productBrand: "IRIS",
        buyerId: "",
        buyerEmail: "",
        buyerName: "",
        sellerId: "",
        sellerEmail: "",
        sellerName: "",
        offerAmount: 0,
        amount: 0,
        currency: getLocaleConfig().currency,
        status: "pending",
        createdAt: createdAt,
        updatedAt: createdAt,
        expiresAt: createdAt + 24 * 60 * 60 * 1000,
        paymentAuthorizationStatus: "payment_authorized",
        paymentIntentReference: "",
        authorizationReference: "",
        orderId: null,
        shippingSnapshot: null,
        paymentMethodSnapshot: null,
        minimumOfferAmount: null
      },
      offer || {},
      {
        listingId: (offer && (offer.listingId || offer.productId)) || null,
        productId: (offer && (offer.productId || offer.listingId)) || null,
        status: normalizedStatus,
        offerAmount: normalizedAmount,
        amount: normalizedAmount,
        buyerEmail: normalizeEmail((offer && offer.buyerEmail) || ""),
        sellerEmail: normalizeEmail((offer && offer.sellerEmail) || ""),
        createdAt: createdAt,
        updatedAt: Number((offer && offer.updatedAt) || createdAt),
        expiresAt: Number((offer && offer.expiresAt) || (createdAt + 24 * 60 * 60 * 1000))
      }
    );
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

  function sameEntityId(left, right) {
    return String(left) === String(right);
  }

  function inlineJsValue(value) {
    if (typeof value === "number") {
      return String(value);
    }
    return "'" + String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  }

  function buildListingSeller(listing) {
    const seller = Object.assign({}, (listing && listing.seller) || {});
    if (listing && listing.city && !seller.city) {
      seller.city = listing.city;
    }
    if (!seller.name) {
      seller.name = (listing && listing.ownerName) || langText("Venditore", "Seller");
    }
    if (listing && listing.ownerEmail && !seller.email) {
      seller.email = normalizeEmail(listing.ownerEmail);
    }
    if (!seller.id) {
      seller.id = "seller-" + slugify((seller.email || seller.name || "seller"));
    }
    if (!seller.avatar) seller.avatar = "👤";
    if (!Number.isFinite(Number(seller.rating))) seller.rating = 5;
    if (!Number.isFinite(Number(seller.sales))) seller.sales = 0;
    if (!seller.city) seller.city = getWorkspaceDefaultCountry();
    ensureSellerEmail(seller);
    seller.email = normalizeEmail(seller.email);
    return seller;
  }

  function getListingOriginalPrice(listing) {
    const price = Number((listing && listing.price) || 0);
    const rawOriginal = Number((listing && (listing.orig !== undefined ? listing.orig : listing.compareAt)) || 0);
    if (Number.isFinite(rawOriginal) && rawOriginal > 0) {
      return rawOriginal >= price ? rawOriginal : price;
    }
    return price;
  }

  function getListingDiscount(listing) {
    const price = Number((listing && listing.price) || 0);
    const originalPrice = getListingOriginalPrice(listing);
    return originalPrice > price && price > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
  }

  function getListingChips(listing) {
    if (Array.isArray(listing && listing.chips) && listing.chips.length) {
      return Array.from(new Set(listing.chips.filter(Boolean)));
    }
    return Array.from(new Set([
      listing && listing.cond,
      listing && listing.material,
      listing && listing.cat,
      listing && listing.subcategory,
      listing && listing.productType,
      listing && listing.sz
    ].filter(Boolean)));
  }

  function getOrderStatusLabel(orderOrStatus) {
    const status = typeof orderOrStatus === "string" ? orderOrStatus : (orderOrStatus && orderOrStatus.status) || "pending";
    const meta = ORDER_STATUS_META[status] || ORDER_STATUS_META.pending;
    return langText(meta.it, meta.en);
  }

  function isIrisNativeOrder(order) {
    if (!order) {
      return false;
    }
    return /^IRIS-/.test(String(order.number || "")) || /^RCPT-/.test(String(order.payment && order.payment.receiptNumber || ""));
  }

  function hasOpenOrderIssue(orderId) {
    return state.supportTickets.some(function (ticket) {
      return String(ticket.orderId || "") === String(orderId) && ticket.status !== "resolved";
    });
  }

  function getRelistableOrderItems(order) {
    if (!order || !state.currentUser) {
      return [];
    }
    if (normalizeEmail(order.buyerEmail) !== normalizeEmail(state.currentUser.email)) {
      return [];
    }
    if (!["delivered", "completed"].includes(order.status)) {
      return [];
    }
    if (!isIrisNativeOrder(order)) {
      return [];
    }
    if (["requested", "completed"].includes(String(order.payment && order.payment.refundStatus || "none"))) {
      return [];
    }
    if (["refund_requested", "refunded", "cancelled"].includes(order.status)) {
      return [];
    }
    if (hasOpenOrderIssue(order.id)) {
      return [];
    }
    return (order.items || []).filter(function (item) {
      return Boolean(item && item.productId);
    });
  }

  function getRelistSourceListing(orderItem) {
    if (!orderItem) {
      return null;
    }
    return getListingById(orderItem.productId) ||
      state.listings.find(function (candidate) { return String(candidate.id) === String(orderItem.productId); }) ||
      prods.find(function (candidate) { return String(candidate.id) === String(orderItem.productId); }) ||
      null;
  }

  function getExistingRelistListing(orderId, productId) {
    if (!state.currentUser) {
      return null;
    }
    return state.listings.find(function (listing) {
      return normalizeEmail(listing.ownerEmail) === normalizeEmail(state.currentUser.email) &&
        String(listing.relistSourceOrderId || "") === String(orderId) &&
        String(listing.relistSourceProductId || "") === String(productId) &&
        !["archived"].includes(String(listing.listingStatus || "")) &&
        !["archived", "sold"].includes(String(listing.inventoryStatus || ""));
    }) || null;
  }

  function inferOrderTimeline(createdAt, status) {
    const sequence = [
      { type: "order_created", label: langText("Ordine creato", "Order created"), states: ["pending", "paid", "awaiting_shipment", "shipped", "in_authentication", "dispatched_to_buyer", "delivered", "completed", "cancelled", "refund_requested", "refunded"] },
      { type: "payment_captured", label: langText("Pagamento confermato", "Payment confirmed"), states: ["paid", "awaiting_shipment", "shipped", "in_authentication", "dispatched_to_buyer", "delivered", "completed", "refund_requested", "refunded"] },
      { type: "awaiting_shipment", label: langText("Ordine pronto per la spedizione", "Order ready for shipment"), states: ["awaiting_shipment", "shipped", "in_authentication", "dispatched_to_buyer", "delivered", "completed", "refund_requested", "refunded"] },
      { type: "order_shipped", label: langText("Spedito al centro IRIS", "Shipped to IRIS hub"), states: ["shipped", "in_authentication", "dispatched_to_buyer", "delivered", "completed", "refund_requested", "refunded"] },
      { type: "order_authenticated", label: langText("In autenticazione", "In authentication"), states: ["in_authentication", "dispatched_to_buyer", "delivered", "completed", "refund_requested", "refunded"] },
      { type: "order_dispatched", label: langText("Spedito al buyer", "Dispatched to buyer"), states: ["dispatched_to_buyer", "delivered", "completed", "refund_requested", "refunded"] },
      { type: "order_delivered", label: langText("Ordine consegnato", "Order delivered"), states: ["delivered", "completed", "refund_requested", "refunded"] },
      { type: "order_completed", label: langText("Ordine completato", "Order completed"), states: ["completed"] },
      { type: "order_cancelled", label: langText("Ordine annullato", "Order cancelled"), states: ["cancelled"] },
      { type: "refund_requested", label: langText("Rimborso richiesto", "Refund requested"), states: ["refund_requested", "refunded"] },
      { type: "order_refunded", label: langText("Rimborso completato", "Refund completed"), states: ["refunded"] }
    ];

    return sequence
      .filter(function (step) { return step.states.includes(status || "pending"); })
      .map(function (step, index) {
        return {
          id: createId("evt"),
          type: step.type,
          at: createdAt + index * 1000,
          label: step.label
        };
      });
  }

  function isListingVerified(listing) {
    if (!listing) {
      return false;
    }
    if (typeof listing.verified === "boolean") {
      return listing.verified;
    }
    if (typeof listing.isVerified === "boolean") {
      return listing.isVerified;
    }
    if (typeof listing.authenticated === "boolean") {
      return listing.authenticated;
    }
    const authStatus = String(listing.authenticationStatus || listing.authStatus || "").toLowerCase();
    return ["verified", "authenticated", "approved"].includes(authStatus);
  }

  function normalizeListingRecord(listing) {
    const seller = buildListingSeller(listing || {});
    const price = Number((listing && listing.price) || 0);
    const originalPrice = getListingOriginalPrice(listing);
    const chips = getListingChips(listing);
    const categoryKey = (listing && listing.categoryKey) || inferSellCategoryKey(listing);
    const subcategoryKey = (listing && listing.subcategoryKey) || inferSellSubcategoryKey(listing, categoryKey);
    const productTypeKey = (listing && listing.productTypeKey) || inferSellTypeKey(listing, categoryKey, subcategoryKey);
    const measurements = listing && listing.measurements && typeof listing.measurements === "object"
      ? listing.measurements
      : null;
    const trustMeta = getListingTrustMeta(listing);
    const gender = inferListingGender(listing);

    return Object.assign(
      {
        price: price,
        orig: originalPrice,
        compareAt: originalPrice,
        chips: chips,
        emoji: (listing && listing.emoji) || "👜",
        desc: (listing && listing.desc) || "",
        fit: (listing && listing.fit) || "—",
        dims: (listing && listing.dims) || "",
        material: (listing && listing.material) || "",
        categoryKey: categoryKey,
        subcategory: (listing && listing.subcategory) || getSellSubcategoryLabel(categoryKey, subcategoryKey),
        subcategoryKey: subcategoryKey,
        productType: (listing && listing.productType) || getSellTypeLabel(categoryKey, subcategoryKey, productTypeKey),
        productTypeKey: productTypeKey,
        sizeOriginal: (listing && listing.sizeOriginal) || "",
        sizeSchema: inferSellSizeSchema(listing),
        image: (listing && listing.image) || "",
        images: getListingImageSources(listing),
        inventoryStatus: "active",
        listingStatus: "published",
        orderId: null,
        soldAt: null,
        offersEnabled: true,
        minimumOfferAmount: null,
        gender: gender,
        verifiedSeller: isVerifiedSellerProfile(seller),
        irisGuaranteed: trustMeta.guaranteed,
        certificateCode: trustMeta.certificateCode,
        authenticatedAt: trustMeta.authenticatedAt,
        ownerEmail: normalizeEmail(((listing && listing.ownerEmail) || seller.email)),
        relistSourceOrderId: null,
        relistSourceProductId: null,
        relistSourceListingId: null,
        relistSourceReceiptNumber: "",
        relistSourcePurchasedAt: null,
        relistSourceCertified: false,
        relistSourcePlatform: ""
      },
      listing,
      {
        price: price,
        orig: originalPrice,
        compareAt: originalPrice,
        chips: chips,
        ownerEmail: normalizeEmail(((listing && listing.ownerEmail) || seller.email)),
        offersEnabled: typeof listing.offersEnabled === "boolean" ? listing.offersEnabled : true,
        minimumOfferAmount: listing.minimumOfferAmount === null || listing.minimumOfferAmount === undefined || listing.minimumOfferAmount === ""
          ? null
          : Number(listing.minimumOfferAmount),
        categoryKey: categoryKey,
        cat: (listing && listing.cat) || getSellCategoryLabel(categoryKey),
        subcategory: (listing && listing.subcategory) || getSellSubcategoryLabel(categoryKey, subcategoryKey),
        subcategoryKey: subcategoryKey,
        productType: (listing && listing.productType) || getSellTypeLabel(categoryKey, subcategoryKey, productTypeKey),
        productTypeKey: productTypeKey,
        sizeOriginal: (listing && listing.sizeOriginal) || "",
        sizeSchema: inferSellSizeSchema(listing),
        verified: isListingVerified(listing),
        gender: (listing && listing.gender) || gender,
        verifiedSeller: listing && listing.verifiedSeller !== undefined ? Boolean(listing.verifiedSeller) : isVerifiedSellerProfile(seller),
        irisGuaranteed: listing && listing.irisGuaranteed !== undefined ? Boolean(listing.irisGuaranteed) : trustMeta.guaranteed,
        certificateCode: (listing && listing.certificateCode) || trustMeta.certificateCode,
        authenticatedAt: (listing && listing.authenticatedAt) || trustMeta.authenticatedAt,
        measurements: measurements,
        image: getListingImageSources(listing)[0] || "",
        images: getListingImageSources(listing),
        seller: seller
      }
    );
  }

  function normalizeOrderRecord(order) {
    const createdAt = Number(order.createdAt || Date.now());
    const statusAliases = {
      created: "pending",
      auth: "in_authentication",
      out_for_delivery: "dispatched_to_buyer"
    };
    const normalizedStatus = statusAliases[order.status] || order.status || "paid";
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
          shipmentStatus: normalizedStatus,
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
          payoutStatus: normalizedStatus === "completed" || normalizedStatus === "delivered" ? "ready" : "pending_shipment"
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
      chats.push(normalizeChatThread(thread));
    });
  }

  function normalizeChatMessageRecord(message) {
    const at = Number((message && message.at) || Date.now());
    return Object.assign(
      {
        id: createId("msg"),
        from: "them",
        text: "",
        time: formatDateTime(at),
        at: at,
        attachment: null
      },
      message || {},
      {
        at: at,
        time: (message && message.time) || formatDateTime(at)
      }
    );
  }

  function normalizeChatParticipant(participant, fallbackName, fallbackEmail) {
    return Object.assign(
      {
        id: createId("party"),
        name: fallbackName || langText("Member", "Member"),
        avatar: "👤",
        email: normalizeEmail(fallbackEmail || "")
      },
      participant || {},
      {
        email: normalizeEmail((participant && participant.email) || fallbackEmail || "")
      }
    );
  }

  function getThreadProduct(thread) {
    const listingId = thread && (thread.listingId || thread.productId || (thread.product && thread.product.id));
    return getListingById(listingId) || (thread && thread.product) || null;
  }

  function normalizeChatThread(thread) {
    const product = getThreadProduct(thread);
    const productSeller = product ? buildListingSeller(product) : {};
    const legacyParticipant = (thread && thread.with) || {};
    const legacyParticipantEmail = normalizeEmail(legacyParticipant.email || "");
    const storedSeller = (thread && thread.seller) || {};
    const storedBuyer = (thread && thread.buyer) || {};
    const explicitSellerEmail = normalizeEmail(
      (thread && thread.sellerEmail) ||
      (storedSeller && storedSeller.email) ||
      (product && (product.ownerEmail || (product.seller && product.seller.email))) ||
      ""
    );
    const sellerEmail = explicitSellerEmail || (legacyParticipantEmail && legacyParticipantEmail !== normalizeEmail((thread && thread.buyerEmail) || "") ? legacyParticipantEmail : "");
    const currentUserEmail = normalizeEmail((state.currentUser && state.currentUser.email) || "");
    const explicitBuyerEmail = normalizeEmail((thread && thread.buyerEmail) || (storedBuyer && storedBuyer.email) || "");
    const fallbackBuyerEmail = explicitBuyerEmail || (legacyParticipantEmail && legacyParticipantEmail !== sellerEmail ? legacyParticipantEmail : (sellerEmail && sellerEmail !== currentUserEmail ? currentUserEmail : ""));
    const messages = Array.isArray(thread && thread.msgs) ? thread.msgs.map(normalizeChatMessageRecord) : [];
    const lastMessage = messages[messages.length - 1];
    const updatedAt = Number((thread && thread.updatedAt) || (lastMessage && lastMessage.at) || Date.now());
    const sellerName = (thread && thread.sellerName) || storedSeller.name || productSeller.name || ((legacyParticipantEmail && legacyParticipantEmail === sellerEmail) ? legacyParticipant.name : "") || langText("Venditore", "Seller");
    const buyerName = (thread && thread.buyerName) || storedBuyer.name || ((legacyParticipantEmail && legacyParticipantEmail === fallbackBuyerEmail) ? legacyParticipant.name : "") || ((state.currentUser && fallbackBuyerEmail === currentUserEmail) ? state.currentUser.name : "") || langText("Acquirente", "Buyer");
    const sellerParticipant = normalizeChatParticipant(
      Object.assign({}, productSeller, storedSeller),
      sellerName,
      sellerEmail
    );
    const buyerParticipant = normalizeChatParticipant(
      storedBuyer,
      buyerName,
      fallbackBuyerEmail
    );
    const scope = !currentUserEmail
      ? "buying"
      : sellerEmail && sellerEmail === currentUserEmail
        ? "selling"
        : fallbackBuyerEmail && fallbackBuyerEmail === currentUserEmail
          ? "buying"
          : sellerEmail && sellerEmail !== currentUserEmail
            ? "buying"
            : "selling";
    return Object.assign(
      {
        id: createId("chat"),
        seller: sellerParticipant,
        buyer: buyerParticipant,
        with: scope === "selling" ? buyerParticipant : sellerParticipant,
        product: product,
        listingId: product ? product.id : ((thread && thread.listingId) || (thread && thread.productId) || null),
        productId: product ? product.id : ((thread && thread.productId) || (thread && thread.listingId) || null),
        sellerId: (thread && thread.sellerId) || sellerParticipant.id || "",
        sellerEmail: sellerEmail,
        sellerName: sellerName,
        buyerId: (thread && thread.buyerId) || buyerParticipant.id || fallbackBuyerEmail || "",
        buyerEmail: fallbackBuyerEmail,
        buyerName: buyerName,
        msgs: messages,
        unreadCount: Number((thread && thread.unreadCount) || 0),
        updatedAt: updatedAt
      },
      thread || {},
      {
        seller: sellerParticipant,
        buyer: buyerParticipant,
        with: scope === "selling" ? buyerParticipant : sellerParticipant,
        product: product,
        listingId: product ? product.id : ((thread && thread.listingId) || (thread && thread.productId) || null),
        productId: product ? product.id : ((thread && thread.productId) || (thread && thread.listingId) || null),
        sellerEmail: sellerEmail,
        sellerName: sellerName,
        buyerEmail: fallbackBuyerEmail,
        buyerName: buyerName,
        msgs: messages,
        unreadCount: Number((thread && thread.unreadCount) || 0),
        updatedAt: updatedAt
      }
    );
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

    if (Array.isArray(prods)) {
      prods.forEach(function (product, index) {
        const normalizedProduct = normalizeListingRecord(product);
        prods[index] = normalizedProduct;
        if (normalizedProduct.seller && !sellers.some(function (seller) { return sameEntityId(seller.id, normalizedProduct.seller.id); })) {
          sellers.push(normalizedProduct.seller);
        }
      });
    }

    state.users = state.users.map(function (user) {
      return normalizeUserWorkspace(Object.assign({}, user, {
        email: normalizeEmail(user.email),
        role: user.role || deriveUserRole(user.email)
      }));
    });
    saveJson(STORAGE_KEYS.users, state.users);
    state.banRegistry = normalizeBanRegistry(state.banRegistry);
    persistBanRegistry();

    state.listings = state.listings.map(normalizeListingRecord);
    state.orders = state.orders.map(normalizeOrderRecord);
    state.offers = state.offers.map(normalizeOfferRecord);
    state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
    state.emailOutbox = Array.isArray(state.emailOutbox) ? state.emailOutbox : [];
    state.supportTickets = Array.isArray(state.supportTickets) ? state.supportTickets : [];
    state.measurementRequests = Array.isArray(state.measurementRequests) ? state.measurementRequests : [];
    state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];
    state.reviews = Array.isArray(state.reviews) ? state.reviews : [];

    if (state.currentUser) {
      state.currentUser = normalizeUserWorkspace(Object.assign({}, state.currentUser, {
        email: normalizeEmail(state.currentUser.email),
        role: state.currentUser.role || deriveUserRole(state.currentUser.email)
      }));
      if (state.currentUser.accountStatus === "banned" || getBlockedIdentityMessage(state.currentUser.email, state.currentUser.phone)) {
        state.currentUser = null;
      }
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
    saveJson(STORAGE_KEYS.offers, state.offers);
    saveJson(STORAGE_KEYS.notifications, state.notifications);
    saveJson(STORAGE_KEYS.emailOutbox, state.emailOutbox);
    saveJson(STORAGE_KEYS.supportTickets, state.supportTickets);
    saveJson(STORAGE_KEYS.measurementRequests, state.measurementRequests);
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
      empty_cart: "Il carrello è vuoto. Esplora lo shop e aggiungi i pezzi che vuoi acquistare.",
      cart_total: "Totale",
      continue_shopping: "Continua a esplorare",
      checkout_title: "Checkout",
      checkout_sub: "Inserisci i dati di spedizione e conferma l'ordine.",
      order_summary: "Riepilogo ordine",
      shipping_name: "Nome e cognome",
      shipping_address: "Indirizzo",
      shipping_city: "Città",
      shipping_country: "Paese",
      shipping_note: "Note per il corriere",
      confirm_order: "Conferma ordine",
      auth_title_login: "Bentornata su IRIS",
      auth_title_register: "Crea il tuo account",
      auth_sub_login: "Accedi per chattare, comprare e pubblicare i tuoi articoli.",
      auth_sub_register: "Crea il tuo account IRIS per comprare, vendere e salvare i tuoi preferiti.",
      auth_cta_login: "Entra nel tuo account",
      auth_cta_register: "Crea account",
      full_name: "Nome completo",
      email: "Email",
      password: "Password",
      auth_switch_login: "Hai già un account?",
      auth_switch_register: "Non hai ancora un account?",
      cart_items: "articoli",
      manual_payment_note: "Questo checkout funziona lato interfaccia e salva l'ordine nel browser. Per pagamenti reali serve collegare Stripe o un backend.",
      publish_success: "Annuncio pubblicato con successo.",
      publish_error: "Completa tutti i campi obbligatori e aggiungi almeno una foto.",
      photos_ready: "Foto pronte. Verranno salvate in versione ottimizzata nel browser.",
      my_listings: "I tuoi annunci",
      my_orders: "I tuoi ordini",
      profile_guest_title: "Accedi o registrati per gestire il tuo account",
      profile_guest_body: "Accedi o registrati per gestire il tuo account.",
      sign_in_to_continue: "Accedi per continuare",
      checkout_success: "Ordine registrato con successo.",
      login_success: "Accesso effettuato.",
      logout_success: "Sessione chiusa.",
      register_success: "Account creato con successo.",
      remove: "Rimuovi",
      qty: "Quantità",
      cart_open: "Apri carrello",
      account_area: "AREA ACCOUNT",
      profile_nav: "Profilo",
      profile_details: "Dati profilo",
      save_profile: "Salva profilo",
      profile_saved: "Profilo aggiornato.",
      profile_city: "Città",
      profile_country: "Paese",
      profile_bio: "Bio",
      favorites_section: "Preferiti",
      no_orders_yet: "Nessun ordine ancora.",
      no_favorites_yet: "Non hai ancora preferiti salvati.",
      account_summary: "Panoramica account",
      sell_status_idle: "Pubblica un annuncio con foto reali, dettagli e prezzo.",
      sell_status_ready: "Le foto sono state caricate e il form è pronto.",
      sell_status_auth: "Per pubblicare davvero serve autenticarti.",
      shipping: "Spedizione",
      prototype_mode: "ACQUISTO SICURO · IRIS",
      search_short: "Ricerca",
      size_placeholder: "es. M, 42, 30cm...",
      price_min: "Min",
      price_max: "Max",
      dimensions: "Dimensioni",
      material: "Materiale",
      not_available: "N/A",
      profile_area_account: "AREA ACCOUNT",
      profile_area_buyer: "AREA ACQUISTI",
      profile_area_seller: "AREA VENDITE",
      overview: "Panoramica",
      preferences: "Preferenze",
      my_size: "Le mie taglie",
      saved_searches: "Ricerche salvate",
      selling_preferences: "Preferenze vendita",
      location: "Posizione",
      vacation_mode: "Modalità vacanza",
      listing_preferences: "Preferenze annunci",
      shipping_protection: "Spedizione e protezione",
      accessibility_statement: "Accessibilità",
      your_listings: "I tuoi annunci",
      identity_verification: "Verifica identità",
      quick_support: "Supporto rapido",
      notification_settings: "Impostazioni notifiche",
      payout_settings: "Impostazioni pagamento",
      size_profile: "Profilo taglie",
      shipping_method_label: "Metodo",
      trust_label: "Garanzia",
      insured_tracked: "Assicurata e tracciata",
      auth_queue_prepared: "In coda per autenticazione",
      learn_more: "SCOPRI DI PIÙ"
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
      auth_sub_register: "Create your IRIS account to buy, sell and save your favorites.",
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
      prototype_mode: "SECURE CHECKOUT · IRIS",
      search_short: "Search",
      size_placeholder: "e.g. M, 42, 30cm...",
      price_min: "Min",
      price_max: "Max",
      dimensions: "Dimensions",
      material: "Material",
      not_available: "N/A",
      profile_area_account: "Account area",
      profile_area_buyer: "Buyer area",
      profile_area_seller: "Seller area",
      overview: "Overview",
      preferences: "Preferences",
      my_size: "My Size",
      saved_searches: "Saved searches",
      selling_preferences: "Selling preferences",
      location: "Location",
      vacation_mode: "Vacation mode",
      listing_preferences: "Listing preferences",
      shipping_protection: "Shipping and Protection",
      accessibility_statement: "Accessibility Statement",
      your_listings: "Your listings",
      identity_verification: "Verification",
      quick_support: "Quick support",
      notification_settings: "Notification settings",
      payout_settings: "Payout settings",
      size_profile: "Size profile",
      shipping_method_label: "Shipping method",
      trust_label: "Trust",
      insured_tracked: "Insured and tracked",
      auth_queue_prepared: "Authentication queue prepared",
      learn_more: "Learn more"
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
        "<div class=\"irisx-modal\" id=\"irisxAuthModal\" role=\"dialog\" aria-modal=\"true\"></div>" +
          "<div class=\"irisx-drawer\" id=\"irisxCartDrawer\" role=\"dialog\" aria-modal=\"true\"></div>" +
          "<div class=\"irisx-modal\" id=\"irisxCheckoutModal\" role=\"dialog\" aria-modal=\"true\"></div>" +
          "<div class=\"irisx-modal\" id=\"irisxOrderModal\" role=\"dialog\" aria-modal=\"true\"></div>" +
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

  function ensureSellTaxonomyUi(preservedValues) {
    const categorySelect = qs("#sf-cat");
    const subcategorySelect = qs("#sf-subcat");
    const typeSelect = qs("#sf-type");
    const sizeSelect = qs("#sf-size");
    const sizeOriginalField = qs("#sf-size-original");
    const sizeLabel = qs("#sf-size-label");
    const sizeOriginalLabel = qs("#sf-size-original-label");
    const sizeHint = qs("#irisxSizeHint");
    const taxonomyHint = qs("#irisxSellTaxonomyHint");
    const subcategoryLabel = qs("#sf-subcat-label");
    const typeLabel = qs("#sf-type-label");
    const dimensionsLabel = qs("#sf-dims-label");
    const dimensionsField = qs("#sf-dims");
    const fitSelect = qs("#sf-fit");
    const measurementValues = preservedValues && preservedValues.measurements !== undefined
      ? preservedValues.measurements
      : collectVisibleMeasurements();
    if (!categorySelect || !subcategorySelect || !typeSelect || !sizeSelect) {
      return;
    }

    const categoryValue = preservedValues && preservedValues.categoryKey !== undefined ? preservedValues.categoryKey : categorySelect.value;
    syncSelectOptions(
      categorySelect,
      buildOptionList(Object.keys(SELL_TAXONOMY).map(function (key) {
        return Object.assign({ id: key }, SELL_TAXONOMY[key]);
      })),
      langText("Seleziona categoria", "Select category"),
      categoryValue
    );

    const categoryKey = categorySelect.value;
    const category = getSellCategoryDefinition(categoryKey);
    const subcategoryValue = preservedValues && preservedValues.subcategoryKey !== undefined ? preservedValues.subcategoryKey : subcategorySelect.value;
    const subcategoryOptions = category
      ? buildOptionList(Object.keys(category.subcategories).map(function (key) {
          return Object.assign({ id: key }, category.subcategories[key]);
        }))
      : [];
    syncSelectOptions(subcategorySelect, subcategoryOptions, langText("Seleziona sottocategoria", "Select subcategory"), subcategoryValue);

    const subcategoryKey = subcategorySelect.value;
    const subcategory = getSellSubcategoryDefinition(categoryKey, subcategoryKey);
    const typeValue = preservedValues && preservedValues.typeKey !== undefined ? preservedValues.typeKey : typeSelect.value;
    const typeOptions = subcategory && Array.isArray(subcategory.types) ? buildOptionList(subcategory.types) : [];
    syncSelectOptions(typeSelect, typeOptions, langText("Seleziona tipo", "Select type"), typeValue);

    const sizeMode = getResolvedSellSizeMode(categoryKey, subcategoryKey);
    const sizeValue = preservedValues && preservedValues.size !== undefined ? preservedValues.size : sizeSelect.value;
    syncSelectOptions(sizeSelect, getSellSizeOptions(sizeMode), langText("Seleziona taglia", "Select size"), sizeValue);

    if (subcategoryLabel) subcategoryLabel.textContent = `${langText("Sottocategoria", "Subcategory")} *`;
    if (typeLabel) typeLabel.textContent = langText("Tipo", "Type");
    if (taxonomyHint) {
      taxonomyHint.textContent = category
        ? getTaxonomyLabel(category.hint)
        : langText("Scegli prima la categoria: da li il form vincola sottocategoria, taglia e campi compatibili.", "Pick a category first: then the form constrains subcategory, size, and compatible fields.");
    }

    if (sizeLabel) {
      if (sizeMode === "eu_shoes") {
        sizeLabel.textContent = `${langText("Taglia EU", "EU size")} *`;
      } else if (sizeMode === "belt") {
        sizeLabel.textContent = `${langText("Taglia cintura", "Belt size")} *`;
      } else if (sizeMode === "alpha") {
        sizeLabel.textContent = `${langText("Taglia standard", "Standard size")} *`;
      } else {
        sizeLabel.textContent = langText("Taglia", "Size");
      }
    }

    if (sizeOriginalLabel) {
      sizeOriginalLabel.textContent = langText("Taglia etichetta originale", "Original label size");
    }
    if (sizeOriginalField) {
      sizeOriginalField.placeholder = sizeMode === "eu_shoes"
        ? langText("es. US 9 / UK 8", "e.g. US 9 / UK 8")
        : sizeMode === "belt"
          ? langText("es. 90 / 95", "e.g. 90 / 95")
          : langText("es. 2, 48, L", "e.g. 2, 48, L");
    }

    if (sizeHint) {
      if (sizeMode === "eu_shoes") {
        sizeHint.textContent = langText("Seleziona una taglia EU per i filtri. Se l'etichetta riporta US o UK, scrivila nel campo originale.", "Pick an EU size for filters. If the label says US or UK, add it in the original size field.");
      } else if (sizeMode === "belt") {
        sizeHint.textContent = langText("Per le cinture usiamo una misura standard in cm. Eventuali codici brand restano nel campo originale.", "Belts use a standard measurement in cm. Brand-specific codes can stay in the original size field.");
      } else if (sizeMode === "alpha") {
        sizeHint.textContent = langText("Usa una taglia standard per il catalogo. Se il brand usa 1/2/3 o altre sigle, scrivile nel campo originale.", "Use a standard catalog size. If the brand uses 1/2/3 or other codes, add them in the original size field.");
      } else {
        sizeHint.textContent = langText("Per questa categoria lavoriamo senza una taglia moda classica.", "This category does not use a classic fashion size.");
      }
    }

    if (dimensionsLabel) {
      dimensionsLabel.textContent = category ? getTaxonomyLabel(category.dimensionsLabel) : t("dimensions");
    }
    if (dimensionsField) {
      dimensionsField.placeholder = category
        ? getTaxonomyLabel(category.dimensionsPlaceholder)
        : t("size_placeholder");
    }

    setSellFieldVisibility("#irisxTypeGroup", typeOptions.length > 0);
    setSellFieldVisibility("#irisxFitGroup", Boolean(category && category.fitEnabled));
    setSellFieldVisibility("#irisxSizeGroup", sizeMode !== "one_size");
    setSellFieldVisibility("#irisxSizeOriginalGroup", ["alpha", "eu_shoes", "belt"].includes(sizeMode));
    renderSellMeasurementFields(categoryKey, subcategoryKey, measurementValues);

    if (fitSelect && !(category && category.fitEnabled)) {
      fitSelect.value = "—";
    }
    if (sizeOriginalField && !["alpha", "eu_shoes", "belt"].includes(sizeMode)) {
      sizeOriginalField.value = "";
    }
    if (sizeMode === "one_size") {
      sizeSelect.value = "one_size";
    }
  }

  function handleSellTaxonomyChange(scope) {
    const nextValues = {
      categoryKey: qs("#sf-cat") ? qs("#sf-cat").value : "",
      subcategoryKey: qs("#sf-subcat") ? qs("#sf-subcat").value : "",
      typeKey: qs("#sf-type") ? qs("#sf-type").value : "",
      size: qs("#sf-size") ? qs("#sf-size").value : ""
    };
    if (scope === "category") {
      nextValues.subcategoryKey = "";
      nextValues.typeKey = "";
      nextValues.size = "";
      if (qs("#sf-size-original")) qs("#sf-size-original").value = "";
    }
    if (scope === "subcategory") {
      nextValues.typeKey = "";
      nextValues.size = "";
      if (qs("#sf-size-original")) qs("#sf-size-original").value = "";
    }
    ensureSellTaxonomyUi(nextValues);
  }

  function collectSellTaxonomySelection() {
    const categoryKey = readSellField("#sf-cat");
    const category = getSellCategoryDefinition(categoryKey);
    if (!category) {
      return {
        ok: false,
        error: langText("Scegli una categoria valida.", "Choose a valid category.")
      };
    }

    const subcategoryKey = readSellField("#sf-subcat");
    const subcategory = getSellSubcategoryDefinition(categoryKey, subcategoryKey);
    if (!subcategory) {
      return {
        ok: false,
        error: langText("Scegli una sottocategoria coerente.", "Choose a matching subcategory.")
      };
    }

    const typeOptions = subcategory && Array.isArray(subcategory.types) ? subcategory.types : [];
    const typeKey = readSellField("#sf-type");
    const type = typeOptions.find(function (item) { return item.id === typeKey; }) || null;
    if (typeOptions.length && !type) {
      return {
        ok: false,
        error: langText("Seleziona il tipo di articolo.", "Select the item type.")
      };
    }

    const sizeMode = getResolvedSellSizeMode(categoryKey, subcategoryKey);
    const sizeValue = readSellField("#sf-size");
    if (["alpha", "eu_shoes", "belt"].includes(sizeMode) && !sizeValue) {
      return {
        ok: false,
        error: sizeMode === "eu_shoes"
          ? langText("Inserisci una taglia EU valida.", "Choose a valid EU size.")
          : langText("Inserisci una taglia valida.", "Choose a valid size.")
      };
    }

    return {
      ok: true,
      categoryKey: categoryKey,
      categoryLabel: getSelectedOptionLabel("#sf-cat") || getTaxonomyLabel(category),
      subcategoryKey: subcategoryKey,
      subcategoryLabel: getSelectedOptionLabel("#sf-subcat") || getTaxonomyLabel(subcategory),
      typeKey: type ? type.id : "",
      typeLabel: type ? (getSelectedOptionLabel("#sf-type") || getTaxonomyLabel(type)) : "",
      sizeMode: sizeMode,
      sizeDisplay: sizeMode === "one_size"
        ? langText("Taglia unica", "One size")
        : sizeMode === "eu_shoes" && sizeValue
          ? `EU ${sizeValue}`
          : sizeValue,
      sizeOriginal: readSellField("#sf-size-original"),
      fit: category.fitEnabled ? (readSellField("#sf-fit") || "Regular") : "—",
      emoji: getSellEmojiForTaxonomy(categoryKey, subcategoryKey)
    };
  }

  function injectSellHelpers() {
    const fileInput = qs("#fileIn");
    if (fileInput && !qs("#sellPreviewGrid")) {
      fileInput.insertAdjacentHTML(
        "afterend",
        "<div class=\"irisx-photo-grid\" id=\"sellPreviewGrid\"></div><div class=\"irisx-status\" id=\"sellStatus\"></div>"
      );
    }
    ensureSellTaxonomyUi();
    ensureOfferSellerControls();

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
    const editorialProduct = featured.find(function (product) {
      return Array.isArray(product.images) && product.images.length;
    }) || featured[0] || null;
    const proofText = (copy.buyPoints && copy.buyPoints[0]) || copy.featuredNote || copy.text;
    const trustItems = [
      {
        glyph: "auth",
        label: (copy.buyPoints && copy.buyPoints[0]) || langText("100% Autenticato", "100% Authenticated")
      },
      {
        glyph: "shipping",
        label: (copy.buyPoints && copy.buyPoints[1]) || langText("Spedizione protetta", "Protected shipping")
      },
      {
        glyph: "payment",
        label: (copy.buyPoints && copy.buyPoints[2]) || langText("Pagamento garantito", "Guaranteed payment")
      }
    ];

    container.innerHTML = `
      <div class="irisx-home-shell">
        <section class="irisx-home-hero irisx-reveal-section">
          <video class="irisx-hero-video" id="heroVid" autoplay muted loop playsinline preload="auto">
            <source src="https://videos.pexels.com/video-files/6649983/6649983-hd_2048_1080_25fps.mp4" type="video/mp4">
            <source src="https://videos.pexels.com/video-files/7677253/7677253-hd_1920_1080_25fps.mp4" type="video/mp4">
          </video>
          <div class="irisx-hero-lux"><div class="irisx-hero-shine"></div></div>
          <div class="irisx-home-copy">
            <div class="irisx-home-kicker">${escapeHtml(copy.kicker || "IRIS")}</div>
            <div class="irisx-home-rule"></div>
            <h1 class="irisx-home-title">${escapeHtml(copy.title).replace(/\n/g, "<br>")}</h1>
            <div class="irisx-home-proof">${escapeHtml(proofText)}</div>
            <div class="irisx-home-actions">
              <button class="irisx-home-action primary" onclick="showBuyView('shop')">${escapeHtml(copy.primaryCta)}</button>
              <button class="irisx-home-action secondary" onclick="showPage('sell')">${escapeHtml(copy.secondaryCta)}</button>
            </div>
          </div>
          <button class="irisx-home-scroll" aria-label="${escapeHtml(langText("Scorri", "Scroll"))}" onclick="document.getElementById('irisTrustBar') && document.getElementById('irisTrustBar').scrollIntoView({behavior:'smooth',block:'start'})"></button>
        </section>

        <section class="irisx-home-trust irisx-reveal-section" id="irisTrustBar">
          ${trustItems.map(function (item) {
            return `<div class="irisx-home-trust-item">
              <span class="irisx-home-trust-glyph irisx-home-trust-glyph--${escapeHtml(item.glyph)}" aria-hidden="true"></span>
              <strong>${escapeHtml(item.label)}</strong>
            </div>`;
          }).join("")}
        </section>

        <section class="irisx-home-manifesto irisx-reveal-section" id="irisManifesto">
          <figure class="irisx-home-editorial">
            ${editorialProduct && Array.isArray(editorialProduct.images) && editorialProduct.images[0]
              ? `<img src="${editorialProduct.images[0]}" alt="${escapeHtml(editorialProduct.brand + " " + editorialProduct.name)}">`
              : `<div class="irisx-home-editorial-fallback"><span>IRIS</span></div>`}
          </figure>
          <article class="irisx-home-manifesto-copy">
            <div class="irisx-home-section-kicker">${escapeHtml(copy.sectionKicker || "IRIS edit")}</div>
            <div class="irisx-home-section-title">${escapeHtml(copy.featuredTitle)}</div>
            <p>${escapeHtml(copy.text)}</p>
            <button class="irisx-home-link" onclick="openStatic('about')">${escapeHtml(langText("Scopri chi siamo", "Discover who we are"))}</button>
          </article>
        </section>

        <section class="irisx-home-process irisx-reveal-section">
          <div class="irisx-home-section-kicker">${escapeHtml(copy.sectionKicker || "IRIS edit")}</div>
          <div class="irisx-home-section-title">${escapeHtml(langText("Come funziona", "How it works"))}</div>
          <div class="irisx-home-process-grid">
            <article class="irisx-home-process-card">
              <h3>${escapeHtml(copy.buyTitle)}</h3>
              <p>${escapeHtml(copy.buyText)}</p>
              <ul>${(copy.buyPoints || []).map(function (point) { return `<li>${escapeHtml(point)}</li>`; }).join("")}</ul>
              <button class="irisx-home-link" onclick="showBuyView('shop')">${escapeHtml(langText("Esplora", "Explore"))}</button>
            </article>
            <article class="irisx-home-process-card">
              <h3>${escapeHtml(copy.sellTitle)}</h3>
              <p>${escapeHtml(copy.sellText)}</p>
              <ul>${(copy.sellPoints || []).map(function (point) { return `<li>${escapeHtml(point)}</li>`; }).join("")}</ul>
              <button class="irisx-home-link" onclick="showPage('sell')">${escapeHtml(langText("Scopri il servizio", "Discover the service"))}</button>
            </article>
          </div>
        </section>

        <section class="irisx-home-featured irisx-reveal-section">
          <div class="irisx-home-featured-head">
            <div>
              <div class="irisx-home-section-kicker">${escapeHtml(copy.sectionKicker || "IRIS edit")}</div>
              <div class="irisx-home-section-title">${escapeHtml(copy.featuredTitle)}</div>
            </div>
            <div class="irisx-home-section-note">${escapeHtml(copy.featuredNote)}</div>
          </div>
          <div class="irisx-home-grid">
            ${featured.map(function (product) { return productCardMarkup(product); }).join("")}
          </div>
        </section>
      </div>`;

    // Fade in hero video when ready
    var hv = document.getElementById("heroVid");
    if (hv) {
      hv.load();
      hv.playbackRate = 0.78;
      hv.addEventListener("canplay", function() { hv.classList.add("on"); }, { once: true });
      setTimeout(function() { if (hv && !hv.classList.contains("on")) hv.classList.add("on"); }, 2000);
    }
    bindLuxuryReveal();
  }

  var luxuryRevealObserver = null;

  function bindLuxuryReveal() {
    const sections = qsa(".irisx-reveal-section");
    if (!sections.length) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      sections.forEach(function (section) {
        section.classList.add("is-visible");
      });
      return;
    }

    if (!luxuryRevealObserver) {
      luxuryRevealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
    }

    sections.forEach(function (section) {
      if (section.classList.contains("is-visible")) {
        return;
      }
      luxuryRevealObserver.observe(section);
    });
  }

  function setActiveNav(view) {
    qsa("[data-nav-view]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-nav-view") === view);
    });
    syncProfileMenuState(undefined, view);
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

  function bumpViewSyncToken() {
    state.viewSyncToken = Number(state.viewSyncToken || 0) + 1;
    return state.viewSyncToken;
  }

  function syncTopnavChrome(view) {
    const topnav = qs("#topnav");
    const mobileTrigger = qs("#tnMobileToggle");
    const searchWrap = qs("#topnav .tn-search");
    const autocomplete = qs("#acDropdown");
    const activeView = view || getCurrentReturnView();
    const showSearch = window.innerWidth > 900 ? true : activeView === "shop";

    if (topnav) {
      topnav.classList.toggle("irisx-search-hidden", !showSearch);
    }
    if (searchWrap) {
      searchWrap.style.display = showSearch ? "" : "none";
      searchWrap.setAttribute("aria-hidden", showSearch ? "false" : "true");
    }
    if (autocomplete) {
      autocomplete.style.display = showSearch ? "" : "none";
      if (!showSearch) {
        autocomplete.classList.remove("open");
      }
    }
    if (mobileTrigger) {
      mobileTrigger.setAttribute("aria-expanded", qs("#tnMobileMenu") && qs("#tnMobileMenu").classList.contains("open") ? "true" : "false");
    }
  }

  function closeMobileFilters() {
    const panel = qs("#filtersPanel");
    if (panel) {
      panel.classList.remove("open");
    }
    document.body.classList.remove("irisx-filters-open");
  }

  function toggleMobileFilters(forceOpen) {
    const panel = qs("#filtersPanel");
    if (!panel) {
      return;
    }
    const willOpen = typeof forceOpen === "boolean" ? forceOpen : !panel.classList.contains("open");
    panel.classList.toggle("open", willOpen);
    document.body.classList.toggle("irisx-filters-open", willOpen);
  }

  function setNodeText(selector, value) {
    const node = qs(selector);
    if (node) {
      node.textContent = value;
    }
  }

  function setButtonLabelWithBadge(selector, label, badgeId) {
    const node = qs(selector);
    if (!node) {
      return;
    }
    const badge = badgeId ? qs("#" + badgeId) : null;
    if (badge) {
      node.innerHTML = `${escapeHtml(label)} <span class="badge" id="${badgeId}" style="${badge.style.cssText || "display:none"}">${escapeHtml(badge.textContent || "0")}</span>`;
      return;
    }
    node.textContent = label;
  }

  function syncNavigationLabels() {
    const locale = getLocaleConfig();
    const themeLabel = darkMode
      ? langText("Tema scuro", "Dark mode")
      : langText("Tema chiaro", "Light mode");

    setNodeText("#tnHomeBtn", langText("Home", "Home"));
    setNodeText("#tnShopBtn", langText("Shop", "Shop"));
    setNodeText("#tnAboutBtn", langText("Chi siamo", "About us"));

    setNodeText("#tnMenuProfileBtn", langText("Profilo", "Profile"));
    setButtonLabelWithBadge("#tnMenuFavBtn", langText("Preferiti", "Favorites"), "fav-badge");
    setButtonLabelWithBadge("#tnMenuChatBtn", langText("Messaggi", "Messages"), "chat-badge");
    setNodeText("#modeToggle", themeLabel);

    setNodeText("#tnMobileHomeBtn", langText("Home", "Home"));
    setNodeText("#tnMobileShopBtn", langText("Shop", "Shop"));
    setNodeText("#tnMobileAboutBtn", langText("Chi siamo", "About us"));
    setNodeText("#tnMobileProfileBtn", langText("Profilo", "Profile"));
    setNodeText("#tnMobileFavBtn", langText("Preferiti", "Favorites"));
    setNodeText("#tnMobileChatBtn", langText("Messaggi", "Messages"));
    setNodeText("#tnMobileCartBtn", langText("Carrello", "Cart"));
    setNodeText("#tnMobileSellBtn", langText("Vendi", "Sell"));
    setNodeText("#tnMobileThemeBtn", themeLabel);
    syncLocaleTrigger();
  }

  function syncProfileMenuState(forceOpen, activeViewOverride) {
    const menu = qs("#tnProfileMenu");
    const trigger = qs("#tnProfileTrigger");
    const currentView = activeViewOverride || getCurrentReturnView();
    const isProfileContext = ["profile", "fav", "chat"].includes(currentView);
    const isOpen = typeof forceOpen === "boolean"
      ? forceOpen
      : !!(menu && menu.classList.contains("open"));

    if (menu) {
      menu.classList.toggle("open", isOpen);
    }

    if (trigger) {
      trigger.classList.toggle("is-open", isOpen);
      trigger.classList.toggle("active", isOpen || isProfileContext);
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      trigger.setAttribute("aria-pressed", isOpen || isProfileContext ? "true" : "false");
    }

    [
      ["#tnMenuProfileBtn", "profile"],
      ["#tnMenuFavBtn", "fav"],
      ["#tnMenuChatBtn", "chat"]
    ].forEach(function (entry) {
      const button = qs(entry[0]);
      if (!button) {
        return;
      }
      const isActive = entry[1] === currentView;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  function closeProfileMenu() {
    syncProfileMenuState(false);
  }

  function toggleProfileMenu() {
    const menu = qs("#tnProfileMenu");
    const trigger = qs("#tnProfileTrigger");
    if (!menu || !trigger) {
      return;
    }
    closeMobileNav();
    syncProfileMenuState(!menu.classList.contains("open"));
  }

  function closeMobileNav() {
    const menu = qs("#tnMobileMenu");
    const trigger = qs("#tnMobileToggle");
    if (menu) {
      menu.classList.remove("open");
    }
    if (trigger) {
      trigger.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
    document.body.classList.remove("irisx-mobile-menu-open");
  }

  function toggleMobileNav() {
    const menu = qs("#tnMobileMenu");
    const trigger = qs("#tnMobileToggle");
    if (!menu || !trigger) {
      return;
    }
    closeProfileMenu();
    closeLocaleMenu();
    const willOpen = !menu.classList.contains("open");
    menu.classList.toggle("open", willOpen);
    trigger.classList.toggle("is-open", willOpen);
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    document.body.classList.toggle("irisx-mobile-menu-open", willOpen);
  }

  function bindShellMenus() {
    window.addEventListener("resize", function () {
      syncTopnavChrome();
    });
    document.addEventListener("click", function (event) {
      const profileMenu = qs("#tnProfileMenu");
      const profileTrigger = qs("#tnProfileTrigger");
      if (
        profileMenu &&
        profileTrigger &&
        profileMenu.classList.contains("open") &&
        !profileMenu.contains(event.target) &&
        !profileTrigger.contains(event.target)
      ) {
        closeProfileMenu();
      }
      const localeMenu = qs("#tnLocaleMenu");
      const localeTrigger = qs("#tnLocaleTrigger");
      if (
        localeMenu &&
        localeTrigger &&
        localeMenu.classList.contains("open") &&
        !localeMenu.contains(event.target) &&
        !localeTrigger.contains(event.target)
      ) {
        closeLocaleMenu();
      }
      const mobileMenu = qs("#tnMobileMenu");
      const mobileToggle = qs("#tnMobileToggle");
      const mobilePanel = qs(".tn-mobile-menu__panel");
      if (
        mobileMenu &&
        mobileMenu.classList.contains("open") &&
        !mobilePanel.contains(event.target) &&
        !mobileToggle.contains(event.target)
      ) {
        closeMobileNav();
      }
      const filtersPanel = qs("#filtersPanel");
      if (
        filtersPanel &&
        filtersPanel.classList.contains("open") &&
        !filtersPanel.contains(event.target) &&
        !event.target.closest(".mob-filter-btn")
      ) {
        closeMobileFilters();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeProfileMenu();
        closeLocaleMenu();
        closeMobileNav();
        closeMobileFilters();
      }
    });

    window.toggleMobileFilters = toggleMobileFilters;
    window.closeMobileFilters = closeMobileFilters;
  }

  function initializeSimplifiedShell() {
    document.body.classList.add("irisx-simple-state");

    const intro = qs("#intro");
    const choice = qs("#choice");
    const luxuryModeActive = document.body.classList.contains("irisx-luxury");
    const introHiddenByCss = intro ? window.getComputedStyle(intro).display === "none" : false;

    // Keep intro visible only when the luxury redesign is not intentionally hiding it.
    if (!luxuryModeActive && intro && intro.style.display === "none") {
      intro.style.display = "";
    }
    // Hide old choice screen — we go straight to buy after intro
    if (choice) {
      choice.style.display = "none";
      choice.classList.remove("show");
    }

    // If intro exists and is visually active, keep body locked until user clicks.
    if (intro && !luxuryModeActive && !introHiddenByCss && intro.style.display !== "none") {
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
      bumpViewSyncToken();

      document.body.style.overflow = "";
      closeProfileMenu();
      closeMobileNav();
      closeMobileFilters();

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

  function clearPersistedPrototypeData() {
    Object.keys(STORAGE_KEYS).forEach(function (key) {
      removeStoredValue(STORAGE_KEYS[key]);
    });
    ["iris-lang", "iris-mode", "iris-pwa-dismissed"].forEach(removeStoredValue);
  }

  function updateCookieBannerContent() {
    const banner = qs("#cookieBanner");
    const title = qs("#cookieBannerTitle");
    const message = qs("#cookieBannerMessage");
    const acceptButton = qs("#cookieAcceptAllBtn");
    const necessaryButton = qs("#cookieNecessaryBtn");

    if (banner) {
      banner.setAttribute("aria-label", langText("Banner cookie", "Cookie banner"));
    }
    if (title) {
      title.textContent = langText("Questo sito utilizza cookie", "This site uses cookies");
    }
    if (message) {
      message.innerHTML = langText(
        "Utilizziamo cookie tecnici e analitici per migliorare l'esperienza. Puoi consultare la nostra <a href=\"#\" onclick=\"event.preventDefault();openStatic('privacy')\">Privacy Policy</a>.",
        "We use technical and analytics cookies to improve your experience. You can read our <a href=\"#\" onclick=\"event.preventDefault();openStatic('privacy')\">Privacy Policy</a>."
      );
    }
    if (acceptButton) {
      acceptButton.textContent = langText("Accetta tutti", "Accept all");
    }
    if (necessaryButton) {
      necessaryButton.textContent = langText("Solo necessari", "Only necessary");
    }
  }

  function syncCookieBannerVisibility(forceVisible) {
    const banner = qs("#cookieBanner");
    if (!banner) {
      return;
    }
    banner.style.display = forceVisible ? "flex" : "none";
  }

  function checkCookieConsent() {
    updateCookieBannerContent();
    syncCookieBannerVisibility(!getCookieConsentStatus());
  }

  function acceptCookies(level) {
    const normalizedLevel = level === "all" ? "all" : "necessary";
    if (normalizedLevel !== "all") {
      clearPersistedPrototypeData();
      favorites = new Set();
      state.cart = [];
      state.currentUser = null;
      state.listings = [];
      state.orders = [];
      state.offers = [];
      state.notifications = [];
      state.emailOutbox = [];
      state.supportTickets = [];
      state.auditLog = [];
      state.reviews = [];
      if (typeof chats !== "undefined" && Array.isArray(chats)) {
        chats.length = 0;
      }
      updateCartBadge();
      updateFavBadge();
      renderCartDrawer();
      renderNotifications();
      renderProfilePanel();
    }
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        level: normalizedLevel,
        date: new Date().toISOString()
      }));
    } catch (error) {
      return;
    }
    syncCookieBannerVisibility(false);
  }

  function setCookieConsent(status) {
    acceptCookies(status === "accepted" ? "all" : "necessary");
  }

  function injectCookieConsentUi() {
    updateCookieBannerContent();
    syncCookieBannerVisibility(false);
    if (!window.__irisCookieConsentTimer) {
      window.__irisCookieConsentTimer = window.setTimeout(checkCookieConsent, 2000);
    }
  }

  function getSellFieldContainer(field) {
    if (!field) {
      return null;
    }
    return field.closest(".fg") || field.closest(".photo-upload") || field.closest(".irisx-measurement-block") || field.parentElement || null;
  }

  function ensureSellFieldErrorNode(field) {
    const container = getSellFieldContainer(field);
    if (!container || !field || !field.id) {
      return null;
    }
    let errorNode = container.querySelector('.field-error[data-for="' + field.id + '"]');
    if (!errorNode) {
      errorNode = document.createElement("span");
      errorNode.className = "field-error";
      errorNode.dataset.for = field.id;
      container.appendChild(errorNode);
    }
    return errorNode;
  }

  function clearSellFieldError(field) {
    const container = getSellFieldContainer(field);
    const errorNode = field ? ensureSellFieldErrorNode(field) : null;
    if (container) {
      container.classList.remove("has-error");
    }
    if (field) {
      field.removeAttribute("aria-invalid");
    }
    if (errorNode) {
      errorNode.textContent = "";
    }
  }

  function setSellFieldError(field, message) {
    const container = getSellFieldContainer(field);
    const errorNode = ensureSellFieldErrorNode(field);
    if (container) {
      container.classList.add("has-error");
    }
    if (field) {
      field.setAttribute("aria-invalid", "true");
    }
    if (errorNode) {
      errorNode.textContent = message;
    }
  }

  function validateSellField(fieldOrId) {
    const field = typeof fieldOrId === "string" ? qs("#" + fieldOrId) : fieldOrId;
    if (!field) {
      return true;
    }

    const value = typeof field.value === "string" ? field.value.trim() : "";
    let message = "";
    switch (field.id) {
      case "fileIn":
        if (!state.sellPhotos.length) {
          message = langText("Aggiungi almeno una foto.", "Add at least one photo.");
        }
        break;
      case "sf-desc":
        if (!value) {
          message = langText("Inserisci una descrizione.", "Add a description.");
        } else if (value.length < 10) {
          message = langText("La descrizione deve avere almeno 10 caratteri.", "Description must be at least 10 characters.");
        }
        break;
      case "sf-price": {
        const numeric = Number(field.value);
        if (!value) {
          message = langText("Inserisci il prezzo.", "Enter the price.");
        } else if (!Number.isFinite(numeric) || numeric < 1) {
          message = langText("Il prezzo deve essere almeno 1 €.", "Price must be at least €1.");
        }
        break;
      }
      case "sf-condition":
        if (!value) {
          message = langText("Seleziona la condizione.", "Select the condition.");
        }
        break;
      default:
        if (field.hasAttribute("required") && !value) {
          message = langText("Campo obbligatorio.", "Required field.");
        }
        break;
    }

    if (message) {
      setSellFieldError(field, message);
      return false;
    }

    clearSellFieldError(field);
    return true;
  }

  function validateSellForm() {
    const requiredFields = ["fileIn", "sf-cat", "sf-brand", "sf-name", "sf-subcat", "sf-condition", "sf-desc", "sf-price"];
    return requiredFields.every(function (fieldId) {
      return validateSellField(fieldId);
    });
  }

  function focusFirstSellError() {
    const firstInvalid = qs("#sellForm [aria-invalid='true']");
    if (firstInvalid && typeof firstInvalid.focus === "function") {
      firstInvalid.focus();
      return;
    }
    const photoUpload = qs(".photo-upload.has-error");
    if (photoUpload && typeof photoUpload.scrollIntoView === "function") {
      photoUpload.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function bindSellFormValidation() {
    const form = qs("#sellForm");
    if (!form || form.dataset.irisxBound === "1") {
      return;
    }
    form.dataset.irisxBound = "1";

    qsa("input, textarea, select", form).forEach(function (field) {
      if (field.type === "file") {
        field.addEventListener("change", function () {
          setTimeout(function () {
            validateSellField(field);
          }, 0);
        });
        return;
      }
      field.addEventListener("blur", function () {
        validateSellField(field);
      });
      field.addEventListener("change", function () {
        validateSellField(field);
      });
      field.addEventListener("input", function () {
        const errorNode = ensureSellFieldErrorNode(field);
        if (errorNode && errorNode.textContent) {
          validateSellField(field);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const isValid = validateSellForm();
      if (!isValid) {
        updateSellStatus(t("publish_error"), true);
        focusFirstSellError();
        return;
      }
      requireAuth(function () {
        if (validateSellForm()) {
          publishListing();
        }
      });
    });
  }

  selCond = function (button) {
    qsa(".cond-btn").forEach(function (candidate) {
      candidate.classList.remove("sel");
    });
    if (button) {
      button.classList.add("sel");
    }
    const hiddenField = qs("#sf-condition");
    if (hiddenField) {
      hiddenField.value = button ? button.textContent.trim() : "";
      validateSellField(hiddenField);
    }
  };

  function bindStaticEnhancements() {
    const fileInput = qs("#fileIn");
    if (fileInput) {
      fileInput.addEventListener("change", handleSellPhotosSelected);
    }
    bindSellFormValidation();

    qsa(".static-modal").forEach(function (modal) {
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
    });
    qsa(".sm-close").forEach(function (button) {
      button.setAttribute("aria-label", langText("Chiudi", "Close"));
    });

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
      } else {
        const productIndex = prods.findIndex((product) => product.id === listing.id);
        prods[productIndex] = listing;
      }
      if (listing.seller && !sellers.some((seller) => seller.id === listing.seller.id)) {
        sellers.push(listing.seller);
      }
    });
  }

  function syncListingIntoCatalog(listing) {
    const normalized = normalizeListingRecord(listing);
    const listingIndex = state.listings.findIndex(function (candidate) {
      return String(candidate.id) === String(normalized.id);
    });
    if (listingIndex === -1) {
      state.listings.unshift(normalized);
    } else {
      state.listings[listingIndex] = normalized;
    }
    const productIndex = prods.findIndex(function (candidate) {
      return String(candidate.id) === String(normalized.id);
    });
    if (productIndex === -1) {
      prods.unshift(normalized);
    } else {
      prods[productIndex] = normalized;
    }
    if (normalized.seller && !sellers.some(function (candidate) { return candidate.id === normalized.seller.id; })) {
      sellers.push(normalized.seller);
    }
    saveJson(STORAGE_KEYS.listings, state.listings);
    return normalized;
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

  function persistOffers() {
    saveJson(STORAGE_KEYS.offers, state.offers);
  }

  function persistNotifications() {
    saveJson(STORAGE_KEYS.notifications, state.notifications);
  }

  function persistBanRegistry() {
    state.banRegistry = normalizeBanRegistry(state.banRegistry);
    saveJson(STORAGE_KEYS.banRegistry, state.banRegistry);
  }

  function persistEmailOutbox() {
    saveJson(STORAGE_KEYS.emailOutbox, state.emailOutbox);
  }

  function persistSupportTickets() {
    saveJson(STORAGE_KEYS.supportTickets, state.supportTickets);
  }

  function persistMeasurementRequests() {
    saveJson(STORAGE_KEYS.measurementRequests, state.measurementRequests);
  }

  function persistAuditLog() {
    saveJson(STORAGE_KEYS.auditLog, state.auditLog);
  }

  function getBanEntry(type, value) {
    const normalizedValue = type === "phone" ? normalizePhoneNumber(value) : normalizeEmail(value);
    if (!normalizedValue) {
      return null;
    }
    return state.banRegistry.entries.find(function (entry) {
      return entry.active !== false && entry.type === type && entry.value === normalizedValue;
    }) || null;
  }

  function isEmailBanned(email) {
    const normalized = normalizeEmail(email);
    return Boolean(normalized && (state.banRegistry.emails.indexOf(normalized) >= 0 || getBanEntry("email", normalized)));
  }

  function isPhoneBanned(phone) {
    const normalized = normalizePhoneNumber(phone);
    return Boolean(normalized && (state.banRegistry.phones.indexOf(normalized) >= 0 || getBanEntry("phone", normalized)));
  }

  function getBlockedIdentityMessage(email, phone) {
    const emailEntry = getBanEntry("email", email);
    const phoneEntry = getBanEntry("phone", phone);
    if (!emailEntry && !phoneEntry) {
      return "";
    }
    const reason = (emailEntry && emailEntry.reason) || (phoneEntry && phoneEntry.reason) || "";
    return langText(
      "Questo account è bloccato. Contatta " + PLATFORM_CONFIG.supportEmail + (reason ? " · Motivo: " + reason : "") + ".",
      "This account is blocked. Contact " + PLATFORM_CONFIG.supportEmail + (reason ? " · Reason: " + reason : "") + "."
    );
  }

  function generateVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function banIdentityIdentifiers(email, phone, reason) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhoneNumber(phone);
    const nextEntries = state.banRegistry.entries.slice();
    if (normalizedEmail && !getBanEntry("email", normalizedEmail)) {
      nextEntries.push({
        id: createId("ban"),
        type: "email",
        value: normalizedEmail,
        reason: reason || "",
        active: true,
        createdAt: Date.now()
      });
    }
    if (normalizedPhone && !getBanEntry("phone", normalizedPhone)) {
      nextEntries.push({
        id: createId("ban"),
        type: "phone",
        value: normalizedPhone,
        reason: reason || "",
        active: true,
        createdAt: Date.now()
      });
    }
    state.banRegistry = normalizeBanRegistry({
      entries: nextEntries
    });
    persistBanRegistry();
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

  /* ── Vacation mode helpers ── */
  function getProductSellerUser(product) {
    if (!product) return null;
    const email = normalizeEmail(
      product.ownerEmail || (product.seller && product.seller.email) || ""
    );
    if (!email) return null;
    return state.users.find(function (u) { return normalizeEmail(u.email) === email; }) || null;
  }

  function isCurrentUserListingOwner(product) {
    if (!product || !state.currentUser) {
      return false;
    }
    const currentEmail = normalizeEmail(state.currentUser.email || "");
    const ownerEmail = normalizeEmail(
      product.ownerEmail ||
      (product.seller && product.seller.email) ||
      buildListingSeller(product).email ||
      ""
    );
    return Boolean(currentEmail && ownerEmail && currentEmail === ownerEmail);
  }

  function isSellerOnVacation(product) {
    const u = getProductSellerUser(product);
    return Boolean(u && u.vacationMode && u.vacationMode.enabled);
  }

  function getSellerVacationMessage(product) {
    const u = getProductSellerUser(product);
    if (!u || !u.vacationMode || !u.vacationMode.enabled) return "";
    const note = u.vacationMode.note ||
      langText("Il seller è momentaneamente in pausa.", "The seller is temporarily on pause.");
    const ret = u.vacationMode.returnDate
      ? " · " + langText("Ritorno previsto", "Expected return") + ": " + u.vacationMode.returnDate
      : "";
    return note + ret;
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
          "Ciao " + payload.name + ", il tuo account IRIS è stato creato. Completa la verifica email prima del go-live del backend.",
          "Hi " + payload.name + ", your IRIS account is ready. Complete email verification before backend go-live."
        )
      };
    }

    if (type === "verify-account") {
      return {
        subject: langText("Verifica il tuo account IRIS", "Verify your IRIS account"),
        body: langText(
          "Attiva il tuo account confermando l'indirizzo email " + payload.email + (payload.code ? ". Codice demo: " + payload.code + "." : "."),
          "Activate your account by confirming the email address " + payload.email + (payload.code ? ". Demo code: " + payload.code + "." : ".")
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
          "Il tuo ordine è stato spedito con " + payload.carrier + " - tracking " + payload.trackingNumber + ".",
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
      const supportContext = buildSupportContext(state.opsModalPayload && state.opsModalPayload.orderId, state.opsModalPayload || {});
      const issueOptions = getIssueOptions();
      modal.innerHTML =
        "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card irisx-modal-card--support\"><div class=\"irisx-card-head\"><div><div class=\"irisx-title\">" +
        ((supportContext && supportContext.issueSeverity) === "dispute" ? langText("Apri disputa", "Open dispute") : langText("Richiedi supporto", "Request support")) +
        "</div><div class=\"irisx-subtitle\">" +
        langText("Apri un ticket legato all'ordine selezionato.", "Open a ticket for the selected order.") +
        "</div></div><button class=\"irisx-close\" onclick=\"closeOpsModal()\">✕</button></div><div class=\"irisx-card-body\">" +
        (supportContext && supportContext.order ? `<div class="irisx-support-context-card">
          <div class="irisx-support-context-kicker">${langText("Contesto collegato automaticamente", "Context linked automatically")}</div>
          <div class="irisx-support-context-grid">
            <div><strong>${langText("Ordine", "Order")}</strong><span>${escapeHtml(supportContext.order.number)}</span></div>
            <div><strong>${langText("Lato", "Side")}</strong><span>${escapeHtml(langText(supportContext.role === "buyer" ? "Acquirente" : "Venditore", supportContext.role === "buyer" ? "Buyer" : "Seller"))}</span></div>
            <div><strong>${langText("Articolo", "Item")}</strong><span>${escapeHtml(supportContext.product ? supportContext.product.brand + " " + supportContext.product.name : langText("Ordine completo", "Full order"))}</span></div>
            <div><strong>${langText("Riferimento", "Reference")}</strong><span>${escapeHtml(supportContext.product ? String(supportContext.product.productId || "—") : supportContext.order.id)}</span></div>
          </div>
        </div>` : "") +
        "<div class=\"irisx-form-grid irisx-form-grid--support\"><div class=\"irisx-field\"><label for=\"opsTicketReason\">" +
        langText("Motivo", "Reason") +
        "</label><select id=\"opsTicketReason\">" +
        issueOptions.map(function (option) {
          const selected = supportContext && supportContext.issueType === option.id ? " selected" : "";
          return `<option value="${escapeHtml(option.id)}"${selected}>${escapeHtml(langText(option.it, option.en))}</option>`;
        }).join("") +
        "</select></div><div class=\"irisx-field\"><label for=\"opsTicketSeverity\">" +
        langText("Tipo richiesta", "Request type") +
        "</label><select id=\"opsTicketSeverity\"><option value=\"support\"" +
        (((supportContext && supportContext.issueSeverity) || "support") === "support" ? " selected" : "") +
        ">" + langText("Supporto assistito", "Guided support") + "</option><option value=\"dispute\"" +
        (((supportContext && supportContext.issueSeverity) || "support") === "dispute" ? " selected" : "") +
        ">" + langText("Disputa / escalation", "Dispute / escalation") + "</option></select></div><div class=\"irisx-field irisx-field--full\"><label for=\"opsTicketMessage\">" +
        langText("Dettagli", "Details") +
        "</label><textarea id=\"opsTicketMessage\" placeholder=\"" +
        escapeHtml(langText("Spiega il problema: spedizione, autenticità, condizioni, accessori mancanti o altro.", "Explain the issue: shipping, authenticity, condition, missing accessories, or anything else.")) +
        "\"></textarea></div></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"submitOpsModal()\">" +
        ((supportContext && supportContext.issueSeverity) === "dispute" ? langText("Apri disputa", "Open dispute") : langText("Apri ticket", "Open ticket")) +
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

  function createOrderFromCheckout(items, shipping, context) {
    const createdAt = Date.now();
    const buyerEmail = normalizeEmail((context && context.buyerEmail) || (state.currentUser && state.currentUser.email) || "");
    const buyerName = (context && context.buyerName) || shipping.name;
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
      buyerEmail: buyerEmail,
      buyerName: buyerName,
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

  function closeOrderDetail() {
    state.activeOrderId = null;
    const modal = qs("#irisxOrderModal");
    if (modal) {
      modal.classList.remove("open");
      modal.innerHTML = "";
    }
  }

  function getOrderById(orderId) {
    return state.orders.find(function (order) { return order.id === orderId; }) || null;
  }

  function openOrderDetail(orderId, scope) {
    state.activeOrderId = orderId;
    state.activeOrderScope = scope || "buyer";
    renderOrderDetailModal();
    const modal = qs("#irisxOrderModal");
    if (modal) {
      modal.classList.add("open");
    }
  }

  function setOrderStatus(orderId, nextStatus, eventType, eventLabel, options) {
    const payload = options || {};
    const updated = updateOrderRecord(orderId, function (order) {
      order.status = nextStatus;
      order.shipping.shipmentStatus = nextStatus;
      if (payload.carrier) {
        order.shipping.carrier = payload.carrier;
      }
      if (payload.trackingNumber) {
        order.shipping.trackingNumber = payload.trackingNumber;
      }
      if (payload.labelStatus) {
        order.shipping.labelStatus = payload.labelStatus;
      }
      if (payload.shippedAt) {
        order.shipping.shippedAt = payload.shippedAt;
      }
      if (payload.deliveredAt) {
        order.shipping.deliveredAt = payload.deliveredAt;
      }
      if (payload.payoutStatus) {
        order.payment.payoutStatus = payload.payoutStatus;
      }
      if (payload.refundStatus) {
        order.payment.refundStatus = payload.refundStatus;
      }
      appendOrderEvent(order, eventType, eventLabel, payload);
      return order;
    });

    if (updated) {
      renderOrderDetailModal();
    }
    return updated;
  }

  function prepareOrderShipment(orderId) {
    const updated = setOrderStatus(
      orderId,
      "awaiting_shipment",
      "awaiting_shipment",
      langText("Ordine in preparazione", "Order awaiting shipment"),
      { payoutStatus: "pending_shipment", labelStatus: "pending" }
    );

    if (updated) {
      showToast(langText("Ordine messo in coda spedizione.", "Order moved to shipping queue."));
    }
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

    const updated = setOrderStatus(
      orderId,
      "shipped",
      "order_shipped",
      langText("Spedito al centro IRIS", "Shipped to IRIS hub"),
      {
        carrier: carrier,
        trackingNumber: trackingNumber,
        shippedAt: Date.now(),
        labelStatus: "generated",
        payoutStatus: "pending_delivery"
      }
    );

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

  function markOrderInAuthentication(orderId) {
    const updated = setOrderStatus(
      orderId,
      "in_authentication",
      "order_authenticated",
      langText("Articolo preso in carico dal team autenticazione", "Item received by authentication team"),
      { payoutStatus: "pending_delivery" }
    );

    if (updated) {
      createNotification({
        audience: "user",
        kind: "order",
        title: langText("Ordine in autenticazione", "Order in authentication"),
        body: updated.number,
        recipientEmail: updated.buyerEmail
      });
      showToast(langText("Ordine in autenticazione.", "Order in authentication."));
    }
  }

  function dispatchOrderToBuyer(orderId) {
    const order = getOrderById(orderId);
    if (!order) {
      return;
    }

    const updated = setOrderStatus(
      orderId,
      "dispatched_to_buyer",
      "order_dispatched",
      langText("Spedito al buyer", "Dispatched to buyer"),
      {
        payoutStatus: "pending_delivery",
        carrier: order.shipping.carrier || "DHL",
        trackingNumber: order.shipping.trackingNumber || ("IRIS-BUYER-" + String(Date.now()).slice(-6))
      }
    );

    if (updated) {
      createNotification({
        audience: "user",
        kind: "shipping",
        title: langText("Ordine in consegna", "Order dispatched to buyer"),
        body: updated.shipping.carrier + " - " + updated.shipping.trackingNumber,
        recipientEmail: updated.buyerEmail
      });
      showToast(langText("Ordine spedito al buyer.", "Order dispatched to buyer."));
    }
  }

  function confirmOrderDelivered(orderId) {
    const updated = setOrderStatus(
      orderId,
      "delivered",
      "order_delivered",
      langText("Ordine consegnato", "Order delivered"),
      {
        deliveredAt: Date.now(),
        payoutStatus: "ready"
      }
    );

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

  function completeOrderLifecycle(orderId) {
    const updated = setOrderStatus(
      orderId,
      "completed",
      "order_completed",
      langText("Ordine completato", "Order completed"),
      { payoutStatus: "ready" }
    );

    if (updated) {
      showToast(langText("Ordine completato.", "Order completed."));
    }
  }

  function requestRefund(orderId) {
    const updated = setOrderStatus(
      orderId,
      "refund_requested",
      "refund_requested",
      langText("Rimborso richiesto", "Refund requested"),
      { refundStatus: "requested", payoutStatus: "on_hold" }
    );

    if (updated) {
      createNotification({
        audience: "admin",
        kind: "support",
        title: langText("Richiesta rimborso", "Refund request"),
        body: updated.number,
        recipientEmail: PLATFORM_CONFIG.ownerEmail
      });
      showToast(langText("Richiesta rimborso registrata.", "Refund request stored."));
    }
  }

  function markOrderRefunded(orderId) {
    const updated = setOrderStatus(
      orderId,
      "refunded",
      "order_refunded",
      langText("Rimborso completato", "Refund completed"),
      { refundStatus: "refunded", payoutStatus: "reversed" }
    );

    if (updated) {
      showToast(langText("Ordine rimborsato.", "Order refunded."));
    }
  }

  function cancelOrder(orderId) {
    const updated = setOrderStatus(
      orderId,
      "cancelled",
      "order_cancelled",
      langText("Ordine annullato", "Order cancelled"),
      { refundStatus: "cancelled", payoutStatus: "cancelled" }
    );

    if (updated) {
      showToast(langText("Ordine annullato.", "Order cancelled."));
    }
  }

  function openSupportModal(orderId, options) {
    openOpsModal("support", Object.assign({ orderId: orderId }, options || {}));
  }

  function submitSupportTicket(orderId) {
    const reasonField = qs("#opsTicketReason");
    const messageField = qs("#opsTicketMessage");
    const severityField = qs("#opsTicketSeverity");
    const reason = reasonField ? reasonField.value.trim() : "other";
    const severity = severityField ? severityField.value.trim() : "support";
    const message = messageField ? messageField.value.trim() : "";

    if (!message) {
      showToast(langText("Inserisci i dettagli della richiesta.", "Please enter request details."));
      return;
    }

    const supportContext = buildSupportContext(orderId, state.opsModalPayload || {});
    if (!supportContext || !supportContext.order) {
      return;
    }
    const order = supportContext.order;
    const product = supportContext.product;

    const ticket = {
      id: createId("tkt"),
      orderId: order.id,
      orderNumber: order.number,
      productId: product ? product.productId : "",
      productTitle: product ? `${product.brand} ${product.name}` : "",
      buyerEmail: order.buyerEmail,
      sellerEmail: order.items[0] ? order.items[0].sellerEmail : "",
      requesterEmail: normalizeEmail((state.currentUser && state.currentUser.email) || ""),
      requesterRole: supportContext.role,
      severity: severity,
      status: severity === "dispute" ? "in_review" : "open",
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
      title: severity === "dispute" ? langText("Nuova disputa", "New dispute") : langText("Nuovo ticket supporto", "New support ticket"),
      body: order.number + " - " + getIssueLabel(reason),
      recipientEmail: PLATFORM_CONFIG.ownerEmail
    });
    createNotification({
      audience: "user",
      kind: "support",
      title: severity === "dispute" ? langText("Disputa aperta", "Dispute opened") : langText("Ticket aperto", "Ticket opened"),
      body: order.number,
      recipientEmail: order.buyerEmail
    });
    recordAuditEvent("support_ticket_opened", order.number, {
      ticketId: ticket.id
    });

    closeOpsModal();
    renderProfilePanel();
    renderOpsView();
    showToast(severity === "dispute"
      ? langText("Disputa aperta con il contesto ordine già collegato.", "Dispute opened with the order context already attached.")
      : langText("Ticket creato con il contesto dell'ordine collegato.", "Ticket created with the order context attached."));
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

    function getOfferCurrencySymbol() {
      const locale = getLocaleConfig();
      const parts = new Intl.NumberFormat(locale.locale, {
        style: "currency",
        currency: locale.currency,
        maximumFractionDigits: locale.currency === "JPY" ? 0 : 2
      }).formatToParts(0);
      const currencyPart = parts.find(function (part) { return part.type === "currency"; });
      return currencyPart ? currencyPart.value : "€";
    }

    function getOfferDraftAmountValue() {
      if (!state.offerDraft) {
        return "";
      }
      if (state.offerDraft.offerAmountLocal !== undefined && state.offerDraft.offerAmountLocal !== null) {
        return String(state.offerDraft.offerAmountLocal);
      }
      if (state.offerDraft.offerAmount === undefined || state.offerDraft.offerAmount === null || state.offerDraft.offerAmount === "") {
        return "";
      }
      return String(Math.round(convertBaseEurAmount(state.offerDraft.offerAmount)));
    }

    function getOfferAmountValidation(product, rawValue) {
      const sanitized = String(rawValue || "").replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
      const localAmount = sanitized ? Number(sanitized) : NaN;
      const amount = Number.isFinite(localAmount) ? convertLocalAmountToBase(localAmount) : NaN;
      const minimum = product.minimumOfferAmount !== null && product.minimumOfferAmount !== undefined
        ? Number(product.minimumOfferAmount)
        : null;
      const minimumText = minimum !== null
        ? `${langText("Offerta minima", "Minimum offer")}: ${formatCurrency(minimum)}`
        : "";
      if (!sanitized) {
        return {
          rawValue: "",
          localAmount: NaN,
          amount: NaN,
          canContinue: false,
          errorMessage: "",
          minimumText: minimumText
        };
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        return {
          rawValue: sanitized,
          localAmount: NaN,
          amount: NaN,
          canContinue: false,
          errorMessage: langText("Inserisci un importo valido.", "Enter a valid amount."),
          minimumText: minimumText
        };
      }
      if (minimum !== null && amount < minimum) {
        return {
          rawValue: sanitized,
          localAmount: localAmount,
          amount: amount,
          canContinue: false,
          errorMessage: `${langText("La tua offerta è troppo bassa.", "Your offer is too low.")} ${minimumText}`,
          minimumText: minimumText
        };
      }
      return {
        rawValue: sanitized,
        localAmount: localAmount,
        amount: amount,
        canContinue: true,
        errorMessage: "",
        minimumText: minimumText
      };
    }

    function getOfferStepIncrement(product) {
      const price = Number(product && product.price || 0);
      if (price >= 5000) {
        return 100;
      }
      if (price >= 1500) {
        return 50;
      }
      return 25;
    }

    function getOfferProductMediaMarkup(product) {
      const image = Array.isArray(product.images) && product.images[0] ? product.images[0] : "";
      if (image) {
        return `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.brand + " " + product.name)}">`;
      }
      return `<div class="offer-product-thumb__emoji">${escapeHtml(product.emoji || "👜")}</div>`;
    }

    function getOfferPaymentOptions() {
      const buyer = normalizeUserWorkspace(state.currentUser || {});
      const methods = buyer.paymentMethods.length
        ? buyer.paymentMethods.map(function (method) {
            return {
              id: method.id,
              kind: langText("Carta", "Card"),
              label: `${method.brand} •••• ${method.last4}`,
              meta: method.status === "placeholder"
                ? langText("Autorizzazione prototipo", "Prototype authorization")
                : langText("Metodo salvato", "Saved method"),
              snapshot: {
                id: method.id,
                label: `${method.brand} •••• ${method.last4}`
              }
            };
          })
        : [{
            id: "prototype-offer-auth",
            kind: langText("Carta", "Card"),
            label: langText("Visa •••• 4242", "Visa •••• 4242"),
            meta: langText("Autorizzazione prototipo", "Prototype authorization"),
            snapshot: {
              id: "prototype-offer-auth",
              label: langText("Visa •••• 4242", "Visa •••• 4242")
            }
          }];

      methods.push({
        id: "apple-pay",
        kind: "Apple Pay",
        label: langText("Wallet autorizzato", "Authorized wallet"),
        meta: langText("Conferma rapida in app", "Fast in-app confirmation"),
        snapshot: {
          id: "apple-pay",
          label: "Apple Pay"
        }
      });

      return methods;
    }

    function getSelectedOfferPaymentOption() {
      const selectedId = state.offerDraft && state.offerDraft.paymentMethodSnapshot && state.offerDraft.paymentMethodSnapshot.id;
      const options = getOfferPaymentOptions();
      return options.find(function (option) { return option.id === selectedId; }) || options[0];
    }

    function getOfferReviewReadiness(product, draft) {
      const defaults = getBuyerOfferDefaults();
      const shipping = Object.assign({}, defaults.shippingSnapshot, draft && draft.shippingSnapshot ? draft.shippingSnapshot : {});
      const payment = draft && draft.paymentMethodSnapshot ? draft.paymentMethodSnapshot : defaults.paymentMethodSnapshot;
      const phone = normalizePhoneNumber((shipping && shipping.phone) || (state.currentUser && state.currentUser.phone) || "");
      const amountState = getOfferAmountValidation(product, draft && (draft.offerAmountLocal !== undefined ? draft.offerAmountLocal : draft.offerAmount));
      if (!amountState.canContinue) {
        return {
          ok: false,
          error: amountState.errorMessage || langText("Completa l'importo offerta.", "Complete the offer amount."),
          shipping: shipping,
          payment: payment,
          phone: phone,
          amount: amountState.amount,
          missingAmount: true
        };
      }
      if (!shipping.address || !shipping.city || !shipping.country) {
        return {
          ok: false,
          error: langText("Completa il tuo indirizzo di spedizione nel profilo prima di inviare l'offerta.", "Complete your shipping address in your profile before submitting the offer."),
          shipping: shipping,
          payment: payment,
          phone: phone,
          amount: amountState.amount,
          missingShipping: true
        };
      }
      if (!phone || !isValidPhoneNumber(phone)) {
        return {
          ok: false,
          error: langText("Aggiungi un numero di telefono valido nel profilo prima di inviare l'offerta.", "Add a valid phone number in your profile before submitting the offer."),
          shipping: shipping,
          payment: payment,
          phone: phone,
          amount: amountState.amount,
          missingPhone: true
        };
      }
      if (!payment || !payment.label) {
        return {
          ok: false,
          error: langText("Seleziona un metodo per autorizzare l'offerta.", "Select a method to authorize the offer."),
          shipping: shipping,
          payment: payment,
          phone: phone,
          amount: amountState.amount,
          missingPayment: true
        };
      }
      return {
        ok: true,
        shipping: shipping,
        payment: payment,
        phone: phone,
        amount: amountState.amount
      };
    }

    function refreshOfferAmountUi() {
      if (state.offerStep !== "amount") {
        return;
      }
      const product = getListingById(offerProdId);
      if (!product) {
        return;
      }
      const validation = getOfferAmountValidation(product, getOfferDraftAmountValue());
      const errorNode = qs("#offerAmountError");
      const button = qs("#offerContinueButton");
      const minimumNode = qs("#offerMinimumCopy");
      if (errorNode) {
        errorNode.textContent = validation.errorMessage || "";
        errorNode.classList.toggle("is-visible", Boolean(validation.errorMessage));
      }
      if (button) {
        button.disabled = !validation.canContinue;
      }
      if (minimumNode) {
        minimumNode.textContent = validation.minimumText;
      }
    }

    sanitizeOfferAmountInput = function (input) {
      const sanitized = String(input && input.value || "").replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
      if (input && input.value !== sanitized) {
        input.value = sanitized;
      }
      state.offerDraft = Object.assign({}, state.offerDraft || {}, {
        offerAmountLocal: sanitized
      });
      state.offerError = "";
      refreshOfferAmountUi();
    };

    function bumpOfferAmount(delta) {
      const current = Number(getOfferDraftAmountValue() || 0);
      const nextValue = Math.max(0, current + Number(delta || 0));
      state.offerDraft = Object.assign({}, state.offerDraft || {}, {
        offerAmountLocal: nextValue ? String(nextValue) : ""
      });
      state.offerError = "";
      renderOfferModal();
    }

    function handleOfferAmountKeydown(event) {
      if (!event) {
        return;
      }
      const listing = offerProdId ? getListingById(offerProdId) : null;
      const increment = getOfferStepIncrement(listing || {});
      if (event.key === "ArrowUp") {
        event.preventDefault();
        bumpOfferAmount(increment);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        bumpOfferAmount(-increment);
        return;
      }
      if (event.key === "Enter") {
        const validation = getOfferAmountValidation(listing || {}, getOfferDraftAmountValue());
        if (validation.canContinue) {
          event.preventDefault();
          sendOffer();
        }
      }
    }

    selectOfferPaymentMethod = function (paymentId) {
      const option = getOfferPaymentOptions().find(function (entry) { return entry.id === paymentId; });
      if (!option) {
        return;
      }
      state.offerDraft = Object.assign({}, state.offerDraft || {}, {
        paymentMethodSnapshot: Object.assign({}, option.snapshot)
      });
      state.offerError = "";
      renderOfferModal();
    };

    toggleOfferTermsAccepted = function () {
      state.offerDraft = Object.assign({}, state.offerDraft || {}, {
        termsAccepted: !(state.offerDraft && state.offerDraft.termsAccepted)
      });
      state.offerError = "";
      renderOfferModal();
    };

    openOfferProfileSection = function (section) {
      closeOffer();
      showBuyView("profile");
      setProfileArea("account", section || "settings_account");
    };

    function renderOfferModal() {
      const modal = qs("#offerModal");
      const box = modal ? modal.querySelector(".offer-box") : null;
      const product = getListingById(offerProdId);
      if (!modal || !box) {
        return;
      }
      if (!product) {
        modal.classList.remove("open");
        return;
      }
      const defaults = getBuyerOfferDefaults();
      const amountValue = getOfferDraftAmountValue();
      const amountValidation = getOfferAmountValidation(product, amountValue);
      const paymentOptions = getOfferPaymentOptions();
      const selectedPayment = getSelectedOfferPaymentOption();
      const reviewState = getOfferReviewReadiness(product, state.offerDraft || {});
      const shippingSnapshot = Object.assign({}, defaults.shippingSnapshot, state.offerDraft && state.offerDraft.shippingSnapshot ? state.offerDraft.shippingSnapshot : {});
      const phoneSnapshot = normalizePhoneNumber((shippingSnapshot && shippingSnapshot.phone) || (state.currentUser && state.currentUser.phone) || "");
      const termsAccepted = Boolean(state.offerDraft && state.offerDraft.termsAccepted);
      const canSubmitReview = reviewState.ok && termsAccepted;
      const offerStepIncrement = getOfferStepIncrement(product);
      const stepLabel = state.offerStep === "authorization"
        ? langText("Step 2 di 2: Rivedi offerta", "Step 2 of 2: Review offer")
        : state.offerStep === "success"
          ? langText("Offerta registrata", "Offer recorded")
          : langText("Step 1 di 2: Fai un'offerta", "Step 1 of 2: Make an offer");
      const productSummary = `
        <div class="offer-product-strip">
          <div class="offer-product-thumb">${getOfferProductMediaMarkup(product)}</div>
          <div class="offer-product-strip__info">
            <strong>${escapeHtml(product.brand)}</strong>
            <div class="offer-product-strip__name">${escapeHtml(product.name)}</div>
            <div class="offer-product-strip__meta">${escapeHtml(getProductMetaSummary(product) || getListingDisplaySize(product))}</div>
          </div>
          <div class="offer-product-strip__price">${escapeHtml(formatCurrency(product.price))}</div>
        </div>
      `;
      const statusBox = state.offerError
        ? `<div class="offer-error">${escapeHtml(state.offerError)}</div>`
        : state.offerStatus && state.offerStep === "success"
          ? `<div class="offer-success">${escapeHtml(langText("Offerta vincolante registrata. Nessun addebito finale ora.", "Binding offer recorded. No final charge yet."))}</div>`
          : "";

      if (state.offerStep === "success" && state.offerStatus) {
        box.innerHTML = `
          <div class="offer-shell offer-shell--success">
            <div class="offer-shell__header">
              <div class="offer-step-indicator">${escapeHtml(stepLabel)}</div>
              <button class="offer-shell__icon" onclick="closeOffer()" aria-label="${escapeHtml(langText("Chiudi", "Close"))}">×</button>
            </div>
            ${productSummary}
            <div class="offer-success-screen">
              <div class="offer-success-pill">${escapeHtml(langText("Offerta vincolante autorizzata", "Binding offer authorized"))}</div>
              ${statusBox}
              <div class="offer-success-amount">${escapeHtml(formatCurrency(state.offerStatus.offerAmount))}</div>
              <div class="offer-success-copy">${escapeHtml(langText("Il seller ha 24 ore per accettare. Se accetta, catturiamo automaticamente il pagamento autorizzato. Se rifiuta o scade, l'autorizzazione viene rilasciata.", "The seller has 24 hours to accept. If accepted, we automatically capture the authorized payment. If declined or expired, the authorization is released."))}</div>
              <div class="offer-stack offer-stack--success">
                <div class="offer-summary"><strong>${langText("Stato", "Status")}</strong><span>${escapeHtml(getOfferStatusLabel(state.offerStatus))}</span></div>
                <div class="offer-summary"><strong>${langText("Autorizzazione", "Authorization")}</strong><span>${escapeHtml(getOfferAuthorizationLabel(state.offerStatus))}</span></div>
                <div class="offer-summary"><strong>${langText("Scadenza", "Expiration")}</strong><span>${escapeHtml(formatDateTime(state.offerStatus.expiresAt))}</span></div>
              </div>
              <div class="offer-stage-actions offer-stage-actions--success">
                <button class="offer-send" onclick="closeOffer()">${langText("Chiudi", "Close")}</button>
                <button class="offer-cancel" onclick="showBuyView('profile');setProfileArea('buyer','offers');closeOffer()">${langText("Vai alle mie offerte", "Go to my offers")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      if (state.offerStep === "authorization") {
      box.innerHTML = `
        <div class="offer-shell">
          <div class="offer-shell__header">
            <button class="offer-shell__icon offer-shell__icon--back" onclick="backOfferStep()" aria-label="${escapeHtml(langText("Indietro", "Back"))}">←</button>
            <div class="offer-step-indicator">${escapeHtml(stepLabel)}</div>
            <button class="offer-shell__icon" onclick="closeOffer()" aria-label="${escapeHtml(langText("Chiudi", "Close"))}">×</button>
          </div>
            <div class="offer-review-grid">
              <div class="offer-review-main">
                <section class="offer-review-intro">
                  <div class="offer-panel-kicker">${langText("Conferma finale", "Final review")}</div>
                  <h3>${langText("Controlla i dati prima di inviare", "Check the details before sending")}</h3>
                  <p>${langText("L'offerta resta attiva per 24 ore. Se il seller accetta, completiamo automaticamente il pagamento autorizzato.", "The offer stays active for 24 hours. If the seller accepts, we automatically complete the authorized payment.")}</p>
                </section>

                <div class="offer-review-contact-grid">
                <section class="offer-review-section${reviewState.missingShipping ? " is-missing" : ""}">
                  <div class="offer-review-section__head">
                    <h3>${langText("Indirizzo di spedizione", "Shipping address")}</h3>
                    <button class="offer-inline-link" onclick="openOfferProfileSection('settings_account')">${langText("Aggiorna", "Update")}</button>
                  </div>
                  <div class="offer-detail-card">
                    <div>
                      <strong>${escapeHtml(shippingSnapshot.name || langText("Cliente IRIS", "IRIS customer"))}</strong>
                      <span>${escapeHtml(shippingSnapshot.address || langText("Aggiungi via e numero civico", "Add street and number"))}</span>
                      <span>${escapeHtml([shippingSnapshot.city || langText("Citta da completare", "City missing"), shippingSnapshot.country || ""].filter(Boolean).join(" · "))}</span>
                    </div>
                  </div>
                </section>

                <section class="offer-review-section${reviewState.missingPhone ? " is-missing" : ""}">
                  <div class="offer-review-section__head">
                    <h3>${langText("Telefono", "Phone")}</h3>
                    <button class="offer-inline-link" onclick="openOfferProfileSection('settings_profile')">${langText("Aggiorna", "Update")}</button>
                  </div>
                  <div class="offer-detail-card">
                    <div>
                      <strong>${escapeHtml(phoneSnapshot || langText("Numero mancante", "Phone missing"))}</strong>
                      <span>${escapeHtml(langText("Usato solo per aggiornamenti consegna e problemi spedizione.", "Used only for delivery updates and shipping issues."))}</span>
                    </div>
                  </div>
                </section>
                </div>

                <section class="offer-review-section${reviewState.missingPayment ? " is-missing" : ""}">
                  <div class="offer-review-section__head">
                    <h3>${langText("Seleziona il metodo di autorizzazione", "Select your authorization method")}</h3>
                    <button class="offer-inline-link" onclick="openOfferProfileSection('settings_payment')">${langText("Apri pagamenti", "Open payments")}</button>
                  </div>
                  <div class="offer-payment-grid">
                    ${paymentOptions.map(function (option) {
                      const isSelected = selectedPayment && selectedPayment.id === option.id;
                      return `<button class="offer-payment-choice${isSelected ? " on" : ""}" onclick="selectOfferPaymentMethod('${escapeHtml(option.id)}')">
                        <span class="offer-payment-choice__kind">${escapeHtml(option.kind)}</span>
                        <strong>${escapeHtml(option.label)}</strong>
                        <em>${escapeHtml(option.meta)}</em>
                      </button>`;
                    }).join("")}
                  </div>
                </section>
              </div>

              <aside class="offer-review-side">
                <div class="offer-review-card offer-review-card--product">
                  ${productSummary}
                </div>
                <div class="offer-review-card">
                  <h3>${langText("Dettagli offerta", "Offer details")}</h3>
                  <div class="offer-summary-row"><span>${langText("Prezzo offerta", "Offer price")}</span><strong>${escapeHtml(formatCurrency(reviewState.amount || 0))}</strong></div>
                  <div class="offer-summary-row"><span>${langText("Spedizione", "Shipping")}</span><strong>${escapeHtml(formatCurrency(SHIPPING_COST))}</strong></div>
                  <div class="offer-summary-row"><span>${langText("Tasse stimate", "Estimated tax")}</span><strong>${escapeHtml(formatCurrency(0))}</strong></div>
                  <div class="offer-summary-row offer-summary-row--total"><span>${langText("Totale autorizzato", "Authorized total")}</span><strong>${escapeHtml(formatCurrency((reviewState.amount || 0) + SHIPPING_COST))}</strong></div>
                </div>
                <div class="offer-review-card offer-review-card--commitment">
                  <label class="offer-terms">
                    <input type="checkbox" ${termsAccepted ? "checked" : ""} onchange="toggleOfferTermsAccepted()">
                    <span>${langText("Accetto termini e buyer protection. Se il seller accetta, completiamo automaticamente il pagamento autorizzato.", "I accept the terms and buyer protection. If the seller accepts, we automatically complete the authorized payment.")}</span>
                  </label>
                  ${!reviewState.ok ? `<div class="offer-review-error">${escapeHtml(reviewState.error)}</div>` : ""}
                  ${statusBox}
                  <button class="offer-send" ${canSubmitReview ? "" : "disabled"} onclick="sendOffer()">${langText("Invia offerta vincolante", "Submit binding offer")}</button>
                </div>
                <div class="offer-protection">
                  <strong>${langText("Protezione acquisto IRIS", "IRIS purchase protection")}</strong>
                  <span>${escapeHtml(langText("L'offerta scade dopo 24 ore. Se il seller rifiuta o non risponde, l'autorizzazione viene rilasciata e non finalizziamo alcun addebito.", "The offer expires after 24 hours. If the seller declines or does not respond, the authorization is released and we do not finalize any charge."))}</span>
                </div>
              </aside>
            </div>
          </div>
        `;
        return;
      }

      box.innerHTML = `
        <div class="offer-shell">
          <div class="offer-shell__header">
            <div class="offer-shell__spacer"></div>
            <div class="offer-step-indicator">${escapeHtml(stepLabel)}</div>
            <button class="offer-shell__icon" onclick="closeOffer()" aria-label="${escapeHtml(langText("Chiudi", "Close"))}">×</button>
          </div>
          ${productSummary}
          <div class="offer-step-panel offer-step-panel--center offer-step-panel--amount">
            <div class="offer-panel-kicker">${langText("Offerta vincolante", "Binding offer")}</div>
            <div class="offer-amount-label">${langText("Quanto vuoi offrire?", "How much do you want to offer?")}</div>
            <div class="offer-amount-shell">
              <button class="offer-stepper" type="button" onclick="bumpOfferAmount(-${offerStepIncrement})" aria-label="${escapeHtml(langText("Riduci importo", "Decrease amount"))}">−</button>
              <div class="offer-amount-field${amountValidation.errorMessage ? " is-error" : ""}">
                <span class="offer-amount-currency">${escapeHtml(getOfferCurrencySymbol())}</span>
                <input class="offer-input${state.offerError ? " offer-input--error" : ""}" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="${escapeHtml(String(Math.round(convertBaseEurAmount(Number(product.minimumOfferAmount || 0)) || 0)))}" id="offerInput" value="${escapeHtml(amountValue)}" oninput="sanitizeOfferAmountInput(this)" onkeydown="handleOfferAmountKeydown(event)">
              </div>
              <button class="offer-stepper" type="button" onclick="bumpOfferAmount(${offerStepIncrement})" aria-label="${escapeHtml(langText("Aumenta importo", "Increase amount"))}">+</button>
            </div>
            <div class="offer-inline-error${amountValidation.errorMessage ? " is-visible" : ""}" id="offerAmountError">${escapeHtml(amountValidation.errorMessage || "")}</div>
            ${amountValidation.minimumText ? `<div class="offer-minimum-chip">${escapeHtml(amountValidation.minimumText)}</div>` : ""}
            ${statusBox}
            <div class="offer-inline-note">${escapeHtml(langText("Il seller ha 24 ore per rispondere. Autorizziamo solo il totale necessario e completiamo l'addebito solo se accetta.", "The seller has 24 hours to respond. We only authorize what is needed and complete the charge only if accepted."))}</div>
            <div class="offer-inline-meta">${escapeHtml(langText("Prezzo attuale", "Current price"))}: ${escapeHtml(formatCurrency(product.price))} · ${escapeHtml(langText("Step suggerito", "Suggested step"))}: ${escapeHtml(formatCurrency(convertLocalAmountToBase(offerStepIncrement)))}</div>
            <div class="offer-stage-actions">
              <button class="offer-send" id="offerContinueButton" ${amountValidation.canContinue ? "" : "disabled"} onclick="sendOffer()">${langText("Continua", "Continue")}</button>
              <button class="offer-cancel" onclick="closeOffer()">${t("cancel")}</button>
            </div>
          </div>
        </div>
      `;
      const input = qs("#offerInput");
      if (input) {
        input.focus();
        const length = input.value.length;
        try {
          if (typeof input.setSelectionRange === "function") {
            input.setSelectionRange(length, length);
          }
        } catch(e) {}
      }
    }

    openOffer = function (id) {
      requireAuth(function () {
        const product = getListingById(id);
        if (!product || !isProductPurchasable(product)) {
          showToast(langText("Questo articolo non è più disponibile.", "This item is no longer available."));
          return;
        }
        if (!product.offersEnabled) {
          showToast(langText("Il seller non accetta offerte per questo articolo.", "The seller does not accept offers on this listing."));
          return;
        }
        if (isSellerOnVacation(product)) {
          showToast(langText("Il seller è in vacanza e non accetta offerte al momento.", "The seller is on vacation and not accepting offers right now."));
          return;
        }
        offerProdId = id;
        state.offerDraft = {
          listingId: product.id,
          offerAmount: "",
          shippingSnapshot: getBuyerOfferDefaults().shippingSnapshot,
          paymentMethodSnapshot: getBuyerOfferDefaults().paymentMethodSnapshot,
          termsAccepted: false
        };
        state.offerStatus = null;
        state.offerError = "";
        state.offerStep = "amount";
        const modal = qs("#offerModal");
        if (modal) {
          modal.classList.add("open");
        }
        renderOfferModal();
      });
    };

    closeOffer = function () {
      const modal = qs("#offerModal");
      if (modal) {
        modal.classList.remove("open");
      }
      state.offerStep = "amount";
      state.offerError = "";
      state.offerStatus = null;
      state.offerDraft = null;
    };

    backOfferStep = function () {
      state.offerStep = "amount";
      state.offerError = "";
      renderOfferModal();
    };

    sendOffer = function () {
      const product = getListingById(offerProdId);
      if (!product) {
        closeOffer();
        return;
      }

      if (state.offerStep === "authorization") {
        const readiness = getOfferReviewReadiness(product, state.offerDraft || {});
        if (!readiness.ok) {
          state.offerError = readiness.error;
          renderOfferModal();
          return;
        }
        if (!(state.offerDraft && state.offerDraft.termsAccepted)) {
          state.offerError = langText("Devi accettare termini e protezione acquisto prima di inviare l'offerta.", "You need to accept the terms and purchase protection before submitting the offer.");
          renderOfferModal();
          return;
        }
        const payload = Object.assign({}, state.offerDraft, {
          listingId: product.id,
          buyerEmail: normalizeEmail(state.currentUser && state.currentUser.email),
          buyerName: state.currentUser && state.currentUser.name,
          sellerEmail: normalizeEmail(product.seller && product.seller.email),
          sellerName: product.seller && product.seller.name,
          shippingSnapshot: readiness.shipping,
          paymentMethodSnapshot: readiness.payment
        });
        const result = offerApiCreate(payload);
        if (!result.ok) {
          state.offerError = result.error;
          renderOfferModal();
          return;
        }
        state.offerStatus = result.offer;
        state.offerDraft = result.offer;
        state.offerError = "";
        state.offerStep = "success";
        renderOfferModal();
        renderNotifications();
        renderProfilePanel();
        return;
      }

      const input = qs("#offerInput");
      const rawAmount = input ? input.value : getOfferDraftAmountValue();
      const draftPayload = {
        listingId: product.id,
        buyerEmail: normalizeEmail(state.currentUser && state.currentUser.email),
        offerAmountLocal: rawAmount
      };
      const validation = validateOfferSubmission(draftPayload);
      if (!validation.ok) {
        state.offerError = validation.error;
        state.offerDraft = Object.assign({}, state.offerDraft || {}, { listingId: product.id, offerAmountLocal: rawAmount || "" });
        renderOfferModal();
        return;
      }
      const amountValidation = getOfferAmountValidation(product, rawAmount);
      if (!amountValidation.canContinue) {
        state.offerError = amountValidation.errorMessage;
        state.offerDraft = Object.assign({}, state.offerDraft || {}, { listingId: product.id, offerAmountLocal: rawAmount || "" });
        renderOfferModal();
        return;
      }
      state.offerDraft = Object.assign({}, state.offerDraft || {}, {
        listingId: product.id,
        offerAmount: validation.amount,
        offerAmountLocal: amountValidation.rawValue,
        buyerEmail: normalizeEmail(state.currentUser && state.currentUser.email),
        buyerName: state.currentUser && state.currentUser.name,
        sellerEmail: normalizeEmail(product.seller && product.seller.email),
        sellerName: product.seller && product.seller.name,
        shippingSnapshot: state.offerDraft && state.offerDraft.shippingSnapshot ? state.offerDraft.shippingSnapshot : getBuyerOfferDefaults().shippingSnapshot,
        paymentMethodSnapshot: state.offerDraft && state.offerDraft.paymentMethodSnapshot ? state.offerDraft.paymentMethodSnapshot : getBuyerOfferDefaults().paymentMethodSnapshot
      });
      state.offerError = "";
      state.offerStep = "authorization";
      renderOfferModal();
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
    window.openOffer = openOffer;
    window.closeOffer = closeOffer;
    window.backOfferStep = backOfferStep;
    window.sanitizeOfferAmountInput = sanitizeOfferAmountInput;
    window.bumpOfferAmount = bumpOfferAmount;
    window.selectOfferPaymentMethod = selectOfferPaymentMethod;
    window.toggleOfferTermsAccepted = toggleOfferTermsAccepted;
    window.openOfferProfileSection = openOfferProfileSection;
    window.renderOfferModal = renderOfferModal;
    window.sendOffer = sendOffer;
    window.handleOfferAmountKeydown = handleOfferAmountKeydown;
  }

  function overrideMarketplaceFunctions() {
    const originalApplyLang = applyLang;
    applyLang = function () {
      try {
        originalApplyLang();
      } catch (error) {
        // The legacy inline applyLang touches old selectors; keep the SPA usable if one is missing.
      }
      const locale = getLocaleConfig();
      ensureLanguageSelector();
      renderLocaleMenu();
      syncLocaleTrigger();
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
      const modeButton = qs("#modeToggle");
      if (modeButton) {
        modeButton.textContent = darkMode ? langText("Tema chiaro", "Light mode") : langText("Tema scuro", "Dark mode");
      }
      const langSelect = qs("#langToggle");
      if (langSelect) {
        if (langSelect.tagName === "SELECT") {
          langSelect.value = curLang;
        }
        langSelect.setAttribute("title", locale.nativeLabel + " · " + locale.currency);
      }
      updateCookieBannerContent();
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
      syncNavigationLabels();
      if (typeof render === "function") {
        render();
      }
      renderHomeView();
      if (typeof renderFooters === "function") {
        renderFooters();
      }
      renderCartDrawer();
      renderCheckoutModal();
      renderOpsModal();
      renderOpsView();
      renderProfilePanel();
      if (qs("#chat-view") && qs("#chat-view").classList.contains("active")) {
        renderChats();
      }
      if (qs("#seller-view") && qs("#seller-view").classList.contains("active") && typeof renderSellerProfileView === "function") {
        renderSellerProfileView();
      }
      if (qs("#offerModal") && qs("#offerModal").classList.contains("open") && typeof renderOfferModal === "function") {
        renderOfferModal();
      }
      if (state.activeDetailListingId && qs("#detail-view") && qs("#detail-view").classList.contains("active")) {
        showDetail(state.activeDetailListingId);
      }
      updateSellStatus(t("sell_status_idle"));
    };

    switchLang = function (nextLang) {
      const localeCodes = Object.keys(LOCALE_SETTINGS);
      if (nextLang && LOCALE_SETTINGS[nextLang]) {
        setLanguage(nextLang);
        closeLocaleMenu();
        return;
      }
      const currentIndex = Math.max(0, localeCodes.indexOf(curLang));
      setLanguage(localeCodes[(currentIndex + 1) % localeCodes.length]);
      closeLocaleMenu();
    };

    toggleDarkLight = function () {
      darkMode = !darkMode;
      document.body.classList.toggle("light-mode", !darkMode);
      persistPreference("iris-mode", darkMode ? "dark" : "light");
      applyLang();
    };

    dismissPwa = function () {
      const banner = qs("#pwaBanner");
      if (banner) {
        banner.style.display = "none";
      }
      persistPreference("iris-pwa-dismissed", "1");
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

    function ensureExtendedFilters() {
      filters = Object.assign({
        cats: [],
        brands: [],
        conds: [],
        fits: [],
        colors: [],
        genders: [],
        materials: [],
        trust: [],
        size: "",
        pmin: "",
        pmax: "",
        search: ""
      }, filters || {});
    }

    function getTrustFilterOptions() {
      return [
        { id: "verified", label: langText("IRIS Verified", "IRIS Verified") },
        { id: "authenticated", label: langText("Authenticated by IRIS", "Authenticated by IRIS") },
        { id: "guaranteed", label: langText("IRIS Guaranteed", "IRIS Guaranteed") }
      ];
    }

    function getFilterTokenLabel(kind, value) {
      if (kind === "genders") {
        return langText(value === "Men" ? "Uomo" : value === "Women" ? "Donna" : "Unisex", value);
      }
      if (kind === "materials") {
        return value;
      }
      if (kind === "trust") {
        const option = getTrustFilterOptions().find(function (item) { return item.id === value; });
        return option ? option.label : value;
      }
      return getFacetLabel(kind, value);
    }

    function renderHorizontalFilterRail() {
      const host = qs("#activeFilters");
      if (!host) {
        return;
      }
      const groups = [
        { key: "brands", label: langText("Brand", "Brand"), values: getAvailableBrands().slice(0, 10) },
        { key: "genders", label: langText("Genere", "Gender"), values: getAvailableGenders() },
        { key: "cats", label: langText("Categoria", "Category"), values: getAvailableCategories() },
        { key: "conds", label: langText("Condizione", "Condition"), values: getAvailableConditions() },
        { key: "materials", label: langText("Materiale", "Material"), values: getAvailableMaterials().slice(0, 8) }
      ];
      const trustChips = getTrustFilterOptions().map(function (option) {
        return `<button class="irisx-filter-chip irisx-filter-chip--trust${filters.trust.includes(option.id) ? " is-active" : ""}" onclick="toggleFilterChip('trust', '${escapeHtml(option.id)}')">${escapeHtml(option.label)}</button>`;
      }).join("");
      const groupMarkup = groups.map(function (group) {
        if (!group.values.length) {
          return "";
        }
        return `<div class="irisx-filter-group"><span class="irisx-filter-label">${escapeHtml(group.label)}</span><div class="irisx-filter-chip-row">${group.values.map(function (value) {
          return `<button class="irisx-filter-chip${filters[group.key].includes(value) ? " is-active" : ""}" onclick="toggleFilterChip('${group.key}','${escapeHtml(value)}')">${escapeHtml(getFilterTokenLabel(group.key, value))}</button>`;
        }).join("")}</div></div>`;
      }).join("");
      host.innerHTML = `<div class="irisx-filter-rail">
        <div class="irisx-filter-group irisx-filter-group--trust"><span class="irisx-filter-label">${escapeHtml(langText("Fiducia IRIS", "IRIS trust"))}</span><div class="irisx-filter-chip-row">${trustChips}</div></div>
        ${groupMarkup}
        <div class="irisx-filter-group irisx-filter-group--price">
          <span class="irisx-filter-label">${escapeHtml(langText("Prezzo", "Price"))}</span>
          <div class="irisx-filter-price-row">
            <input id="irisxFilterMin" class="irisx-filter-input" type="text" inputmode="decimal" placeholder="${escapeHtml(t("price_min"))}" value="${escapeHtml(filters.pmin || "")}" onblur="applyFilters()">
            <input id="irisxFilterMax" class="irisx-filter-input" type="text" inputmode="decimal" placeholder="${escapeHtml(t("price_max"))}" value="${escapeHtml(filters.pmax || "")}" onblur="applyFilters()">
            <button class="irisx-filter-reset" onclick="clearFilters()">${escapeHtml(langText("Reset", "Reset"))}</button>
          </div>
        </div>
        <div class="active-filters irisx-active-filter-row" id="activeFilterChips"></div>
      </div>`;
    }

    initFilters = function () {
      ensureExtendedFilters();
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
      renderHorizontalFilterRail();
    };

    clearFilters = function () {
      filters = { cats: [], brands: [], conds: [], fits: [], colors: [], genders: [], materials: [], trust: [], size: "", pmin: "", pmax: "", search: "" };
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
      const minInput = qs("#irisxFilterMin") || qs("#f-pmin");
      const maxInput = qs("#irisxFilterMax") || qs("#f-pmax");
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
      ensureExtendedFilters();
      const minPrice = parseLocalizedNumberInput(filters.pmin);
      const maxPrice = parseLocalizedNumberInput(filters.pmax);
      const sizeQuery = normalizeSearchText(filters.size);
      const searchQuery = normalizeSearchText(filters.search);

      const items = getVisibleCatalogProducts().filter(function (product) {
        const normalizedCategory = normalizeCategoryValue(product.cat);
        const convertedPrice = convertBaseEurAmount(product.price);
        const searchable = getProductSearchIndex(product);
        const trustMeta = getListingTrustMeta(product);
        const gender = inferListingGender(product);
        const material = String(product.material || "").trim();

        if (filters.cats.length && !filters.cats.includes(normalizedCategory)) return false;
        if (filters.brands.length && !filters.brands.includes(product.brand)) return false;
        if (filters.conds.length && !filters.conds.includes(product.cond)) return false;
        if (filters.fits.length && !filters.fits.includes(product.fit)) return false;
        if (filters.colors.length && !filters.colors.includes(product.color)) return false;
        if (filters.genders.length && !filters.genders.includes(gender)) return false;
        if (filters.materials.length && !filters.materials.includes(material)) return false;
        if (filters.trust.includes("verified") && !trustMeta.verified) return false;
        if (filters.trust.includes("authenticated") && !trustMeta.authenticated) return false;
        if (filters.trust.includes("guaranteed") && !trustMeta.guaranteed) return false;
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
      ensureExtendedFilters();
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

    toggleFilterChip = function (type, value) {
      ensureExtendedFilters();
      if (!Array.isArray(filters[type])) {
        return;
      }
      const idx = filters[type].indexOf(value);
      if (idx > -1) {
        filters[type].splice(idx, 1);
      } else {
        filters[type].push(value);
      }
      initFilters();
      render();
    };
    window.toggleFilterChip = toggleFilterChip;

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
        const product = getListingById(productId) || prods.find(function (candidate) { return String(candidate.id) === String(productId); }) || null;
        const seller = (product && product.seller) || sellers.find(function (candidate) { return candidate.id === sellerId; }) || {};
        const sellerEmail = normalizeEmail((product && (product.ownerEmail || (product.seller && product.seller.email))) || seller.email || "");
        let threadIndex = chats.findIndex(function (thread) {
          const threadListingId = thread.listingId || thread.productId || (thread.product && thread.product.id);
          const threadSellerEmail = normalizeEmail(
            (thread.sellerEmail) ||
            (thread.product && (thread.product.ownerEmail || (thread.product.seller && thread.product.seller.email))) ||
            (thread.with && thread.with.email) ||
            ""
          );
          return String(threadListingId) === String(productId) && threadSellerEmail === sellerEmail;
        });
        if (threadIndex === -1 && curChat) {
          threadIndex = chats.findIndex(function (thread) { return thread.id === curChat; });
        }
        if (threadIndex > -1) {
          const buyer = state.currentUser || {};
          const normalizedThread = normalizeChatThread(Object.assign({}, chats[threadIndex], {
            product: product || chats[threadIndex].product,
            listingId: productId,
            productId: productId,
            sellerId: seller.id || sellerId || chats[threadIndex].sellerId,
            sellerEmail: sellerEmail || chats[threadIndex].sellerEmail,
            sellerName: seller.name || chats[threadIndex].sellerName || (chats[threadIndex].with && chats[threadIndex].with.name),
            buyerId: buyer.id || buyer.email || chats[threadIndex].buyerId,
            buyerEmail: buyer.email || chats[threadIndex].buyerEmail,
            buyerName: buyer.name || chats[threadIndex].buyerName,
            updatedAt: Date.now()
          }));
          chats[threadIndex] = normalizedThread;
          curChat = normalizedThread.id;
          state.chatScope = getChatConversationScope(normalizedThread);
          persistChats();
          renderChats();
        }
      });
    };

    showBuyView = function (view) {
      const targetView = view || "home";
      const viewToken = bumpViewSyncToken();
      const ids = ["home-view", "shop-view", "detail-view", "fav-view", "chat-view", "profile-view", "seller-view", "ops-view"];

      closeProfileMenu();
      closeMobileNav();
      closeMobileFilters();

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
        detailView.style.paddingTop = "";
      }

      state.lastNonDetailView = targetView === "detail" ? state.lastNonDetailView : targetView;

      const mobileFilterButton = qs(".mob-filter-btn");
      if (mobileFilterButton) {
        mobileFilterButton.style.display = targetView === "shop" ? "" : "none";
      }

      syncTopnavChrome(targetView);

      if (targetView === "home") {
        renderHomeView();
        qs("#home-view").classList.add("active");
        setActiveNav("home");
        if (typeof renderFooters === "function") {
          renderFooters();
        }
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "shop") {
        showSkeleton("grid", "grid");
        qs("#shop-view").classList.add("active");
        setActiveNav("shop");
        setTimeout(function () {
          if (state.viewSyncToken !== viewToken || !qs("#shop-view") || !qs("#shop-view").classList.contains("active")) {
            return;
          }
          render();
          renderFooters();
          syncTopnavChrome(targetView);
        }, 180);
        syncTopnavChrome(targetView);
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "fav") {
        qs("#fav-view").classList.add("active", "view-enter");
        renderFavorites();
        setActiveNav("fav");
        syncTopnavChrome(targetView);
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "chat") {
        const chatView = qs("#chat-view");
        chatView.classList.add("active");
        showSkeleton("chatList", "chat");
        setActiveNav("chat");
        setTimeout(function () {
          if (state.viewSyncToken !== viewToken || !qs("#chat-view") || !qs("#chat-view").classList.contains("active")) {
            return;
          }
          renderChats();
          syncTopnavChrome(targetView);
        }, 200);
        syncTopnavChrome(targetView);
        return;
      }

      if (targetView === "profile") {
        qs("#profile-view").classList.add("active", "view-enter");
        renderProfilePanel();
        setActiveNav("profile");
        syncTopnavChrome(targetView);
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "seller") {
        qs("#seller-view").classList.add("active", "view-enter");
        renderSellerProfileView();
        setActiveNav("");
        syncTopnavChrome(targetView);
        window.scrollTo(0, 0);
        return;
      }

      if (targetView === "ops") {
        qs("#ops-view").classList.add("active", "view-enter");
        renderOpsView();
        setActiveNav("ops");
        syncTopnavChrome(targetView);
      }
    };

    render = function () {
      const items = getFiltered().filter(isProductPurchasable);
      const grid = qs("#grid");
      const activeFilters = qs("#activeFilterChips") || qs("#activeFilters");

      qs("#resultCount").textContent = items.length;

      const chips = [];
      filters.genders.forEach((value) => chips.push({ label: getFilterTokenLabel("genders", value), type: "genders", value: value }));
      filters.cats.forEach((value) => chips.push({ label: getFacetLabel("cats", value), type: "cats", value: value }));
      filters.brands.forEach((value) => chips.push({ label: value, type: "brands", value: value }));
      filters.conds.forEach((value) => chips.push({ label: getFacetLabel("conds", value), type: "conds", value: value }));
      filters.materials.forEach((value) => chips.push({ label: value, type: "materials", value: value }));
      filters.trust.forEach((value) => chips.push({ label: getFilterTokenLabel("trust", value), type: "trust", value: value }));
      filters.fits.forEach((value) => chips.push({ label: getFacetLabel("fits", value), type: "fits", value: value }));
      filters.colors.forEach((value) => chips.push({ label: getFacetLabel("colors", value), type: "colors", value: value }));
      if (filters.size) chips.push({ label: t("size") + ": " + filters.size, type: "size", value: filters.size });
      if (filters.pmin) chips.push({ label: t("price_min") + ": " + formatLocalCurrencyValue(filters.pmin), type: "pmin", value: filters.pmin });
      if (filters.pmax) chips.push({ label: t("price_max") + ": " + formatLocalCurrencyValue(filters.pmax), type: "pmax", value: filters.pmax });
      if (filters.search) chips.push({ label: t("search_short") + ": " + filters.search, type: "search", value: filters.search });

      if (activeFilters) {
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
      }

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
          const productIdExpr = inlineJsValue(product.id);
          const safeName = escapeHtml(product.name);
          const safeBrand = escapeHtml(product.brand);
          return (
            "<div class=\"pc\" onclick=\"showDetail(" +
            productIdExpr +
            ")\">" +
            "<button class=\"pc-heart liked\" onclick=\"event.stopPropagation();toggleFav(" +
            productIdExpr +
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

      closeProfileMenu();
      closeMobileNav();
      closeMobileFilters();

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
      syncTopnavChrome("detail");
      window.scrollTo(0, 0);
      updateMeta("IRIS - " + product.brand + " " + product.name, product.desc.substring(0, 160));
    };

    closeDetail = function () {
      state.activeDetailListingId = null;
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
    const imageSources = getListingImageSources(product);
    const primaryImage = imageSources[0] || "";
    const conditionLabel = getFacetLabel("conds", product.cond);
    const fitLabel = getFacetLabel("fits", product.fit);
    const soldTag = !isProductPurchasable(product) ? "<span class=\"pi-tag sold\">" + escapeHtml(getProductStatusLabel(product)) + "</span>" : "";
    const media = primaryImage
      ? "<div class=\"pi\"><div class=\"pi-bg irisx-media\"><img class=\"irisx-card-image\" src=\"" +
        primaryImage +
        "\" loading=\"lazy\" alt=\"" +
        escapeHtml(product.brand + " - " + product.name) +
        "\" onerror=\"this.style.display='none';this.parentNode.classList.remove('irisx-media');this.parentNode.innerHTML='<div class=&quot;pi-emoji&quot;>" + escapeHtml(product.emoji || "👜") + "</div>'\"></div>" +
        (compact ? "" : "<div class=\"pi-tags\"><span class=\"pi-tag avail\">" + escapeHtml(conditionLabel) + "</span>" + (product.fit !== "—" ? "<span class=\"pi-tag fit\">" + escapeHtml(fitLabel) + "</span>" : "") + soldTag + "</div>") +
        "</div>"
      : "<div class=\"pi\"><div class=\"pi-bg\"><div class=\"pi-emoji\">" + escapeHtml(product.emoji || "👜") + "</div></div>" + (compact ? "" : "<div class=\"pi-tags\"><span class=\"pi-tag avail\">" + escapeHtml(conditionLabel) + "</span>" + (product.fit !== "—" ? "<span class=\"pi-tag fit\">" + escapeHtml(fitLabel) + "</span>" : "") + soldTag + "</div>") + "</div>";
    return media;
  }

  function getDetailActionsMarkup(product, liked) {
    const favBtn =
      "<button class=\"det-fav\" onclick=\"toggleFav(" +
      product.id +
      ",null)\">" +
      (liked ? "♥ " + t("saved_fav") : "♡ " + t("add_fav")) +
      "</button>";

    if (!isProductPurchasable(product)) {
      return (
        "<div class=\"irisx-note\">" +
        langText("Questo articolo risulta già venduto o non disponibile per nuovi acquisti.", "This item is already sold or unavailable.") +
        "</div><div class=\"irisx-detail-actions\">" + favBtn + "</div>"
      );
    }

    if (isSellerOnVacation(product)) {
      const msg = getSellerVacationMessage(product);
      return (
        "<div class=\"irisx-vacation-banner\">" +
        "<span class=\"irisx-vacation-icon\">🏖</span>" +
        "<div><strong>" + langText("Seller in vacanza", "Seller on vacation") + "</strong>" +
        "<span>" + escapeHtml(msg) + "</span></div>" +
        "</div>" +
        "<div class=\"irisx-detail-actions\">" + favBtn + "</div>"
      );
    }

    const offerBtn = product.offersEnabled !== false
      ? "<button class=\"det-offer\" onclick=\"openOffer(" + product.id + ")\">" + t("make_offer") + "</button>"
      : "";

    const offerBtnHalf = offerBtn ? offerBtn.replace('class="det-offer"', 'class="det-offer det-half"') : "";
    const liked2 = liked;

    return (
      "<div class=\"irisx-detail-actions\"><button class=\"det-buy\" onclick=\"buyNow(" +
      product.id + ")\">" +
      t("buy_now") + " · " + formatCurrency(product.price) +
      "</button><div class=\"det-row-pair\"><button class=\"irisx-secondary det-half\" onclick=\"addToCart(" +
      product.id + ")\">" +
      t("add_to_cart") +
      "</button>" + offerBtnHalf + "</div>" +
      "<div class=\"det-icon-row\">" +
      "<button class=\"det-icon-btn" + (liked2 ? " det-icon-active" : "") + "\" onclick=\"toggleFav(" + product.id + ",null)\" title=\"" + (liked2 ? t("saved_fav") : t("add_fav")) + "\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"" + (liked2 ? "currentColor" : "none") + "\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z\"/></svg></button>" +
      "</div></div>"
    );
  }

  function getProductCardMarkupDiscount(discount) {
    return "-" + discount + "%";
  }

  function getProductCardMarkupFooter(product, discount) {
    return isProductPurchasable(product) ? getProductCardMarkupDiscount(discount) : getProductStatusLabel(product);
  }

  function productCardMarkup(product) {
    const discount = getListingDiscount(product);
    const liked = favorites.has(product.id);
    const productIdExpr = inlineJsValue(product.id);
    const seller = buildListingSeller(product);
    const trustMeta = getListingTrustMeta(product);
    const vacationBadge = isSellerOnVacation(product)
      ? "<span class=\"pc-vacation-badge\">🏖 " + langText("In vacanza", "On vacation") + "</span>"
      : "";
    const trustBadge = trustMeta.verified
      ? "<span class=\"pc-trust-badge\">" + escapeHtml(langText("IRIS Verified", "IRIS Verified")) + "</span>"
      : "";
    return (
      "<div class=\"pc\" onclick=\"showDetail(" +
      productIdExpr +
      ")\"><button class=\"pc-heart" +
      (liked ? " liked" : "") +
      "\" aria-label=\"" +
      escapeHtml(langText("Aggiungi ai preferiti", "Add to favorites")) +
      "\" onclick=\"event.stopPropagation();toggleFav(" +
      productIdExpr +
      ",this)\">" +
      (liked ? "♥" : "♡") +
      "</button>" +
      vacationBadge +
      trustBadge +
      productVisualMarkup(product) +
      "<div class=\"pinfo\"><div class=\"p-brand\">" +
      escapeHtml(product.brand) +
      "</div><div class=\"p-name\">" +
      escapeHtml(product.name) +
      "</div><div class=\"p-meta\">" +
      escapeHtml(getProductMetaSummary(product)) +
      "</div><div class=\"p-footer\"><div><span class=\"p-price\">" +
      formatCurrency(product.price) +
      "</span><span class=\"p-orig\">" +
      formatCurrency(getListingOriginalPrice(product)) +
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
    const activeIndex = Math.min(Math.max(Number(state.activeDetailImage || 0), 0), images.length - 1);
    const navControls = images.length > 1
      ? `<button class="irisx-detail-nav irisx-detail-nav--prev" type="button" onclick="stepDetailImage(-1)" aria-label="${escapeHtml(langText("Foto precedente", "Previous image"))}">‹</button>
         <button class="irisx-detail-nav irisx-detail-nav--next" type="button" onclick="stepDetailImage(1)" aria-label="${escapeHtml(langText("Foto successiva", "Next image"))}">›</button>`
      : "";

    const thumbs = images
      .map(function (src, index) {
        return (
          "<button class=\"irisx-detail-thumb" +
          (index === activeIndex ? " on" : "") +
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
      "<div class=\"irisx-detail-media\"><div class=\"irisx-detail-stage\">" +
      navControls +
      "<img class=\"irisx-detail-image\" id=\"detailMainImage\" src=\"" +
      images[activeIndex] +
      "\" alt=\"" +
      escapeHtml(product.name) +
      "\"></div>" +
      (images.length > 1 ? "<div class=\"irisx-detail-thumbs\">" + thumbs + "</div>" : "") +
      "</div>"
    );
  }

  function setDetailImage(index) {
    const mainImage = qs("#detailMainImage");
    const currentProduct = state.activeDetailListingId ? getListingById(state.activeDetailListingId) : null;
    if (!mainImage || !currentProduct || !currentProduct.images[index]) {
      return;
    }

    state.activeDetailImage = index;
    mainImage.src = currentProduct.images[index];
    qsa(".irisx-detail-thumb").forEach(function (thumb, thumbIndex) {
      thumb.classList.toggle("on", thumbIndex === index);
    });
  }

  function stepDetailImage(direction) {
    const currentProduct = state.activeDetailListingId ? getListingById(state.activeDetailListingId) : null;
    const images = currentProduct && Array.isArray(currentProduct.images) ? currentProduct.images : [];
    if (!images.length) {
      return;
    }
    const currentIndex = Math.min(Math.max(Number(state.activeDetailImage || 0), 0), images.length - 1);
    const nextIndex = (currentIndex + direction + images.length) % images.length;
    setDetailImage(nextIndex);
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
      "</div></div><button class=\"irisx-close\" aria-label=\"" + langText("Chiudi", "Close") + "\" onclick=\"closeAuthModal()\">✕</button></div><div class=\"irisx-card-body\">" +
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
      "</button></div><form class=\"irisx-auth-form\" onsubmit=\"event.preventDefault();submitAuth()\"><div class=\"irisx-form-grid\"><div class=\"irisx-field" +
      (isLogin ? " irisx-hidden" : "") +
      "\"><label for=\"irisxAuthName\">" +
      t("full_name") +
      "</label><input id=\"irisxAuthName\" type=\"text\" autocomplete=\"name\"></div><div class=\"irisx-field\"><label for=\"irisxAuthEmail\">" +
      t("email") +
      "</label><input id=\"irisxAuthEmail\" type=\"email\" autocomplete=\"email\"></div><div class=\"irisx-field\"><label for=\"irisxAuthPhone\">" +
      langText("Telefono", "Phone number") +
      "</label><input id=\"irisxAuthPhone\" type=\"tel\" autocomplete=\"tel\" inputmode=\"tel\" placeholder=\"" +
      langText("+39 333 123 4567", "+39 333 123 4567") +
      "\"></div><div class=\"irisx-field\"><label for=\"irisxAuthPassword\">" +
      t("password") +
      "</label><input id=\"irisxAuthPassword\" type=\"password\" autocomplete=\"" +
      (isLogin ? "current-password" : "new-password") +
      "\"></div></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" type=\"submit\">" +
      t(isLogin ? "auth_cta_login" : "auth_cta_register") +
      "</button></div></form><div class=\"irisx-auth-switch\">" +
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
        var normalizedEmail = normalizeEmail(u.email);
        var existingGoogleUser = state.users.find(function (user) {
          return normalizeEmail(user.email) === normalizedEmail;
        });
        var blockedGoogleMessage = getBlockedIdentityMessage(normalizedEmail, existingGoogleUser && existingGoogleUser.phone);
        if ((existingGoogleUser && existingGoogleUser.accountStatus === "banned") || blockedGoogleMessage) {
          var blockedStatus = qs("#irisxAuthStatus");
          if (blockedStatus) {
            setInlineStatus(blockedStatus, blockedGoogleMessage || langText("Account bloccato.", "Account blocked."), true);
          } else {
            showToast(blockedGoogleMessage || langText("Account bloccato.", "Account blocked."));
          }
          return;
        }
        state.currentUser = normalizeUserWorkspace({
          id: (existingGoogleUser && existingGoogleUser.id) || u.uid,
          name: (existingGoogleUser && existingGoogleUser.name) || u.displayName || "Utente Google",
          email: normalizedEmail,
          phone: (existingGoogleUser && existingGoogleUser.phone) || "",
          role: deriveUserRole(normalizedEmail),
          city: (existingGoogleUser && existingGoogleUser.city) || "",
          country: (existingGoogleUser && existingGoogleUser.country) || "Italia",
          bio: (existingGoogleUser && existingGoogleUser.bio) || "",
          memberSince: (existingGoogleUser && existingGoogleUser.memberSince) || new Date().toISOString().slice(0, 10),
          avatar: u.photoURL || (existingGoogleUser && existingGoogleUser.avatar) || "",
          verification: Object.assign({}, existingGoogleUser && existingGoogleUser.verification ? existingGoogleUser.verification : {}, {
            emailVerified: true,
            emailVerifiedAt: Date.now(),
            verifiedEmail: normalizedEmail
          })
        });
        if (!state.users.some(function (user) { return normalizeEmail(user.email) === normalizedEmail; })) {
          state.users.push(Object.assign({}, state.currentUser, { password: "" }));
          saveJson(STORAGE_KEYS.users, state.users);
          notifyNewUser(state.currentUser);
        } else {
          state.users = state.users.map(function (user) {
            return normalizeEmail(user.email) === normalizedEmail
              ? Object.assign({}, user, state.currentUser, { password: user.password || "" })
              : user;
          });
          saveJson(STORAGE_KEYS.users, state.users);
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
    var mockName = curLang === "it" ? "Accesso Google demo" : "Google demo sign-in";
    var mockEmail = "demo.google@iris-fashion.it";
    var existing = state.users.find(function(u) { return normalizeEmail(u.email) === normalizeEmail(mockEmail); });
    var blockedMessage = getBlockedIdentityMessage(mockEmail, existing && existing.phone);
    if ((existing && existing.accountStatus === "banned") || blockedMessage) {
      var blockedGoogleStatus = qs("#irisxAuthStatus");
      if (blockedGoogleStatus) {
        setInlineStatus(blockedGoogleStatus, blockedMessage || (curLang === "it" ? "Account bloccato." : "Account blocked."), true);
      } else {
        showToast(blockedMessage || (curLang === "it" ? "Account bloccato." : "Account blocked."));
      }
      return;
    }
    state.currentUser = normalizeUserWorkspace({
      id: existing && existing.id ? existing.id : "google_" + Date.now(),
      name: existing && existing.name ? existing.name : mockName,
      email: mockEmail,
      phone: existing && existing.phone ? existing.phone : "",
      role: deriveUserRole(mockEmail),
      city: existing && existing.city ? existing.city : "Milano",
      country: existing && existing.country ? existing.country : "Italia",
      bio: existing && existing.bio ? existing.bio : "",
      memberSince: existing && existing.memberSince ? existing.memberSince : new Date().toISOString().slice(0, 10),
      avatar: existing && existing.avatar ? existing.avatar : "",
      verification: Object.assign({}, existing && existing.verification ? existing.verification : {}, {
        emailVerified: true,
        emailVerifiedAt: Date.now(),
        verifiedEmail: normalizeEmail(mockEmail)
      })
    });
    // Save new user
    if (!existing) {
      state.users.push(Object.assign({}, state.currentUser, { password: "" }));
      saveJson(STORAGE_KEYS.users, state.users);
      notifyNewUser(state.currentUser);
    } else {
      state.users = state.users.map(function (user) {
        return normalizeEmail(user.email) === normalizeEmail(mockEmail)
          ? Object.assign({}, user, state.currentUser, { password: user.password || "" })
          : user;
      });
      saveJson(STORAGE_KEYS.users, state.users);
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

  function requestVerificationCode(kind) {
    if (!state.currentUser) {
      return;
    }
    const user = normalizeUserWorkspace(state.currentUser);
    const isEmail = kind === "email";
    const target = isEmail ? normalizeEmail(user.email) : normalizePhoneNumber(user.phone);
    if (!target) {
      showToast(isEmail
        ? langText("Aggiungi prima un'email valida.", "Add a valid email first.")
        : langText("Aggiungi prima un numero di telefono valido.", "Add a valid phone number first."));
      return;
    }
    const blockedMessage = getBlockedIdentityMessage(isEmail ? target : user.email, isEmail ? user.phone : target);
    if (user.accountStatus === "banned" || blockedMessage) {
      showToast(blockedMessage || langText("Account bloccato.", "Account blocked."));
      return;
    }
    const code = generateVerificationCode();
    const expiresAt = Date.now() + (15 * 60 * 1000);
    const nextVerification = Object.assign({}, user.verification, isEmail ? {
      pendingEmailCode: code,
      pendingEmailCodeExpiresAt: expiresAt,
      lastEmailVerificationSentAt: Date.now()
    } : {
      pendingPhoneCode: code,
      pendingPhoneCodeExpiresAt: expiresAt,
      lastPhoneVerificationSentAt: Date.now()
    });
    syncCurrentUserWorkspace({ verification: nextVerification });
    if (isEmail) {
      enqueueEmail("verify-account", target, {
        email: target,
        code: code
      });
    } else {
      createNotification({
        audience: "user",
        kind: "verification",
        title: langText("Codice telefono generato", "Phone code generated"),
        body: langText("Codice demo: ", "Demo code: ") + code,
        recipientEmail: user.email
      });
    }
    recordAuditEvent(isEmail ? "email_verification_requested" : "phone_verification_requested", target);
    renderNotifications();
    renderProfilePanel();
    showToast((isEmail
      ? langText("Codice email inviato", "Email code sent")
      : langText("Codice telefono inviato", "Phone code sent")) + " · demo: " + code);
  }

  function confirmVerificationCode(kind) {
    if (!state.currentUser) {
      return;
    }
    const user = normalizeUserWorkspace(state.currentUser);
    const isEmail = kind === "email";
    const input = qs(isEmail ? "#securityEmailCode" : "#securityPhoneCode");
    const rawCode = String(input && input.value ? input.value : "").replace(/\D/g, "").trim();
    const expectedCode = isEmail ? user.verification.pendingEmailCode : user.verification.pendingPhoneCode;
    const expiresAt = isEmail ? Number(user.verification.pendingEmailCodeExpiresAt || 0) : Number(user.verification.pendingPhoneCodeExpiresAt || 0);
    if (!rawCode) {
      showToast(isEmail
        ? langText("Inserisci il codice email.", "Enter the email code.")
        : langText("Inserisci il codice telefono.", "Enter the phone code."));
      return;
    }
    if (!expectedCode || !expiresAt || Date.now() > expiresAt) {
      showToast(isEmail
        ? langText("Il codice email è scaduto. Richiedine uno nuovo.", "The email code expired. Request a new one.")
        : langText("Il codice telefono è scaduto. Richiedine uno nuovo.", "The phone code expired. Request a new one."));
      return;
    }
    if (rawCode !== String(expectedCode)) {
      showToast(isEmail
        ? langText("Codice email non corretto.", "Incorrect email code.")
        : langText("Codice telefono non corretto.", "Incorrect phone code."));
      return;
    }
    const nextVerification = Object.assign({}, user.verification, isEmail ? {
      emailVerified: true,
      emailVerifiedAt: Date.now(),
      verifiedEmail: normalizeEmail(user.email),
      pendingEmailCode: "",
      pendingEmailCodeExpiresAt: null
    } : {
      phoneVerified: true,
      phoneVerifiedAt: Date.now(),
      verifiedPhone: normalizePhoneNumber(user.phone),
      pendingPhoneCode: "",
      pendingPhoneCodeExpiresAt: null
    });
    syncCurrentUserWorkspace({ verification: nextVerification });
    recordAuditEvent(isEmail ? "email_verified" : "phone_verified", isEmail ? user.email : user.phone);
    renderProfilePanel();
    showToast(isEmail
      ? langText("Email verificata.", "Email verified.")
      : langText("Telefono verificato.", "Phone verified."));
  }

  function submitAuth() {
    const isLogin = state.authMode === "login";
    const status = qs("#irisxAuthStatus");
    const nameField = qs("#irisxAuthName");
    const emailField = qs("#irisxAuthEmail");
    const phoneField = qs("#irisxAuthPhone");
    const passwordField = qs("#irisxAuthPassword");

    const name = nameField ? nameField.value.trim() : "";
    const email = emailField ? emailField.value.trim().toLowerCase() : "";
    const phone = normalizePhoneNumber(phoneField ? phoneField.value.trim() : "");
    const password = passwordField ? passwordField.value : "";

    if ((!isLogin && !name) || !email || !phone || !password) {
      setInlineStatus(status, curLang === "it" ? "Compila tutti i campi richiesti." : "Please fill in all required fields.", true);
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setInlineStatus(status, curLang === "it" ? "Inserisci un numero di telefono valido." : "Please enter a valid phone number.", true);
      return;
    }

    const blockedIdentityMessage = getBlockedIdentityMessage(email, phone);
    if (blockedIdentityMessage) {
      setInlineStatus(status, blockedIdentityMessage, true);
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

      const storedPhone = normalizePhoneNumber(existingUser.phone || "");
      if (storedPhone && storedPhone !== phone) {
        setInlineStatus(status, curLang === "it" ? "Numero di telefono non corretto." : "Incorrect phone number.", true);
        return;
      }

      if (existingUser.accountStatus === "banned") {
        setInlineStatus(status, getBlockedIdentityMessage(existingUser.email, existingUser.phone) || (curLang === "it" ? "Account bloccato." : "Account blocked."), true);
        return;
      }

      const mergedUser = Object.assign({}, existingUser, {
        phone: storedPhone || phone
      });
      state.users = state.users.map(function (user) {
        return user.email === mergedUser.email ? mergedUser : user;
      });
      saveJson(STORAGE_KEYS.users, state.users);

      state.currentUser = normalizeUserWorkspace({
        id: mergedUser.id,
        name: mergedUser.name,
        email: mergedUser.email,
        phone: mergedUser.phone,
        role: mergedUser.role || deriveUserRole(mergedUser.email),
        city: mergedUser.city,
        country: mergedUser.country,
        bio: mergedUser.bio,
        memberSince: mergedUser.memberSince,
        avatar: mergedUser.avatar
      });
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

    const newUser = normalizeUserWorkspace({
      id: "user-" + Date.now(),
      name: name,
      email: email,
      phone: phone,
      role: deriveUserRole(email),
      password: password,
      city: curLang === "it" ? "Italia" : "Italy",
      country: curLang === "it" ? "Italia" : "Italy",
      bio: "",
      memberSince: String(new Date().getFullYear()),
      avatar: "👤",
      verification: {
        emailVerified: false,
        phoneVerified: false
      }
    });

    state.users.push(newUser);
    saveJson(STORAGE_KEYS.users, state.users);
    state.currentUser = normalizeUserWorkspace({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      city: newUser.city,
      country: newUser.country,
      bio: newUser.bio,
      memberSince: newUser.memberSince,
      avatar: newUser.avatar
    });
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
    syncTopnavChrome();
    showToast(t("logout_success"));
  }

  function cleanupNavbar() {
    var el;
    el = qs("#tnAboutBtn"); if (el) el.style.display = "none";
    el = qs("#authBtn"); if (el) el.style.display = "none";
    el = qs("#opsBtn"); if (el) el.style.display = "none";
    el = qs(".mode-toggle"); if (el) el.style.display = "none";
    var prof = qs(".tn-profile");
    if (prof) {
      prof.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 14.5c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>';
      prof.style.fontSize = '0';
    }
    var lg = qs("#langToggle") || qs(".lang-toggle") || qs("select#langToggle");
    if (lg) lg.style.display = "none";
  }

  function syncSessionUi() {
    const authButton = qs("#authBtn");
    if (authButton) {
      authButton.textContent = state.currentUser ? t("logout") : t("login");
      authButton.onclick = handleAuthButtonClick;
    }

    const opsButton = qs("#opsBtn");
    if (opsButton) {
      opsButton.style.display = isCurrentUserAdmin() ? "" : "none";
    }

    const profileButton = qs("#tnProfileTrigger") || qs(".tn-profile") || qs(".tn-btn[data-nav-view=\"profile\"]") || qs(".tn-btn[onclick*=\"profile\"]");
    if (profileButton) {
      profileButton.setAttribute("aria-label", t("profile_nav"));
    }

    cleanupNavbar();
  }

  function requireAuth(callback) {
    if (state.currentUser) {
      callback();
      return;
    }

    state.pendingAction = callback;
    showToast(t("sign_in_to_continue"));
    openAuthModal("register");
  }

  function addToCart(productId) {
    const product = getListingById(productId);

    if (!isProductPurchasable(product)) {
      showToast(langText("Questo articolo non è più disponibile.", "This item is no longer available."));
      return;
    }

    if (isSellerOnVacation(product)) {
      showToast(langText("Il seller è in vacanza e non accetta ordini al momento.", "The seller is on vacation and not accepting orders right now."));
      return;
    }

    const existing = state.cart.find(function (item) {
      return sameEntityId(item.productId, productId);
    });

    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ productId: product.id, qty: 1 });
    }

    persistCart();
    updateCartBadge();
    renderCartDrawer();
    showToast(t("cart_added"));
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(function (item) {
      return !sameEntityId(item.productId, productId);
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
        const product = getListingById(item.productId);
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
              inlineJsValue(product.id) +
              ")\">" +
              t("remove") +
              "</button></div></div>"
            );
          })
          .join("") +
        "</div>"
      : "<div class=\"irisx-empty-state\">" + t("empty_cart") + "</div>";
    const footerHtml = items.length
      ? "<div class=\"irisx-cart-footer-grid\"><div class=\"irisx-cart-row\"><span>" + langText("Subtotale", "Subtotal") + "</span><strong>" +
        formatCurrency(subtotal) +
        "</strong></div><div class=\"irisx-cart-row\"><span>" +
        t("shipping") +
        "</span><strong>" +
        formatCurrency(SHIPPING_COST) +
        "</strong></div><div class=\"irisx-cart-row total\"><span>" +
        t("cart_total") +
        "</span><strong>" +
        formatCurrency(subtotal + SHIPPING_COST) +
        "</strong></div></div><div class=\"irisx-actions irisx-actions--stack\"><button class=\"irisx-primary\" onclick=\"openCheckout('cart')\">" +
        t("checkout") +
        "</button><button class=\"irisx-secondary\" onclick=\"closeCart()\">" +
        t("continue_shopping") +
        "</button></div>"
      : "<div class=\"irisx-actions irisx-actions--stack\"><button class=\"irisx-secondary\" onclick=\"closeCart();showBuyView('shop')\">" +
        t("continue_shopping") +
        "</button></div>";

    drawer.innerHTML =
      "<div class=\"irisx-drawer-backdrop\"></div><div class=\"irisx-drawer-panel\"><div class=\"irisx-drawer-head\"><div><div class=\"irisx-kicker\">" +
      langText("Il tuo carrello · IRIS", "Your cart · IRIS") +
      "</div><div class=\"irisx-title\">" +
      t("cart") +
      "</div><div class=\"irisx-subtitle\">" +
      items.length +
      " " +
      t("cart_items") +
      "</div></div><button class=\"irisx-close\" onclick=\"closeCart()\" aria-label=\"" + escapeHtml(langText("Chiudi", "Close")) + "\">✕</button></div><div class=\"irisx-drawer-body\">" +
      itemsHtml +
      "</div><div class=\"irisx-drawer-foot\">" +
      footerHtml +
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
      const product = getListingById(productId);
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
      showToast(langText("Uno o più articoli non sono più acquistabili.", "One or more items are no longer available."));
      state.checkoutItems = state.checkoutItems.filter(function (entry) { return isProductPurchasable(entry.product); });
      return;
    }

    if (state.checkoutItems.some(function (entry) { return isSellerOnVacation(entry.product); })) {
      showToast(langText("Uno o più seller sono in vacanza e non accettano ordini al momento.", "One or more sellers are on vacation and not accepting orders right now."));
      state.checkoutItems = state.checkoutItems.filter(function (entry) { return !isSellerOnVacation(entry.product); });
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
    validateSellField("fileIn");
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
    validateSellField("fileIn");
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
    const taxonomy = collectSellTaxonomySelection();
    const measurements = collectSellMeasurements();
    const brand = readSellField("#sf-brand");
    const name = readSellField("#sf-name");
    const color = readSellField("#sf-color");
    const material = readSellField("#sf-material");
    const dimensions = readSellField("#sf-dims");
    const description = readSellField("#sf-desc");
    const price = Number(readSellField("#sf-price"));
    const selectedCondition = qs(".cond-btn.sel");
    const condition = selectedCondition ? selectedCondition.textContent.trim() : "";
    const offerPolicy = getListingOfferPolicyFromForm();
    const offerValidation = validateListingOfferPolicy(offerPolicy, price);

    if (!brand || !name || !condition || !description || !price || !state.sellPhotos.length) {
      updateSellStatus(t("publish_error"), true);
      return;
    }
    if (!taxonomy.ok) {
      updateSellStatus(taxonomy.error, true);
      return;
    }
    if (!offerValidation.ok) {
      updateSellStatus(offerValidation.error, true);
      return;
    }

    const seller = getCurrentUserSeller();
    if (!seller) {
      updateSellStatus(t("sell_status_auth"), true);
      return;
    }

    syncCurrentUserSeller();

    const existingListing = state.editingListingId
      ? state.listings.find(function (listing) { return String(listing.id) === String(state.editingListingId); }) ||
        prods.find(function (listing) { return String(listing.id) === String(state.editingListingId); })
      : null;

    const listing = syncListingIntoCatalog({
      id: existingListing ? existingListing.id : Date.now(),
      ownerEmail: state.currentUser.email,
      name: name,
      brand: brand,
      cat: taxonomy.categoryLabel,
      categoryKey: taxonomy.categoryKey,
      subcategory: taxonomy.subcategoryLabel,
      subcategoryKey: taxonomy.subcategoryKey,
      productType: taxonomy.typeLabel,
      productTypeKey: taxonomy.typeKey,
      sz: taxonomy.sizeDisplay,
      sizeOriginal: taxonomy.sizeOriginal,
      sizeSchema: taxonomy.sizeMode,
      cond: condition,
      fit: taxonomy.fit,
      dims: dimensions || "N/A",
      measurements: measurements,
      price: price,
      orig: Math.round(price * 1.35),
      color: color || (curLang === "it" ? "Non indicato" : "Not specified"),
      material: material || (curLang === "it" ? "Non indicato" : "Not specified"),
      emoji: existingListing && existingListing.emoji ? existingListing.emoji : taxonomy.emoji,
      desc: description,
      chips: [condition, material || "Material", taxonomy.categoryLabel, taxonomy.subcategoryLabel, taxonomy.typeLabel].filter(Boolean),
      seller: seller,
      date: Date.now(),
      images: state.sellPhotos.map(function (photo) { return photo.src; }),
      isUserListing: true,
      inventoryStatus: existingListing && existingListing.inventoryStatus === "sold" ? "sold" : "active",
      listingStatus: "published",
      orderId: existingListing ? existingListing.orderId || null : null,
      soldAt: existingListing ? existingListing.soldAt || null : null,
      offersEnabled: offerPolicy.offersEnabled,
      minimumOfferAmount: offerValidation.minimumOfferAmount
    });

    if (!existingListing) {
      notifyNewListing(listing);
    }
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
    const conditionField = qs("#sf-condition", form);
    if (conditionField) {
      conditionField.value = "";
      clearSellFieldError(conditionField);
    }
    qsa("#sellForm .field-error", form).forEach(function (node) {
      node.textContent = "";
    });
    qsa("#sellForm [aria-invalid='true']", form).forEach(function (field) {
      field.removeAttribute("aria-invalid");
    });
    qsa("#sellForm .has-error", form).forEach(function (node) {
      node.classList.remove("has-error");
    });
    state.sellPhotos = [];
    state.editingListingId = null;
    ensureSellTaxonomyUi({
      categoryKey: "",
      subcategoryKey: "",
      typeKey: "",
      size: "",
      measurements: {}
    });
    renderSellPhotoPreview();
    updateFee();
    applyListingOfferPolicyToForm({
      offersEnabled: true,
      minimumOfferAmount: null
    });
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
          actions.push("<button class=\"irisx-secondary\" onclick=\"openSupportModal('" + order.id + "', { issueSeverity: 'dispute', role: 'buyer', issueType: 'item_not_as_described' })\">" + langText("Segnala problema", "Report problem") + "</button>");
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
          actions.push("<button class=\"irisx-secondary\" onclick=\"openSupportModal('" + order.id + "', { role: 'seller', issueType: 'order_problem' })\">" + langText("Supporto ordine", "Order support") + "</button>");
          actions.push("<button class=\"irisx-secondary\" onclick=\"openSupportModal('" + order.id + "', { role: 'seller', issueSeverity: 'dispute', issueType: 'shipping_delay' })\">" + langText("Segnala problema", "Report problem") + "</button>");

          return "<div class=\"irisx-order-card\"><div class=\"irisx-order-head\"><strong>" +
            escapeHtml(order.number) +
            "</strong><span>" +
            escapeHtml(getOrderStatusLabel(order)) +
            "</span></div><div class=\"irisx-order-items\"><div>" +
            escapeHtml(langText("Acquirente", "Buyer")) +
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
          return `<div class="irisx-order-card irisx-order-card--support">
            <div class="irisx-order-head">
              <strong>${escapeHtml(ticket.orderNumber || ticket.orderId)}</strong>
              <span class="irisx-badge ${ticket.severity === "dispute" ? "irisx-badge--warning" : ""}">${escapeHtml(getTicketStatusLabel(ticket.status))}</span>
            </div>
            <div class="irisx-support-ticket-meta">
              <span>${escapeHtml(getIssueLabel(ticket.reason))}</span>
              <span>${escapeHtml(ticket.productTitle || langText("Ordine completo", "Full order"))}</span>
              <span>${escapeHtml(langText(ticket.requesterRole === "seller" ? "Lato venditore" : "Lato acquirente", ticket.requesterRole === "seller" ? "Seller side" : "Buyer side"))}</span>
            </div>
            <div class="irisx-order-items"><div>${escapeHtml(ticket.message)}</div><div>${escapeHtml(formatDateTime(ticket.createdAt))}</div></div>
          </div>`;
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

  const CHECKOUT_STEPS = ["address", "shipping", "payment", "review", "confirmation"];
  const POLICY_PAGE_CONTENT = {
    "shipping-policy": {
      title: langText("Policy spedizioni", "Shipping Policy"),
      subtitle: langText("Linee guida operative per spedizioni buyer e seller.", "Operational guidelines for buyer and seller shipments."),
      sections: [
        {
          title: langText("Flusso spedizione seller", "Seller shipping flow"),
          body: langText(
            "Il seller prepara il pacco, genera l'etichetta placeholder e consegna al corriere. Lo stato passa da paid a awaiting shipment e poi a shipped.",
            "The seller prepares the parcel, generates the placeholder label, and hands it to the carrier. Status moves from paid to awaiting shipment and then shipped."
          )
        },
        {
          title: langText("Flusso consegna buyer", "Buyer delivery flow"),
          body: langText(
            "Dopo l'autenticazione il pacco viene dispatchato al buyer con tracking, carrier, fee di spedizione e timeline visibile nell'ordine.",
            "After authentication the parcel is dispatched to the buyer with tracking, carrier, shipping fee, and a visible order timeline."
          )
        },
        {
          title: langText("Copertura", "Coverage"),
          body: langText(
            "Questa è una skeleton policy: metodi, tempi e corrieri sono predisposti come struttura mock e potranno essere finalizzati nel go-live backend.",
            "This is a skeleton policy: methods, timings, and carriers are prepared as mock structure and can be finalized at backend go-live."
          )
        }
      ]
    },
    "refund-policy": {
      title: langText("Policy resi e rimborsi", "Refund / Return Policy"),
      subtitle: langText("Regole placeholder per annulli, problemi post-acquisto e refund.", "Placeholder rules for cancellations, post-purchase issues, and refunds."),
      sections: [
        {
          title: langText("Stati rimborso", "Refund states"),
          body: langText(
            "Gli ordini possono passare a refund requested e refunded. Il payout seller va on hold o reversed a seconda dello stato finale.",
            "Orders can move to refund requested and refunded. Seller payout moves to on hold or reversed depending on the final state."
          )
        },
        {
          title: langText("Richiesta reso", "Return request"),
          body: langText(
            "Il buyer può aprire supporto o richiesta rimborso dal dettaglio ordine. L'admin vede la richiesta nell'area disputes / support.",
            "The buyer can open support or refund request from order detail. Admin sees the request inside the disputes / support area."
          )
        },
        {
          title: langText("Ambito", "Scope"),
          body: langText(
            "Questa pagina definisce il flusso strutturale del prototipo; condizioni economiche, costi e tempi reali saranno confermati in produzione.",
            "This page defines the prototype structural flow; real economics, costs, and timings will be confirmed in production."
          )
        }
      ]
    },
    "buyer-protection": {
      title: langText("Protezione acquirente", "Buyer Protection"),
      subtitle: langText("Cosa vede e cosa riceve il buyer nel flusso prototipo.", "What the buyer sees and receives in the prototype flow."),
      sections: [
        {
          title: langText("Flusso protetto", "Protected flow"),
          body: langText(
            "Ogni ordine espone timeline, tracking, supporto, review flow e storico notifiche. I passaggi pending, paid, shipped, delivered e completed sono coerenti in UI.",
            "Each order exposes timeline, tracking, support, review flow, and notification history. Pending, paid, shipped, delivered, and completed remain coherent across the UI."
          )
        },
        {
          title: langText("Accesso al supporto", "Support access"),
          body: langText(
            "Il buyer può aprire ticket, segnalare problemi e richiedere refund direttamente dall'area ordini.",
            "The buyer can open tickets, report issues, and request refunds directly from the orders area."
          )
        }
      ]
    },
    "seller-protection": {
      title: langText("Protezione venditore", "Seller Protection"),
      subtitle: langText("Regole placeholder per payout, spedizione e gestione offerte.", "Placeholder rules for payout, shipping, and offer management."),
      sections: [
        {
          title: langText("Panoramica payout", "Payout overview"),
          body: langText(
            "Ogni ordine seller mostra gross, fee piattaforma, seller net e payout status: pending shipment, pending delivery, ready, paid, reversed.",
            "Each seller order shows gross, platform fee, seller net, and payout status: pending shipment, pending delivery, ready, paid, reversed."
          )
        },
        {
          title: langText("Coda operativa", "Operational queue"),
          body: langText(
            "La seller area include active listings, draft listings, offers received, shipping queue e sales history con CTA operative reali del prototipo.",
            "The seller area includes active listings, draft listings, offers received, shipping queue, and sales history with real prototype CTAs."
          )
        }
      ]
    },
    "prohibited-items": {
      title: langText("Articoli vietati", "Prohibited Items"),
      subtitle: langText("Categorie placeholder da bloccare o revisionare manualmente.", "Placeholder categories to block or manually review."),
      sections: [
        {
          title: langText("Categorie bloccate", "Blocked categories"),
          body: langText(
            "Articoli contraffatti, materiale illegale, beni non spedibili, beni pericolosi e categorie senza prova di ownership devono essere bloccati o moderati.",
            "Counterfeits, illegal material, non-shippable goods, hazardous goods, and categories without proof of ownership must be blocked or moderated."
          )
        },
        {
          title: langText("Percorso moderazione", "Moderation path"),
          body: langText(
            "Il pannello admin include una sezione listings e categories / brands per predisporre moderazione, taxonomy e futuri blocchi automatici.",
            "The admin panel includes listings and categories / brands sections to prepare moderation, taxonomy, and future automatic blocks."
          )
        }
      ]
    },
    "trust-authentication": {
      title: langText("Trust / autenticazione", "Trust / Authentication"),
      subtitle: langText("Come il prototipo espone autenticazione, protezione e segnali di fiducia.", "How the prototype exposes authentication, protection, and trust signals."),
      sections: [
        {
          title: langText("Blocchi trust", "Trust blocks"),
          body: langText(
            "La product page mostra seller card, breadcrumb, shipping info, trust block, azioni report e buyer protection links.",
            "The product page shows seller card, breadcrumb, shipping info, trust block, report actions, and buyer protection links."
          )
        },
        {
          title: langText("Coda autenticazione", "Authentication queue"),
          body: langText(
            "Gli ordini possono essere marcati in authentication e dispatched to buyer dal pannello admin con timeline coerente.",
            "Orders can be marked in authentication and dispatched to buyer from the admin panel with a coherent timeline."
          )
        }
      ]
    },
    "community-guidelines": {
      title: langText("Linee guida community", "Community Guidelines"),
      subtitle: langText("Comportamenti attesi per buyer, seller e owner.", "Expected behavior for buyers, sellers, and owners."),
      sections: [
        {
          title: langText("Condotta marketplace", "Marketplace conduct"),
          body: langText(
            "Le comunicazioni devono restare rispettose, le offerte devono essere serie, i contenuti devono essere accurati e le dispute devono passare dai canali supporto predisposti.",
            "Communications must remain respectful, offers should be serious, content must be accurate, and disputes should go through the prepared support channels."
          )
        },
        {
          title: langText("Escalation", "Escalation"),
          body: langText(
            "Segnalazioni, review abusive o annunci incoerenti confluiscono nell'area admin per moderazione e audit log.",
            "Reports, abusive reviews, or inconsistent listings flow into the admin area for moderation and audit log."
          )
        }
      ]
    },
    "accessibility-statement": {
      title: langText("Accessibilità", "Accessibility Statement"),
      subtitle: langText("Impegni placeholder su accessibilita', leggibilita' e supporto assistivo.", "Placeholder commitments on accessibility, readability, and assistive support."),
      sections: [
        {
          title: langText("Accessible baseline", "Accessible baseline"),
          body: langText(
            "Il prototipo adotta struttura responsive, stati vuoti espliciti, gerarchia coerente e CTA leggibili. Le future integrazioni app e backend dovranno mantenere standard equivalenti.",
            "The prototype adopts a responsive structure, explicit empty states, coherent hierarchy, and readable CTAs. Future app and backend integrations should maintain equivalent standards."
          )
        },
        {
          title: langText("Support path", "Support path"),
          body: langText(
            "Chi riscontra difficoltà può usare Contact Support dall'area account; richieste e feedback confluiscono nel flusso assistenza del prototipo.",
            "Anyone encountering difficulties can use Contact Support from the account area; requests and feedback flow into the prototype support queue."
          )
        }
      ]
    }
  };

  function ensureStructuredSkeletonState() {
    if (!state.profileArea) state.profileArea = "account";
    if (!state.profileSection) state.profileSection = "overview";
    if (!state.buyerSection) state.buyerSection = "orders";
    if (!state.sellerSection) state.sellerSection = "dashboard";
    if (!state.sellerProfile) state.sellerProfile = { sellerId: null, tab: "listings" };
    if (!state.adminSection) state.adminSection = "overview";
    if (!state.checkoutStep) state.checkoutStep = "address";
    if (!state.checkoutDraft) state.checkoutDraft = {};
    if (!state.checkoutStatus) state.checkoutStatus = null;
    if (!state.offerDraft) state.offerDraft = null;
    if (!state.offerStatus) state.offerStatus = null;
    if (!state.offerError) state.offerError = "";
    if (!state.offerStep) state.offerStep = "amount";
    if (!state.editingListingId) state.editingListingId = null;
    if (!state.activeDetailListingId) state.activeDetailListingId = null;
    if (!state.chatScope) state.chatScope = "buying";
    state.banRegistry = normalizeBanRegistry(state.banRegistry);
    if (state.currentUser) {
      state.currentUser = normalizeUserWorkspace(state.currentUser);
      if (state.currentUser.accountStatus === "banned" || getBlockedIdentityMessage(state.currentUser.email, state.currentUser.phone)) {
        state.currentUser = null;
      }
      saveJson(STORAGE_KEYS.session, state.currentUser);
    }
    chats.forEach(function (thread, index) {
      const normalizedThread = normalizeChatThread(thread);
      if (!normalizedThread.product && normalizedThread.msgs.length) {
        normalizedThread.product = prods[0] || null;
      }
      if (!normalizedThread.unreadCount && normalizedThread.msgs.length && normalizedThread.msgs[normalizedThread.msgs.length - 1].from === "them") {
        normalizedThread.unreadCount = 1;
      }
      chats[index] = normalizedThread;
    });
    state.listings = state.listings.map(normalizeListingRecord);
    state.offers = state.offers.map(normalizeOfferRecord);
    persistBanRegistry();
    saveJson(STORAGE_KEYS.listings, state.listings);
    saveJson(STORAGE_KEYS.offers, state.offers);
    persistChats();
  }

  function syncCurrentUserWorkspace(patch) {
    if (!state.currentUser) {
      return null;
    }
    const previous = state.users.find(function (user) {
      return normalizeEmail(user.email) === normalizeEmail(state.currentUser.email);
    });
    const nextUser = normalizeUserWorkspace(Object.assign({}, state.currentUser, patch || {}));
    state.currentUser = nextUser;
    saveJson(STORAGE_KEYS.session, state.currentUser);
    let found = false;
    state.users = state.users.map(function (user) {
      if (normalizeEmail(user.email) !== normalizeEmail(state.currentUser.email)) {
        return user;
      }
      found = true;
      return Object.assign({}, user, nextUser, {
        password: user.password || ""
      });
    });
    if (!found) {
      state.users.push(Object.assign({}, previous || {}, nextUser, { password: (previous && previous.password) || "" }));
    }
    saveJson(STORAGE_KEYS.users, state.users);

    const seller = getCurrentUserSeller();
    state.listings = state.listings.map(function (listing) {
      if (normalizeEmail(listing.ownerEmail) !== normalizeEmail(state.currentUser.email)) {
        return listing;
      }
      return Object.assign({}, listing, { seller: seller });
    });
    saveJson(STORAGE_KEYS.listings, state.listings);
    for (let index = 0; index < prods.length; index += 1) {
      if (normalizeEmail(prods[index].ownerEmail) !== normalizeEmail(state.currentUser.email)) {
        continue;
      }
      prods[index] = Object.assign({}, prods[index], { seller: seller });
    }
    syncCurrentUserSeller();
    syncSessionUi();
    return state.currentUser;
  }

  function ensureChatUiEnhancements() {
    const chatMain = qs("#chatMain");
    if (chatMain && !qs("#irisxChatProduct")) {
      const header = qs(".cm-head", chatMain);
      if (header) {
        header.insertAdjacentHTML("afterend", "<div class=\"irisx-chat-product\" id=\"irisxChatProduct\"></div>");
      }
    }
    const chatListHead = qs(".cl-head");
    if (chatListHead && !qs("#irisxChatScopeTabs")) {
      chatListHead.insertAdjacentHTML("beforeend", "<div class=\"irisx-chat-scope-tabs\" id=\"irisxChatScopeTabs\"></div>");
    }
    const chatProduct = qs("#irisxChatProduct");
    if (chatProduct && !qs("#irisxChatRoleMeta")) {
      chatProduct.insertAdjacentHTML("beforebegin", "<div class=\"irisx-chat-role-meta\" id=\"irisxChatRoleMeta\"></div>");
    }
    const inputWrap = qs(".cm-input");
    if (inputWrap && !qs("#chatAttachBtn")) {
      inputWrap.insertAdjacentHTML("afterbegin", "<button class=\"irisx-chat-attach\" id=\"chatAttachBtn\" onclick=\"openChatAttachmentPlaceholder()\">+</button>");
    }
  }

  function openChatAttachmentPlaceholder() {
    showToast(langText("Allegati predisposti come placeholder del prototipo.", "Attachments are prepared as a prototype placeholder."));
  }

  function getChatUnreadCount() {
    return chats.reduce(function (sum, thread) {
      return sum + Number(thread.unreadCount || 0);
    }, 0);
  }

  function getChatConversationScope(thread) {
    if (!state.currentUser) {
      return "buying";
    }
    const currentEmail = normalizeEmail(state.currentUser.email);
    const sellerEmail = normalizeEmail((thread && thread.sellerEmail) || (thread && thread.product && (thread.product.ownerEmail || (thread.product.seller && thread.product.seller.email))) || "");
    const buyerEmail = normalizeEmail((thread && thread.buyerEmail) || "");
    if (sellerEmail && sellerEmail === currentEmail) {
      return "selling";
    }
    if (buyerEmail && buyerEmail === currentEmail) {
      return "buying";
    }
    return sellerEmail && sellerEmail !== currentEmail ? "buying" : "selling";
  }

  function getChatThreadsForScope(scope) {
    return chats
      .map(normalizeChatThread)
      .filter(function (thread) {
        return getChatConversationScope(thread) === scope;
      })
      .sort(function (left, right) {
        return Number(right.updatedAt || 0) - Number(left.updatedAt || 0);
      });
  }

  function getChatScopeUnreadCount(scope) {
    return getChatThreadsForScope(scope).reduce(function (sum, thread) {
      return sum + Number(thread.unreadCount || 0);
    }, 0);
  }

  function getChatScopeConversationCount(scope) {
    return getChatThreadsForScope(scope).length;
  }

  function getChatScopeCopy(scope) {
    if (scope === "selling") {
      return {
        title: langText("Chat prodotti che vendo", "Products I'm selling"),
        subtitle: langText("Qui vedi solo le conversazioni in cui tu sei il venditore del prodotto.", "This area only shows conversations where you are the seller of the listing."),
        empty: langText("Nessun buyer ti ha ancora scritto sui prodotti che stai vendendo.", "No buyer has contacted you yet about the products you are selling.")
      };
    }
    return {
      title: langText("Chat prodotti che compro", "Products I'm buying"),
      subtitle: langText("Qui vedi solo le conversazioni in cui tu sei il compratore o il buyer interessato.", "This area only shows conversations where you are the buyer or interested buyer."),
      empty: langText("Nessuna conversazione aperta sui prodotti che vuoi comprare.", "No conversations yet for products you want to buy.")
    };
  }

  function getChatRoleContext(thread) {
    const scope = getChatConversationScope(thread);
    if (scope === "selling") {
      return langText("Conversazione con un buyer interessato", "Conversation with an interested buyer");
    }
    return langText("Conversazione con il seller", "Conversation with the seller");
  }

  function getChatRoleBadgeLabel(thread) {
    return getChatConversationScope(thread) === "selling" ? langText("Vendo", "Selling") : langText("Compro", "Buying");
  }

  function getChatScopeTabLabel(scope) {
    return scope === "selling" ? langText("Vendo", "Selling") : langText("Compro", "Buying");
  }

  function setChatScope(scope, conversationId) {
    state.chatScope = scope === "selling" ? "selling" : "buying";
    if (conversationId) {
      curChat = conversationId;
    } else if (!getChatThreadsForScope(state.chatScope).some(function (thread) { return thread.id === curChat; })) {
      curChat = null;
    }
    renderChats();
  }

  function openMessagingInbox(scope, conversationId) {
    ensureStructuredSkeletonState();
    state.chatScope = scope === "selling" ? "selling" : "buying";
    if (conversationId) {
      curChat = conversationId;
    }
    showBuyView("chat");
  }

  function renderMessagingWorkspaceCard(scope) {
    const threads = getChatThreadsForScope(scope);
    const scopeCopy = getChatScopeCopy(scope);
    const unreadCount = getChatScopeUnreadCount(scope);
    return `<div class="irisx-workspace-card">
      <div class="irisx-section-head">
        <div><h3>${escapeHtml(scopeCopy.title)}</h3><span>${escapeHtml(scopeCopy.subtitle)}</span></div>
        ${unreadCount ? `<span class="irisx-badge">${unreadCount} ${langText("non letti", "unread")}</span>` : `<span>${langText("Inbox pulita", "Inbox clear")}</span>`}
      </div>
      ${threads.length ? `<div class="irisx-card-stack">${threads.slice(0, 5).map(function (thread) {
        const lastMessage = thread.msgs[thread.msgs.length - 1] || { text: "", time: "" };
        return `<button class="irisx-inline-card irisx-inline-card--button" onclick="openMessagingInbox('${scope}','${thread.id}')">
          <div>
            <strong>${escapeHtml(thread.with.name || (scope === "selling" ? thread.buyerName : thread.sellerName) || langText("Conversation", "Conversation"))}</strong>
            <span>${escapeHtml(thread.product ? `${thread.product.brand} ${thread.product.name}` : langText("Linked listing", "Linked listing"))}</span>
            <em>${escapeHtml(getChatRoleContext(thread))}</em>
          </div>
          <div>
            <span>${escapeHtml(lastMessage.text || langText("Nessun messaggio", "No messages"))}</span>
            ${thread.unreadCount ? `<em class="irisx-chat-unread">${thread.unreadCount}</em>` : `<em>${escapeHtml(lastMessage.time || "")}</em>`}
          </div>
        </button>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${escapeHtml(scopeCopy.empty)}</div>`}
      <div class="irisx-actions"><button class="irisx-primary" onclick="openMessagingInbox('${scope}')">${langText("Apri inbox completa", "Open full inbox")}</button></div>
    </div>`;
  }

  function formatWorkspaceCountLabel(count, singularIt, pluralIt, singularEn, pluralEn) {
    const safeCount = Number(count) || 0;
    if (curLang === "it") {
      return `${safeCount} ${safeCount === 1 ? singularIt : pluralIt}`;
    }
    return `${safeCount} ${safeCount === 1 ? singularEn : pluralEn}`;
  }

  function getWorkspaceChatSummary(scope, threads) {
    const unread = getChatScopeUnreadCount(scope);
    if (!threads.length) {
      return langText("Nessuna conversazione attiva.", "No active conversations.");
    }
    const conversationsLabel = formatWorkspaceCountLabel(threads.length, "conversazione", "conversazioni", "conversation", "conversations");
    return unread
      ? `${conversationsLabel} · ${unread} ${langText("non lette", "unread")}`
      : `${conversationsLabel} · ${langText("Inbox pulita", "Inbox clear")}`;
  }

  function getWorkspaceSupportSummary(ticketCount, unreadNotifications) {
    const safeTickets = Number(ticketCount) || 0;
    const safeNotifications = Number(unreadNotifications) || 0;
    if (!safeTickets && !safeNotifications) {
      return langText("Nessun ticket aperto · Inbox pulita", "No open tickets · Inbox clear");
    }
    if (!safeTickets) {
      return `${safeNotifications} ${langText("notifiche non lette", "unread notifications")}`;
    }
    if (!safeNotifications) {
      return `${formatWorkspaceCountLabel(safeTickets, "ticket aperto", "ticket aperti", "open ticket", "open tickets")} · ${langText("nessuna notifica urgente", "no urgent notifications")}`;
    }
    return `${formatWorkspaceCountLabel(safeTickets, "ticket aperto", "ticket aperti", "open ticket", "open tickets")} · ${safeNotifications} ${langText("notifiche non lette", "unread notifications")}`;
  }

  function syncChatBadge() {
    const badge = qs("#chat-badge");
    if (!badge) {
      return;
    }
    const count = getChatUnreadCount();
    badge.style.display = count ? "flex" : "none";
    badge.textContent = count;
  }

  function getBuyerOffers() {
    syncOfferStates();
    if (!state.currentUser) {
      return [];
    }
    return state.offers
      .filter(function (offer) {
        return normalizeEmail(offer.buyerEmail) === normalizeEmail(state.currentUser.email);
      })
      .sort(function (left, right) { return right.createdAt - left.createdAt; });
  }

  function getSellerOffers() {
    syncOfferStates();
    if (!state.currentUser) {
      return [];
    }
    return state.offers
      .filter(function (offer) {
        return normalizeEmail(offer.sellerEmail) === normalizeEmail(state.currentUser.email);
      })
      .sort(function (left, right) { return right.createdAt - left.createdAt; });
  }

  const OFFER_EXPIRY_MS = 24 * 60 * 60 * 1000;

  function getListingById(listingId) {
    return prods.find(function (candidate) { return String(candidate.id) === String(listingId); }) ||
      state.listings.find(function (candidate) { return String(candidate.id) === String(listingId); }) ||
      null;
  }

  function isOfferExpired(offer) {
    return Number(offer && offer.expiresAt) > 0 && Number(offer.expiresAt) < Date.now() && offer.status === "pending";
  }

  function syncOfferStates() {
    let mutated = false;
    state.offers = state.offers.map(function (offer) {
      const normalized = normalizeOfferRecord(offer);
      if (!isOfferExpired(normalized)) {
        return normalized;
      }
      mutated = true;
      return Object.assign({}, normalized, {
        status: "expired",
        paymentAuthorizationStatus: "authorization_released",
        updatedAt: Date.now()
      });
    });
    if (mutated) {
      persistOffers();
    }
  }

  function getOfferStatusLabel(offer) {
    const meta = {
      pending: langText("In attesa seller", "Waiting for seller"),
      accepted: langText("Accettata", "Accepted"),
      declined: langText("Rifiutata", "Declined"),
      expired: langText("Scaduta", "Expired"),
      paid: langText("Pagata", "Paid"),
      authorization_failed: langText("Autorizzazione fallita", "Authorization failed")
    };
    return meta[offer.status] || offer.status;
  }

  function getOfferAuthorizationLabel(offer) {
    const meta = {
      payment_authorized: langText("Autorizzazione attiva", "Authorization active"),
      payment_capture_pending: langText("Capture in corso", "Capture pending"),
      paid: langText("Pagamento catturato", "Payment captured"),
      authorization_failed: langText("Autorizzazione fallita", "Authorization failed"),
      authorization_released: langText("Autorizzazione rilasciata", "Authorization released")
    };
    return meta[offer.paymentAuthorizationStatus] || offer.paymentAuthorizationStatus || langText("Non disponibile", "Not available");
  }

  function getListingOfferPolicyFromForm() {
    const offersEnabled = qs("#sf-offers-enabled") ? qs("#sf-offers-enabled").checked : true;
    const minimumRaw = qs("#sf-min-offer") ? qs("#sf-min-offer").value.trim() : "";
    const minimumOfferAmount = offersEnabled && minimumRaw !== "" ? Number(minimumRaw) : null;
    return {
      offersEnabled: offersEnabled,
      minimumOfferAmount: offersEnabled && Number.isFinite(minimumOfferAmount) ? minimumOfferAmount : null
    };
  }

  function validateListingOfferPolicy(policy, listingPrice) {
    if (!policy.offersEnabled) {
      return { ok: true, minimumOfferAmount: null };
    }
    if (policy.minimumOfferAmount === null) {
      return { ok: true, minimumOfferAmount: null };
    }
    if (!Number.isFinite(policy.minimumOfferAmount) || policy.minimumOfferAmount <= 0) {
      return {
        ok: false,
        error: langText("Inserisci un'offerta minima valida.", "Enter a valid minimum offer.")
      };
    }
    if (Number(listingPrice || 0) && policy.minimumOfferAmount > Number(listingPrice || 0)) {
      return {
        ok: false,
        error: langText("L'offerta minima non può superare il prezzo di vendita.", "Minimum offer cannot exceed listing price.")
      };
    }
    return { ok: true, minimumOfferAmount: policy.minimumOfferAmount };
  }

  function applyListingOfferPolicyToForm(listing) {
    const offersEnabled = typeof listing.offersEnabled === "boolean" ? listing.offersEnabled : true;
    if (qs("#sf-offers-enabled")) {
      qs("#sf-offers-enabled").checked = offersEnabled;
    }
    if (qs("#sf-min-offer")) {
      qs("#sf-min-offer").value = offersEnabled && listing.minimumOfferAmount !== null && listing.minimumOfferAmount !== undefined
        ? String(listing.minimumOfferAmount)
        : "";
    }
    toggleOfferSettings();
  }

  function toggleOfferSettings() {
    const enabled = qs("#sf-offers-enabled") ? qs("#sf-offers-enabled").checked : true;
    const minimumWrap = qs("#irisxMinimumOfferWrap");
    if (minimumWrap) {
      minimumWrap.style.display = enabled ? "" : "none";
    }
    if (!enabled && qs("#sf-min-offer")) {
      qs("#sf-min-offer").value = "";
    }
  }

  function ensureOfferSellerControls() {
    const priceField = qs("#sf-price");
    if (!priceField) {
      return;
    }
    const fieldGroup = priceField.closest(".fg");
    if (fieldGroup && !qs("#irisxOfferSettings")) {
      fieldGroup.insertAdjacentHTML("afterend", `
        <div class="fg irisx-offer-settings" id="irisxOfferSettings">
          <label class="fl" id="irisxOfferSettingsLabel">${langText("Offerte", "Offers")}</label>
          <label class="irisx-offer-toggle">
            <input type="checkbox" id="sf-offers-enabled" checked onchange="toggleOfferSettings()">
            <span id="irisxOfferToggleLabel">${langText("Accetta offerte su questo annuncio", "Accept offers on this listing")}</span>
          </label>
          <div id="irisxMinimumOfferWrap">
            <label class="fl" id="irisxMinimumOfferLabel" for="sf-min-offer">${langText("Offerta minima", "Minimum offer")}</label>
            <input class="fi" type="number" id="sf-min-offer" placeholder="${langText("es. 300", "e.g. 300")}">
            <div class="irisx-note" id="irisxMinimumOfferNote">${langText("Se lasci vuoto, qualsiasi offerta valida sopra 0 può essere autorizzata.", "If left blank, any valid offer above 0 can be authorized.")}</div>
          </div>
        </div>
      `);
    }
    if (qs("#irisxOfferSettingsLabel")) {
      qs("#irisxOfferSettingsLabel").textContent = langText("Offerte", "Offers");
    }
    if (qs("#irisxOfferToggleLabel")) {
      qs("#irisxOfferToggleLabel").textContent = langText("Accetta offerte su questo annuncio", "Accept offers on this listing");
    }
    if (qs("#irisxMinimumOfferLabel")) {
      qs("#irisxMinimumOfferLabel").textContent = langText("Offerta minima", "Minimum offer");
    }
    if (qs("#sf-min-offer")) {
      qs("#sf-min-offer").placeholder = langText("es. 300", "e.g. 300");
    }
    if (qs("#irisxMinimumOfferNote")) {
      qs("#irisxMinimumOfferNote").textContent = langText("Se lasci vuoto, qualsiasi offerta valida sopra 0 può essere autorizzata.", "If left blank, any valid offer above 0 can be authorized.");
    }
    toggleOfferSettings();
  }

  function getBuyerOfferDefaults() {
    const buyer = normalizeUserWorkspace(state.currentUser || {});
    const defaultAddress = (buyer.addresses || []).find(function (address) { return address.isDefault; }) || (buyer.addresses || [])[0] || null;
    const defaultPaymentMethod = (buyer.paymentMethods || []).find(function (method) { return method.isDefault; }) || (buyer.paymentMethods || [])[0] || null;
    return {
      shippingSnapshot: defaultAddress
        ? {
            name: defaultAddress.name || buyer.name || "",
            address: defaultAddress.address || buyer.address || "",
            city: defaultAddress.city || buyer.city || "",
            country: defaultAddress.country || buyer.country || getWorkspaceDefaultCountry(),
            phone: defaultAddress.phone || buyer.phone || ""
          }
        : {
            name: buyer.name || "",
            address: buyer.address || "",
            city: buyer.city || "",
            country: buyer.country || getWorkspaceDefaultCountry(),
            phone: buyer.phone || ""
          },
      paymentMethodSnapshot: defaultPaymentMethod
        ? {
            id: defaultPaymentMethod.id,
            label: `${defaultPaymentMethod.brand} •••• ${defaultPaymentMethod.last4}`
          }
        : {
            id: "prototype-offer-auth",
            label: langText("Prototype payment authorization", "Prototype payment authorization")
          }
    };
  }

  function validateOfferSubmission(payload) {
    syncOfferStates();
    const listing = getListingById(payload.listingId);
    if (!listing || !isProductPurchasable(listing)) {
      return { ok: false, error: langText("Questo articolo non è disponibile per offerte.", "This listing is not available for offers.") };
    }
    if (!listing.offersEnabled) {
      return { ok: false, error: langText("Le offerte non sono abilitate per questo articolo.", "Offers are disabled for this listing.") };
    }
    const amount = payload.offerAmountLocal !== undefined && payload.offerAmountLocal !== null && payload.offerAmountLocal !== ""
      ? convertLocalAmountToBase(Number(payload.offerAmountLocal))
      : Number(payload.offerAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: langText("Inserisci un importo valido.", "Enter a valid amount.") };
    }
    if (listing.minimumOfferAmount !== null && amount < Number(listing.minimumOfferAmount)) {
      return {
        ok: false,
        error: `${langText("Offerta minima", "Minimum offer")}: ${formatCurrency(listing.minimumOfferAmount)}`
      };
    }
    if (!state.currentUser || normalizeEmail(payload.buyerEmail) !== normalizeEmail(state.currentUser.email)) {
      return { ok: false, error: langText("Sessione buyer non valida.", "Invalid buyer session.") };
    }
    if (normalizeEmail(payload.buyerEmail) === normalizeEmail(listing.ownerEmail || (listing.seller && listing.seller.email) || "")) {
      return { ok: false, error: langText("Non puoi fare un'offerta sul tuo stesso annuncio.", "You cannot make an offer on your own listing.") };
    }
    const existingActiveOffer = state.offers.find(function (offer) {
      return String(offer.listingId || offer.productId) === String(listing.id) &&
        normalizeEmail(offer.buyerEmail) === normalizeEmail(payload.buyerEmail) &&
        offer.status === "pending";
    });
    if (existingActiveOffer) {
      return { ok: false, error: langText("Hai gia' un'offerta attiva su questo articolo.", "You already have an active offer on this listing.") };
    }
    return { ok: true, listing: listing, amount: amount };
  }

  function createOfferAuthorization(payload) {
    if (!payload.paymentMethodSnapshot || !payload.paymentMethodSnapshot.label) {
      return {
        ok: false,
        error: langText("Nessun metodo di pagamento disponibile per autorizzare l'offerta.", "No payment method available to authorize this offer.")
      };
    }
    return {
      ok: true,
      authorizationReference: "AUTH-" + String(Date.now()).slice(-8),
      paymentIntentReference: "PI-OFFER-" + String(Date.now()).slice(-8),
      paymentAuthorizationStatus: "payment_authorized"
    };
  }

  function captureAuthorizedOfferPayment(offer) {
    if (offer.paymentAuthorizationStatus !== "payment_authorized" && offer.paymentAuthorizationStatus !== "payment_capture_pending") {
      return {
        ok: false,
        error: langText("Nessuna autorizzazione valida da catturare.", "No valid authorization to capture.")
      };
    }
    return {
      ok: true,
      paymentAuthorizationStatus: "paid",
      capturedAt: Date.now()
    };
  }

  function releaseOfferAuthorization(offer, reason) {
    return {
      ok: true,
      paymentAuthorizationStatus: "authorization_released",
      releasedAt: Date.now(),
      reason: reason || "released"
    };
  }

  function createOrderFromAcceptedOffer(offer) {
    const listing = getListingById(offer.listingId || offer.productId);
    if (!listing) {
      return null;
    }
    const shipping = Object.assign(
      {
        name: offer.buyerName || (state.currentUser && state.currentUser.name) || langText("Cliente IRIS", "IRIS customer"),
        address: "",
        city: "",
        country: getWorkspaceDefaultCountry(),
        note: langText("Ordine generato da offerta accettata.", "Order generated from accepted offer.")
      },
      offer.shippingSnapshot || {}
    );
    const order = createOrderFromCheckout([{ product: listing, qty: 1 }], shipping, {
      buyerEmail: offer.buyerEmail,
      buyerName: offer.buyerName || shipping.name
    });
    order.items = order.items.map(function (item) {
      return item.productId === listing.id
        ? Object.assign({}, item, {
            price: Number(offer.offerAmount || offer.amount || listing.price),
            lineStatus: "paid"
          })
        : item;
    });
    order.subtotal = Number(offer.offerAmount || offer.amount || listing.price);
    order.shippingCost = SHIPPING_COST;
    order.total = order.subtotal + order.shippingCost;
    order.payment.platformFee = getPlatformFee(order.subtotal);
    order.payment.sellerNet = Math.max(0, order.subtotal - order.payment.platformFee);
    order.payment.provider = "prototype_offer_authorization";
    order.payment.status = "captured";
    order.payment.offerId = offer.id;
    order.payment.authorizationReference = offer.authorizationReference;
    order.payment.paymentIntentReference = offer.paymentIntentReference;
    order.offerId = offer.id;
    order.buyerEmail = normalizeEmail(offer.buyerEmail || order.buyerEmail);
    order.buyerName = offer.buyerName || shipping.name || order.buyerName;
    return order;
  }

  function releaseCompetingOffers(listingId, acceptedOfferId) {
    state.offers = state.offers.map(function (offer) {
      if (String(offer.listingId || offer.productId) !== String(listingId) || offer.id === acceptedOfferId || offer.status !== "pending") {
        return offer;
      }
      return Object.assign({}, offer, {
        status: "declined",
        paymentAuthorizationStatus: "authorization_released",
        updatedAt: Date.now()
      });
    });
    persistOffers();
  }

  function offerApiCreate(payload) {
    const validation = validateOfferSubmission(payload);
    if (!validation.ok) {
      return validation;
    }
    const authorization = createOfferAuthorization(payload);
    if (!authorization.ok) {
      return {
        ok: false,
        error: authorization.error,
        code: "authorization_failed"
      };
    }
    const listing = validation.listing;
    const offer = normalizeOfferRecord({
      listingId: listing.id,
      productId: listing.id,
      productName: listing.name,
      productBrand: listing.brand,
      buyerId: state.currentUser.id,
      buyerEmail: normalizeEmail(state.currentUser.email),
      buyerName: state.currentUser.name,
      sellerId: listing.seller && listing.seller.id,
      sellerEmail: normalizeEmail((listing.seller && listing.seller.email) || listing.ownerEmail),
      sellerName: (listing.seller && listing.seller.name) || "",
      offerAmount: validation.amount,
      amount: validation.amount,
      currency: getLocaleConfig().currency,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + OFFER_EXPIRY_MS,
      paymentAuthorizationStatus: authorization.paymentAuthorizationStatus,
      paymentIntentReference: authorization.paymentIntentReference,
      authorizationReference: authorization.authorizationReference,
      shippingSnapshot: payload.shippingSnapshot || null,
      paymentMethodSnapshot: payload.paymentMethodSnapshot || null,
      minimumOfferAmount: listing.minimumOfferAmount
    });
    state.offers.unshift(offer);
    persistOffers();
    createNotification({
      audience: "user",
      kind: "offer",
      title: langText("Nuova offerta", "New offer"),
      body: `${listing.brand} ${listing.name} · ${formatCurrency(offer.offerAmount)}`,
      recipientEmail: offer.sellerEmail
    });
    createNotification({
      audience: "user",
      kind: "offer",
      title: langText("Offerta autorizzata", "Offer authorized"),
      body: `${listing.brand} ${listing.name} · ${formatCurrency(offer.offerAmount)}`,
      recipientEmail: offer.buyerEmail
    });
    enqueueEmail("new-offer", offer.sellerEmail, {
      preview: `${listing.brand} ${listing.name} · ${formatCurrency(offer.offerAmount)}`
    });
    recordAuditEvent("offer_created", `${listing.brand} ${listing.name}`, {
      offerId: offer.id,
      buyerEmail: offer.buyerEmail
    });
    return { ok: true, offer: offer };
  }

  function offerApiRespond(offerId, decision) {
    syncOfferStates();
    const current = state.offers.find(function (offer) { return offer.id === offerId; });
    if (!current) {
      return { ok: false, error: langText("Offerta non trovata.", "Offer not found.") };
    }
    if (current.status !== "pending") {
      return { ok: false, error: langText("Questa offerta non è più gestibile.", "This offer can no longer be managed.") };
    }
    if (isOfferExpired(current)) {
      syncOfferStates();
      return { ok: false, error: langText("L'offerta è scaduta.", "The offer has expired.") };
    }
    if (!isCurrentUserAdmin() && normalizeEmail(current.sellerEmail) !== normalizeEmail(state.currentUser && state.currentUser.email)) {
      return { ok: false, error: langText("Non puoi gestire questa offerta.", "You cannot manage this offer.") };
    }

    if (decision === "declined") {
      const released = releaseOfferAuthorization(current, "declined");
      state.offers = state.offers.map(function (offer) {
        if (offer.id !== offerId) return offer;
        return Object.assign({}, offer, {
          status: "declined",
          paymentAuthorizationStatus: released.paymentAuthorizationStatus,
          updatedAt: Date.now()
        });
      });
      persistOffers();
      createNotification({
        audience: "user",
        kind: "offer",
        title: langText("Offerta rifiutata", "Offer declined"),
        body: `${current.productBrand} ${current.productName}`,
        recipientEmail: current.buyerEmail
      });
      return { ok: true };
    }

    state.offers = state.offers.map(function (offer) {
      if (offer.id !== offerId) return offer;
      return Object.assign({}, offer, {
        status: "accepted",
        paymentAuthorizationStatus: "payment_capture_pending",
        updatedAt: Date.now()
      });
    });

    const capture = captureAuthorizedOfferPayment(current);
    if (!capture.ok) {
      persistOffers();
      return { ok: false, error: capture.error };
    }

    const paidOffer = normalizeOfferRecord(Object.assign({}, current, {
      status: "paid",
      paymentAuthorizationStatus: capture.paymentAuthorizationStatus,
      updatedAt: Date.now()
    }));
    const order = createOrderFromAcceptedOffer(paidOffer);
    if (!order) {
      return { ok: false, error: langText("Impossibile generare l'ordine dall'offerta.", "Unable to generate the order from this offer.") };
    }

    state.orders.unshift(order);
    notifyNewOrder(order);
    persistOrders();
    releaseCompetingOffers(order.items[0].productId, offerId);
    state.offers = state.offers.map(function (offer) {
      if (offer.id !== offerId) return offer;
      return Object.assign({}, paidOffer, { orderId: order.id });
    });
    persistOffers();
    syncInventoryFromOrders();
    createNotification({
      audience: "user",
      kind: "offer",
      title: langText("Offerta accettata e pagata", "Offer accepted and paid"),
      body: `${order.number} · ${formatCurrency(order.total)}`,
      recipientEmail: paidOffer.buyerEmail
    });
    createNotification({
      audience: "user",
      kind: "sale",
      title: langText("Pagamento catturato su offerta", "Offer payment captured"),
      body: `${paidOffer.productBrand} ${paidOffer.productName}`,
      recipientEmail: paidOffer.sellerEmail
    });
    recordAuditEvent("offer_paid", paidOffer.id, {
      orderId: order.id
    });
    return { ok: true, order: order };
  }

  function getSelectedOrder(scope) {
    const source = scope === "seller" ? getSellerOrdersForCurrentUser() : getBuyerOrders();
    if (!source.length) {
      return null;
    }
    return getOrderById(state.activeOrderId) || source[0];
  }

  function getOrderLifecycleActions(order, scope) {
    const actions = [];
    if (!order) {
      return actions;
    }
    if (scope === "buyer") {
      actions.push(`<button class="irisx-secondary" onclick="openOrderDetail('${order.id}','buyer')">${langText("Dettaglio", "Detail")}</button>`);
      actions.push(`<button class="irisx-secondary" onclick="setBuyerSection('tracking','${order.id}')">${langText("Tracking", "Tracking")}</button>`);
      actions.push(`<button class="irisx-secondary" onclick="openSupportModal('${order.id}')">${langText("Supporto", "Support")}</button>`);
      if (order.status === "dispatched_to_buyer") {
        actions.push(`<button class="irisx-primary" onclick="confirmOrderDelivered('${order.id}')">${langText("Conferma consegna", "Confirm delivery")}</button>`);
      }
      if ((order.status === "delivered" || order.status === "completed") && order.reviewStatus !== "submitted") {
        actions.push(`<button class="irisx-secondary" onclick="openReviewModal('${order.id}')">${langText("Lascia recensione", "Leave review")}</button>`);
      }
      if (["paid", "awaiting_shipment"].includes(order.status)) {
        actions.push(`<button class="irisx-secondary" onclick="cancelOrder('${order.id}')">${langText("Annulla", "Cancel")}</button>`);
      }
      if (["delivered", "completed"].includes(order.status) && order.payment.refundStatus === "none") {
        actions.push(`<button class="irisx-secondary" onclick="requestRefund('${order.id}')">${langText("Richiedi rimborso", "Request refund")}</button>`);
      }
      return actions;
    }
    if (scope === "seller") {
      actions.push(`<button class="irisx-secondary" onclick="openOrderDetail('${order.id}','seller')">${langText("Dettaglio", "Detail")}</button>`);
      if (order.status === "paid") {
        actions.push(`<button class="irisx-secondary" onclick="prepareOrderShipment('${order.id}')">${langText("Pronto da spedire", "Ready to ship")}</button>`);
      }
      if (order.status === "awaiting_shipment") {
        actions.push(`<button class="irisx-secondary" onclick="generateShippingLabel('${order.id}')">${langText("Genera label", "Generate label")}</button>`);
        actions.push(`<button class="irisx-primary" onclick="openShipmentModal('${order.id}')">${langText("Inserisci tracking", "Add tracking")}</button>`);
      }
      return actions;
    }
    actions.push(`<button class="irisx-secondary" onclick="openOrderDetail('${order.id}','admin')">${langText("Dettaglio", "Detail")}</button>`);
    if (order.status === "paid") {
      actions.push(`<button class="irisx-secondary" onclick="prepareOrderShipment('${order.id}')">${langText("Queue shipping", "Queue shipping")}</button>`);
    }
    if (order.status === "awaiting_shipment") {
      actions.push(`<button class="irisx-secondary" onclick="generateShippingLabel('${order.id}')">${langText("Genera label", "Generate label")}</button>`);
      actions.push(`<button class="irisx-primary" onclick="openShipmentModal('${order.id}')">${langText("Tracking", "Tracking")}</button>`);
    }
    if (order.status === "shipped") {
      actions.push(`<button class="irisx-secondary" onclick="markOrderInAuthentication('${order.id}')">${langText("In autenticazione", "In authentication")}</button>`);
    }
    if (order.status === "in_authentication") {
      actions.push(`<button class="irisx-secondary" onclick="dispatchOrderToBuyer('${order.id}')">${langText("Dispatch to buyer", "Dispatch to buyer")}</button>`);
    }
    if (order.status === "dispatched_to_buyer") {
      actions.push(`<button class="irisx-secondary" onclick="confirmOrderDelivered('${order.id}')">${langText("Mark delivered", "Mark delivered")}</button>`);
    }
    if (order.status === "delivered") {
      actions.push(`<button class="irisx-secondary" onclick="completeOrderLifecycle('${order.id}')">${langText("Completa ordine", "Complete order")}</button>`);
    }
    if (order.status === "refund_requested") {
      actions.push(`<button class="irisx-secondary" onclick="markOrderRefunded('${order.id}')">${langText("Rimborsa", "Refund")}</button>`);
    }
    if (!["cancelled", "refunded", "completed"].includes(order.status)) {
      actions.push(`<button class="irisx-secondary" onclick="cancelOrder('${order.id}')">${langText("Annulla", "Cancel")}</button>`);
    }
    return actions;
  }

  function renderOrderRelistBlock(order, variant) {
    const relistableItems = getRelistableOrderItems(order);
    if (!relistableItems.length) {
      return "";
    }
    const compact = variant === "compact";
    return `<div class="irisx-relist-block${compact ? " irisx-relist-block--compact" : ""}">
      <div class="irisx-section-head">
        <div>
          <h3>${langText("Vuoi rimetterlo in vendita?", "Want to resell it?")}</h3>
          <span>${langText("Questo articolo è stato acquistato su IRIS: puoi riaprire una bozza con foto, misure, storico e dati già pronti.", "This item was purchased on IRIS: reopen a draft with photos, measurements, history, and product data already filled in.")}</span>
        </div>
      </div>
      <div class="irisx-card-stack">${relistableItems.map(function (item) {
        const existingRelist = getExistingRelistListing(order.id, item.productId);
        const sourceListing = getRelistSourceListing(item);
        const certified = sourceListing ? isListingVerified(sourceListing) : true;
        const helperText = existingRelist
          ? langText("Hai già una rivendita aperta da questo acquisto. Puoi riaprire e modificarla.", "You already have an open resale from this purchase. You can reopen and edit it.")
          : langText("Creiamo una bozza nuova con certificato IRIS, foto, misure e storico acquisto già agganciati.", "We create a fresh draft with IRIS certificate, photos, measurements, and purchase history already attached.");
        const buttonLabel = existingRelist
          ? (existingRelist.listingStatus === "draft" ? langText("Apri bozza", "Open draft") : langText("Apri rivendita", "Open resale"))
          : langText("Rimetti in vendita", "Relist item");
        return `<div class="irisx-inline-card irisx-inline-card--relist">
          <div>
            <strong>${escapeHtml(item.brand)} ${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(helperText)}</span>
            <em>${escapeHtml(langText("Acquisto IRIS", "IRIS purchase"))} · ${escapeHtml(order.number)}${certified ? ` · ${escapeHtml(langText("Certificato IRIS disponibile", "IRIS certificate available"))}` : ""}</em>
          </div>
          <div class="irisx-actions irisx-actions--stack">
            <span class="irisx-badge">${escapeHtml(certified ? langText("IRIS verified", "IRIS verified") : langText("IRIS archive", "IRIS archive"))}</span>
            <button class="irisx-primary" onclick="startRelistFromOrderItem('${order.id}','${item.productId}')">${buttonLabel}</button>
          </div>
        </div>`;
      }).join("")}</div>
    </div>`;
  }

  function startRelistFromOrderItem(orderId, productId) {
    requireAuth(function () {
      const order = getOrderById(orderId);
      if (!order) {
        showToast(langText("Ordine non trovato.", "Order not found."));
        return;
      }
      const relistableItems = getRelistableOrderItems(order);
      const item = relistableItems.find(function (entry) {
        return String(entry.productId) === String(productId);
      });
      if (!item) {
        showToast(langText("Questo articolo non è disponibile per la rivendita assistita.", "This item is not available for assisted resale."));
        return;
      }

      const existingRelist = getExistingRelistListing(order.id, item.productId);
      if (existingRelist) {
        closeOrderDetail();
        loadDraftIntoSellForm(existingRelist.id);
        showToast(langText("Bozza di rivendita già pronta. Aggiornala e ripubblicala.", "Resale draft already ready. Update it and republish."));
        return;
      }

      const seller = getCurrentUserSeller();
      if (!seller) {
        showToast(langText("Accedi come seller per creare la rivendita.", "Sign in as a seller to create the resale."));
        return;
      }

      const user = normalizeUserWorkspace(state.currentUser || {});
      const sourceListing = getRelistSourceListing(item);
      const sourceChips = sourceListing ? getListingChips(sourceListing) : [];
      const relistSeed = Object.assign({}, sourceListing || {}, item || {});
      const categoryKey = (sourceListing && sourceListing.categoryKey) || inferSellCategoryKey(relistSeed);
      const subcategoryKey = (sourceListing && sourceListing.subcategoryKey) || inferSellSubcategoryKey(relistSeed, categoryKey);
      const productTypeKey = (sourceListing && sourceListing.productTypeKey) || inferSellTypeKey(relistSeed, categoryKey, subcategoryKey);
      const sizeSchema = (sourceListing && sourceListing.sizeSchema) || inferSellSizeSchema(Object.assign({}, relistSeed, {
        categoryKey: categoryKey,
        subcategoryKey: subcategoryKey
      }));
      const relistDraft = syncListingIntoCatalog({
        id: createId("relist"),
        ownerEmail: user.email,
        seller: seller,
        name: (sourceListing && sourceListing.name) || item.name || langText("Articolo IRIS", "IRIS item"),
        brand: (sourceListing && sourceListing.brand) || item.brand || "IRIS",
        cat: (sourceListing && sourceListing.cat) || getSellCategoryLabel(categoryKey) || langText("Da definire", "To define"),
        categoryKey: categoryKey,
        subcategory: (sourceListing && sourceListing.subcategory) || getSellSubcategoryLabel(categoryKey, subcategoryKey),
        subcategoryKey: subcategoryKey,
        productType: (sourceListing && sourceListing.productType) || getSellTypeLabel(categoryKey, subcategoryKey, productTypeKey),
        productTypeKey: productTypeKey,
        sz: (sourceListing && sourceListing.sz) || langText("Taglia unica", "One size"),
        sizeOriginal: (sourceListing && sourceListing.sizeOriginal) || "",
        sizeSchema: sizeSchema,
        cond: (sourceListing && sourceListing.cond) || langText("Ottime condizioni", "Very good"),
        fit: (sourceListing && sourceListing.fit) || "—",
        dims: (sourceListing && sourceListing.dims) || "",
        measurements: sourceListing && sourceListing.measurements ? sourceListing.measurements : {},
        material: (sourceListing && sourceListing.material) || "",
        color: (sourceListing && sourceListing.color) || "",
        emoji: (sourceListing && sourceListing.emoji) || "👜",
        desc: (sourceListing && sourceListing.desc) || "",
        chips: Array.from(new Set(sourceChips.concat([langText("Archivio IRIS", "IRIS archive")]).filter(Boolean))),
        images: Array.isArray(sourceListing && sourceListing.images) ? sourceListing.images.slice() : [],
        price: Number(item.price || (sourceListing && sourceListing.price) || 0),
        orig: Number((sourceListing && getListingOriginalPrice(sourceListing)) || item.price || 0),
        compareAt: Number((sourceListing && getListingOriginalPrice(sourceListing)) || item.price || 0),
        inventoryStatus: "draft",
        listingStatus: "draft",
        isUserListing: true,
        orderId: null,
        soldAt: null,
        offersEnabled: Boolean(user.listingPreferences && user.listingPreferences.offersDefault),
        minimumOfferAmount: null,
        verified: sourceListing ? isListingVerified(sourceListing) : true,
        authenticationStatus: sourceListing && sourceListing.authenticationStatus ? sourceListing.authenticationStatus : "verified",
        relistSourceOrderId: order.id,
        relistSourceProductId: item.productId,
        relistSourceListingId: sourceListing ? sourceListing.id : null,
        relistSourceReceiptNumber: order.payment && order.payment.receiptNumber ? order.payment.receiptNumber : "",
        relistSourcePurchasedAt: order.createdAt,
        relistSourceCertified: sourceListing ? isListingVerified(sourceListing) : true,
        relistSourcePlatform: "IRIS"
      });

      recordAuditEvent("relist_draft_created", `${relistDraft.brand} ${relistDraft.name}`, {
        orderId: order.id,
        sourceProductId: item.productId,
        ownerEmail: user.email
      });

      closeOrderDetail();
      loadDraftIntoSellForm(relistDraft.id);
      updateSellStatus(langText("Bozza di rivendita pronta. Aggiorna condizione, foto e prezzo prima di pubblicare.", "Resale draft ready. Update condition, photos, and price before publishing."));
      showToast(langText("Rivendita precompilata creata da acquisto IRIS.", "Prefilled resale draft created from your IRIS purchase."));
    });
  }

  function renderOrderSummaryCard(order, scope) {
    if (!order) {
      return `<div class="irisx-empty-state">${langText("Nessun ordine selezionato.", "No order selected.")}</div>`;
    }
    const actions = getOrderLifecycleActions(order, scope).join("");
    const supportRole = scope === "seller" ? "seller" : "buyer";
    return `<div class="irisx-order-card irisx-order-card--expanded">
      <div class="irisx-order-head">
        <strong>${escapeHtml(order.number)}</strong>
        <span class="irisx-badge">${escapeHtml(getOrderStatusLabel(order))}</span>
      </div>
      <div class="irisx-order-grid">
        <div class="irisx-order-panel">
          <div class="irisx-order-panel-title">${langText("Items", "Items")}</div>
          <div class="irisx-order-items">${order.items.map(function (item) {
            return `<div>${escapeHtml(item.brand)} ${escapeHtml(item.name)} · ${escapeHtml(formatCurrency(item.price))}</div>`;
          }).join("")}</div>
        </div>
        <div class="irisx-order-panel">
          <div class="irisx-order-panel-title">${langText("Shipping", "Shipping")}</div>
          <div class="irisx-order-items">
            <div>${escapeHtml(order.shipping.name || order.buyerName)}</div>
            <div>${escapeHtml(order.shipping.address)}, ${escapeHtml(order.shipping.city)}, ${escapeHtml(order.shipping.country)}</div>
            <div>${escapeHtml(order.shipping.method || langText("Spedizione assicurata", "Insured shipping"))}</div>
            <div>${escapeHtml(order.shipping.carrier || langText("Carrier pending", "Carrier pending"))} ${order.shipping.trackingNumber ? "· " + escapeHtml(order.shipping.trackingNumber) : ""}</div>
          </div>
        </div>
        <div class="irisx-order-panel">
          <div class="irisx-order-panel-title">${langText("Pagamento", "Payment")}</div>
          <div class="irisx-order-items">
            <div>${langText("Totale", "Total")}: ${escapeHtml(formatCurrency(order.total))}</div>
            <div>${langText("Fee piattaforma", "Platform fee")}: ${escapeHtml(formatCurrency(order.payment.platformFee || 0))}</div>
            <div>${langText("Payout status", "Payout status")}: ${escapeHtml(order.payment.payoutStatus || "pending")}</div>
            <div>${langText("Ricevuta", "Receipt")}: ${escapeHtml(order.payment.receiptNumber || "—")}</div>
          </div>
        </div>
      </div>
      <div class="irisx-order-support-strip">
        <div>
          <strong>${langText("Assistenza IRIS collegata a questo ordine", "IRIS support linked to this order")}</strong>
          <span>${langText("Supporto, escalation e dispute mantengono automaticamente riferimento a ordine e articolo.", "Support, escalation, and disputes automatically keep order and item context attached.")}</span>
        </div>
        <div class="irisx-order-support-actions">
          <button class="irisx-secondary" onclick="openSupportModal('${order.id}', { role: '${supportRole}', issueType: 'order_problem' })">${langText("Supporto", "Support")}</button>
          <button class="irisx-secondary" onclick="openSupportModal('${order.id}', { role: '${supportRole}', issueSeverity: 'dispute', issueType: 'item_not_as_described' })">${langText("Apri disputa", "Open dispute")}</button>
        </div>
      </div>
      ${renderOrderTimeline(order)}
      ${scope === "buyer" ? renderOrderRelistBlock(order, "full") : ""}
      ${actions ? `<div class="irisx-actions">${actions}</div>` : ""}
    </div>`;
  }

  function renderOrderTrackingPanel(order) {
    if (!order) {
      return `<div class="irisx-empty-state">${langText("Nessun tracking disponibile.", "No tracking available.")}</div>`;
    }
    return `<div class="irisx-order-card irisx-order-card--expanded">
      <div class="irisx-order-head">
        <strong>${escapeHtml(order.number)}</strong>
        <span class="irisx-badge">${escapeHtml(getOrderStatusLabel(order))}</span>
      </div>
      <div class="irisx-tracking-grid">
        <div class="irisx-order-panel">
          <div class="irisx-order-panel-title">${langText("Shipment status", "Shipment status")}</div>
          <div class="irisx-order-items">
            <div>${langText("Metodo", "Method")}: ${escapeHtml(order.shipping.method || "—")}</div>
            <div>${langText("Carrier", "Carrier")}: ${escapeHtml(order.shipping.carrier || langText("Pending assignment", "Pending assignment"))}</div>
            <div>${langText("Tracking", "Tracking")}: ${escapeHtml(order.shipping.trackingNumber || langText("Comparirà dopo la consegna al corriere", "Will appear after seller handoff"))}</div>
            <div>${langText("Label", "Label")}: ${escapeHtml(order.shipping.labelStatus || "pending")}</div>
          </div>
        </div>
        <div class="irisx-order-panel">
          <div class="irisx-order-panel-title">${langText("Timeline", "Timeline")}</div>
          ${renderOrderTimeline(order) || `<div class="irisx-empty-state">${langText("Timeline vuota.", "Timeline empty.")}</div>`}
        </div>
      </div>
      <div class="irisx-actions">${getOrderLifecycleActions(order, "buyer").join("")}</div>
    </div>`;
  }

  function generateShippingLabel(orderId) {
    const updated = setOrderStatus(
      orderId,
      getOrderById(orderId).status,
      "label_generated",
      langText("Label placeholder generata", "Placeholder label generated"),
      {
        carrier: getOrderById(orderId).shipping.carrier || "DHL",
        trackingNumber: getOrderById(orderId).shipping.trackingNumber || ("IRIS-LABEL-" + String(Date.now()).slice(-6)),
        labelStatus: "generated"
      }
    );
    if (updated) {
      showToast(langText("Label placeholder pronta.", "Placeholder label ready."));
    }
  }

  function respondToOffer(offerId, decision) {
    const normalizedDecision = decision === "rejected" ? "declined" : decision;
    const result = offerApiRespond(offerId, normalizedDecision);
    if (!result.ok) {
      showToast(result.error);
      renderProfilePanel();
      renderNotifications();
      renderOpsView();
      return;
    }
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
    showToast(normalizedDecision === "accepted"
      ? langText("Offerta accettata e pagamento catturato.", "Offer accepted and payment captured.")
      : langText("Offerta rifiutata e autorizzazione rilasciata.", "Offer declined and authorization released."));
  }

  function saveAddressBook() {
    if (!state.currentUser) {
      return;
    }
    const label = readProfileField("#accountAddressLabel") || langText("Indirizzo", "Address");
    const name = readProfileField("#accountAddressName") || state.currentUser.name || "";
    const address = readProfileField("#accountAddressLine");
    const city = readProfileField("#accountAddressCity");
    const country = readProfileField("#accountAddressCountry") || getWorkspaceDefaultCountry();
    if (!address || !city) {
      showToast(langText("Completa indirizzo e citta'.", "Complete address and city."));
      return;
    }
    const nextAddresses = state.currentUser.addresses.slice();
    nextAddresses.unshift(normalizeAddressRecord({
      id: createId("addr"),
      label: label,
      name: name,
      address: address,
      city: city,
      country: country,
      isDefault: nextAddresses.length === 0
    }, state.currentUser));
    syncCurrentUserWorkspace({
      address: address,
      city: city,
      country: country,
      addresses: nextAddresses
    });
    renderProfilePanel();
    showToast(langText("Indirizzo salvato.", "Address saved."));
  }

  function setDefaultAddress(addressId) {
    if (!state.currentUser) {
      return;
    }
    const nextAddresses = state.currentUser.addresses.map(function (address) {
      return Object.assign({}, address, { isDefault: address.id === addressId });
    });
    const selected = nextAddresses.find(function (address) { return address.id === addressId; });
    syncCurrentUserWorkspace({
      address: selected ? selected.address : state.currentUser.address,
      city: selected ? selected.city : state.currentUser.city,
      country: selected ? selected.country : state.currentUser.country,
      addresses: nextAddresses
    });
    renderProfilePanel();
  }

  function addPrototypePaymentMethod() {
    if (!state.currentUser) {
      return;
    }
    const methods = state.currentUser.paymentMethods.slice();
    methods.unshift(normalizePaymentMethodRecord({
      id: createId("pm"),
      brand: methods.length ? "Mastercard" : "Visa",
      last4: String(4000 + methods.length * 37).slice(-4),
      label: langText("Carta prototipo", "Prototype card"),
      isDefault: methods.length === 0
    }));
    syncCurrentUserWorkspace({
      paymentMethods: methods
    });
    renderProfilePanel();
    showToast(langText("Metodo di pagamento aggiunto.", "Payment method added."));
  }

  function savePayoutWorkspace() {
    if (!state.currentUser) {
      return;
    }
    syncCurrentUserWorkspace({
      payoutSettings: normalizePayoutSettings({
        method: readProfileField("#payoutMethod") || "bank_transfer",
        accountHolder: readProfileField("#payoutHolder") || state.currentUser.name,
        iban: readProfileField("#payoutIban"),
        paypalEmail: readProfileField("#payoutPaypal") || state.currentUser.email,
        cadence: readProfileField("#payoutCadence") || langText("Settimanale", "Weekly"),
        status: readProfileField("#payoutIban") || readProfileField("#payoutPaypal") ? "configured" : "setup_required"
      }, state.currentUser)
    });
    renderProfilePanel();
    showToast(langText("Payout settings aggiornati.", "Payout settings updated."));
  }

  function saveNotificationPreferences() {
    if (!state.currentUser) {
      return;
    }
    syncCurrentUserWorkspace({
      notificationSettings: normalizeNotificationSettings({
        orders: qs("#notifPrefOrders") ? qs("#notifPrefOrders").checked : true,
        messages: qs("#notifPrefMessages") ? qs("#notifPrefMessages").checked : true,
        offers: qs("#notifPrefOffers") ? qs("#notifPrefOffers").checked : true,
        payouts: qs("#notifPrefPayouts") ? qs("#notifPrefPayouts").checked : true,
        admin: qs("#notifPrefAdmin") ? qs("#notifPrefAdmin").checked : true
      })
    });
    renderProfilePanel();
    showToast(langText("Preferenze notifiche salvate.", "Notification preferences saved."));
  }

  function saveSecurityWorkspace() {
    if (!state.currentUser) {
      return;
    }
    syncCurrentUserWorkspace({
      security: normalizeSecurityRecord({
        twoFactor: qs("#securityTwoFactor") ? qs("#securityTwoFactor").checked : false,
        loginAlerts: qs("#securityLoginAlerts") ? qs("#securityLoginAlerts").checked : true,
        passwordUpdatedAt: Date.now(),
        activeSessions: state.currentUser.security.activeSessions
      })
    });
    renderProfilePanel();
    showToast(langText("Preferenze sicurezza salvate.", "Security preferences saved."));
  }

  function saveAccountSettings() {
    if (!state.currentUser) {
      return;
    }
    const nextName = readProfileField("#profileNameInput");
    const nextPhone = readProfileField("#profilePhoneInput");
    if (!nextName) {
      showToast(langText("Inserisci il nome del profilo.", "Please enter your profile name."));
      return;
    }
    if (nextPhone && !isValidPhoneNumber(nextPhone)) {
      showToast(langText("Inserisci un numero di telefono valido.", "Please enter a valid phone number."));
      return;
    }
    const normalizedNextPhone = nextPhone ? normalizePhoneNumber(nextPhone) : state.currentUser.phone;
    if (normalizedNextPhone && isPhoneBanned(normalizedNextPhone)) {
      showToast(getBlockedIdentityMessage(state.currentUser.email, normalizedNextPhone) || langText("Numero di telefono bloccato.", "Blocked phone number."));
      return;
    }
    const phoneChanged = normalizedNextPhone !== normalizePhoneNumber(state.currentUser.phone);
    syncCurrentUserWorkspace({
      name: nextName,
      phone: normalizedNextPhone,
      city: readProfileField("#profileCityInput") || state.currentUser.city,
      country: readProfileField("#profileCountryInput") || state.currentUser.country,
      bio: readProfileField("#profileBioInput"),
      avatar: readProfileField("#profileAvatarInput") || state.currentUser.avatar,
      verification: phoneChanged
        ? Object.assign({}, state.currentUser.verification, {
            phoneVerified: false,
            phoneVerifiedAt: null,
            verifiedPhone: "",
            pendingPhoneCode: "",
            pendingPhoneCodeExpiresAt: null
          })
        : state.currentUser.verification
    });
    render();
    renderProfilePanel();
    renderOpsView();
    showToast(t("profile_saved"));
  }

  function saveShoppingPreferences() {
    if (!state.currentUser) {
      return;
    }
    syncCurrentUserWorkspace({
      shoppingPreferences: normalizeShoppingPreferences({
        preferredCurrency: readProfileField("#shoppingCurrency") || state.currentUser.shoppingPreferences.preferredCurrency,
        authenticatedOnly: qs("#shoppingAuthenticatedOnly") ? qs("#shoppingAuthenticatedOnly").checked : state.currentUser.shoppingPreferences.authenticatedOnly,
        sizeAlerts: qs("#shoppingSizeAlerts") ? qs("#shoppingSizeAlerts").checked : state.currentUser.shoppingPreferences.sizeAlerts,
        offerAlerts: qs("#shoppingOfferAlerts") ? qs("#shoppingOfferAlerts").checked : state.currentUser.shoppingPreferences.offerAlerts,
        savedSearchAlerts: qs("#shoppingSearchAlerts") ? qs("#shoppingSearchAlerts").checked : state.currentUser.shoppingPreferences.savedSearchAlerts
      })
    });
    renderProfilePanel();
    showToast(langText("Preferenze acquisti salvate.", "Shopping preferences saved."));
  }

  function saveSizeProfile() {
    if (!state.currentUser) {
      return;
    }
    syncCurrentUserWorkspace({
      sizeProfile: normalizeSizeProfile({
        tops: readProfileField("#sizeProfileTops") || state.currentUser.sizeProfile.tops,
        bottoms: readProfileField("#sizeProfileBottoms") || state.currentUser.sizeProfile.bottoms,
        shoes: readProfileField("#sizeProfileShoes") || state.currentUser.sizeProfile.shoes,
        fit: readProfileField("#sizeProfileFit") || state.currentUser.sizeProfile.fit,
        preferredBrands: readProfileField("#sizeProfileBrands") || state.currentUser.sizeProfile.preferredBrands
      })
    });
    renderProfilePanel();
    showToast(langText("My Size aggiornata.", "My Size updated."));
  }

  function addSavedSearch() {
    if (!state.currentUser) {
      return;
    }
    const label = readProfileField("#savedSearchLabel");
    const query = readProfileField("#savedSearchQuery");
    if (!label || !query) {
      showToast(langText("Inserisci nome e query della ricerca.", "Enter both a label and a search query."));
      return;
    }
    const currentSearches = state.currentUser.savedSearches || [];
    if (currentSearches.some(function (entry) { return entry.label.toLowerCase() === label.toLowerCase(); })) {
      showToast(langText("Esiste gia' una ricerca con questo nome.", "A saved search with this name already exists."));
      return;
    }
    syncCurrentUserWorkspace({
      savedSearches: currentSearches.concat([
        normalizeSavedSearchRecord({
          label: label,
          query: query,
          filtersSummary: readProfileField("#savedSearchFilters") || langText("Filtro marketplace", "Marketplace filter"),
          alertsEnabled: qs("#savedSearchAlertsToggle") ? qs("#savedSearchAlertsToggle").checked : true
        })
      ])
    });
    renderProfilePanel();
    showToast(langText("Ricerca salvata.", "Saved search added."));
  }

  function removeSavedSearch(savedSearchId) {
    if (!state.currentUser) {
      return;
    }
    syncCurrentUserWorkspace({
      savedSearches: (state.currentUser.savedSearches || []).filter(function (entry) {
        return entry.id !== savedSearchId;
      })
    });
    renderProfilePanel();
    showToast(langText("Ricerca rimossa.", "Saved search removed."));
  }

  function saveSellingWorkspace() {
    if (!state.currentUser) {
      return;
    }
    syncCurrentUserWorkspace({
      sellingPreferences: normalizeSellingPreferences({
        handlingModel: readProfileField("#sellingHandlingModel") || state.currentUser.sellingPreferences.handlingModel,
        offerStrategy: readProfileField("#sellingOfferStrategy") || state.currentUser.sellingPreferences.offerStrategy,
        shipFromCity: readProfileField("#sellingLocationCity") || state.currentUser.sellingPreferences.shipFromCity,
        shipFromCountry: readProfileField("#sellingLocationCountry") || state.currentUser.sellingPreferences.shipFromCountry,
        publicLocation: qs("#sellingPublicLocation") ? qs("#sellingPublicLocation").checked : state.currentUser.sellingPreferences.publicLocation,
        autoMessages: qs("#sellingAutoMessages") ? qs("#sellingAutoMessages").checked : state.currentUser.sellingPreferences.autoMessages
      }, state.currentUser),
      vacationMode: normalizeVacationModeRecord({
        enabled: qs("#sellingVacationEnabled") ? qs("#sellingVacationEnabled").checked : state.currentUser.vacationMode.enabled,
        returnDate: readProfileField("#sellingVacationReturnDate") || state.currentUser.vacationMode.returnDate,
        note: readProfileField("#sellingVacationNote") || state.currentUser.vacationMode.note
      }),
      listingPreferences: normalizeListingPreferences({
        defaultCondition: readProfileField("#sellingDefaultCondition") || state.currentUser.listingPreferences.defaultCondition,
        defaultProcessingDays: readProfileField("#sellingProcessingDays") || state.currentUser.listingPreferences.defaultProcessingDays,
        defaultShippingMethod: readProfileField("#sellingShippingMethod") || state.currentUser.listingPreferences.defaultShippingMethod,
        offersDefault: qs("#sellingOffersDefault") ? qs("#sellingOffersDefault").checked : state.currentUser.listingPreferences.offersDefault
      })
    });
    renderProfilePanel();
    showToast(langText("Preferenze seller salvate.", "Seller preferences saved."));
  }

  function savePrivacyWorkspace() {
    if (!state.currentUser) {
      return;
    }
    syncCurrentUserWorkspace({
      privacySettings: normalizePrivacySettings({
        profileVisibility: readProfileField("#privacyVisibility") || state.currentUser.privacySettings.profileVisibility,
        showActivityStatus: qs("#privacyActivityStatus") ? qs("#privacyActivityStatus").checked : state.currentUser.privacySettings.showActivityStatus,
        allowMessageRequests: qs("#privacyMessageRequests") ? qs("#privacyMessageRequests").checked : state.currentUser.privacySettings.allowMessageRequests,
        personalizedRecommendations: qs("#privacyPersonalized") ? qs("#privacyPersonalized").checked : state.currentUser.privacySettings.personalizedRecommendations
      })
    });
    renderProfilePanel();
    showToast(langText("Privacy settings salvate.", "Privacy settings saved."));
  }

  function ensureSellDraftButton() {
    const publishButton = qs(".sell-submit");
    if (publishButton && !qs("#sellDraftBtn")) {
      publishButton.insertAdjacentHTML("beforebegin", `<button class="irisx-secondary irisx-sell-draft" id="sellDraftBtn" onclick="saveListingDraft()">${langText("Salva bozza", "Save draft")}</button>`);
    }
  }

  function saveListingDraft() {
    requireAuth(function () {
      const seller = getCurrentUserSeller();
      if (!seller) {
        showToast(langText("Accedi per salvare una bozza.", "Sign in to save a draft."));
        return;
      }
      const draftPrice = Number(readSellField("#sf-price") || 0);
      const offerPolicy = getListingOfferPolicyFromForm();
      const offerValidation = validateListingOfferPolicy(offerPolicy, draftPrice);
      const taxonomy = collectSellTaxonomySelection();
      const measurements = collectSellMeasurements();
      if (!offerValidation.ok) {
        updateSellStatus(offerValidation.error, true);
        return;
      }
      if (!taxonomy.ok && readSellField("#sf-cat")) {
        updateSellStatus(taxonomy.error, true);
        return;
      }
      const brand = readSellField("#sf-brand") || "IRIS";
      const name = readSellField("#sf-name") || langText("Bozza annuncio", "Draft listing");
      const existingListing = state.editingListingId
        ? state.listings.find(function (listing) { return String(listing.id) === String(state.editingListingId); }) ||
          prods.find(function (listing) { return String(listing.id) === String(state.editingListingId); })
        : null;
      const draft = syncListingIntoCatalog({
        id: existingListing ? existingListing.id : Date.now(),
        ownerEmail: state.currentUser.email,
        name: name,
        brand: brand,
        cat: taxonomy.ok ? taxonomy.categoryLabel : langText("Da definire", "To define"),
        categoryKey: taxonomy.ok ? taxonomy.categoryKey : "",
        subcategory: taxonomy.ok ? taxonomy.subcategoryLabel : "",
        subcategoryKey: taxonomy.ok ? taxonomy.subcategoryKey : "",
        productType: taxonomy.ok ? taxonomy.typeLabel : "",
        productTypeKey: taxonomy.ok ? taxonomy.typeKey : "",
        sz: taxonomy.ok ? taxonomy.sizeDisplay : langText("Taglia unica", "One size"),
        sizeOriginal: taxonomy.ok ? taxonomy.sizeOriginal : "",
        sizeSchema: taxonomy.ok ? taxonomy.sizeMode : "one_size",
        cond: qsa(".cond-btn.sel").map(function (button) { return button.textContent.trim(); })[0] || langText("Da definire", "To define"),
        fit: taxonomy.ok ? taxonomy.fit : "—",
        dims: readSellField("#sf-dims") || "",
        measurements: measurements,
        price: Number(readSellField("#sf-price") || 0),
        orig: Math.round(Number(readSellField("#sf-price") || 0) * 1.35),
        color: readSellField("#sf-color") || "",
        material: readSellField("#sf-material") || "",
        emoji: taxonomy.ok ? taxonomy.emoji : "👜",
        desc: readSellField("#sf-desc") || "",
        chips: [taxonomy.ok ? taxonomy.categoryLabel : "", taxonomy.ok ? taxonomy.subcategoryLabel : "", brand].filter(Boolean),
        seller: seller,
        date: Date.now(),
        images: state.sellPhotos.map(function (photo) { return photo.src; }),
        inventoryStatus: "draft",
        listingStatus: "draft",
        isUserListing: true,
        orderId: existingListing ? existingListing.orderId || null : null,
        soldAt: existingListing ? existingListing.soldAt || null : null,
        offersEnabled: offerPolicy.offersEnabled,
        minimumOfferAmount: offerValidation.minimumOfferAmount
      });
      renderProfilePanel();
      renderOpsView();
      updateSellStatus(langText("Bozza salvata nella seller area.", "Draft saved inside seller area."));
      showToast(langText("Bozza salvata.", "Draft saved."));
    });
  }

  function publishDraftListing(listingId) {
    state.listings = state.listings.map(function (listing) {
      if (String(listing.id) !== String(listingId)) {
        return listing;
      }
      return normalizeListingRecord(Object.assign({}, listing, {
        inventoryStatus: "active",
        listingStatus: "published",
        date: Date.now()
      }));
    });
    saveJson(STORAGE_KEYS.listings, state.listings);
    hydrateLocalListings();
    render();
    renderProfilePanel();
    renderOpsView();
    showToast(langText("Bozza pubblicata.", "Draft published."));
  }

  function loadDraftIntoSellForm(listingId) {
    const listing = state.listings.find(function (candidate) { return String(candidate.id) === String(listingId); });
    if (!listing) {
      return;
    }
    showPage("sell");
    const categoryKey = listing.categoryKey || inferSellCategoryKey(listing);
    const subcategoryKey = listing.subcategoryKey || inferSellSubcategoryKey(listing, categoryKey);
    const productTypeKey = listing.productTypeKey || inferSellTypeKey(listing, categoryKey, subcategoryKey);
    const sizeValue = getSellFormSizeValue(listing, categoryKey, subcategoryKey);
    const sizeMode = (listing && listing.sizeSchema) || getResolvedSellSizeMode(categoryKey, subcategoryKey);
    ensureSellTaxonomyUi({
      categoryKey: categoryKey,
      subcategoryKey: subcategoryKey,
      typeKey: productTypeKey,
      size: sizeValue,
      measurements: listing.measurements || {}
    });
    const fieldMap = {
      "#sf-cat": categoryKey,
      "#sf-brand": listing.brand,
      "#sf-name": listing.name,
      "#sf-subcat": subcategoryKey,
      "#sf-type": productTypeKey,
      "#sf-size": sizeValue,
      "#sf-size-original": listing.sizeOriginal || (sizeMode === "belt" && listing.sz && listing.sz !== sizeValue ? listing.sz : ""),
      "#sf-color": listing.color,
      "#sf-fit": listing.fit,
      "#sf-material": listing.material,
      "#sf-dims": listing.dims,
      "#sf-desc": listing.desc,
      "#sf-price": listing.price
    };
    Object.keys(fieldMap).forEach(function (selector) {
      const field = qs(selector);
      if (field) {
        field.value = fieldMap[selector] || "";
      }
    });
    state.editingListingId = listing.id;
    ensureSellTaxonomyUi({
      categoryKey: qs("#sf-cat") ? qs("#sf-cat").value : "",
      subcategoryKey: qs("#sf-subcat") ? qs("#sf-subcat").value : "",
      typeKey: qs("#sf-type") ? qs("#sf-type").value : "",
      size: qs("#sf-size") ? qs("#sf-size").value : "",
      measurements: listing.measurements || {}
    });
    qsa(".cond-btn").forEach(function (button) {
      button.classList.toggle("sel", button.textContent.trim() === listing.cond);
    });
    state.sellPhotos = Array.isArray(listing.images)
      ? listing.images.map(function (src, index) { return { id: createId("photo"), name: `draft-${index + 1}`, src: src }; })
      : [];
    applyListingOfferPolicyToForm(listing);
    renderSellPhotoPreview();
    updateFee();
    updateSellStatus(langText("Annuncio caricato. Puoi aggiornarlo e ripubblicarlo.", "Listing loaded. You can update and republish it."));
  }

  function archiveListing(listingId) {
    state.listings = state.listings.map(function (listing) {
      if (String(listing.id) !== String(listingId)) {
        return listing;
      }
      return Object.assign({}, listing, {
        inventoryStatus: "archived",
        listingStatus: "archived"
      });
    });
    saveJson(STORAGE_KEYS.listings, state.listings);
    hydrateLocalListings();
    render();
    renderProfilePanel();
  }

  function toggleListingOffers(listingId) {
    state.listings = state.listings.map(function (listing) {
      if (String(listing.id) !== String(listingId)) {
        return listing;
      }
      const nowEnabled = listing.offersEnabled !== false;
      return Object.assign({}, listing, { offersEnabled: !nowEnabled });
    });
    saveJson(STORAGE_KEYS.listings, state.listings);
    hydrateLocalListings();
    renderProfilePanel();
    showToast(langText("Impostazione offerte aggiornata.", "Offer setting updated."));
  }

  function setProfileArea(area, section) {
    ensureStructuredSkeletonState();
    state.profileArea = area;
    if (area === "account") {
      state.profileSection = resolveAccountSectionId(section || state.profileSection || "overview");
    }
    if (area === "buyer") {
      state.buyerSection = section || state.buyerSection || "orders";
    }
    if (area === "seller") {
      state.sellerSection = section || state.sellerSection || "dashboard";
    }
    renderProfilePanel();
  }

  function setBuyerSection(section, orderId) {
    state.profileArea = "buyer";
    state.buyerSection = section;
    if (orderId) {
      state.activeOrderId = orderId;
    }
    renderProfilePanel();
  }

  function setSellerSection(section) {
    state.profileArea = "seller";
    state.sellerSection = section;
    renderProfilePanel();
  }

  function renderSellerProfileView() {
    const sellerView = qs("#seller-view");
    if (!sellerView || !sellerView.classList.contains("active")) {
      return;
    }
    const container = qs("#sellerContent");
    if (!container) {
      return;
    }
    state.profileArea = "seller";
    renderProfilePanel();
  }

  function setAdminSection(section) {
    state.adminSection = section;
    renderOpsView();
  }

  function openNotificationCenter() {
    showBuyView("profile");
    setProfileArea("account", "settings_notifications");
  }

  function resolveAccountSectionId(section) {
    const aliasMap = {
      settings: "settings_profile",
      addresses: "settings_account",
      payments: "settings_payment",
      payouts: "selling_preferences",
      notifications: "settings_notifications",
      support: "help_contact",
      security: "settings_security",
      reviews: "overview"
    };
    return aliasMap[section] || section || "overview";
  }

  function getAccountSectionGroups() {
    return [
      {
        title: langText("PANORAMICA", "OVERVIEW"),
        entries: [
          { id: "overview", label: langText("Panoramica", "Overview") }
        ]
      },
      {
        title: langText("ACQUISTI", "SHOPPING"),
        entries: [
          { id: "shopping_preferences", label: langText("Preferenze", "Preferences") },
          { id: "shopping_sizes", label: langText("Le mie taglie", "My Size") },
          { id: "shopping_saved_searches", label: langText("Ricerche salvate", "Saved searches") }
        ]
      },
      {
        title: langText("VENDITE", "SELLING"),
        entries: [
          { id: "selling_preferences", label: langText("Preferenze vendita", "Selling preferences") },
          { id: "selling_location", label: langText("Posizione", "Location") },
          { id: "selling_vacation", label: langText("Modalità vacanza", "Vacation mode") },
          { id: "selling_listing_preferences", label: langText("Preferenze annunci", "Listing preferences") }
        ]
      },
      {
        title: langText("IMPOSTAZIONI", "SETTINGS"),
        entries: [
          { id: "settings_account", label: langText("Account", "Account") },
          { id: "settings_profile", label: langText("Profilo", "Profile") },
          { id: "settings_privacy", label: langText("Privacy", "Privacy") },
          { id: "settings_payment", label: langText("Pagamento", "Payment") },
          { id: "settings_notifications", label: langText("Notifiche", "Notifications") },
          { id: "settings_security", label: langText("Sicurezza", "Security") }
        ]
      },
      {
        title: langText("AIUTO / SUPPORTO / TRUST", "HELP / SUPPORT / TRUST"),
        entries: [
          { id: "help_help", label: langText("Aiuto", "Help") },
          { id: "help_listings", label: langText("Listings", "Listings") },
          { id: "help_verification", label: langText("Verification", "Verification") },
          { id: "help_shipping", label: langText("Spedizione e protezione", "Shipping and Protection") },
          { id: "help_accessibility", label: langText("Accessibilità", "Accessibility Statement") },
          { id: "help_contact", label: langText("Assistenza", "Contact Support") },
          { id: "help_about", label: langText("Chi siamo", "About") },
          { id: "help_sell", label: langText("Sell", "Sell") }
        ]
      }
    ];
  }

  function renderAccountSectionNav(activeSection) {
    return getAccountSectionGroups().map(function (group) {
      return `<div class="irisx-nav-group">
        <div class="irisx-nav-group-title">${escapeHtml(group.title)}</div>
        <div class="irisx-nav-group-list">${group.entries.map(function (entry) {
          return `<button class="irisx-section-tab${entry.id === activeSection ? " on" : ""}" onclick="setProfileArea('account','${entry.id}')">${escapeHtml(entry.label)}</button>`;
        }).join("")}</div>
      </div>`;
    }).join("");
  }

  function getOfferStateCopy(offer, scope, expired) {
    if (expired) {
      return langText("La finestra dell'offerta è chiusa e l'autorizzazione non è più utilizzabile.", "The offer window is closed and the authorization can no longer be used.");
    }
    if (scope === "seller" && offer.status === "pending") {
      return langText("Il buyer ha già confermato un'offerta vincolante con pre-autorizzazione. Se accetti, catturiamo il pagamento e generiamo l'ordine.", "The buyer already confirmed a binding offer with a pre-authorization. If you accept, we capture payment and create the order.");
    }
    if (scope === "buyer" && offer.status === "pending") {
      return langText("L'offerta è vincolante: non addebitiamo subito, ma teniamo pronta la pre-autorizzazione finché il seller non risponde.", "The offer is binding: we do not charge immediately, but the pre-authorization stays ready until the seller responds.");
    }
    if (offer.orderId) {
      return langText("L'offerta è collegata a un ordine già creato.", "This offer is already linked to a created order.");
    }
    if (offer.status === "declined") {
      return langText("Il seller ha rifiutato l'offerta e l'autorizzazione è stata rilasciata.", "The seller declined the offer and the authorization was released.");
    }
    return langText("Flusso offerta predisposto per autorizzazione, capture o rilascio.", "Offer flow prepared for authorization, capture, or release.");
  }

  function renderOffersMarkup(offers, scope) {
    syncOfferStates();
    if (!offers.length) {
      return `<div class="irisx-workspace-card">
        <div class="irisx-empty-state irisx-empty-state--expanded">
          <strong>${scope === "seller" ? langText("Nessuna offerta ricevuta.", "No offers received yet.") : langText("Nessuna offerta inviata.", "No offers sent yet.")}</strong>
          <span>${scope === "seller"
            ? langText("Quando un buyer invia un'offerta valida la troverai qui con importo, scadenza e stato della pre-autorizzazione.", "When a buyer sends a valid offer you'll see amount, expiry, and pre-authorization status here.")
            : langText("Le offerte vincolanti che invii compariranno qui finché il seller non accetta, rifiuta o la finestra non scade.", "The binding offers you send will appear here until the seller accepts, declines, or the time window expires.")}</span>
          <div class="irisx-actions"><button class="irisx-secondary" onclick="${scope === "seller" ? "setSellerSection('active')" : "showBuyView('shop')"}">${scope === "seller" ? langText("Apri annunci attivi", "Open active listings") : langText("Vai allo shop", "Go to shop")}</button></div>
        </div>
      </div>`;
    }
    return `<div class="irisx-order-list">${offers.map(function (offer) {
      const expired = offer.status === "expired" || isOfferExpired(offer);
      const sellerActions = scope === "seller" && offer.status === "pending" && !expired
        ? `<div class="irisx-actions">
            <button class="irisx-primary" onclick="respondToOffer('${offer.id}','accepted')">${langText("Accetta e completa vendita", "Accept and complete sale")}</button>
            <button class="irisx-secondary" onclick="respondToOffer('${offer.id}','declined')">${langText("Rifiuta", "Decline")}</button>
          </div>`
        : offer.orderId
          ? `<div class="irisx-actions"><button class="irisx-secondary" onclick="openOrderDetail('${offer.orderId}','${scope === "seller" ? "seller" : "buyer"}')">${langText("Apri ordine", "Open order")}</button></div>`
          : "";
      return `<div class="irisx-order-card">
        <div class="irisx-order-head">
          <strong>${escapeHtml(offer.productBrand)} ${escapeHtml(offer.productName)}</strong>
          <span class="irisx-badge">${escapeHtml(getOfferStatusLabel(offer))}</span>
        </div>
        <div class="irisx-order-items">
          <div>${escapeHtml(formatCurrency(offer.offerAmount || offer.amount))}</div>
          <div>${scope === "seller"
            ? `${langText("Acquirente", "Buyer")}: ${escapeHtml(offer.buyerName || offer.buyerEmail)}`
            : `${langText("Venditore", "Seller")}: ${escapeHtml(offer.sellerName || offer.sellerEmail)}`}</div>
          <div>${langText("Scade", "Expires")}: ${escapeHtml(formatDateTime(offer.expiresAt))}</div>
          <div>${langText("Autorizzazione", "Authorization")}: ${escapeHtml(getOfferAuthorizationLabel(offer))}</div>
          ${offer.minimumOfferAmount !== null && offer.minimumOfferAmount !== undefined ? `<div>${langText("Minimo seller", "Seller minimum")}: ${escapeHtml(formatCurrency(offer.minimumOfferAmount))}</div>` : ""}
          <div>${expired ? langText("Offerta scaduta", "Offer expired") : langText("Creata", "Created")}: ${escapeHtml(formatDateTime(expired ? offer.expiresAt : offer.createdAt))}</div>
        </div>
        <div class="irisx-note">${escapeHtml(getOfferStateCopy(offer, scope, expired))}</div>
        ${sellerActions}
      </div>`;
    }).join("")}</div>`;
  }

  function renderNotificationsCenter() {
    const items = getVisibleNotifications();
    if (!items.length) {
      return `<div class="irisx-empty-state">${langText("Nessuna notifica disponibile.", "No notifications available.")}</div>`;
    }
    return `<div class="irisx-order-list">${items.map(function (notification) {
      return `<button class="irisx-notification-item${notification.unread ? " unread" : ""}" onclick="readNotif('${notification.id}', true)">
        <strong>${escapeHtml(notification.title)}</strong>
        <span>${escapeHtml(notification.body)}</span>
        <em>${escapeHtml(formatRelativeTime(notification.createdAt))}</em>
      </button>`;
    }).join("")}</div>`;
  }

  function renderAccountArea(user, orders, sellerOrders, tickets, favoritesItems) {
    const section = resolveAccountSectionId(state.profileSection || "overview");
    const unreadNotifications = getVisibleNotifications().filter(function (notification) { return notification.unread; }).length;
    const seller = getCurrentUserSeller();
    const reviewsReceived = seller ? state.reviews.filter(function (review) { return review.sellerId === seller.id; }) : [];
    const savedSearches = user.savedSearches || [];
    const buyingThreads = getChatThreadsForScope("buying");
    const sellingThreads = getChatThreadsForScope("selling");

    if (section === "shopping_preferences") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Preferenze acquisti", "Shopping preferences")}</h3><span>${langText("Preferenze di acquisto, alert e visibilità del catalogo.", "Buying preferences, alerts, and catalog visibility.")}</span></div>
        <div class="irisx-form-grid">
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="shoppingCurrency">${langText("Valuta preferita", "Preferred currency")}</label><input id="shoppingCurrency" type="text" value="${escapeHtml(user.shoppingPreferences.preferredCurrency || getLocaleConfig().currency)}"></div>
            <div class="irisx-field"><label>${langText("Visibilità", "Visibility")}</label><div class="irisx-static-field">${user.shoppingPreferences.authenticatedOnly ? langText("Solo articoli autenticati", "Authenticated items only") : langText("Tutto il catalogo", "Full catalog")}</div></div>
          </div>
          <div class="irisx-toggle-grid">
            <label><input id="shoppingAuthenticatedOnly" type="checkbox" ${user.shoppingPreferences.authenticatedOnly ? "checked" : ""}> ${langText("Mostra solo articoli autenticati", "Show authenticated items only")}</label>
            <label><input id="shoppingSizeAlerts" type="checkbox" ${user.shoppingPreferences.sizeAlerts ? "checked" : ""}> ${langText("Alert nuovi arrivi nella mia taglia", "Alerts for new arrivals in my size")}</label>
            <label><input id="shoppingOfferAlerts" type="checkbox" ${user.shoppingPreferences.offerAlerts ? "checked" : ""}> ${langText("Alert per offerte e price drops", "Alerts for offers and price drops")}</label>
            <label><input id="shoppingSearchAlerts" type="checkbox" ${user.shoppingPreferences.savedSearchAlerts ? "checked" : ""}> ${langText("Notifiche per ricerche salvate", "Notifications for saved searches")}</label>
          </div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="saveShoppingPreferences()">${langText("Salva preferenze", "Save preferences")}</button></div>
        </div>
      </div>`;
    }

    if (section === "shopping_sizes") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Le mie taglie", "My Size")}</h3><span>${langText("Profilo taglie e brand preferiti per buyer e app futura.", "Sizing profile and preferred brands for buyer web and future app.")}</span></div>
        <div class="irisx-form-grid">
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="sizeProfileTops">${langText("Tops", "Tops")}</label><input id="sizeProfileTops" type="text" value="${escapeHtml(user.sizeProfile.tops || "")}"></div>
            <div class="irisx-field"><label for="sizeProfileBottoms">${langText("Bottoms", "Bottoms")}</label><input id="sizeProfileBottoms" type="text" value="${escapeHtml(user.sizeProfile.bottoms || "")}"></div>
          </div>
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="sizeProfileShoes">${langText("Scarpe", "Shoes")}</label><input id="sizeProfileShoes" type="text" value="${escapeHtml(user.sizeProfile.shoes || "")}"></div>
            <div class="irisx-field"><label for="sizeProfileFit">${langText("Vestibilità preferita", "Preferred fit")}</label><input id="sizeProfileFit" type="text" value="${escapeHtml(user.sizeProfile.fit || "")}"></div>
          </div>
          <div class="irisx-field"><label for="sizeProfileBrands">${langText("Brand preferiti", "Preferred brands")}</label><input id="sizeProfileBrands" type="text" value="${escapeHtml(user.sizeProfile.preferredBrands || "")}" placeholder="${langText("Chanel, Prada, Loewe", "Chanel, Prada, Loewe")}"></div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="saveSizeProfile()">${langText("Salva profilo taglie", "Save My Size")}</button></div>
        </div>
      </div>`;
    }

    if (section === "shopping_saved_searches") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Ricerche salvate", "Saved searches")}</h3><span>${langText("Ricerche salvate e alert mock riusabili anche nell'app.", "Saved searches and alert-ready mock logic reusable in the app.")}</span></div>
        ${savedSearches.length ? `<div class="irisx-card-stack">${savedSearches.map(function (entry) {
          return `<div class="irisx-inline-card">
            <div><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.query)} · ${escapeHtml(entry.filtersSummary || "")}</span></div>
            <div class="irisx-actions"><span class="irisx-badge">${entry.alertsEnabled ? langText("Alert on", "Alerts on") : langText("Alert off", "Alerts off")}</span><button class="irisx-danger" onclick="removeSavedSearch('${entry.id}')">${langText("Rimuovi", "Remove")}</button></div>
          </div>`;
        }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna ricerca salvata. Aggiungi la prima per avere alert e scorciatoie buyer.", "No saved searches yet. Add one to enable alerts and buyer shortcuts.")}</div>`}
        <div class="irisx-form-grid">
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="savedSearchLabel">${langText("Nome", "Name")}</label><input id="savedSearchLabel" type="text" placeholder="${langText("Borse nere", "Black bags")}"></div>
            <div class="irisx-field"><label for="savedSearchQuery">${langText("Ricerca", "Query")}</label><input id="savedSearchQuery" type="text" placeholder="${langText("Chanel bag 42", "Chanel bag 42")}"></div>
          </div>
          <div class="irisx-field"><label for="savedSearchFilters">${langText("Riepilogo filtri", "Filters summary")}</label><input id="savedSearchFilters" type="text" placeholder="${langText("Brand, taglia, tetto prezzo", "Brand, size, price ceiling")}"></div>
          <div class="irisx-toggle-grid"><label><input id="savedSearchAlertsToggle" type="checkbox" checked> ${langText("Attiva alert", "Enable alerts")}</label></div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="addSavedSearch()">${langText("Salva ricerca", "Save search")}</button></div>
        </div>
      </div>`;
    }

    if (section === "selling_preferences") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Preferenze vendita", "Selling preferences")}</h3><span>${langText("Regole operative seller per messaggi, offerte e gestione inventario.", "Seller operating rules for messaging, offers, and inventory handling.")}</span></div>
        <div class="irisx-form-grid">
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="sellingHandlingModel">${langText("Modello operativo", "Handling model")}</label><input id="sellingHandlingModel" type="text" value="${escapeHtml(user.sellingPreferences.handlingModel || "")}"></div>
            <div class="irisx-field"><label for="sellingOfferStrategy">${langText("Strategia offerte", "Offer strategy")}</label><input id="sellingOfferStrategy" type="text" value="${escapeHtml(user.sellingPreferences.offerStrategy || "")}"></div>
          </div>
          <div class="irisx-toggle-grid">
            <label><input id="sellingAutoMessages" type="checkbox" ${user.sellingPreferences.autoMessages ? "checked" : ""}> ${langText("Risposte rapide seller abilitate", "Seller quick replies enabled")}</label>
          </div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="saveSellingWorkspace()">${langText("Salva preferenze seller", "Save seller preferences")}</button></div>
        </div>
      </div>`;
    }

    if (section === "selling_location") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Posizione vendita", "Selling location")}</h3><span>${langText("Origine spedizioni e visibilità area seller.", "Shipping origin and seller-facing location visibility.")}</span></div>
        <div class="irisx-form-grid">
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="sellingLocationCity">${langText("Città", "City")}</label><input id="sellingLocationCity" type="text" value="${escapeHtml(user.sellingPreferences.shipFromCity || "")}"></div>
            <div class="irisx-field"><label for="sellingLocationCountry">${langText("Paese", "Country")}</label><input id="sellingLocationCountry" type="text" value="${escapeHtml(user.sellingPreferences.shipFromCountry || "")}"></div>
          </div>
          <div class="irisx-toggle-grid"><label><input id="sellingPublicLocation" type="checkbox" ${user.sellingPreferences.publicLocation ? "checked" : ""}> ${langText("Mostra location seller nel listing", "Show seller location on listings")}</label></div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="saveSellingWorkspace()">${langText("Salva posizione", "Save location")}</button></div>
        </div>
      </div>`;
    }

    if (section === "selling_vacation") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Modalità vacanza", "Vacation mode")}</h3><span>${langText("Stato seller, data di ritorno e messaggio operativo.", "Seller status, return date, and operational message.")}</span></div>
        <div class="irisx-toggle-grid">
          <label><input id="sellingVacationEnabled" type="checkbox" ${user.vacationMode.enabled ? "checked" : ""}> ${langText("Attiva modalità vacanza", "Enable vacation mode")}</label>
        </div>
        <div class="irisx-form-grid">
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="sellingVacationReturnDate">${langText("Data rientro", "Return date")}</label><input id="sellingVacationReturnDate" type="date" value="${escapeHtml(user.vacationMode.returnDate || "")}"></div>
            <div class="irisx-field"><label>${langText("Stato", "Status")}</label><div class="irisx-static-field">${user.vacationMode.enabled ? langText("Pausa attiva", "Pause enabled") : langText("Operativo", "Active")}</div></div>
          </div>
          <div class="irisx-field"><label for="sellingVacationNote">${langText("Messaggio per il buyer", "Buyer message")}</label><textarea id="sellingVacationNote">${escapeHtml(user.vacationMode.note || "")}</textarea></div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="saveSellingWorkspace()">${langText("Salva modalità vacanza", "Save vacation mode")}</button></div>
        </div>
      </div>`;
    }

    if (section === "selling_listing_preferences") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Preferenze annunci", "Listing preferences")}</h3><span>${langText("Default seller per nuove inserzioni e future bulk actions.", "Seller defaults for new listings and future bulk actions.")}</span></div>
        <div class="irisx-form-grid">
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="sellingDefaultCondition">${langText("Condizione predefinita", "Default condition")}</label><input id="sellingDefaultCondition" type="text" value="${escapeHtml(user.listingPreferences.defaultCondition || "")}"></div>
            <div class="irisx-field"><label for="sellingProcessingDays">${langText("Giorni di lavorazione", "Processing days")}</label><input id="sellingProcessingDays" type="text" value="${escapeHtml(user.listingPreferences.defaultProcessingDays || "")}"></div>
          </div>
          <div class="irisx-field"><label for="sellingShippingMethod">${langText("Metodo di spedizione predefinito", "Default shipping method")}</label><input id="sellingShippingMethod" type="text" value="${escapeHtml(user.listingPreferences.defaultShippingMethod || "")}"></div>
          <div class="irisx-toggle-grid"><label><input id="sellingOffersDefault" type="checkbox" ${user.listingPreferences.offersDefault ? "checked" : ""}> ${langText("Accetta offerte di default", "Enable offers by default")}</label></div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="saveSellingWorkspace()">${langText("Salva preferenze annunci", "Save listing defaults")}</button></div>
        </div>
      </div>`;
    }

    if (section === "settings_account") {
      return `<div class="irisx-card-stack">
        <div class="irisx-workspace-card">
          <div class="irisx-section-head"><h3>${langText("Account", "Account")}</h3><span>${langText("Email, telefono, membership e rubrica indirizzi buyer.", "Email, phone number, membership, and buyer address book.")}</span></div>
          <div class="irisx-summary-grid">
            <div class="irisx-summary-card"><strong>${escapeHtml(user.email || "")}</strong><span>${langText("Email account", "Account email")}</span></div>
            <div class="irisx-summary-card"><strong>${escapeHtml(user.phone || langText("Da aggiungere", "Add phone"))}</strong><span>${langText("Telefono obbligatorio", "Required phone number")}</span></div>
            <div class="irisx-summary-card"><strong>${user.verification.emailVerified ? langText("Verificata", "Verified") : langText("Da verificare", "Verify now")}</strong><span>${langText("Stato email", "Email status")}</span></div>
            <div class="irisx-summary-card"><strong>${user.verification.phoneVerified ? langText("Verificato", "Verified") : langText("Da verificare", "Verify now")}</strong><span>${langText("Stato telefono", "Phone status")}</span></div>
            <div class="irisx-summary-card"><strong>${escapeHtml(user.memberSince || "2026")}</strong><span>${langText("Membro dal", "Member since")}</span></div>
            <div class="irisx-summary-card"><strong>${user.addresses.length}</strong><span>${langText("Indirizzi salvati", "Saved addresses")}</span></div>
            <div class="irisx-summary-card"><strong>${user.security.twoFactor ? "2FA on" : "2FA off"}</strong><span>${langText("Livello sicurezza", "Security baseline")}</span></div>
          </div>
        </div>
        <div class="irisx-workspace-card">
          <div class="irisx-section-head"><h3>${langText("Indirizzi", "Addresses")}</h3><span>${langText("Rubrica indirizzi di spedizione dell'acquirente.", "Buyer shipping address book.")}</span></div>
          <div class="irisx-card-stack">${user.addresses.map(function (address) {
            return `<div class="irisx-inline-card">
              <div><strong>${escapeHtml(address.label)}</strong><span>${escapeHtml(address.name || user.name || "")} · ${escapeHtml(address.address || "")}, ${escapeHtml(address.city || "")}, ${escapeHtml(address.country || "")}</span></div>
              <div class="irisx-actions">${address.isDefault ? `<span class="irisx-badge">${langText("Default", "Default")}</span>` : `<button class="irisx-secondary" onclick="setDefaultAddress('${address.id}')">${langText("Imposta default", "Set default")}</button>`}</div>
            </div>`;
          }).join("")}</div>
          <div class="irisx-form-grid">
            <div class="irisx-account-row">
              <div class="irisx-field"><label for="accountAddressLabel">${langText("Etichetta", "Label")}</label><input id="accountAddressLabel" type="text" placeholder="${langText("Casa", "Home")}"></div>
              <div class="irisx-field"><label for="accountAddressName">${langText("Destinatario", "Recipient")}</label><input id="accountAddressName" type="text" value="${escapeHtml(user.name || "")}"></div>
            </div>
            <div class="irisx-field"><label for="accountAddressLine">${langText("Indirizzo", "Address line")}</label><input id="accountAddressLine" type="text"></div>
            <div class="irisx-account-row">
              <div class="irisx-field"><label for="accountAddressCity">${langText("Città", "City")}</label><input id="accountAddressCity" type="text"></div>
              <div class="irisx-field"><label for="accountAddressCountry">${langText("Paese", "Country")}</label><input id="accountAddressCountry" type="text" value="${escapeHtml(user.country || getWorkspaceDefaultCountry())}"></div>
            </div>
            <div class="irisx-actions"><button class="irisx-primary" onclick="saveAddressBook()">${langText("Salva indirizzo", "Save address")}</button></div>
          </div>
        </div>
      </div>`;
    }

    if (section === "settings_profile") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Impostazioni profilo", "Profile settings")}</h3><span>${langText("Aggiorna nome, bio e localita'.", "Update name, bio, and location.")}</span></div>
        <div class="irisx-form-grid">
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="profileNameInput">${t("full_name")}</label><input id="profileNameInput" type="text" value="${escapeHtml(user.name || "")}"></div>
            <div class="irisx-field"><label for="profileAvatarInput">${langText("Avatar", "Avatar")}</label><input id="profileAvatarInput" type="text" value="${escapeHtml(user.avatar || "👤")}"></div>
          </div>
          <div class="irisx-account-row">
            <div class="irisx-field"><label for="profilePhoneInput">${langText("Telefono", "Phone number")}</label><input id="profilePhoneInput" type="tel" inputmode="tel" value="${escapeHtml(user.phone || "")}" placeholder="${langText("+39 333 123 4567", "+39 333 123 4567")}"></div>
            <div class="irisx-field"><label for="profileCityInput">${t("profile_city")}</label><input id="profileCityInput" type="text" value="${escapeHtml(user.city || "")}"></div>
            <div class="irisx-field"><label for="profileCountryInput">${t("profile_country")}</label><input id="profileCountryInput" type="text" value="${escapeHtml(user.country || "")}"></div>
          </div>
          <div class="irisx-field"><label for="profileBioInput">${t("profile_bio")}</label><textarea id="profileBioInput">${escapeHtml(user.bio || "")}</textarea></div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="saveAccountSettings()">${t("save_profile")}</button></div>
        </div>
      </div>`;
    }

    if (section === "settings_privacy") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Privacy", "Privacy")}</h3><span>${langText("Controlli placeholder per visibilità, messaggi e personalizzazione.", "Placeholder controls for visibility, messaging, and personalization.")}</span></div>
        <div class="irisx-form-grid">
          <div class="irisx-field"><label for="privacyVisibility">${langText("Visibilità profilo", "Profile visibility")}</label><input id="privacyVisibility" type="text" value="${escapeHtml(user.privacySettings.profileVisibility || "")}"></div>
          <div class="irisx-toggle-grid">
            <label><input id="privacyActivityStatus" type="checkbox" ${user.privacySettings.showActivityStatus ? "checked" : ""}> ${langText("Mostra stato attività", "Show activity status")}</label>
            <label><input id="privacyMessageRequests" type="checkbox" ${user.privacySettings.allowMessageRequests ? "checked" : ""}> ${langText("Consenti richieste messaggi", "Allow message requests")}</label>
            <label><input id="privacyPersonalized" type="checkbox" ${user.privacySettings.personalizedRecommendations ? "checked" : ""}> ${langText("Suggerimenti personalizzati", "Personalized recommendations")}</label>
          </div>
          <div class="irisx-actions"><button class="irisx-primary" onclick="savePrivacyWorkspace()">${langText("Salva privacy", "Save privacy")}</button></div>
        </div>
      </div>`;
    }

    if (section === "settings_payment") {
      return `<div class="irisx-card-stack">
        <div class="irisx-workspace-card">
          <div class="irisx-section-head"><h3>${langText("Metodi di pagamento", "Payment methods")}</h3><span>${langText("Scheletro per carte e metodi futuri.", "Skeleton for cards and future methods.")}</span></div>
          ${user.paymentMethods.length ? `<div class="irisx-card-stack">${user.paymentMethods.map(function (method) {
            return `<div class="irisx-inline-card"><div><strong>${escapeHtml(method.brand)} •••• ${escapeHtml(method.last4)}</strong><span>${escapeHtml(method.label || "")}</span></div>${method.isDefault ? `<span class="irisx-badge">${langText("Default", "Default")}</span>` : ""}</div>`;
          }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun metodo salvato.", "No saved payment methods.")}</div>`}
          <div class="irisx-actions"><button class="irisx-primary" onclick="addPrototypePaymentMethod()">${langText("Aggiungi metodo mock", "Add mock method")}</button></div>
        </div>
        <div class="irisx-workspace-card">
          <div class="irisx-section-head"><h3>${langText("Impostazioni pagamento", "Payout settings")}</h3><span>${langText("Dettagli payout venditore predisposti nel profilo.", "Seller payout details prepared inside the profile.")}</span></div>
          <div class="irisx-form-grid">
            <div class="irisx-account-row">
              <div class="irisx-field"><label for="payoutMethod">${langText("Metodo", "Method")}</label><input id="payoutMethod" type="text" value="${escapeHtml(user.payoutSettings.method || "bank_transfer")}"></div>
              <div class="irisx-field"><label for="payoutCadence">${langText("Cadence", "Cadence")}</label><input id="payoutCadence" type="text" value="${escapeHtml(user.payoutSettings.cadence || "")}"></div>
            </div>
            <div class="irisx-account-row">
              <div class="irisx-field"><label for="payoutHolder">${langText("Intestatario conto", "Account holder")}</label><input id="payoutHolder" type="text" value="${escapeHtml(user.payoutSettings.accountHolder || user.name || "")}"></div>
              <div class="irisx-field"><label for="payoutPaypal">${langText("PayPal email", "PayPal email")}</label><input id="payoutPaypal" type="text" value="${escapeHtml(user.payoutSettings.paypalEmail || user.email || "")}"></div>
            </div>
            <div class="irisx-field"><label for="payoutIban">IBAN</label><input id="payoutIban" type="text" value="${escapeHtml(user.payoutSettings.iban || "")}"></div>
            <div class="irisx-actions"><button class="irisx-primary" onclick="savePayoutWorkspace()">${langText("Salva payout", "Save payout")}</button></div>
          </div>
        </div>
      </div>`;
    }

    if (section === "settings_notifications") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Notifiche", "Notifications")}</h3><span>${langText("Badge, notifiche in-app e preferenze mock.", "Badges, in-app notifications, and mock preferences.")}</span></div>
        <div class="irisx-toggle-grid">
          <label><input id="notifPrefOrders" type="checkbox" ${user.notificationSettings.orders ? "checked" : ""}> ${langText("Ordini", "Orders")}</label>
          <label><input id="notifPrefMessages" type="checkbox" ${user.notificationSettings.messages ? "checked" : ""}> ${langText("Messaggi", "Messages")}</label>
          <label><input id="notifPrefOffers" type="checkbox" ${user.notificationSettings.offers ? "checked" : ""}> ${langText("Offerte", "Offers")}</label>
          <label><input id="notifPrefPayouts" type="checkbox" ${user.notificationSettings.payouts ? "checked" : ""}> ${langText("Payout", "Payouts")}</label>
          <label><input id="notifPrefAdmin" type="checkbox" ${user.notificationSettings.admin ? "checked" : ""}> ${langText("Avvisi admin", "Admin notices")}</label>
        </div>
        <div class="irisx-actions"><button class="irisx-primary" onclick="saveNotificationPreferences()">${langText("Salva preferenze", "Save preferences")}</button><button class="irisx-secondary" onclick="markAllRead()">${langText("Segna tutto letto", "Mark all read")}</button></div>
        ${renderNotificationsCenter()}
      </div>`;
    }

    if (section === "settings_security") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Sicurezza", "Security")}</h3><span>${langText("2FA, login alerts e sessioni attive mock.", "2FA, login alerts, and mock active sessions.")}</span></div>
        <div class="irisx-toggle-grid">
          <label><input id="securityTwoFactor" type="checkbox" ${user.security.twoFactor ? "checked" : ""}> ${langText("Two-factor authentication", "Two-factor authentication")}</label>
          <label><input id="securityLoginAlerts" type="checkbox" ${user.security.loginAlerts ? "checked" : ""}> ${langText("Login alerts", "Login alerts")}</label>
        </div>
        <div class="irisx-card-stack">${user.security.activeSessions.map(function (session) {
          return `<div class="irisx-inline-card"><div><strong>${escapeHtml(session.device)}</strong><span>${escapeHtml(session.location)} · ${escapeHtml(formatRelativeTime(session.lastSeen))}</span></div>${session.current ? `<span class="irisx-badge">${langText("Current", "Current")}</span>` : ""}</div>`;
        }).join("")}</div>
        <div class="irisx-actions"><button class="irisx-primary" onclick="saveSecurityWorkspace()">${langText("Salva sicurezza", "Save security")}</button></div>
      </div>`;
    }

    if (section === "help_help") {
      return `<div class="irisx-policy-grid">
        <button class="irisx-policy-card" onclick="setProfileArea('account','help_listings')"><strong>${langText("Guida annunci", "Listings help")}</strong><span>${langText("Regole seller, bozze e pubblicazione.", "Seller rules, drafts, and publishing.")}</span></button>
        <button class="irisx-policy-card" onclick="setProfileArea('account','help_verification')"><strong>${langText("Verifica identità", "Verification")}</strong><span>${langText("Trust, protection e autenticazione.", "Trust, protection, and authentication.")}</span></button>
        <button class="irisx-policy-card" onclick="setProfileArea('account','help_shipping')"><strong>${langText("Spedizione e protezione", "Shipping and protection")}</strong><span>${langText("Policy, refund e tracking flow.", "Policies, refund, and tracking flow.")}</span></button>
        <button class="irisx-policy-card" onclick="setProfileArea('account','help_contact')"><strong>${langText("Contatta il supporto", "Contact support")}</strong><span>${langText("Ticket, issue reporting e support queue.", "Tickets, issue reporting, and support queue.")}</span></button>
      </div>`;
    }

    if (section === "help_listings") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("I tuoi annunci", "Listings")}</h3><span>${langText("Guida seller per creare, salvare bozza e pubblicare annunci.", "Seller guide for drafting and publishing listings.")}</span></div>
        <div class="irisx-card-stack">
          <div class="irisx-inline-card"><div><strong>${langText("Flusso bozze", "Draft flow")}</strong><span>${langText("Salva bozza, rientra nell'editor e pubblica quando l'annuncio è pronto.", "Save drafts, reopen the editor, and publish when the listing is ready.")}</span></div><button class="irisx-secondary" onclick="setProfileArea('seller','drafts')">${langText("Apri bozze", "Open drafts")}</button></div>
          <div class="irisx-inline-card"><div><strong>${langText("Annunci live", "Live listings")}</strong><span>${langText("Controlla annunci attivi, offerte abilitate e archivio.", "Check active listings, offer settings, and archive.")}</span></div><button class="irisx-secondary" onclick="setProfileArea('seller','active')">${langText("Apri attivi", "Open active")}</button></div>
        </div>
      </div>`;
    }

    if (section === "help_verification") {
      return `<div class="irisx-policy-grid">
        <button class="irisx-policy-card" onclick="openStatic('trust-authentication')"><strong>${langText("Trust / Authentication", "Trust / Authentication")}</strong><span>${langText("Flusso autenticazione e trust block prodotto.", "Authentication flow and product trust block.")}</span></button>
        <button class="irisx-policy-card" onclick="openStatic('buyer-protection')"><strong>${langText("Protezione acquirente", "Buyer Protection")}</strong><span>${langText("Supporto, timeline e protezione buyer.", "Support, timeline, and buyer protection.")}</span></button>
        <button class="irisx-policy-card" onclick="openStatic('seller-protection')"><strong>${langText("Seller Protection", "Seller Protection")}</strong><span>${langText("Payout, queue operativa e seller safeguards.", "Payout, operational queue, and seller safeguards.")}</span></button>
      </div>`;
    }

    if (section === "help_shipping") {
      return `<div class="irisx-policy-grid">
        <button class="irisx-policy-card" onclick="openStatic('shipping-policy')"><strong>${langText("Policy spedizioni", "Shipping Policy")}</strong><span>${langText("Metodi, tracking e queue spedizioni.", "Methods, tracking, and shipping queue.")}</span></button>
        <button class="irisx-policy-card" onclick="openStatic('refund-policy')"><strong>${langText("Policy resi / rimborsi", "Refund / Return Policy")}</strong><span>${langText("Refund states, dispute e support path.", "Refund states, disputes, and support path.")}</span></button>
        <button class="irisx-policy-card" onclick="setProfileArea('seller','shipping')"><strong>${langText("Coda spedizioni venditore", "Seller shipping queue")}</strong><span>${langText("Apri gli ordini da spedire e tracking placeholder.", "Open seller orders awaiting shipment and placeholder tracking.")}</span></button>
      </div>`;
    }

    if (section === "help_accessibility") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Accessibilità", "Accessibility Statement")}</h3><span>${langText("Impegni di struttura e supporto del prototipo.", "Prototype structure and support commitments.")}</span></div>
        <div class="irisx-card-stack">
          <div class="irisx-inline-card"><div><strong>${langText("Base responsive", "Responsive baseline")}</strong><span>${langText("Layout account e messaging adattati a desktop e mobile.", "Account and messaging layouts are adapted for desktop and mobile.")}</span></div></div>
          <div class="irisx-inline-card"><div><strong>${langText("Percorso di supporto assistivo", "Assistive support path")}</strong><span>${langText("Per richieste specifiche usa Contact Support o apri il documento dedicato.", "Use Contact Support or open the dedicated statement for specific needs.")}</span></div><button class="irisx-secondary" onclick="openStatic('accessibility-statement')">${langText("Apri documento", "Open statement")}</button></div>
        </div>
      </div>`;
    }

    if (section === "help_contact") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Assistenza", "Contact Support")}</h3><span>${langText("Ticket, dispute e issue reporting.", "Tickets, disputes, and issue reporting.")}</span></div>
        <div class="irisx-card-stack">
          <div class="irisx-inline-card"><div><strong>${PLATFORM_CONFIG.supportEmail}</strong><span>${langText("Inbox support proprietario / team.", "Owner / team support inbox.")}</span></div></div>
        </div>
        ${renderSupportTicketsMarkup(tickets)}
        ${orders.length ? `<div class="irisx-actions"><button class="irisx-primary" onclick="openSupportModal('${orders[0].id}')">${langText("Apri ticket sull'ultimo ordine", "Open ticket on latest order")}</button></div>` : ""}
      </div>`;
    }

    if (section === "help_about") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Chi siamo", "About")}</h3><span>${langText("Contesto del marketplace, fiducia e linee guida community.", "Marketplace context, trust, and community guidelines.")}</span></div>
        <div class="irisx-card-stack">
          <div class="irisx-inline-card"><div><strong>IRIS</strong><span>${langText("Marketplace prototype strutturato per buyer, seller e owner.", "Structured marketplace prototype for buyers, sellers, and owner.")}</span></div><button class="irisx-secondary" onclick="openStatic('about')">${langText("Apri about", "Open about")}</button></div>
          <div class="irisx-inline-card"><div><strong>${langText("Linee guida community", "Community Guidelines")}</strong><span>${langText("Regole di comportamento e moderazione.", "Conduct and moderation rules.")}</span></div><button class="irisx-secondary" onclick="openStatic('community-guidelines')">${langText("Apri", "Open")}</button></div>
        </div>
      </div>`;
    }

    if (section === "help_sell") {
      return `<div class="irisx-workspace-card">
        <div class="irisx-section-head"><h3>${langText("Vendi", "Sell")}</h3><span>${langText("Onboarding seller, fee coerenti e scorciatoie operative.", "Seller onboarding, coherent fees, and operational shortcuts.")}</span></div>
        <div class="irisx-card-stack">
          <div class="irisx-inline-card"><div><strong>${langText("Crea un annuncio", "Create a listing")}</strong><span>${langText("Apri il form seller mantenendo fee e offer settings coerenti.", "Open the seller form while keeping fee and offer settings coherent.")}</span></div><button class="irisx-primary" onclick="showPage('sell')">${langText("Vai a Vendi", "Go to Sell")}</button></div>
          <div class="irisx-inline-card"><div><strong>${langText("Dashboard venditore", "Seller dashboard")}</strong><span>${langText("Gestisci shipping queue, offerte ricevute e cronologia vendite.", "Manage shipping queue, incoming offers, and sales history.")}</span></div><button class="irisx-secondary" onclick="setProfileArea('seller','dashboard')">${langText("Apri dashboard", "Open dashboard")}</button></div>
        </div>
      </div>`;
    }

    return `<div class="irisx-overview-shell">
      <div class="irisx-overview-grid">
        <section class="irisx-workspace-card">
          <div class="irisx-section-head">
            <h3>${langText("Configurazione account", "Account setup")}</h3>
            <span>${langText("Le cose essenziali da completare o controllare.", "The essential things to complete or check.")}</span>
          </div>
          <div class="irisx-card-stack">
            <div class="irisx-inline-card"><div><strong>${langText("Metodo di pagamento", "Payment method")}</strong><span>${user.paymentMethods.find(function (method) { return method.isDefault; }) ? langText("Predefinito già impostato", "Default already set") : langText("Aggiungi una carta predefinita", "Add a default card")}</span></div><button class="irisx-secondary" onclick="setProfileArea('account','settings_payment')">${langText("Apri", "Open")}</button></div>
            <div class="irisx-inline-card"><div><strong>${langText("Indirizzo di spedizione", "Shipping address")}</strong><span>${user.addresses.find(function (address) { return address.isDefault; }) ? langText("Predefinito attivo", "Default active") : langText("Imposta un indirizzo principale", "Set a main address")}</span></div><button class="irisx-secondary" onclick="setProfileArea('account','settings_account')">${langText("Apri", "Open")}</button></div>
            <div class="irisx-inline-card"><div><strong>${langText("Pagamento venditore", "Seller payout")}</strong><span>${escapeHtml(user.payoutSettings.status || langText("Da configurare", "Setup needed"))}</span></div><button class="irisx-secondary" onclick="setProfileArea('account','settings_payment')">${langText("Apri", "Open")}</button></div>
          </div>
        </section>
        <section class="irisx-workspace-card">
          <div class="irisx-section-head">
            <h3>${langText("Attività e comunicazione", "Activity and communication")}</h3>
            <span>${langText("Le aree dove torni più spesso durante la giornata.", "The areas you return to most during the day.")}</span>
          </div>
          <div class="irisx-card-stack">
            <div class="irisx-inline-card"><div><strong>${langText("Chat compro", "Buying chat")}</strong><span>${getWorkspaceChatSummary("buying", buyingThreads)}</span></div><button class="irisx-secondary" onclick="openMessagingInbox('buying')">${langText("Apri", "Open")}</button></div>
            <div class="irisx-inline-card"><div><strong>${langText("Chat vendo", "Selling chat")}</strong><span>${getWorkspaceChatSummary("selling", sellingThreads)}</span></div><button class="irisx-secondary" onclick="openMessagingInbox('selling')">${langText("Apri", "Open")}</button></div>
            <div class="irisx-inline-card"><div><strong>${langText("Supporto e notifiche", "Support and notifications")}</strong><span>${getWorkspaceSupportSummary(tickets.length, unreadNotifications)}</span></div><button class="irisx-secondary" onclick="setProfileArea('account','settings_notifications')">${langText("Apri", "Open")}</button></div>
          </div>
        </section>
      </div>
    </div>`;
  }

  function renderBuyerArea(orders, favoritesItems, tickets) {
    const section = state.buyerSection || "orders";
    const selectedOrder = getSelectedOrder("buyer");
    if (section === "order_detail") {
      return renderOrderSummaryCard(selectedOrder, "buyer");
    }
    if (section === "tracking") {
      return renderOrderTrackingPanel(selectedOrder);
    }
    if (section === "offers") {
      return renderOffersMarkup(getBuyerOffers(), "buyer");
    }
    if (section === "wishlist") {
      return favoritesItems.length ? `<div class="irisx-favorites-grid">${favoritesItems.map(function (item) { return productCardMarkup(item); }).join("")}</div>` : `<div class="irisx-empty-state">${t("no_favorites_yet")}</div>`;
    }
    if (section === "messages") {
      return renderMessagingWorkspaceCard("buying");
    }
    if (section === "history") {
      const history = orders.filter(function (order) {
        return ["completed", "cancelled", "refunded", "delivered"].includes(order.status);
      });
      return renderBuyerOrdersMarkup(history);
    }
    if (section === "reviews") {
      const reviewable = orders.filter(function (order) {
        return ["delivered", "completed"].includes(order.status);
      });
      return reviewable.length ? `<div class="irisx-card-stack">${reviewable.map(function (order) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(order.number)}</strong><span>${escapeHtml(order.items.map(function (item) { return item.brand + " " + item.name; }).join(", "))}</span></div>${order.reviewStatus === "submitted" ? `<span class="irisx-badge">${langText("Review inviata", "Review sent")}</span>` : `<button class="irisx-secondary" onclick="openReviewModal('${order.id}')">${langText("Recensisci", "Review")}</button>`}</div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna review disponibile.", "No reviews available.")}</div>`;
    }
    if (section === "support") {
      return `<div class="irisx-workspace-card">${renderSupportTicketsMarkup(tickets)}${selectedOrder ? `<div class="irisx-actions"><button class="irisx-primary" onclick="openSupportModal('${selectedOrder.id}')">${langText("Apri supporto per ordine attivo", "Open support for active order")}</button></div>` : ""}</div>`;
    }
    return renderBuyerOrdersMarkup(orders);
  }

  function renderSellerArea(listings, sellerOrders) {
    const section = state.sellerSection || "dashboard";
    const published = listings.filter(function (listing) { return listing.listingStatus === "published" && listing.inventoryStatus === "active"; });
    const drafts = listings.filter(function (listing) { return listing.listingStatus === "draft" || listing.inventoryStatus === "draft"; });
    const sold = listings.filter(function (listing) { return listing.inventoryStatus === "sold" || listing.listingStatus === "sold"; });
    const sellerOffers = getSellerOffers();
    const sellingConversations = getChatThreadsForScope("selling");
    if (section === "active") {
      return published.length ? `<div class="irisx-card-stack">${published.map(function (listing) {
        const offerLabel = listing.offersEnabled !== false
          ? `${langText("Offerte attive", "Offers active")}${listing.minimumOfferAmount ? ` · ${langText("min", "min")} ${escapeHtml(formatCurrency(listing.minimumOfferAmount))}` : ""}`
          : langText("Offerte disattivate", "Offers disabled");
        const toggleLabel = listing.offersEnabled !== false
          ? langText("Disattiva offerte", "Disable offers")
          : langText("Attiva offerte", "Enable offers");
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(listing.brand)} ${escapeHtml(listing.name)}</strong><span>${escapeHtml(formatCurrency(listing.price || 0))} · ${offerLabel}</span></div><div class="irisx-actions"><button class="irisx-secondary" onclick="showDetail(${inlineJsValue(listing.id)})">${langText("Apri", "Open")}</button><button class="irisx-secondary" onclick="toggleListingOffers('${listing.id}')">${toggleLabel}</button><button class="irisx-secondary" onclick="loadDraftIntoSellForm('${listing.id}')">${langText("Modifica", "Edit")}</button><button class="irisx-danger" onclick="archiveListing('${listing.id}')">${langText("Archivia", "Archive")}</button></div></div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun annuncio attivo.", "No active listings.")}</div>`;
    }
    if (section === "drafts") {
      return drafts.length ? `<div class="irisx-card-stack">${drafts.map(function (listing) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(listing.brand)} ${escapeHtml(listing.name)}</strong><span>${escapeHtml(listing.cat)} · ${escapeHtml(formatCurrency(listing.price || 0))}</span></div><div class="irisx-actions"><button class="irisx-secondary" onclick="loadDraftIntoSellForm('${listing.id}')">${langText("Modifica", "Edit")}</button><button class="irisx-primary" onclick="publishDraftListing('${listing.id}')">${langText("Pubblica", "Publish")}</button></div></div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna bozza salvata.", "No saved drafts.")}</div>`;
    }
    if (section === "sold") {
      return sold.length ? `<div class="irisx-card-stack">${sold.map(function (listing) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(listing.brand)} ${escapeHtml(listing.name)}</strong><span>${escapeHtml(formatDateTime(listing.soldAt || listing.date))}</span></div>${listing.orderId ? `<button class="irisx-secondary" onclick="openOrderDetail('${listing.orderId}','seller')">${langText("Ordine", "Order")}</button>` : ""}</div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun articolo venduto.", "No sold items.")}</div>`;
    }
    if (section === "offers") {
      return renderOffersMarkup(sellerOffers, "seller");
    }
    if (section === "messages") {
      return renderMessagingWorkspaceCard("selling");
    }
    if (section === "shipping") {
      return renderSellerOrdersMarkup(sellerOrders);
    }
    if (section === "payouts") {
      return sellerOrders.length ? `<div class="irisx-card-stack">${sellerOrders.map(function (order) {
        const sellerGross = order.items
          .filter(function (item) { return normalizeEmail(item.sellerEmail) === normalizeEmail(state.currentUser.email); })
          .reduce(function (sum, item) { return sum + Number(item.price || 0) * Number(item.qty || 1); }, 0);
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(order.number)}</strong><span>${langText("Lordo", "Gross")}: ${escapeHtml(formatCurrency(sellerGross))} · ${langText("Netto", "Net")}: ${escapeHtml(formatCurrency(Math.max(0, sellerGross - (order.payment.platformFee || 0))))}</span></div><span class="irisx-badge">${escapeHtml(order.payment.payoutStatus || "pending")}</span></div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun payout ancora.", "No payouts yet.")}</div>`;
    }
    if (section === "history") {
      const history = sellerOrders.filter(function (order) {
        return ["completed", "delivered", "refunded", "cancelled"].includes(order.status);
      });
      return renderSellerOrdersMarkup(history);
    }
    if (section === "stats") {
      const byBrand = {};
      listings.forEach(function (listing) {
        byBrand[listing.brand] = (byBrand[listing.brand] || 0) + 1;
      });
      return `<div class="irisx-summary-grid">
        <div class="irisx-summary-card"><strong>${published.length}</strong><span>${langText("Annunci attivi", "Active listings")}</span></div>
        <div class="irisx-summary-card"><strong>${drafts.length}</strong><span>${langText("Bozze", "Draft listings")}</span></div>
        <div class="irisx-summary-card"><strong>${sellerOffers.length}</strong><span>${langText("Offerte ricevute", "Offers received")}</span></div>
        <div class="irisx-summary-card"><strong>${sellerOrders.length}</strong><span>${langText("Storico vendite", "Sales history")}</span></div>
      </div>
      <div class="irisx-card-stack">${Object.keys(byBrand).map(function (brand) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(brand)}</strong><span>${byBrand[brand]} ${langText("annunci", "listings")}</span></div></div>`;
      }).join("")}</div>`;
    }
    return `<div class="irisx-summary-grid">
      <div class="irisx-summary-card"><strong>${published.length}</strong><span>${langText("Annunci attivi", "Active listings")}</span></div>
      <div class="irisx-summary-card"><strong>${drafts.length}</strong><span>${langText("Bozze", "Drafts")}</span></div>
      <div class="irisx-summary-card"><strong>${sellerOrders.filter(function (order) { return ["paid", "awaiting_shipment"].includes(order.status); }).length}</strong><span>${langText("Coda spedizioni", "Shipping queue")}</span></div>
      <div class="irisx-summary-card"><strong>${sellerOrders.filter(function (order) { return order.payment.payoutStatus === "ready"; }).length}</strong><span>${langText("Payout pronti", "Payout ready")}</span></div>
      <div class="irisx-summary-card"><strong>${sellingConversations.length}</strong><span>${langText("Chat vendita", "Selling chats")}</span></div>
    </div>
    <div class="irisx-card-stack">
      <div class="irisx-inline-card"><div><strong>${langText("Annunci attivi", "Active listings")}</strong><span>${langText("Catalogo live seller.", "Seller live catalog.")}</span></div><button class="irisx-secondary" onclick="setSellerSection('active')">${langText("Apri", "Open")}</button></div>
      <div class="irisx-inline-card"><div><strong>${langText("Bozze", "Draft listings")}</strong><span>${langText("Bozze pronte da completare.", "Drafts ready to complete.")}</span></div><button class="irisx-secondary" onclick="setSellerSection('drafts')">${langText("Apri", "Open")}</button></div>
      <div class="irisx-inline-card"><div><strong>${langText("Offerte ricevute", "Offers received")}</strong><span>${sellerOffers.length} ${langText("offerte", "offers")}</span></div><button class="irisx-secondary" onclick="setSellerSection('offers')">${langText("Apri", "Open")}</button></div>
      <div class="irisx-inline-card"><div><strong>${langText("Inbox vendita", "Selling inbox")}</strong><span>${sellingConversations.length} ${langText("conversazioni", "conversations")} · ${getChatScopeUnreadCount("selling")} ${langText("non lette", "unread")}</span></div><button class="irisx-secondary" onclick="setSellerSection('messages')">${langText("Apri", "Open")}</button></div>
      <div class="irisx-inline-card"><div><strong>${langText("Coda spedizioni", "Shipping queue")}</strong><span>${langText("Ordini da processare.", "Orders to process.")}</span></div><button class="irisx-secondary" onclick="setSellerSection('shipping')">${langText("Apri", "Open")}</button></div>
    </div>`;
  }

  function getWorkspaceSections(area) {
    if (area === "account") {
      return getAccountSectionGroups().reduce(function (entries, group) {
        return entries.concat(group.entries);
      }, []);
    }
    if (area === "buyer") {
      return [
        { id: "orders", label: langText("I miei ordini", "My orders") },
        { id: "order_detail", label: langText("Dettaglio ordine", "Order detail") },
        { id: "tracking", label: langText("Tracciamento", "Tracking") },
        { id: "offers", label: langText("Offerte inviate", "Sent offers") },
        { id: "wishlist", label: langText("Preferiti", "Wishlist") },
        { id: "messages", label: langText("Chat compro", "Buying chat") },
        { id: "history", label: langText("Storico acquisti", "Purchase history") },
        { id: "reviews", label: langText("Recensioni", "Review flow") },
        { id: "support", label: langText("Supporto / segnala un problema", "Support / report issue") }
      ];
    }
    return [
      { id: "dashboard", label: langText("Dashboard venditore", "Seller dashboard") },
      { id: "active", label: langText("Annunci attivi", "Active listings") },
      { id: "drafts", label: langText("Bozze", "Draft listings") },
      { id: "sold", label: langText("Articoli venduti", "Sold items") },
      { id: "offers", label: langText("Offerte ricevute", "Offers received") },
      { id: "messages", label: langText("Chat vendo", "Selling chat") },
      { id: "shipping", label: langText("Coda spedizioni", "Shipping queue") },
      { id: "payouts", label: langText("Panoramica pagamenti", "Payout overview") },
      { id: "history", label: langText("Storico vendite", "Sales history") },
      { id: "stats", label: langText("Statistiche annunci", "Listing stats") }
    ];
  }

  function getProfileAreaCopy(area) {
    if (area === "buyer") {
      return {
        kicker: langText("AREA ACQUISTI", "BUYER AREA"),
        title: langText("Acquisti", "Buying"),
        subtitle: langText("Ordini, offerte, wishlist e chat degli articoli che stai comprando.", "Orders, offers, wishlist, and chats for the items you are buying.")
      };
    }
    if (area === "seller") {
      return {
        kicker: langText("AREA VENDITE", "SELLER AREA"),
        title: langText("Vendite", "Selling"),
        subtitle: langText("Annunci, offerte ricevute, chat e spedizioni in un unico spazio.", "Listings, received offers, chats, and shipping in one place.")
      };
    }
    return {
      kicker: langText("AREA ACCOUNT", "ACCOUNT AREA"),
      title: langText("Account", "Account"),
      subtitle: langText("Le impostazioni importanti in uno spazio più semplice e leggibile.", "Important settings in a simpler, easier-to-read space.")
    };
  }

  function getProfileSidebarGroups(area, context) {
    if (area === "account") {
      const descriptions = {
        overview: langText("Panoramica generale del tuo account.", "High-level view of your account."),
        shopping_preferences: langText("Alert, preferenze catalogo e salvataggi.", "Alerts, catalog preferences, and saves."),
        shopping_sizes: langText("Taglie e fit da ricordare.", "Sizes and fit to remember."),
        shopping_saved_searches: langText("Ricerche e notifiche salvate.", "Saved searches and alerts."),
        selling_preferences: langText("Regole seller e gestione offerte.", "Seller rules and offer handling."),
        selling_location: langText("Da dove spedisci.", "Where you ship from."),
        selling_vacation: langText("Pausa vendite e messaggio buyer.", "Selling pause and buyer message."),
        selling_listing_preferences: langText("Default per nuovi annunci.", "Defaults for new listings."),
        settings_account: langText("Email, telefono e indirizzi.", "Email, phone, and addresses."),
        settings_profile: langText("Nome, bio e profilo pubblico.", "Name, bio, and public profile."),
        settings_privacy: langText("Visibilità e richieste messaggi.", "Visibility and message requests."),
        settings_payment: langText("Carte e payout.", "Cards and payouts."),
        settings_notifications: langText("Badge e notifiche.", "Badges and notifications."),
        settings_security: langText("2FA e sessioni attive.", "2FA and active sessions."),
        help_help: langText("Centro assistenza rapido.", "Quick help center."),
        help_listings: langText("Bozze, attivi e pubblicazione.", "Drafts, live listings, and publishing."),
        help_verification: langText("Autenticazione e trust.", "Authentication and trust."),
        help_shipping: langText("Tracking, resi e protezione.", "Tracking, returns, and protection."),
        help_accessibility: langText("Supporto accessibilità.", "Accessibility support."),
        help_contact: langText("Apri ticket e supporto.", "Open tickets and support."),
        help_about: langText("Brand e community.", "Brand and community."),
        help_sell: langText("Guida seller sintetica.", "Concise seller guide.")
      };
      return getAccountSectionGroups().map(function (group) {
        return {
          title: group.title,
          entries: group.entries.map(function (entry) {
            return {
              id: entry.id,
              label: entry.label,
              description: descriptions[entry.id] || "",
              badge: ""
            };
          })
        };
      });
    }

    if (area === "buyer") {
      return [
        {
          title: langText("Compra", "Buying"),
          entries: [
            { id: "orders", label: langText("I miei ordini", "My orders"), description: langText("Stato, tracking e dettaglio ordine.", "Status, tracking, and order detail."), badge: String(context.orders.length) },
            { id: "offers", label: langText("Offerte inviate", "Sent offers"), description: langText("Segui risposta seller e scadenza.", "Track seller response and expiry."), badge: String(getBuyerOffers().length) },
            { id: "messages", label: langText("Chat compro", "Buying chat"), description: langText("Conversazioni sugli articoli che vuoi comprare.", "Conversations for the items you want to buy."), badge: String(getChatScopeUnreadCount("buying")) },
            { id: "wishlist", label: langText("Preferiti", "Wishlist"), description: langText("Articoli salvati da tenere d'occhio.", "Saved items to keep an eye on."), badge: String(context.favoritesItems.length) }
          ]
        },
        {
          title: langText("Storico e supporto", "History and support"),
          entries: [
            { id: "history", label: langText("Storico acquisti", "Purchase history"), description: langText("Ordini consegnati, chiusi o rimborsati.", "Delivered, closed, or refunded orders."), badge: "" },
            { id: "reviews", label: langText("Recensioni", "Reviews"), description: langText("Lascia feedback sugli ordini conclusi.", "Leave feedback on completed orders."), badge: "" },
            { id: "support", label: langText("Supporto", "Support"), description: langText("Ticket, problemi e assistenza.", "Tickets, issues, and support."), badge: String(context.tickets.length) }
          ]
        }
      ];
    }

    const publishedCount = context.listings.filter(function (listing) {
      return listing.listingStatus === "published" && listing.inventoryStatus === "active";
    }).length;
    const payoutReadyCount = context.sellerOrders.filter(function (order) {
      return order.payment && order.payment.payoutStatus === "ready";
    }).length;
    return [
      {
        title: langText("Gestione vendite", "Sales management"),
        entries: [
          { id: "dashboard", label: langText("Dashboard", "Dashboard"), description: langText("Panoramica venditore immediata.", "Quick seller overview."), badge: "" },
          { id: "active", label: langText("Annunci attivi", "Active listings"), description: langText("I prodotti live che stai vendendo.", "Live products you are selling."), badge: String(publishedCount) },
          { id: "drafts", label: langText("Bozze", "Drafts"), description: langText("Annunci da completare o pubblicare.", "Listings to finish or publish."), badge: String(context.listings.filter(function (listing) { return listing.listingStatus === "draft" || listing.inventoryStatus === "draft"; }).length) },
          { id: "offers", label: langText("Offerte ricevute", "Offers received"), description: langText("Rispondi alle offerte dei buyer.", "Respond to buyer offers."), badge: String(getSellerOffers().length) }
        ]
      },
      {
        title: langText("Operatività", "Operations"),
        entries: [
          { id: "messages", label: langText("Chat vendo", "Selling chat"), description: langText("Messaggi sugli articoli che stai vendendo.", "Messages for the items you are selling."), badge: String(getChatScopeUnreadCount("selling")) },
          { id: "shipping", label: langText("Spedizioni", "Shipping"), description: langText("Ordini da preparare e spedire.", "Orders to prepare and ship."), badge: String(context.sellerOrders.filter(function (order) { return ["paid", "awaiting_shipment"].includes(order.status); }).length) },
          { id: "payouts", label: langText("Pagamenti", "Payouts"), description: langText("Pagamenti in uscita e stato saldo.", "Outgoing payouts and balance status."), badge: String(payoutReadyCount) },
          { id: "history", label: langText("Storico vendite", "Sales history"), description: langText("Ordini seller conclusi.", "Completed seller orders."), badge: "" }
        ]
      }
    ];
  }

  function getProfileSectionHandler(area, sectionId) {
    if (area === "buyer") {
      return `setBuyerSection('${sectionId}')`;
    }
    if (area === "seller") {
      return `setSellerSection('${sectionId}')`;
    }
    return `setProfileArea('account','${sectionId}')`;
  }

  function shouldRenderWorkspaceBadge(badge) {
    if (badge === null || badge === undefined) {
      return false;
    }
    const text = String(badge).trim();
    if (!text) {
      return false;
    }
    const numeric = Number(text);
    if (Number.isFinite(numeric)) {
      return numeric > 0;
    }
    return true;
  }

  function renderProfileSidebarMenu(area, activeSection, context) {
    const groups = getProfileSidebarGroups(area, context);
    return `<div class="irisx-sidebar-menu">
      ${groups.map(function (group) {
        return `<div class="irisx-sidebar-group">
          <div class="irisx-sidebar-group-title">${escapeHtml(group.title)}</div>
          <div class="irisx-sidebar-group-list">
            ${group.entries.map(function (entry) {
              return `<button class="irisx-sidebar-link${entry.id === activeSection ? " on" : ""}" onclick="${getProfileSectionHandler(area, entry.id)}">
                <span class="irisx-sidebar-link__main">
                  <strong>${escapeHtml(entry.label)}</strong>
                  ${entry.description && entry.id === activeSection ? `<small>${escapeHtml(entry.description)}</small>` : ""}
                </span>
                ${shouldRenderWorkspaceBadge(entry.badge) ? `<em>${escapeHtml(entry.badge)}</em>` : ""}
              </button>`;
            }).join("")}
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }

  function renderProfileQuickActions(area, context) {
    let cards = [];
    if (area === "buyer") {
      cards = [
        { title: langText("I miei ordini", "My orders"), copy: langText("Apri ordini e tracking.", "Open orders and tracking."), badge: String(context.orders.length), action: "setBuyerSection('orders')" },
        { title: langText("Offerte inviate", "Sent offers"), copy: langText("Controlla risposta e scadenza.", "Check response and expiry."), badge: String(getBuyerOffers().length), action: "setBuyerSection('offers')" },
        { title: langText("Chat compro", "Buying chat"), copy: langText("Messaggi sugli articoli che vuoi comprare.", "Messages about items you want to buy."), badge: String(getChatScopeUnreadCount('buying')), action: "setBuyerSection('messages')" }
      ];
    } else if (area === "seller") {
      const activeListings = context.listings.filter(function (listing) {
        return listing.listingStatus === "published" && listing.inventoryStatus === "active";
      }).length;
      const shippingQueue = context.sellerOrders.filter(function (order) {
        return ["paid", "awaiting_shipment"].includes(order.status);
      }).length;
      cards = [
        { title: langText("Annunci attivi", "Active listings"), copy: langText("Modifica o controlla i prodotti live.", "Edit or check live products."), badge: String(activeListings), action: "setSellerSection('active')" },
        { title: langText("Offerte ricevute", "Offers received"), copy: langText("Accetta o rifiuta le offerte buyer.", "Accept or decline buyer offers."), badge: String(getSellerOffers().length), action: "setSellerSection('offers')" },
        { title: langText("Spedizioni", "Shipping"), copy: langText("Gestisci ordini da preparare.", "Manage orders to prepare."), badge: String(shippingQueue), action: "setSellerSection('shipping')" }
      ];
    } else {
      cards = [
          { title: langText("Pagamenti", "Payments"), copy: langText("Carte, metodi salvati e payout.", "Cards, saved methods, and payouts."), badge: String(context.user.paymentMethods.length), action: "setProfileArea('account','settings_payment')" },
          { title: langText("Indirizzi", "Addresses"), copy: langText("Aggiorna rubrica e indirizzo di spedizione predefinito.", "Update address book and default shipping address."), badge: String(context.user.addresses.length), action: "setProfileArea('account','settings_account')" },
          { title: langText("Sicurezza", "Security"), copy: langText("Verifica email, telefono e sessioni.", "Verify email, phone, and sessions."), badge: String((context.user.verification.emailVerified ? 1 : 0) + (context.user.verification.phoneVerified ? 1 : 0)), action: "setProfileArea('account','settings_security')" }
      ];
    }

    return `<div class="irisx-profile-quick-grid">
      ${cards.map(function (card) {
        return `<button class="irisx-profile-quick-card" onclick="${card.action}">
          ${shouldRenderWorkspaceBadge(card.badge) ? `<span class="irisx-profile-quick-card__badge">${escapeHtml(card.badge)}</span>` : ""}
          <strong>${escapeHtml(card.title)}</strong>
          <span>${escapeHtml(card.copy)}</span>
        </button>`;
      }).join("")}
    </div>`;
  }

  function shouldRenderProfileQuickActions(area, activeSection) {
    if (area === "account") {
      return activeSection === "overview";
    }
    if (area === "buyer") {
      return activeSection === "orders";
    }
    if (area === "seller") {
      return activeSection === "dashboard";
    }
    return false;
  }

  renderBuyerOrdersMarkup = function (orders) {
    if (!orders.length) {
      return `<div class="irisx-empty-state">${t("no_orders_yet")}</div>`;
    }
    return `<div class="irisx-order-list">${orders.map(function (order) {
      return `<div class="irisx-order-card">
        <div class="irisx-order-head"><strong>${escapeHtml(order.number)}</strong><span class="irisx-badge">${escapeHtml(getOrderStatusLabel(order))}</span></div>
        <div class="irisx-order-items">
          <div>${escapeHtml(order.items.map(function (item) { return item.brand + " " + item.name; }).join(", "))}</div>
          <div>${escapeHtml(formatCurrency(order.total))} · ${escapeHtml(formatDateTime(order.createdAt))}</div>
          <div>${escapeHtml(order.shipping.carrier || langText("Carrier pending", "Carrier pending"))}${order.shipping.trackingNumber ? " · " + escapeHtml(order.shipping.trackingNumber) : ""}</div>
        </div>
        ${renderOrderTimeline(order)}
        ${renderOrderRelistBlock(order, "compact")}
        <div class="irisx-actions">${getOrderLifecycleActions(order, "buyer").join("")}</div>
      </div>`;
    }).join("")}</div>`;
  };

  renderSellerOrdersMarkup = function (orders) {
    if (!orders.length) {
      return `<div class="irisx-empty-state">${langText("Nessun ordine seller ancora.", "No seller orders yet.")}</div>`;
    }
    return `<div class="irisx-order-list">${orders.map(function (order) {
      const sellerItems = order.items.filter(function (item) {
        return normalizeEmail(item.sellerEmail) === normalizeEmail(state.currentUser.email);
      });
      return `<div class="irisx-order-card">
        <div class="irisx-order-head"><strong>${escapeHtml(order.number)}</strong><span class="irisx-badge">${escapeHtml(getOrderStatusLabel(order))}</span></div>
        <div class="irisx-order-items">
          <div>${langText("Acquirente", "Buyer")}: ${escapeHtml(order.buyerEmail)}</div>
          <div>${escapeHtml(sellerItems.map(function (item) { return item.brand + " " + item.name; }).join(", "))}</div>
          <div>${escapeHtml(order.shipping.method || langText("Spedizione assicurata", "Insured shipping"))}</div>
        </div>
        ${renderOrderTimeline(order)}
        <div class="irisx-actions">${getOrderLifecycleActions(order, "seller").join("")}</div>
      </div>`;
    }).join("")}</div>`;
  };

  function renderOrderDetailModal() {
    const modal = qs("#irisxOrderModal");
    const order = getOrderById(state.activeOrderId);
    if (!modal) {
      return;
    }
    if (!order) {
      modal.innerHTML = "";
      return;
    }
    modal.innerHTML = `<div class="irisx-modal-backdrop"></div><div class="irisx-modal-card irisx-modal-card--wide">
      <div class="irisx-card-head">
        <div>
          <div class="irisx-kicker">${langText("Order lifecycle", "Order lifecycle")}</div>
          <div class="irisx-title">${escapeHtml(order.number)}</div>
          <div class="irisx-subtitle">${escapeHtml(getOrderStatusLabel(order))}</div>
        </div>
        <button class="irisx-close" onclick="closeOrderDetail()">✕</button>
      </div>
      <div class="irisx-card-body">${renderOrderSummaryCard(order, state.activeOrderScope || "buyer")}${renderOrderTrackingPanel(order)}</div>
    </div>`;
  }

  renderProfilePanel = function () {
    ensureStructuredSkeletonState();
    const container = qs("#profile-view .container");
    if (!container) {
      return;
    }

    const favoritesItems = prods.filter(function (product) {
      return favorites.has(product.id) && isProductPurchasable(product);
    });

    if (!state.currentUser) {
      container.innerHTML = `<div class="irisx-guest-shell">
        <div class="prof-header">
          <div class="prof-av">👤</div>
          <div class="prof-info">
            <div class="prof-name">${t("profile_guest_title")}</div>
            <div class="prof-bio">${t("profile_guest_body")}</div>
          </div>
        </div>
        <div class="irisx-actions"><button class="irisx-primary" onclick="openAuthModal('register')">${t("register")}</button><button class="irisx-secondary" onclick="openAuthModal('login')">${t("login")}</button></div>
      </div>`;
      return;
    }

    const user = normalizeUserWorkspace(state.currentUser);
    const listings = getMyListings();
    const orders = getBuyerOrders();
    const sellerOrders = getSellerOrdersForCurrentUser();
    const tickets = getTicketsForCurrentUser();
    const buyingThreads = getChatThreadsForScope("buying");
    const sellingThreads = getChatThreadsForScope("selling");
    const unreadNotifications = getVisibleNotifications().filter(function (notification) { return notification.unread; }).length;
    const area = state.profileArea || "account";
    const activeSection = area === "account" ? resolveAccountSectionId(state.profileSection) : area === "buyer" ? state.buyerSection : state.sellerSection;
    const areaCopy = getProfileAreaCopy(area);
    const showQuickActions = shouldRenderProfileQuickActions(area, activeSection);
    const profileContext = {
      user: user,
      listings: listings,
      orders: orders,
      sellerOrders: sellerOrders,
      tickets: tickets,
      favoritesItems: favoritesItems,
      buyingThreads: buyingThreads,
      sellingThreads: sellingThreads,
      unreadNotifications: unreadNotifications
    };

    let content = "";
    if (area === "account") {
      content = renderAccountArea(user, orders, sellerOrders, tickets, favoritesItems);
    } else if (area === "buyer") {
      content = renderBuyerArea(orders, favoritesItems, tickets);
    } else {
      content = renderSellerArea(listings, sellerOrders);
    }

    const summaryCards = area === "buyer"
      ? [
          { value: orders.length, label: langText("Ordini", "Orders") },
          { value: getBuyerOffers().length, label: langText("Offerte", "Offers") },
          { value: getChatScopeUnreadCount("buying"), label: langText("Chat non lette", "Unread chats") },
          { value: favoritesItems.length, label: langText("Preferiti", "Wishlist") }
        ]
      : area === "seller"
        ? [
            { value: listings.filter(function (listing) { return listing.listingStatus === "published" && listing.inventoryStatus === "active"; }).length, label: langText("Attivi", "Live") },
            { value: getSellerOffers().length, label: langText("Offerte", "Offers") },
            { value: sellerOrders.filter(function (order) { return ["paid", "awaiting_shipment"].includes(order.status); }).length, label: langText("Spedizioni", "Shipping") },
            { value: getChatScopeUnreadCount("selling"), label: langText("Chat non lette", "Unread chats") }
          ]
        : [
            { value: orders.length, label: langText("Ordini", "Orders") },
            { value: listings.length, label: langText("Annunci", "Listings") },
            { value: favoritesItems.length, label: langText("Preferiti", "Wishlist") },
            { value: unreadNotifications, label: langText("Notifiche", "Notifications") }
          ];

    container.innerHTML = `<div class="irisx-workspace">
      <aside class="irisx-workspace-sidebar">
        <div class="irisx-user-card">
          <div class="irisx-user-avatar">${escapeHtml(user.avatar || "👤")}</div>
          <div class="irisx-user-meta">
            <strong>${escapeHtml(user.name)}</strong>
            <span>${escapeHtml(user.email)}</span>
            <em>${langText("Membro dal", "Member since")} ${escapeHtml(user.memberSince || "2026")}</em>
          </div>
        </div>
        <div class="irisx-area-nav">
          <button class="irisx-area-btn${area === "account" ? " on" : ""}" onclick="setProfileArea('account','overview')">${langText("AREA ACCOUNT", "ACCOUNT AREA")}</button>
          <button class="irisx-area-btn${area === "buyer" ? " on" : ""}" onclick="setProfileArea('buyer','orders')">${langText("AREA ACQUISTI", "BUYER AREA")}</button>
          <button class="irisx-area-btn${area === "seller" ? " on" : ""}" onclick="setProfileArea('seller','dashboard')">${langText("AREA VENDITE", "SELLER AREA")}</button>
        ${isCurrentUserAdmin() ? `<button class="irisx-area-btn" onclick="showBuyView('ops')">${langText("Dashboard admin", "Admin dashboard")}</button>` : ""}
        </div>
        ${renderProfileSidebarMenu(area, activeSection, profileContext)}
        <div class="irisx-actions irisx-actions--stack"><button class="irisx-secondary" onclick="showPage('sell')">${t("sell")}</button><button class="irisx-danger" onclick="logout()">${t("logout")}</button></div>
      </aside>
      <div class="irisx-workspace-main">
        <div class="irisx-workspace-head">
          <div>
            <div class="irisx-kicker">${escapeHtml(areaCopy.kicker)}</div>
            <div class="irisx-title">${escapeHtml(areaCopy.title)}</div>
            <div class="irisx-subtitle">${escapeHtml(areaCopy.subtitle)}</div>
          </div>
        </div>
        <div class="irisx-summary-grid irisx-summary-grid--main irisx-summary-grid--workspace">${summaryCards.map(function (card) {
          return `<div class="irisx-summary-card"><strong>${escapeHtml(String(card.value))}</strong><span>${escapeHtml(card.label)}</span></div>`;
        }).join("")}</div>
        ${showQuickActions ? renderProfileQuickActions(area, profileContext) : ""}
        <div class="irisx-workspace-content">${content}</div>
      </div>
    </div>`;
  };

  renderOpsView = function () {
    const container = qs("#ops-view");
    if (!container) {
      return;
    }
    if (!isCurrentUserAdmin()) {
      container.innerHTML = "";
      return;
    }
    const orders = state.orders.slice().sort(function (left, right) { return right.createdAt - left.createdAt; });
    const tabs = [
      { id: "overview", label: langText("Panoramica", "Overview") },
      { id: "users", label: langText("Utenti", "Users") },
      { id: "listings", label: langText("I tuoi annunci", "Listings") },
      { id: "orders", label: langText("Ordini", "Orders") },
      { id: "support", label: langText("Dispute / supporto", "Disputes / support") },
      { id: "reviews", label: langText("Recensioni", "Reviews") },
      { id: "payouts", label: langText("Pagamenti", "Payouts") },
      { id: "taxonomy", label: langText("Categorie / brand", "Categories / brands") },
      { id: "content", label: langText("Contenuti / policy", "Content / policies") },
      { id: "settings", label: langText("Impostazioni", "Settings") }
    ];
    const tabHtml = tabs.map(function (tab) {
      return `<button class="irisx-section-tab${state.adminSection === tab.id ? " on" : ""}" onclick="setAdminSection('${tab.id}')">${escapeHtml(tab.label)}</button>`;
    }).join("");

    let content = "";
    if (state.adminSection === "users") {
      content = `<div class="irisx-card-stack">${getRecentAdminUsers().map(function (user) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(user.name || user.email)}</strong><span>${escapeHtml(user.email)} · ${escapeHtml(user.role || "member")} · ${user.verification && user.verification.emailVerified ? langText("email verificata", "email verified") : langText("email pending", "email pending")} · ${user.verification && user.verification.phoneVerified ? langText("telefono verificato", "phone verified") : langText("telefono pending", "phone pending")}</span></div><em>${escapeHtml(user.accountStatus || "active")}</em></div>`;
      }).join("")}</div>`;
    } else if (state.adminSection === "listings") {
      content = `<div class="irisx-card-stack">${state.listings.map(function (listing) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(listing.brand)} ${escapeHtml(listing.name)}</strong><span>${escapeHtml(listing.listingStatus || "published")} · ${escapeHtml(listing.ownerEmail || "")}</span></div><div class="irisx-actions">${listing.listingStatus === "draft" ? `<button class="irisx-secondary" onclick="publishDraftListing('${listing.id}')">${langText("Pubblica", "Publish")}</button>` : ""}${listing.inventoryStatus !== "archived" ? `<button class="irisx-secondary" onclick="archiveListing('${listing.id}')">${langText("Archivia", "Archive")}</button>` : ""}</div></div>`;
      }).join("") || `<div class="irisx-empty-state">${langText("Nessun listing.", "No listings.")}</div>`}</div>`;
    } else if (state.adminSection === "orders") {
      content = orders.length ? `<div class="irisx-order-list">${orders.map(function (order) {
        return `<div class="irisx-order-card"><div class="irisx-order-head"><strong>${escapeHtml(order.number)}</strong><span class="irisx-badge">${escapeHtml(getOrderStatusLabel(order))}</span></div><div class="irisx-order-items"><div>${escapeHtml(order.buyerEmail)}</div><div>${escapeHtml(order.items.map(function (item) { return item.brand + " " + item.name; }).join(", "))}</div><div>${escapeHtml(formatCurrency(order.total))}</div></div><div class="irisx-actions">${getOrderLifecycleActions(order, "admin").join("")}</div></div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun ordine.", "No orders.")}</div>`;
    } else if (state.adminSection === "support") {
      content = renderSupportTicketsMarkup(state.supportTickets);
    } else if (state.adminSection === "reviews") {
      content = state.reviews.length ? `<div class="irisx-card-stack">${state.reviews.map(function (review) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(review.buyer)} · ${"★".repeat(review.rating)}</strong><span>${escapeHtml(review.text)}</span></div><em>${escapeHtml(review.product || "")}</em></div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna review.", "No reviews.")}</div>`;
    } else if (state.adminSection === "payouts") {
      content = orders.length ? `<div class="irisx-card-stack">${orders.map(function (order) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(order.number)}</strong><span>${langText("Netto seller", "Seller net")}: ${escapeHtml(formatCurrency(order.payment.sellerNet || 0))}</span></div><div class="irisx-actions"><span class="irisx-badge">${escapeHtml(order.payment.payoutStatus || "pending")}</span>${order.payment.payoutStatus === "ready" ? `<button class="irisx-secondary" onclick="markOrderPayoutPaid('${order.id}')">${langText("Segna pagato", "Mark paid")}</button>` : ""}</div></div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun payout.", "No payouts.")}</div>`;
    } else if (state.adminSection === "taxonomy") {
      content = `<div class="irisx-summary-grid">${getAvailableCategories().map(function (category) {
        return `<div class="irisx-summary-card"><strong>${escapeHtml(category)}</strong><span>${getVisibleCatalogProducts().filter(function (product) { return normalizeCategoryValue(product.cat) === category; }).length} ${langText("articoli", "items")}</span></div>`;
      }).join("")}</div><div class="irisx-card-stack">${getAvailableBrands().map(function (brand) {
        return `<div class="irisx-inline-card"><div><strong>${escapeHtml(brand)}</strong><span>${getVisibleCatalogProducts().filter(function (product) { return product.brand === brand; }).length} ${langText("articoli", "items")}</span></div></div>`;
      }).join("")}</div>`;
    } else if (state.adminSection === "content") {
      content = `<div class="irisx-policy-grid">${Object.keys(POLICY_PAGE_CONTENT).map(function (key) {
        const page = POLICY_PAGE_CONTENT[key];
        return `<button class="irisx-policy-card" onclick="openStatic('${key}')"><strong>${escapeHtml(page.title)}</strong><span>${escapeHtml(page.subtitle)}</span></button>`;
      }).join("")}</div><div class="irisx-workspace-card"><div class="irisx-section-head"><h3>${langText("Email outbox", "Email outbox")}</h3><span>${langText("Template e trigger mock in coda.", "Queued mock templates and triggers.")}</span></div>${state.emailOutbox.length ? `<div class="irisx-card-stack">${state.emailOutbox.slice(0, 8).map(function (mail) { return `<div class="irisx-inline-card"><div><strong>${escapeHtml(mail.subject)}</strong><span>${escapeHtml(mail.to)}</span></div><em>${escapeHtml(mail.type)}</em></div>`; }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna email in coda.", "No queued emails.")}</div>`}</div>`;
    } else if (state.adminSection === "settings") {
      content = `<div class="irisx-summary-grid">
        <div class="irisx-summary-card"><strong>${Math.round(PLATFORM_CONFIG.selfServeFeeRate * 100)}%</strong><span>${langText("Commissione self-serve", "Self-serve fee")}</span></div>
        <div class="irisx-summary-card"><strong>${Math.round(PLATFORM_CONFIG.conciergeFeeRate * 100)}%</strong><span>${langText("Commissione concierge", "Concierge fee")}</span></div>
        <div class="irisx-summary-card"><strong>${escapeHtml(formatCurrency(PLATFORM_CONFIG.shippingCost))}</strong><span>${langText("Costo spedizione", "Shipping fee")}</span></div>
        <div class="irisx-summary-card"><strong>${PLATFORM_CONFIG.ownerEmail}</strong><span>${langText("Email proprietario", "Owner inbox")}</span></div>
      </div>`;
    } else {
      content = `<div class="irisx-summary-grid">
        <div class="irisx-summary-card"><strong>${orders.length}</strong><span>${langText("Ordini", "Orders")}</span></div>
        <div class="irisx-summary-card"><strong>${orders.filter(function (order) { return ["paid", "awaiting_shipment"].includes(order.status); }).length}</strong><span>${langText("Coda spedizioni", "Shipping queue")}</span></div>
        <div class="irisx-summary-card"><strong>${state.supportTickets.filter(function (ticket) { return ticket.status !== "resolved"; }).length}</strong><span>${langText("Ticket aperti", "Open tickets")}</span></div>
        <div class="irisx-summary-card"><strong>${state.notifications.filter(function (notification) { return notification.audience === "admin" && notification.unread; }).length}</strong><span>${langText("Notifiche admin", "Admin notices")}</span></div>
      </div>
      <div class="irisx-card-stack">
        <div class="irisx-inline-card"><div><strong>${langText("Ordini", "Orders")}</strong><span>${langText("Order lifecycle, shipping, payout visibility.", "Order lifecycle, shipping, payout visibility.")}</span></div><button class="irisx-secondary" onclick="setAdminSection('orders')">${langText("Apri", "Open")}</button></div>
        <div class="irisx-inline-card"><div><strong>${langText("Utenti", "Users")}</strong><span>${langText("Registrazioni e ruoli.", "Registrations and roles.")}</span></div><button class="irisx-secondary" onclick="setAdminSection('users')">${langText("Apri", "Open")}</button></div>
        <div class="irisx-inline-card"><div><strong>${langText("Contenuti / policy", "Content / policies")}</strong><span>${langText("Policy, trust pages e outbox email.", "Policies, trust pages, and email outbox.")}</span></div><button class="irisx-secondary" onclick="setAdminSection('content')">${langText("Apri", "Open")}</button></div>
      </div>`;
    }

    container.innerHTML = `<div class="irisx-workspace irisx-workspace--admin">
      <aside class="irisx-workspace-sidebar">
        <div class="irisx-user-card">
          <div class="irisx-user-avatar">OPS</div>
          <div class="irisx-user-meta">
            <strong>${langText("Dashboard admin", "Admin dashboard")}</strong>
            <span>${PLATFORM_CONFIG.ownerEmail}</span>
            <em>${langText("Strumenti owner", "Owner tools")}</em>
          </div>
        </div>
      </aside>
      <div class="irisx-workspace-main">
        <div class="irisx-workspace-head">
          <div>
            <div class="irisx-kicker">${langText("Operazioni", "Operations")}</div>
            <div class="irisx-title">OPS</div>
            <div class="irisx-subtitle">${langText("Gestione ordini, utenti, payout e contenuti.", "Order, user, payout and content management.")}</div>
          </div>
        </div>
        <div class="irisx-section-tabs">${tabHtml}</div>
        <div class="irisx-workspace-content">${content}</div>
      </div>
    </div>`;
  };

  renderNotifications = function () {
    const panel = qs("#notifPanel");
    const badge = qs("#notifBadge");
    if (!panel || !badge) {
      return;
    }
    const visible = getVisibleNotifications();
    const unread = visible.filter(function (notification) { return notification.unread; }).length;
    badge.style.display = unread ? "flex" : "none";
    badge.textContent = unread;
    panel.innerHTML = `<div class="irisx-notif-panel-head">
      <strong>${langText("Notifiche", "Notifications")}</strong>
      <button onclick="markAllRead()">${langText("Mark all", "Mark all")}</button>
    </div>
    ${visible.length ? visible.slice(0, 6).map(function (notification) {
      return `<button class="irisx-notification-item${notification.unread ? " unread" : ""}" onclick="readNotif('${notification.id}', false)">
        <strong>${escapeHtml(notification.title)}</strong>
        <span>${escapeHtml(notification.body)}</span>
        <em>${escapeHtml(formatRelativeTime(notification.createdAt))}</em>
      </button>`;
    }).join("") : `<div class="irisx-empty-state irisx-empty-state--compact">${langText("Nessuna notifica.", "No notifications.")}</div>`}
    <div class="irisx-actions"><button class="irisx-secondary" onclick="openNotificationCenter()">${langText("Vedi tutte", "View all")}</button></div>`;
    syncChatBadge();
  };

  readNotif = function (id, stay) {
    let target = null;
    state.notifications = state.notifications.map(function (notification) {
      if (notification.id !== id) {
        return notification;
      }
      target = notification;
      return Object.assign({}, notification, { unread: false });
    });
    persistNotifications();
    renderNotifications();
    if (stay) {
      return;
    }
    if (target && target.kind === "message") {
      openMessagingInbox((target && target.scope) || "buying", target && target.conversationId);
      return;
    }
    if (target && (target.kind === "order" || target.kind === "delivery" || target.kind === "shipping")) {
      showBuyView("profile");
      setProfileArea("buyer", "orders");
      return;
    }
    openNotificationCenter();
  };

  markAllRead = function () {
    state.notifications = state.notifications.map(function (notification) {
      const isVisible = getVisibleNotifications().some(function (visible) { return visible.id === notification.id; });
      return isVisible ? Object.assign({}, notification, { unread: false }) : notification;
    });
    persistNotifications();
    renderNotifications();
    renderProfilePanel();
  };

  backToChats = function () {
    const layout = qs("#chatLayout");
    if (layout) {
      layout.classList.remove("in-chat");
    }
    curChat = null;
    renderChats();
  };

  renderChats = function () {
    ensureChatUiEnhancements();
    const list = qs("#chatList");
    const listTitle = qs(".cl-title");
    const messages = qs("#cmMsgs");
    const name = qs("#cmName");
    const productLabel = qs("#cmProd");
    const productPreview = qs("#irisxChatProduct");
    const roleMeta = qs("#irisxChatRoleMeta");
    const scopeTabs = qs("#irisxChatScopeTabs");
    const layout = qs("#chatLayout");
    if (!list || !messages || !name) {
      return;
    }

    const scope = state.chatScope === "selling" ? "selling" : "buying";
    const scopeCopy = getChatScopeCopy(scope);
    const threads = getChatThreadsForScope(scope);
    if (listTitle) {
      listTitle.textContent = scope === "selling" ? langText("Chat vendo", "Selling chat") : langText("Chat compro", "Buying chat");
    }

    if (scopeTabs) {
      scopeTabs.innerHTML = ["buying", "selling"].map(function (scopeId) {
        const active = scopeId === scope;
        return `<button class="irisx-chat-scope-tab${active ? " on" : ""}" onclick="setChatScope('${scopeId}')">
          <span>${escapeHtml(getChatScopeTabLabel(scopeId))}</span>
          <em>${getChatScopeConversationCount(scopeId)}</em>
        </button>`;
      }).join("");
    }

    if (!threads.length) {
      if (layout) {
        layout.classList.remove("in-chat");
      }
      curChat = null;
      list.innerHTML = `<div class="irisx-empty-state irisx-empty-state--compact">${escapeHtml(scopeCopy.empty)}</div>`;
      messages.innerHTML = `<div class="irisx-empty-state">${langText("Apri una chat da un prodotto o da un'offerta, oppure attendi il primo contatto buyer.", "Open a chat from a product or an offer, or wait for the first buyer message.")}</div>`;
      if (productPreview) {
        productPreview.innerHTML = "";
      }
      if (roleMeta) {
        roleMeta.textContent = scopeCopy.subtitle;
      }
      name.textContent = scopeCopy.title;
      if (productLabel) {
        productLabel.textContent = scopeCopy.subtitle;
      }
      syncChatBadge();
      return;
    }
    if (!curChat || !threads.some(function (thread) { return thread.id === curChat; })) {
      curChat = threads[0].id;
    }

    list.innerHTML = threads.map(function (thread) {
      const lastMessage = thread.msgs[thread.msgs.length - 1] || { text: "", time: "" };
      const counterpartyName = thread.with && thread.with.name ? thread.with.name : (scope === "selling" ? thread.buyerName : thread.sellerName);
      return `<button class="cl-item${curChat === thread.id ? " on" : ""}" data-chat-id="${escapeHtml(thread.id)}" onclick="openChatById('${thread.id}')">
        <div class="cl-av">${escapeHtml(thread.with.avatar || "👤")}</div>
        <div class="cl-info">
          <div class="cl-name">${escapeHtml(counterpartyName || langText("Conversation", "Conversation"))}</div>
          <div class="cl-last">${escapeHtml(lastMessage.text)}</div>
          <div class="irisx-chat-role-line"><span class="irisx-chat-role-badge">${escapeHtml(getChatRoleBadgeLabel(thread))}</span><span>${escapeHtml(getChatRoleContext(thread))}</span></div>
          <div class="irisx-chat-listing">${escapeHtml(thread.product ? thread.product.brand + " · " + thread.product.name : langText("Linked listing", "Linked listing"))}</div>
        </div>
        <div class="cl-time">${escapeHtml(lastMessage.time || "")}${thread.unreadCount ? `<span class="irisx-chat-unread">${thread.unreadCount}</span>` : ""}</div>
      </button>`;
    }).join("");
    openChatById(curChat);
    syncChatBadge();
  };

  openChatById = function (id) {
    ensureChatUiEnhancements();
    const threadIndex = chats.findIndex(function (thread) { return thread.id === id; });
    const conversation = threadIndex > -1 ? normalizeChatThread(chats[threadIndex]) : null;
    if (!conversation) {
      return;
    }
    state.chatScope = getChatConversationScope(conversation);
    curChat = id;
    conversation.unreadCount = 0;
    chats[threadIndex] = conversation;
    persistChats();
    const layout = qs("#chatLayout");
    const name = qs("#cmName");
    const productLabel = qs("#cmProd");
    const preview = qs("#irisxChatProduct");
    const roleMeta = qs("#irisxChatRoleMeta");
    const messages = qs("#cmMsgs");
    if (layout) {
      layout.classList.add("in-chat");
    }
    if (name) {
      name.textContent = conversation.with && conversation.with.name ? conversation.with.name : langText("Conversation", "Conversation");
    }
    if (productLabel) {
      productLabel.textContent = conversation.product ? `${conversation.product.brand} · ${conversation.product.name}` : langText("Linked listing", "Linked listing");
    }
    if (roleMeta) {
      roleMeta.textContent = getChatRoleContext(conversation);
    }
    if (preview) {
      preview.innerHTML = conversation.product
        ? `<button class="irisx-chat-product-card" onclick="showDetail(${inlineJsValue(conversation.product.id)})"><strong>${escapeHtml(conversation.product.brand)}</strong><span>${escapeHtml(conversation.product.name)}</span><em>${escapeHtml(formatCurrency(conversation.product.price || 0))}</em><small class="irisx-chat-role-line"><span class="irisx-chat-role-badge">${escapeHtml(getChatRoleBadgeLabel(conversation))}</span><span>${escapeHtml(getChatRoleContext(conversation))}</span></small></button>`
        : "";
    }
    if (messages) {
      messages.innerHTML = conversation.msgs.length
        ? conversation.msgs.map(function (message) {
            return `<div class="msg ${message.from}"><div>${escapeHtml(message.text)}</div><div class="msg-time">${escapeHtml(message.time || "")}</div></div>`;
          }).join("")
        : `<div class="irisx-empty-state irisx-empty-state--compact">${langText("Nessun messaggio ancora.", "No messages yet.")}</div>`;
      messages.scrollTop = messages.scrollHeight;
    }
    qsa(".cl-item").forEach(function (item) {
      item.classList.toggle("on", item.getAttribute("data-chat-id") === String(id));
    });
    renderNotifications();
  };

  sendChat = function () {
    if (!curChat) {
      return;
    }
    const input = qs("#chatInput");
    if (!input || !input.value.trim()) {
      showToast(langText("Scrivi un messaggio prima di inviare.", "Write a message before sending."));
      return;
    }
    const conversationIndex = chats.findIndex(function (thread) { return thread.id === curChat; });
    if (conversationIndex === -1) {
      return;
    }
    const conversation = normalizeChatThread(chats[conversationIndex]);
    const messageText = input.value.trim();
    conversation.msgs.push({
      id: createId("msg"),
      from: "me",
      text: messageText,
      time: langText("Ora", "Now"),
      at: Date.now()
    });
    conversation.updatedAt = Date.now();
    chats[conversationIndex] = conversation;
    input.value = "";
    persistChats();
    openChatById(curChat);
    const counterparty = conversation.with || normalizeChatParticipant(null, langText("Member", "Member"), "");
    ensureSellerEmail(counterparty);
    createNotification({
      audience: "user",
      kind: "message",
      title: langText("Nuovo messaggio", "New message"),
      body: messageText,
      recipientEmail: counterparty.email,
      conversationId: conversation.id,
      scope: getChatConversationScope(conversation)
    });
    enqueueEmail("new-message", counterparty.email, { preview: messageText });
    renderNotifications();
  };

  function buildCheckoutDraft() {
    const user = state.currentUser || {};
    const defaultAddress = (user.addresses || []).find(function (address) { return address.isDefault; }) || (user.addresses || [])[0] || {};
    const defaultPayment = (user.paymentMethods || []).find(function (method) { return method.isDefault; }) || (user.paymentMethods || [])[0] || {};
    return Object.assign({
      name: defaultAddress.name || user.name || "",
      address: defaultAddress.address || user.address || "",
      city: defaultAddress.city || user.city || "",
      country: defaultAddress.country || user.country || getWorkspaceDefaultCountry(),
      note: "",
      shippingMethod: langText("Spedizione assicurata", "Insured shipping"),
      shippingFee: SHIPPING_COST,
      paymentMethodId: defaultPayment.id || "prototype-manual",
      paymentLabel: defaultPayment.id ? `${defaultPayment.brand} •••• ${defaultPayment.last4}` : langText("Prototype checkout", "Prototype checkout")
    }, state.checkoutDraft || {});
  }

  function saveCheckoutDraftFromFields() {
    state.checkoutDraft = Object.assign({}, state.checkoutDraft || {}, {
      name: qs("#checkoutName") ? qs("#checkoutName").value.trim() : state.checkoutDraft.name,
      address: qs("#checkoutAddress") ? qs("#checkoutAddress").value.trim() : state.checkoutDraft.address,
      city: qs("#checkoutCity") ? qs("#checkoutCity").value.trim() : state.checkoutDraft.city,
      country: qs("#checkoutCountry") ? qs("#checkoutCountry").value.trim() : state.checkoutDraft.country,
      note: qs("#checkoutNote") ? qs("#checkoutNote").value.trim() : state.checkoutDraft.note,
      shippingMethod: qs("#checkoutShippingMethod") ? qs("#checkoutShippingMethod").value : state.checkoutDraft.shippingMethod,
      shippingFee: qs("#checkoutShippingFee") ? Number(qs("#checkoutShippingFee").value || SHIPPING_COST) : state.checkoutDraft.shippingFee,
      paymentLabel: qs("#checkoutPaymentLabel") ? qs("#checkoutPaymentLabel").value.trim() : state.checkoutDraft.paymentLabel
    });
  }

  function setCheckoutStep(step) {
    saveCheckoutDraftFromFields();
    state.checkoutStep = step;
    renderCheckoutModal();
  }

  function nextCheckoutStep() {
    saveCheckoutDraftFromFields();
    const currentIndex = CHECKOUT_STEPS.indexOf(state.checkoutStep);
    if (currentIndex === 0) {
      if (!state.checkoutDraft.name || !state.checkoutDraft.address || !state.checkoutDraft.city || !state.checkoutDraft.country) {
        showToast(langText("Completa i dati di spedizione.", "Complete shipping data."));
        return;
      }
    }
    state.checkoutStep = CHECKOUT_STEPS[Math.min(CHECKOUT_STEPS.length - 1, currentIndex + 1)];
    renderCheckoutModal();
  }

  function prevCheckoutStep() {
    saveCheckoutDraftFromFields();
    const currentIndex = CHECKOUT_STEPS.indexOf(state.checkoutStep);
    state.checkoutStep = CHECKOUT_STEPS[Math.max(0, currentIndex - 1)];
    renderCheckoutModal();
  }

  function finalizeCheckout(success) {
    saveCheckoutDraftFromFields();
    if (!success) {
      state.checkoutStatus = "failed";
      renderCheckoutModal();
      return;
    }
    syncCurrentUserWorkspace({
      name: state.checkoutDraft.name,
      address: state.checkoutDraft.address,
      city: state.checkoutDraft.city,
      country: state.checkoutDraft.country
    });
    const order = createOrderFromCheckout(state.checkoutItems, {
      name: state.checkoutDraft.name,
      address: state.checkoutDraft.address,
      city: state.checkoutDraft.city,
      country: state.checkoutDraft.country,
      note: state.checkoutDraft.note
    });
    order.shipping.method = state.checkoutDraft.shippingMethod || order.shipping.method;
    order.shippingCost = Number(state.checkoutDraft.shippingFee || SHIPPING_COST);
    order.total = order.subtotal + order.shippingCost;
    state.orders.unshift(order);
    notifyNewOrder(order);
    persistOrders();
    syncInventoryFromOrders();
    if (state.checkoutSource === "cart") {
      state.cart = [];
      persistCart();
      updateCartBadge();
    }
    state.activeOrderId = order.id;
    state.checkoutStatus = "success";
    renderCartDrawer();
    renderProfilePanel();
    renderOpsView();
    renderNotifications();
    syncSessionUi();
    renderCheckoutModal();
  }

  openCheckout = function (source, productId) {
    if (!state.currentUser) {
      requireAuth(function () {
        openCheckout(source, productId);
      });
      return;
    }
    state.checkoutSource = source || "cart";
    state.checkoutStatus = null;
    state.checkoutStep = "address";
    if (state.checkoutSource === "buyNow") {
      const product = getListingById(productId);
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
    state.checkoutDraft = buildCheckoutDraft();
    renderCheckoutModal();
    qs("#irisxCheckoutModal").classList.add("open");
  };

  renderCheckoutModal = function () {
    const modal = qs("#irisxCheckoutModal");
    if (!modal) {
      return;
    }
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", langText("Checkout sicuro", "Secure checkout"));
    const items = state.checkoutItems || [];
    if (!items.length && !state.checkoutStatus) {
      modal.innerHTML = "";
      return;
    }
    const draft = buildCheckoutDraft();
    state.checkoutDraft = draft;
    const subtotal = getCartSubtotal(items);
    const shippingFee = Number(draft.shippingFee || SHIPPING_COST);
    const total = subtotal + shippingFee;
    const stepLabels = {
      address: langText("Indirizzo", "Address"),
      shipping: langText("Spedizione", "Shipping"),
      payment: langText("Pagamento", "Payment"),
      review: langText("Riepilogo", "Review"),
      confirmation: langText("Conferma", "Confirm")
    };
    const stepsHtml = CHECKOUT_STEPS.map(function (step, index) {
      const active = step === state.checkoutStep;
      const completed = CHECKOUT_STEPS.indexOf(state.checkoutStep) > index;
      const label = stepLabels[step] || step;
      return `<div class="irisx-checkout-step${active ? " on" : ""}${completed ? " done" : ""}"><span>${index + 1}</span><strong>${escapeHtml(label)}</strong></div>`;
    }).join("");
    const summary = items.map(function (entry) {
      return `<div class="irisx-summary-item"><span><strong>${escapeHtml(entry.product.name)}</strong><br>${escapeHtml(entry.product.brand)} · ${t("qty")}: ${entry.qty}</span><span>${escapeHtml(formatCurrency(entry.product.price * entry.qty))}</span></div>`;
    }).join("");

    let body = "";
    if (state.checkoutStatus === "success") {
      body = `<div class="irisx-state-panel success">
        <strong>${langText("Pagamento riuscito!", "Payment successful!")}</strong>
        <span>${langText("Il tuo ordine è stato creato con successo! Riceverai una conferma via email.", "Your order has been created successfully! You will receive a confirmation email.")}</span>
        <div class="irisx-actions"><button class="irisx-primary" onclick="closeCheckout();showBuyView('profile');setBuyerSection('order_detail','${state.activeOrderId}')">${langText("Vedi ordine", "View order")}</button><button class="irisx-secondary" onclick="closeCheckout();showBuyView('shop')">${langText("Continua", "Continue")}</button></div>
      </div>`;
    } else if (state.checkoutStatus === "failed") {
      body = `<div class="irisx-state-panel error">
        <strong>${langText("Pagamento non riuscito", "Payment failed")}</strong>
        <span>${langText("Si è verificato un errore con il pagamento. Riprova o scegli un altro metodo.", "A payment error occurred. Please try again or choose another method.")}</span>
        <div class="irisx-actions"><button class="irisx-primary" onclick="state.checkoutStatus=null;state.checkoutStep='payment';renderCheckoutModal()">${langText("Riprova", "Retry")}</button><button class="irisx-secondary" onclick="closeCheckout()">${langText("Chiudi", "Close")}</button></div>
      </div>`;
    } else if (state.checkoutStep === "address") {
      body = `<div class="irisx-form-grid">
        <div class="irisx-field"><label for="checkoutName">${t("shipping_name")}</label><input id="checkoutName" type="text" value="${escapeHtml(draft.name || "")}"></div>
        <div class="irisx-field"><label for="checkoutAddress">${t("shipping_address")}</label><input id="checkoutAddress" type="text" value="${escapeHtml(draft.address || "")}"></div>
        <div class="irisx-account-row">
          <div class="irisx-field"><label for="checkoutCity">${t("shipping_city")}</label><input id="checkoutCity" type="text" value="${escapeHtml(draft.city || "")}"></div>
          <div class="irisx-field"><label for="checkoutCountry">${t("shipping_country")}</label><input id="checkoutCountry" type="text" value="${escapeHtml(draft.country || "")}"></div>
        </div>
        <div class="irisx-field"><label for="checkoutNote">${t("shipping_note")}</label><textarea id="checkoutNote">${escapeHtml(draft.note || "")}</textarea></div>
      </div>`;
    } else if (state.checkoutStep === "shipping") {
      body = `<div class="irisx-form-grid">
        <div class="irisx-field"><label for="checkoutShippingMethod">${langText("Metodo di spedizione", "Shipping method")}</label><select id="checkoutShippingMethod"><option ${draft.shippingMethod === langText("Spedizione assicurata", "Insured shipping") ? "selected" : ""}>${langText("Spedizione assicurata", "Insured shipping")}</option><option ${draft.shippingMethod === langText("Spedizione espressa assicurata", "Express insured") ? "selected" : ""}>${langText("Spedizione espressa assicurata", "Express insured")}</option></select></div>
        <div class="irisx-field"><label for="checkoutShippingFee">${langText("Costo spedizione", "Shipping fee")}</label><input id="checkoutShippingFee" type="number" value="${escapeHtml(String(shippingFee))}"></div>
        <div class="irisx-note">${langText("Seleziona il metodo di spedizione preferito.", "Select your preferred shipping method.")}</div>
      </div>`;
    } else if (state.checkoutStep === "payment") {
      body = `<div class="irisx-form-grid">
        <div class="irisx-field"><label for="checkoutPaymentLabel">${langText("Metodo di pagamento", "Payment method")}</label><input id="checkoutPaymentLabel" type="text" value="${escapeHtml(draft.paymentLabel || "")}"></div>
        <div class="irisx-note">${langText("Seleziona il metodo di pagamento. Il pagamento è protetto da IRIS.", "Select your payment method. Payment is protected by IRIS.")}</div>
      </div>`;
    } else if (state.checkoutStep === "review") {
      body = `<div class="irisx-checkout-review">
        <div class="irisx-kicker">${langText("Dettagli acquisto", "Purchase details")}</div>
        <div class="irisx-card-stack">
          <div class="irisx-inline-card"><div><strong>${langText("Indirizzo di spedizione", "Shipping address")}</strong><span>${escapeHtml([draft.name, draft.address, draft.city, draft.country].filter(Boolean).join(" · ")) || escapeHtml(langText("Da completare", "To complete"))}</span></div></div>
          <div class="irisx-inline-card"><div><strong>${langText("METODO DI SPEDIZIONE", "SHIPPING METHOD")}</strong><span>${escapeHtml(draft.shippingMethod || langText("Da selezionare", "To select"))}</span></div><em>${escapeHtml(formatCurrency(shippingFee))}</em></div>
          <div class="irisx-inline-card"><div><strong>${langText("METODO DI PAGAMENTO", "PAYMENT METHOD")}</strong><span>${escapeHtml(draft.paymentLabel || langText("Da selezionare", "To select"))}</span></div></div>
        </div>
      </div>`;
    } else {
      body = `<div class="irisx-state-panel">
        <strong>${langText("Conferma ordine", "Order confirmation")}</strong>
        <span>${langText("Rivedi i dettagli e conferma il tuo acquisto.", "Review the details and confirm your purchase.")}</span>
      </div>`;
    }

    const primaryAction = state.checkoutStatus
      ? ""
      : state.checkoutStep === "confirmation"
        ? `<button class="irisx-primary" onclick="finalizeCheckout(true)">${langText("Conferma e paga", "Confirm and pay")}</button>`
        : `<button class="irisx-primary" onclick="nextCheckoutStep()">${state.checkoutStep === "review" ? langText("Vai alla conferma", "Go to confirmation") : langText("Continua", "Continue")}</button>`;
    const secondaryAction = state.checkoutStatus
      ? ""
      : state.checkoutStep === "confirmation"
        ? `<button class="irisx-secondary" onclick="finalizeCheckout(false)">${langText("Annulla", "Cancel")}</button>`
        : CHECKOUT_STEPS.indexOf(state.checkoutStep) > 0
          ? `<button class="irisx-secondary" onclick="prevCheckoutStep()">${langText("Indietro", "Back")}</button>`
          : `<button class="irisx-secondary" onclick="closeCheckout()">${langText("Annulla", "Cancel")}</button>`;

    modal.innerHTML = `<div class="irisx-modal-backdrop"></div><div class="irisx-modal-card irisx-modal-card--wide">
      <div class="irisx-card-head">
        <div>
          <div class="irisx-kicker">${langText("Acquisto sicuro · IRIS", "Secure checkout · IRIS")}</div>
          <div class="irisx-title">${t("checkout_title")}</div>
          <div class="irisx-subtitle">${langText("Inserisci i tuoi dati per completare l'acquisto in sicurezza.", "Enter your details to complete the purchase securely.")}</div>
        </div>
        <button class="irisx-close" onclick="closeCheckout()">✕</button>
      </div>
      <div class="irisx-card-body">
        ${state.checkoutStatus ? "" : `<div class="irisx-checkout-stepper">${stepsHtml}</div>`}
        <div class="irisx-checkout-shell">
          <div class="irisx-checkout-main">${body}</div>
          <aside class="irisx-checkout-summary">
            <div class="irisx-kicker">${t("order_summary")}</div>
            <div class="irisx-summary-items">${summary}</div>
            <div class="irisx-checkout-row"><span>${langText("Subtotale", "Subtotal")}</span><strong>${escapeHtml(formatCurrency(subtotal))}</strong></div>
            <div class="irisx-checkout-row"><span>${langText("Spedizione", "Shipping")}</span><strong>${escapeHtml(formatCurrency(shippingFee))}</strong></div>
            <div class="irisx-checkout-row total"><span>${t("cart_total")}</span><strong>${escapeHtml(formatCurrency(total))}</strong></div>
          </aside>
        </div>
        <div class="irisx-actions">${primaryAction}${secondaryAction}${!state.checkoutStatus ? `<button class="irisx-secondary" onclick="closeCheckout()">${langText("Chiudi", "Close")}</button>` : ""}</div>
      </div>
    </div>`;
  };

  submitCheckout = function () {
    if (state.checkoutStep !== "confirmation") {
      nextCheckoutStep();
      return;
    }
    finalizeCheckout(true);
  };

  function getMeasurementRequestRecord(listingId) {
    if (!state.currentUser || !listingId) {
      return null;
    }
    return state.measurementRequests.find(function (request) {
      return String(request.listingId) === String(listingId) &&
        normalizeEmail(request.requesterEmail) === normalizeEmail(state.currentUser.email);
    }) || null;
  }

  function requestMeasurementsForListing(listingId) {
    requireAuth(function () {
      const listing = getListingById(listingId);
      if (!listing || (listing.measurements && Object.keys(listing.measurements || {}).length)) {
        return;
      }
      const existing = getMeasurementRequestRecord(listingId);
      if (existing) {
        showToast(langText("Richiesta misure già inviata.", "Measurements request already sent."));
        return;
      }
      const request = {
        id: createId("msr"),
        listingId: listing.id,
        requesterEmail: normalizeEmail(state.currentUser.email),
        requesterName: state.currentUser.name || langText("Cliente IRIS", "IRIS customer"),
        sellerEmail: normalizeEmail((listing.ownerEmail || (listing.seller && listing.seller.email) || "")),
        status: "open",
        createdAt: Date.now()
      };
      state.measurementRequests.unshift(request);
      persistMeasurementRequests();
      createNotification({
        audience: "user",
        kind: "support",
        title: langText("Richiesta misure ricevuta", "Measurements request received"),
        body: `${listing.brand} ${listing.name}`,
        recipientEmail: request.requesterEmail
      });
      createNotification({
        audience: "user",
        kind: "support",
        title: langText("Un buyer ha chiesto le misure", "A buyer requested measurements"),
        body: `${listing.brand} ${listing.name}`,
        recipientEmail: request.sellerEmail
      });
      if (qs("#detail-view.active")) {
        showDetail(listing.id);
      }
      renderProfilePanel();
      showToast(langText("Richiesta misure inviata al seller.", "Measurements request sent to the seller."));
    });
  }

  function getIssueOptions() {
    return [
      { id: "order_problem", it: "Problema ordine", en: "Order problem", severity: "support" },
      { id: "shipping_delay", it: "Ritardo spedizione", en: "Shipping delay", severity: "support" },
      { id: "lost_parcel", it: "Pacco smarrito", en: "Lost parcel", severity: "dispute" },
      { id: "wrong_item", it: "Articolo sbagliato", en: "Wrong item", severity: "dispute" },
      { id: "damaged_item", it: "Articolo danneggiato", en: "Item damaged", severity: "dispute" },
      { id: "item_not_as_described", it: "Articolo non conforme", en: "Item not as described", severity: "dispute" },
      { id: "missing_measurements", it: "Misure o dettagli mancanti", en: "Missing measurements or details", severity: "support" },
      { id: "payment_issue", it: "Problema pagamento", en: "Payment issue", severity: "support" },
      { id: "return_refund", it: "Reso o rimborso", en: "Return or refund issue", severity: "dispute" },
      { id: "authenticity_concern", it: "Dubbi di autenticità", en: "Authenticity concern", severity: "dispute" },
      { id: "other", it: "Altro", en: "Other support request", severity: "support" }
    ];
  }

  function getIssueLabel(issueId) {
    const issue = getIssueOptions().find(function (option) { return option.id === issueId; });
    return issue ? langText(issue.it, issue.en) : langText("Supporto", "Support");
  }

  function getTicketStatusLabel(status) {
    const labels = {
      open: { it: "Aperto", en: "Open" },
      in_review: { it: "In revisione", en: "In review" },
      resolved: { it: "Risolto", en: "Resolved" }
    };
    const meta = labels[status] || labels.open;
    return langText(meta.it, meta.en);
  }

  function getRelevantOrderForListing(listing) {
    if (!listing || !state.currentUser) {
      return null;
    }
    const currentEmail = normalizeEmail(state.currentUser.email);
    return state.orders.find(function (order) {
      return (normalizeEmail(order.buyerEmail) === currentEmail || order.sellerEmails.includes(currentEmail)) &&
        Array.isArray(order.items) &&
        order.items.some(function (item) { return String(item.productId) === String(listing.id); });
    }) || null;
  }

  function buildSupportContext(orderId, options) {
    const order = state.orders.find(function (candidate) { return String(candidate.id) === String(orderId); });
    if (!order) {
      return null;
    }
    const opts = options || {};
    const currentEmail = normalizeEmail((state.currentUser && state.currentUser.email) || "");
    const role = opts.role || (normalizeEmail(order.buyerEmail) === currentEmail ? "buyer" : "seller");
    const productRef = opts.productId
      ? (order.items || []).find(function (item) { return String(item.productId) === String(opts.productId); })
      : (order.items || [])[0];
    return {
      order: order,
      role: role,
      issueType: opts.issueType || "order_problem",
      issueSeverity: opts.issueSeverity || "support",
      product: productRef || null
    };
  }

  function renderMeasurementsSection(listing) {
    const categoryKey = (listing.categoryKey) || inferSellCategoryKey(listing);
    const subcategoryKey = (listing.subcategoryKey) || inferSellSubcategoryKey(listing, categoryKey);
    const schema = getMeasurementSchema(categoryKey, subcategoryKey);
    if (!schema || !Array.isArray(schema.fields) || !schema.fields.length) {
      return "";
    }
    const hasMeasurements = listing && listing.measurements && typeof listing.measurements === "object";
    const request = getMeasurementRequestRecord(listing && listing.id);
    const rows = schema.fields
      .filter(function (field) {
        const val = hasMeasurements ? listing.measurements[field.id] : "";
        return val !== undefined && val !== null && String(val).trim() !== "";
      })
      .map(function (field) {
        return `<div class="det-fit-item"><div class="det-fit-label">${escapeHtml(langText(field.it, field.en))}</div><div class="det-fit-value">${escapeHtml(String(listing.measurements[field.id]))} cm</div></div>`;
      });
    const title = schema.title ? langText(schema.title.it, schema.title.en) : langText("Misure", "Measurements");
    if (!rows.length) {
      const ownListing = isCurrentUserListingOwner(listing);
      return `<div class="det-section det-section--measurement-request">
        <div class="det-section-title">${escapeHtml(title)}</div>
        <div class="irisx-measurement-request-card">
          <div>
            <strong>${langText("Misure non ancora disponibili", "Measurements not available yet")}</strong>
            <span>${ownListing
              ? langText("Aggiungi misure precise per aumentare fiducia, conversione e qualità dell'annuncio.", "Add precise measurements to improve trust, conversion, and listing quality.")
              : langText("Possiamo chiedere al seller misure precise del capo o dell'accessorio.", "We can ask the seller for precise garment or accessory measurements.")}</span>
          </div>
          ${ownListing
            ? `<button class="irisx-secondary irisx-secondary--wide" onclick="loadDraftIntoSellForm(${inlineJsValue(listing.id)})">${langText("Aggiungi misure", "Add measurements")}</button>`
            : request
            ? `<div class="irisx-measurement-request-status">${langText("Richiesta inviata", "Request sent")} · ${escapeHtml(formatRelativeTime(request.createdAt))}</div>`
            : `<button class="irisx-secondary irisx-secondary--wide" onclick="requestMeasurementsForListing(${inlineJsValue(listing.id)})">${langText("Richiedi misure", "Request measurements")}</button>`}
        </div>
      </div>`;
    }
    return `<div class="det-section"><div class="det-section-title">${escapeHtml(title)}</div><div class="det-fit">${rows.join("")}</div></div>`;
  }

  function reportListing(productId) {
    const product = getListingById(productId);
    if (!product) {
      return;
    }
    createNotification({
      audience: "admin",
      kind: "support",
      title: langText("Segnalazione annuncio", "Listing report"),
      body: `${product.brand} ${product.name}`,
      recipientEmail: PLATFORM_CONFIG.ownerEmail
    });
    showToast(langText("Segnalazione inviata all'owner.", "Report sent to the owner."));
  }

  getDetailActionsMarkup = function (product, liked) {
    const productIdExpr = inlineJsValue(product.id);
    const seller = buildListingSeller(product);
    const sellerIdExpr = inlineJsValue(seller.id);
    const ownListing = isCurrentUserListingOwner(product);
    const relatedOrder = getRelevantOrderForListing(product);
    const favoriteLabel = liked ? t("saved_fav") : t("add_fav");
    const favoriteIcon = liked ? "♥" : "♡";
    const minimumOfferLine = product.minimumOfferAmount !== null && product.minimumOfferAmount !== undefined
      ? `${langText("Offerta minima", "Minimum offer")}: ${formatCurrency(product.minimumOfferAmount)}`
      : langText("Il seller accetta offerte vincolanti con pre-autorizzazione pagamento.", "The seller accepts binding offers with payment pre-authorization.");
    if (!isProductPurchasable(product)) {
      return `<div class="irisx-sold-state-card">
        <div class="irisx-kicker">${langText("Articolo venduto", "Item sold")}</div>
        <strong>${langText("Questa inserzione resta disponibile come riferimento e storico IRIS.", "This listing remains available as a reference and part of the IRIS history.")}</strong>
        <span>${langText("Troverai dettagli, seller card, protezioni e assistenza collegata se l'ordine ti appartiene.", "You can still view details, seller information, protections, and linked support if the order belongs to you.")}</span>
      </div>
      <div class="irisx-detail-action-stack irisx-detail-action-stack--compact">
        <div class="irisx-detail-secondary-actions irisx-detail-secondary-actions--sold">
          <button class="det-fav irisx-detail-fav-pill" onclick="toggleFav(${productIdExpr},null)"><span>${favoriteIcon}</span><span>${favoriteLabel}</span></button>
          ${relatedOrder ? `<button class="irisx-secondary" onclick="openSupportModal('${escapeHtml(relatedOrder.id)}', { productId: '${escapeHtml(product.id)}', issueType: 'order_problem' })">${langText("Supporto ordine", "Order support")}</button>` : `<button class="irisx-secondary" onclick="reportListing(${productIdExpr})">${langText("Segnala", "Report")}</button>`}
        </div>
        ${relatedOrder ? `<div class="irisx-note irisx-note--compact">${langText("Hai acquistato o gestito questo ordine su IRIS: puoi aprire assistenza o disputa senza reinserire i dati del prodotto.", "You bought or handled this order on IRIS: support and disputes already include the product context.")}</div>` : ""}
      </div>`;
    }
    if (ownListing) {
      return `<div class="irisx-note irisx-note--owner">${langText("Stai guardando un tuo annuncio. Da qui puoi gestirlo, ma non comprarlo o fare offerte.", "You are viewing your own listing. From here you can manage it, but not buy it or make offers.")}</div>
      <div class="irisx-detail-action-stack">
        <button class="det-buy" onclick="loadDraftIntoSellForm(${productIdExpr})">${langText("Modifica annuncio", "Edit listing")}</button>
        <div class="irisx-detail-secondary-actions irisx-detail-secondary-actions--owner">
          <button class="irisx-secondary" onclick="showBuyView('profile');setProfileArea('seller','active')">${langText("Area vendite", "Seller area")}</button>
          <button class="irisx-secondary" onclick="toggleListingOffers(${productIdExpr})">${product.offersEnabled ? langText("Disattiva offerte", "Disable offers") : langText("Attiva offerte", "Enable offers")}</button>
        </div>
        <div class="irisx-detail-utility-actions irisx-detail-utility-actions--compact"><button class="det-fav irisx-detail-fav-pill" onclick="toggleFav(${productIdExpr},null)"><span>${favoriteIcon}</span><span>${favoriteLabel}</span></button></div>
        <div class="irisx-note irisx-note--compact">${product.offersEnabled ? minimumOfferLine : langText("Le offerte sono disattivate su questo annuncio.", "Offers are disabled on this listing.")}</div>
      </div>`;
    }
    const secondaryPrimaryButtons = [];
    if (product.offersEnabled) {
      secondaryPrimaryButtons.push(`<button class="det-offer" onclick="openOffer(${productIdExpr})">${t("make_offer")}</button>`);
    }
    secondaryPrimaryButtons.push(`<button class="irisx-secondary" onclick="addToCart(${productIdExpr})">${t("add_to_cart")}</button>`);
    const offerNote = product.offersEnabled
      ? minimumOfferLine
      : langText("Questo seller ha disattivato le offerte su questo articolo.", "This seller has disabled offers on this listing.");
    return `<div class="irisx-detail-action-stack">
      <button class="det-buy" onclick="buyNow(${productIdExpr})">${t("buy_now")} · ${formatCurrency(product.price)}</button>
      <div class="irisx-detail-secondary-actions">
        ${secondaryPrimaryButtons.join("")}
      </div>
      <div class="irisx-detail-utility-actions">
        <button class="det-fav irisx-detail-fav-pill" onclick="toggleFav(${productIdExpr},null)"><span>${favoriteIcon}</span><span>${favoriteLabel}</span></button>
        <button class="irisx-secondary" onclick="openChat(${sellerIdExpr},${productIdExpr})">${t("chat")}</button>
        <button class="irisx-link-btn" onclick="reportListing(${productIdExpr})">${langText("Segnala", "Report")}</button>
      </div>
    </div>${offerNote}`;
  };

  showDetail = function (id) {
    const product = getListingById(id);
    if (!product) {
      return;
    }

    bumpViewSyncToken();
    closeProfileMenu();
    closeMobileNav();
    closeMobileFilters();
    ["home-view", "shop-view", "fav-view", "chat-view", "profile-view", "seller-view", "ops-view"].forEach(function (viewId) {
      const view = qs("#" + viewId);
      if (view) {
        view.classList.remove("active", "view-enter");
      }
    });
    state.activeDetailImage = 0;
    state.activeDetailListingId = product.id;
    const discount = getListingDiscount(product);
    const liked = favorites.has(product.id);
    const fitLabel = getFacetLabel("fits", product.fit === "—" ? "—" : product.fit);
    const colorLabel = getFacetLabel("colors", product.color);
    const conditionLabel = getFacetLabel("conds", product.cond);
    const originalPrice = getListingOriginalPrice(product);
    const sizeDisplay = getListingDisplaySize(product);
    const sizeOriginalMarkup = product.sizeOriginal
      ? `<div class="det-fit-item"><div class="det-fit-label">${langText("Etichetta originale", "Original label")}</div><div class="det-fit-value">${escapeHtml(product.sizeOriginal)}</div></div>`
      : "";
    const viewerOwnsListing = isCurrentUserListingOwner(product);
    const chips = getListingChips(product);
    const seller = buildListingSeller(product);
    const trustMeta = getListingTrustMeta(product);
    const relatedOrder = getRelevantOrderForListing(product);
    const sellerIdExpr = inlineJsValue(seller.id);
    const productIdExpr = inlineJsValue(product.id);
    const sellerPrimaryAction = viewerOwnsListing
      ? `<button class="seller-chat" onclick="event.stopPropagation();loadDraftIntoSellForm(${productIdExpr})">${langText("Modifica", "Edit")}</button>`
      : `<button class="seller-chat" onclick="event.stopPropagation();openChat(${sellerIdExpr},${productIdExpr})">${t("chat")}</button>`;
    const sellerCardClick = viewerOwnsListing
      ? `showBuyView('profile');setProfileArea('seller','active')`
      : `showSeller('${escapeHtml(seller.id)}')`;
    const similar = prods.filter(function (item) { return !sameEntityId(item.id, product.id) && (item.brand === product.brand || item.cat === product.cat); }).slice(0, 4);
    const detailShippingTrustMarkup = `<div class="irisx-detail-core-grid">
      <div class="irisx-inline-card"><div><strong>${langText("Spedizione tracciata", "Tracked shipping")}</strong><span>${langText("Assicurata e monitorata da IRIS.", "Insured and monitored by IRIS.")}</span></div><em>${formatCurrency(SHIPPING_COST)}</em></div>
      <div class="irisx-inline-card"><div><strong>${langText("Offerte", "Offers")}</strong><span>${product.offersEnabled ? (product.minimumOfferAmount ? `${langText("Offerta minima", "Minimum offer")}: ${formatCurrency(product.minimumOfferAmount)}` : langText("Offerte attive", "Offers active")) : langText("Offerte disattivate", "Offers disabled")}</span></div></div>
      <div class="irisx-inline-card irisx-inline-card--trust"><div><strong>${langText("Trust IRIS", "IRIS trust")}</strong><span>${trustMeta.verified ? langText("Autenticato da IRIS con protezione acquisto.", "Authenticated by IRIS with purchase protection.") : langText("Checkout protetto e assistenza premium disponibili.", "Protected checkout and premium support available.")}</span></div></div>
    </div>`;
    const sellerTrustBadges = [
      isVerifiedSellerProfile(seller) ? langText("Seller verificato", "Verified seller") : "",
      `${seller.sales} ${t("sales")}`,
      `★ ${seller.rating}`
    ].filter(Boolean).map(function (label) {
      return `<span class="irisx-seller-badge">${escapeHtml(label)}</span>`;
    }).join("");
    const soldSupportMarkup = !isProductPurchasable(product) && relatedOrder
      ? `<div class="irisx-detail-service-card irisx-detail-service-card--issue">
          <div class="det-section-title">${langText("Supporto post-vendita", "Post-sale support")}</div>
          <p>${langText("Questo articolo è legato a un ordine IRIS. Supporto e dispute vengono agganciati automaticamente a ordine, prodotto e controparte.", "This item is linked to an IRIS order. Support and disputes automatically attach order, product, and counterparty context.")}</p>
          <div class="irisx-actions">
            <button class="irisx-primary" onclick="openSupportModal('${escapeHtml(relatedOrder.id)}', { productId: '${escapeHtml(product.id)}', issueType: 'order_problem' })">${langText("Contatta supporto", "Contact support")}</button>
            <button class="irisx-secondary" onclick="openSupportModal('${escapeHtml(relatedOrder.id)}', { productId: '${escapeHtml(product.id)}', issueSeverity: 'dispute', issueType: 'authenticity_concern' })">${langText("Apri disputa", "Open dispute")}</button>
          </div>
        </div>`
      : "";
    const detailView = qs("#detail-view");
    detailView.innerHTML = `<div class="irisx-detail-page view-enter">
      <section class="det-layout det-layout--hero">
        <div class="det-imgs">${detailMediaMarkup(product)}</div>
        <div class="det-body">
          <section class="irisx-detail-hero-panel">
            <div class="irisx-detail-breadcrumb"><button onclick="closeDetail()">${langText("Home", "Home")}</button><span>/</span><button onclick="showBuyView('shop')">${langText("Shop", "Shop")}</button><span>/</span><strong>${escapeHtml(product.brand)}</strong></div>
            <button class="det-back" onclick="closeDetail()">${t("back_shop")}</button>
            <div class="det-brand">${escapeHtml(product.brand)}</div>
            <div class="det-name">${escapeHtml(product.name)}</div>
            <div class="det-prices"><span class="det-price">${formatCurrency(product.price)}</span><span class="det-orig">${formatCurrency(originalPrice)}</span>${discount ? `<span class="det-save">-${discount}%</span>` : ""}</div>
            ${getDetailActionsMarkup(product, liked)}
            ${detailShippingTrustMarkup}
            <div class="det-section det-section--seller"><div class="det-section-title">${viewerOwnsListing ? langText("Gestione annuncio", "Listing management") : t("seller")}</div><div class="seller-card seller-card--elevated" onclick="${sellerCardClick}"><div class="seller-av">${escapeHtml(seller.avatar)}</div><div class="seller-info"><div class="seller-name">${escapeHtml(seller.name)}</div><div class="seller-meta">${escapeHtml(seller.city)} · ${escapeHtml(langText("Risposta premium IRIS", "Premium IRIS support"))}</div><div class="irisx-seller-badges">${sellerTrustBadges}</div></div>${sellerPrimaryAction}</div></div>
          </section>
        </div>
      </section>
      <section class="irisx-detail-lower">
        <div class="irisx-detail-lower-grid">
          <div class="irisx-detail-lower-main">
            <div class="det-section"><div class="det-section-title">${t("details")}</div><div class="det-chips">${chips.map(function (chip) { return `<span class="det-chip">${escapeHtml(chip)}</span>`; }).join("")}</div></div>
            <div class="det-section"><div class="det-section-title">${t("fit_dims")}</div><div class="det-fit"><div class="det-fit-item"><div class="det-fit-label">${t("size")}</div><div class="det-fit-value">${escapeHtml(sizeDisplay)}</div></div>${sizeOriginalMarkup}<div class="det-fit-item"><div class="det-fit-label">${t("fit_label")}</div><div class="det-fit-value">${escapeHtml(product.fit === "—" ? t("not_available") : fitLabel)}</div></div><div class="det-fit-item"><div class="det-fit-label">${t("color")}</div><div class="det-fit-value">${escapeHtml(colorLabel)}</div></div><div class="det-fit-item"><div class="det-fit-label">${t("dimensions")}</div><div class="det-fit-value">${escapeHtml(product.dims)}</div></div><div class="det-fit-item"><div class="det-fit-label">${t("material")}</div><div class="det-fit-value">${escapeHtml(product.material)}</div></div><div class="det-fit-item"><div class="det-fit-label">${t("condition")}</div><div class="det-fit-value">${escapeHtml(conditionLabel)}</div></div></div></div>
            ${renderMeasurementsSection(product)}
            <div class="det-section"><div class="det-section-title">${t("description")}</div><div class="det-desc">${escapeHtml(product.desc)}</div></div>
          </div>
          <aside class="irisx-detail-lower-side">
            <div class="det-section"><div class="det-section-title">${langText("Servizi IRIS", "IRIS services")}</div><div class="irisx-trust-grid"><div class="irisx-inline-card"><div><strong>${langText("Autenticazione standard", "Standard authentication")}</strong><span>${formatCurrency(15)}</span></div></div><div class="irisx-inline-card"><div><strong>${langText("Autenticazione premium", "Premium authentication")}</strong><span>${formatCurrency(20)}</span></div></div><div class="irisx-inline-card"><div><strong>${langText("Certificato digitale", "Digital certificate")}</strong><span>${trustMeta.certificateCode ? escapeHtml(trustMeta.certificateCode) : langText("Disponibile dopo autenticazione", "Available after authentication")}</span></div></div></div></div>
            <div class="det-auth"><div class="det-auth-t">${t("guarantee")}</div><ul><li>${t("auth_1")}</li><li>${t("auth_2")}</li><li>${t("auth_3")}</li><li>${t("auth_4")}</li><li>${langText("Seller verification, assistenza veloce e concierge selling pronti a supporto del venduto.", "Seller verification, fast support, and concierge selling ready to support each order.")}</li><li><button class="irisx-link-btn" onclick="openStatic('buyer-protection')">${langText("Protezione Acquirente", "Buyer Protection")}</button></li></ul></div>
            ${soldSupportMarkup}
          </aside>
        </div>
        ${similar.length ? `<div class="det-similar"><div class="det-similar-title">${t("similar")}</div><div class="det-similar-grid">${similar.map(function (item) { return `<div class="pc" onclick="showDetail(${inlineJsValue(item.id)})" style="min-width:160px">${productVisualMarkup(item, true)}<div class="pinfo" style="padding:.8rem"><div class="p-brand">${escapeHtml(item.brand)}</div><div class="p-name" style="font-size:.78rem">${escapeHtml(item.name)}</div><div class="p-price" style="font-size:.78rem;margin-top:.3rem">${formatCurrency(item.price)}</div></div></div>`; }).join("")}</div></div>` : ""}
      </section>
    </div>`;
    qs("#shop-view").style.display = "none";
    detailView.style.paddingTop = window.innerWidth > 900
      ? ""
      : `${((qs("#topnav") && qs("#topnav").offsetHeight) || 64) + 18}px`;
    detailView.style.display = "block";
    detailView.classList.add("active");
    syncTopnavChrome("detail");
    window.scrollTo(0, 0);
    updateMeta("IRIS - " + product.brand + " " + product.name, product.desc.substring(0, 160));
  };

  footerHTML = function () {
    return `<footer class="site-footer">
      <div class="footer-grid">
        <div><div class="footer-brand">IRIS</div><div class="footer-desc">${langText("Il marketplace italiano per la moda di lusso. Compra e vendi pezzi firmati autenticati.", "The Italian marketplace for luxury fashion. Buy and sell authenticated designer pieces.")}</div></div>
        <div><div class="footer-col-title">${langText("Marketplace", "Marketplace")}</div><ul class="footer-links"><li><a href="#" onclick="event.preventDefault();showBuyView('shop')">${langText("Shop", "Shop")}</a></li><li><a href="#" onclick="event.preventDefault();showPage('sell')">${langText("Vendi", "Sell")}</a></li><li><a href="#" onclick="event.preventDefault();showBuyView('profile');setProfileArea('buyer','orders')">${langText("Area acquirente", "Buyer area")}</a></li><li><a href="#" onclick="event.preventDefault();showBuyView('profile');setProfileArea('seller','dashboard')">${langText("Area venditore", "Seller area")}</a></li></ul></div>
        <div><div class="footer-col-title">${langText("Fiducia", "Trust")}</div><ul class="footer-links"><li><a href="#" onclick="event.preventDefault();openStatic('trust-authentication')">${langText("Autenticazione", "Authentication")}</a></li><li><a href="#" onclick="event.preventDefault();openStatic('buyer-protection')">${langText("Protezione acquirente", "Buyer Protection")}</a></li><li><a href="#" onclick="event.preventDefault();openStatic('seller-protection')">${langText("Protezione venditore", "Seller Protection")}</a></li><li><a href="#" onclick="event.preventDefault();openStatic('community-guidelines')">${langText("Linee guida", "Community Guidelines")}</a></li></ul></div>
        <div><div class="footer-col-title">${langText("Normative", "Policies")}</div><ul class="footer-links"><li><a href="#" onclick="event.preventDefault();openStatic('shipping-policy')">${langText("Politica spedizioni", "Shipping Policy")}</a></li><li><a href="#" onclick="event.preventDefault();openStatic('refund-policy')">${langText("Resi e rimborsi", "Refund / Return Policy")}</a></li><li><a href="#" onclick="event.preventDefault();openStatic('prohibited-items')">${langText("Articoli vietati", "Prohibited Items")}</a></li><li><a href="#" onclick="event.preventDefault();openStatic('privacy')">${t("footer_privacy")}</a></li></ul></div>
      </div>
      <div class="footer-bottom"><div class="footer-copy">© 2026 IRIS S.r.l.</div><div class="footer-legal"><a href="#" onclick="event.preventDefault();openStatic('terms')">${t("footer_terms")}</a><a href="#" onclick="event.preventDefault();openStatic('privacy')">${t("footer_privacy")}</a><a href="#" onclick="event.preventDefault();openStatic('community-guidelines')">${langText("Linee guida", "Community Guidelines")}</a></div></div>
    </footer>`;
  };

  renderFooters = function () {
    qsa(".dyn-footer").forEach(function (node) {
      node.remove();
    });
    const buyPage = qs("#page-buy");
    if (buyPage) {
      buyPage.insertAdjacentHTML("beforeend", `<div class="dyn-footer">${footerHTML()}</div>`);
    }
    const sellPage = qs("#page-sell");
    if (sellPage) {
      sellPage.insertAdjacentHTML("beforeend", `<div class="dyn-footer">${footerHTML()}</div>`);
    }
  };

  function ensurePolicyModals() {
    Object.keys(POLICY_PAGE_CONTENT).forEach(function (id) {
      if (qs("#modal-" + id)) {
        return;
      }
      const page = POLICY_PAGE_CONTENT[id];
      document.body.insertAdjacentHTML("beforeend", `<div class="static-modal" id="modal-${id}">
        <button class="sm-close" onclick="closeStatic('${id}')">✕</button>
        <div class="sm-inner">
          <div class="sm-title">${escapeHtml(page.title)}</div>
          <div class="sm-subtitle">${escapeHtml(page.subtitle)}</div>
          ${page.sections.map(function (section) {
            return `<div class="sm-section"><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.body)}</p></div>`;
          }).join("")}
        </div>
      </div>`);
    });
  }

  function syncFeeCopy() {
    const selfFee = Math.round(PLATFORM_CONFIG.selfServeFeeRate * 100);
    const conciergeFee = Math.round(PLATFORM_CONFIG.conciergeFeeRate * 100);
    const choiceLabel = qs("#choice .ch-s .ch-lbl");
    if (choiceLabel) {
      choiceLabel.textContent = langText(`Da solo al ${selfFee}% · Concierge al ${conciergeFee}%`, `Self-serve at ${selfFee}% · Concierge at ${conciergeFee}%`);
    }
    const sellSub = qs(".sh-sub");
    if (sellSub) {
      sellSub.textContent = langText(`Da solo al ${selfFee}% · Oppure affidaci tutto al ${conciergeFee}% · Pagamento garantito`, `Self-serve at ${selfFee}% · Or let us handle everything at ${conciergeFee}% · Guaranteed payout`);
    }
    const diyCommission = qsa(".sp-commission")[0];
    if (diyCommission) {
      diyCommission.innerHTML = `${selfFee}<span>%</span>`;
    }
    const diyRadio = qs("#lbl-diy > div:first-of-type");
    if (diyRadio) {
      diyRadio.textContent = `${langText("Autonomo", "Self-serve")} · ${selfFee}%`;
    }
    const diyFeeNote = qs(".fee-note");
    if (diyFeeNote) {
      diyFeeNote.textContent = langText(`Commissione ${selfFee}% self-serve / ${conciergeFee}% concierge. Si paga solo al venduto.`, `${selfFee}% self-serve / ${conciergeFee}% concierge. Paid only when sold.`);
    }
    qsa("#modal-faq .faq-item").forEach(function (item) {
      const question = qs(".faq-q", item);
      const answer = qs(".faq-a p", item);
      if (question && answer && question.textContent.indexOf("Quanto costa") > -1) {
        answer.textContent = `IRIS applica ${selfFee}% per il percorso autonomo e ${conciergeFee}% per il percorso Concierge. La pubblicazione resta gratuita.`;
      }
    });
    qsa("#modal-terms .sm-section").forEach(function (section) {
      const heading = qs("h3", section);
      const paragraph = qs("p", section);
      if (heading && paragraph && heading.textContent.indexOf("Commissioni") > -1) {
        paragraph.textContent = `Il venditore paga ${selfFee}% sul percorso autonomo e ${conciergeFee}% sul servizio Concierge. La pubblicazione è gratuita.`;
      }
    });
    updateFee();
  }

  updateFee = function () {
    const price = parseFloat(qs("#sf-price") ? qs("#sf-price").value : "") || 0;
    const isConcierge = qs("#sell-mode-concierge") && qs("#sell-mode-concierge").checked;
    const rate = isConcierge ? PLATFORM_CONFIG.conciergeFeeRate : PLATFORM_CONFIG.selfServeFeeRate;
    const label = isConcierge
      ? `Concierge (${Math.round(PLATFORM_CONFIG.conciergeFeeRate * 100)}%)`
      : `${langText("Autonomo", "Self-serve")} (${Math.round(PLATFORM_CONFIG.selfServeFeeRate * 100)}%)`;
    const commission = price * rate;
    const net = price - commission;
    if (qs("#fee-p")) qs("#fee-p").textContent = price ? `€${price.toFixed(0)}` : "€ —";
    if (qs("#fee-c")) qs("#fee-c").textContent = price ? `-€${commission.toFixed(0)} (${label})` : `— ${label}`;
    if (qs("#fee-n")) qs("#fee-n").textContent = price ? `€${net.toFixed(0)}` : "€ —";
  };

  const previousApplyLang = applyLang;
  applyLang = function () {
    previousApplyLang();
    ensurePolicyModals();
    ensureSellDraftButton();
    ensureSellTaxonomyUi();
    ensureOfferSellerControls();
    ensureChatUiEnhancements();
    syncFeeCopy();
    const aboutButton = qs("#tnAboutBtn");
    if (aboutButton) {
      aboutButton.textContent = langText("Chi siamo", "About");
    }
    if (typeof renderFooters === "function") {
      renderFooters();
    }
    if (typeof window.renderOfferModal === "function" && qs("#offerModal") && qs("#offerModal").classList.contains("open")) {
      window.renderOfferModal();
    }
    renderNotifications();
    renderProfilePanel();
    renderOpsView();
    renderSellerProfileView();
    renderChats();
    syncTopnavChrome();
    bindLuxuryReveal();
  };

  window.setProfileArea = setProfileArea;
  window.setBuyerSection = setBuyerSection;
  window.setSellerSection = setSellerSection;
  window.showSeller = showSeller;
  window.showSellerTab = showSellerTab;
  window.stepDetailImage = stepDetailImage;
  window.requestMeasurementsForListing = requestMeasurementsForListing;
  window.setAdminSection = setAdminSection;
  window.setChatScope = setChatScope;
  window.openMessagingInbox = openMessagingInbox;
  window.openNotificationCenter = openNotificationCenter;
  window.saveAddressBook = saveAddressBook;
  window.setDefaultAddress = setDefaultAddress;
  window.addPrototypePaymentMethod = addPrototypePaymentMethod;
  window.savePayoutWorkspace = savePayoutWorkspace;
  window.saveNotificationPreferences = saveNotificationPreferences;
  window.saveSecurityWorkspace = saveSecurityWorkspace;
  window.saveAccountSettings = saveAccountSettings;
  window.requestVerificationCode = requestVerificationCode;
  window.confirmVerificationCode = confirmVerificationCode;
  window.banIdentityIdentifiers = banIdentityIdentifiers;
  window.saveShoppingPreferences = saveShoppingPreferences;
  window.saveSizeProfile = saveSizeProfile;
  window.addSavedSearch = addSavedSearch;
  window.removeSavedSearch = removeSavedSearch;
  window.saveSellingWorkspace = saveSellingWorkspace;
  window.savePrivacyWorkspace = savePrivacyWorkspace;
  window.handleSellTaxonomyChange = handleSellTaxonomyChange;
  window.toggleOfferSettings = toggleOfferSettings;
  window.saveListingDraft = saveListingDraft;
  window.publishDraftListing = publishDraftListing;
  window.loadDraftIntoSellForm = loadDraftIntoSellForm;
  window.startRelistFromOrderItem = startRelistFromOrderItem;
  window.toggleListingOffers = toggleListingOffers;
  window.archiveListing = archiveListing;
  window.generateShippingLabel = generateShippingLabel;
  window.respondToOffer = respondToOffer;
  window.renderOrderDetailModal = renderOrderDetailModal;
  window.openOrderDetail = openOrderDetail;
  window.closeOrderDetail = closeOrderDetail;
  window.nextCheckoutStep = nextCheckoutStep;
  window.prevCheckoutStep = prevCheckoutStep;
  window.setCheckoutStep = setCheckoutStep;
  window.finalizeCheckout = finalizeCheckout;
  window.backToChats = backToChats;
  window.openChatAttachmentPlaceholder = openChatAttachmentPlaceholder;
  window.reportListing = reportListing;
  window.toggleProfileMenu = toggleProfileMenu;
  window.closeProfileMenu = closeProfileMenu;
  window.toggleLocaleMenu = toggleLocaleMenu;
  window.closeLocaleMenu = closeLocaleMenu;
  window.toggleMobileNav = toggleMobileNav;
  window.closeMobileNav = closeMobileNav;
  window.handleAuthButtonClick = handleAuthButtonClick;
  window.acceptCookies = acceptCookies;
  window.checkCookieConsent = checkCookieConsent;
  window.acceptCookieConsent = function () { setCookieConsent("accepted"); };
  window.rejectCookieConsent = function () { setCookieConsent("rejected"); };

  ensureStructuredSkeletonState();
  ensureSellDraftButton();
  ensurePolicyModals();
  ensureSellTaxonomyUi();
  ensureOfferSellerControls();
  ensureChatUiEnhancements();
  syncFeeCopy();
  renderNotifications();
  renderProfilePanel();
  renderOpsView();
  renderSellerProfileView();
  renderChats();

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
