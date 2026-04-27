(function () {
  const STORAGE_KEYS = {
    users: "iris-users",
    banRegistry: "iris-ban-registry",
    session: "iris-user-session",
    recentSearches: "iris-recent-searches",
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
    reviews: "iris-reviews",
    chatModeration: "iris-chat-moderation"
  };
  const COOKIE_CONSENT_KEY = "iris-cookie-consent";
  const ESSENTIAL_STORAGE_KEYS = new Set([
    STORAGE_KEYS.session,
    STORAGE_KEYS.cart,
    STORAGE_KEYS.favorites,
    STORAGE_KEYS.listings,
    STORAGE_KEYS.orders,
    STORAGE_KEYS.offers,
    STORAGE_KEYS.notifications,
    STORAGE_KEYS.supportTickets,
    STORAGE_KEYS.measurementRequests,
    STORAGE_KEYS.auditLog,
    STORAGE_KEYS.chats,
    STORAGE_KEYS.reviews
  ]);
  const PLACEHOLDER_IMAGES = {
    borse: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop",
    scarpe: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
    orologi: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=500&fit=crop",
    abbigliamento: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop",
    accessori: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=500&fit=crop",
    gioielli: "https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=400&h=500&fit=crop"
  };

  const PLATFORM_CONFIG = {
    ownerEmail: "irisadminojmpx0nd@deltajohnsons.com",
    supportEmail: "support@iris-fashion.it",
    emailFrom: "IRIS <noreply@iris-fashion.it>",
    platformFeeRate: 0.07,
    selfServeFeeRate: 0.07,
    conciergeFeeRate: 0.15,
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
    it: { label: "IT", countryLabel: "Italia", nativeLabel: "Italiano", locale: "it-IT", currency: "EUR", rate: 1, dir: "ltr" },
    en: { label: "UK", countryLabel: "Regno Unito", nativeLabel: "English", locale: "en-GB", currency: "GBP", rate: 0.86, dir: "ltr" }
  };
  const SUPABASE_STORAGE_BUCKETS = {
    listingImages: "listing-images"
  };
  const SUPABASE_PUBLIC_CONFIG = window.IRIS_SUPABASE_CONFIG || null;
  const HOME_COPY = window.IRIS_HOME_COPY || {};
  const FACET_TRANSLATIONS = window.IRIS_FACET_TRANSLATIONS || {};
  const I18N_PACKS = window.IRIS_I18N_PACKS || {};
  let supabaseClient = null;
  let supabaseBridgeInitialized = false;
  let supabaseListingsInitialized = false;
  let supabaseOffersInitialized = false;
  let supabaseOrdersInitialized = false;
  let supabaseSupportInitialized = false;
  let supabaseChatsInitialized = false;
  let supabaseFavoritesInitialized = false;
  let supabaseCartInitialized = false;
  let supabaseReviewsInitialized = false;
  let supabaseMeasurementRequestsInitialized = false;
  let supabaseNotificationsInitialized = false;
  let chatModerationModulePromise = null;
  let chatModerationSyncPromise = null;
  let lastChatModerationUserKey = "";
  const SELL_TAXONOMY = {
    clothing: {
      it: "Abbigliamento",
      en: "Clothing",
      sizeMode: "apparel_alpha",
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
      sizeMode: "shoes_eu",
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
        belt: { it: "Cintura", en: "Belt", sizeMode: "belts_cm" },
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
        ring: { it: "Anello", en: "Ring", sizeMode: "rings_numeric" },
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

  const SIZE_SCHEMA_LIBRARY = {
    apparel_alpha: {
      id: "apparel_alpha",
      family: "apparel",
      filterable: true,
      allowOriginalLabel: true,
      showOriginalByDefault: false,
      label: { it: "Taglia standard", en: "Standard size" },
      originalLabel: { it: "Etichetta originale", en: "Original label" },
      standardLabel: { it: "Equivalente standard", en: "Standard equivalent" },
      filterGroupLabel: { it: "Taglie standard", en: "Standard sizes" },
      hint: {
        it: "Usa una taglia standard per il catalogo. Se il brand usa codici diversi, conservali nel campo etichetta originale.",
        en: "Use a standard catalog size. If the brand uses different codes, preserve them in the original label field."
      },
      placeholder: { it: "es. IT 40 / FR 36", en: "e.g. IT 40 / FR 36" },
      options: ["XXS", "XS", "S", "M", "L", "XL", "XXL"].map(function (value) {
        return { id: value, label: value, standardEquivalent: value };
      })
    },
    apparel_numeric_designer: {
      id: "apparel_numeric_designer",
      family: "apparel",
      filterable: true,
      allowOriginalLabel: true,
      showOriginalByDefault: true,
      label: { it: "Taglia designer", en: "Designer size" },
      originalLabel: { it: "Taglia originale brand", en: "Original brand size" },
      standardLabel: { it: "Fit standard", en: "Standard fit" },
      filterGroupLabel: { it: "Taglie designer", en: "Designer sizing" },
      hint: {
        it: "La taglia originale del brand resta sempre visibile. L'equivalente standard compare solo se affidabile.",
        en: "The brand's original size always stays visible. The standard equivalent appears only when reliable."
      },
      placeholder: { it: "es. Balenciaga 2", en: "e.g. Balenciaga 2" },
      options: ["0", "1", "2", "3", "4", "5"].map(function (value) {
        return { id: value, label: value };
      })
    },
    shoes_eu: {
      id: "shoes_eu",
      family: "shoes",
      filterable: true,
      allowOriginalLabel: true,
      showOriginalByDefault: true,
      label: { it: "Taglia EU", en: "EU size" },
      originalLabel: { it: "Etichetta originale", en: "Original label" },
      standardLabel: { it: "Sistema catalogo", en: "Catalog system" },
      filterGroupLabel: { it: "Scarpe · EU", en: "Shoes · EU" },
      hint: {
        it: "Per le scarpe il catalogo filtra in EU. Se l'etichetta è US o UK, la conserviamo come taglia originale.",
        en: "For shoes the catalog filters in EU. If the label is US or UK, we keep it as the original size."
      },
      placeholder: { it: "es. US 9 / UK 8", en: "e.g. US 9 / UK 8" }
    },
    belts_cm: {
      id: "belts_cm",
      family: "belt",
      filterable: true,
      allowOriginalLabel: true,
      showOriginalByDefault: true,
      label: { it: "Misura cintura", en: "Belt size" },
      originalLabel: { it: "Codice originale", en: "Original code" },
      standardLabel: { it: "Misura catalogo", en: "Catalog size" },
      filterGroupLabel: { it: "Cinture · cm", en: "Belts · cm" },
      hint: {
        it: "Le cinture usano una misura in cm. Eventuali codici brand restano nel campo originale.",
        en: "Belts use a measurement in cm. Any brand codes stay in the original field."
      },
      placeholder: { it: "es. 90 / 95", en: "e.g. 90 / 95" }
    },
    rings_numeric: {
      id: "rings_numeric",
      family: "ring",
      filterable: true,
      allowOriginalLabel: true,
      showOriginalByDefault: true,
      label: { it: "Misura anello", en: "Ring size" },
      originalLabel: { it: "Misura originale", en: "Original size" },
      standardLabel: { it: "Sistema catalogo", en: "Catalog system" },
      filterGroupLabel: { it: "Anelli", en: "Rings" },
      hint: {
        it: "Per gli anelli usiamo misure numeriche dedicate. Se il brand usa un sistema diverso, mantienilo nel campo originale.",
        en: "Rings use dedicated numeric sizes. If the brand uses a different system, keep it in the original field."
      },
      placeholder: { it: "es. US 7", en: "e.g. US 7" }
    },
    one_size: {
      id: "one_size",
      family: "one_size",
      filterable: false,
      allowOriginalLabel: false,
      showOriginalByDefault: false,
      label: { it: "Taglia", en: "Size" },
      originalLabel: { it: "Etichetta originale", en: "Original label" },
      standardLabel: { it: "Equivalente standard", en: "Standard equivalent" },
      filterGroupLabel: { it: "Taglia", en: "Size" },
      hint: {
        it: "Questa categoria non usa una taglia moda classica.",
        en: "This category does not use a classic fashion size."
      },
      placeholder: { it: "es. etichetta interna", en: "e.g. inner label" }
    }
  };

  const BRAND_SIZE_RULES = {
    balenciaga: {
      clothing: {
        default: {
          schemaId: "apparel_numeric_designer",
          reliableStandardEquivalent: true,
          labelPrefix: "Balenciaga",
          filterGroupLabel: { it: "Balenciaga numerico", en: "Balenciaga numeric" },
          standardMap: {
            "0": "XS",
            "1": "S",
            "2": "M",
            "3": "L",
            "4": "XL",
            "5": "XXL"
          }
        }
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
  const EXPRESS_SHIPPING_SURCHARGE = 15;
  const EXPRESS_SHIPPING_COST = SHIPPING_COST + EXPRESS_SHIPPING_SURCHARGE;
  const state = {
    users: loadJson(STORAGE_KEYS.users, []).map(function(u) { var c = Object.assign({}, u); delete c.password; return c; }),
    banRegistry: loadJson(STORAGE_KEYS.banRegistry, { emails: [], phones: [], entries: [] }),
    currentUser: loadJson(STORAGE_KEYS.session, null),
    sessionVerified: false,
    recentSearches: loadJson(STORAGE_KEYS.recentSearches, []),
    cart: loadJson(STORAGE_KEYS.cart, []),
    listings: loadJson(STORAGE_KEYS.listings, []),
    orders: loadJson(STORAGE_KEYS.orders, []),
    offers: loadJson(STORAGE_KEYS.offers, []),
    notifications: loadJson(STORAGE_KEYS.notifications, []),
    emailOutbox: loadJson(STORAGE_KEYS.emailOutbox, []),
    supportTickets: loadJson(STORAGE_KEYS.supportTickets, []),
    measurementRequests: loadJson(STORAGE_KEYS.measurementRequests, []),
    auditLog: loadJson(STORAGE_KEYS.auditLog, []),
    chatModeration: loadJson(STORAGE_KEYS.chatModeration, null),
    reviews: loadJson(STORAGE_KEYS.reviews, []),
    pendingAction: null,
    authMode: "login",
    authReturnView: "home",
    checkoutItems: [],
    checkoutSource: "cart",
    checkoutStep: "address",
    checkoutDraft: null,
    checkoutStatus: null,
    checkoutSubmitting: false,
    sellPhotos: [],
    activeDetailImage: 0,
    lastNonDetailView: "home",
    activeOrderId: null,
    activeOrderScope: "buyer",
    activeOrderModalTab: "detail",
    opsModalMode: null,
    opsModalPayload: null,
    stripeReturn: null,
    offerSubmitting: false,
    connectReturn: null,
    homeRenderSignature: null,
    detailImageOptimizations: {},
    searchDebounceTimer: null,
    autocompleteActiveIndex: -1,
    autocompleteQueryKey: "",
    chatSendPending: false,
  };

  let activeDialogState = null;

  const existingFavorites = loadJson(STORAGE_KEYS.favorites, []);
  if (existingFavorites.length) {
    favorites = new Set(existingFavorites);
  }

  // Purge any hardcoded test sessions and stored plaintext passwords
  if (state.currentUser && normalizeEmail(state.currentUser.email) === "utente@iris-marketplace.it") {
    state.currentUser = null;
    removeStoredValue(STORAGE_KEYS.session);
  }
  // Strip passwords from any user records that may exist in localStorage
  if (Array.isArray(state.users) && state.users.some(function(u) { return u && u.password; })) {
    state.users = state.users.map(function(u) { var c = Object.assign({}, u); delete c.password; return c; });
    saveJson(STORAGE_KEYS.users, state.users);
  }

  if (!state.currentUser && Array.isArray(state.cart) && state.cart.length) {
    state.cart = [];
    removeStoredValue(STORAGE_KEYS.cart);
  }

  consumeStripeReturnFromUrl();
  consumeConnectReturnFromUrl();
  extendTranslations();
  injectShellUi();
  injectCookieConsentUi();
  injectHomeView();
  assignSellFormIds();
  injectSellHelpers();
  bindShellMenus();
  ensureLanguageSelector();
  rebindMarketplaceSearch();
  initializeSupabaseBridge();
  normalizeMarketState();
  hydrateLocalListings();
  initializeSupabaseListings();
  initializeSupabaseOffers();
  initializeSupabaseOrders();
  initializeSupabaseSupportTickets();
  initializeSupabaseChats();
  initializeSupabaseFavorites();
  initializeSupabaseCart();
  initializeSupabaseReviews();
  initializeSupabaseMeasurementRequests();
  initializeSupabaseNotifications();
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

  function getFocusableElements(root) {
    return qsa(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      root,
    ).filter(function (element) {
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      if (element.hidden || element.getAttribute("aria-hidden") === "true") {
        return false;
      }
      return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    });
  }

  function releaseDialogFocusTrap(restoreFocus) {
    if (!activeDialogState) {
      return;
    }
    document.removeEventListener("keydown", activeDialogState.keydownHandler, true);
    const restoreTarget = activeDialogState.restoreTarget;
    activeDialogState = null;
    if (restoreFocus !== false && restoreTarget instanceof HTMLElement && document.contains(restoreTarget)) {
      restoreTarget.focus({ preventScroll: true });
    }
  }

  function getDialogCloseHandler(dialogId) {
    if (dialogId === "irisxAuthModal") {
      return closeAuthModal;
    }
    if (dialogId === "irisxCartDrawer") {
      return closeCart;
    }
    if (dialogId === "irisxCheckoutModal") {
      return closeCheckout;
    }
    if (dialogId === "irisxOpsModal") {
      return closeOpsModal;
    }
    if (dialogId === "irisxChatModerationModal") {
      return closeChatModerationModal;
    }
    if (dialogId === "offerModal" && typeof closeOffer === "function") {
      return closeOffer;
    }
    return null;
  }

  function resolveDialogInitialFocus(dialog, preferredSelectors) {
    const selectors = Array.isArray(preferredSelectors)
      ? preferredSelectors
      : [preferredSelectors];
    for (const selector of selectors) {
      if (!selector) {
        continue;
      }
      const candidate = qs(selector, dialog);
      if (candidate instanceof HTMLElement) {
        return candidate;
      }
    }
    return getFocusableElements(dialog)[0] || dialog;
  }

  function syncDialogFocus(dialogId, isOpen, preferredSelectors) {
    const dialog = qs("#" + dialogId);
    if (!dialog) {
      return;
    }

    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-hidden", isOpen ? "false" : "true");

    if (!isOpen) {
      if (activeDialogState && activeDialogState.id === dialogId) {
        releaseDialogFocusTrap(true);
      }
      return;
    }

    releaseDialogFocusTrap(false);
    const restoreTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const keydownHandler = function (event) {
      if (!activeDialogState || activeDialogState.id !== dialogId) {
        return;
      }
      if (event.key === "Escape") {
        const closeHandler = getDialogCloseHandler(dialogId);
        if (closeHandler) {
          event.preventDefault();
          closeHandler();
        }
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusable = getFocusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }
      const currentIndex = focusable.indexOf(document.activeElement);
      let nextIndex = currentIndex;
      if (event.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex === -1 || currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
      }
      event.preventDefault();
      focusable[nextIndex].focus({ preventScroll: true });
    };

    activeDialogState = {
      id: dialogId,
      keydownHandler: keydownHandler,
      restoreTarget: restoreTarget,
    };
    document.addEventListener("keydown", keydownHandler, true);
    requestAnimationFrame(function () {
      const target = resolveDialogInitialFocus(dialog, preferredSelectors);
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (!target.hasAttribute("tabindex") && target === dialog) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    });
  }

  function clearPendingSearchWork() {
    if (state.searchDebounceTimer) {
      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = null;
    }
  }

  function getAutocompleteEntries(dropdown) {
    return qsa(".ac-entry", dropdown || qs("#acDropdown"));
  }

  function syncAutocompleteAria(dropdown, isOpen) {
    const input = qs("#searchInput");
    const entries = getAutocompleteEntries(dropdown);
    if (dropdown) {
      dropdown.setAttribute("role", "listbox");
    }
    entries.forEach(function (entry, index) {
      entry.id = entry.id || `irisx-ac-option-${index}`;
      entry.setAttribute("role", "option");
      entry.setAttribute("aria-selected", index === state.autocompleteActiveIndex ? "true" : "false");
      entry.classList.toggle("is-active", index === state.autocompleteActiveIndex);
    });
    if (!input) {
      return;
    }
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-controls", "acDropdown");
    input.setAttribute("aria-expanded", isOpen ? "true" : "false");
    const activeEntry = entries[state.autocompleteActiveIndex];
    if (activeEntry) {
      input.setAttribute("aria-activedescendant", activeEntry.id);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function setAutocompleteOpen(dropdown, isOpen) {
    if (!dropdown) {
      return;
    }
    dropdown.classList.toggle("open", Boolean(isOpen));
    if (!isOpen) {
      state.autocompleteActiveIndex = -1;
    }
    syncAutocompleteAria(dropdown, Boolean(isOpen));
  }

  function setAutocompleteActiveIndex(index, dropdown) {
    const targetDropdown = dropdown || qs("#acDropdown");
    const entries = getAutocompleteEntries(targetDropdown);
    if (!entries.length) {
      state.autocompleteActiveIndex = -1;
      syncAutocompleteAria(targetDropdown, Boolean(targetDropdown && targetDropdown.classList.contains("open")));
      return;
    }
    const boundedIndex = Math.max(0, Math.min(index, entries.length - 1));
    state.autocompleteActiveIndex = boundedIndex;
    syncAutocompleteAria(targetDropdown, Boolean(targetDropdown && targetDropdown.classList.contains("open")));
    const activeEntry = entries[boundedIndex];
    if (activeEntry && typeof activeEntry.scrollIntoView === "function") {
      activeEntry.scrollIntoView({ block: "nearest" });
    }
  }

  function scheduleSearchInputUpdate(value) {
    clearPendingSearchWork();
    state.searchDebounceTimer = window.setTimeout(function () {
      const searchValue = String(value || "").trim();
      if (qs("#shop-view.active")) {
        handleSearch(searchValue);
      } else {
        filters.search = searchValue;
      }
      renderAutocompleteSuggestions(searchValue, {
        forceOpen: document.activeElement === qs("#searchInput"),
      });
      updateSearchSaveButton();
    }, 140);
  }

  function commitSearchQuery(value) {
    const query = String(value || "").trim();
    if (!query) {
      return;
    }
    clearPendingSearchWork();
    if (qs("#shop-view.active")) {
      handleSearch(query);
      registerRecentSearch(query);
      const dropdown = qs("#acDropdown");
      setAutocompleteOpen(dropdown, false);
      return;
    }
    applyAutocompleteSelection("search", query);
  }

  function enhanceInteractiveSurfaces(root) {
    qsa(".pc[onclick], .seller-card[onclick]", root).forEach(function (surface) {
      if (surface.dataset.irisSurfaceReady === "true") {
        return;
      }
      surface.dataset.irisSurfaceReady = "true";
      surface.setAttribute("role", "link");
      surface.setAttribute("tabindex", surface.getAttribute("tabindex") || "0");
      if (!surface.getAttribute("aria-label")) {
        const label = qsa(".p-brand, .p-name, .seller-name", surface)
          .map(function (node) { return String(node.textContent || "").trim(); })
          .filter(Boolean)
          .join(" · ");
        if (label) {
          surface.setAttribute("aria-label", label);
        }
      }
      surface.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          surface.click();
        }
      });
    });
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

  function normalizeBrandSizeKey(value) {
    return normalizeSearchText(value || "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function normalizeSizeSchemaId(schemaId) {
    const normalized = normalizeSearchText(schemaId || "");
    if (!normalized) {
      return "";
    }
    if (["alpha", "apparel alpha", "apparel_alpha"].includes(normalized)) {
      return "apparel_alpha";
    }
    if (["apparel numeric designer", "apparel_numeric_designer", "designer numeric"].includes(normalized)) {
      return "apparel_numeric_designer";
    }
    if (["eu shoes", "eu_shoes", "shoes eu", "shoes_eu"].includes(normalized)) {
      return "shoes_eu";
    }
    if (["belt", "belts cm", "belts_cm"].includes(normalized)) {
      return "belts_cm";
    }
    if (["ring", "rings numeric", "rings_numeric"].includes(normalized)) {
      return "rings_numeric";
    }
    if (["one size", "one_size"].includes(normalized)) {
      return "one_size";
    }
    return SIZE_SCHEMA_LIBRARY[schemaId] ? schemaId : "";
  }

  function getSizeSchemaDefinition(schemaId) {
    const resolvedSchemaId = normalizeSizeSchemaId(schemaId) || "one_size";
    return SIZE_SCHEMA_LIBRARY[resolvedSchemaId] || SIZE_SCHEMA_LIBRARY.one_size;
  }

  function getBrandSizeRule(brand, categoryKey, subcategoryKey) {
    const brandConfig = BRAND_SIZE_RULES[normalizeBrandSizeKey(brand)];
    if (!brandConfig || !categoryKey) {
      return null;
    }
    const categoryConfig = brandConfig[categoryKey];
    if (!categoryConfig) {
      return null;
    }
    if (subcategoryKey && categoryConfig[subcategoryKey]) {
      return categoryConfig[subcategoryKey];
    }
    if (categoryConfig.subcategories && subcategoryKey && categoryConfig.subcategories[subcategoryKey]) {
      return categoryConfig.subcategories[subcategoryKey];
    }
    return categoryConfig.default || categoryConfig;
  }

  function getSizeSchemaBaseOptions(schemaId) {
    const normalizedSchemaId = normalizeSizeSchemaId(schemaId) || "one_size";
    const schema = getSizeSchemaDefinition(normalizedSchemaId);
    let options = [];
    if (Array.isArray(schema.options) && schema.options.length) {
      options = schema.options.map(function (option) {
        return Object.assign({}, option);
      });
    } else if (normalizedSchemaId === "shoes_eu") {
      options = buildRangeOptions(34, 48, 0.5);
    } else if (normalizedSchemaId === "belts_cm") {
      options = buildRangeOptions(65, 110, 5);
    } else if (normalizedSchemaId === "rings_numeric") {
      options = buildRangeOptions(44, 70, 1);
    } else if (normalizedSchemaId === "one_size") {
      options = [{ id: "one_size", label: langText("Taglia unica", "One size") }];
    }
    return options.map(function (option, index) {
      return Object.assign({ order: index }, option);
    });
  }

  function getStandardEquivalentForSize(rawValue, option, brandRule) {
    if (option && option.standardEquivalent) {
      return option.standardEquivalent;
    }
    if (
      brandRule &&
      brandRule.reliableStandardEquivalent &&
      brandRule.standardMap &&
      Object.prototype.hasOwnProperty.call(brandRule.standardMap, rawValue)
    ) {
      return brandRule.standardMap[rawValue];
    }
    return "";
  }

  function formatCatalogSizeLabel(schemaId, primaryValue, standardEquivalent) {
    if (!primaryValue) {
      return "";
    }
    if (schemaId === "one_size") {
      return langText("Taglia unica", "One size");
    }
    if (schemaId === "shoes_eu") {
      return `EU ${primaryValue}`;
    }
    if (schemaId === "belts_cm") {
      return `${primaryValue} cm`;
    }
    if (standardEquivalent && normalizeSearchText(standardEquivalent) !== normalizeSearchText(primaryValue)) {
      return `${primaryValue} / ${standardEquivalent}`;
    }
    return primaryValue;
  }

  function getSizeFilterGroupLabel(schema, brandRule) {
    if (brandRule && brandRule.filterGroupLabel) {
      return getTaxonomyLabel(brandRule.filterGroupLabel);
    }
    return getTaxonomyLabel(schema.filterGroupLabel);
  }

  function buildConfiguredSizeOptions(schemaId, brandRule) {
    return getSizeSchemaBaseOptions(schemaId).map(function (option) {
      const primaryValue = String(option.label || option.id || "").trim();
      const rawValue = String(option.id || "").trim();
      const standardEquivalent = getStandardEquivalentForSize(rawValue, option, brandRule);
      return Object.assign({}, option, {
        rawValue: rawValue,
        primaryValue: primaryValue || rawValue,
        standardEquivalent: standardEquivalent,
        label: formatCatalogSizeLabel(schemaId, primaryValue || rawValue, standardEquivalent)
      });
    });
  }

  function getResolvedSizeContext(categoryKey, subcategoryKey, brand, explicitSchemaId) {
    const category = getSellCategoryDefinition(categoryKey);
    const subcategory = getSellSubcategoryDefinition(categoryKey, subcategoryKey);
    const brandRule = getBrandSizeRule(brand, categoryKey, subcategoryKey);
    const schemaId = normalizeSizeSchemaId(explicitSchemaId) ||
      normalizeSizeSchemaId((brandRule && brandRule.schemaId) || "") ||
      normalizeSizeSchemaId((subcategory && subcategory.sizeMode) || (category && category.sizeMode) || "one_size") ||
      "one_size";
    const schema = getSizeSchemaDefinition(schemaId);
    return {
      schemaId: schemaId,
      schema: schema,
      category: category,
      subcategory: subcategory,
      brandRule: brandRule,
      options: buildConfiguredSizeOptions(schemaId, brandRule),
      label: getTaxonomyLabel(schema.label),
      originalLabel: getTaxonomyLabel(schema.originalLabel),
      standardLabel: getTaxonomyLabel(schema.standardLabel),
      hint: getTaxonomyLabel(schema.hint),
      placeholder: getTaxonomyLabel(schema.placeholder),
      filterGroupLabel: getSizeFilterGroupLabel(schema, brandRule)
    };
  }

  function normalizeStoredSizeValue(rawValue, schemaId) {
    const resolvedSchemaId = normalizeSizeSchemaId(schemaId) || "one_size";
    const raw = String(rawValue || "").trim();
    if (!raw) {
      return resolvedSchemaId === "one_size" ? "one_size" : "";
    }
    if (resolvedSchemaId === "one_size") {
      return "one_size";
    }
    if (resolvedSchemaId === "apparel_alpha") {
      const normalized = raw.toUpperCase().replace(/\s+/g, "");
      const directMatch = ["XXS", "XS", "S", "M", "L", "XL", "XXL"].find(function (value) {
        return value === normalized;
      });
      if (directMatch) {
        return directMatch;
      }
      const slashMatch = raw.split("/").map(function (part) { return part.trim().toUpperCase(); }).find(function (value) {
        return ["XXS", "XS", "S", "M", "L", "XL", "XXL"].includes(value);
      });
      return slashMatch || normalized;
    }
    if (resolvedSchemaId === "apparel_numeric_designer") {
      const match = raw.match(/\b(\d+)\b/);
      return match ? match[1] : raw;
    }
    if (["shoes_eu", "belts_cm", "rings_numeric"].includes(resolvedSchemaId)) {
      const match = raw.match(/\d+([.,]\d+)?/);
      return match ? match[0].replace(",", ".") : raw;
    }
    return raw;
  }

  function getSellSizeOptions(sizeMode, brand, categoryKey, subcategoryKey) {
    return getResolvedSizeContext(categoryKey, subcategoryKey, brand, sizeMode).options.map(function (option) {
      return {
        id: option.id,
        label: option.label,
        order: option.order,
        standardEquivalent: option.standardEquivalent || ""
      };
    });
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

  function getResolvedSellSizeMode(categoryKey, subcategoryKey, brand, explicitSchemaId) {
    return getResolvedSizeContext(categoryKey, subcategoryKey, brand, explicitSchemaId).schemaId;
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
      return normalizeSizeSchemaId(listing.sizeSchema) || "one_size";
    }
    const categoryKey = inferSellCategoryKey(listing);
    const subcategoryKey = (listing && listing.subcategoryKey) || inferSellSubcategoryKey(listing, categoryKey);
    const brand = listing && listing.brand;
    if (categoryKey) {
      return getResolvedSellSizeMode(categoryKey, subcategoryKey, brand);
    }
    const normalizedSize = normalizeSearchText((listing && listing.sz) || "");
    if (normalizedSize === "one size" || normalizedSize === "taglia unica") return "one_size";
    if (/^(eu\s*)?\d+([.,]\d+)?$/.test(String((listing && listing.sz) || "").trim().toLowerCase())) return "shoes_eu";
    return getBrandSizeRule(brand, "clothing", "") ? "apparel_numeric_designer" : "apparel_alpha";
  }

  function getSellFormSizeValue(listing, explicitCategoryKey, explicitSubcategoryKey) {
    const categoryKey = explicitCategoryKey || inferSellCategoryKey(listing);
    const subcategoryKey = explicitSubcategoryKey || inferSellSubcategoryKey(listing, categoryKey);
    const brand = listing && listing.brand;
    const sizeMode = (listing && listing.sizeSchema) || getResolvedSellSizeMode(categoryKey, subcategoryKey, brand);
    return normalizeStoredSizeValue((listing && listing.sz) || "", sizeMode);
  }

  function getListingSizePresentation(listing, overrides) {
    const source = listing || {};
    const categoryKey = (overrides && overrides.categoryKey) || source.categoryKey || inferSellCategoryKey(source);
    const subcategoryKey = (overrides && overrides.subcategoryKey) || source.subcategoryKey || inferSellSubcategoryKey(source, categoryKey);
    const brand = (overrides && overrides.brand) !== undefined ? overrides.brand : source.brand;
    const schemaId = getResolvedSellSizeMode(
      categoryKey,
      subcategoryKey,
      brand,
      (overrides && overrides.sizeSchema) !== undefined ? overrides.sizeSchema : source.sizeSchema
    );
    const context = getResolvedSizeContext(categoryKey, subcategoryKey, brand, schemaId);
    const rawStoredValue = (overrides && overrides.sizeValue) !== undefined ? overrides.sizeValue : source.sz;
    const normalizedValue = normalizeStoredSizeValue(rawStoredValue, schemaId);
    const explicitOriginal = String((overrides && overrides.sizeOriginal) !== undefined ? overrides.sizeOriginal : (source.sizeOriginal || "")).trim();
    const matchedOption = context.options.find(function (option) {
      return String(option.id) === String(normalizedValue);
    }) || null;
    const primaryValue = String((matchedOption && matchedOption.primaryValue) || normalizedValue || rawStoredValue || "").trim();
    const standardEquivalent = String((matchedOption && matchedOption.standardEquivalent) || "").trim();
    const normalizedRawStored = normalizeSearchText(rawStoredValue || "");
    const displayLabel = schemaId === "one_size"
      ? (explicitOriginal || langText("Taglia unica", "One size"))
      : formatCatalogSizeLabel(schemaId, primaryValue, standardEquivalent);
    const originalDisplayValue = schemaId === "apparel_numeric_designer"
      ? (explicitOriginal || primaryValue)
      : (explicitOriginal && normalizeSearchText(explicitOriginal) !== normalizeSearchText(primaryValue) ? explicitOriginal : "");
    const filterable = Boolean(context.schema.filterable && primaryValue);
    const brandSpecific = Boolean(context.brandRule && normalizeBrandSizeKey(brand));
    const filterKey = filterable
      ? [brandSpecific ? normalizeBrandSizeKey(brand) : "", schemaId, primaryValue].filter(Boolean).join("::")
      : "";
    return {
      schemaId: schemaId,
      schema: context.schema,
      brandRule: context.brandRule,
      rawValue: primaryValue,
      originalValue: originalDisplayValue,
      standardEquivalent: standardEquivalent && normalizeSearchText(standardEquivalent) !== normalizeSearchText(primaryValue) ? standardEquivalent : "",
      displayLabel: displayLabel || langText("N/A", "N/A"),
      filterable: filterable,
      filterKey: filterKey,
      filterLabel: displayLabel || primaryValue || langText("N/A", "N/A"),
      filterGroupLabel: context.filterGroupLabel,
      filterOrder: matchedOption ? matchedOption.order : 999,
      showInSummary: Boolean(filterable && context.schema.family !== "one_size")
    };
  }

  function getListingDisplaySize(listing) {
    const presentation = getListingSizePresentation(listing);
    if (presentation.displayLabel) {
      return presentation.displayLabel;
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
    const sizePresentation = getListingSizePresentation(listing);
    return [
      gender !== "Unisex" ? langText(gender === "Men" ? "Uomo" : "Donna", gender) : langText("Unisex", "Unisex"),
      sizePresentation.showInSummary ? sizePresentation.displayLabel : "",
      colorLabel,
      seller.name
    ].filter(function (value) {
      return value && value !== langText("Non indicato", "Not specified");
    }).join(" · ");
  }

  function collectCatalogSizeFilterOptions(products) {
    const groupMap = new Map();
    (products || []).forEach(function (product) {
      const presentation = getListingSizePresentation(product);
      if (!presentation.filterable || !presentation.filterKey) {
        return;
      }
      const groupKey = `${presentation.filterGroupLabel}::${presentation.schemaId}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          key: groupKey,
          label: presentation.filterGroupLabel,
          options: new Map()
        });
      }
      const group = groupMap.get(groupKey);
      if (!group.options.has(presentation.filterKey)) {
        group.options.set(presentation.filterKey, {
          key: presentation.filterKey,
          label: presentation.filterLabel,
          order: presentation.filterOrder,
          count: 0
        });
      }
      group.options.get(presentation.filterKey).count += 1;
    });

    return Array.from(groupMap.values())
      .map(function (group) {
        return {
          key: group.key,
          label: group.label,
          options: Array.from(group.options.values()).sort(function (left, right) {
            if (left.order !== right.order) {
              return left.order - right.order;
            }
            return left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: "base" });
          })
        };
      })
      .sort(function (left, right) {
        return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
      });
  }

  function resolveSizeFilterLabel(filterKey, products) {
    if (!filterKey) {
      return "";
    }
    const groups = collectCatalogSizeFilterOptions(products && products.length ? products : getVisibleCatalogProducts());
    for (const group of groups) {
      const match = group.options.find(function (option) {
        return option.key === filterKey;
      });
      if (match) {
        return match.label;
      }
    }
    return filterKey.split("::").slice(-1)[0] || filterKey;
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

  function canPersistStorageKey(key) {
    return key === COOKIE_CONSENT_KEY || canPersistUserData() || ESSENTIAL_STORAGE_KEYS.has(key);
  }

  function persistPreference(key, value) {
    try {
      if (!canPersistStorageKey(key)) {
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
    if (!canPersistStorageKey(key)) {
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  function hasSupabasePublicConfig() {
    return Boolean(
      SUPABASE_PUBLIC_CONFIG &&
      SUPABASE_PUBLIC_CONFIG.url &&
      SUPABASE_PUBLIC_CONFIG.anonKey &&
      window.supabase &&
      typeof window.supabase.createClient === "function"
    );
  }

  function getSupabaseClient() {
    if (supabaseClient) {
      return supabaseClient;
    }
    if (!hasSupabasePublicConfig()) {
      return null;
    }
    supabaseClient = window.supabase.createClient(
      SUPABASE_PUBLIC_CONFIG.url,
      SUPABASE_PUBLIC_CONFIG.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "iris-supabase-auth"
        }
      }
    );
    return supabaseClient;
  }

  function isSupabaseEnabled() {
    return Boolean(getSupabaseClient());
  }

  function getCheckoutShippingMethodCopy() {
    return {
      insured: langText("Spedizione assicurata", "Insured shipping"),
      express: langText("Spedizione espressa assicurata", "Express insured")
    };
  }

  function resolveCheckoutShippingMethod(rawValue) {
    const labels = getCheckoutShippingMethodCopy();
    const normalized = String(rawValue || "").trim().toLowerCase();
    if (
      normalized === labels.express.toLowerCase() ||
      normalized === "express_insured" ||
      normalized === "express-insured" ||
      normalized.indexOf("express") > -1
    ) {
      return labels.express;
    }
    return labels.insured;
  }

  function getCheckoutShippingFee(rawMethod) {
    return resolveCheckoutShippingMethod(rawMethod) === getCheckoutShippingMethodCopy().express
      ? EXPRESS_SHIPPING_COST
      : SHIPPING_COST;
  }

  function normalizeCheckoutDraftState(draft) {
    const nextDraft = Object.assign({}, draft || {});
    nextDraft.shippingMethod = resolveCheckoutShippingMethod(nextDraft.shippingMethod);
    nextDraft.shippingFee = getCheckoutShippingFee(nextDraft.shippingMethod);
    return nextDraft;
  }

  function getSupabaseRedirectUrl() {
    const localHostPattern = /^(localhost|127\.0\.0\.1)$/i;
    const configuredSiteUrl =
      SUPABASE_PUBLIC_CONFIG && typeof SUPABASE_PUBLIC_CONFIG.publicSiteUrl === "string"
        ? SUPABASE_PUBLIC_CONFIG.publicSiteUrl.trim()
        : "";
    const canonicalHref = (function () {
      const canonical = document.querySelector('link[rel="canonical"]');
      return canonical && canonical.href ? canonical.href.trim() : "";
    })();
    const currentAppUrl = window.location.origin + window.location.pathname;
    const fallbackUrl = configuredSiteUrl || canonicalHref || currentAppUrl;
    const preferredUrl = localHostPattern.test(window.location.hostname) ? currentAppUrl : fallbackUrl;
    try {
      const url = new URL(preferredUrl);
      url.hash = "";
      return url.toString();
    } catch (_error) {
      return window.location.origin + window.location.pathname;
    }
  }

  function buildAppReturnUrl(params) {
    try {
      const url = new URL(getSupabaseRedirectUrl());
      Object.keys(params || {}).forEach(function (key) {
        const value = params[key];
        if (value === undefined || value === null || value === "") {
          return;
        }
        url.searchParams.set(key, String(value));
      });
      return url.toString();
    } catch (_error) {
      return getSupabaseRedirectUrl();
    }
  }

  function canUseBackendPayments() {
    return Boolean(isSupabaseEnabled() && getCurrentSupabaseUserId());
  }

  async function invokeSupabaseFunction(name, payload) {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error(langText("Backend Supabase non disponibile.", "Supabase backend unavailable."));
    }
    const response = await client.functions.invoke(name, {
      body: payload || {}
    });
    if (response.error) {
      throw response.error;
    }
    const data = response.data || {};
    if (data.error) {
      const error = new Error(data.error);
      error.code = data.code || "function_error";
      throw error;
    }
    return data;
  }

  function normalizeChatModerationState(record) {
    const source = record || {};
    const bannedUntil = source.chatBannedUntil || source.chat_banned_until || null;
    const bannedUntilMs = bannedUntil ? new Date(bannedUntil).getTime() : 0;
    const chatBanned = Boolean(source.chatBanned ?? source.chat_banned ?? false);
    const violationCount = Math.max(0, Number(source.violationCount ?? source.violation_count ?? 0));
    return {
      userId: String(source.userId || source.user_id || ""),
      violationCount: violationCount,
      lastViolationAtMs: Math.max(0, Number(source.lastViolationAtMs ?? source.last_violation_at_ms ?? 0)),
      lastViolationReason: String(source.lastViolationReason ?? source.last_violation_reason ?? ""),
      lastAction: String(source.lastAction ?? source.last_action ?? ""),
      chatBanned: chatBanned,
      chatBannedUntil: bannedUntil,
      moderationNotes: source.moderationNotes || source.moderation_notes || {},
      isSuspended: Boolean(chatBanned || (bannedUntilMs && bannedUntilMs > Date.now())),
      activeWarningLevel: chatBanned ? 3 : Math.min(2, violationCount),
    };
  }

  function persistChatModeration() {
    saveJson(STORAGE_KEYS.chatModeration, state.chatModeration);
  }

  function applyChatModerationState(nextState) {
    state.chatModeration = normalizeChatModerationState(nextState);
    persistChatModeration();
    renderChatComposerNote();
    if (qs("#chat-view") && qs("#chat-view").classList.contains("active") && curChat) {
      const input = qs("#chatInput");
      if (state.chatModeration.isSuspended && input) {
        input.blur();
      }
    }
  }

  function resetChatModerationState() {
    applyChatModerationState(null);
  }

  function isChatSuspended() {
    return Boolean(state.chatModeration && normalizeChatModerationState(state.chatModeration).isSuspended);
  }

  function getChatModerationStageConfig(stage) {
    const normalizedStage = stage === "chat_banned" ? "chat_banned" : (stage === "warning_2" ? "warning_2" : "warning_1");
    if (normalizedStage === "chat_banned") {
      return {
        stage: "chat_banned",
        eyebrow: langText("IRIS Trust & Safety", "IRIS Trust & Safety"),
        title: langText("Chat sospesa", "Chat suspended"),
        body: langText(
          "Il tuo accesso alla chat e' stato sospeso in modo definitivo per violazione ripetuta delle regole di sicurezza di IRIS. Puoi ancora acquistare e vendere su IRIS, ma non puoi piu usare la chat. Contatta il supporto se ritieni che si tratti di un errore.",
          "Your chat access has been permanently suspended for repeated violations of IRIS security rules. You can still buy and sell on IRIS, but you can no longer use chat. Contact support if you believe this is an error."
        ),
        badge: "3 / 3",
      };
    }
    if (normalizedStage === "warning_2") {
      return {
        stage: "warning_2",
        eyebrow: langText("IRIS Trust & Safety", "IRIS Trust & Safety"),
        title: langText("Ultimo avvertimento", "Final warning"),
        body: langText(
          "Hai tentato di aggirare le regole della piattaforma. Un'altra violazione comportera' la sospensione definitiva della chat. Potrai ancora acquistare e vendere su IRIS, ma non usare la chat.",
          "You attempted to bypass the platform rules. One more violation will permanently suspend chat. You will still be able to buy and sell on IRIS, but not use chat."
        ),
        badge: "2 / 3",
      };
    }
    return {
      stage: "warning_1",
      eyebrow: langText("IRIS Trust & Safety", "IRIS Trust & Safety"),
      title: langText("Messaggio bloccato", "Message blocked"),
      body: langText(
        "Non puoi condividere contatti esterni, piattaforme esterne, metodi di pagamento esterni o emoji. Tutta la comunicazione e tutti i pagamenti devono restare su IRIS. Questa e' la tua prima violazione.",
        "You cannot share external contacts, external platforms, external payment methods, or emoji. All communication and all payments must stay on IRIS. This is your first violation."
      ),
      badge: "1 / 3",
    };
  }

  function closeChatModerationModal() {
    const modal = qs("#irisxChatModerationModal");
    if (!modal) {
      return;
    }
    modal.classList.remove("open");
    modal.innerHTML = "";
    syncDialogFocus("irisxChatModerationModal", false);
  }

  function getChatModerationVisualMarkup(stage) {
    const visualClass = `irisx-chat-moderation-visual irisx-chat-moderation-visual--${stage === "chat_banned" ? "banned" : (stage === "warning_2" ? "warning_2" : "warning_1")}`;
    return `<div class="${visualClass}" aria-hidden="true">
      <svg viewBox="0 0 320 260" role="presentation" focusable="false">
        <defs>
          <linearGradient id="irisModerationGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFE6DB" />
            <stop offset="55%" stop-color="#FFB59F" />
            <stop offset="100%" stop-color="#F1324F" />
          </linearGradient>
          <linearGradient id="irisModerationPanel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFF8F4" stop-opacity="0.98" />
            <stop offset="100%" stop-color="#FFDCCD" stop-opacity="0.95" />
          </linearGradient>
        </defs>
        <circle cx="72" cy="72" r="58" fill="url(#irisModerationGlow)" opacity="0.18"></circle>
        <circle cx="258" cy="56" r="44" fill="url(#irisModerationGlow)" opacity="0.14"></circle>
        <path d="M66 188c0-12 10-22 22-22h126c12 0 22 10 22 22v10c0 12-10 22-22 22H88c-12 0-22-10-22-22v-10z" fill="#120E1B" opacity="0.95"></path>
        <rect x="82" y="58" width="156" height="104" rx="22" fill="url(#irisModerationPanel)" stroke="rgba(241,50,79,0.24)"></rect>
        <path d="M132 162l-22 24v-24h22z" fill="url(#irisModerationPanel)"></path>
        <path d="M183 86l42 70c4 6-1 14-9 14h-84c-8 0-13-8-9-14l42-70c4-7 14-7 18 0z" fill="#14101D"></path>
        <path d="M192 105l-4 33a8 8 0 0 1-16 0l-4-33a12 12 0 0 1 24 0z" fill="url(#irisModerationGlow)"></path>
        <circle cx="180" cy="151" r="8" fill="url(#irisModerationGlow)"></circle>
        <path d="M74 198h154" stroke="#F3E5DD" stroke-width="8" stroke-linecap="round" opacity="0.92"></path>
        <path d="M92 214h120" stroke="#F3E5DD" stroke-width="8" stroke-linecap="round" opacity="0.6"></path>
        <path d="M248 176c20 0 36-16 36-36s-16-36-36-36c-20 0-36 16-36 36s16 36 36 36z" fill="#140C14"></path>
        <path d="M231 123l34 34" stroke="url(#irisModerationGlow)" stroke-width="10" stroke-linecap="round"></path>
        <path d="M265 123l-34 34" stroke="url(#irisModerationGlow)" stroke-width="10" stroke-linecap="round"></path>
      </svg>
    </div>`;
  }

  function openChatModerationModal(stage, payload) {
    const modal = qs("#irisxChatModerationModal");
    if (!modal) {
      return;
    }
    const config = getChatModerationStageConfig(stage);
    const fragments = Array.isArray(payload && payload.fragments) ? payload.fragments.filter(Boolean).slice(0, 4) : [];
    const consequenceCopy = config.stage === "chat_banned"
      ? langText("La chat resta disattivata in modo definitivo su questo account.", "Chat stays permanently disabled on this account.")
      : (config.stage === "warning_2"
        ? langText("Un altro tentativo blocchera' definitivamente la chat.", "One more attempt will permanently disable chat.")
        : langText("Questo e' un avviso reale: il prossimo step sale di gravita'.", "This is a real warning: the next step escalates."));
    modal.innerHTML = `<div class="irisx-modal-backdrop"></div><div class="irisx-modal-card irisx-modal-card--moderation irisx-modal-card--moderation-${config.stage}">
      <div class="irisx-card-head irisx-card-head--moderation">
        <div>
          <div class="irisx-kicker">${escapeHtml(config.eyebrow)}</div>
          <div class="irisx-title">${escapeHtml(langText("Avviso di sicurezza chat", "Chat safety alert"))}</div>
        </div>
        <button class="irisx-close" aria-label="${escapeHtml(langText("Chiudi", "Close"))}" onclick="closeChatModerationModal()">✕</button>
      </div>
      <div class="irisx-card-body irisx-card-body--moderation">
        <div class="irisx-chat-moderation-hero">
          <div class="irisx-chat-moderation-copy">
            <div class="irisx-chat-moderation-badge">${escapeHtml(config.badge)}</div>
            <strong>${escapeHtml(config.title)}</strong>
            <p>${escapeHtml(config.body)}</p>
            <div class="irisx-chat-moderation-consequence">${escapeHtml(consequenceCopy)}</div>
          </div>
          ${getChatModerationVisualMarkup(config.stage)}
        </div>
        <div class="irisx-chat-moderation-policy">${escapeHtml(langText("IRIS blocca contatti esterni, pagamenti esterni, piattaforme esterne ed emoji prima che il messaggio entri in conversazione.", "IRIS blocks external contacts, off-platform payments, external platforms, and emoji before the message reaches the conversation."))}</div>
        ${fragments.length ? `<div class="irisx-chat-moderation-fragments">${fragments.map(function (fragment) { return `<span>${escapeHtml(fragment)}</span>`; }).join("")}</div>` : ""}
        <div class="irisx-actions irisx-actions--moderation">
          <button class="irisx-primary" type="button" onclick="closeChatModerationModal()">${escapeHtml(langText("Ho capito", "Understood"))}</button>
        </div>
      </div>
    </div>`;
    modal.classList.add("open");
    syncDialogFocus("irisxChatModerationModal", true, [".irisx-primary", ".irisx-close"]);
  }

  async function getChatModerationApi() {
    if (!chatModerationModulePromise) {
      chatModerationModulePromise = import("./moderation/chat-moderation-engine.mjs");
    }
    return chatModerationModulePromise;
  }

  async function fetchChatModerationStateFromSupabase() {
    const client = getSupabaseClient();
    const userId = getCurrentSupabaseUserId();
    if (!client || !userId) {
      return normalizeChatModerationState(null);
    }
    const response = await client
      .from("chat_moderation_users")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (response.error) {
      throw response.error;
    }
    return normalizeChatModerationState(response.data || { userId: userId });
  }

  async function refreshChatModerationState(force) {
    const userKey = getCurrentSupabaseUserId() || normalizeEmail(state.currentUser && state.currentUser.email) || "";
    if (!userKey) {
      lastChatModerationUserKey = "";
      resetChatModerationState();
      return state.chatModeration;
    }
    if (!force && chatModerationSyncPromise && lastChatModerationUserKey === userKey) {
      return chatModerationSyncPromise;
    }
    lastChatModerationUserKey = userKey;
    chatModerationSyncPromise = fetchChatModerationStateFromSupabase()
      .then(function (nextState) {
        applyChatModerationState(nextState);
        return state.chatModeration;
      })
      .catch(function (error) {
        console.warn("[IRIS] Unable to sync chat moderation state", error);
        return state.chatModeration;
      })
      .finally(function () {
        chatModerationSyncPromise = null;
      });
    return chatModerationSyncPromise;
  }

  function consumeStripeReturnFromUrl() {
    try {
      const currentUrl = new URL(window.location.href);
      const flow = currentUrl.searchParams.get("stripe_flow");
      const status = currentUrl.searchParams.get("stripe_status");
      if (!flow || !status) {
        return;
      }
      state.stripeReturn = {
        flow: flow,
        status: status,
        orderId: currentUrl.searchParams.get("order_id") || "",
        offerId: currentUrl.searchParams.get("offer_id") || "",
        sessionId: currentUrl.searchParams.get("session_id") || ""
      };
      ["stripe_flow", "stripe_status", "order_id", "offer_id", "session_id"].forEach(function (key) {
        currentUrl.searchParams.delete(key);
      });
      window.history.replaceState({}, document.title, currentUrl.pathname + (currentUrl.search || "") + currentUrl.hash);
    } catch (error) {
      console.warn("[IRIS] Unable to parse Stripe return parameters", error);
    }
  }

  function consumeConnectReturnFromUrl() {
    try {
      const currentUrl = new URL(window.location.href);
      const status = currentUrl.searchParams.get("connect");
      if (!status) {
        return;
      }
      state.connectReturn = { status: status };
      currentUrl.searchParams.delete("connect");
      window.history.replaceState({}, document.title, currentUrl.pathname + (currentUrl.search || "") + currentUrl.hash);
    } catch (error) {
      console.warn("[IRIS] Unable to parse Stripe Connect return", error);
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  async function waitForOrderSync(orderId, attempts) {
    const maxAttempts = Number(attempts || 4);
    for (let index = 0; index < maxAttempts; index += 1) {
      await refreshSupabaseOrders();
      const order = state.orders.find(function (candidate) {
        return String(candidate.id) === String(orderId || "");
      });
      if (order) {
        return order;
      }
      if (index < maxAttempts - 1) {
        await delay(900);
      }
    }
    return null;
  }

  async function waitForOfferSync(offerId, attempts) {
    const maxAttempts = Number(attempts || 4);
    for (let index = 0; index < maxAttempts; index += 1) {
      await refreshSupabaseOffers();
      const offer = state.offers.find(function (candidate) {
        return String(candidate.id) === String(offerId || "");
      });
      if (offer) {
        return offer;
      }
      if (index < maxAttempts - 1) {
        await delay(900);
      }
    }
    return null;
  }

  async function finalizeStripeReturn() {
    if (!state.stripeReturn || !state.currentUser) {
      return;
    }
    const payload = state.stripeReturn;
    state.stripeReturn = null;

    if (payload.flow === "checkout") {
      if (payload.status === "success") {
        if (payload.orderId) {
          await waitForOrderSync(payload.orderId, 5);
        } else {
          await refreshSupabaseOrders();
        }
        await refreshSupabaseListings();
        state.activeOrderId = payload.orderId || state.activeOrderId;
        state.checkoutStatus = "success";
        state.checkoutSubmitting = false;
        renderCheckoutModal();
        showToast(langText("Pagamento confermato. Ordine aggiornato.", "Payment confirmed. Order updated."));
        if (payload.orderId) {
          showBuyView("profile");
          setBuyerSection("order_detail", payload.orderId);
        }
      } else {
        state.checkoutStatus = "failed";
        state.checkoutSubmitting = false;
        renderCheckoutModal();
        showToast(langText("Pagamento annullato. Nessun addebito eseguito.", "Checkout canceled. No charge completed."));
      }
      return;
    }

    if (payload.flow === "offer") {
      if (payload.status === "success") {
        const authorizedOffer = payload.offerId ? await waitForOfferSync(payload.offerId, 5) : null;
        await refreshSupabaseListings();
        state.offerSubmitting = false;
        state.offerStatus = authorizedOffer;
        state.offerDraft = authorizedOffer;
        state.offerStep = authorizedOffer ? "success" : "amount";
        const modal = qs("#offerModal");
        if (modal && authorizedOffer) {
          modal.classList.add("open");
          renderOfferModal();
        }
        showToast(langText("Offerta autorizzata correttamente.", "Offer authorized successfully."));
      } else {
        state.offerSubmitting = false;
        state.offerStep = "authorization";
        renderOfferModal();
        showToast(langText("Autorizzazione offerta annullata.", "Offer authorization canceled."));
      }
    }
  }

  async function finalizeConnectReturn() {
    if (!state.connectReturn || !state.currentUser) {
      return;
    }
    const payload = state.connectReturn;
    state.connectReturn = null;
    try {
      await refreshStripeConnectStatus(true);
      showBuyView("profile");
      setProfileArea("account", "settings_payment");
      showToast(payload.status === "return"
        ? langText("Onboarding Stripe aggiornato.", "Stripe onboarding updated.")
        : langText("Riapri Stripe per completare l'onboarding.", "Reopen Stripe to complete onboarding."));
    } catch (error) {
      console.warn("[IRIS] Unable to finalize Stripe Connect return", error);
    }
  }

  function buildSupabaseProfilePayload(user, authUser) {
    const normalizedUser = normalizeUserWorkspace(Object.assign({}, user || {}, {
      id: (authUser && authUser.id) || (user && user.id) || ""
    }));
    const normalizedEmail = normalizeEmail((authUser && authUser.email) || normalizedUser.email);
    const normalizedRole = normalizeString(normalizedUser.platformRole || normalizedUser.role).toLowerCase();
    const payload = {
      id: (authUser && authUser.id) || normalizedUser.id,
      email: normalizedEmail,
      full_name: normalizedUser.name || "",
      phone: normalizedUser.phone || "",
      city: normalizedUser.city || "",
      country: normalizedUser.country || getWorkspaceDefaultCountry(),
      bio: normalizedUser.bio || "",
      member_since: normalizedUser.memberSince || String(new Date().getFullYear()),
      avatar_url: normalizedUser.avatar || "",
      addresses: normalizedUser.addresses || [],
      payment_methods: normalizedUser.paymentMethods || [],
      payout_settings: normalizedUser.payoutSettings || {},
      security: normalizedUser.security || {},
      verification: normalizedUser.verification || {},
      notification_settings: normalizedUser.notificationSettings || {},
      shopping_preferences: normalizedUser.shoppingPreferences || {},
      size_profile: normalizedUser.sizeProfile || {},
      saved_searches: normalizedUser.savedSearches || [],
      selling_preferences: normalizedUser.sellingPreferences || {},
      vacation_mode: normalizedUser.vacationMode || {},
      listing_preferences: normalizedUser.listingPreferences || {},
      privacy_settings: normalizedUser.privacySettings || {},
      account_status: normalizedUser.accountStatus || "active",
      ban_reason: normalizedUser.banReason || "",
      banned_at: normalizedUser.bannedAt || null
    };
    if (normalizedRole) {
      payload.role = normalizedRole === "admin" ? "admin" : normalizedRole;
    }
    return payload;
  }

  function buildWorkspaceUserFromSupabase(authUser, profile) {
    const rawProfile = profile || {};
    const profileVerification = rawProfile.verification || {};
    const normalizedEmail = normalizeEmail((authUser && authUser.email) || rawProfile.email || "");
    return normalizeUserWorkspace({
      id: authUser && authUser.id,
      name: rawProfile.full_name || (authUser && authUser.user_metadata && (authUser.user_metadata.full_name || authUser.user_metadata.name)) || "",
      email: normalizedEmail,
      phone: normalizePhoneNumber(rawProfile.phone || (authUser && authUser.phone) || ((authUser && authUser.user_metadata && authUser.user_metadata.phone) || "")),
      platformRole: normalizeString(rawProfile.role || ""),
      role: sanitizeWorkspaceRole(rawProfile.role),
      city: rawProfile.city || "",
      country: rawProfile.country || getWorkspaceDefaultCountry(),
      bio: rawProfile.bio || "",
      memberSince: rawProfile.member_since || (authUser && authUser.created_at ? String(new Date(authUser.created_at).getFullYear()) : String(new Date().getFullYear())),
      avatar: rawProfile.avatar_url || (authUser && authUser.user_metadata && (authUser.user_metadata.avatar_url || authUser.user_metadata.picture)) || "",
      addresses: rawProfile.addresses || [],
      paymentMethods: rawProfile.payment_methods || [],
      payoutSettings: rawProfile.payout_settings || {},
      security: rawProfile.security || {},
      verification: Object.assign({}, profileVerification, {
        emailVerified: Boolean((authUser && authUser.email_confirmed_at) || profileVerification.emailVerified),
        emailVerifiedAt: (authUser && authUser.email_confirmed_at) || profileVerification.emailVerifiedAt || null,
        verifiedEmail: (authUser && authUser.email_confirmed_at) ? normalizeEmail(authUser.email) : (profileVerification.verifiedEmail || ""),
        phoneVerified: Boolean((authUser && authUser.phone_confirmed_at) || profileVerification.phoneVerified),
        phoneVerifiedAt: (authUser && authUser.phone_confirmed_at) || profileVerification.phoneVerifiedAt || null
      }),
      notificationSettings: rawProfile.notification_settings || {},
      shoppingPreferences: rawProfile.shopping_preferences || {},
      sizeProfile: rawProfile.size_profile || {},
      savedSearches: rawProfile.saved_searches || [],
      sellingPreferences: rawProfile.selling_preferences || {},
      vacationMode: rawProfile.vacation_mode || {},
      listingPreferences: rawProfile.listing_preferences || {},
      privacySettings: rawProfile.privacy_settings || {},
      accountStatus: rawProfile.account_status || "active",
      banReason: rawProfile.ban_reason || "",
      bannedAt: rawProfile.banned_at || null,
      authProvider: (authUser && authUser.app_metadata && authUser.app_metadata.provider) || "supabase"
    });
  }

  function normalizeSupabaseUuid(value) {
    const candidate = String(value || "").trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
      ? candidate
      : null;
  }

  function getCurrentSupabaseUserId() {
    return normalizeSupabaseUuid(state.currentUser && state.currentUser.id);
  }

  function buildSupabaseListingPayload(listing) {
    const normalized = normalizeListingRecord(listing);
    return {
      id: String(normalized.id),
      owner_id: normalizeSupabaseUuid(state.currentUser && state.currentUser.id),
      owner_email: normalizeEmail(normalized.ownerEmail),
      name: normalized.name || "",
      brand: normalized.brand || "",
      category_label: normalized.cat || "",
      category_key: normalized.categoryKey || "",
      subcategory_label: normalized.subcategory || "",
      subcategory_key: normalized.subcategoryKey || "",
      product_type_label: normalized.productType || "",
      product_type_key: normalized.productTypeKey || "",
      size_label: normalized.sz || "",
      size_original: normalized.sizeOriginal || "",
      size_schema: normalized.sizeSchema || "",
      condition_label: normalized.cond || "",
      fit: normalized.fit || "",
      dimensions: normalized.dims || "",
      measurements: normalized.measurements || {},
      price: Number(normalized.price || 0),
      original_price: Number(normalized.orig || normalized.compareAt || 0),
      color: normalized.color || "",
      material: normalized.material || "",
      emoji: normalized.emoji || "",
      description: normalized.desc || "",
      chips: Array.isArray(normalized.chips) ? normalized.chips : [],
      seller_snapshot: normalized.seller || {},
      image_url: normalized.image || "",
      images: Array.isArray(normalized.images) ? normalized.images : [],
      is_user_listing: normalized.isUserListing !== false,
      inventory_status: normalized.inventoryStatus || "active",
      listing_status: normalized.listingStatus || "published",
      order_id: normalized.orderId || null,
      sold_at: normalized.soldAt || null,
      offers_enabled: normalized.offersEnabled !== false,
      minimum_offer_amount: normalized.minimumOfferAmount === null || normalized.minimumOfferAmount === undefined ? null : Number(normalized.minimumOfferAmount),
      gender: normalized.gender || "",
      verified: Boolean(normalized.verified),
      verified_seller: Boolean(normalized.verifiedSeller),
      iris_guaranteed: Boolean(normalized.irisGuaranteed),
      certificate_code: normalized.certificateCode || "",
      authenticated_at: normalized.authenticatedAt || null,
      relist_source_order_id: normalized.relistSourceOrderId || null,
      relist_source_product_id: normalized.relistSourceProductId || null,
      relist_source_listing_id: normalized.relistSourceListingId || null,
      relist_source_receipt_number: normalized.relistSourceReceiptNumber || "",
      relist_source_purchased_at: normalized.relistSourcePurchasedAt || null,
      relist_source_certified: Boolean(normalized.relistSourceCertified),
      relist_source_platform: normalized.relistSourcePlatform || "",
      date_created_ms: Number(normalized.date || Date.now())
    };
  }

  function buildListingFromSupabaseRow(row) {
    if (!row) {
      return null;
    }
    return normalizeListingRecord({
      id: row.id,
      ownerId: row.owner_id || null,
      ownerEmail: row.owner_email || "",
      name: row.name || "",
      brand: row.brand || "",
      cat: row.category_label || "",
      categoryKey: row.category_key || "",
      subcategory: row.subcategory_label || "",
      subcategoryKey: row.subcategory_key || "",
      productType: row.product_type_label || "",
      productTypeKey: row.product_type_key || "",
      sz: row.size_label || "",
      sizeOriginal: row.size_original || "",
      sizeSchema: row.size_schema || "",
      cond: row.condition_label || "",
      fit: row.fit || "",
      dims: row.dimensions || "",
      measurements: row.measurements || {},
      price: Number(row.price || 0),
      orig: Number(row.original_price || 0),
      compareAt: Number(row.original_price || 0),
      color: row.color || "",
      material: row.material || "",
      emoji: row.emoji || "",
      desc: row.description || "",
      chips: row.chips || [],
      seller: row.seller_snapshot || {},
      image: row.image_url || "",
      images: row.images || [],
      isUserListing: row.is_user_listing !== false,
      inventoryStatus: row.inventory_status || "active",
      listingStatus: row.listing_status || "published",
      orderId: row.order_id || null,
      soldAt: row.sold_at || null,
      offersEnabled: row.offers_enabled !== false,
      minimumOfferAmount: row.minimum_offer_amount,
      gender: row.gender || "",
      verified: Boolean(row.verified),
      verifiedSeller: Boolean(row.verified_seller),
      irisGuaranteed: Boolean(row.iris_guaranteed),
      certificateCode: row.certificate_code || "",
      authenticatedAt: row.authenticated_at || null,
      relistSourceOrderId: row.relist_source_order_id || null,
      relistSourceProductId: row.relist_source_product_id || null,
      relistSourceListingId: row.relist_source_listing_id || null,
      relistSourceReceiptNumber: row.relist_source_receipt_number || "",
      relistSourcePurchasedAt: row.relist_source_purchased_at || null,
      relistSourceCertified: Boolean(row.relist_source_certified),
      relistSourcePlatform: row.relist_source_platform || "",
      date: Number(row.date_created_ms || Date.now())
    });
  }

  function buildSupabaseOfferPayload(offer) {
    const normalized = normalizeOfferRecord(offer);
    return {
      id: String(normalized.id),
      listing_id: normalized.listingId || null,
      product_id: normalized.productId || normalized.listingId || null,
      product_name: normalized.productName || "",
      product_brand: normalized.productBrand || "",
      buyer_id: normalizeSupabaseUuid(normalized.buyerId || (state.currentUser && state.currentUser.id)),
      buyer_email: normalizeEmail(normalized.buyerEmail),
      buyer_name: normalized.buyerName || "",
      seller_id: normalizeSupabaseUuid(normalized.sellerId),
      seller_email: normalizeEmail(normalized.sellerEmail),
      seller_name: normalized.sellerName || "",
      offer_amount: Number(normalized.offerAmount || normalized.amount || 0),
      currency: normalized.currency || getLocaleConfig().currency,
      status: normalized.status || "pending",
      created_at_ms: Number(normalized.createdAt || Date.now()),
      updated_at_ms: Number(normalized.updatedAt || normalized.createdAt || Date.now()),
      expires_at_ms: Number(normalized.expiresAt || (Date.now() + OFFER_EXPIRY_MS)),
      payment_authorization_status: normalized.paymentAuthorizationStatus || "payment_authorized",
      payment_intent_reference: normalized.paymentIntentReference || "",
      authorization_reference: normalized.authorizationReference || "",
      checkout_session_id: normalized.checkoutSessionId || "",
      authorization_expires_at: normalized.authorizationExpiresAt || null,
      order_id: normalized.orderId || null,
      shipping_snapshot: normalized.shippingSnapshot || {},
      payment_method_snapshot: normalized.paymentMethodSnapshot || {},
      minimum_offer_amount: normalized.minimumOfferAmount === null || normalized.minimumOfferAmount === undefined ? null : Number(normalized.minimumOfferAmount),
      captured_at_ms: normalized.capturedAt || null,
      released_at_ms: normalized.releasedAt || null,
      release_reason: normalized.reason || ""
    };
  }

  function buildOfferFromSupabaseRow(row) {
    if (!row) {
      return null;
    }
    return normalizeOfferRecord({
      id: row.id,
      listingId: row.listing_id || row.product_id || null,
      productId: row.product_id || row.listing_id || null,
      productName: row.product_name || "",
      productBrand: row.product_brand || "",
      buyerId: row.buyer_id || "",
      buyerEmail: row.buyer_email || "",
      buyerName: row.buyer_name || "",
      sellerId: row.seller_id || "",
      sellerEmail: row.seller_email || "",
      sellerName: row.seller_name || "",
      offerAmount: Number(row.offer_amount || 0),
      amount: Number(row.offer_amount || 0),
      currency: row.currency || getLocaleConfig().currency,
      status: row.status || "pending",
      createdAt: Number(row.created_at_ms || Date.now()),
      updatedAt: Number(row.updated_at_ms || row.created_at_ms || Date.now()),
      expiresAt: Number(row.expires_at_ms || (Date.now() + OFFER_EXPIRY_MS)),
      paymentAuthorizationStatus: row.payment_authorization_status || "payment_authorized",
      paymentIntentReference: row.payment_intent_reference || "",
      authorizationReference: row.authorization_reference || "",
      checkoutSessionId: row.checkout_session_id || "",
      authorizationExpiresAt: row.authorization_expires_at || null,
      orderId: row.order_id || null,
      shippingSnapshot: row.shipping_snapshot || null,
      paymentMethodSnapshot: row.payment_method_snapshot || null,
      minimumOfferAmount: row.minimum_offer_amount === null || row.minimum_offer_amount === undefined ? null : Number(row.minimum_offer_amount),
      capturedAt: row.captured_at_ms || null,
      releasedAt: row.released_at_ms || null,
      reason: row.release_reason || ""
    });
  }

  function buildSupabaseOrderPayload(order) {
    const normalized = normalizeOrderRecord(order);
    return {
      id: String(normalized.id),
      number: normalized.number || "",
      buyer_id: normalizeSupabaseUuid(normalized.buyerId),
      buyer_email: normalizeEmail(normalized.buyerEmail),
      buyer_name: normalized.buyerName || "",
      seller_emails: Array.isArray(normalized.sellerEmails) ? normalized.sellerEmails.map(normalizeEmail).filter(Boolean) : [],
      items: Array.isArray(normalized.items) ? normalized.items : [],
      shipping: normalized.shipping || {},
      status: normalized.status || "paid",
      payment: normalized.payment || {},
      timeline: Array.isArray(normalized.timeline) ? normalized.timeline : [],
      support_ticket_ids: Array.isArray(normalized.supportTicketIds) ? normalized.supportTicketIds : [],
      email_ids: Array.isArray(normalized.emailIds) ? normalized.emailIds : [],
      notification_ids: Array.isArray(normalized.notificationIds) ? normalized.notificationIds : [],
      review_status: normalized.reviewStatus || "pending",
      created_at_ms: Number(normalized.createdAt || Date.now()),
      subtotal: Number(normalized.subtotal || 0),
      shipping_cost: Number(normalized.shippingCost || 0),
      total: Number(normalized.total || 0),
      offer_id: normalized.offerId || null
    };
  }

  function buildOrderFromSupabaseRow(row) {
    if (!row) {
      return null;
    }
    return normalizeOrderRecord({
      id: row.id,
      number: row.number || "",
      buyerId: row.buyer_id || "",
      buyerEmail: row.buyer_email || "",
      buyerName: row.buyer_name || "",
      sellerEmails: row.seller_emails || [],
      items: row.items || [],
      shipping: row.shipping || {},
      status: row.status || "paid",
      payment: row.payment || {},
      timeline: row.timeline || [],
      supportTicketIds: row.support_ticket_ids || [],
      emailIds: row.email_ids || [],
      notificationIds: row.notification_ids || [],
      reviewStatus: row.review_status || "pending",
      createdAt: Number(row.created_at_ms || Date.now()),
      subtotal: Number(row.subtotal || 0),
      shippingCost: Number(row.shipping_cost || 0),
      total: Number(row.total || 0),
      offerId: row.offer_id || null,
      paymentStatus: row.payment_status || "",
      payoutStatus: row.payout_status || "",
      currency: row.currency || getLocaleConfig().currency,
      checkoutSessionId: row.checkout_session_id || "",
      paymentIntentId: row.payment_intent_id || "",
      transferGroup: row.transfer_group || "",
      shippedAt: row.shipped_at || null,
      deliveredAt: row.delivered_at || null,
      paymentCapturedAt: row.payment_captured_at || null
    });
  }

  function normalizeBackendOrderResponse(order) {
    if (!order) {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(order, "buyer_id") || Object.prototype.hasOwnProperty.call(order, "created_at_ms")) {
      return buildOrderFromSupabaseRow(order);
    }
    return normalizeOrderRecord(order);
  }

  function applyRemoteOrderUpdate(orderId, remoteOrder) {
    const normalized = normalizeBackendOrderResponse(remoteOrder);
    if (!normalized) {
      return null;
    }
    state.orders = state.orders.map(function (order) {
      return order.id === orderId ? normalized : order;
    });
    persistOrders();
    syncInventoryFromOrders();
    renderOrderDetailModal();
    renderProfilePanel();
    renderOpsView();
    renderNotifications();
    return normalized;
  }

  function buildSupabaseSupportTicketPayload(ticket) {
    const normalized = normalizeSupportTicketRecord(ticket);
    return {
      id: String(normalized.id),
      order_id: normalized.orderId || "",
      order_number: normalized.orderNumber || "",
      product_id: normalized.productId || "",
      product_title: normalized.productTitle || "",
      buyer_email: normalizeEmail(normalized.buyerEmail),
      seller_email: normalizeEmail(normalized.sellerEmail),
      requester_id: normalizeSupabaseUuid(normalized.requesterId || (state.currentUser && state.currentUser.id)),
      requester_email: normalizeEmail(normalized.requesterEmail),
      requester_role: normalized.requesterRole || "buyer",
      severity: normalized.severity || "support",
      status: normalized.status || "open",
      reason: normalized.reason || "other",
      message: normalized.message || "",
      attachments: Array.isArray(normalized.attachments) ? normalized.attachments : [],
      context_snapshot: normalized.contextSnapshot || {},
      created_at_ms: Number(normalized.createdAt || Date.now()),
      updated_at_ms: Number(normalized.updatedAt || normalized.createdAt || Date.now())
    };
  }

  function buildSupportTicketFromSupabaseRow(row) {
    if (!row) {
      return null;
    }
    return normalizeSupportTicketRecord({
      id: row.id,
      orderId: row.order_id || "",
      orderNumber: row.order_number || "",
      productId: row.product_id || "",
      productTitle: row.product_title || "",
      buyerEmail: row.buyer_email || "",
      sellerEmail: row.seller_email || "",
      requesterId: row.requester_id || "",
      requesterEmail: row.requester_email || "",
      requesterRole: row.requester_role || "buyer",
      severity: row.severity || "support",
      status: row.status || "open",
      reason: row.reason || "other",
      message: row.message || "",
      attachments: row.attachments || [],
      contextSnapshot: row.context_snapshot || {},
      createdAt: Number(row.created_at_ms || Date.now()),
      updatedAt: Number(row.updated_at_ms || row.created_at_ms || Date.now())
    });
  }

  function buildSupabaseConversationPayload(thread) {
    const normalized = normalizeChatThread(thread);
    const firstMessage = normalized.msgs[0];
    return {
      id: String(normalized.id),
      listing_id: normalized.listingId || normalized.productId || null,
      product_id: normalized.productId || normalized.listingId || null,
      seller_id: normalizeSupabaseUuid(normalized.sellerId),
      seller_email: normalizeEmail(normalized.sellerEmail),
      seller_name: normalized.sellerName || "",
      buyer_id: normalizeSupabaseUuid(normalized.buyerId),
      buyer_email: normalizeEmail(normalized.buyerEmail),
      buyer_name: normalized.buyerName || "",
      unread_count: Number(normalized.unreadCount || 0),
      updated_at_ms: Number(normalized.updatedAt || (firstMessage && firstMessage.at) || Date.now()),
      created_at_ms: Number((firstMessage && firstMessage.at) || normalized.updatedAt || Date.now())
    };
  }

  function buildConversationModerationSnapshot(thread) {
    const normalized = normalizeChatThread(thread);
    return {
      id: String(normalized.id),
      listingId: normalized.listingId || normalized.productId || "",
      productId: normalized.productId || normalized.listingId || "",
      sellerId: normalized.sellerId || "",
      sellerEmail: normalizeEmail(normalized.sellerEmail || ""),
      sellerName: normalized.sellerName || "",
      buyerId: normalized.buyerId || "",
      buyerEmail: normalizeEmail(normalized.buyerEmail || ""),
      buyerName: normalized.buyerName || "",
    };
  }

  function buildSupabaseConversationMessagePayload(conversationId, message, thread) {
    const normalized = normalizeChatMessageRecord(message);
    const normalizedThread = normalizeChatThread(thread || { id: conversationId });
    const conversationScope = getChatConversationScope(normalizedThread);
    const senderRole = normalized.from === "me"
      ? (conversationScope === "selling" ? "seller" : "buyer")
      : (conversationScope === "selling" ? "buyer" : "seller");
    const senderEmail = senderRole === "seller"
      ? normalizeEmail(normalizedThread.sellerEmail || "")
      : normalizeEmail(normalizedThread.buyerEmail || "");
    return {
      id: String(normalized.id),
      conversation_id: String(conversationId),
      sender_role: senderRole,
      sender_email: senderEmail,
      body: normalized.text || "",
      sent_at_ms: Number(normalized.at || Date.now()),
      time_label: normalized.time || ""
    };
  }

  function buildChatMessageFromSupabaseRow(row, conversation) {
    if (!row) {
      return null;
    }
    const currentEmail = normalizeEmail((state.currentUser && state.currentUser.email) || "");
    const senderEmail = normalizeEmail(row.sender_email || "");
    const inferredFrom = senderEmail && currentEmail && senderEmail === currentEmail ? "me" : "them";
    return normalizeChatMessageRecord({
      id: row.id,
      from: inferredFrom,
      text: row.body || "",
      time: row.time_label || formatRelativeTime(row.sent_at_ms || Date.now()),
      at: Number(row.sent_at_ms || Date.now()),
      senderRole: row.sender_role || "",
      senderEmail: senderEmail,
      conversationId: conversation && conversation.id ? conversation.id : row.conversation_id
    });
  }

  function buildChatThreadFromSupabaseRow(row) {
    if (!row) {
      return null;
    }
    const baseThread = normalizeChatThread({
      id: row.id,
      listingId: row.listing_id || row.product_id || null,
      productId: row.product_id || row.listing_id || null,
      sellerId: row.seller_id || "",
      sellerEmail: row.seller_email || "",
      sellerName: row.seller_name || "",
      buyerId: row.buyer_id || "",
      buyerEmail: row.buyer_email || "",
      buyerName: row.buyer_name || "",
      unreadCount: Number(row.unread_count || 0),
      updatedAt: Number(row.updated_at_ms || row.created_at_ms || Date.now()),
      msgs: []
    });
    const messages = Array.isArray(row.conversation_messages)
      ? row.conversation_messages.map(function (messageRow) {
          return buildChatMessageFromSupabaseRow(messageRow, baseThread);
        }).filter(Boolean).sort(function (left, right) { return Number(left.at || 0) - Number(right.at || 0); })
      : [];
    return normalizeChatThread(Object.assign({}, baseThread, {
      msgs: messages,
      updatedAt: Number(row.updated_at_ms || (messages[messages.length - 1] && messages[messages.length - 1].at) || Date.now())
    }));
  }

  function dataUrlToBlob(dataUrl) {
    const parts = String(dataUrl || "").split(",");
    if (parts.length < 2) {
      return null;
    }
    const mimeMatch = parts[0].match(/data:([^;]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mimeType });
  }

  function isRemoteImageSource(src) {
    return /^https?:\/\//i.test(String(src || ""));
  }

  function buildListingImagePath(listingId, photo, index) {
    const safeUserId = getCurrentSupabaseUserId() || slugify(state.currentUser && state.currentUser.email) || "anonymous";
    const safeListingId = String(listingId || createId("listing"));
    const baseName = (photo && photo.name ? String(photo.name) : `photo-${index + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `photo-${index + 1}`;
    return `${safeUserId}/${safeListingId}/${Date.now()}-${index + 1}-${baseName}.jpg`;
  }

  async function uploadListingPhotosToSupabase(photos, listingId) {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId() || !Array.isArray(photos) || !photos.length) {
      return Array.isArray(photos) ? photos : [];
    }
    const bucket = SUPABASE_STORAGE_BUCKETS.listingImages;
    const uploadedPhotos = await Promise.all(photos.map(async function (photo, index) {
      if (!photo || !photo.src) {
        return photo;
      }
      if (photo.storagePath && isRemoteImageSource(photo.src)) {
        return photo;
      }
      if (isRemoteImageSource(photo.src) && !/^data:image\//i.test(String(photo.src))) {
        return photo;
      }
      const blob = dataUrlToBlob(photo.src);
      if (!blob) {
        return photo;
      }
      const path = buildListingImagePath(listingId, photo, index);
      const uploadResponse = await client.storage.from(bucket).upload(path, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: true
      });
      if (uploadResponse.error) {
        throw uploadResponse.error;
      }
      const publicUrlResponse = client.storage.from(bucket).getPublicUrl(path);
      const publicUrl = publicUrlResponse && publicUrlResponse.data ? publicUrlResponse.data.publicUrl : "";
      return Object.assign({}, photo, {
        src: publicUrl || photo.src,
        publicUrl: publicUrl || photo.src,
        storagePath: path
      });
    }));
    return uploadedPhotos;
  }

  async function fetchSupabaseListings() {
    const client = getSupabaseClient();
    if (!client) {
      return [];
    }
    const response = await client
      .from("listings")
      .select("*")
      .order("date_created_ms", { ascending: false })
      .limit(250);
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildListingFromSupabaseRow).filter(Boolean) : [];
  }

  async function saveListingToSupabase(listing) {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return normalizeListingRecord(listing);
    }
    const payload = buildSupabaseListingPayload(listing);
    const response = await client.from("listings").upsert(payload, { onConflict: "id" }).select("*").single();
    if (response.error) {
      throw response.error;
    }
    return buildListingFromSupabaseRow(response.data);
  }

  async function fetchSupabaseOffers() {
    const client = getSupabaseClient();
    const currentSupabaseUserId = getCurrentSupabaseUserId();
    if (!client || !currentSupabaseUserId) {
      return [];
    }
    let query = client
      .from("offers")
      .select("*")
      .order("created_at_ms", { ascending: false })
      .limit(250);
    if (!isCurrentUserAdmin()) {
      query = query.or(`buyer_id.eq.${currentSupabaseUserId},seller_id.eq.${currentSupabaseUserId}`);
    }
    const response = await query;
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildOfferFromSupabaseRow).filter(Boolean) : [];
  }

  async function saveOfferToSupabase(offer) {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return normalizeOfferRecord(offer);
    }
    const payload = buildSupabaseOfferPayload(offer);
    const response = await client.from("offers").upsert(payload, { onConflict: "id" }).select("*").single();
    if (response.error) {
      throw response.error;
    }
    return buildOfferFromSupabaseRow(response.data);
  }

  async function fetchSupabaseOrders() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return [];
    }
    const response = await client
      .from("orders")
      .select("*")
      .order("created_at_ms", { ascending: false })
      .limit(250);
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildOrderFromSupabaseRow).filter(Boolean) : [];
  }

  async function saveOrderToSupabase(order) {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return normalizeOrderRecord(order);
    }
    const payload = buildSupabaseOrderPayload(order);
    const response = await client.from("orders").upsert(payload, { onConflict: "id" }).select("*").single();
    if (response.error) {
      throw response.error;
    }
    return buildOrderFromSupabaseRow(response.data);
  }

  async function fetchSupabaseSupportTickets() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return [];
    }
    const response = await client
      .from("support_tickets")
      .select("*")
      .order("created_at_ms", { ascending: false })
      .limit(250);
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildSupportTicketFromSupabaseRow).filter(Boolean) : [];
  }

  async function saveSupportTicketToSupabase(ticket) {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return normalizeSupportTicketRecord(ticket);
    }
    const payload = buildSupabaseSupportTicketPayload(ticket);
    const response = await client.from("support_tickets").upsert(payload, { onConflict: "id" }).select("*").single();
    if (response.error) {
      throw response.error;
    }
    return buildSupportTicketFromSupabaseRow(response.data);
  }

  async function fetchSupabaseChats() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return [];
    }
    let query = client
      .from("conversations")
      .select("*, conversation_messages(*)")
      .order("updated_at_ms", { ascending: false })
      .limit(250);
    if (!isCurrentUserAdmin()) {
      const currentEmail = normalizeEmail(state.currentUser.email);
      query = query.or(`buyer_email.eq.${currentEmail},seller_email.eq.${currentEmail}`);
    }
    const response = await query;
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildChatThreadFromSupabaseRow).filter(Boolean) : [];
  }

  async function saveConversationToSupabase(thread) {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return normalizeChatThread(thread);
    }
    const normalized = normalizeChatThread(thread);
    const conversationPayload = buildSupabaseConversationPayload(normalized);
    const conversationResponse = await client
      .from("conversations")
      .upsert(conversationPayload, { onConflict: "id" })
      .select("*")
      .single();
    if (conversationResponse.error) {
      throw conversationResponse.error;
    }
    return normalizeChatThread(Object.assign({}, normalized, {
      unreadCount: Number(conversationResponse.data && conversationResponse.data.unread_count || normalized.unreadCount || 0),
      updatedAt: Number(conversationResponse.data && conversationResponse.data.updated_at_ms || normalized.updatedAt || Date.now()),
    }));
  }

  async function appendChatMessageToSupabase(thread, message) {
    const normalizedThread = normalizeChatThread(thread);
    const messageText = typeof message === "string"
      ? String(message || "").trim()
      : String(message && message.text || "").trim();
    if (!messageText) {
      return { ok: true, allowed: false, blocked: true };
    }
    return invokeSupabaseFunction("send-chat-message", {
      conversationId: normalizedThread.id,
      body: messageText,
      conversation: buildConversationModerationSnapshot(normalizedThread),
    });
  }

  async function refreshSupabaseChats() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId() || typeof chats === "undefined") {
      return;
    }
    const remoteChats = await fetchSupabaseChats();
    const remoteIds = new Set(remoteChats.map(function (thread) { return String(thread.id); }));
    const localOnly = chats.filter(function (thread) {
      return !remoteIds.has(String(thread.id));
    });
    chats.splice(0, chats.length);
    remoteChats.concat(localOnly.map(normalizeChatThread)).forEach(function (thread) {
      chats.push(normalizeChatThread(thread));
    });
    persistChats();
    if (localOnly.length) {
      Promise.all(localOnly.map(function (thread) {
        return saveConversationToSupabase(thread).catch(function (error) {
          console.warn("[IRIS] Unable to backfill local chat to Supabase", error);
          return null;
        });
      })).then(function () {
        renderChats();
      });
    }
    if (typeof renderChats === "function") {
      renderChats();
    }
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
  }

  async function initializeSupabaseChats() {
    if (supabaseChatsInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseChatsInitialized = true;
    if (!getCurrentSupabaseUserId() || typeof chats === "undefined") {
      return;
    }
    try {
      await refreshSupabaseChats();
    } catch (error) {
      console.warn("[IRIS] Unable to load chats from Supabase", error);
    }
  }

  function buildSupabaseFavoritePayload(productId) {
    return {
      id: `${state.currentUser.id}:${productId}`,
      user_id: state.currentUser.id,
      user_email: normalizeEmail(state.currentUser.email || ""),
      product_id: String(productId),
      created_at_ms: Date.now()
    };
  }

  function buildFavoriteFromSupabaseRow(row) {
    return row && row.product_id ? String(row.product_id) : "";
  }

  async function fetchSupabaseFavorites() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return [];
    }
    const response = await client
      .from("favorites")
      .select("*")
      .order("created_at_ms", { ascending: false });
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildFavoriteFromSupabaseRow).filter(Boolean) : [];
  }

  async function saveFavoriteToSupabase(productId, isFavorite) {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId() || !productId) {
      return;
    }
    if (isFavorite) {
      const response = await client.from("favorites").upsert(buildSupabaseFavoritePayload(productId), { onConflict: "id" });
      if (response.error) {
        throw response.error;
      }
      return;
    }
    const response = await client.from("favorites").delete().eq("id", `${state.currentUser.id}:${productId}`);
    if (response.error) {
      throw response.error;
    }
  }

  async function refreshSupabaseFavorites() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const remoteFavorites = await fetchSupabaseFavorites();
    const localFavoriteIds = Array.from(favorites || new Set()).map(String);
    const mergedFavorites = Array.from(new Set(remoteFavorites.concat(localFavoriteIds)));
    favorites = new Set(mergedFavorites);
    saveJson(STORAGE_KEYS.favorites, Array.from(favorites));
    const remoteIds = new Set(remoteFavorites.map(String));
    const localOnly = localFavoriteIds.filter(function (productId) { return !remoteIds.has(String(productId)); });
    if (localOnly.length) {
      Promise.all(localOnly.map(function (productId) {
        return saveFavoriteToSupabase(productId, true).catch(function (error) {
          console.warn("[IRIS] Unable to backfill local favorite to Supabase", error);
          return null;
        });
      }));
    }
    updateFavBadge();
    if (typeof render === "function") {
      render();
    }
    renderProfilePanel();
  }

  async function initializeSupabaseFavorites() {
    if (supabaseFavoritesInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseFavoritesInitialized = true;
    if (!getCurrentSupabaseUserId()) {
      return;
    }
    try {
      await refreshSupabaseFavorites();
    } catch (error) {
      console.warn("[IRIS] Unable to load favorites from Supabase", error);
    }
  }

  function normalizeCartRecord(item) {
    return {
      productId: item && item.productId ? String(item.productId) : "",
      qty: Math.max(1, Number((item && item.qty) || 1))
    };
  }

  function buildSupabaseCartPayload(item) {
    const normalized = normalizeCartRecord(item);
    return {
      id: `${state.currentUser.id}:${normalized.productId}`,
      user_id: state.currentUser.id,
      user_email: normalizeEmail(state.currentUser.email || ""),
      product_id: normalized.productId,
      qty: normalized.qty,
      updated_at_ms: Date.now()
    };
  }

  function buildCartRecordFromSupabaseRow(row) {
    return normalizeCartRecord({
      productId: row.product_id,
      qty: row.qty
    });
  }

  async function fetchSupabaseCart() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return [];
    }
    const response = await client
      .from("cart_items")
      .select("*")
      .order("updated_at_ms", { ascending: false });
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildCartRecordFromSupabaseRow).filter(Boolean) : [];
  }

  async function syncCartToSupabase() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const currentCart = Array.isArray(state.cart) ? state.cart.map(normalizeCartRecord).filter(function (item) { return item.productId; }) : [];
    const existingRows = await fetchSupabaseCart();
    const existingIds = existingRows.map(function (item) { return `${state.currentUser.id}:${item.productId}`; });
    const nextIds = currentCart.map(function (item) { return `${state.currentUser.id}:${item.productId}`; });
    const deletedIds = existingIds.filter(function (id) { return nextIds.indexOf(id) === -1; });
    if (deletedIds.length) {
      const deleteResponse = await client.from("cart_items").delete().in("id", deletedIds);
      if (deleteResponse.error) {
        throw deleteResponse.error;
      }
    }
    if (currentCart.length) {
      const upsertResponse = await client.from("cart_items").upsert(currentCart.map(buildSupabaseCartPayload), { onConflict: "id" });
      if (upsertResponse.error) {
        throw upsertResponse.error;
      }
    }
  }

  async function refreshSupabaseCart() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const remoteCart = await fetchSupabaseCart();
    const cartMap = {};
    remoteCart.concat(Array.isArray(state.cart) ? state.cart.map(normalizeCartRecord) : []).forEach(function (item) {
      if (!item || !item.productId) {
        return;
      }
      cartMap[item.productId] = {
        productId: item.productId,
        qty: Math.max(item.qty || 1, cartMap[item.productId] ? cartMap[item.productId].qty : 0)
      };
    });
    state.cart = Object.keys(cartMap).map(function (productId) { return cartMap[productId]; });
    saveJson(STORAGE_KEYS.cart, state.cart);
    if (state.cart.length) {
      syncCartToSupabase().catch(function (error) {
        console.warn("[IRIS] Unable to backfill local cart to Supabase", error);
      });
    }
    updateCartBadge();
    renderCartDrawer();
    renderProfilePanel();
  }

  async function initializeSupabaseCart() {
    if (supabaseCartInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseCartInitialized = true;
    if (!getCurrentSupabaseUserId()) {
      return;
    }
    try {
      await refreshSupabaseCart();
    } catch (error) {
      console.warn("[IRIS] Unable to load cart from Supabase", error);
    }
  }

  function normalizeReviewRecord(review) {
    return Object.assign({
      id: createId("rev"),
      orderId: "",
      productId: "",
      product: "",
      sellerId: "",
      sellerEmail: "",
      buyerId: state.currentUser && state.currentUser.id ? state.currentUser.id : "",
      buyerEmail: normalizeEmail((state.currentUser && state.currentUser.email) || ""),
      buyer: state.currentUser && state.currentUser.name ? state.currentUser.name : langText("Cliente IRIS", "IRIS customer"),
      rating: 5,
      text: "",
      date: "",
      createdAt: Date.now()
    }, review || {}, {
      rating: Math.max(1, Math.min(5, Number((review && review.rating) || 5))),
      buyerEmail: normalizeEmail((review && review.buyerEmail) || (state.currentUser && state.currentUser.email) || ""),
      createdAt: Number((review && review.createdAt) || Date.now())
    });
  }

  function buildSupabaseReviewPayload(review) {
    const normalized = normalizeReviewRecord(review);
    return {
      id: String(normalized.id),
      order_id: normalized.orderId || "",
      product_id: normalized.productId || "",
      product_title: normalized.product || "",
      seller_id: normalizeSupabaseUuid(normalized.sellerId),
      seller_email: normalizeEmail(normalized.sellerEmail || ""),
      buyer_id: normalizeSupabaseUuid(normalized.buyerId || (state.currentUser && state.currentUser.id)),
      buyer_email: normalizeEmail(normalized.buyerEmail || ""),
      buyer_name: normalized.buyer || "",
      rating: normalized.rating,
      body: normalized.text || "",
      display_date: normalized.date || "",
      created_at_ms: normalized.createdAt
    };
  }

  function buildReviewFromSupabaseRow(row) {
    if (!row) {
      return null;
    }
    return normalizeReviewRecord({
      id: row.id,
      orderId: row.order_id || "",
      productId: row.product_id || "",
      product: row.product_title || "",
      sellerId: row.seller_id || "",
      sellerEmail: row.seller_email || "",
      buyerId: row.buyer_id || "",
      buyerEmail: row.buyer_email || "",
      buyer: row.buyer_name || "",
      rating: Number(row.rating || 5),
      text: row.body || "",
      date: row.display_date || "",
      createdAt: Number(row.created_at_ms || Date.now())
    });
  }

  async function fetchSupabaseReviews() {
    const client = getSupabaseClient();
    if (!client) {
      return [];
    }
    const response = await client
      .from("reviews")
      .select("*")
      .order("created_at_ms", { ascending: false })
      .limit(500);
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildReviewFromSupabaseRow).filter(Boolean) : [];
  }

  async function syncReviewsToSupabase() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const currentReviews = Array.isArray(state.reviews) ? state.reviews.map(normalizeReviewRecord) : [];
    if (!currentReviews.length) {
      return;
    }
    const response = await client.from("reviews").upsert(currentReviews.map(buildSupabaseReviewPayload), { onConflict: "id" });
    if (response.error) {
      throw response.error;
    }
  }

  async function refreshSupabaseReviews() {
    const remoteReviews = await fetchSupabaseReviews();
    const remoteIds = new Set(remoteReviews.map(function (review) { return String(review.id); }));
    const localOnly = state.reviews.filter(function (review) { return !remoteIds.has(String(review.id)); });
    state.reviews = remoteReviews.concat(localOnly.map(normalizeReviewRecord));
    saveJson(STORAGE_KEYS.reviews, state.reviews);
    if (localOnly.length) {
      syncReviewsToSupabase().catch(function (error) {
        console.warn("[IRIS] Unable to backfill local reviews to Supabase", error);
      });
    }
    hydrateStoredReviews();
    renderProfilePanel();
    renderOpsView();
  }

  async function initializeSupabaseReviews() {
    if (supabaseReviewsInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseReviewsInitialized = true;
    try {
      await refreshSupabaseReviews();
    } catch (error) {
      console.warn("[IRIS] Unable to load reviews from Supabase", error);
    }
  }

  function normalizeMeasurementRequestRecord(request) {
    return Object.assign({
      id: createId("msr"),
      listingId: "",
      requesterId: state.currentUser && state.currentUser.id ? state.currentUser.id : "",
      requesterEmail: normalizeEmail((state.currentUser && state.currentUser.email) || ""),
      requesterName: state.currentUser && state.currentUser.name ? state.currentUser.name : "",
      sellerEmail: "",
      status: "open",
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, request || {}, {
      requesterEmail: normalizeEmail((request && request.requesterEmail) || (state.currentUser && state.currentUser.email) || ""),
      sellerEmail: normalizeEmail((request && request.sellerEmail) || ""),
      createdAt: Number((request && request.createdAt) || Date.now()),
      updatedAt: Number((request && request.updatedAt) || (request && request.createdAt) || Date.now())
    });
  }

  function buildSupabaseMeasurementRequestPayload(request) {
    const normalized = normalizeMeasurementRequestRecord(request);
    return {
      id: String(normalized.id),
      listing_id: normalized.listingId || "",
      requester_id: normalizeSupabaseUuid(normalized.requesterId || (state.currentUser && state.currentUser.id)),
      requester_email: normalizeEmail(normalized.requesterEmail || ""),
      requester_name: normalized.requesterName || "",
      seller_email: normalizeEmail(normalized.sellerEmail || ""),
      status: normalized.status || "open",
      created_at_ms: normalized.createdAt,
      updated_at_ms: normalized.updatedAt
    };
  }

  function buildMeasurementRequestFromSupabaseRow(row) {
    if (!row) {
      return null;
    }
    return normalizeMeasurementRequestRecord({
      id: row.id,
      listingId: row.listing_id || "",
      requesterId: row.requester_id || "",
      requesterEmail: row.requester_email || "",
      requesterName: row.requester_name || "",
      sellerEmail: row.seller_email || "",
      status: row.status || "open",
      createdAt: Number(row.created_at_ms || Date.now()),
      updatedAt: Number(row.updated_at_ms || row.created_at_ms || Date.now())
    });
  }

  async function fetchSupabaseMeasurementRequests() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return [];
    }
    const response = await client
      .from("measurement_requests")
      .select("*")
      .order("created_at_ms", { ascending: false })
      .limit(250);
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildMeasurementRequestFromSupabaseRow).filter(Boolean) : [];
  }

  async function syncMeasurementRequestsToSupabase() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const currentRequests = Array.isArray(state.measurementRequests) ? state.measurementRequests.map(normalizeMeasurementRequestRecord) : [];
    if (!currentRequests.length) {
      return;
    }
    const response = await client.from("measurement_requests").upsert(currentRequests.map(buildSupabaseMeasurementRequestPayload), { onConflict: "id" });
    if (response.error) {
      throw response.error;
    }
  }

  async function refreshSupabaseMeasurementRequests() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const remoteRequests = await fetchSupabaseMeasurementRequests();
    const remoteIds = new Set(remoteRequests.map(function (request) { return String(request.id); }));
    const localOnly = state.measurementRequests.filter(function (request) { return !remoteIds.has(String(request.id)); });
    state.measurementRequests = remoteRequests.concat(localOnly.map(normalizeMeasurementRequestRecord));
    saveJson(STORAGE_KEYS.measurementRequests, state.measurementRequests);
    if (localOnly.length) {
      syncMeasurementRequestsToSupabase().catch(function (error) {
        console.warn("[IRIS] Unable to backfill local measurement requests to Supabase", error);
      });
    }
    renderProfilePanel();
    if (state.activeDetailListingId && typeof showDetail === "function") {
      showDetail(state.activeDetailListingId);
    }
  }

  async function initializeSupabaseMeasurementRequests() {
    if (supabaseMeasurementRequestsInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseMeasurementRequestsInitialized = true;
    if (!getCurrentSupabaseUserId()) {
      return;
    }
    try {
      await refreshSupabaseMeasurementRequests();
    } catch (error) {
      console.warn("[IRIS] Unable to load measurement requests from Supabase", error);
    }
  }

  function normalizeNotificationRecord(notification) {
    return Object.assign({
      id: createId("ntf"),
      kind: "system",
      title: "IRIS",
      body: "",
      recipientId: null,
      recipientEmail: "",
      audience: "user",
      unread: true,
      link: "",
      conversationId: "",
      orderId: "",
      productId: "",
      scope: "",
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, notification || {}, {
      recipientEmail: normalizeEmail((notification && notification.recipientEmail) || ""),
      unread: notification && notification.unread === false ? false : true,
      createdAt: Number((notification && notification.createdAt) || Date.now()),
      updatedAt: Number((notification && notification.updatedAt) || (notification && notification.createdAt) || Date.now())
    });
  }

  function buildSupabaseNotificationPayload(notification) {
    const normalized = normalizeNotificationRecord(notification);
    return {
      id: String(normalized.id),
      recipient_id: normalizeSupabaseUuid(normalized.recipientId),
      recipient_email: normalizeEmail(normalized.recipientEmail || ""),
      audience: normalized.audience || "user",
      kind: normalized.kind || "system",
      title: normalized.title || "IRIS",
      body: normalized.body || "",
      link: normalized.link || "",
      conversation_id: normalized.conversationId || "",
      order_id: normalized.orderId || "",
      product_id: normalized.productId || "",
      scope: normalized.scope || "",
      unread: normalized.unread !== false,
      created_at_ms: normalized.createdAt,
      updated_at_ms: normalized.updatedAt
    };
  }

  function buildNotificationFromSupabaseRow(row) {
    if (!row) {
      return null;
    }
    return normalizeNotificationRecord({
      id: row.id,
      recipientId: row.recipient_id || null,
      recipientEmail: row.recipient_email || "",
      audience: row.audience || "user",
      kind: row.kind || "system",
      title: row.title || "IRIS",
      body: row.body || "",
      link: row.link || "",
      conversationId: row.conversation_id || "",
      orderId: row.order_id || "",
      productId: row.product_id || "",
      scope: row.scope || "",
      unread: row.unread !== false,
      createdAt: Number(row.created_at_ms || Date.now()),
      updatedAt: Number(row.updated_at_ms || row.created_at_ms || Date.now())
    });
  }

  async function fetchSupabaseNotifications() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return [];
    }
    const response = await client
      .from("notifications")
      .select("*")
      .order("created_at_ms", { ascending: false })
      .limit(500);
    if (response.error) {
      throw response.error;
    }
    return Array.isArray(response.data) ? response.data.map(buildNotificationFromSupabaseRow).filter(Boolean) : [];
  }

  async function syncNotificationsToSupabase() {
    const client = getSupabaseClient();
    const currentUserId = getCurrentSupabaseUserId();
    const currentEmail = normalizeEmail(state.currentUser && state.currentUser.email);
    if (!client || !currentUserId) {
      return;
    }
    const currentNotifications = Array.isArray(state.notifications)
      ? state.notifications
        .map(normalizeNotificationRecord)
        .filter(function (notification) {
          const recipientId = normalizeSupabaseUuid(notification.recipientId);
          const recipientEmail = normalizeEmail(notification.recipientEmail);
          return recipientId === currentUserId || (currentEmail && recipientEmail === currentEmail);
        })
      : [];
    if (!currentNotifications.length) {
      return;
    }
    const response = await client.from("notifications").upsert(currentNotifications.map(buildSupabaseNotificationPayload), { onConflict: "id" });
    if (response.error) {
      throw response.error;
    }
  }

  async function refreshSupabaseNotifications() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const remoteNotifications = await fetchSupabaseNotifications();
    const remoteIds = new Set(remoteNotifications.map(function (notification) { return String(notification.id); }));
    const localOnly = state.notifications.filter(function (notification) { return !remoteIds.has(String(notification.id)); });
    state.notifications = remoteNotifications.concat(localOnly.map(normalizeNotificationRecord));
    saveJson(STORAGE_KEYS.notifications, state.notifications);
    if (localOnly.length) {
      syncNotificationsToSupabase().catch(function (error) {
        console.warn("[IRIS] Unable to backfill local notifications to Supabase", error);
      });
    }
    renderNotifications();
    renderProfilePanel();
    renderOpsView();
  }

  async function initializeSupabaseNotifications() {
    if (supabaseNotificationsInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseNotificationsInitialized = true;
    if (!getCurrentSupabaseUserId()) {
      return;
    }
    try {
      await refreshSupabaseNotifications();
    } catch (error) {
      console.warn("[IRIS] Unable to load notifications from Supabase", error);
    }
  }

  async function refreshSupabaseSupportTickets() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const remoteTickets = await fetchSupabaseSupportTickets();
    const remoteIds = new Set(remoteTickets.map(function (ticket) { return String(ticket.id); }));
    const localOnly = state.supportTickets.filter(function (ticket) {
      return !remoteIds.has(String(ticket.id));
    });
    state.supportTickets = remoteTickets.concat(localOnly.map(normalizeSupportTicketRecord));
    persistSupportTickets();
    if (localOnly.length) {
      Promise.all(localOnly.map(function (ticket) {
        return saveSupportTicketToSupabase(ticket).catch(function (error) {
          console.warn("[IRIS] Unable to backfill local support ticket to Supabase", error);
          return null;
        });
      }));
    }
    if (typeof render === "function") {
      render();
    }
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
  }

  async function initializeSupabaseSupportTickets() {
    if (supabaseSupportInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseSupportInitialized = true;
    if (!getCurrentSupabaseUserId()) {
      return;
    }
    try {
      await refreshSupabaseSupportTickets();
    } catch (error) {
      console.warn("[IRIS] Unable to load support tickets from Supabase", error);
    }
  }

  async function refreshSupabaseOrders() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const remoteOrders = await fetchSupabaseOrders();
    const remoteIds = new Set(remoteOrders.map(function (order) { return String(order.id); }));
    const localOnly = state.orders.filter(function (order) {
      return !remoteIds.has(String(order.id));
    });
    state.orders = remoteOrders.concat(localOnly.map(normalizeOrderRecord));
    persistOrders();
    if (localOnly.length) {
      Promise.all(localOnly.map(function (order) {
        return saveOrderToSupabase(order).catch(function (error) {
          console.warn("[IRIS] Unable to backfill local order to Supabase", error);
          return null;
        });
      }));
    }
    syncInventoryFromOrders();
    if (typeof render === "function") {
      render();
    }
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
  }

  async function initializeSupabaseOrders() {
    if (supabaseOrdersInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseOrdersInitialized = true;
    if (!getCurrentSupabaseUserId()) {
      return;
    }
    try {
      await refreshSupabaseOrders();
    } catch (error) {
      console.warn("[IRIS] Unable to load orders from Supabase", error);
    }
  }

  async function refreshSupabaseOffers() {
    const client = getSupabaseClient();
    if (!client || !getCurrentSupabaseUserId()) {
      return;
    }
    const remoteOffers = await fetchSupabaseOffers();
    const remoteIds = new Set(remoteOffers.map(function (offer) { return String(offer.id); }));
    const localOnly = state.offers.filter(function (offer) {
      return !remoteIds.has(String(offer.id));
    });
    state.offers = remoteOffers.concat(localOnly.map(normalizeOfferRecord));
    persistOffers();
    if (localOnly.length) {
      Promise.all(localOnly.map(function (offer) {
        return saveOfferToSupabase(offer).catch(function (error) {
          console.warn("[IRIS] Unable to backfill local offer to Supabase", error);
          return null;
        });
      }));
    }
    if (typeof render === "function") {
      render();
    }
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
  }

  async function initializeSupabaseOffers() {
    if (supabaseOffersInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseOffersInitialized = true;
    if (!getCurrentSupabaseUserId()) {
      return;
    }
    try {
      await refreshSupabaseOffers();
    } catch (error) {
      console.warn("[IRIS] Unable to load offers from Supabase", error);
    }
  }

  async function refreshSupabaseListings() {
    const client = getSupabaseClient();
    if (!client) {
      return;
    }
    const remoteListings = await fetchSupabaseListings();
    const remoteIds = new Set(remoteListings.map(function (listing) { return String(listing.id); }));
    const localOnly = state.listings.filter(function (listing) {
      return !remoteIds.has(String(listing.id));
    });
    state.listings = remoteListings.concat(localOnly.map(normalizeListingRecord));
    saveJson(STORAGE_KEYS.listings, state.listings);
    if (localOnly.length) {
      Promise.all(localOnly.map(function (listing) {
        return saveListingToSupabase(listing).catch(function (error) {
          console.warn("[IRIS] Unable to backfill local listing to Supabase", error);
          return null;
        });
      }));
    }
    hydrateLocalListings();
    if (typeof render === "function") {
      render();
    }
    renderProfilePanel();
    renderOpsView();
  }

  async function initializeSupabaseListings() {
    if (supabaseListingsInitialized) {
      return;
    }
    if (!isSupabaseEnabled()) {
      return;
    }
    supabaseListingsInitialized = true;
    try {
      await refreshSupabaseListings();
    } catch (error) {
      console.warn("[IRIS] Unable to load listings from Supabase", error);
    }
  }

  async function fetchSupabaseProfile(userId) {
    const client = getSupabaseClient();
    if (!client || !userId) {
      return null;
    }
    const response = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (response.error) {
      throw response.error;
    }
    return response.data || null;
  }

  async function upsertSupabaseProfile(user, authUser) {
    const client = getSupabaseClient();
    if (!client) {
      return null;
    }
    const effectiveAuthUser = authUser || (await client.auth.getUser()).data.user;
    if (!effectiveAuthUser) {
      return null;
    }
    const payload = buildSupabaseProfilePayload(user || state.currentUser, effectiveAuthUser);
    const response = await client.from("profiles").upsert(payload, { onConflict: "id" }).select("*").single();
    if (response.error) {
      throw response.error;
    }
    return response.data || null;
  }

  function mergeUserIntoLocalCache(user) {
    if (!user || !user.email) {
      return;
    }
    const normalized = normalizeUserWorkspace(user);
    let found = false;
    state.users = state.users.map(function (entry) {
      if (normalizeEmail(entry.email) !== normalized.email) {
        return entry;
      }
      found = true;
      return Object.assign({}, entry, normalized, {
        authProvider: normalized.authProvider || entry.authProvider || "supabase"
      });
    });
    if (!found) {
      state.users.push(Object.assign({}, normalized, {
        authProvider: normalized.authProvider || "supabase"
      }));
    }
    saveJson(STORAGE_KEYS.users, state.users);
  }

  function getCachedUserByEmail(email) {
    const normalizedEmail = normalizeEmail(email || "");
    if (!normalizedEmail) {
      return null;
    }
    return state.users.find(function (entry) {
      return normalizeEmail(entry.email) === normalizedEmail;
    }) || null;
  }

  function isLocalOnlySessionUser(user) {
    if (!user || !user.email) {
      return false;
    }
    const cachedUser = getCachedUserByEmail(user.email);
    return Boolean(cachedUser && cachedUser.authProvider && cachedUser.authProvider !== "supabase");
  }

  function applyAuthenticatedUser(nextUser, options) {
    const normalized = normalizeUserWorkspace(nextUser);
    state.currentUser = normalized;
    state.sessionVerified = !options || options.verified !== false;
    saveJson(STORAGE_KEYS.session, state.currentUser);
    mergeUserIntoLocalCache(normalized);
    syncCurrentUserSeller();
    syncSessionUi();
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
    if (typeof syncTopnavChrome === "function") {
      syncTopnavChrome();
    }
    return normalized;
  }

  function clearAuthenticatedUser(options) {
    state.currentUser = null;
    state.sessionVerified = !options || options.verified !== false;
    state.cart = [];
    state.orders = [];
    state.offers = [];
    state.notifications = [];
    state.supportTickets = [];
    state.measurementRequests = [];
    if (Array.isArray(chats)) {
      chats.splice(0, chats.length);
    }
    favorites = new Set();
    saveJson(STORAGE_KEYS.session, null);
    saveJson(STORAGE_KEYS.cart, state.cart);
    saveJson(STORAGE_KEYS.orders, state.orders);
    saveJson(STORAGE_KEYS.offers, state.offers);
    saveJson(STORAGE_KEYS.notifications, state.notifications);
    saveJson(STORAGE_KEYS.supportTickets, state.supportTickets);
    saveJson(STORAGE_KEYS.measurementRequests, state.measurementRequests);
    saveJson(STORAGE_KEYS.chats, Array.isArray(chats) ? chats : []);
    saveJson(STORAGE_KEYS.favorites, []);
    syncSessionUi();
    updateCartBadge();
    updateFavBadge();
    renderCartDrawer();
    renderChats();
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
    if (typeof syncTopnavChrome === "function") {
      syncTopnavChrome();
    }
  }

  async function syncCurrentUserFromSupabaseSession(session) {
    if (!session || !session.user) {
      if (state.currentUser && isLocalOnlySessionUser(state.currentUser)) {
        return applyAuthenticatedUser(state.currentUser, { verified: true });
      }
      clearAuthenticatedUser({ verified: true });
      return null;
    }
    let profile = null;
    try {
      profile = await fetchSupabaseProfile(session.user.id);
    } catch (error) {
      console.warn("[IRIS] Unable to fetch Supabase profile", error);
    }
    if (!profile) {
      try {
        profile = await upsertSupabaseProfile({
          email: session.user.email || "",
          name: (session.user.user_metadata && (session.user.user_metadata.full_name || session.user.user_metadata.name)) || "",
          phone: (session.user.user_metadata && session.user.user_metadata.phone) || "",
          country: getWorkspaceDefaultCountry()
        }, session.user);
      } catch (error) {
        console.warn("[IRIS] Unable to bootstrap Supabase profile", error);
      }
    }
    const nextUser = buildWorkspaceUserFromSupabase(session.user, profile);
    const blockedMessage = getBlockedIdentityMessage(nextUser.email, nextUser.phone);
    if (nextUser.accountStatus === "banned" || blockedMessage) {
      try {
        const client = getSupabaseClient();
        if (client) {
          await client.auth.signOut();
        }
      } catch (error) {
        console.warn("[IRIS] Unable to sign out blocked user", error);
      }
      clearAuthenticatedUser({ verified: true });
      return null;
    }
    const applied = applyAuthenticatedUser(nextUser, { verified: true });
    refreshSupabaseListings().catch(function (error) {
      console.warn("[IRIS] Unable to refresh listings after auth sync", error);
    });
    refreshSupabaseOffers().catch(function (error) {
      console.warn("[IRIS] Unable to refresh offers after auth sync", error);
    });
    refreshSupabaseOrders().catch(function (error) {
      console.warn("[IRIS] Unable to refresh orders after auth sync", error);
    });
    refreshSupabaseSupportTickets().catch(function (error) {
      console.warn("[IRIS] Unable to refresh support tickets after auth sync", error);
    });
    refreshSupabaseChats().catch(function (error) {
      console.warn("[IRIS] Unable to refresh chats after auth sync", error);
    });
    refreshSupabaseFavorites().catch(function (error) {
      console.warn("[IRIS] Unable to refresh favorites after auth sync", error);
    });
    refreshSupabaseCart().catch(function (error) {
      console.warn("[IRIS] Unable to refresh cart after auth sync", error);
    });
    refreshSupabaseReviews().catch(function (error) {
      console.warn("[IRIS] Unable to refresh reviews after auth sync", error);
    });
    refreshSupabaseMeasurementRequests().catch(function (error) {
      console.warn("[IRIS] Unable to refresh measurement requests after auth sync", error);
    });
    refreshSupabaseNotifications().catch(function (error) {
      console.warn("[IRIS] Unable to refresh notifications after auth sync", error);
    });
    finalizeStripeReturn().catch(function (error) {
      console.warn("[IRIS] Unable to finalize Stripe return", error);
    });
    finalizeConnectReturn().catch(function (error) {
      console.warn("[IRIS] Unable to finalize Stripe Connect return", error);
    });
    return applied;
  }

  async function initializeSupabaseBridge() {
    if (supabaseBridgeInitialized) {
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      return;
    }
    supabaseBridgeInitialized = true;
    state.sessionVerified = false;
    client.auth.onAuthStateChange(function (event, session) {
      if (event === "PASSWORD_RECOVERY") {
        state.authMode = "recovery";
        renderAuthModal();
        const modal = qs("#irisxAuthModal");
        if (modal) {
          modal.classList.add("open");
        }
      }
      setTimeout(function () {
        syncCurrentUserFromSupabaseSession(session).catch(function (error) {
          console.warn("[IRIS] Auth state sync failed", error);
        });
      }, 0);
    });
    try {
      const sessionResponse = await client.auth.getSession();
      await syncCurrentUserFromSupabaseSession(sessionResponse && sessionResponse.data ? sessionResponse.data.session : null);
    } catch (error) {
      console.warn("[IRIS] Initial Supabase session bootstrap failed", error);
    }
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
    return `${locale.countryLabel || locale.nativeLabel || locale.label} · ${locale.currency}`;
  }

  function getLocaleOptionDetail(locale) {
    if (!locale) {
      return "";
    }
    return `${locale.currency} · ${locale.nativeLabel}`;
  }

  function getLocaleCurrencySymbol(locale) {
    if (!locale) {
      return "€";
    }
    try {
      const parts = new Intl.NumberFormat(locale.locale, {
        style: "currency",
        currency: locale.currency,
        maximumFractionDigits: locale.currency === "JPY" ? 0 : 2
      }).formatToParts(0);
      const currencyPart = parts.find(function (part) { return part.type === "currency"; });
      return currencyPart ? currencyPart.value : locale.currency;
    } catch (err) {
      return locale.currency || "€";
    }
  }

  function getLocaleCompactLabel(locale) {
    if (!locale) {
      return "";
    }
    return `${locale.label}`;
  }

  function syncLocaleTrigger() {
    const locale = getLocaleConfig();
    const trigger = qs("#tnLocaleTrigger");
    const triggerLabel = qs("#tnLocaleTriggerLabel");
    const triggerSymbol = qs("#tnLocaleTriggerSymbol");
    const mobileTrigger = qs("#tnMobileLangBtn");
    const profileTrigger = qs("#langToggle");

    if (triggerLabel) {
      triggerLabel.textContent = getLocaleCompactLabel(locale);
    }
    if (triggerSymbol) {
      triggerSymbol.textContent = getLocaleCurrencySymbol(locale);
    }
    if (trigger) {
      trigger.setAttribute("aria-label", langText("Cambia paese e valuta", "Change country and currency"));
      trigger.setAttribute("title", getLocaleMenuLabel(curLang));
    }
    if (mobileTrigger) {
      mobileTrigger.textContent = `${langText("Paese", "Country")} · ${getLocaleCompactLabel(locale)}`;
    }
    if (profileTrigger && profileTrigger.tagName !== "SELECT") {
      profileTrigger.textContent = `${langText("Paese", "Country")} · ${getLocaleCompactLabel(locale)}`;
      profileTrigger.setAttribute("title", getLocaleMenuLabel(curLang));
    }
  }

  function renderLocaleMenu() {
    const menu = qs("#tnLocaleMenu");
    if (!menu) {
      return;
    }
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", langText("Selettore paese e valuta", "Country and currency selector"));
    const optionsMarkup = Object.keys(LOCALE_SETTINGS).map(function (code) {
      const locale = LOCALE_SETTINGS[code];
      const active = code === curLang;
      return `<button class="tn-locale-option${active ? " is-active" : ""}" onclick="switchLang('${code}')" type="button" role="menuitemradio" aria-checked="${active ? "true" : "false"}">
        <strong>${escapeHtml(getLocaleCompactLabel(locale))}</strong>
        <span>${escapeHtml(locale.nativeLabel || locale.countryLabel || locale.label)}</span>
      </button>`;
    }).join("");
    menu.innerHTML = `
      <div class="tn-locale-menu-head">
        <p>${escapeHtml(langText("Paese", "Country"))}</p>
        <small>${escapeHtml(langText("Valuta automatica.", "Auto currency."))}</small>
      </div>
      <div class="tn-locale-menu-options">${optionsMarkup}</div>
    `;
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
      const triggerRect = trigger.getBoundingClientRect();
      const menuWidth = Math.min(Math.max(triggerRect.width, 276), window.innerWidth - 32);
      const left = Math.min(
        Math.max(16, triggerRect.left),
        Math.max(16, window.innerWidth - menuWidth - 16)
      );
      menu.style.width = menuWidth + "px";
      menu.style.left = left + "px";
      menu.style.top = triggerRect.bottom + 10 + "px";
      menu.style.right = "auto";
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

  function normalizeRecentSearchRecord(entry) {
    const rawQuery = entry && typeof entry === "object"
      ? (entry.query || entry.label || "")
      : entry;
    const query = String(rawQuery || "").trim();
    if (!query) {
      return null;
    }
    return {
      id: (entry && entry.id) || createId("recent"),
      query: query,
      label: (entry && entry.label) || query,
      createdAt: Number((entry && entry.createdAt) || Date.now())
    };
  }

  function getRecentSearchRecords() {
    return (Array.isArray(state.recentSearches) ? state.recentSearches : [])
      .map(normalizeRecentSearchRecord)
      .filter(Boolean)
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
  }

  function persistRecentSearchRecords() {
    state.recentSearches = getRecentSearchRecords().slice(0, 8);
    saveJson(STORAGE_KEYS.recentSearches, state.recentSearches);
  }

  function registerRecentSearch(query) {
    const normalizedQuery = normalizeSearchText(query);
    if (normalizedQuery.length < 2) {
      return;
    }
    const nextEntry = normalizeRecentSearchRecord({ query: String(query).trim(), createdAt: Date.now() });
    if (!nextEntry) {
      return;
    }
    const deduped = getRecentSearchRecords().filter(function (entry) {
      return normalizeSearchText(entry.query) !== normalizedQuery;
    });
    state.recentSearches = [nextEntry].concat(deduped).slice(0, 8);
    saveJson(STORAGE_KEYS.recentSearches, state.recentSearches);
  }

  function clearAutocompleteRecentSearches() {
    state.recentSearches = [];
    saveJson(STORAGE_KEYS.recentSearches, state.recentSearches);
    const input = document.getElementById("searchInput");
    renderAutocompleteSuggestions(input ? input.value : "", { forceOpen: true });
  }

  function getAutocompleteSavedSearches() {
    if (!state.currentUser || !Array.isArray(state.currentUser.savedSearches)) {
      return [];
    }
    return state.currentUser.savedSearches
      .map(normalizeSavedSearchRecord)
      .filter(function (entry) { return entry.query; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; })
      .slice(0, 5);
  }

  function getAutocompleteBrandCounts(products) {
    const counts = {};
    (products || []).forEach(function (product) {
      const brand = String(product && product.brand || "").trim();
      if (!brand) {
        return;
      }
      counts[brand] = (counts[brand] || 0) + 1;
    });
    return Object.keys(counts)
      .map(function (brand) {
        return { brand: brand, count: counts[brand] };
      })
      .sort(function (a, b) {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.brand.localeCompare(b.brand);
      });
  }

  function getAutocompleteCategoryCounts(products) {
    const counts = {};
    (products || []).forEach(function (product) {
      const category = normalizeCategoryValue(product && product.cat);
      if (!category) {
        return;
      }
      counts[category] = (counts[category] || 0) + 1;
    });
    return Object.keys(counts)
      .map(function (category) {
        return { category: category, label: getFacetLabel("cats", category), count: counts[category] };
      })
      .sort(function (a, b) {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label);
      });
  }

  function getAutocompleteDiscoveryTerms() {
    const popularBrands = getAutocompleteBrandCounts(getVisibleCatalogProducts()).slice(0, 4).map(function (entry) {
      return entry.brand;
    });
    const popularCategories = getAutocompleteCategoryCounts(getVisibleCatalogProducts()).slice(0, 3).map(function (entry) {
      return entry.label;
    });
    const suggestions = [];
    function addSuggestion(value) {
      const trimmed = String(value || "").trim();
      if (!trimmed) {
        return;
      }
      const normalized = normalizeSearchText(trimmed);
      if (suggestions.some(function (entry) { return normalizeSearchText(entry) === normalized; })) {
        return;
      }
      suggestions.push(trimmed);
    }
    popularBrands.forEach(addSuggestion);
    popularCategories.forEach(addSuggestion);
    popularBrands.slice(0, 2).forEach(function (brand, index) {
      const category = popularCategories[index];
      if (brand && category) {
        addSuggestion(brand + " " + category.toLowerCase());
      }
    });
    return suggestions.slice(0, 6);
  }

  function getBrandCategorySuggestions(brand, limit) {
    const normalizedBrand = normalizeSearchText(brand);
    if (!normalizedBrand) {
      return [];
    }
    return getAutocompleteCategoryCounts(
      getVisibleCatalogProducts().filter(function (product) {
        return normalizeSearchText(product.brand) === normalizedBrand;
      })
    ).slice(0, limit || 2).map(function (entry) {
      return brand + " " + entry.label.toLowerCase();
    });
  }

  function getQuerySuggestionPhrases(query, products, brands, categories) {
    const rawQuery = String(query || "").trim();
    const phrases = [];
    function addPhrase(value) {
      const trimmed = String(value || "").trim();
      if (!trimmed) {
        return;
      }
      const normalized = normalizeSearchText(trimmed);
      if (phrases.some(function (entry) { return normalizeSearchText(entry) === normalized; })) {
        return;
      }
      phrases.push(trimmed);
    }

    brands.slice(0, 3).forEach(function (brand) {
      addPhrase(brand);
      getBrandCategorySuggestions(brand, 2).forEach(addPhrase);
    });

    if (!brands.length) {
      addPhrase(rawQuery);
    }

    if (!brands.length) {
      const fallbackBrands = (products.length ? getAutocompleteBrandCounts(products) : getAutocompleteBrandCounts(getVisibleCatalogProducts())).slice(0, 4);
      fallbackBrands.forEach(function (entry) {
        addPhrase(rawQuery + " " + entry.brand);
      });
    }

    categories.slice(0, 2).forEach(function (category) {
      addPhrase(getFacetLabel("cats", category));
    });

    products.slice(0, 3).forEach(function (product) {
      const shortName = String(product.name || "").split(/[—-]/)[0].trim();
      if (shortName && normalizeSearchText(shortName).length >= 4 && normalizeSearchText(shortName) !== normalizeSearchText(rawQuery)) {
        addPhrase(shortName);
      }
    });

    return phrases.slice(0, 6);
  }

  function buildAutocompleteAction(type, value, title, meta, modifiers) {
    const encodedValue = encodeURIComponent(String(value || ""));
    const classes = ["ac-entry"].concat((modifiers && modifiers.classes) || []).join(" ");
    const badge = modifiers && modifiers.badge ? `<span class="ac-entry-badge">${escapeHtml(modifiers.badge)}</span>` : "";
    const side = modifiers && modifiers.side ? `<span class="ac-entry-side">${escapeHtml(modifiers.side)}</span>` : "";
    const iconMarkup = modifiers && modifiers.iconMarkup ? `<span class="ac-entry-icon" aria-hidden="true">${modifiers.iconMarkup}</span>` : "";
    const lead = modifiers && modifiers.lead ? `<span class="ac-entry-lead">${escapeHtml(modifiers.lead)}</span>` : "";
    const metaMarkup = meta ? `<span class="ac-entry-meta">${escapeHtml(meta)}</span>` : "";
    return `<button class="${classes}" type="button" onclick="applyAutocompleteSelection('${type}', decodeURIComponent('${encodedValue}'))">
      <span class="ac-entry-row">
        <span class="ac-entry-main">${iconMarkup}${lead}${escapeHtml(title)}</span>
        ${badge || side}
      </span>
      ${metaMarkup}
    </button>`;
  }

  function buildAutocompleteSection(title, itemsMarkup, actionMarkup, extraClass) {
    if (!itemsMarkup) {
      return "";
    }
    return `<section class="ac-section${extraClass ? " " + extraClass : ""}">
      <div class="ac-section-head">
        <span>${escapeHtml(title)}</span>
        ${actionMarkup || ""}
      </div>
      <div class="ac-list">${itemsMarkup}</div>
    </section>`;
  }

  function buildSearchCriteriaSnapshot() {
    const searchInput = document.getElementById("searchInput");
    return {
      query: String((searchInput && searchInput.value) || filters.search || "").trim(),
      genders: (filters.genders || []).slice().sort(),
      cats: (filters.cats || []).slice().sort(),
      brands: (filters.brands || []).slice().sort(),
      conds: (filters.conds || []).slice().sort(),
      materials: (filters.materials || []).slice().sort(),
      trust: (filters.trust || []).slice().sort(),
      fits: (filters.fits || []).slice().sort(),
      colors: (filters.colors || []).slice().sort(),
      size: String(filters.size || "").trim(),
      pmin: String(filters.pmin || "").trim(),
      pmax: String(filters.pmax || "").trim()
    };
  }

  function hasSearchCriteria(criteria) {
    const snapshot = criteria || buildSearchCriteriaSnapshot();
    return Boolean(
      snapshot.query ||
      snapshot.genders.length ||
      snapshot.cats.length ||
      snapshot.brands.length ||
      snapshot.conds.length ||
      snapshot.materials.length ||
      snapshot.trust.length ||
      snapshot.fits.length ||
      snapshot.colors.length ||
      snapshot.size ||
      snapshot.pmin ||
      snapshot.pmax
    );
  }

  function getSearchCriteriaKey(criteria) {
    return JSON.stringify(criteria || buildSearchCriteriaSnapshot());
  }

  function summarizeSearchCriteria(criteria) {
    const snapshot = criteria || buildSearchCriteriaSnapshot();
    const segments = [];
    function pushValues(values, formatter) {
      if (!Array.isArray(values) || !values.length) {
        return;
      }
      segments.push(values.slice(0, 2).map(function (value) {
        return formatter ? formatter(value) : value;
      }).join(", "));
    }
    pushValues(snapshot.brands);
    pushValues(snapshot.cats, function (value) { return getFacetLabel("cats", value); });
    pushValues(snapshot.conds, function (value) { return getFacetLabel("conds", value); });
    pushValues(snapshot.materials);
    pushValues(snapshot.genders, function (value) { return getFilterTokenLabel("genders", value); });
    pushValues(snapshot.trust, function (value) { return getFilterTokenLabel("trust", value); });
    if (snapshot.size) {
      segments.push(langText("Taglia", "Size") + " " + resolveSizeFilterLabel(snapshot.size));
    }
    if (snapshot.pmin || snapshot.pmax) {
      if (snapshot.pmin && snapshot.pmax) {
        segments.push(langText("Prezzo", "Price") + " " + formatLocalCurrencyValue(snapshot.pmin) + "–" + formatLocalCurrencyValue(snapshot.pmax));
      } else if (snapshot.pmin) {
        segments.push(langText("Da", "From") + " " + formatLocalCurrencyValue(snapshot.pmin));
      } else {
        segments.push(langText("Fino a", "Up to") + " " + formatLocalCurrencyValue(snapshot.pmax));
      }
    }
    return segments.slice(0, 4).join(" · ") || langText("Filtro marketplace", "Marketplace filter");
  }

  function buildSearchSaveLabel(criteria) {
    const snapshot = criteria || buildSearchCriteriaSnapshot();
    const base = snapshot.query || summarizeSearchCriteria(snapshot);
    return base.length > 46 ? base.slice(0, 43).trim() + "…" : base;
  }

  function findMatchingSavedSearch(criteria) {
    if (!state.currentUser || !Array.isArray(state.currentUser.savedSearches)) {
      return null;
    }
    const snapshot = criteria || buildSearchCriteriaSnapshot();
    const searchKey = getSearchCriteriaKey(snapshot);
    const fallbackSummary = summarizeSearchCriteria(snapshot);
    const normalizedQuery = normalizeSearchText(snapshot.query);
    return state.currentUser.savedSearches.find(function (entry) {
      if (entry.searchKey && entry.searchKey === searchKey) {
        return true;
      }
      return normalizeSearchText(entry.query) === normalizedQuery && String(entry.filtersSummary || "") === fallbackSummary;
    }) || null;
  }

  function updateSearchSaveButton() {
    const button = qs("#tnSearchSaveBtn");
    if (!button) {
      return;
    }
    const criteria = buildSearchCriteriaSnapshot();
    const canSave = hasSearchCriteria(criteria);
    const savedEntry = canSave ? findMatchingSavedSearch(criteria) : null;
    const isLoggedIn = !!state.currentUser;
    const title = !canSave
      ? langText("Inserisci una ricerca o attiva filtri per salvarla.", "Enter a search or apply filters to save it.")
      : savedEntry
        ? langText("Rimuovi questa ricerca salvata.", "Remove this saved search.")
        : isLoggedIn
          ? langText("Salva questa ricerca.", "Save this search.")
          : langText("Accedi per salvare questa ricerca.", "Sign in to save this search.");
    button.disabled = !canSave;
    button.classList.toggle("is-disabled", !canSave);
    button.classList.toggle("is-active", Boolean(savedEntry));
    button.setAttribute("aria-pressed", savedEntry ? "true" : "false");
    button.setAttribute("aria-label", title);
    button.setAttribute("title", title);
  }

  function toggleCurrentSearchSave() {
    const criteria = buildSearchCriteriaSnapshot();
    if (!hasSearchCriteria(criteria)) {
      showToast(langText("Scrivi una ricerca o applica filtri prima di salvarla.", "Write a search or apply filters before saving it."));
      updateSearchSaveButton();
      return;
    }
    requireAuth(function () {
      const savedEntry = findMatchingSavedSearch(criteria);
      if (savedEntry) {
        syncCurrentUserWorkspace({
          savedSearches: (state.currentUser.savedSearches || []).filter(function (entry) {
            return entry.id !== savedEntry.id;
          })
        });
        renderProfilePanel();
        showToast(langText("Ricerca rimossa dai salvati.", "Search removed from saved items."));
      } else {
        const filtersSummary = summarizeSearchCriteria(criteria);
        syncCurrentUserWorkspace({
          savedSearches: (state.currentUser.savedSearches || []).concat([
            normalizeSavedSearchRecord({
              label: buildSearchSaveLabel(criteria),
              query: criteria.query || filtersSummary,
              filtersSummary: filtersSummary,
              searchKey: getSearchCriteriaKey(criteria),
              alertsEnabled: true
            })
          ])
        });
        renderProfilePanel();
        showToast(langText("Ricerca salvata. Potremo collegarla agli alert.", "Search saved. We can wire alerts to it next."));
      }
      updateSearchSaveButton();
      const searchInput = document.getElementById("searchInput");
      renderAutocompleteSuggestions(
        searchInput ? searchInput.value : "",
        { forceOpen: Boolean(searchInput && document.activeElement === searchInput) }
      );
    });
  }

  function resetMarketplaceFiltersForAutocomplete() {
    filters = {
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
    };
  }

  function applyAutocompleteSelection(type, value) {
    clearPendingSearchWork();
    const dropdown = document.getElementById("acDropdown");
    if (dropdown) {
      setAutocompleteOpen(dropdown, false);
    }

    if (type === "product") {
      showDetail(value);
      return;
    }

    if (type === "search") {
      const query = String(value || "").trim();
      resetMarketplaceFiltersForAutocomplete();
      filters.search = query;
      const input = document.getElementById("searchInput");
      if (input) {
        input.value = query;
      }
      if (query) {
        registerRecentSearch(query);
      }
      showBuyView("shop");
      initFilters();
      render();
      return;
    }

    showBuyView("shop");
    if (type === "brand") {
      resetMarketplaceFiltersForAutocomplete();
      filters.brands = [value];
      filters.search = "";
      registerRecentSearch(value);
      const input = document.getElementById("searchInput");
      if (input) {
        input.value = value;
      }
    }
    if (type === "category") {
      resetMarketplaceFiltersForAutocomplete();
      filters.cats = [value];
      const categoryLabel = getFacetLabel("cats", value);
      registerRecentSearch(categoryLabel);
      const input = document.getElementById("searchInput");
      if (input) {
        input.value = categoryLabel;
      }
    }
    if (type === "seller") {
      resetMarketplaceFiltersForAutocomplete();
      filters.search = value;
      const input = document.getElementById("searchInput");
      if (input) {
        input.value = value;
      }
      registerRecentSearch(value);
    }
    initFilters();
    render();
  }

  function renderAutocompleteSuggestions(query, options) {
    const dropdown = document.getElementById("acDropdown");
    if (!dropdown) {
      return;
    }
    const searchInput = document.getElementById("searchInput");
    const interactiveOpen = Boolean(options && options.forceOpen);
    const isInputActive = Boolean(searchInput && document.activeElement === searchInput);
    const canOpenDropdown = interactiveOpen || isInputActive;

    const normalized = normalizeSearchText(query);
    const queryKey = normalized || "__discovery__";
    if (state.autocompleteQueryKey !== queryKey) {
      state.autocompleteActiveIndex = -1;
      state.autocompleteQueryKey = queryKey;
    }
    if (!normalized.length) {
      if (!canOpenDropdown) {
        setAutocompleteOpen(dropdown, false);
        return;
      }
      const savedMarkup = getAutocompleteSavedSearches()
        .map(function (entry) {
          return buildAutocompleteAction(
            "search",
            entry.query,
            entry.label || entry.query,
            entry.query !== entry.label ? entry.query : langText("Ricerca salvata", "Saved search"),
            {
              classes: ["ac-entry--saved"],
              iconMarkup: "<svg viewBox='0 0 20 20' fill='none'><path d='M5.5 3.5h9a1 1 0 0 1 1 1v12l-5.5-3-5.5 3v-12a1 1 0 0 1 1-1Z' stroke='currentColor' stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'></path></svg>"
            }
          );
        })
        .join("");
      const recentMarkup = getRecentSearchRecords()
        .map(function (entry) {
          return buildAutocompleteAction(
            "search",
            entry.query,
            entry.query,
            langText("Ricerca recente", "Recent search"),
            {
              classes: ["ac-entry--recent"],
              lead: "↺ "
            }
          );
        })
        .join("");
      const trendMarkup = getAutocompleteDiscoveryTerms()
        .map(function (entry) {
          return buildAutocompleteAction(
            "search",
            entry,
            entry,
            langText("Trend IRIS", "Trending on IRIS"),
            {
              classes: ["ac-entry--trend"]
            }
          );
        })
        .join("");

      const sections = [
        buildAutocompleteSection(langText("Ricerche salvate", "Saved searches"), savedMarkup),
        buildAutocompleteSection(
          langText("Ricerche recenti", "Recent searches"),
          recentMarkup,
          recentMarkup ? `<button class="ac-head-action" type="button" onclick="clearAutocompleteRecentSearches()">${escapeHtml(langText("Pulisci", "Clear"))}</button>` : ""
        ),
        buildAutocompleteSection(langText("Trend", "Trending"), trendMarkup)
      ].filter(Boolean).join("");

      dropdown.innerHTML = sections ? `<div class="ac-shell ac-shell--discovery">${sections}</div>` : "";
      setAutocompleteOpen(dropdown, Boolean(sections) && canOpenDropdown);
      return;
    }

    const products = getVisibleCatalogProducts().filter(function (product) {
      return getProductSearchIndex(product).includes(normalized);
    }).slice(0, 5);
    const brands = getAvailableBrands().filter(function (brand) {
      return normalizeSearchText(brand).includes(normalized);
    }).slice(0, 5);
    const categories = getAvailableCategories().filter(function (category) {
      return normalizeSearchText(category + " " + getFacetLabel("cats", category)).includes(normalized);
    }).slice(0, 4);

    const suggestionMarkup = getQuerySuggestionPhrases(query, products, brands, categories)
      .map(function (entry) {
        const isExactQuery = normalizeSearchText(entry) === normalized;
        return buildAutocompleteAction(
          "search",
          entry,
          entry,
          isExactQuery ? langText("Cerca esattamente questa query", "Search this exact phrase") : langText("Suggerimento rapido", "Quick suggestion"),
          {
            classes: ["ac-entry--suggestion"]
          }
        );
      })
      .join("");

    const fallbackBrandEntries = getAutocompleteBrandCounts(products).length
      ? getAutocompleteBrandCounts(products).slice(0, 5)
      : getAutocompleteBrandCounts(getVisibleCatalogProducts()).slice(0, 5);
    const brandMarkup = (brands.length ? brands.map(function (brand) {
      const count = getVisibleCatalogProducts().filter(function (product) {
        return normalizeSearchText(product.brand) === normalizeSearchText(brand);
      }).length;
      return buildAutocompleteAction(
        "brand",
        brand,
        brand,
        count ? langText(count + " articoli", count + " items") : langText("Brand", "Brand"),
        {
          classes: ["ac-entry--brand"]
        }
      );
    }) : fallbackBrandEntries.map(function (entry) {
      return buildAutocompleteAction(
        "brand",
        entry.brand,
        entry.brand,
        langText(entry.count + " articoli", entry.count + " items"),
        {
          classes: ["ac-entry--brand"]
        }
      );
    })).join("");

    const productMarkup = products.slice(0, 3).map(function (product) {
      return buildAutocompleteAction(
        "product",
        product.id,
        product.brand + " — " + product.name,
        getFacetLabel("cats", normalizeCategoryValue(product.cat)),
        {
          classes: ["ac-entry--product"],
          side: formatCurrency(product.price)
        }
      );
    }).join("");

    let html = `<div class="ac-shell ac-shell--search"><div class="ac-grid">`;
    html += buildAutocompleteSection(`${langText("Suggerimenti per", "Suggestions for")} « ${String(query || "").trim()} »`, suggestionMarkup, "", "ac-section--suggestions");
    html += buildAutocompleteSection(langText("Brand", "Brand"), brandMarkup, "", "ac-section--brands");
    html += `</div>`;
    if (productMarkup) {
      html += buildAutocompleteSection(langText("Articoli", "Items"), productMarkup, "", "ac-section--products");
    }
    html += `</div>`;

    dropdown.innerHTML = html;
    setAutocompleteOpen(dropdown, Boolean(suggestionMarkup || brandMarkup || productMarkup) && canOpenDropdown);
  }

  function rebindMarketplaceSearch() {
    const original = document.getElementById("searchInput");
    if (!original) {
      return;
    }

    const input = original.cloneNode(true);
    input.removeAttribute("oninput");
    input.value = filters.search || "";
    input.setAttribute("autocomplete", "off");
    input.addEventListener("input", function () {
      scheduleSearchInputUpdate(this.value);
      updateSearchSaveButton();
    });
    input.addEventListener("focus", function () {
      clearPendingSearchWork();
      renderAutocompleteSuggestions(this.value, { forceOpen: true });
      updateSearchSaveButton();
    });
    input.addEventListener("keydown", function (event) {
      const dropdown = document.getElementById("acDropdown");
      const entries = getAutocompleteEntries(dropdown);
      const isDropdownOpen = Boolean(dropdown && dropdown.classList.contains("open") && entries.length);
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && isDropdownOpen) {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = state.autocompleteActiveIndex === -1
          ? (direction > 0 ? 0 : entries.length - 1)
          : (state.autocompleteActiveIndex + direction + entries.length) % entries.length;
        setAutocompleteActiveIndex(nextIndex, dropdown);
        return;
      }
      if (event.key === "Enter") {
        const value = this.value.trim();
        if (!value) {
          return;
        }
        event.preventDefault();
        if (isDropdownOpen && state.autocompleteActiveIndex > -1 && entries[state.autocompleteActiveIndex]) {
          entries[state.autocompleteActiveIndex].click();
          return;
        }
        commitSearchQuery(value);
      }
      if (event.key === "Escape") {
        clearPendingSearchWork();
        setAutocompleteOpen(dropdown, false);
      }
    });
    input.addEventListener("blur", function () {
      setTimeout(function () {
        clearPendingSearchWork();
        setAutocompleteOpen(document.getElementById("acDropdown"), false);
        updateSearchSaveButton();
      }, 180);
    });
    original.replaceWith(input);
    window.applyAutocompleteSelection = applyAutocompleteSelection;
    window.clearAutocompleteRecentSearches = clearAutocompleteRecentSearches;
    window.toggleCurrentSearchSave = toggleCurrentSearchSave;
    updateSearchSaveButton();
  }

  function syncMobileSearchDraft(value) {
    const query = String(value || "");
    const searchInput = qs("#searchInput");
    if (searchInput && searchInput.value !== query) {
      searchInput.value = query;
    }
    filters.search = query.trim();
    updateSearchSaveButton();
  }

  function syncMobileSearch(value) {
    const query = String(value || "").trim();
    const mobileSearchInput = qs("#irisMobileSearchInput");
    if (mobileSearchInput && mobileSearchInput.value !== query) {
      mobileSearchInput.value = query;
    }
    syncMobileSearchDraft(query);
    closeMobileNav();
    showPage("buy");
    showBuyView("shop");
    handleSearch(query);
    renderAutocompleteSuggestions(query);
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

  function normalizeString(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
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
        lastPayoutAt: null,
        stripe_connect: {
          account_id: "",
          payouts_enabled: false,
          charges_enabled: false,
          details_submitted: false,
          country: user && user.country ? user.country : getWorkspaceDefaultCountry(),
          type: "express",
          last_synced_at: null
        },
        stripeConnect: {
          accountId: "",
          payoutsEnabled: false,
          chargesEnabled: false,
          detailsSubmitted: false,
          country: user && user.country ? user.country : getWorkspaceDefaultCountry(),
          type: "express",
          lastSyncedAt: null
        }
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
        searchKey: "",
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
        checkoutSessionId: "",
        authorizationExpiresAt: null,
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

  function normalizeSupportTicketRecord(ticket) {
    const createdAt = Number((ticket && ticket.createdAt) || Date.now());
    return Object.assign(
      {
        id: createId("tkt"),
        orderId: "",
        orderNumber: "",
        productId: "",
        productTitle: "",
        buyerEmail: "",
        sellerEmail: "",
        requesterId: "",
        requesterEmail: "",
        requesterRole: "buyer",
        severity: "support",
        status: "open",
        reason: "other",
        message: "",
        attachments: [],
        contextSnapshot: null,
        createdAt: createdAt,
        updatedAt: createdAt
      },
      ticket || {},
      {
        buyerEmail: normalizeEmail((ticket && ticket.buyerEmail) || ""),
        sellerEmail: normalizeEmail((ticket && ticket.sellerEmail) || ""),
        requesterEmail: normalizeEmail((ticket && ticket.requesterEmail) || ""),
        attachments: Array.isArray(ticket && ticket.attachments) ? ticket.attachments : [],
        createdAt: createdAt,
        updatedAt: Number((ticket && ticket.updatedAt) || createdAt)
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

  function sanitizeWorkspaceRole(role) {
    const normalizedRole = normalizeString(role).toLowerCase();
    return normalizedRole === "admin" ? "admin" : "member";
  }

  function isAdminUser(user) {
    return Boolean(user && sanitizeWorkspaceRole(user.platformRole || user.role) === "admin");
  }

  function isCurrentUserAdmin() {
    return Boolean(state.sessionVerified && isAdminUser(state.currentUser));
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
      buyerId: order.buyerId || "",
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
          phone: "",
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
        role: sanitizeWorkspaceRole(user.platformRole || user.role)
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
    state.supportTickets = Array.isArray(state.supportTickets) ? state.supportTickets.map(normalizeSupportTicketRecord) : [];
    state.measurementRequests = Array.isArray(state.measurementRequests) ? state.measurementRequests : [];
    state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];
    state.reviews = Array.isArray(state.reviews) ? state.reviews : [];

    if (state.currentUser) {
      state.currentUser = normalizeUserWorkspace(Object.assign({}, state.currentUser, {
        email: normalizeEmail(state.currentUser.email),
        role: sanitizeWorkspaceRole(state.currentUser.platformRole || state.currentUser.role)
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
      manual_payment_note: "Il pagamento viene completato nel checkout sicuro Stripe e sincronizzato con il tuo ordine IRIS.",
      publish_success: "Annuncio pubblicato con successo.",
      publish_error: "Completa tutti i campi obbligatori e aggiungi almeno una foto.",
      photos_ready: "Foto pronte. Verranno salvate in versione ottimizzata nel browser.",
      my_listings: "I tuoi annunci",
      my_orders: "I tuoi ordini",
      profile_guest_title: "Accedi o registrati per gestire il tuo account",
      profile_guest_body: "Accedi o registrati per gestire il tuo account.",
      sign_in_to_continue: "Accedi per continuare",
      checkout_success: "Pagamento confermato e ordine creato.",
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
      manual_payment_note: "Payment is completed in secure Stripe Checkout and synced with your IRIS order.",
      publish_success: "Listing published successfully.",
      publish_error: "Complete the required fields and add at least one photo.",
      photos_ready: "Photos are ready and will be stored in an optimized browser format.",
      my_listings: "Your listings",
      my_orders: "Your orders",
      profile_guest_title: "Sign in to unlock your profile",
      profile_guest_body: "Login, registration, publish flow and checkout now work inside the browser prototype.",
      sign_in_to_continue: "Sign in to continue",
      checkout_success: "Payment confirmed and order created.",
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
      kicker: "",
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

    topnav.insertAdjacentHTML("afterend", "<div id=\"home-view\" class=\"irisx-home irisx-home--loading active\"></div>");
  }

  function injectShellUi() {
    const navLinks = qs(".tn-links");
    const profileTrigger = qs(".tn-links .tn-profile");
    if (profileTrigger && profileTrigger.id !== "tnProfileTrigger") {
      profileTrigger.id = "tnProfileTrigger";
      profileTrigger.setAttribute("type", "button");
      profileTrigger.setAttribute("aria-label", langText("Apri menu profilo", "Open profile menu"));
      profileTrigger.setAttribute("aria-haspopup", "menu");
      profileTrigger.setAttribute("aria-controls", "tnProfileMenu");
      profileTrigger.innerHTML = "<span class=\"tn-avatar-dot\"></span>";
      profileTrigger.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggleProfileMenu();
      };
    }

    if (navLinks && !qs("#tnMobileToggle")) {
      const mobileToggle = document.createElement("button");
      mobileToggle.className = "tn-btn tn-mobile-toggle";
      mobileToggle.id = "tnMobileToggle";
      mobileToggle.type = "button";
      mobileToggle.setAttribute("aria-label", langText("Apri menu", "Open menu"));
      mobileToggle.setAttribute("aria-controls", "tnMobileMenu");
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileToggle.innerHTML = "<span></span><span></span><span></span>";
      mobileToggle.addEventListener("click", toggleMobileNav);
      navLinks.insertBefore(mobileToggle, navLinks.firstChild || null);
    }

    if (navLinks && !qs("#cartBtn")) {
      const cartButton = document.createElement("button");
      cartButton.className = "tn-btn";
      cartButton.id = "cartBtn";
      cartButton.innerHTML = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1 1h2l1.5 8h8L15 3.5H4\"/><circle cx=\"6\" cy=\"12.5\" r=\"1\"/><circle cx=\"11\" cy=\"12.5\" r=\"1\"/></svg><span class=\"badge\" id=\"cart-badge\" style=\"display:none\">0</span>";
      cartButton.setAttribute("aria-label", t("cart_open"));
      cartButton.addEventListener("click", openCart);
      navLinks.insertBefore(cartButton, qs(".notif-wrap"));
    }

    if (navLinks && !qs("#tnHeaderAuthBtn")) {
      const authButton = document.createElement("button");
      authButton.className = "tn-btn tn-auth";
      authButton.id = "tnHeaderAuthBtn";
      authButton.type = "button";
      authButton.textContent = t("login");
      authButton.addEventListener("click", handleAuthButtonClick);
      navLinks.insertBefore(authButton, qs("#tnFavBtn") || qs("#cartBtn") || qs("#tnSellBtn") || null);
    }

    if (!qs("#irisxAuthModal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        "<div class=\"irisx-modal\" id=\"irisxAuthModal\" role=\"dialog\" aria-modal=\"true\"></div>" +
          "<div class=\"irisx-drawer\" id=\"irisxCartDrawer\" role=\"dialog\" aria-modal=\"true\"></div>" +
          "<div class=\"irisx-modal\" id=\"irisxCheckoutModal\" role=\"dialog\" aria-modal=\"true\"></div>" +
          "<div class=\"irisx-modal\" id=\"irisxOrderModal\" role=\"dialog\" aria-modal=\"true\"></div>" +
          "<div class=\"irisx-modal\" id=\"irisxChatModerationModal\" role=\"dialog\" aria-modal=\"true\"></div>" +
          "<div class=\"irisx-toast-stack\" id=\"irisxToastStack\"></div>"
      );
    }

    ensureMobileAppNav();
    syncMobileAppShell(getCurrentReturnView());
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
    const brandField = qs("#sf-brand");
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
    const brandValue = preservedValues && preservedValues.brand !== undefined ? preservedValues.brand : (brandField ? brandField.value : "");
    const typeValue = preservedValues && preservedValues.typeKey !== undefined ? preservedValues.typeKey : typeSelect.value;
    const typeOptions = subcategory && Array.isArray(subcategory.types) ? buildOptionList(subcategory.types) : [];
    syncSelectOptions(typeSelect, typeOptions, langText("Seleziona tipo", "Select type"), typeValue);

    const sizeMode = getResolvedSellSizeMode(categoryKey, subcategoryKey, brandValue);
    const sizeContext = getResolvedSizeContext(categoryKey, subcategoryKey, brandValue, sizeMode);
    const sizeValue = preservedValues && preservedValues.size !== undefined ? preservedValues.size : sizeSelect.value;
    syncSelectOptions(sizeSelect, getSellSizeOptions(sizeMode, brandValue, categoryKey, subcategoryKey), langText("Seleziona taglia", "Select size"), sizeValue);

    if (subcategoryLabel) subcategoryLabel.textContent = `${langText("Sottocategoria", "Subcategory")} *`;
    if (typeLabel) typeLabel.textContent = langText("Tipo", "Type");
    if (taxonomyHint) {
      taxonomyHint.textContent = category
        ? getTaxonomyLabel(category.hint)
        : langText("Scegli prima la categoria: da li il form vincola sottocategoria, taglia e campi compatibili.", "Pick a category first: then the form constrains subcategory, size, and compatible fields.");
    }

    if (sizeLabel) {
      sizeLabel.textContent = sizeContext.schema.filterable
        ? `${sizeContext.label} *`
        : langText("Taglia", "Size");
    }

    if (sizeOriginalLabel) {
      sizeOriginalLabel.textContent = sizeContext.originalLabel;
    }
    if (sizeOriginalField) {
      sizeOriginalField.placeholder = sizeContext.placeholder;
    }

    if (sizeHint) {
      sizeHint.textContent = sizeContext.hint;
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
    setSellFieldVisibility("#irisxSizeGroup", Boolean(sizeContext.schema.filterable));
    setSellFieldVisibility("#irisxSizeOriginalGroup", Boolean(sizeContext.schema.allowOriginalLabel));
    renderSellMeasurementFields(categoryKey, subcategoryKey, measurementValues);

    if (fitSelect && !(category && category.fitEnabled)) {
      fitSelect.value = "—";
    }
    if (sizeOriginalField && !sizeContext.schema.allowOriginalLabel) {
      sizeOriginalField.value = "";
    }
    if (!sizeContext.schema.filterable) {
      sizeSelect.value = "one_size";
    }
  }

  function handleSellTaxonomyChange(scope) {
    const nextValues = {
      categoryKey: qs("#sf-cat") ? qs("#sf-cat").value : "",
      subcategoryKey: qs("#sf-subcat") ? qs("#sf-subcat").value : "",
      typeKey: qs("#sf-type") ? qs("#sf-type").value : "",
      brand: qs("#sf-brand") ? qs("#sf-brand").value : "",
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
    if (scope === "brand") {
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

    const brand = readSellField("#sf-brand");
    const sizeMode = getResolvedSellSizeMode(categoryKey, subcategoryKey, brand);
    const sizeContext = getResolvedSizeContext(categoryKey, subcategoryKey, brand, sizeMode);
    const sizeValue = readSellField("#sf-size");
    if (sizeContext.schema.filterable && !sizeValue) {
      return {
        ok: false,
        error: sizeMode === "shoes_eu"
          ? langText("Inserisci una taglia EU valida.", "Choose a valid EU size.")
          : langText("Inserisci una taglia valida.", "Choose a valid size.")
      };
    }
    const normalizedSizeValue = sizeContext.schema.filterable
      ? normalizeStoredSizeValue(sizeValue, sizeMode)
      : "one_size";
    const sizeOriginal = sizeContext.schemaId === "apparel_numeric_designer"
      ? (readSellField("#sf-size-original") || normalizedSizeValue)
      : readSellField("#sf-size-original");
    const sizePresentation = getListingSizePresentation({
      brand: brand,
      categoryKey: categoryKey,
      subcategoryKey: subcategoryKey,
      sizeSchema: sizeMode,
      sz: normalizedSizeValue,
      sizeOriginal: sizeOriginal
    });

    return {
      ok: true,
      categoryKey: categoryKey,
      categoryLabel: getSelectedOptionLabel("#sf-cat") || getTaxonomyLabel(category),
      subcategoryKey: subcategoryKey,
      subcategoryLabel: getSelectedOptionLabel("#sf-subcat") || getTaxonomyLabel(subcategory),
      typeKey: type ? type.id : "",
      typeLabel: type ? (getSelectedOptionLabel("#sf-type") || getTaxonomyLabel(type)) : "",
      sizeMode: sizeMode,
      sizeValue: normalizedSizeValue,
      sizeDisplay: sizePresentation.displayLabel,
      sizeOriginal: sizeOriginal,
      sizeStandard: sizePresentation.standardEquivalent,
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

  function getHomeRenderSignature(copy, featured, proofText) {
    return JSON.stringify({
      lang: curLang,
      proofText: proofText,
      title: copy && copy.title || "",
      featuredTitle: copy && copy.featuredTitle || "",
      featuredNote: copy && copy.featuredNote || "",
      sectionKicker: copy && copy.sectionKicker || "",
      featured: (featured || []).map(function (product) {
        return {
          id: product && product.id,
          brand: product && product.brand,
          name: product && product.name,
          price: product && product.price,
          image: product && Array.isArray(product.images) ? (product.images[0] || "") : "",
          favorite: favorites.has(product && product.id)
        };
      })
    });
  }

  function renderHomeView(options) {
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
    const renderSignature = getHomeRenderSignature(copy, featured, proofText);
    const forceRender = Boolean(options && options.force);
    if (!forceRender && state.homeRenderSignature === renderSignature && !container.classList.contains("irisx-home--loading")) {
      return;
    }

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

    const heroVideoMarkup = "";

    state.homeRenderSignature = renderSignature;
    container.classList.remove("irisx-home--loading");
    container.innerHTML = `
      <div class="irisx-home-shell">
        <section class="irisx-home-hero irisx-reveal-section">
          ${heroVideoMarkup}
          <div class="irisx-hero-lux"><div class="irisx-hero-shine"></div></div>
          <div class="irisx-home-copy">
            ${copy.kicker ? `<div class="irisx-home-kicker">${escapeHtml(copy.kicker)}</div><div class="irisx-home-rule"></div>` : ""}
            <h1 class="irisx-home-title">${escapeHtml(copy.title).replace(/\n/g, "<br>")}</h1>
            <div class="irisx-home-actions">
              <button class="irisx-home-action primary" onclick="showBuyView('shop')">${escapeHtml(copy.primaryCta)}</button>
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

    // Fade in hero video only when a real source exists.
    var hv = document.getElementById("heroVid");
    if (hv && hv.querySelector("source[src]")) {
      hv.load();
      hv.playbackRate = 0.78;
      hv.addEventListener("canplay", function() { hv.classList.add("on"); }, { once: true });
    }
    enhanceInteractiveSurfaces(container);
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

  function buildMobileAppNavMarkup() {
    return `
      <nav class="irisx-mobile-app-nav" id="irisMobileAppNav" aria-label="${escapeHtml(langText("Navigazione principale", "Main navigation"))}">
        <button class="irisx-mobile-app-tab" id="irisMobileTabHome" data-nav-view="home" type="button" onclick="showMobileTabView('home')">
          <span class="irisx-mobile-app-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.2 10 3l7 5.2"/><path d="M5.2 7.7V17h9.6V7.7"/></svg>
          </span>
          <span class="irisx-mobile-app-label" id="irisMobileTabHomeLabel">${escapeHtml(langText("Home", "Home"))}</span>
        </button>
        <button class="irisx-mobile-app-tab" id="irisMobileTabShop" data-nav-view="shop" type="button" onclick="showMobileTabView('shop')">
          <span class="irisx-mobile-app-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h12l-1.1 10H5.1L4 5Z"/><path d="M7.2 7.2a2.8 2.8 0 0 1 5.6 0"/></svg>
          </span>
          <span class="irisx-mobile-app-label" id="irisMobileTabShopLabel">${escapeHtml(langText("Shop", "Shop"))}</span>
        </button>
        <button class="irisx-mobile-app-tab" id="irisMobileTabFav" data-nav-view="fav" type="button" onclick="showMobileTabView('fav')">
          <span class="irisx-mobile-app-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 16.2 3.9 10.6A3.9 3.9 0 0 1 9.7 5.3l.3.3.3-.3a3.9 3.9 0 0 1 5.8 5.3L10 16.2Z"/></svg>
          </span>
          <span class="irisx-mobile-app-label" id="irisMobileTabFavLabel">${escapeHtml(langText("Preferiti", "Favorites"))}</span>
        </button>
        <button class="irisx-mobile-app-tab" id="irisMobileTabChat" data-nav-view="chat" type="button" onclick="showMobileTabView('chat')">
          <span class="irisx-mobile-app-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12v8H8.2L4 15V4Z"/></svg>
          </span>
          <span class="irisx-mobile-app-label" id="irisMobileTabChatLabel">${escapeHtml(langText("Messaggi", "Messages"))}</span>
        </button>
        <button class="irisx-mobile-app-tab" id="irisMobileTabProfile" data-nav-view="profile" type="button" onclick="showMobileTabView('profile')">
          <span class="irisx-mobile-app-icon irisx-mobile-app-icon--profile" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="6.4" r="2.7"/><path d="M4.6 16c0-3 2.4-5.2 5.4-5.2s5.4 2.2 5.4 5.2"/></svg>
          </span>
          <span class="irisx-mobile-app-label" id="irisMobileTabProfileLabel">${escapeHtml(langText("Profilo", "Profile"))}</span>
        </button>
      </nav>`;
  }

  function ensureMobileAppNav() {
    if (qs("#irisMobileAppNav")) {
      return;
    }
    document.body.insertAdjacentHTML("beforeend", buildMobileAppNavMarkup());
  }

  function showMobileTabView(view) {
    closeMobileNav();
    closeProfileMenu();
    closeLocaleMenu();
    if (!["home", "shop", "fav", "chat", "profile"].includes(view)) {
      return;
    }
    showPage("buy");
    showBuyView(view);
  }

  function syncMobileAppShell(view) {
    const nav = qs("#irisMobileAppNav");
    if (!nav) {
      return;
    }
    const activeView = view || getCurrentReturnView();
    const isMobile = window.innerWidth <= 900;
    const pageIsSell = !!qs("#page-sell.active");
    const visibleViews = ["home", "shop", "fav", "chat", "profile"];
    const shouldShow = isMobile && !pageIsSell && visibleViews.includes(activeView);
    nav.classList.toggle("is-visible", shouldShow);
    nav.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  }

  function setActiveNav(view) {
    qsa("[data-nav-view]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-nav-view") === view);
    });
    syncProfileMenuState(undefined, view);
    syncMobileAppShell(view);
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
        setAutocompleteOpen(autocomplete, false);
      }
    }
    if (mobileTrigger) {
      mobileTrigger.setAttribute("aria-expanded", qs("#tnMobileMenu") && qs("#tnMobileMenu").classList.contains("open") ? "true" : "false");
    }
    syncMobileAppShell(activeView);
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

  function setSupportMenuLabel(label) {
    const node = qs("#tnMenuSupportBtn");
    if (!node) {
      return;
    }
    node.innerHTML =
      '<span class="irisx-support-link-label">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M4 12a8 8 0 0 1 16 0"/>' +
      '<path d="M5.5 11.5h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.2A1.8 1.8 0 0 1 3.5 15.7v-2.4a1.8 1.8 0 0 1 2-1.8Z"/>' +
      '<path d="M18.5 11.5h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1.2a1.8 1.8 0 0 0 1.8-1.8v-2.4a1.8 1.8 0 0 0-2-1.8Z"/>' +
      '<path d="M8.5 17.5v.5a2 2 0 0 0 2 2H12"/>' +
      '<path d="M12 20h1.6a1.4 1.4 0 1 0 0-2.8H12"/>' +
      '</svg>' +
      '<span>' + escapeHtml(label) + '</span>' +
      '</span>';
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

    setNodeText("#tnHomeBtn", langText("Home", "Home"));
    setNodeText("#tnShopBtn", langText("Shop", "Shop"));
    setNodeText("#tnAboutBtn", langText("Chi siamo", "About us"));

    setNodeText("#tnMenuAccountBtn", langText("Il mio account", "My account"));
    setNodeText("#tnMenuOrdersBtn", langText("I miei ordini", "My orders"));
    setNodeText("#tnMenuSalesBtn", langText("Le mie vendite", "My sales"));
    setNodeText("#tnMenuBillingBtn", langText("Indirizzi e pagamenti", "Addresses and payments"));
    setNodeText("#tnMenuSavedSearchBtn", langText("Ricerche salvate e alert", "Saved searches and alerts"));
    setNodeText("#tnMenuSettingsBtn", langText("Impostazioni", "Settings"));
    setSupportMenuLabel(langText("Assistenza", "Assistance"));
    setNodeText("#opsBtn", langText("Dashboard admin", "Admin dashboard"));

    setNodeText("#tnMobileHomeBtn", langText("Home", "Home"));
    setNodeText("#tnMobileShopBtn", langText("Shop", "Shop"));
    setNodeText("#tnMobileAboutBtn", langText("Chi siamo", "About us"));
    setNodeText("#tnMobileProfileBtn", langText("Profilo", "Profile"));
    setNodeText("#tnMobileFavBtn", langText("Preferiti", "Favorites"));
    setNodeText("#tnMobileChatBtn", langText("Messaggi", "Messages"));
    setNodeText("#tnMobileCartBtn", langText("Carrello", "Cart"));
    setNodeText("#tnMobileSellBtn", langText("Vendi", "Sell"));
    setNodeText("#irisMobileTabHomeLabel", langText("Home", "Home"));
    setNodeText("#irisMobileTabShopLabel", langText("Shop", "Shop"));
    setNodeText("#irisMobileTabFavLabel", langText("Preferiti", "Favorites"));
    setNodeText("#irisMobileTabChatLabel", langText("Messaggi", "Messages"));
    setNodeText("#irisMobileTabProfileLabel", langText("Profilo", "Profile"));
    syncLocaleTrigger();
  }

  function syncProfileMenuState(forceOpen, activeViewOverride) {
    const menu = qs("#tnProfileMenu");
    const trigger = qs("#tnProfileTrigger");
    const currentView = activeViewOverride || getCurrentReturnView();
    const accountSection = resolveAccountSectionId(state.profileSection || "overview");
    const isProfileContext = currentView === "profile";
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
      ["#tnMenuAccountBtn", currentView === "profile" && state.profileArea === "account" && accountSection === "overview"],
      ["#tnMenuOrdersBtn", currentView === "profile" && state.profileArea === "buyer"],
      ["#tnMenuSalesBtn", currentView === "profile" && state.profileArea === "seller"],
      ["#tnMenuBillingBtn", currentView === "profile" && state.profileArea === "account" && ["settings_account", "settings_payment"].includes(accountSection)],
      ["#tnMenuSavedSearchBtn", currentView === "profile" && state.profileArea === "account" && accountSection === "shopping_saved_searches"],
      ["#tnMenuSettingsBtn", currentView === "profile" && state.profileArea === "account" && ["settings_profile", "settings_privacy", "settings_notifications", "settings_security"].includes(accountSection)],
      ["#tnMenuSupportBtn", currentView === "profile" && state.profileArea === "account" && accountSection === "help_contact"],
      ["#opsBtn", currentView === "ops"]
    ].forEach(function (entry) {
      const button = qs(entry[0]);
      if (!button) {
        return;
      }
      const isActive = Boolean(entry[1]);
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
    document.body.classList.add("irisx-white-theme");

    const intro = qs("#intro");
    const choice = qs("#choice");
    const cinematicIntro = qs("#iris-cinematic-intro");

    if (intro) {
      intro.classList.remove("out");
      intro.style.display = "none";
    }

    if (cinematicIntro) {
      cinematicIntro.classList.remove("irisci-ready");
      cinematicIntro.classList.remove("irisci-fading");
      cinematicIntro.style.display = "none";
    }

    if (choice) {
      choice.style.display = "none";
      choice.classList.remove("show");
    }

    document.body.style.overflow = "";

    skipIntro = function () {
      if (typeof introDone !== "undefined") introDone = true;
      const iEl = document.getElementById("itext");
      const introDiv = document.getElementById("intro");
      if (iEl) iEl.classList.add("out");
      if (introDiv) {
        introDiv.classList.add("out");
        introDiv.style.display = "none";
      }
      document.body.style.overflow = "";
      showPage("buy");
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
        syncMobileAppShell("sell");
        window.scrollTo(0, 0);
        return;
      }

      sellPage.classList.remove("active");
      buyPage.classList.add("active");
      topnav.classList.add("show");
      sellTopbar.classList.remove("show");
      syncMobileAppShell("home");
      showBuyView("home");
    };

    showPage("buy");
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
    return requiredFields.reduce(function (isValid, fieldId) {
      return validateSellField(fieldId) && isValid;
    }, true);
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
      modal.setAttribute("aria-hidden", modal.classList.contains("open") ? "false" : "true");
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

    enhanceInteractiveSurfaces(document);
  }

  function hydrateLocalListings() {
    for (let index = prods.length - 1; index >= 0; index -= 1) {
      if (prods[index] && prods[index].isUserListing) {
        prods.splice(index, 1);
      }
    }
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
    if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      syncNotificationsToSupabase().catch(function (error) {
        console.warn("[IRIS] Unable to sync notifications to Supabase", error);
      });
    }
  }

  function persistBanRegistry() {
    state.banRegistry = normalizeBanRegistry(state.banRegistry);
    saveJson(STORAGE_KEYS.banRegistry, state.banRegistry);
  }

  function persistEmailOutbox() {
    saveJson(STORAGE_KEYS.emailOutbox, state.emailOutbox);
  }

  function persistSupportTickets() {
    state.supportTickets = state.supportTickets.map(normalizeSupportTicketRecord);
    saveJson(STORAGE_KEYS.supportTickets, state.supportTickets);
  }

  function persistMeasurementRequests() {
    saveJson(STORAGE_KEYS.measurementRequests, state.measurementRequests);
    if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      syncMeasurementRequestsToSupabase().catch(function (error) {
        console.warn("[IRIS] Unable to sync measurement requests to Supabase", error);
      });
    }
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
    if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      syncReviewsToSupabase().catch(function (error) {
        console.warn("[IRIS] Unable to sync reviews to Supabase", error);
      });
    }
  }

  function isProductPurchasable(product) {
    return Boolean(product && (product.inventoryStatus || "active") === "active");
  }

  function isDisplayableCatalogListing(product) {
    if (!product || !isProductPurchasable(product)) {
      return false;
    }
    const name = normalizeSearchText(product.name || "");
    const brand = normalizeSearchText(product.brand || "");
    const sellerName = normalizeSearchText((product.seller && product.seller.name) || "");
    if (name.length < 2 || brand.length < 2 || Number(product.price || 0) <= 0) {
      return false;
    }
    if (["test", "demo", "prova"].includes(name) || ["test", "demo", "prova"].includes(brand) || sellerName === "test") {
      return false;
    }
    return true;
  }

  function getCatalogDedupeKey(product) {
    return [
      normalizeSearchText(product.brand || ""),
      normalizeSearchText(product.name || ""),
      normalizeSearchText(product.sz || ""),
      String(Math.round(Number(product.price || 0)))
    ].join("|");
  }

  function getCatalogPriority(product) {
    let score = 0;
    if (product && product.isUserListing !== true) score += 20;
    if (Array.isArray(product && product.images) && product.images.length) score += 4;
    if (product && product.verified) score += 3;
    if (product && product.irisGuaranteed) score += 2;
    if (String(product && product.desc || "").length > 40) score += 1;
    score += Math.min(5, Math.floor(Number(product && product.date || 0) / 1000000000000));
    return score;
  }

  function getVisibleCatalogProducts() {
    const visible = [];
    const indexByKey = new Map();
    prods.forEach(function (product) {
      if (!isDisplayableCatalogListing(product)) {
        return;
      }
      const key = getCatalogDedupeKey(product);
      const existingIndex = indexByKey.get(key);
      if (existingIndex === undefined) {
        indexByKey.set(key, visible.length);
        visible.push(product);
        return;
      }
      if (getCatalogPriority(product) > getCatalogPriority(visible[existingIndex])) {
        visible[existingIndex] = product;
      }
    });
    return visible;
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
    const normalizedRecipientEmail = normalizeEmail(payload.recipientEmail);
    const matchingUser = state.users.find(function (user) {
      return normalizeEmail(user.email) === normalizedRecipientEmail;
    }) || null;
    const notification = {
      id: createId("ntf"),
      kind: payload.kind || "system",
      title: payload.title || "IRIS",
      body: payload.body || "",
      recipientId: (payload.recipientId || (matchingUser && matchingUser.id)) || null,
      recipientEmail: normalizedRecipientEmail,
      audience: payload.audience || "user",
      unread: true,
      link: payload.link || "",
      conversationId: payload.conversationId || "",
      orderId: payload.orderId || "",
      productId: payload.productId || "",
      scope: payload.scope || "",
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

  function getUserByEmail(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return null;
    }
    return state.users.find(function (user) {
      return normalizeEmail(user.email) === normalized;
    }) || null;
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
          "Hai venduto " + payload.itemsSummary + ". Prepara la spedizione per l'ordine " + payload.orderNumber + "." + (payload.buyerPhone ? " " + langText("Telefono buyer", "Buyer phone") + ": " + payload.buyerPhone + "." : ""),
          "You sold " + payload.itemsSummary + ". Prepare shipment for order " + payload.orderNumber + "." + (payload.buyerPhone ? " " + langText("Buyer phone", "Buyer phone") + ": " + payload.buyerPhone + "." : "")
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

  function getCurrentUserOrderScope(order) {
    if (!order || !state.currentUser) {
      return null;
    }
    if (isCurrentUserAdmin()) {
      return "admin";
    }
    const currentEmail = normalizeEmail(state.currentUser.email || "");
    if (!currentEmail) {
      return null;
    }
    if (normalizeEmail(order.buyerEmail || "") === currentEmail) {
      return "buyer";
    }
    const sellerEmails = Array.isArray(order.sellerEmails) ? order.sellerEmails.map(normalizeEmail) : [];
    if (sellerEmails.includes(currentEmail)) {
      return "seller";
    }
    const ownsLineItem = Array.isArray(order.items) && order.items.some(function (item) {
      return normalizeEmail(item && item.sellerEmail) === currentEmail;
    });
    return ownsLineItem ? "seller" : null;
  }

  function isOrderAccessibleToCurrentUser(order, requestedScope) {
    const actualScope = getCurrentUserOrderScope(order);
    if (!actualScope) {
      return false;
    }
    if (!requestedScope || requestedScope === "any") {
      return true;
    }
    if (actualScope === "admin") {
      return true;
    }
    return actualScope === requestedScope;
  }

  function getAccessibleOrderById(orderId, requestedScope) {
    const order = getOrderById(orderId);
    return isOrderAccessibleToCurrentUser(order, requestedScope) ? order : null;
  }

  function canCurrentUserManageListing(listing) {
    if (!listing) {
      return false;
    }
    return isCurrentUserAdmin() || isCurrentUserListingOwner(listing);
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
    syncDialogFocus("irisxOpsModal", true, ["#opsCarrier", "#opsReviewTitle", "#opsReplyBody", ".irisx-primary", ".irisx-close"]);
  }

  function closeOpsModal() {
    state.opsModalMode = null;
    state.opsModalPayload = null;
    const modal = qs("#irisxOpsModal");
    if (modal) {
      modal.classList.remove("open");
    }
    syncDialogFocus("irisxOpsModal", false);
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

    if (state.opsModalMode === "chat-report") {
      const conversation = getChatConversationById(state.opsModalPayload && state.opsModalPayload.conversationId);
      const reportOptions = getChatReportOptions();
      const product = conversation && (conversation.product || getListingById(conversation.listingId || conversation.productId));
      const scope = conversation ? getChatConversationScope(conversation) : "buying";
      const counterparty = conversation ? (scope === "selling" ? conversation.buyer : conversation.seller) : null;
      modal.innerHTML =
        "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card irisx-modal-card--support\"><div class=\"irisx-card-head\"><div><div class=\"irisx-title\">" +
        langText("Segnala conversazione", "Report conversation") +
        "</div><div class=\"irisx-subtitle\">" +
        langText("Invia il contesto al team assistenza IRIS. Nessuna immagine, nessun canale esterno.", "Send the context to IRIS support. No images, no external channels.") +
        "</div></div><button class=\"irisx-close\" onclick=\"closeOpsModal()\">✕</button></div><div class=\"irisx-card-body\">" +
        (conversation ? `<div class="irisx-support-context-card">
          <div class="irisx-support-context-kicker">${langText("Contesto collegato automaticamente", "Context linked automatically")}</div>
          <div class="irisx-support-context-grid">
            <div><strong>${langText("Contatto", "Counterparty")}</strong><span>${escapeHtml(counterparty && counterparty.name ? counterparty.name : langText("Membro", "Member"))}</span></div>
            <div><strong>${langText("Ruolo", "Role")}</strong><span>${escapeHtml(langText(scope === "selling" ? "Lato venditore" : "Lato acquirente", scope === "selling" ? "Seller side" : "Buyer side"))}</span></div>
            <div><strong>${langText("Articolo", "Listing")}</strong><span>${escapeHtml(product ? `${product.brand} ${product.name}` : langText("Non collegato", "Not linked"))}</span></div>
            <div><strong>${langText("Conversazione", "Conversation")}</strong><span>${escapeHtml(conversation.id)}</span></div>
          </div>
        </div>` : "") +
        "<div class=\"irisx-form-grid irisx-form-grid--support\"><div class=\"irisx-field\"><label for=\"opsChatReason\">" +
        langText("Motivo", "Reason") +
        "</label><select id=\"opsChatReason\">" +
        reportOptions.map(function (option) {
          return `<option value="${escapeHtml(option.id)}">${escapeHtml(langText(option.it, option.en))}</option>`;
        }).join("") +
        "</select></div><div class=\"irisx-field irisx-field--full\"><label for=\"opsChatMessage\">" +
        langText("Dettagli", "Details") +
        "</label><textarea id=\"opsChatMessage\" placeholder=\"" +
        escapeHtml(langText("Spiega cosa e successo in chat: comportamento sospetto, richiesta di pagamento esterno, pressione fuori piattaforma o altro.", "Explain what happened in chat: suspicious behaviour, off-platform payment request, outside-platform pressure, or anything else.")) +
        "\"></textarea></div></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" onclick=\"submitOpsModal()\">" +
        langText("Invia ad assistenza", "Send to support") +
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

    if (state.opsModalMode === "chat-report") {
      submitChatSupportTicket(state.opsModalPayload.conversationId);
      return;
    }

    if (state.opsModalMode === "review") {
      submitOrderReview(state.opsModalPayload.orderId);
    }
  }

  function getAdminChatThreads() {
    if (typeof chats === "undefined" || !Array.isArray(chats)) {
      return [];
    }
    return chats
      .map(normalizeChatThread)
      .sort(function (left, right) { return Number(right.updatedAt || 0) - Number(left.updatedAt || 0); });
  }

  function getAdminSectionHint(sectionId) {
    const hints = {
      overview: langText("Snapshot generale e code urgenti.", "Global snapshot and urgent queues."),
      users: langText("Verifica account, blocchi e stato utente.", "Account verification, blocks, and user status."),
      listings: langText("Bozze, annunci live, archivi e seller.", "Drafts, live listings, archives, and sellers."),
      orders: langText("Lifecycle ordine, shipping e stato buyer.", "Order lifecycle, shipping, and buyer state."),
      payments: langText("Stripe, payout, refund e mismatch.", "Stripe, payouts, refunds, and mismatches."),
      support: langText("Ticket, dispute, outbox e assistenza.", "Tickets, disputes, outbox, and support."),
      chats: langText("Conversazioni e contesto prodotto.", "Conversations and product context."),
      authentication: langText("Ordini e richieste in revisione.", "Orders and requests under review."),
      moderation: langText("Blocchi, segnalazioni e rischio.", "Blocks, reports, and risk."),
      audit: langText("Storico azioni e tracciabilità.", "Action history and traceability."),
      content: langText("Policy, pagine trust e mail.", "Policies, trust pages, and mail."),
      settings: langText("Fee, owner inbox e setup operativo.", "Fees, owner inbox, and operational setup.")
    };
    return hints[sectionId] || "";
  }

  function adminQuickBanUser(email) {
    if (!isCurrentUserAdmin()) {
      showToast(langText("Azione riservata agli admin.", "Admin-only action."));
      return;
    }
    const normalizedEmail = normalizeEmail(email);
    const user = state.users.find(function (candidate) {
      return normalizeEmail(candidate.email) === normalizedEmail;
    }) || null;
    if (!user) {
      showToast(langText("Utente non trovato.", "User not found."));
      return;
    }
    banIdentityIdentifiers(user.email, user.phone, langText("Bloccato da dashboard admin", "Blocked from admin dashboard"));
    state.users = state.users.map(function (candidate) {
      if (normalizeEmail(candidate.email) !== normalizedEmail) {
        return candidate;
      }
      return Object.assign({}, candidate, { accountStatus: "blocked" });
    });
    saveJson(STORAGE_KEYS.users, state.users);
    recordAuditEvent("admin_user_blocked", user.email, {
      userId: user.id || "",
      phone: user.phone || ""
    });
    renderOpsView();
    showToast(langText("Account bloccato.", "Account blocked."));
  }

  function adminRestoreUserAccount(email) {
    if (!isCurrentUserAdmin()) {
      showToast(langText("Azione riservata agli admin.", "Admin-only action."));
      return;
    }
    const normalizedEmail = normalizeEmail(email);
    const user = state.users.find(function (candidate) {
      return normalizeEmail(candidate.email) === normalizedEmail;
    }) || null;
    if (!user) {
      showToast(langText("Utente non trovato.", "User not found."));
      return;
    }
    state.banRegistry = normalizeBanRegistry({
      entries: state.banRegistry.entries.map(function (entry) {
        if (
          (entry.type === "email" && normalizeEmail(entry.value) === normalizedEmail) ||
          (entry.type === "phone" && normalizePhoneNumber(entry.value) === normalizePhoneNumber(user.phone || ""))
        ) {
          return Object.assign({}, entry, { active: false });
        }
        return entry;
      })
    });
    persistBanRegistry();
    state.users = state.users.map(function (candidate) {
      if (normalizeEmail(candidate.email) !== normalizedEmail) {
        return candidate;
      }
      return Object.assign({}, candidate, { accountStatus: "active" });
    });
    saveJson(STORAGE_KEYS.users, state.users);
    recordAuditEvent("admin_user_restored", user.email, {
      userId: user.id || ""
    });
    renderOpsView();
    showToast(langText("Account riattivato.", "Account restored."));
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

    const users = getRecentAdminUsers();
    const listings = state.listings.slice().sort(function (left, right) {
      return Number(right.date || right.createdAt || 0) - Number(left.date || left.createdAt || 0);
    });
    const orders = state.orders.slice().sort(function (left, right) {
      return Number(right.createdAt || 0) - Number(left.createdAt || 0);
    });
    const supportTickets = state.supportTickets.slice().sort(function (left, right) {
      return Number(right.updatedAt || right.createdAt || 0) - Number(left.updatedAt || left.createdAt || 0);
    });
    const auditLog = state.auditLog.slice().sort(function (left, right) {
      return Number(right.at || 0) - Number(left.at || 0);
    });
    const measurementRequests = state.measurementRequests.slice().sort(function (left, right) {
      return Number(right.updatedAt || right.createdAt || 0) - Number(left.updatedAt || left.createdAt || 0);
    });
    const emailOutbox = state.emailOutbox.slice().sort(function (left, right) {
      return Number(right.createdAt || 0) - Number(left.createdAt || 0);
    });
    const chatThreads = getAdminChatThreads();
    const activeBanEntries = state.banRegistry.entries.filter(function (entry) { return entry.active !== false; });
    const openTickets = supportTickets.filter(function (ticket) { return ticket.status !== "resolved"; });
    const disputeTickets = openTickets.filter(function (ticket) { return ticket.severity === "dispute"; });
    const readyPayouts = orders.filter(function (order) { return order.payment && order.payment.payoutStatus === "ready"; });
    const pendingShipments = orders.filter(function (order) {
      return ["paid", "awaiting_shipment", "in_authentication"].includes(order.status);
    });
    const authOrders = orders.filter(function (order) { return order.status === "in_authentication"; });
    const draftListings = listings.filter(function (listing) { return (listing.listingStatus || "draft") === "draft"; });
    const archivedListings = listings.filter(function (listing) { return listing.inventoryStatus === "archived"; });
    const reportedChats = supportTickets.filter(function (ticket) { return String(ticket.reason || "").indexOf("chat_") === 0; });
    const unreadAdminNotifications = state.notifications.filter(function (notification) {
      return notification.audience === "admin" && notification.unread;
    });
    const sections = [
      { id: "overview", label: langText("Panoramica", "Overview"), count: openTickets.length + readyPayouts.length },
      { id: "users", label: langText("Utenti", "Users"), count: users.length },
      { id: "listings", label: langText("Annunci", "Listings"), count: listings.length },
      { id: "orders", label: langText("Ordini", "Orders"), count: orders.length },
      { id: "payments", label: langText("Pagamenti", "Payments"), count: readyPayouts.length },
      { id: "support", label: langText("Assistenza", "Support"), count: openTickets.length },
      { id: "chats", label: langText("Chat & offerte", "Chats & offers"), count: chatThreads.length },
      { id: "authentication", label: langText("Autenticazione", "Authentication"), count: authOrders.length + measurementRequests.length },
      { id: "moderation", label: langText("Moderazione", "Moderation"), count: activeBanEntries.length + reportedChats.length },
      { id: "audit", label: langText("Audit log", "Audit log"), count: auditLog.length },
      { id: "content", label: langText("Contenuti", "Content"), count: emailOutbox.length },
      { id: "settings", label: langText("Impostazioni", "Settings"), count: 0 }
    ];

    if (!sections.some(function (section) { return section.id === state.adminSection; })) {
      state.adminSection = "overview";
    }

    const summaryCards = [
      { value: orders.length, label: langText("Ordini totali", "Total orders") },
      { value: openTickets.length, label: langText("Ticket aperti", "Open tickets") },
      { value: readyPayouts.length, label: langText("Payout da chiudere", "Ready payouts") },
      { value: activeBanEntries.length, label: langText("Blocchi attivi", "Active blocks") },
      { value: chatThreads.length, label: langText("Conversazioni", "Conversations") },
      { value: unreadAdminNotifications.length, label: langText("Alert admin", "Admin alerts") }
    ];

    const sidebarHtml = sections.map(function (section) {
      return `<button class="irisx-sidebar-link${state.adminSection === section.id ? " on" : ""}" onclick="setAdminSection('${section.id}')">
        <span class="irisx-sidebar-link__main">
          <strong>${escapeHtml(section.label)}</strong>
          <small>${escapeHtml(getAdminSectionHint(section.id))}</small>
        </span>
        <em>${section.count ? escapeHtml(String(section.count)) : "•"}</em>
      </button>`;
    }).join("");

    let content = "";
    if (state.adminSection === "users") {
      content = users.length ? `<div class="irisx-card-stack">${users.map(function (user) {
        const normalizedEmail = normalizeEmail(user.email);
        const listingCount = listings.filter(function (listing) { return normalizeEmail(listing.ownerEmail) === normalizedEmail; }).length;
        const buyerOrderCount = orders.filter(function (order) { return normalizeEmail(order.buyerEmail) === normalizedEmail; }).length;
        const sellerOrderCount = orders.filter(function (order) {
          return order.items.some(function (item) { return normalizeEmail(item.sellerEmail) === normalizedEmail; });
        }).length;
        const isBlocked = (user.accountStatus || "active") === "blocked" || isEmailBanned(user.email);
        const verificationBits = [
          user.verification && user.verification.emailVerified ? langText("email ok", "email ok") : langText("email pending", "email pending"),
          user.verification && user.verification.phoneVerified ? langText("telefono ok", "phone ok") : langText("telefono pending", "phone pending")
        ];
        return `<div class="irisx-inline-card irisx-inline-card--admin">
          <div>
            <strong>${escapeHtml(user.name || user.email)}</strong>
            <span>${escapeHtml(user.email)} · ${escapeHtml(user.role || "member")} · ${escapeHtml(verificationBits.join(" · "))}</span>
            <em>${buyerOrderCount} ${langText("ordini buyer", "buyer orders")} · ${sellerOrderCount} ${langText("ordini seller", "seller orders")} · ${listingCount} ${langText("annunci", "listings")}</em>
          </div>
          <div class="irisx-actions">
            <span class="irisx-badge">${escapeHtml(user.accountStatus || (isBlocked ? "blocked" : "active"))}</span>
            ${isBlocked ? `<button class="irisx-secondary" onclick="adminRestoreUserAccount('${escapeHtml(user.email)}')">${langText("Riattiva", "Restore")}</button>` : `<button class="irisx-secondary" onclick="adminQuickBanUser('${escapeHtml(user.email)}')">${langText("Blocca", "Block")}</button>`}
          </div>
        </div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun utente disponibile.", "No users available.")}</div>`;
    } else if (state.adminSection === "listings") {
      content = listings.length ? `<div class="irisx-card-stack">${listings.map(function (listing) {
        const listingStatus = listing.listingStatus || "draft";
        const inventoryStatus = listing.inventoryStatus || "active";
        return `<div class="irisx-inline-card irisx-inline-card--admin">
          <div>
            <strong>${escapeHtml(listing.brand)} ${escapeHtml(listing.name)}</strong>
            <span>${escapeHtml(listing.ownerEmail || "")} · ${escapeHtml(formatCurrency(listing.price || 0))}</span>
            <em>${escapeHtml(listingStatus)} · ${escapeHtml(inventoryStatus)} · ${escapeHtml(listing.cat || "")}</em>
          </div>
          <div class="irisx-actions">
            <span class="irisx-badge">${escapeHtml(listingStatus)}</span>
            ${listingStatus === "draft" ? `<button class="irisx-secondary" onclick="publishDraftListing('${listing.id}')">${langText("Pubblica", "Publish")}</button>` : ""}
            ${inventoryStatus !== "archived" ? `<button class="irisx-secondary" onclick="archiveListing('${listing.id}')">${langText("Archivia", "Archive")}</button>` : ""}
          </div>
        </div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun annuncio disponibile.", "No listings available.")}</div>`;
    } else if (state.adminSection === "orders") {
      content = orders.length ? `<div class="irisx-order-list">${orders.map(function (order) {
        return `<div class="irisx-order-card">
          <div class="irisx-order-head"><strong>${escapeHtml(order.number)}</strong><span class="irisx-badge">${escapeHtml(getOrderStatusLabel(order))}</span></div>
          <div class="irisx-order-items">
            <div>${escapeHtml(order.buyerEmail)}</div>
            <div>${escapeHtml(order.items.map(function (item) { return `${item.brand} ${item.name}`; }).join(", "))}</div>
            <div>${escapeHtml(formatCurrency(order.total || 0))}</div>
          </div>
          <div class="irisx-actions">${getOrderLifecycleActions(order, "admin").join("")}</div>
        </div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun ordine ancora.", "No orders yet.")}</div>`;
    } else if (state.adminSection === "payments") {
      content = orders.length ? `<div class="irisx-card-stack">${orders.map(function (order) {
        const payment = order.payment || {};
        return `<div class="irisx-inline-card irisx-inline-card--admin">
          <div>
            <strong>${escapeHtml(order.number)}</strong>
            <span>${langText("Totale", "Total")}: ${escapeHtml(formatCurrency(order.total || 0))} · ${langText("Netto seller", "Seller net")}: ${escapeHtml(formatCurrency(payment.sellerNet || 0))}</span>
            <em>${escapeHtml(payment.status || "captured")} · ${escapeHtml(payment.payoutStatus || "pending")} · ${escapeHtml(payment.refundStatus || "none")}</em>
          </div>
          <div class="irisx-actions">
            <span class="irisx-badge">${escapeHtml(payment.payoutStatus || "pending")}</span>
            ${payment.payoutStatus === "ready" ? `<button class="irisx-secondary" onclick="markOrderPayoutPaid('${order.id}')">${langText("Segna pagato", "Mark paid")}</button>` : ""}
          </div>
        </div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun pagamento disponibile.", "No payments available.")}</div>`;
    } else if (state.adminSection === "support") {
      content = `
        <div class="irisx-admin-two-col">
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Inbox ticket", "Support inbox")}</h3><span>${langText("Dispute, assistenza e richieste operative.", "Disputes, support, and operational requests.")}</span></div></div>
            ${renderSupportTicketsMarkup(supportTickets)}
          </div>
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Email outbox", "Email outbox")}</h3><span>${langText("Trigger e template già messi in coda.", "Queued triggers and templates.")}</span></div></div>
            ${emailOutbox.length ? `<div class="irisx-card-stack">${emailOutbox.slice(0, 10).map(function (mail) {
              return `<div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${escapeHtml(mail.subject)}</strong><span>${escapeHtml(mail.to)}</span><em>${escapeHtml(mail.type)} · ${escapeHtml(formatRelativeTime(mail.createdAt))}</em></div></div>`;
            }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna email in coda.", "No queued emails.")}</div>`}
          </div>
        </div>`;
    } else if (state.adminSection === "chats") {
      content = chatThreads.length ? `<div class="irisx-card-stack">${chatThreads.map(function (thread) {
        const lastMessage = thread.msgs[thread.msgs.length - 1] || { text: "", at: 0 };
        return `<div class="irisx-inline-card irisx-inline-card--admin">
          <div>
            <strong>${escapeHtml((thread.product && `${thread.product.brand} ${thread.product.name}`) || langText("Conversazione", "Conversation"))}</strong>
            <span>${escapeHtml(thread.buyerName || langText("Buyer", "Buyer"))} → ${escapeHtml(thread.sellerName || langText("Seller", "Seller"))}</span>
            <em>${escapeHtml(lastMessage.text || langText("Nessun messaggio ancora.", "No messages yet."))} · ${escapeHtml(formatRelativeTime(lastMessage.at || thread.updatedAt))}</em>
          </div>
          <div class="irisx-actions">
            ${thread.unreadCount ? `<span class="irisx-badge">${thread.unreadCount} ${langText("non letti", "unread")}</span>` : ""}
            ${thread.offerId ? `<span class="irisx-badge">${langText("Offerta", "Offer")}</span>` : ""}
          </div>
        </div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna conversazione disponibile.", "No conversations available.")}</div>`;
    } else if (state.adminSection === "authentication") {
      content = `
        <div class="irisx-admin-two-col">
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Ordini in autenticazione", "Orders in authentication")}</h3><span>${langText("Ordini già presi in carico dal team autenticazione.", "Orders already handled by the authentication team.")}</span></div></div>
            ${authOrders.length ? `<div class="irisx-card-stack">${authOrders.map(function (order) {
              return `<div class="irisx-inline-card irisx-inline-card--admin">
                <div>
                  <strong>${escapeHtml(order.number)}</strong>
                  <span>${escapeHtml(order.items.map(function (item) { return `${item.brand} ${item.name}`; }).join(", "))}</span>
                  <em>${escapeHtml(order.buyerEmail)} · ${escapeHtml(getOrderStatusLabel(order))}</em>
                </div>
                <div class="irisx-actions">${getOrderLifecycleActions(order, "admin").join("")}</div>
              </div>`;
            }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun ordine in autenticazione.", "No orders in authentication.")}</div>`}
          </div>
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Richieste misure / verifica", "Measurement / verification requests")}</h3><span>${langText("Richieste aperte dai buyer per chiarire fit e dettagli.", "Requests opened by buyers for fit and detail checks.")}</span></div></div>
            ${measurementRequests.length ? `<div class="irisx-card-stack">${measurementRequests.map(function (request) {
              const listing = getListingById(request.listingId);
              return `<div class="irisx-inline-card irisx-inline-card--admin">
                <div>
                  <strong>${escapeHtml(listing ? `${listing.brand} ${listing.name}` : request.listingId)}</strong>
                  <span>${escapeHtml(request.requesterEmail || "")} → ${escapeHtml(request.sellerEmail || "")}</span>
                  <em>${escapeHtml(request.status || "open")} · ${escapeHtml(formatRelativeTime(request.updatedAt || request.createdAt))}</em>
                </div>
              </div>`;
            }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna richiesta attiva.", "No active requests.")}</div>`}
          </div>
        </div>`;
    } else if (state.adminSection === "moderation") {
      content = `
        <div class="irisx-admin-two-col">
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Blocchi e identità sospette", "Blocks and risky identities")}</h3><span>${langText("Email e telefoni bannati o sospesi dal team.", "Emails and phones blocked or suspended by the team.")}</span></div></div>
            ${activeBanEntries.length ? `<div class="irisx-card-stack">${activeBanEntries.map(function (entry) {
              return `<div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${escapeHtml(entry.value)}</strong><span>${escapeHtml(entry.type)}</span><em>${escapeHtml(entry.reason || langText("Nessun motivo specificato", "No reason given"))}</em></div></div>`;
            }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun blocco attivo.", "No active blocks.")}</div>`}
          </div>
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Segnalazioni critiche", "Critical reports")}</h3><span>${langText("Chat segnalate, dispute e ordini fragili da seguire.", "Reported chats, disputes, and fragile orders to monitor.")}</span></div></div>
            ${(reportedChats.length || disputeTickets.length || archivedListings.length) ? `<div class="irisx-card-stack">
              ${reportedChats.slice(0, 6).map(function (ticket) {
                return `<div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${escapeHtml(ticket.reason || "chat_report")}</strong><span>${escapeHtml(ticket.orderNumber || ticket.id)}</span><em>${escapeHtml(ticket.message)}</em></div></div>`;
              }).join("")}
              ${disputeTickets.slice(0, 6).map(function (ticket) {
                return `<div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${escapeHtml(ticket.orderNumber || ticket.id)}</strong><span>${langText("Disputa", "Dispute")} · ${escapeHtml(ticket.reason || "support")}</span><em>${escapeHtml(ticket.message)}</em></div><div class="irisx-actions">${ticket.status !== "resolved" ? `<button class="irisx-secondary" onclick="resolveSupportTicket('${ticket.id}')">${langText("Risolvi", "Resolve")}</button>` : ""}</div></div>`;
              }).join("")}
            </div>` : `<div class="irisx-empty-state">${langText("Nessun caso critico aperto.", "No critical cases open.")}</div>`}
          </div>
        </div>`;
    } else if (state.adminSection === "audit") {
      content = auditLog.length ? `<div class="irisx-card-stack">${auditLog.slice(0, 40).map(function (entry) {
        return `<div class="irisx-inline-card irisx-inline-card--admin">
          <div>
            <strong>${escapeHtml(entry.summary || entry.type)}</strong>
            <span>${escapeHtml(entry.type)}</span>
            <em>${escapeHtml(formatRelativeTime(entry.at))}</em>
          </div>
          ${entry.meta ? `<div class="irisx-admin-meta">${escapeHtml(JSON.stringify(entry.meta))}</div>` : ""}
        </div>`;
      }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessun log disponibile.", "No audit log available.")}</div>`;
    } else if (state.adminSection === "content") {
      content = `
        <div class="irisx-admin-two-col">
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Policy e pagine trust", "Policies and trust pages")}</h3><span>${langText("Apertura rapida dei contenuti statici principali.", "Quick access to core static content.")}</span></div></div>
            <div class="irisx-policy-grid">${Object.keys(POLICY_PAGE_CONTENT).map(function (key) {
              const page = POLICY_PAGE_CONTENT[key];
              return `<button class="irisx-policy-card" onclick="openStatic('${key}')"><strong>${escapeHtml(page.title)}</strong><span>${escapeHtml(page.subtitle)}</span></button>`;
            }).join("")}</div>
          </div>
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Code email", "Email queue")}</h3><span>${langText("Cronologia recente delle email generate dall'app.", "Recent history of emails generated by the app.")}</span></div></div>
            ${emailOutbox.length ? `<div class="irisx-card-stack">${emailOutbox.slice(0, 12).map(function (mail) {
              return `<div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${escapeHtml(mail.subject)}</strong><span>${escapeHtml(mail.to)}</span><em>${escapeHtml(mail.type)} · ${escapeHtml(formatRelativeTime(mail.createdAt))}</em></div></div>`;
            }).join("")}</div>` : `<div class="irisx-empty-state">${langText("Nessuna email registrata.", "No emails recorded.")}</div>`}
          </div>
        </div>`;
    } else if (state.adminSection === "settings") {
      content = `<div class="irisx-summary-grid">
        <div class="irisx-summary-card"><strong>${Math.round(PLATFORM_CONFIG.selfServeFeeRate * 100)}%</strong><span>${langText("Commissione self-serve", "Self-serve fee")}</span></div>
        <div class="irisx-summary-card"><strong>${Math.round(PLATFORM_CONFIG.conciergeFeeRate * 100)}%</strong><span>${langText("Commissione concierge", "Concierge fee")}</span></div>
        <div class="irisx-summary-card"><strong>${escapeHtml(formatCurrency(PLATFORM_CONFIG.shippingCost))}</strong><span>${langText("Costo spedizione", "Shipping cost")}</span></div>
        <div class="irisx-summary-card"><strong>${escapeHtml(PLATFORM_CONFIG.ownerEmail)}</strong><span>${langText("Inbox owner", "Owner inbox")}</span></div>
      </div>
      <div class="irisx-workspace-card">
        <div class="irisx-section-head"><div><h3>${langText("Setup operativo", "Operational setup")}</h3><span>${langText("Qui concentrerei fee, payout rules, support routing, alert admin e connettori esterni.", "This is where I would centralize fees, payout rules, support routing, admin alerts, and external connectors.")}</span></div></div>
        <div class="irisx-card-stack">
          <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Stripe", "Stripe")}</strong><span>${langText("Pagamenti, refund, payout, webhook.", "Payments, refunds, payouts, webhooks.")}</span></div><span class="irisx-badge">${langText("Connesso", "Connected")}</span></div>
          <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Supabase", "Supabase")}</strong><span>${langText("Auth, ordini, notifiche, ticket e log.", "Auth, orders, notifications, tickets, and logs.")}</span></div><span class="irisx-badge">${langText("Core", "Core")}</span></div>
          <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Resend / email", "Resend / email")}</strong><span>${langText("Outbox e trigger transazionali.", "Outbox and transactional triggers.")}</span></div><span class="irisx-badge">${langText("Ops", "Ops")}</span></div>
        </div>
      </div>`;
    } else {
      content = `
        <div class="irisx-summary-grid irisx-summary-grid--workspace">
          ${summaryCards.map(function (card) {
            return `<div class="irisx-summary-card"><strong>${escapeHtml(String(card.value))}</strong><span>${escapeHtml(card.label)}</span></div>`;
          }).join("")}
        </div>
        <div class="irisx-admin-command-grid">
          <button class="irisx-workspace-card irisx-admin-command-card" onclick="setAdminSection('support')">
            <strong>${langText("Coda urgente", "Urgent queue")}</strong>
            <span>${openTickets.length} ${langText("ticket aperti", "open tickets")} · ${disputeTickets.length} ${langText("dispute", "disputes")}</span>
          </button>
          <button class="irisx-workspace-card irisx-admin-command-card" onclick="setAdminSection('payments')">
            <strong>${langText("Pagamenti da chiudere", "Payments to close")}</strong>
            <span>${readyPayouts.length} ${langText("payout pronti", "ready payouts")} · ${pendingShipments.length} ${langText("ordini in mano al team", "orders in flow")}</span>
          </button>
          <button class="irisx-workspace-card irisx-admin-command-card" onclick="setAdminSection('authentication')">
            <strong>${langText("Coda autenticazione", "Authentication queue")}</strong>
            <span>${authOrders.length} ${langText("ordini in autenticazione", "orders in authentication")} · ${measurementRequests.length} ${langText("richieste buyer", "buyer requests")}</span>
          </button>
        </div>
        <div class="irisx-admin-two-col">
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Alert da guardare subito", "Immediate alerts")}</h3><span>${langText("Le cose che ti bloccano davvero il marketplace.", "The items that can really block the marketplace.")}</span></div></div>
            <div class="irisx-card-stack">
              <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Spedizioni in attesa", "Pending shipments")}</strong><span>${pendingShipments.length} ${langText("ordini da seguire", "orders to monitor")}</span><em>${langText("Pagati ma non ancora chiusi operativamente.", "Paid orders not yet closed operationally.")}</em></div><button class="irisx-secondary" onclick="setAdminSection('orders')">${langText("Apri", "Open")}</button></div>
              <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Ticket aperti", "Open tickets")}</strong><span>${openTickets.length} ${langText("casi vivi", "live cases")}</span><em>${langText("Supporto, dispute e segnalazioni buyer/seller.", "Support, disputes, and buyer/seller reports.")}</em></div><button class="irisx-secondary" onclick="setAdminSection('support')">${langText("Apri", "Open")}</button></div>
              <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Blocchi e moderazione", "Blocks and moderation")}</strong><span>${activeBanEntries.length} ${langText("blocchi attivi", "active blocks")}</span><em>${langText("Identità sospette, chat segnalate, casi rischio.", "Suspicious identities, reported chats, risky cases.")}</em></div><button class="irisx-secondary" onclick="setAdminSection('moderation')">${langText("Apri", "Open")}</button></div>
            </div>
          </div>
          <div class="irisx-workspace-card">
            <div class="irisx-section-head"><div><h3>${langText("Snapshot business", "Business snapshot")}</h3><span>${langText("Domande base a cui devi rispondere in 10 secondi.", "Questions you need answered in 10 seconds.")}</span></div></div>
            <div class="irisx-card-stack">
              <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Utenti", "Users")}</strong><span>${users.length} ${langText("account registrati", "registered accounts")}</span><em>${draftListings.length} ${langText("bozze listing", "draft listings")} · ${archivedListings.length} ${langText("archiviati", "archived")}</em></div></div>
              <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Chat e offerte", "Chats and offers")}</strong><span>${chatThreads.length} ${langText("conversazioni totali", "total conversations")}</span><em>${reportedChats.length} ${langText("chat segnalate", "reported chats")} · ${state.offers.length} ${langText("offerte registrate", "stored offers")}</em></div></div>
              <div class="irisx-inline-card irisx-inline-card--admin"><div><strong>${langText("Audit", "Audit")}</strong><span>${auditLog.length} ${langText("eventi loggati", "logged events")}</span><em>${langText("Ogni azione admin importante dovrebbe finire qui.", "Every important admin action should land here.")}</em></div><button class="irisx-secondary" onclick="setAdminSection('audit')">${langText("Apri log", "Open log")}</button></div>
            </div>
          </div>
        </div>`;
    }

    container.innerHTML = `<div class="irisx-workspace irisx-workspace--admin">
      <aside class="irisx-workspace-sidebar irisx-admin-sidebar">
        <div class="irisx-user-card">
          <div class="irisx-user-avatar">OPS</div>
          <div class="irisx-user-meta">
            <strong>${langText("Dashboard admin", "Admin dashboard")}</strong>
            <span>${escapeHtml(PLATFORM_CONFIG.ownerEmail)}</span>
            <em>${langText("Controllo completo di utenti, ordini, pagamenti e rischi.", "Full control over users, orders, payments, and risk.")}</em>
          </div>
        </div>
        <div class="irisx-summary-grid irisx-summary-grid--sidebar">
          <div class="irisx-summary-card"><strong>${orders.length}</strong><span>${langText("Ordini", "Orders")}</span></div>
          <div class="irisx-summary-card"><strong>${openTickets.length}</strong><span>${langText("Ticket", "Tickets")}</span></div>
          <div class="irisx-summary-card"><strong>${readyPayouts.length}</strong><span>${langText("Payout", "Payouts")}</span></div>
          <div class="irisx-summary-card"><strong>${activeBanEntries.length}</strong><span>${langText("Blocchi", "Blocks")}</span></div>
        </div>
        <div class="irisx-sidebar-menu">
          <div class="irisx-sidebar-group">
            <div class="irisx-sidebar-group-title">${langText("Sezioni operative", "Operational sections")}</div>
            <div class="irisx-sidebar-group-list">${sidebarHtml}</div>
          </div>
        </div>
      </aside>
      <div class="irisx-workspace-main">
        <div class="irisx-workspace-head irisx-admin-head">
          <div>
            <div class="irisx-kicker">${langText("Control room", "Control room")}</div>
            <div class="irisx-title">${langText("IRIS Admin", "IRIS Admin")}</div>
            <div class="irisx-subtitle">${langText("Qui dentro gestisci marketplace, supporto, pagamenti, autenticazione, moderazione e audit senza passare dal profilo normale.", "Manage marketplace, support, payments, authentication, moderation, and audit here without going through the normal profile.")}</div>
          </div>
        </div>
        <div class="irisx-section-tabs irisx-section-tabs--admin">${sections.map(function (section) {
          return `<button class="irisx-section-tab${state.adminSection === section.id ? " on" : ""}" onclick="setAdminSection('${section.id}')">${escapeHtml(section.label)}</button>`;
        }).join("")}</div>
        <div class="irisx-workspace-content">${content}</div>
      </div>
    </div>`;
  }

  function createOrderFromCheckout(items, shipping, context) {
    const createdAt = Date.now();
    const buyerEmail = normalizeEmail((context && context.buyerEmail) || (state.currentUser && state.currentUser.email) || "");
    const buyerName = (context && context.buyerName) || shipping.name;
    const buyerPhone = normalizePhoneNumber((context && context.buyerPhone) || shipping.phone || (state.currentUser && state.currentUser.phone) || "");
    const normalizedItems = items.map(function (entry) {
      const product = entry.product;
      const seller = product.seller || {};
      const sellerUser = getUserByEmail((seller && seller.email) || product.ownerEmail || "");
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
        sellerPhone: normalizePhoneNumber((sellerUser && sellerUser.phone) || ""),
        lineStatus: "paid"
      };
    });
    const subtotal = getCartSubtotal(items);
    const platformFee = getPlatformFee(subtotal);
    const order = {
      id: createId("ord"),
      number: "IRIS-" + String(createdAt).slice(-8),
      buyerId: (context && context.buyerId) || (state.currentUser && state.currentUser.id) || "",
      buyerEmail: buyerEmail,
      buyerName: buyerName,
      items: normalizedItems,
      sellerEmails: Array.from(new Set(normalizedItems.map(function (item) { return normalizeEmail(item.sellerEmail); }).filter(Boolean))),
      shipping: {
        name: shipping.name,
        address: shipping.address,
        city: shipping.city,
        country: shipping.country,
        phone: buyerPhone,
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
    const buyerPhone = normalizePhoneNumber((order.shipping && order.shipping.phone) || ((getUserByEmail(order.buyerEmail) || {}).phone) || "");
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
        itemsSummary: item.brand + " " + item.name,
        buyerPhone: buyerPhone
      }).id);
      order.notificationIds.push(createNotification({
        audience: "user",
        kind: "sale",
        title: langText("Articolo venduto", "Item sold"),
        body: item.brand + " " + item.name + (buyerPhone ? " · " + buyerPhone : ""),
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
    if (updatedOrder && isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      saveOrderToSupabase(updatedOrder).then(function (remoteOrder) {
        state.orders = state.orders.map(function (order) {
          return order.id === orderId ? remoteOrder : order;
        });
        persistOrders();
        syncInventoryFromOrders();
        renderProfilePanel();
        renderOpsView();
      }).catch(function (error) {
        console.warn("[IRIS] Unable to sync order update to Supabase", error);
      });
    }
    renderProfilePanel();
    renderOpsView();
    return updatedOrder;
  }

  function openShipmentModal(orderId) {
    if (!getAccessibleOrderById(orderId, "seller") && !isCurrentUserAdmin()) {
      showToast(langText("Non puoi gestire la spedizione di questo ordine.", "You cannot manage shipping for this order."));
      return;
    }
    openOpsModal("ship", { orderId: orderId });
  }

  function closeOrderDetail() {
    state.activeOrderId = null;
    state.activeOrderModalTab = "detail";
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
    if (!state.currentUser) {
      requireAuth(function () {
        openOrderDetail(orderId, scope);
      });
      return;
    }
    const resolvedScope = scope || "buyer";
    const order = getAccessibleOrderById(orderId, resolvedScope);
    if (!order) {
      showToast(langText("Non puoi aprire questo ordine.", "You cannot open this order."));
      return;
    }
    state.activeOrderId = orderId;
    state.activeOrderScope = resolvedScope;
    state.activeOrderModalTab = "detail";
    renderOrderDetailModal();
    const modal = qs("#irisxOrderModal");
    if (modal) {
      modal.classList.add("open");
    }
  }

  function setOrderModalTab(tab) {
    if (!state.activeOrderId) {
      return;
    }
    state.activeOrderModalTab = tab === "tracking" ? "tracking" : "detail";
    renderOrderDetailModal();
    const modal = qs("#irisxOrderModal");
    if (modal) {
      modal.classList.add("open");
    }
  }

  function setOrderStatus(orderId, nextStatus, eventType, eventLabel, options) {
    const payload = options || {};
    const currentOrder = getOrderById(orderId);
    const currentScope = getCurrentUserOrderScope(currentOrder);
    const allowedScopes = Array.isArray(payload.allowedScopes) && payload.allowedScopes.length ? payload.allowedScopes : null;
    if (!currentOrder || !currentScope) {
      showToast(langText("Ordine non disponibile.", "Order unavailable."));
      return null;
    }
    if (allowedScopes && currentScope !== "admin" && allowedScopes.indexOf(currentScope) === -1) {
      showToast(langText("Non puoi modificare questo ordine.", "You cannot update this order."));
      return null;
    }
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
      { payoutStatus: "pending_shipment", labelStatus: "pending", allowedScopes: ["seller"] }
    );

    if (updated) {
      showToast(langText("Ordine messo in coda spedizione.", "Order moved to shipping queue."));
    }
  }

  async function submitShipmentForOrder(orderId) {
    const order = getAccessibleOrderById(orderId, "seller");
    if (!order && !isCurrentUserAdmin()) {
      showToast(langText("Non puoi aggiornare la spedizione di questo ordine.", "You cannot update shipping for this order."));
      return;
    }
    const carrierField = qs("#opsCarrier");
    const trackingField = qs("#opsTracking");
    const carrier = carrierField ? carrierField.value.trim() : "";
    const trackingNumber = trackingField ? trackingField.value.trim() : "";

    if (!carrier || !trackingNumber) {
      showToast(langText("Inserisci corriere e tracking.", "Please add carrier and tracking."));
      return;
    }

    if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      try {
        const response = await invokeSupabaseFunction("mark-order-shipped", {
          orderId: orderId,
          carrier: carrier,
          trackingNumber: trackingNumber
        });
        if (response && response.order) {
          applyRemoteOrderUpdate(orderId, response.order);
        }
        closeOpsModal();
        showToast(langText("Spedizione aggiornata.", "Shipment updated."));
        return;
      } catch (error) {
        console.warn("[IRIS] Unable to sync shipment with backend", error);
        showToast(error && error.message ? error.message : langText("Impossibile aggiornare la spedizione.", "Unable to update the shipment."));
        return;
      }
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
        payoutStatus: "pending_delivery",
        allowedScopes: ["seller"]
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
      { payoutStatus: "pending_delivery", allowedScopes: ["admin"] }
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
    const order = getAccessibleOrderById(orderId, "admin");
    if (!order) {
      showToast(langText("Non puoi gestire questo ordine.", "You cannot manage this order."));
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
        trackingNumber: order.shipping.trackingNumber || ("IRIS-BUYER-" + String(Date.now()).slice(-6)),
        allowedScopes: ["admin"]
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

  async function confirmOrderDelivered(orderId) {
    const order = getAccessibleOrderById(orderId, "buyer");
    if (!order && !isCurrentUserAdmin()) {
      showToast(langText("Non puoi confermare questo ordine.", "You cannot confirm this order."));
      return;
    }
    if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      try {
        const response = await invokeSupabaseFunction("confirm-order-delivery", {
          orderId: orderId,
          autoReleasePayout: true
        });
        if (response && response.order) {
          applyRemoteOrderUpdate(orderId, response.order);
        }
        showToast(
          response && response.payoutReleased
            ? langText("Consegna confermata e payout avviato.", "Delivery confirmed and payout started.")
            : langText("Consegna confermata.", "Delivery confirmed.")
        );
        return;
      } catch (error) {
        console.warn("[IRIS] Unable to confirm delivery with backend", error);
        showToast(error && error.message ? error.message : langText("Impossibile confermare la consegna.", "Unable to confirm delivery."));
        return;
      }
    }

    const updated = setOrderStatus(
      orderId,
      "delivered",
      "order_delivered",
      langText("Ordine consegnato", "Order delivered"),
      {
        deliveredAt: Date.now(),
        payoutStatus: "ready",
        allowedScopes: ["buyer"]
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
      { payoutStatus: "ready", allowedScopes: ["admin"] }
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
      { refundStatus: "requested", payoutStatus: "on_hold", allowedScopes: ["buyer"] }
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
      { refundStatus: "refunded", payoutStatus: "reversed", allowedScopes: ["admin"] }
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
      { refundStatus: "cancelled", payoutStatus: "cancelled", allowedScopes: ["buyer", "admin"] }
    );

    if (updated) {
      showToast(langText("Ordine annullato.", "Order cancelled."));
    }
  }

  function openSupportModal(orderId, options) {
    if (!state.currentUser) {
      requireAuth(function () {
        openSupportModal(orderId, options);
      });
      return;
    }
    const opts = options || {};
    const requestedScope = opts.role || "any";
    const order = getAccessibleOrderById(orderId, requestedScope);
    if (!order) {
      showToast(langText("Non puoi aprire supporto per questo ordine.", "You cannot open support for this order."));
      return;
    }
    openOpsModal("support", Object.assign({ orderId: order.id }, opts));
  }

  async function submitSupportTicket(orderId) {
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
      requesterId: (state.currentUser && state.currentUser.id) || "",
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
    try {
      const remoteTicket = await saveSupportTicketToSupabase(ticket);
      state.supportTickets = state.supportTickets.map(function (candidate) {
        return candidate.id === ticket.id ? remoteTicket : candidate;
      });
      persistSupportTickets();
    } catch (error) {
      console.warn("[IRIS] Unable to save support ticket to Supabase", error);
    }

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
    enqueueEmail("issue-reported", ticket.requesterEmail, {
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
      recipientEmail: ticket.requesterEmail
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

  async function resolveSupportTicket(ticketId) {
    const existingTicket = state.supportTickets.find(function (ticket) { return ticket.id === ticketId; }) || null;
    if (!existingTicket) {
      return;
    }
    if (!isCurrentUserAdmin()) {
      const currentEmail = normalizeEmail((state.currentUser && state.currentUser.email) || "");
      const canResolve = currentEmail && (
        normalizeEmail(existingTicket.buyerEmail) === currentEmail ||
        normalizeEmail(existingTicket.sellerEmail) === currentEmail
      );
      if (!canResolve) {
        showToast(langText("Non puoi gestire questo ticket.", "You cannot manage this ticket."));
        return;
      }
    }
    let resolvedTicket = null;
    state.supportTickets = state.supportTickets.map(function (ticket) {
      if (ticket.id !== ticketId) {
        return ticket;
      }

      resolvedTicket = Object.assign({}, ticket, {
        status: "resolved",
        updatedAt: Date.now()
      });
      return resolvedTicket;
    });
    persistSupportTickets();
    if (resolvedTicket) {
      try {
        const remoteResolvedTicket = await saveSupportTicketToSupabase(resolvedTicket);
        state.supportTickets = state.supportTickets.map(function (ticket) {
          return ticket.id === ticketId ? remoteResolvedTicket : ticket;
        });
        persistSupportTickets();
      } catch (error) {
        console.warn("[IRIS] Unable to sync resolved support ticket to Supabase", error);
      }
    }
    renderProfilePanel();
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
      orderId: order.id,
      productId: order.items[0].productId,
      sellerId: order.items[0].sellerId,
      sellerEmail: order.items[0].sellerEmail,
      buyerId: state.currentUser && state.currentUser.id ? state.currentUser.id : "",
      buyerEmail: normalizeEmail((state.currentUser && state.currentUser.email) || ""),
      buyer: state.currentUser ? state.currentUser.name : langText("Cliente IRIS", "IRIS customer"),
      rating: rating,
      text: message || langText("Esperienza positiva.", "Positive experience."),
      date: new Date().toLocaleDateString(curLang === "it" ? "it-IT" : "en-US", {
        month: "short",
        year: "numeric"
      }),
      product: order.items.map(function (item) { return item.name; }).join(", "),
      createdAt: Date.now()
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
    if (!getAccessibleOrderById(orderId, "admin")) {
      showToast(langText("Non puoi aggiornare questo payout.", "You cannot update this payout."));
      return;
    }
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
      return [{
        id: "stripe-offer-authorization",
        kind: "Stripe",
        label: langText("Carta o wallet in checkout sicuro", "Card or wallet in secure checkout"),
        meta: langText("Pre-autorizzazione protetta · nessun addebito finale ora", "Protected pre-authorization · no final capture yet"),
        snapshot: {
          id: "stripe-offer-authorization",
          label: langText("Autorizzazione sicura con Stripe", "Secure authorization with Stripe")
        }
      }];
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
    window.openOfferProfileSection = openOfferProfileSection;

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
        syncDialogFocus("offerModal", modal.classList.contains("open"), [".offer-send", ".offer-cancel", ".offer-shell__icon"]);
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
                  <button class="offer-send" ${(canSubmitReview && !state.offerSubmitting) ? "" : "disabled"} onclick="sendOffer()">${state.offerSubmitting ? langText("Reindirizzamento a Stripe...", "Redirecting to Stripe...") : langText("Invia offerta vincolante", "Submit binding offer")}</button>
                </div>
                <div class="offer-protection">
                  <strong>${langText("Protezione acquisto IRIS", "IRIS purchase protection")}</strong>
                  <span>${escapeHtml(langText("L'offerta scade dopo 24 ore. Se il seller rifiuta o non risponde, l'autorizzazione viene rilasciata e non finalizziamo alcun addebito.", "The offer expires after 24 hours. If the seller declines or does not respond, the authorization is released and we do not finalize any charge."))}</span>
                </div>
              </aside>
            </div>
          </div>
        `;
        syncDialogFocus("offerModal", modal.classList.contains("open"), [".offer-send", ".offer-payment-choice", ".offer-shell__icon--back", ".offer-shell__icon"]);
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
      syncDialogFocus("offerModal", modal.classList.contains("open"), ["#offerInput", ".offer-send", ".offer-shell__icon"]);
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
        state.offerSubmitting = false;
        state.offerStep = "amount";
        const modal = qs("#offerModal");
        if (modal) {
          modal.classList.add("open");
        }
        renderOfferModal();
        syncDialogFocus("offerModal", true, ["#offerInput", ".offer-send", ".offer-shell__icon"]);
      });
    };
    window.openOffer = openOffer;

    closeOffer = function () {
      const modal = qs("#offerModal");
      if (modal) {
        modal.classList.remove("open");
      }
      state.offerStep = "amount";
      state.offerError = "";
      state.offerStatus = null;
      state.offerSubmitting = false;
      state.offerDraft = null;
      syncDialogFocus("offerModal", false);
    };
    window.closeOffer = closeOffer;

    backOfferStep = function () {
      state.offerStep = "amount";
      state.offerError = "";
      state.offerSubmitting = false;
      renderOfferModal();
    };
    window.backOfferStep = backOfferStep;

    sendOffer = async function () {
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
        state.offerSubmitting = true;
        renderOfferModal();
        const result = await offerApiCreate(payload);
        if (!result.ok) {
          state.offerError = result.error;
          state.offerSubmitting = false;
          renderOfferModal();
          return;
        }
        if (result.redirect && result.checkoutUrl) {
          state.offerSubmitting = true;
          renderOfferModal();
          window.location.assign(result.checkoutUrl);
          return;
        }
        state.offerStatus = result.offer;
        state.offerDraft = result.offer;
        state.offerError = "";
        state.offerSubmitting = false;
        state.offerStep = "success";
        renderOfferModal();
        renderNotifications();
        renderProfilePanel();
        if (qs("#chat-view") && qs("#chat-view").classList.contains("active")) {
          renderChats();
        }
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
      state.offerSubmitting = false;
      state.offerStep = "authorization";
      renderOfferModal();
    };
    window.sendOffer = sendOffer;
    window.__irisModernOfferFlow = {
      open: openOffer,
      close: closeOffer,
      send: sendOffer
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
        langSelect.setAttribute("title", getLocaleMenuLabel(curLang));
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
      if (kind === "size") {
        return resolveSizeFilterLabel(value);
      }
      if (kind === "trust") {
        const option = getTrustFilterOptions().find(function (item) { return item.id === value; });
        return option ? option.label : value;
      }
      return getFacetLabel(kind, value);
    }

    function matchesCatalogFilters(product, options) {
      const config = options || {};
      const minPrice = parseLocalizedNumberInput(filters.pmin);
      const maxPrice = parseLocalizedNumberInput(filters.pmax);
      const searchQuery = normalizeSearchText(filters.search);
      const normalizedCategory = normalizeCategoryValue(product.cat);
      const convertedPrice = convertBaseEurAmount(product.price);
      const searchable = getProductSearchIndex(product);
      const trustMeta = getListingTrustMeta(product);
      const gender = inferListingGender(product);
      const material = String(product.material || "").trim();
      const sizePresentation = getListingSizePresentation(product);

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
      if (!config.ignoreSize && filters.size && sizePresentation.filterKey !== filters.size) return false;
      if (minPrice !== null && convertedPrice < minPrice) return false;
      if (maxPrice !== null && convertedPrice > maxPrice) return false;
      if (searchQuery && !searchable.includes(searchQuery)) return false;
      return true;
    }

    function renderSizeFilterPanel() {
      const panel = qs("#irisxSizeFilterPanel");
      const hint = qs("#irisxSizeFilterHint");
      const sizeInput = qs("#f-size");
      if (!panel) {
        return;
      }
      const candidateProducts = getVisibleCatalogProducts().filter(function (product) {
        return matchesCatalogFilters(product, { ignoreSize: true });
      });
      const groups = collectCatalogSizeFilterOptions(candidateProducts);
      const optionKeys = groups.reduce(function (accumulator, group) {
        group.options.forEach(function (option) {
          accumulator.push(option.key);
        });
        return accumulator;
      }, []);

      if (filters.size && optionKeys.indexOf(filters.size) === -1) {
        filters.size = "";
      }
      if (sizeInput) {
        sizeInput.value = filters.size || "";
      }

      if (!groups.length) {
        panel.innerHTML = `<div class="irisx-size-filter-empty">${escapeHtml(langText("Nessuna taglia coerente per i filtri attuali.", "No coherent size options for the current filters."))}</div>`;
        if (hint) {
          hint.textContent = langText("Le opzioni taglia appaiono solo quando categoria, brand e risultati usano uno schema compatibile.", "Size options appear only when category, brand, and results use a compatible schema.");
        }
        return;
      }

      panel.innerHTML = groups.map(function (group) {
        const optionsMarkup = group.options.map(function (option) {
          return `<button type="button" class="irisx-filter-chip${filters.size === option.key ? " is-active" : ""}" onclick="toggleSizeFilter('${escapeHtml(option.key)}')">${escapeHtml(option.label)}</button>`;
        }).join("");
        return `<div class="irisx-filter-group irisx-filter-group--size"><span class="irisx-filter-label">${escapeHtml(group.label)}</span><div class="irisx-filter-chip-row">${optionsMarkup}</div></div>`;
      }).join("");
      if (hint) {
        hint.textContent = langText("La taglia originale del brand resta sempre nel dato prodotto. L'equivalente standard compare solo quando il mapping e affidabile.", "The brand's original size always stays in the product data. The standard equivalent only appears when the mapping is reliable.");
      }
    }

    toggleSizeFilter = function (filterKey) {
      ensureExtendedFilters();
      filters.size = filters.size === filterKey ? "" : filterKey;
      applyFilters();
    };
    window.toggleSizeFilter = toggleSizeFilter;

    function focusFilterPanel(panelId) {
      const panel = qs("#filtersPanel");
      const target = panelId ? qs("#" + panelId) : null;
      const group = target ? target.closest(".f-group") : null;
      if (window.innerWidth <= 900) {
        toggleMobileFilters(true);
      }
      if (group) {
        const label = group.querySelector(".f-label.closed");
        if (label) {
          label.classList.remove("closed");
        }
        group.classList.add("is-focused");
        setTimeout(function () {
          group.classList.remove("is-focused");
        }, 1200);
        if (typeof group.scrollIntoView === "function") {
          group.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
      } else if (panel && typeof panel.scrollIntoView === "function") {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function syncSortButtons() {
      qsa(".sort-btn").forEach(function (button) {
        const onclick = button.getAttribute("onclick") || "";
        button.classList.toggle("on", onclick.indexOf("'" + curSort + "'") !== -1);
      });
    }

    function applyShopPreset(kind, value) {
      ensureExtendedFilters();
      if (kind === "recent") {
        curSort = "recent";
        syncSortButtons();
        render();
        return;
      }
      if (kind === "designers") {
        focusFilterPanel("f-brands");
        return;
      }
      if (kind === "genders") {
        filters.genders = filters.genders.length === 1 && filters.genders[0] === value ? [] : [value];
      }
      if (kind === "cats") {
        filters.cats = filters.cats.length === 1 && filters.cats[0] === value ? [] : [value];
      }
      initFilters();
      render();
    }

    window.focusFilterPanel = focusFilterPanel;
    window.applyShopPreset = applyShopPreset;

    function renderHorizontalFilterRail() {
      ensureExtendedFilters();
      const host = qs("#activeFilters");
      if (!host) {
        return;
      }
      const browseItems = [
        { kind: "recent", value: "recent", label: langText("Nuovi arrivi", "New in"), active: curSort === "recent" },
        { kind: "designers", value: "designers", label: langText("Designers", "Designers"), active: filters.brands.length > 0 },
        { kind: "genders", value: "Women", label: langText("Donna", "Women"), active: filters.genders.includes("Women") },
        { kind: "genders", value: "Men", label: langText("Uomo", "Men"), active: filters.genders.includes("Men") },
        { kind: "cats", value: "Borse", label: langText("Borse", "Bags"), active: filters.cats.includes("Borse") },
        { kind: "cats", value: "Scarpe", label: langText("Scarpe", "Shoes"), active: filters.cats.includes("Scarpe") },
        { kind: "cats", value: "Orologi", label: langText("Orologi", "Watches"), active: filters.cats.includes("Orologi") },
        { kind: "cats", value: "Accessori", label: langText("Accessori", "Accessories"), active: filters.cats.includes("Accessori") }
      ];
      const browseMarkup = browseItems
        .map(function (item) {
          return `<button class="irisx-shop-browse-link${item.active ? " is-active" : ""}" type="button" onclick="applyShopPreset('${escapeHtml(item.kind)}','${escapeHtml(item.value)}')">${escapeHtml(item.label)}</button>`;
        })
        .join("");
      // Build hover dropdown filter bar
      function buildFdrop(label, items, filterKey, labelFn) {
        const hasActive = Array.isArray(filters[filterKey]) && filters[filterKey].length > 0;
        const opts = items.length > 0
          ? items.map(function (v) {
              const isOn = Array.isArray(filters[filterKey]) && filters[filterKey].includes(v);
              const display = labelFn ? labelFn(v) : v;
              return `<div class="irisx-fdrop__item${isOn ? ' on' : ''}" onclick="toggleOpt(this,'${filterKey}','${escapeHtml(v)}')" onmousedown="event.preventDefault()"><span class="irisx-fdrop__check">✓</span>${escapeHtml(display)}</div>`;
            }).join("")
          : `<div class="irisx-fdrop__empty">${escapeHtml(langText("Nessuna opzione", "No options"))}</div>`;
        return `<div class="irisx-fdrop"><button class="irisx-fdrop__btn${hasActive ? ' is-active' : ''}" type="button">${escapeHtml(label)}<span class="irisx-fdrop__arrow">▾</span></button><div class="irisx-fdrop__panel">${opts}</div></div>`;
      }
      const brandDrop = buildFdrop(langText("Designer", "Designer"), getAvailableBrands(), "brands", null);
      const condDrop = buildFdrop(langText("Condizione", "Condition"), getAvailableConditions(), "conds", function (v) { return getFacetLabel("conds", v); });
      const catDrop = buildFdrop(langText("Categoria", "Category"), getAvailableCategories(), "cats", function (v) { return getFacetLabel("cats", v); });
      const genderDrop = buildFdrop(langText("Genere", "Gender"), ["Women", "Men", "Unisex"], "genders", function (v) { return v === "Women" ? langText("Donna", "Women") : v === "Men" ? langText("Uomo", "Men") : "Unisex"; });
      const trustChips = getTrustFilterOptions().map(function (option) {
        return `<button class="irisx-filter-chip irisx-filter-chip--trust${filters.trust.includes(option.id) ? " is-active" : ""}" onclick="toggleFilterChip('trust', '${escapeHtml(option.id)}')">${escapeHtml(option.label)}</button>`;
      }).join("");
      const discoveryKicker = langText("Shop edit", "Shop edit");
      const discoveryTitle = langText("Esplora l'archivio con filtri più precisi", "Explore the archive with sharper filters");
      const discoverySummary = langText(
        "Designer, categoria, genere e fiducia IRIS in un unico rail più ordinato.",
        "Designer, category, gender and IRIS trust in one tighter rail."
      );
      host.innerHTML = `<div class="irisx-shop-browse irisx-shop-discovery-deck">
        <div class="irisx-shop-discovery-head">
          <div class="irisx-shop-discovery-intro">
            <span class="irisx-shop-discovery-kicker">${escapeHtml(discoveryKicker)}</span>
            <div class="irisx-shop-discovery-title">${escapeHtml(discoveryTitle)}</div>
          </div>
          <div class="irisx-shop-discovery-summary">${escapeHtml(discoverySummary)}</div>
        </div>
        <div class="irisx-shop-discovery-section irisx-shop-discovery-section--browse">
          <span class="irisx-shop-discovery-eyebrow">${escapeHtml(langText("Scorciatoie curatoriali", "Curated shortcuts"))}</span>
          <div class="irisx-shop-browse-row">${browseMarkup}</div>
        </div>
        <div class="irisx-shop-discovery-section irisx-shop-discovery-section--filters">
          <span class="irisx-shop-discovery-eyebrow">${escapeHtml(langText("Affina la ricerca", "Refine the search"))}</span>
          <div class="irisx-fdrop-bar">${brandDrop}${condDrop}${catDrop}${genderDrop}</div>
        </div>
        <div class="irisx-shop-discovery-section irisx-shop-discovery-section--meta" id="irisxShopMetaRow">
          <div class="irisx-filter-group irisx-filter-group--trust">
            <span class="irisx-shop-discovery-eyebrow">${escapeHtml(langText("Fiducia IRIS", "IRIS trust"))}</span>
            <div class="irisx-filter-chip-row">${trustChips}</div>
          </div>
          <div class="irisx-shop-selection is-empty" id="irisxShopSelection">
            <span class="irisx-shop-discovery-eyebrow">${escapeHtml(langText("Selezione attiva", "Active selection"))}</span>
            <div class="active-filters irisx-active-filter-row" id="activeFilterChips"></div>
          </div>
        </div>
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
      renderSizeFilterPanel();
      renderHorizontalFilterRail();
    };

    clearFilters = function () {
      filters = { cats: [], brands: [], conds: [], fits: [], colors: [], genders: [], materials: [], trust: [], size: "", pmin: "", pmax: "", search: "" };
      const searchInput = qs("#searchInput");
      if (searchInput) {
        searchInput.value = "";
      }
      const mobileSearchInput = qs("#irisMobileSearchInput");
      if (mobileSearchInput) {
        mobileSearchInput.value = "";
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
      const items = getVisibleCatalogProducts().filter(function (product) {
        return matchesCatalogFilters(product);
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
        if (type === "search" && qs("#irisMobileSearchInput")) {
          qs("#irisMobileSearchInput").value = "";
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
      if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
        saveFavoriteToSupabase(id, favorites.has(id)).catch(function (error) {
          console.warn("[IRIS] Unable to sync favorite to Supabase", error);
        });
      }
      renderProfilePanel();
    };

    openChat = function (sellerId, productId) {
      requireAuth(function () {
        showBuyView("chat");
        const product = getListingById(productId) || prods.find(function (candidate) { return String(candidate.id) === String(productId); }) || null;
        const seller = (product && product.seller) || sellers.find(function (candidate) { return candidate.id === sellerId; }) || {};
        const sellerEmail = normalizeEmail((product && (product.ownerEmail || (product.seller && product.seller.email))) || seller.email || "");
        const buyer = state.currentUser || {};
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
        if (threadIndex === -1) {
          const threadSeed = normalizeChatThread({
            id: createId("chat"),
            listingId: productId,
            productId: productId,
            product: product,
            sellerId: seller.id || sellerId || "",
            sellerEmail: sellerEmail,
            sellerName: seller.name || "",
            buyerId: buyer.id || buyer.email || "",
            buyerEmail: buyer.email || "",
            buyerName: buyer.name || "",
            with: normalizeChatParticipant(
              seller.id || sellerId || "",
              seller.name || langText("Seller", "Seller"),
              seller.avatar || "👤",
              sellerEmail
            ),
            msgs: [],
            updatedAt: Date.now(),
            unreadCount: 0
          });
          chats.unshift(threadSeed);
          threadIndex = 0;
        }
        if (threadIndex > -1) {
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
          if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
            saveConversationToSupabase(normalizedThread).then(function (remoteThread) {
              const remoteThreadIndex = chats.findIndex(function (candidate) { return String(candidate.id) === String(remoteThread.id); });
              if (remoteThreadIndex > -1) {
                chats[remoteThreadIndex] = remoteThread;
              } else {
                chats.unshift(remoteThread);
              }
              persistChats();
              renderChats();
            }).catch(function (error) {
              console.warn("[IRIS] Unable to sync conversation to Supabase", error);
            });
          }
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
          initFilters();
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
        window.scrollTo(0, 0);
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
        setActiveNav("profile");
        syncTopnavChrome("seller");
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
      renderSizeFilterPanel();
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
      if (filters.size) chips.push({ label: t("size") + ": " + resolveSizeFilterLabel(filters.size), type: "size", value: filters.size });
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
      const activeSelection = qs("#irisxShopSelection");
      const metaRow = qs("#irisxShopMetaRow");
      if (activeSelection) {
        activeSelection.classList.toggle("is-empty", chips.length === 0);
      }
      if (metaRow) {
        metaRow.classList.toggle("has-selection", chips.length > 0);
      }

      grid.innerHTML = items.map((product) => productCardMarkup(product)).join("");
      enhanceInteractiveSurfaces(grid);
      renderHomeView();
      updateSearchSaveButton();
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
      enhanceInteractiveSurfaces(grid);
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
        "</div><div class=\"det-body\"><button type=\"button\" class=\"det-back\" onclick=\"closeDetail()\">" +
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
      enhanceInteractiveSurfaces(detailView);
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
    window.requestPasswordReset = requestPasswordReset;
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
    const imageMeta = Array.isArray(product.imageMeta) ? product.imageMeta : [];
    if (!images.length) {
      return "<div class=\"det-img-main\">" + escapeHtml(product.emoji || "👜") + "</div>";
    }
    const activeIndex = Math.min(Math.max(Number(state.activeDetailImage || 0), 0), images.length - 1);
    const activeMeta = imageMeta[activeIndex] || null;
    const activeRatio = activeMeta && Number(activeMeta.aspectRatio) > 0 ? Number(activeMeta.aspectRatio) : null;
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
      "<div class=\"irisx-detail-media\"><div class=\"irisx-detail-stage\"" +
      (activeRatio ? " style=\"--iris-detail-stage-ratio:" + activeRatio + "\"" : "") +
      ">" +
      navControls +
      "<img class=\"irisx-detail-image\" id=\"detailMainImage\" crossorigin=\"anonymous\" src=\"" +
      images[activeIndex] +
      "\" alt=\"" +
      escapeHtml(product.name) +
      "\" data-image-index=\"" + activeIndex + "\" data-original-src=\"" + escapeHtml(images[activeIndex]) + "\"></div>" +
      (images.length > 1 ? "<div class=\"irisx-detail-thumbs\">" + thumbs + "</div>" : "") +
      "</div>"
    );
  }

  function detectSmartCropBounds(imageNode) {
    if (!imageNode || !imageNode.naturalWidth || !imageNode.naturalHeight) {
      return null;
    }
    const analysisScale = Math.min(1, 240 / Math.max(imageNode.naturalWidth, imageNode.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(24, Math.round(imageNode.naturalWidth * analysisScale));
    canvas.height = Math.max(24, Math.round(imageNode.naturalHeight * analysisScale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return null;
    }
    try {
      context.drawImage(imageNode, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const borderSamples = [];
      const samplePixel = function (x, y) {
        const offset = (y * canvas.width + x) * 4;
        borderSamples.push([
          pixels[offset],
          pixels[offset + 1],
          pixels[offset + 2],
          pixels[offset + 3]
        ]);
      };
      for (let x = 0; x < canvas.width; x += 3) {
        samplePixel(x, 0);
        samplePixel(x, Math.max(0, canvas.height - 1));
      }
      for (let y = 0; y < canvas.height; y += 3) {
        samplePixel(0, y);
        samplePixel(Math.max(0, canvas.width - 1), y);
      }
      if (!borderSamples.length) {
        return null;
      }
      const background = borderSamples.reduce(function (accumulator, sample) {
        accumulator.r += sample[0];
        accumulator.g += sample[1];
        accumulator.b += sample[2];
        accumulator.a += sample[3];
        return accumulator;
      }, { r: 0, g: 0, b: 0, a: 0 });
      background.r /= borderSamples.length;
      background.g /= borderSamples.length;
      background.b /= borderSamples.length;
      background.a /= borderSamples.length;

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const offset = (y * canvas.width + x) * 4;
          const alpha = pixels[offset + 3];
          if (alpha < 24) {
            continue;
          }
          const dr = pixels[offset] - background.r;
          const dg = pixels[offset + 1] - background.g;
          const db = pixels[offset + 2] - background.b;
          const distance = Math.sqrt((dr * dr) + (dg * dg) + (db * db));
          if (distance < 42) {
            continue;
          }
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      if (maxX <= minX || maxY <= minY) {
        return null;
      }

      const boxWidth = maxX - minX + 1;
      const boxHeight = maxY - minY + 1;
      const horizontalWaste = (canvas.width - boxWidth) / canvas.width;
      const verticalWaste = (canvas.height - boxHeight) / canvas.height;
      if (horizontalWaste < 0.12 && verticalWaste < 0.12) {
        return null;
      }

      const paddingX = Math.max(6, Math.round(boxWidth * 0.08));
      const paddingY = Math.max(8, Math.round(boxHeight * 0.06));
      const scaleBack = imageNode.naturalWidth / canvas.width;
      const cropX = Math.max(0, Math.round((minX - paddingX) * scaleBack));
      const cropY = Math.max(0, Math.round((minY - paddingY) * scaleBack));
      const cropWidth = Math.min(imageNode.naturalWidth - cropX, Math.round((boxWidth + paddingX * 2) * scaleBack));
      const cropHeight = Math.min(imageNode.naturalHeight - cropY, Math.round((boxHeight + paddingY * 2) * scaleBack));
      if (cropWidth < imageNode.naturalWidth * 0.48 || cropHeight < imageNode.naturalHeight * 0.48) {
        return null;
      }
      return {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight
      };
    } catch (error) {
      return null;
    }
  }

  function renderOptimizedImageData(imageNode, cropBounds, maxSize, quality) {
    if (!imageNode || !cropBounds) {
      return null;
    }
    const sourceWidth = Math.max(1, Number(cropBounds.width) || imageNode.naturalWidth);
    const sourceHeight = Math.max(1, Number(cropBounds.height) || imageNode.naturalHeight);
    const resizeRatio = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * resizeRatio));
    canvas.height = Math.max(1, Math.round(sourceHeight * resizeRatio));
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    try {
      context.drawImage(
        imageNode,
        Math.max(0, Number(cropBounds.x) || 0),
        Math.max(0, Number(cropBounds.y) || 0),
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
      return {
        src: canvas.toDataURL("image/jpeg", quality),
        width: canvas.width,
        height: canvas.height,
        aspectRatio: canvas.width / Math.max(canvas.height, 1),
        fitHint: canvas.width / Math.max(canvas.height, 1) < 0.85 ? "portrait-phone" : canvas.width / Math.max(canvas.height, 1) > 1.2 ? "landscape" : "standard"
      };
    } catch (error) {
      return null;
    }
  }

  function maybeOptimizeDetailImage(product, imageNode, ratioOverride) {
    if (!product || !imageNode) {
      return;
    }
    const activeIndex = Math.min(Math.max(Number(state.activeDetailImage || 0), 0), Math.max((product.images || []).length - 1, 0));
    const originalSource = product.images && product.images[activeIndex];
    if (!originalSource) {
      return;
    }
    const cachedOptimization = state.detailImageOptimizations[originalSource];
    if (cachedOptimization) {
      if (cachedOptimization.src && imageNode.dataset.optimizedFor !== originalSource) {
        imageNode.dataset.optimizedFor = originalSource;
        imageNode.src = cachedOptimization.src;
        imageNode.onload = function () {
          applyDetailImageFit(imageNode, cachedOptimization.aspectRatio || ratioOverride);
        };
      } else {
        applyDetailImageFit(imageNode, cachedOptimization.aspectRatio || ratioOverride);
      }
      return;
    }
    if (imageNode.dataset.optimizedFor === originalSource) {
      return;
    }
    const cropBounds = detectSmartCropBounds(imageNode);
    if (!cropBounds) {
      state.detailImageOptimizations[originalSource] = {
        src: null,
        aspectRatio: ratioOverride || (imageNode.naturalWidth / Math.max(imageNode.naturalHeight, 1))
      };
      return;
    }
    const optimized = renderOptimizedImageData(imageNode, cropBounds, 1400, 0.9);
    state.detailImageOptimizations[originalSource] = {
      src: optimized ? optimized.src : null,
      aspectRatio: optimized ? optimized.aspectRatio : (ratioOverride || (imageNode.naturalWidth / Math.max(imageNode.naturalHeight, 1)))
    };
    if (optimized && imageNode.dataset.originalSrc === originalSource) {
      imageNode.dataset.optimizedFor = originalSource;
      imageNode.src = optimized.src;
      imageNode.onload = function () {
        applyDetailImageFit(imageNode, optimized.aspectRatio);
      };
    }
  }

  function applyDetailImageFit(imageNode, ratioOverride) {
    const stage = qs(".irisx-detail-stage");
    if (!imageNode || !stage) {
      return;
    }
    const imageRatio = Number(ratioOverride) > 0
      ? Number(ratioOverride)
      : (imageNode.naturalWidth && imageNode.naturalHeight ? imageNode.naturalWidth / Math.max(imageNode.naturalHeight, 1) : 0);
    if (!Number.isFinite(imageRatio) || imageRatio <= 0) {
      stage.style.removeProperty("--iris-detail-stage-ratio");
      stage.dataset.imageFit = "standard";
      return;
    }
    const clampedRatio = Math.max(0.58, Math.min(1.45, imageRatio));
    stage.style.setProperty("--iris-detail-stage-ratio", String(clampedRatio));
    stage.dataset.imageFit = clampedRatio < 0.9 ? "portrait" : clampedRatio > 1.12 ? "landscape" : "standard";
  }

  function syncDetailImageFit(product) {
    const imageNode = qs("#detailMainImage");
    if (!imageNode) {
      return;
    }
    const activeIndex = Math.min(Math.max(Number(state.activeDetailImage || 0), 0), Math.max((product && product.images ? product.images.length : 1) - 1, 0));
    const imageMeta = product && Array.isArray(product.imageMeta) ? product.imageMeta[activeIndex] : null;
    const ratioOverride = imageMeta && Number(imageMeta.aspectRatio) > 0 ? Number(imageMeta.aspectRatio) : 0;
    if (imageNode.complete) {
      applyDetailImageFit(imageNode, ratioOverride);
      return;
    }
    imageNode.onload = function () {
      applyDetailImageFit(imageNode, ratioOverride);
    };
  }

  function setDetailImage(index) {
    const mainImage = qs("#detailMainImage");
    const currentProduct = state.activeDetailListingId ? getListingById(state.activeDetailListingId) : null;
    if (!mainImage || !currentProduct || !currentProduct.images[index]) {
      return;
    }

    state.activeDetailImage = index;
    mainImage.dataset.optimizedFor = "";
    mainImage.dataset.originalSrc = currentProduct.images[index];
    mainImage.src = currentProduct.images[index];
    mainImage.dataset.imageIndex = String(index);
    qsa(".irisx-detail-thumb").forEach(function (thumb, thumbIndex) {
      thumb.classList.toggle("on", thumbIndex === index);
    });
    syncDetailImageFit(currentProduct);
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
    syncDialogFocus("irisxAuthModal", true, ["#irisxAuthEmail", "#irisxAuthName", "#irisxAuthPassword", ".irisx-close"]);
  }

  function closeAuthModal() {
    state.authReturnView = "home";
    qs("#irisxAuthModal").classList.remove("open");
    syncDialogFocus("irisxAuthModal", false);
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
    const isRecovery = state.authMode === "recovery";
    const googleSvg = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.87 7.34 2.44 10.52l8.09-5.93z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
    const googleBtnText = curLang === "it" ? "Continua con Google" : "Continue with Google";
    const orText = curLang === "it" ? "oppure" : "or";
    const title = isRecovery
      ? langText("Imposta una nuova password", "Set a new password")
      : t(isLogin ? "auth_title_login" : "auth_title_register");
    const subtitle = isRecovery
      ? langText("Sei rientrato dal link email. Inserisci la nuova password per completare il ripristino.", "You returned from the recovery email. Enter your new password to finish resetting it.")
      : t(isLogin ? "auth_sub_login" : "auth_sub_register");
    const switchMode = isRecovery ? "login" : (isLogin ? "register" : "login");
    const switchLabel = isRecovery ? t("login") : t(isLogin ? "register" : "login");
    const switchText = isRecovery ? langText("Torna all'accesso", "Back to sign in") : t(isLogin ? "auth_switch_register" : "auth_switch_login");

    modal.innerHTML =
      "<div class=\"irisx-modal-backdrop\"></div><div class=\"irisx-modal-card\"><div class=\"irisx-card-head\"><div><div class=\"irisx-title\">" +
      title +
      "</div><div class=\"irisx-subtitle\">" +
      subtitle +
      "</div></div><button class=\"irisx-close\" aria-label=\"" + langText("Chiudi", "Close") + "\" onclick=\"closeAuthModal()\">✕</button></div><div class=\"irisx-card-body\">" +
      (isRecovery ? "" : ("<button class=\"irisx-google-btn\" onclick=\"signInWithGoogle()\">" + googleSvg + " " + googleBtnText + "</button>" +
      "<div class=\"irisx-divider\"><span>" + orText + "</span></div>" +
      "<div class=\"irisx-segment\"><button class=\"" +
      (isLogin ? "on" : "") +
      "\" onclick=\"switchAuthMode('login')\">" +
      t("login") +
      "</button><button class=\"" +
      (!isLogin ? "on" : "") +
      "\" onclick=\"switchAuthMode('register')\">" +
      t("register") +
      "</button></div>")) +
      "<form class=\"irisx-auth-form\" onsubmit=\"event.preventDefault();submitAuth()\"><div class=\"irisx-form-grid\"><div class=\"irisx-field" +
      (isLogin || isRecovery ? " irisx-hidden" : "") +
      "\"><label for=\"irisxAuthName\">" +
      t("full_name") +
      "</label><input id=\"irisxAuthName\" type=\"text\" autocomplete=\"name\"></div><div class=\"irisx-field" + (isRecovery ? " irisx-hidden" : "") + "\"><label for=\"irisxAuthEmail\">" +
      t("email") +
      "</label><input id=\"irisxAuthEmail\" type=\"email\" autocomplete=\"email\"></div><div class=\"irisx-field" + (isLogin || isRecovery ? " irisx-hidden" : "") + "\"><label for=\"irisxAuthPhone\">" +
      langText("Telefono", "Phone number") +
      "</label><input id=\"irisxAuthPhone\" type=\"tel\" autocomplete=\"tel\" inputmode=\"tel\" placeholder=\"" +
      langText("+39 333 123 4567", "+39 333 123 4567") +
      "\"></div><div class=\"irisx-field\"><label for=\"irisxAuthPassword\">" +
      (isRecovery ? langText("Nuova password", "New password") : t("password")) +
      "</label><input id=\"irisxAuthPassword\" type=\"password\" autocomplete=\"" +
      (isLogin ? "current-password" : "new-password") +
      "\"></div><div class=\"irisx-field" + (isRecovery ? "" : " irisx-hidden") + "\"><label for=\"irisxAuthPasswordConfirm\">" +
      langText("Conferma password", "Confirm password") +
      "</label><input id=\"irisxAuthPasswordConfirm\" type=\"password\" autocomplete=\"new-password\"></div></div><div class=\"irisx-actions\"><button class=\"irisx-primary\" type=\"submit\">" +
      (isRecovery ? langText("Aggiorna password", "Update password") : t(isLogin ? "auth_cta_login" : "auth_cta_register")) +
      "</button>" +
      (isLogin ? "<button class=\"irisx-secondary\" type=\"button\" onclick=\"requestPasswordReset()\">" + langText("Password dimenticata?", "Forgot password?") + "</button>" : "") +
      "</div></form><div class=\"irisx-auth-switch\">" +
      switchText +
      " <button onclick=\"switchAuthMode('" +
      switchMode +
      "')\">" +
      switchLabel +
      "</button></div><div class=\"irisx-status irisx-hidden\" id=\"irisxAuthStatus\"></div></div></div>";
    syncDialogFocus("irisxAuthModal", modal.classList.contains("open"), ["#irisxAuthEmail", "#irisxAuthName", "#irisxAuthPassword", ".irisx-close"]);
  }

  function getReadableAuthErrorMessage(error, fallbackIt, fallbackEn) {
    const rawMessage = error && error.message ? String(error.message).trim() : "";
    const fallbackMessage = langText(fallbackIt, fallbackEn);
    if (!rawMessage) {
      return fallbackMessage;
    }
    const normalized = rawMessage.toLowerCase();
    if (normalized.includes("email address") && normalized.includes("invalid")) {
      return langText("Inserisci un indirizzo email valido.", "Enter a valid email address.");
    }
    if (normalized.includes("email not confirmed")) {
      return langText("Conferma prima la tua email e poi accedi di nuovo.", "Confirm your email first, then sign in again.");
    }
    if (normalized.includes("invalid login credentials")) {
      return langText("Email o password non corretti.", "Incorrect email or password.");
    }
    if (normalized.includes("signup") && normalized.includes("disabled")) {
      return langText("La registrazione è momentaneamente non disponibile.", "Sign up is temporarily unavailable.");
    }
    if (normalized.includes("redirect") && normalized.includes("not allowed")) {
      return langText("Il link di ritorno non è configurato correttamente. Contatta il supporto IRIS.", "The return URL is not configured correctly. Contact IRIS support.");
    }
    if (normalized.includes("rate limit") || normalized.includes("too many requests") || normalized.includes("429")) {
      return langText("Hai fatto troppi tentativi in poco tempo. Aspetta un attimo e riprova.", "Too many attempts in a short time. Wait a moment and try again.");
    }
    return rawMessage;
  }

  async function requestPasswordReset() {
    const status = qs("#irisxAuthStatus");
    const emailField = qs("#irisxAuthEmail");
    const email = emailField ? emailField.value.trim().toLowerCase() : "";
    if (!email) {
      setInlineStatus(status, langText("Inserisci prima la tua email.", "Enter your email first."), true);
      if (emailField) {
        emailField.focus();
      }
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setInlineStatus(status, langText("Recupero password disponibile solo con backend attivo.", "Password recovery is available only with the backend enabled."), true);
      return;
    }
    try {
      const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getSupabaseRedirectUrl()
      });
      if (response.error) {
        throw response.error;
      }
      setInlineStatus(
        status,
        langText(
          "Ti abbiamo inviato un link per reimpostare la password. Controlla la tua email.",
          "We sent you a link to reset your password. Check your email."
        ),
        false
      );
    } catch (error) {
      setInlineStatus(
        status,
        getReadableAuthErrorMessage(error, "Impossibile inviare l'email di recupero.", "Unable to send the recovery email."),
        true
      );
    }
  }

  async function signInWithGoogle() {
    const supabase = getSupabaseClient();
    if (supabase) {
      const status = qs("#irisxAuthStatus");
      try {
        const response = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: getSupabaseRedirectUrl()
          }
        });
        if (response.error) {
          throw response.error;
        }
        setInlineStatus(
          status,
          langText("Reindirizzamento a Google in corso...", "Redirecting to Google..."),
          false
        );
      } catch (error) {
        setInlineStatus(
          status,
          getReadableAuthErrorMessage(error, "Accesso Google non disponibile.", "Google sign-in is currently unavailable."),
          true
        );
      }
      return;
    }

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
          platformRole: normalizeString((existingGoogleUser && existingGoogleUser.platformRole) || (existingGoogleUser && existingGoogleUser.role) || ""),
          role: sanitizeWorkspaceRole((existingGoogleUser && (existingGoogleUser.platformRole || existingGoogleUser.role)) || ""),
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
          state.users.push(Object.assign({}, state.currentUser));
          saveJson(STORAGE_KEYS.users, state.users);
          notifyNewUser(state.currentUser);
        } else {
          state.users = state.users.map(function (user) {
            return normalizeEmail(user.email) === normalizedEmail
              ? Object.assign({}, user, state.currentUser)
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
        if (status) setInlineStatus(status, getReadableAuthErrorMessage(error, "Accesso Google non disponibile.", "Google sign-in is currently unavailable."), true);
      });
      return;
    }

    // Google OAuth requires Supabase — no mock fallback allowed
    var googleStatus = qs("#irisxAuthStatus");
    var googleMsg = langText("Accesso Google non disponibile. Configura Supabase OAuth.", "Google sign-in unavailable. Supabase OAuth must be configured.");
    if (googleStatus) {
      setInlineStatus(googleStatus, googleMsg, true);
    } else {
      showToast(googleMsg);
    }
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

  async function submitAuth() {
    const isLogin = state.authMode === "login";
    const isRecovery = state.authMode === "recovery";
    const status = qs("#irisxAuthStatus");
    const nameField = qs("#irisxAuthName");
    const emailField = qs("#irisxAuthEmail");
    const phoneField = qs("#irisxAuthPhone");
    const passwordField = qs("#irisxAuthPassword");
    const passwordConfirmField = qs("#irisxAuthPasswordConfirm");

    const name = nameField ? nameField.value.trim() : "";
    const email = emailField ? emailField.value.trim().toLowerCase() : "";
    const phone = normalizePhoneNumber(phoneField ? phoneField.value.trim() : "");
    const password = passwordField ? passwordField.value : "";
    const passwordConfirm = passwordConfirmField ? passwordConfirmField.value : "";

    if (isRecovery) {
      if (!password || !passwordConfirm) {
        setInlineStatus(status, langText("Inserisci e conferma la nuova password.", "Enter and confirm your new password."), true);
        return;
      }
      if (password.length < 8) {
        setInlineStatus(status, langText("La password deve avere almeno 8 caratteri.", "Password must be at least 8 characters long."), true);
        return;
      }
      if (password !== passwordConfirm) {
        setInlineStatus(status, langText("Le password non coincidono.", "Passwords do not match."), true);
        return;
      }
    } else if ((!isLogin && !name) || !email || (!isLogin && !phone) || !password) {
      setInlineStatus(status, curLang === "it" ? "Compila tutti i campi richiesti." : "Please fill in all required fields.", true);
      return;
    }

    if (!isRecovery && !isLogin && !isValidPhoneNumber(phone)) {
      setInlineStatus(status, curLang === "it" ? "Inserisci un numero di telefono valido." : "Please enter a valid phone number.", true);
      return;
    }

    const blockedIdentityMessage = isRecovery ? "" : getBlockedIdentityMessage(email, phone);
    if (!isRecovery && blockedIdentityMessage) {
      setInlineStatus(status, blockedIdentityMessage, true);
      return;
    }

    // Rate limiting: max 5 login attempts per email per 15 minutes
    if (isLogin && email) {
      var rlKey = "iris-rl-" + btoa(email).replace(/[^a-z0-9]/gi, "");
      var rlRaw = sessionStorage.getItem(rlKey);
      var rl = rlRaw ? JSON.parse(rlRaw) : { count: 0, first: Date.now() };
      var WINDOW_MS = 15 * 60 * 1000;
      var MAX_ATTEMPTS = 5;
      if (Date.now() - rl.first > WINDOW_MS) {
        rl = { count: 0, first: Date.now() };
      }
      if (rl.count >= MAX_ATTEMPTS) {
        var waitMin = Math.ceil((WINDOW_MS - (Date.now() - rl.first)) / 60000);
        setInlineStatus(status, langText(
          "Troppi tentativi. Riprova tra " + waitMin + " minuto/i.",
          "Too many attempts. Please try again in " + waitMin + " minute(s)."
        ), true);
        return;
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        if (isRecovery) {
          const updateResponse = await supabase.auth.updateUser({
            password: password
          });
          if (updateResponse.error) {
            throw updateResponse.error;
          }
          await supabase.auth.signOut();
          state.authMode = "login";
          renderAuthModal();
          setInlineStatus(
            qs("#irisxAuthStatus"),
            langText("Password aggiornata. Ora puoi accedere con la nuova password.", "Password updated. You can now sign in with your new password."),
            false
          );
          showToast(langText("Password aggiornata.", "Password updated."));
          return;
        }

        if (isLogin) {
          const signInResponse = await supabase.auth.signInWithPassword({
            email: email,
            password: password
          });
          if (signInResponse.error) {
            throw signInResponse.error;
          }
          const session = signInResponse.data && signInResponse.data.session;
          const authUser = signInResponse.data && signInResponse.data.user;
          let profile = authUser ? await fetchSupabaseProfile(authUser.id) : null;
          if (!profile && authUser) {
            profile = await upsertSupabaseProfile({
              email: email,
              name: (authUser.user_metadata && (authUser.user_metadata.full_name || authUser.user_metadata.name)) || "",
              phone: phone
            }, authUser);
          }
          const profilePhone = normalizePhoneNumber(profile && profile.phone);
          if (phone && profilePhone && profilePhone !== phone) {
            await supabase.auth.signOut();
            setInlineStatus(status, curLang === "it" ? "Numero di telefono non corretto." : "Incorrect phone number.", true);
            return;
          }
          const nextUser = buildWorkspaceUserFromSupabase(authUser, profile);
          // Reset rate limit on successful login
          if (email) {
            var rlKeyClear = "iris-rl-" + btoa(email).replace(/[^a-z0-9]/gi, "");
            sessionStorage.removeItem(rlKeyClear);
          }
          applyAuthenticatedUser(nextUser);
          showToast(t("login_success"));
          finalizeAuthSuccess(state.authReturnView);
          return;
        }

        const signUpResponse = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            emailRedirectTo: getSupabaseRedirectUrl(),
            data: {
              full_name: name,
              phone: phone
            }
          }
        });
        if (signUpResponse.error) {
          throw signUpResponse.error;
        }

        if (signUpResponse.data && signUpResponse.data.user && signUpResponse.data.session) {
          await upsertSupabaseProfile({
            id: signUpResponse.data.user.id,
            name: name,
            email: email,
            phone: phone,
            city: curLang === "it" ? "Italia" : "Italy",
            country: curLang === "it" ? "Italia" : "Italy",
            bio: "",
            memberSince: String(new Date().getFullYear()),
            avatar: ""
          }, signUpResponse.data.user);
        }

        if (signUpResponse.data && signUpResponse.data.session && signUpResponse.data.user) {
          const nextUser = buildWorkspaceUserFromSupabase(signUpResponse.data.user, await fetchSupabaseProfile(signUpResponse.data.user.id));
          applyAuthenticatedUser(nextUser);
          notifyNewUser(nextUser);
          showToast(t("register_success"));
          finalizeAuthSuccess(state.authReturnView);
          return;
        }

        setInlineStatus(
          status,
          langText(
            "Account creato. Controlla la tua email per confermare l'accesso e poi entra su IRIS.",
            "Account created. Check your email to confirm access, then sign in to IRIS."
          ),
          false
        );
        return;
      } catch (error) {
        // Track failed login attempts for rate limiting
        if (isLogin && email) {
          var rlKeyFail = "iris-rl-" + btoa(email).replace(/[^a-z0-9]/gi, "");
          var rlFail = {};
          try { rlFail = JSON.parse(sessionStorage.getItem(rlKeyFail) || "{}"); } catch(e) {}
          if (!rlFail.first || Date.now() - rlFail.first > 15 * 60 * 1000) {
            rlFail = { count: 0, first: Date.now() };
          }
          rlFail.count = (rlFail.count || 0) + 1;
          sessionStorage.setItem(rlKeyFail, JSON.stringify(rlFail));
        }
        setInlineStatus(
          status,
          getReadableAuthErrorMessage(error, "Autenticazione non disponibile.", "Authentication is currently unavailable."),
          true
        );
        return;
      }
    }

    // Supabase auth is required — no local fallback allowed
    setInlineStatus(
      status,
      langText(
        "Servizio di autenticazione non disponibile. Riprova tra qualche minuto.",
        "Authentication service is currently unavailable. Please try again in a few minutes."
      ),
      true
    );
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

  function finalizeAuthSuccess(returnView) {
    const nextView = returnView || state.authReturnView;
    closeAuthModal();
    if (state.pendingAction) {
      flushPendingAction();
      return;
    }
    if (nextView === "sell") {
      showPage("sell");
      return;
    }
    showPage("buy");
    showBuyView(nextView || "profile");
  }

  async function logout() {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (error) {
        console.warn("[IRIS] Supabase sign out failed", error);
      }
    }
    clearAuthenticatedUser();
    syncTopnavChrome();
    showToast(t("logout_success"));
  }

  function cleanupNavbar() {
    var el;
    el = qs("#tnAboutBtn"); if (el) el.style.display = "none";
    el = qs("#opsBtn"); if (el) el.style.display = "none";
    el = qs(".mode-toggle"); if (el) el.style.display = "none";
    var prof = qs("#tnProfileTrigger") || qs(".tn-profile");
    if (prof) {
      if (prof.id === "tnProfileTrigger") {
        var userInitials = '';
        if (state.currentUser && state.currentUser.name) {
          var nameParts = state.currentUser.name.trim().split(/\s+/);
          userInitials = (nameParts[0].charAt(0) + (nameParts.length > 1 ? nameParts[nameParts.length-1].charAt(0) : '')).toUpperCase();
        }
        prof.innerHTML = '<span class="tn-avatar-dot">' + userInitials + '</span>';
        prof.classList.add("tn-avatar");
        prof.style.fontSize = '';
      } else {
        prof.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 14.5c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>';
        prof.style.fontSize = '0';
      }
    }
    var lg = qs("#langToggle") || qs(".lang-toggle") || qs("select#langToggle");
    if (lg) lg.style.display = "none";
  }

  function syncHeaderActionVisibility() {
    const topnav = qs("#topnav");
    const isAuthenticated = !!state.currentUser;
    const headerAuthButton = qs("#tnHeaderAuthBtn");
    const menuAuthButton = qs("#tnMenuAuthBtn");
    const supportButton = qs("#tnSupportBtn");
    const localeButton = qs("#tnLocaleTrigger");
    const favoritesButton = qs("#tnFavBtn");
    const cartButton = qs("#cartBtn");
    const notifWrap = qs(".tn-links .notif-wrap");
    const chatButton = qs(".tn-links .tn-chat");
    const profileButton = qs("#tnProfileTrigger");
    const sellButton = qs("#tnSellBtn") || qs(".tn-links .tn-sell");

    if (topnav) {
      topnav.classList.toggle("irisx-auth-user", isAuthenticated);
      topnav.classList.toggle("irisx-auth-guest", !isAuthenticated);
    }

    if (headerAuthButton) {
      headerAuthButton.textContent = t("login");
      headerAuthButton.setAttribute("aria-label", t("login"));
      headerAuthButton.onclick = handleAuthButtonClick;
      headerAuthButton.style.display = isAuthenticated ? "none" : "";
    }

    if (menuAuthButton) {
      menuAuthButton.textContent = isAuthenticated ? t("logout") : t("login");
      menuAuthButton.setAttribute("aria-label", isAuthenticated ? t("logout") : t("login"));
      menuAuthButton.onclick = handleAuthButtonClick;
    }

    if (supportButton) {
      supportButton.style.display = "none";
    }
    if (localeButton) {
      localeButton.style.display = "";
    }
    if (favoritesButton) {
      favoritesButton.style.display = "";
    }
    if (cartButton) {
      cartButton.style.display = "";
    }
    if (notifWrap) {
      notifWrap.style.display = "none";
    }
    if (chatButton) {
      chatButton.style.display = isAuthenticated ? "" : "none";
    }
    if (profileButton) {
      profileButton.style.display = isAuthenticated ? "" : "none";
    }
    if (sellButton) {
      sellButton.style.display = "";
    }
  }

  function syncSessionUi() {
    const opsButton = qs("#opsBtn");
    if (opsButton) {
      opsButton.style.display = isCurrentUserAdmin() ? "" : "none";
    }

    const profileButton = qs("#tnProfileTrigger") || qs(".tn-profile") || qs(".tn-btn[data-nav-view=\"profile\"]") || qs(".tn-btn[onclick*=\"profile\"]");
    if (profileButton) {
      profileButton.setAttribute("aria-label", t("profile_nav"));
    }

    cleanupNavbar();
    syncHeaderActionVisibility();
    updateSearchSaveButton();
    if (state.currentUser && isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      refreshChatModerationState();
    } else {
      resetChatModerationState();
    }
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
    if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      syncCartToSupabase().catch(function (error) {
        console.warn("[IRIS] Unable to sync cart to Supabase", error);
      });
    }
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
    syncDialogFocus("irisxCartDrawer", true, [".irisx-primary", ".irisx-secondary", ".irisx-close"]);
  }

  function closeCart() {
    qs("#irisxCartDrawer").classList.remove("open");
    syncDialogFocus("irisxCartDrawer", false);
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
      "<div class=\"irisx-drawer-backdrop\"></div><div class=\"irisx-drawer-panel\"><div class=\"irisx-drawer-head\"><div><div class=\"irisx-title\">" +
      t("cart") +
      "</div><div class=\"irisx-subtitle\">" +
      items.length +
      " " +
      t("cart_items") +
      "</div></div><button class=\"irisx-close irisx-cart-close\" onclick=\"closeCart()\" aria-label=\"" + escapeHtml(langText("Chiudi", "Close")) + "\"><span aria-hidden=\"true\">&times;</span></button></div><div class=\"irisx-drawer-body\">" +
      itemsHtml +
      "</div><div class=\"irisx-drawer-foot\">" +
      footerHtml +
      "</div></div>";
    syncDialogFocus("irisxCartDrawer", drawer.classList.contains("open"), [".irisx-primary", ".irisx-secondary", ".irisx-close"]);
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
    syncDialogFocus("irisxCheckoutModal", true, ["#checkoutName", "#checkoutShippingMethod", ".irisx-primary", ".irisx-close"]);
  }

  function closeCheckout() {
    qs("#irisxCheckoutModal").classList.remove("open");
    state.checkoutSubmitting = false;
    syncDialogFocus("irisxCheckoutModal", false);
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
          src: imageData.src,
          width: imageData.width,
          height: imageData.height,
          aspectRatio: imageData.aspectRatio,
          fitHint: imageData.fitHint
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

  async function publishListing() {
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

    // Duplicate listing detection (skip when editing an existing listing)
    if (!state.editingListingId) {
      const ownerEmail = normalizeEmail(state.currentUser.email);
      const normalize = function (str) { return String(str || "").toLowerCase().trim(); };
      const duplicate = state.listings.find(function (listing) {
        if (normalizeEmail(listing.ownerEmail) !== ownerEmail) return false;
        if (listing.inventoryStatus === "sold") return false;
        if (listing.listingStatus === "archived") return false;
        return normalize(listing.brand) === normalize(brand) && normalize(listing.name) === normalize(name);
      });
      if (duplicate && !state._duplicateListingConfirmed) {
        state._duplicateListingConfirmed = true;
        updateSellStatus(langText(
          "Hai gi\u00e0 un annuncio attivo per " + brand + " \u201c" + name + "\u201d. Pubblica di nuovo solo se vuoi un secondo articolo.",
          "You already have an active listing for " + brand + " \u201c" + name + "\u201d. Publish again only if this is a separate item."
        ), true);
        return;
      }
      state._duplicateListingConfirmed = false;
    }

    const existingListing = state.editingListingId
      ? state.listings.find(function (listing) { return String(listing.id) === String(state.editingListingId); }) ||
        prods.find(function (listing) { return String(listing.id) === String(state.editingListingId); })
      : null;
    const listingId = existingListing ? existingListing.id : Date.now();
    let sellPhotosForSave = state.sellPhotos.slice();
    if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      try {
        updateSellStatus(langText("Caricamento foto su IRIS Storage in corso...", "Uploading photos to IRIS Storage..."));
        sellPhotosForSave = await uploadListingPhotosToSupabase(sellPhotosForSave, listingId);
        state.sellPhotos = sellPhotosForSave;
        renderSellPhotoPreview();
      } catch (error) {
        console.warn("[IRIS] Unable to upload listing photos to Supabase Storage", error);
        updateSellStatus(langText("Foto caricate solo in locale. Storage non disponibile.", "Photos saved locally only. Storage is unavailable."), true);
      }
    }

    const listingPayload = {
      id: listingId,
      ownerId: state.currentUser.id || null,
      ownerEmail: state.currentUser.email,
      name: name,
      brand: brand,
      cat: taxonomy.categoryLabel,
      categoryKey: taxonomy.categoryKey,
      subcategory: taxonomy.subcategoryLabel,
      subcategoryKey: taxonomy.subcategoryKey,
      productType: taxonomy.typeLabel,
      productTypeKey: taxonomy.typeKey,
      sz: taxonomy.sizeValue,
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
      images: sellPhotosForSave.map(function (photo) { return photo.publicUrl || photo.src; }),
      imageMeta: sellPhotosForSave.map(function (photo) {
        return {
          aspectRatio: Number(photo.aspectRatio || 1),
          width: Number(photo.width || 0),
          height: Number(photo.height || 0),
          fitHint: photo.fitHint || "standard"
        };
      }),
      isUserListing: true,
      inventoryStatus: existingListing && existingListing.inventoryStatus === "sold" ? "sold" : "active",
      listingStatus: "published",
      orderId: existingListing ? existingListing.orderId || null : null,
      soldAt: existingListing ? existingListing.soldAt || null : null,
      offersEnabled: offerPolicy.offersEnabled,
      minimumOfferAmount: offerValidation.minimumOfferAmount
    };

    let listing = syncListingIntoCatalog(listingPayload);
    try {
      const remoteListing = await saveListingToSupabase(listingPayload);
      listing = syncListingIntoCatalog(Object.assign({}, remoteListing, {
        imageMeta: listingPayload.imageMeta || []
      }));
    } catch (error) {
      console.warn("[IRIS] Unable to persist published listing to Supabase", error);
      updateSellStatus(langText("Annuncio salvato solo in locale. Controlla Supabase e riprova.", "Listing saved locally only. Check Supabase and try again."), true);
    }

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
    state._duplicateListingConfirmed = false;
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
          resolve({
            src: originalDataUrl,
            width: 0,
            height: 0,
            aspectRatio: 1,
            fitHint: "standard"
          });
        };
        image.onload = function () {
          const cropBounds = detectSmartCropBounds(image) || {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height
          };
          const optimized = renderOptimizedImageData(image, cropBounds, maxSize, quality);
          if (optimized) {
            resolve(optimized);
            return;
          }
          resolve({
            src: originalDataUrl,
            width: image.width,
            height: image.height,
            aspectRatio: image.width / Math.max(image.height, 1),
            fitHint: image.width / Math.max(image.height, 1) < 0.85 ? "portrait-phone" : image.width / Math.max(image.height, 1) > 1.2 ? "landscape" : "standard"
          });
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
    state.chatModeration = normalizeChatModerationState(state.chatModeration);
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
      return Object.assign({}, user, nextUser);
    });
    if (!found) {
      state.users.push(Object.assign({}, previous || {}, nextUser));
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
    upsertSupabaseProfile(state.currentUser).catch(function (error) {
      console.warn("[IRIS] Unable to sync profile patch to Supabase", error);
    });
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
    if (chatProduct && !qs("#irisxChatActionBar")) {
      chatProduct.insertAdjacentHTML("afterend", "<div class=\"irisx-chat-action-bar\" id=\"irisxChatActionBar\"></div><div class=\"irisx-chat-offer-zone\" id=\"irisxChatOfferZone\"></div>");
    }
    const inputWrap = qs(".cm-input");
    if (inputWrap && !qs("#irisxChatComposerNote")) {
      inputWrap.insertAdjacentHTML("beforeend", "<div class=\"irisx-chat-composer-note\" id=\"irisxChatComposerNote\"></div>");
    }
  }

  function getChatConversationById(conversationId) {
    const match = chats.find(function (thread) {
      return String(thread.id) === String(conversationId || "");
    });
    return match ? normalizeChatThread(match) : null;
  }

  function getOffersForConversation(conversation) {
    if (!conversation) {
      return [];
    }
    const listingId = String(conversation.listingId || conversation.productId || (conversation.product && conversation.product.id) || "");
    const sellerEmail = normalizeEmail(conversation.sellerEmail || (conversation.seller && conversation.seller.email) || "");
    const buyerEmail = normalizeEmail(conversation.buyerEmail || (conversation.buyer && conversation.buyer.email) || "");
    return state.offers
      .map(normalizeOfferRecord)
      .filter(function (offer) {
        return String(offer.listingId || offer.productId || "") === listingId &&
          normalizeEmail(offer.sellerEmail) === sellerEmail &&
          normalizeEmail(offer.buyerEmail) === buyerEmail;
      })
      .sort(function (left, right) {
        return Number(right.updatedAt || right.createdAt || 0) - Number(left.updatedAt || left.createdAt || 0);
      });
  }

  function getCurrentOfferForConversation(conversation) {
    const offers = getOffersForConversation(conversation);
    return offers[0] || null;
  }

  function getChatReportOptions() {
    return [
      { id: "suspicious_behavior", it: "Comportamento sospetto", en: "Suspicious behaviour", severity: "support" },
      { id: "off_platform_request", it: "Richiesta di pagamento esterno", en: "Off-platform payment request", severity: "dispute" },
      { id: "abusive_language", it: "Linguaggio offensivo", en: "Abusive language", severity: "support" },
      { id: "counterfeit_request", it: "Dubbi su autenticita o merce", en: "Authenticity or counterfeit concern", severity: "dispute" },
      { id: "chat_other", it: "Altro nella conversazione", en: "Other conversation issue", severity: "support" }
    ];
  }

  function getChatReportLabel(reasonId) {
    const option = getChatReportOptions().find(function (entry) {
      return entry.id === reasonId;
    });
    return option ? langText(option.it, option.en) : langText("Conversazione", "Conversation");
  }

  function renderChatComposerNote() {
    const note = qs("#irisxChatComposerNote");
    const input = qs("#chatInput");
    const sendButton = qs(".cm-send");
    const moderationState = normalizeChatModerationState(state.chatModeration);
    const blocked = moderationState.isSuspended;
    if (sendButton) {
      if (!sendButton.dataset.defaultLabel) {
        sendButton.dataset.defaultLabel = sendButton.textContent || langText("Invia", "Send");
      }
      sendButton.disabled = blocked || state.chatSendPending;
      sendButton.setAttribute("aria-disabled", sendButton.disabled ? "true" : "false");
      sendButton.textContent = state.chatSendPending
        ? langText("Controllo…", "Checking…")
        : (sendButton.dataset.defaultLabel || langText("Invia", "Send"));
    }
    if (input) {
      input.disabled = blocked || state.chatSendPending;
      input.setAttribute("aria-disabled", input.disabled ? "true" : "false");
      input.placeholder = blocked
        ? langText("Chat sospesa dal team sicurezza IRIS", "Chat suspended by IRIS trust & safety")
        : langText("Scrivi un messaggio...", "Write a message...");
    }
    if (!note) {
      return;
    }
    note.classList.toggle("is-blocked", blocked);
    note.textContent = blocked
      ? langText(
        "Chat sospesa: non puoi piu inviare messaggi. Puoi ancora acquistare e vendere su IRIS, ma non puoi piu usare la chat.",
        "Chat suspended: you can no longer send messages. You can still buy and sell on IRIS, but you can no longer use chat."
      )
      : langText(
        "Solo testo, offerte IRIS e segnalazioni assistite. Emoji, contatti esterni, piattaforme esterne e pagamenti esterni vengono bloccati prima dell'invio.",
        "Text only, IRIS offers and assisted reports. Emoji, external contacts, external platforms, and off-platform payments are blocked before sending."
      );
  }

  function getChatThreadAvatarMarkup(thread) {
    const conversation = normalizeChatThread(thread || {});
    const product = conversation.product || getListingById(conversation.listingId || conversation.productId);
    const image = product ? (getListingImageSources(product)[0] || "") : "";
    if (image) {
      return `<img src="${escapeHtml(image)}" alt="${escapeHtml((product.brand || "") + " " + (product.name || ""))}">`;
    }
    return `<span class="cl-av__fallback">${escapeHtml((product && product.emoji) || (conversation.with && conversation.with.avatar) || "👤")}</span>`;
  }

  function getChatProductPreviewMarkup(conversation) {
    const product = conversation && (conversation.product || getListingById(conversation.listingId || conversation.productId));
    if (!product) {
      return "";
    }
    const image = getListingImageSources(product)[0] || "";
    const media = image
      ? `<div class="irisx-chat-product-thumb"><img src="${escapeHtml(image)}" alt="${escapeHtml(product.brand + " " + product.name)}"></div>`
      : `<div class="irisx-chat-product-thumb irisx-chat-product-thumb--fallback">${escapeHtml(product.emoji || "👜")}</div>`;
    return `<button class="irisx-chat-product-card" onclick="showDetail(${inlineJsValue(product.id)})">
      ${media}
      <span class="irisx-chat-product-body">
        <strong>${escapeHtml(product.brand)}</strong>
        <span>${escapeHtml(product.name)}</span>
        <em>${escapeHtml(formatCurrency(product.price || 0))}</em>
        <small class="irisx-chat-role-line"><span class="irisx-chat-role-badge">${escapeHtml(getChatRoleBadgeLabel(conversation))}</span><span>${escapeHtml(getChatRoleContext(conversation))}</span></small>
      </span>
    </button>`;
  }

  function renderChatActionArea(conversation) {
    const actionBar = qs("#irisxChatActionBar");
    const offerZone = qs("#irisxChatOfferZone");
    if (!actionBar || !offerZone) {
      return;
    }
    if (!conversation) {
      actionBar.innerHTML = "";
      offerZone.innerHTML = "";
      return;
    }
    const scope = getChatConversationScope(conversation);
    const product = conversation.product || getListingById(conversation.listingId || conversation.productId);
    const currentOffer = getCurrentOfferForConversation(conversation);
    const canMakeOffer = Boolean(
      product &&
      scope === "buying" &&
      product.offersEnabled !== false &&
      !isCurrentUserListingOwner(product)
    );
    const primaryAction = canMakeOffer
      ? `<button class="irisx-secondary irisx-chat-action-btn irisx-chat-action-btn--primary" onclick="openChatOfferFlow('${escapeHtml(conversation.id)}')">${langText("Fai un'offerta", "Make offer")}</button>`
      : product
        ? `<button class="irisx-secondary irisx-chat-action-btn" onclick="showDetail(${inlineJsValue(product.id)})">${langText("Apri articolo", "Open listing")}</button>`
        : "";
    actionBar.innerHTML = `
      <div class="irisx-chat-action-copy">
        <strong>${escapeHtml(scope === "selling" ? langText("Gestisci buyer e offerta", "Manage buyer and offer") : langText("Parla col seller in modo sicuro", "Chat safely with the seller"))}</strong>
        <span>${escapeHtml(scope === "selling"
          ? langText("Messaggi, offerte ricevute e segnalazioni passano tutte da IRIS.", "Messages, received offers, and reports all stay inside IRIS.")
          : langText("Usa solo messaggi testuali. Offerte e segnalazioni restano tracciate dentro IRIS.", "Use text-only messages. Offers and reports stay tracked inside IRIS."))}</span>
      </div>
      <div class="irisx-chat-action-buttons">
        ${primaryAction}
        <button class="irisx-secondary irisx-chat-action-btn" onclick="openChatReportModal('${escapeHtml(conversation.id)}')">${langText("Segnala a assistenza", "Report to support")}</button>
      </div>
    `;
    if (!currentOffer) {
      offerZone.innerHTML = product && canMakeOffer
        ? `<div class="irisx-chat-offer-card irisx-chat-offer-card--empty">
            <div class="irisx-chat-offer-copy">
              <strong>${escapeHtml(langText("Nessuna offerta inviata ancora", "No offer sent yet"))}</strong>
              <span>${escapeHtml(langText("Se il prezzo non ti convince, puoi inviare un'offerta vincolante direttamente da questa chat.", "If the price does not work for you, you can send a binding offer directly from this chat."))}</span>
            </div>
          </div>`
        : "";
      return;
    }
    const offerStatus = getOfferStatusLabel(currentOffer);
    const authStatus = getOfferAuthorizationLabel(currentOffer);
    const sellerPendingActions = scope === "selling" && currentOffer.status === "pending" && !isOfferExpired(currentOffer)
      ? `<div class="irisx-chat-offer-actions">
          <button class="irisx-primary" onclick="respondToOfferFromChat('${currentOffer.id}','accepted')">${langText("Accetta offerta", "Accept offer")}</button>
          <button class="irisx-secondary" onclick="respondToOfferFromChat('${currentOffer.id}','declined')">${langText("Rifiuta", "Decline")}</button>
        </div>`
      : currentOffer.orderId
        ? `<div class="irisx-chat-offer-actions"><button class="irisx-secondary" onclick="openOrderDetail('${currentOffer.orderId}','${scope === "selling" ? "seller" : "buyer"}')">${langText("Apri ordine", "Open order")}</button></div>`
        : "";
    offerZone.innerHTML = `
      <div class="irisx-chat-offer-card${currentOffer.status === "pending" ? " is-live" : ""}">
        <div class="irisx-chat-offer-head">
          <div>
            <div class="irisx-chat-offer-kicker">${escapeHtml(langText("Offerta collegata alla conversazione", "Offer linked to this conversation"))}</div>
            <strong>${escapeHtml(formatCurrency(currentOffer.offerAmount || currentOffer.amount || 0))}</strong>
          </div>
          <span class="irisx-badge${currentOffer.status === "pending" ? "" : " irisx-badge--soft"}">${escapeHtml(offerStatus)}</span>
        </div>
        <div class="irisx-chat-offer-meta">
          <span>${escapeHtml(langText("Autorizzazione", "Authorization"))}: ${escapeHtml(authStatus)}</span>
          <span>${escapeHtml(langText("Scadenza", "Expiration"))}: ${escapeHtml(formatDateTime(currentOffer.expiresAt))}</span>
        </div>
        <div class="irisx-chat-offer-note">${escapeHtml(getOfferStateCopy(currentOffer, scope === "selling" ? "seller" : "buyer", isOfferExpired(currentOffer)))}</div>
        ${sellerPendingActions}
      </div>
    `;
  }

  function openChatOfferFlow(conversationId) {
    const conversation = getChatConversationById(conversationId);
    const product = conversation && (conversation.product || getListingById(conversation.listingId || conversation.productId));
    if (!conversation || !product) {
      showToast(langText("Articolo collegato alla chat non disponibile.", "Linked listing is not available."));
      return;
    }
    openOffer(product.id);
  }

  async function respondToOfferFromChat(offerId, decision) {
    await respondToOffer(offerId, decision);
    if (qs("#chat-view") && qs("#chat-view").classList.contains("active")) {
      renderChats();
    }
  }

  function openChatReportModal(conversationId) {
    const conversation = getChatConversationById(conversationId);
    if (!conversation) {
      showToast(langText("Conversazione non disponibile.", "Conversation not available."));
      return;
    }
    openOpsModal("chat-report", { conversationId: conversation.id });
  }

  async function submitChatSupportTicket(conversationId) {
    const conversation = getChatConversationById(conversationId);
    if (!conversation || !state.currentUser) {
      return;
    }
    const reasonField = qs("#opsChatReason");
    const messageField = qs("#opsChatMessage");
    const reason = reasonField ? reasonField.value.trim() : "suspicious_behavior";
    const message = messageField ? messageField.value.trim() : "";
    if (!message) {
      showToast(langText("Spiega cosa e successo nella conversazione.", "Explain what happened in the conversation."));
      return;
    }
    const issue = getChatReportOptions().find(function (entry) { return entry.id === reason; }) || getChatReportOptions()[0];
    const product = conversation.product || getListingById(conversation.listingId || conversation.productId) || null;
    const relatedOrder = product ? getRelevantOrderForListing(product) : null;
    const requesterRole = getChatConversationScope(conversation) === "selling" ? "seller" : "buyer";
    const counterparty = requesterRole === "seller" ? conversation.buyer : conversation.seller;
    const ticket = normalizeSupportTicketRecord({
      id: createId("tkt"),
      orderId: relatedOrder ? relatedOrder.id : "",
      orderNumber: relatedOrder ? relatedOrder.number : ("CHAT-" + String(conversation.id).slice(-6)),
      productId: product ? product.id : "",
      productTitle: product ? `${product.brand} ${product.name}` : langText("Conversazione senza articolo", "Conversation without listing"),
      buyerEmail: normalizeEmail(conversation.buyerEmail || (conversation.buyer && conversation.buyer.email) || ""),
      sellerEmail: normalizeEmail(conversation.sellerEmail || (conversation.seller && conversation.seller.email) || ""),
      requesterId: state.currentUser.id || "",
      requesterEmail: normalizeEmail(state.currentUser.email || ""),
      requesterRole: requesterRole,
      severity: issue.severity || "support",
      status: issue.severity === "dispute" ? "in_review" : "open",
      reason: issue.id,
      message: message,
      contextSnapshot: {
        source: "chat",
        conversationId: conversation.id,
        counterpartName: counterparty && counterparty.name ? counterparty.name : "",
        counterpartEmail: counterparty && counterparty.email ? counterparty.email : "",
        listingId: product ? product.id : "",
        listingTitle: product ? `${product.brand} ${product.name}` : "",
        latestMessage: conversation.msgs.length ? conversation.msgs[conversation.msgs.length - 1].text : ""
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    state.supportTickets.unshift(ticket);
    persistSupportTickets();
    try {
      const remoteTicket = await saveSupportTicketToSupabase(ticket);
      state.supportTickets = state.supportTickets.map(function (candidate) {
        return candidate.id === ticket.id ? remoteTicket : candidate;
      });
      persistSupportTickets();
    } catch (error) {
      console.warn("[IRIS] Unable to save chat support ticket to Supabase", error);
    }
    if (relatedOrder) {
      updateOrderRecord(relatedOrder.id, function (currentOrder) {
        currentOrder.supportTicketIds.push(ticket.id);
        appendOrderEvent(currentOrder, "chat_report_opened", langText("Segnalazione chat aperta", "Chat report opened"), {
          ticketId: ticket.id,
          conversationId: conversation.id
        });
        return currentOrder;
      });
    }
    enqueueEmail("support-request", PLATFORM_CONFIG.supportEmail, {
      preview: `${ticket.orderNumber} - ${message}`
    });
    enqueueEmail("issue-reported", ticket.requesterEmail, {
      preview: message
    });
    createNotification({
      audience: "admin",
      kind: "support",
      title: langText("Segnalazione chat", "Chat report"),
      body: `${ticket.productTitle} · ${getChatReportLabel(ticket.reason)}`,
      recipientEmail: PLATFORM_CONFIG.ownerEmail,
      conversationId: conversation.id
    });
    createNotification({
      audience: "user",
      kind: "support",
      title: langText("Segnalazione inviata", "Report sent"),
      body: ticket.productTitle,
      recipientEmail: ticket.requesterEmail,
      conversationId: conversation.id
    });
    recordAuditEvent("chat_report_opened", conversation.id, {
      ticketId: ticket.id,
      reason: ticket.reason
    });
    closeOpsModal();
    renderProfilePanel();
    renderOpsView();
    renderNotifications();
    showToast(langText("Segnalazione inviata al team assistenza.", "Report sent to the support team."));
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
    const count = getChatUnreadCount();
    ["#chat-badge", "#chat-top-badge"].forEach(function (selector) {
      const badge = qs(selector);
      if (!badge) {
        return;
      }
      badge.style.display = count ? "flex" : "none";
      badge.textContent = count;
    });
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
    const changedOffers = [];
    state.offers = state.offers.map(function (offer) {
      const normalized = normalizeOfferRecord(offer);
      if (!isOfferExpired(normalized)) {
        return normalized;
      }
      mutated = true;
      const expiredOffer = Object.assign({}, normalized, {
        status: "expired",
        paymentAuthorizationStatus: "authorization_released",
        updatedAt: Date.now()
      });
      changedOffers.push(expiredOffer);
      return expiredOffer;
    });
    if (mutated) {
      persistOffers();
      if (isSupabaseEnabled() && getCurrentSupabaseUserId() && changedOffers.length) {
        Promise.all(changedOffers.map(function (offer) {
          return saveOfferToSupabase(offer);
        })).catch(function (error) {
          console.warn("[IRIS] Unable to sync expired offers to Supabase", error);
        });
      }
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
            id: "stripe-offer-authorization",
            label: langText("Autorizzazione sicura con Stripe", "Secure authorization with Stripe")
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

  function buildStripeOfferAuthorizationPayload(payload, listing, validatedAmount) {
    return {
      listingId: listing.id,
      listingName: listing.name,
      listingBrand: listing.brand,
      offerAmount: Number(validatedAmount || payload.offerAmount || 0),
      minimumOfferAmount: listing.minimumOfferAmount === null || listing.minimumOfferAmount === undefined ? null : Number(listing.minimumOfferAmount),
      currency: getLocaleConfig().currency,
      locale: getLocaleConfig().locale,
      buyerEmail: normalizeEmail(payload.buyerEmail || (state.currentUser && state.currentUser.email) || ""),
      buyerName: payload.buyerName || (state.currentUser && state.currentUser.name) || "",
      sellerEmail: normalizeEmail(payload.sellerEmail || listing.ownerEmail || (listing.seller && listing.seller.email) || ""),
      sellerName: payload.sellerName || (listing.seller && listing.seller.name) || "",
      shippingSnapshot: payload.shippingSnapshot || null,
      paymentMethodSnapshot: payload.paymentMethodSnapshot || null,
      returnUrl: buildAppReturnUrl({})
    };
  }

  function mergeOfferDecisionResponse(result) {
    if (!result || typeof result !== "object") {
      return;
    }

    if (result.offer) {
      const nextOffer = buildOfferFromSupabaseRow(result.offer) || normalizeOfferRecord(result.offer);
      state.offers = state.offers.map(function (offer) {
        return offer.id === nextOffer.id ? nextOffer : offer;
      });
      if (!state.offers.some(function (offer) { return offer.id === nextOffer.id; })) {
        state.offers.unshift(nextOffer);
      }
    }

    if (Array.isArray(result.releasedOffers) && result.releasedOffers.length) {
      const releasedMap = {};
      result.releasedOffers.forEach(function (row) {
        const released = buildOfferFromSupabaseRow(row) || normalizeOfferRecord(row);
        releasedMap[released.id] = released;
      });
      state.offers = state.offers.map(function (offer) {
        return releasedMap[offer.id] || offer;
      });
    }

    if (result.order) {
      const nextOrder = buildOrderFromSupabaseRow(result.order) || normalizeOrderRecord(result.order);
      state.orders = state.orders.filter(function (order) { return order.id !== nextOrder.id; });
      state.orders.unshift(nextOrder);
      state.activeOrderId = nextOrder.id;
    }

    if (result.listing) {
      const nextListing = buildListingFromSupabaseRow(result.listing) || normalizeListingRecord(result.listing);
      state.listings = state.listings.map(function (listing) {
        return String(listing.id) === String(nextListing.id) ? nextListing : listing;
      });
      prods = prods.map(function (listing) {
        return String(listing.id) === String(nextListing.id) ? nextListing : listing;
      });
    }

    persistOffers();
    persistOrders();
    persistListings();
    syncInventoryFromOrders();
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
      buyerId: offer.buyerId,
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
    const releasedOffers = [];
    state.offers = state.offers.map(function (offer) {
      if (String(offer.listingId || offer.productId) !== String(listingId) || offer.id === acceptedOfferId || offer.status !== "pending") {
        return offer;
      }
      const releasedOffer = Object.assign({}, offer, {
        status: "declined",
        paymentAuthorizationStatus: "authorization_released",
        updatedAt: Date.now()
      });
      releasedOffers.push(releasedOffer);
      return releasedOffer;
    });
    persistOffers();
    return releasedOffers;
  }

  async function offerApiCreate(payload) {
    const validation = validateOfferSubmission(payload);
    if (!validation.ok) {
      return validation;
    }
    if (canUseBackendPayments()) {
      try {
        const result = await invokeSupabaseFunction("create-offer-authorization", buildStripeOfferAuthorizationPayload(payload, validation.listing, validation.amount));
        if (!result || !result.checkoutUrl) {
          throw new Error(langText("Checkout offerta non disponibile.", "Offer checkout unavailable."));
        }
        return {
          ok: true,
          redirect: true,
          checkoutUrl: result.checkoutUrl,
          offerId: result.offerId || ""
        };
      } catch (error) {
        console.error("[IRIS] Unable to create Stripe offer authorization", error);
        return {
          ok: false,
          error: error && error.message ? error.message : langText("Impossibile aprire l'autorizzazione Stripe.", "Unable to open Stripe authorization."),
          code: "stripe_offer_checkout_failed"
        };
      }
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
    try {
      const remoteOffer = await saveOfferToSupabase(offer);
      state.offers = state.offers.map(function (candidate) {
        return candidate.id === offer.id ? remoteOffer : candidate;
      });
      persistOffers();
      offer = remoteOffer;
    } catch (error) {
      console.warn("[IRIS] Unable to save offer to Supabase", error);
    }
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

  async function offerApiRespond(offerId, decision) {
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

    if (canUseBackendPayments() && current.paymentIntentReference) {
      try {
        const response = await invokeSupabaseFunction("respond-to-offer", {
          offerId: offerId,
          decision: decision
        });
        mergeOfferDecisionResponse(response);
        renderNotifications();
        renderProfilePanel();
        renderOpsView();
        return {
          ok: true,
          offer: response && response.offer ? (buildOfferFromSupabaseRow(response.offer) || normalizeOfferRecord(response.offer)) : current,
          order: response && response.order ? (buildOrderFromSupabaseRow(response.order) || normalizeOrderRecord(response.order)) : null
        };
      } catch (error) {
        console.error("[IRIS] Unable to respond to offer via Stripe backend", error);
        return {
          ok: false,
          error: error && error.message ? error.message : langText("Impossibile aggiornare l'offerta.", "Unable to update the offer.")
        };
      }
    }

    if (decision === "declined") {
      const released = releaseOfferAuthorization(current, "declined");
      let declinedOffer = null;
      state.offers = state.offers.map(function (offer) {
        if (offer.id !== offerId) return offer;
        declinedOffer = Object.assign({}, offer, {
          status: "declined",
          paymentAuthorizationStatus: released.paymentAuthorizationStatus,
          releasedAt: released.releasedAt,
          reason: released.reason,
          updatedAt: Date.now()
        });
        return declinedOffer;
      });
      persistOffers();
      if (declinedOffer) {
        try {
          const remoteDeclinedOffer = await saveOfferToSupabase(declinedOffer);
          state.offers = state.offers.map(function (offer) {
            return offer.id === offerId ? remoteDeclinedOffer : offer;
          });
          persistOffers();
        } catch (error) {
          console.warn("[IRIS] Unable to sync declined offer to Supabase", error);
        }
      }
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
      capturedAt: capture.capturedAt,
      updatedAt: Date.now()
    }));
    const order = createOrderFromAcceptedOffer(paidOffer);
    if (!order) {
      return { ok: false, error: langText("Impossibile generare l'ordine dall'offerta.", "Unable to generate the order from this offer.") };
    }

    state.orders.unshift(order);
    notifyNewOrder(order);
    persistOrders();
    try {
      const remoteOrder = await saveOrderToSupabase(order);
      state.orders = state.orders.map(function (candidate) {
        return candidate.id === order.id ? remoteOrder : candidate;
      });
      persistOrders();
    } catch (error) {
      console.warn("[IRIS] Unable to save accepted-offer order to Supabase", error);
    }
    const releasedOffers = releaseCompetingOffers(order.items[0].productId, offerId);
    state.offers = state.offers.map(function (offer) {
      if (offer.id !== offerId) return offer;
      return Object.assign({}, paidOffer, { orderId: order.id });
    });
    persistOffers();
    const acceptedOffer = state.offers.find(function (offer) { return offer.id === offerId; }) || Object.assign({}, paidOffer, { orderId: order.id });
    try {
      await Promise.all([acceptedOffer].concat(releasedOffers).map(function (offer) {
        return saveOfferToSupabase(offer);
      }));
    } catch (error) {
      console.warn("[IRIS] Unable to sync offer response to Supabase", error);
    }
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
    return source.find(function (order) {
      return String(order.id) === String(state.activeOrderId);
    }) || source[0];
  }

  function getOrderLifecycleActions(order, scope, surface) {
    const actions = [];
    const inModal = surface === "modal";
    if (!order) {
      return actions;
    }
    if (scope === "buyer") {
      actions.push(`<button class="irisx-secondary" onclick="${inModal ? "setOrderModalTab('detail')" : "openOrderDetail('" + order.id + "','buyer')"}">${langText("Dettaglio", "Detail")}</button>`);
      actions.push(`<button class="irisx-secondary" onclick="${inModal ? "setOrderModalTab('tracking')" : "setBuyerSection('tracking','" + order.id + "')"}">${langText("Tracking", "Tracking")}</button>`);
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
      actions.push(`<button class="irisx-secondary" onclick="${inModal ? "setOrderModalTab('detail')" : "openOrderDetail('" + order.id + "','seller')"}">${langText("Dettaglio", "Detail")}</button>`);
      actions.push(`<button class="irisx-secondary" onclick="${inModal ? "setOrderModalTab('tracking')" : "openOrderDetail('" + order.id + "','seller')"}">${langText("Tracking", "Tracking")}</button>`);
      if (order.status === "paid") {
        actions.push(`<button class="irisx-secondary" onclick="prepareOrderShipment('${order.id}')">${langText("Pronto da spedire", "Ready to ship")}</button>`);
      }
      if (order.status === "awaiting_shipment") {
        actions.push(`<button class="irisx-secondary" onclick="generateShippingLabel('${order.id}')">${langText("Genera label", "Generate label")}</button>`);
        actions.push(`<button class="irisx-primary" onclick="openShipmentModal('${order.id}')">${langText("Inserisci tracking", "Add tracking")}</button>`);
      }
      return actions;
    }
    actions.push(`<button class="irisx-secondary" onclick="${inModal ? "setOrderModalTab('detail')" : "openOrderDetail('" + order.id + "','admin')"}">${langText("Dettaglio", "Detail")}</button>`);
    actions.push(`<button class="irisx-secondary" onclick="${inModal ? "setOrderModalTab('tracking')" : "openOrderDetail('" + order.id + "','admin')"}">${langText("Tracking", "Tracking")}</button>`);
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
      startRelistFromOrderItemInternal(orderId, productId).catch(function (error) {
        console.warn("[IRIS] Unable to create assisted relist draft", error);
        showToast(langText("Impossibile creare la rivendita ora.", "Unable to create the resale right now."));
      });
    });
  }

  async function startRelistFromOrderItemInternal(orderId, productId) {
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
      const relistDraftPayload = {
        id: createId("relist"),
        ownerId: user.id || null,
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
      };
      let relistDraft = syncListingIntoCatalog(relistDraftPayload);
      try {
        const remoteRelistDraft = await saveListingToSupabase(relistDraftPayload);
        relistDraft = syncListingIntoCatalog(remoteRelistDraft);
      } catch (error) {
        console.warn("[IRIS] Unable to persist assisted relist draft to Supabase", error);
      }

      recordAuditEvent("relist_draft_created", `${relistDraft.brand} ${relistDraft.name}`, {
        orderId: order.id,
        sourceProductId: item.productId,
        ownerEmail: user.email
      });

      closeOrderDetail();
      loadDraftIntoSellForm(relistDraft.id);
      updateSellStatus(langText("Bozza di rivendita pronta. Aggiorna condizione, foto e prezzo prima di pubblicare.", "Resale draft ready. Update condition, photos, and price before publishing."));
      showToast(langText("Rivendita precompilata creata da acquisto IRIS.", "Prefilled resale draft created from your IRIS purchase."));
  }

  function getOrderBuyerContact(order) {
    if (!order) {
      return null;
    }
    const buyerUser = getUserByEmail(order.buyerEmail);
    return {
      role: langText("Buyer", "Buyer"),
      name: order.buyerName || (buyerUser && buyerUser.name) || langText("Cliente IRIS", "IRIS customer"),
      email: normalizeEmail(order.buyerEmail || (buyerUser && buyerUser.email) || ""),
      phone: normalizePhoneNumber((order.shipping && order.shipping.phone) || (buyerUser && buyerUser.phone) || ""),
      emailVerified: Boolean(buyerUser && buyerUser.verification && buyerUser.verification.emailVerified),
      phoneVerified: Boolean(buyerUser && buyerUser.verification && buyerUser.verification.phoneVerified)
    };
  }

  function getOrderSellerContacts(order) {
    if (!order) {
      return [];
    }
    const seen = {};
    return (order.items || []).map(function (item) {
      const sellerEmail = normalizeEmail(item.sellerEmail || "");
      if (!sellerEmail || seen[sellerEmail]) {
        return null;
      }
      seen[sellerEmail] = true;
      const sellerUser = getUserByEmail(sellerEmail);
      return {
        role: langText("Seller", "Seller"),
        name: item.sellerName || (sellerUser && sellerUser.name) || langText("Venditore IRIS", "IRIS seller"),
        email: sellerEmail,
        phone: normalizePhoneNumber((item && item.sellerPhone) || (sellerUser && sellerUser.phone) || ""),
        emailVerified: Boolean(sellerUser && sellerUser.verification && sellerUser.verification.emailVerified),
        phoneVerified: Boolean(sellerUser && sellerUser.verification && sellerUser.verification.phoneVerified)
      };
    }).filter(Boolean);
  }

  function renderOrderContactPanel(order, scope) {
    if (!order) {
      return "";
    }
    const cards = [];
    const buyerContact = getOrderBuyerContact(order);
    const sellerContacts = getOrderSellerContacts(order);
    if (scope === "seller") {
      if (buyerContact) {
        cards.push(buyerContact);
      }
    } else if (scope === "buyer") {
      sellerContacts.forEach(function (contact) { cards.push(contact); });
    } else {
      if (buyerContact) {
        cards.push(buyerContact);
      }
      sellerContacts.forEach(function (contact) { cards.push(contact); });
    }
    if (!cards.length) {
      return "";
    }
    return `<div class="irisx-order-panel irisx-order-panel--contacts">
      <div class="irisx-order-panel-title">${langText("Contatti ordine", "Order contacts")}</div>
      <div class="irisx-order-contact-grid">${cards.map(function (contact) {
        const verification = [
          contact.emailVerified ? langText("email verificata", "email verified") : langText("email pending", "email pending"),
          contact.phoneVerified ? langText("telefono verificato", "phone verified") : langText("telefono da verificare", "phone pending")
        ].join(" · ");
        return `<div class="irisx-order-contact-card">
          <span class="irisx-order-contact-role">${escapeHtml(contact.role)}</span>
          <strong>${escapeHtml(contact.name)}</strong>
          <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email || "—")}</a>
          <a href="${contact.phone ? "tel:" + escapeHtml(contact.phone) : "#"}"${contact.phone ? "" : " tabindex=\"-1\" aria-disabled=\"true\""}>${escapeHtml(contact.phone || langText("Telefono non disponibile", "Phone not available"))}</a>
          <em>${escapeHtml(verification)}</em>
        </div>`;
      }).join("")}</div>
    </div>`;
  }

  function renderOrderSummaryCard(order, scope, surface) {
    if (!order) {
      return `<div class="irisx-empty-state">${langText("Nessun ordine selezionato.", "No order selected.")}</div>`;
    }
    const actions = getOrderLifecycleActions(order, scope, surface).join("");
    const supportRole = scope === "seller" ? "seller" : scope === "admin" ? "admin" : "buyer";
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
            <div>${langText("Telefono", "Phone")}: ${escapeHtml(order.shipping.phone || langText("Da profilo buyer", "From buyer profile"))}</div>
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
      ${renderOrderContactPanel(order, scope)}
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

  function renderOrderTrackingPanel(order, scope, surface) {
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
      <div class="irisx-actions">${getOrderLifecycleActions(order, scope || "buyer", surface).join("")}</div>
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

  async function respondToOffer(offerId, decision) {
    const normalizedDecision = decision === "rejected" ? "declined" : decision;
    const result = await offerApiRespond(offerId, normalizedDecision);
    if (!result.ok) {
      showToast(result.error);
      renderProfilePanel();
      renderNotifications();
      renderOpsView();
      if (qs("#chat-view") && qs("#chat-view").classList.contains("active")) {
        renderChats();
      }
      return;
    }
    renderProfilePanel();
    renderNotifications();
    renderOpsView();
    if (qs("#chat-view") && qs("#chat-view").classList.contains("active")) {
      renderChats();
    }
    showToast(normalizedDecision === "accepted"
      ? langText("Offerta accettata e pagamento catturato.", "Offer accepted and payment captured.")
      : langText("Offerta rifiutata e autorizzazione rilasciata.", "Offer declined and authorization released."));
  }


  // ─── Nominatim address autocomplete ─────────────────────────────
  var _irisAddrTimer = null;
  function irisAddressAutocomplete(val) {
    clearTimeout(_irisAddrTimer);
    const drop = document.getElementById("irisAddressDrop");
    if (!drop) return;
    if (!val || val.length < 4) { drop.innerHTML = ""; drop.style.display = "none"; return; }
    _irisAddrTimer = setTimeout(function() {
      const url = "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(val) +
        "&format=json&addressdetails=1&limit=6&countrycodes=it,de,fr,es,gb,ch,at,be,nl,us&accept-language=it";
      fetch(url, { headers: { "Accept-Language": "it" } })
        .then(function(r) { return r.json(); })
        .then(function(results) {
          if (!results || !results.length) { drop.innerHTML = ""; drop.style.display = "none"; return; }
          drop.innerHTML = results.map(function(r) {
            const addr = r.address || {};
            const road = [addr.road, addr.house_number].filter(Boolean).join(" ");
            const city = addr.city || addr.town || addr.village || addr.municipality || "";
            const zip = addr.postcode || "";
            const province = addr.county || addr.state_district || addr.state || "";
            const country = addr.country || "";
            const label = [road || r.display_name.split(",")[0], city, zip].filter(Boolean).join(", ");
            return '<div class="irisx-addr-item" onclick="irisAddressSelect(' +
              JSON.stringify(JSON.stringify({road:road||r.display_name.split(",")[0], city:city, zip:zip, province:province, country:country})) +
              ')">' + escapeHtml(label) + '</div>';
          }).join("");
          drop.style.display = "block";
        })
        .catch(function() { drop.innerHTML = ""; drop.style.display = "none"; });
    }, 350);
  }

  function irisAddressSelect(jsonStr) {
    try {
      const d = JSON.parse(jsonStr);
      const lineEl = document.getElementById("accountAddressLine");
      const cityEl = document.getElementById("accountAddressCity");
      const zipEl = document.getElementById("accountAddressZip");
      const provEl = document.getElementById("accountAddressProvince");
      const countryEl = document.getElementById("accountAddressCountry");
      const drop = document.getElementById("irisAddressDrop");
      if (lineEl) lineEl.value = d.road || "";
      if (cityEl) cityEl.value = d.city || "";
      if (zipEl) zipEl.value = d.zip || "";
      if (provEl) provEl.value = d.province || "";
      if (countryEl && d.country) countryEl.value = d.country;
      if (drop) { drop.innerHTML = ""; drop.style.display = "none"; }
    } catch(e) {}
  }
  // ──────────────────────────────────────────────────────────────────

  function saveAddressBook() {
    if (!state.currentUser) {
      return;
    }
    const label = readProfileField("#accountAddressLabel") || langText("Indirizzo", "Address");
    const name = readProfileField("#accountAddressName") || state.currentUser.name || "";
    const address = readProfileField("#accountAddressLine");
    const city = readProfileField("#accountAddressCity");
    const zip = readProfileField("#accountAddressZip") || "";
    const province = readProfileField("#accountAddressProvince") || "";
    const country = readProfileField("#accountAddressCountry") || getWorkspaceDefaultCountry();
    if (!address || !city) {
      showToast(langText("Completa via e città.", "Complete street and city."));
      return;
    }
    if (!zip) {
      showToast(langText("Inserisci il CAP.", "Enter postal code."));
      return;
    }
    const nextAddresses = state.currentUser.addresses.slice();
    nextAddresses.unshift(normalizeAddressRecord({
      id: createId("addr"),
      label: label,
      name: name,
      address: address,
      city: city,
      zip: zip,
      province: province,
      country: country,
      isDefault: nextAddresses.length === 0
    }, state.currentUser));
    syncCurrentUserWorkspace({
      address: address,
      city: city,
      zip: zip,
      province: province,
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
    showToast(langText("I metodi buyer sono gestiti direttamente da Stripe Checkout al momento del pagamento.", "Buyer payment methods are collected directly in Stripe Checkout during payment."));
  }

  function getStripeConnectState(payoutSettings) {
    const settings = payoutSettings || {};
    const nested = settings.stripe_connect || settings.stripeConnect || {};
    return {
      accountId: nested.account_id || nested.accountId || "",
      payoutsEnabled: Boolean(nested.payouts_enabled || nested.payoutsEnabled),
      chargesEnabled: Boolean(nested.charges_enabled || nested.chargesEnabled),
      detailsSubmitted: Boolean(nested.details_submitted || nested.detailsSubmitted),
      country: nested.country || state.currentUser && state.currentUser.country || getWorkspaceDefaultCountry(),
      type: nested.type || "express",
      lastSyncedAt: nested.last_synced_at || nested.lastSyncedAt || null
    };
  }

  function getStripeConnectStatusMeta(payoutSettings) {
    const connect = getStripeConnectState(payoutSettings);
    if (connect.accountId && connect.chargesEnabled && connect.payoutsEnabled && connect.detailsSubmitted) {
      return {
        code: "active",
        label: langText("Stripe attivo", "Stripe active"),
        copy: langText("Account Express completo e payout pronti al rilascio.", "Express account completed and payouts ready for release.")
      };
    }
    if (connect.accountId) {
      return {
        code: "pending",
        label: langText("Onboarding da completare", "Onboarding incomplete"),
        copy: langText("L'account Stripe esiste già, ma devi completare ancora alcuni dati.", "The Stripe account already exists, but some onboarding details are still missing.")
      };
    }
    return {
      code: "setup_required",
      label: langText("Da configurare", "Setup required"),
      copy: langText("Collega Stripe Express per ricevere i payout automatici dei tuoi ordini.", "Connect Stripe Express to receive automatic payouts for your orders.")
    };
  }

  async function refreshStripeConnectStatus(silent) {
    if (!state.currentUser) {
      return null;
    }
    if (!canUseBackendPayments()) {
      if (!silent) {
        showToast(langText("Backend pagamenti non disponibile.", "Payments backend unavailable."));
      }
      return null;
    }
    const result = await invokeSupabaseFunction("create-connect-account", {
      country: (state.currentUser.country || getWorkspaceDefaultCountry() || "IT")
    });
    const rawPayoutSettings = result && result.profile && result.profile.payout_settings
      ? result.profile.payout_settings
      : Object.assign({}, state.currentUser.payoutSettings || {}, {
          stripe_connect: {
            account_id: result && result.account ? result.account.id : "",
            payouts_enabled: Boolean(result && result.account && result.account.payoutsEnabled),
            charges_enabled: Boolean(result && result.account && result.account.chargesEnabled),
            details_submitted: Boolean(result && result.account && result.account.detailsSubmitted),
            country: result && result.account && result.account.country ? result.account.country : (state.currentUser.country || getWorkspaceDefaultCountry()),
            type: result && result.account && result.account.type ? result.account.type : "express",
            last_synced_at: new Date().toISOString()
          }
        });
    const nextPayoutSettings = normalizePayoutSettings(Object.assign({}, rawPayoutSettings, {
      method: "stripe_connect",
      status: getStripeConnectStatusMeta(rawPayoutSettings).code
    }), state.currentUser);
    syncCurrentUserWorkspace({
      payoutSettings: nextPayoutSettings
    });
    return nextPayoutSettings;
  }

  async function openStripeConnectOnboarding(mode) {
    requireAuth(async function () {
      try {
        const result = await invokeSupabaseFunction("create-connect-account-link", {
          mode: mode === "update" ? "update" : "onboarding",
          refreshUrl: buildAppReturnUrl({ connect: "refresh" }),
          returnUrl: buildAppReturnUrl({ connect: "return" })
        });
        if (!result || !result.url) {
          throw new Error(langText("Link Stripe non disponibile.", "Stripe link unavailable."));
        }
        window.location.assign(result.url);
      } catch (error) {
        console.error("[IRIS] Unable to open Stripe Connect onboarding", error);
        showToast(error && error.message ? error.message : langText("Impossibile aprire Stripe Connect.", "Unable to open Stripe Connect."));
      }
    });
  }

  function savePayoutWorkspace() {
    if (!state.currentUser) {
      return;
    }
    const current = normalizePayoutSettings(state.currentUser.payoutSettings || {}, state.currentUser);
    const nextSettings = normalizePayoutSettings({
      method: readProfileField("#payoutMethod") || current.method || "stripe_connect",
      accountHolder: readProfileField("#payoutHolder") || state.currentUser.name,
      iban: readProfileField("#payoutIban"),
      paypalEmail: readProfileField("#payoutPaypal") || state.currentUser.email,
      cadence: readProfileField("#payoutCadence") || current.cadence || langText("Settimanale", "Weekly"),
      status: getStripeConnectStatusMeta(current).code,
      stripe_connect: current.stripe_connect || current.stripeConnect || {},
      stripeConnect: current.stripeConnect || current.stripe_connect || {}
    }, state.currentUser);
    syncCurrentUserWorkspace({ payoutSettings: nextSettings });
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
          searchKey: "",
          alertsEnabled: qs("#savedSearchAlertsToggle") ? qs("#savedSearchAlertsToggle").checked : true
        })
      ])
    });
    renderProfilePanel();
    updateSearchSaveButton();
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
    updateSearchSaveButton();
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
      saveListingDraftInternal().catch(function (error) {
        console.warn("[IRIS] Unable to save listing draft", error);
        updateSellStatus(langText("Impossibile salvare la bozza ora.", "Unable to save the draft right now."), true);
      });
    });
  }

  async function saveListingDraftInternal() {
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
    const draftId = existingListing ? existingListing.id : Date.now();
    let sellPhotosForDraft = state.sellPhotos.slice();
    if (isSupabaseEnabled() && getCurrentSupabaseUserId() && sellPhotosForDraft.length) {
      try {
        updateSellStatus(langText("Caricamento foto bozza in corso...", "Uploading draft photos..."));
        sellPhotosForDraft = await uploadListingPhotosToSupabase(sellPhotosForDraft, draftId);
        state.sellPhotos = sellPhotosForDraft;
        renderSellPhotoPreview();
      } catch (error) {
        console.warn("[IRIS] Unable to upload draft photos to Supabase Storage", error);
        updateSellStatus(langText("Bozza salvata con foto locali.", "Draft saved with local photos."), true);
      }
    }
    const draftPayload = {
      id: draftId,
      ownerId: state.currentUser.id || null,
      ownerEmail: state.currentUser.email,
      name: name,
      brand: brand,
      cat: taxonomy.ok ? taxonomy.categoryLabel : langText("Da definire", "To define"),
      categoryKey: taxonomy.ok ? taxonomy.categoryKey : "",
      subcategory: taxonomy.ok ? taxonomy.subcategoryLabel : "",
      subcategoryKey: taxonomy.ok ? taxonomy.subcategoryKey : "",
      productType: taxonomy.ok ? taxonomy.typeLabel : "",
      productTypeKey: taxonomy.ok ? taxonomy.typeKey : "",
      sz: taxonomy.ok ? taxonomy.sizeValue : "one_size",
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
      images: sellPhotosForDraft.map(function (photo) { return photo.publicUrl || photo.src; }),
      imageMeta: sellPhotosForDraft.map(function (photo) {
        return {
          aspectRatio: Number(photo.aspectRatio || 1),
          width: Number(photo.width || 0),
          height: Number(photo.height || 0),
          fitHint: photo.fitHint || "standard"
        };
      }),
      inventoryStatus: "draft",
      listingStatus: "draft",
      isUserListing: true,
      orderId: existingListing ? existingListing.orderId || null : null,
      soldAt: existingListing ? existingListing.soldAt || null : null,
      offersEnabled: offerPolicy.offersEnabled,
      minimumOfferAmount: offerValidation.minimumOfferAmount
    };
    let draft = syncListingIntoCatalog(draftPayload);
    try {
      const remoteDraft = await saveListingToSupabase(draftPayload);
      draft = syncListingIntoCatalog(Object.assign({}, remoteDraft, {
        imageMeta: draftPayload.imageMeta || []
      }));
    } catch (error) {
      console.warn("[IRIS] Unable to persist draft to Supabase", error);
      updateSellStatus(langText("Bozza salvata solo in locale.", "Draft saved locally only."), true);
    }
    renderProfilePanel();
    renderOpsView();
    updateSellStatus(langText("Bozza salvata nella seller area.", "Draft saved inside seller area."));
    showToast(langText("Bozza salvata.", "Draft saved."));
  }

  async function publishDraftListing(listingId) {
    const currentListing = state.listings.find(function (listing) { return String(listing.id) === String(listingId); });
    if (!canCurrentUserManageListing(currentListing)) {
      showToast(langText("Non puoi pubblicare questo annuncio.", "You cannot publish this listing."));
      return;
    }
    let updatedListing = null;
    state.listings = state.listings.map(function (listing) {
      if (String(listing.id) !== String(listingId)) {
        return listing;
      }
      updatedListing = normalizeListingRecord(Object.assign({}, listing, {
        inventoryStatus: "active",
        listingStatus: "published",
        date: Date.now()
      }));
      return updatedListing;
    });
    saveJson(STORAGE_KEYS.listings, state.listings);
    hydrateLocalListings();
    if (updatedListing) {
      try {
        const remoteListing = await saveListingToSupabase(updatedListing);
        syncListingIntoCatalog(remoteListing);
      } catch (error) {
        console.warn("[IRIS] Unable to publish draft on Supabase", error);
      }
    }
    render();
    renderProfilePanel();
    renderOpsView();
    showToast(langText("Bozza pubblicata.", "Draft published."));
  }

  function loadDraftIntoSellForm(listingId) {
    const listing = state.listings.find(function (candidate) { return String(candidate.id) === String(listingId); });
    if (!listing || !canCurrentUserManageListing(listing)) {
      if (listing) {
        showToast(langText("Non puoi modificare questo annuncio.", "You cannot edit this listing."));
      }
      return;
    }
    showPage("sell");
    const categoryKey = listing.categoryKey || inferSellCategoryKey(listing);
    const subcategoryKey = listing.subcategoryKey || inferSellSubcategoryKey(listing, categoryKey);
    const productTypeKey = listing.productTypeKey || inferSellTypeKey(listing, categoryKey, subcategoryKey);
    const sizeValue = getSellFormSizeValue(listing, categoryKey, subcategoryKey);
    const sizeMode = (listing && listing.sizeSchema) || getResolvedSellSizeMode(categoryKey, subcategoryKey, listing.brand);
    ensureSellTaxonomyUi({
      categoryKey: categoryKey,
      subcategoryKey: subcategoryKey,
      typeKey: productTypeKey,
      brand: listing.brand,
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
      "#sf-size-original": listing.sizeOriginal || ((sizeMode === "belts_cm" || sizeMode === "apparel_numeric_designer") && listing.sz && listing.sz !== sizeValue ? listing.sz : ""),
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
      brand: qs("#sf-brand") ? qs("#sf-brand").value : "",
      size: qs("#sf-size") ? qs("#sf-size").value : "",
      measurements: listing.measurements || {}
    });
    qsa(".cond-btn").forEach(function (button) {
      button.classList.toggle("sel", button.textContent.trim() === listing.cond);
    });
    state.sellPhotos = Array.isArray(listing.images)
      ? listing.images.map(function (src, index) {
          const meta = Array.isArray(listing.imageMeta) ? listing.imageMeta[index] || {} : {};
          return {
            id: createId("photo"),
            name: `draft-${index + 1}`,
            src: src,
            width: Number(meta.width || 0),
            height: Number(meta.height || 0),
            aspectRatio: Number(meta.aspectRatio || 1),
            fitHint: meta.fitHint || "standard"
          };
        })
      : [];
    applyListingOfferPolicyToForm(listing);
    renderSellPhotoPreview();
    updateFee();
    updateSellStatus(langText("Annuncio caricato. Puoi aggiornarlo e ripubblicarlo.", "Listing loaded. You can update and republish it."));
  }

  async function archiveListing(listingId) {
    const currentListing = state.listings.find(function (listing) { return String(listing.id) === String(listingId); });
    if (!canCurrentUserManageListing(currentListing)) {
      showToast(langText("Non puoi archiviare questo annuncio.", "You cannot archive this listing."));
      return;
    }
    let updatedListing = null;
    state.listings = state.listings.map(function (listing) {
      if (String(listing.id) !== String(listingId)) {
        return listing;
      }
      updatedListing = normalizeListingRecord(Object.assign({}, listing, {
        inventoryStatus: "archived",
        listingStatus: "archived"
      }));
      return updatedListing;
    });
    saveJson(STORAGE_KEYS.listings, state.listings);
    hydrateLocalListings();
    if (updatedListing) {
      try {
        const remoteListing = await saveListingToSupabase(updatedListing);
        syncListingIntoCatalog(remoteListing);
      } catch (error) {
        console.warn("[IRIS] Unable to archive listing on Supabase", error);
      }
    }
    render();
    renderProfilePanel();
  }

  async function toggleListingOffers(listingId) {
    const currentListing = state.listings.find(function (listing) { return String(listing.id) === String(listingId); });
    if (!canCurrentUserManageListing(currentListing)) {
      showToast(langText("Non puoi aggiornare questo annuncio.", "You cannot update this listing."));
      return;
    }
    let updatedListing = null;
    state.listings = state.listings.map(function (listing) {
      if (String(listing.id) !== String(listingId)) {
        return listing;
      }
      const nowEnabled = listing.offersEnabled !== false;
      updatedListing = normalizeListingRecord(Object.assign({}, listing, { offersEnabled: !nowEnabled }));
      return updatedListing;
    });
    saveJson(STORAGE_KEYS.listings, state.listings);
    hydrateLocalListings();
    if (updatedListing) {
      try {
        const remoteListing = await saveListingToSupabase(updatedListing);
        syncListingIntoCatalog(remoteListing);
      } catch (error) {
        console.warn("[IRIS] Unable to update listing offer policy on Supabase", error);
      }
    }
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
    if (window.irisActiveSellerId && typeof window.showSeller === "function") {
      window.showSeller(window.irisActiveSellerId);
    }
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
          { id: "help_listings", label: langText("I tuoi annunci", "Listings") },
          { id: "help_verification", label: langText("Verifica identità", "Verification") },
          { id: "help_shipping", label: langText("Spedizione e protezione", "Shipping and Protection") },
          { id: "help_accessibility", label: langText("Accessibilità", "Accessibility Statement") },
          { id: "help_contact", label: langText("Assistenza", "Contact Support") },
          { id: "help_about", label: langText("Chi siamo", "About") },
          { id: "help_sell", label: langText("Vendi", "Sell") }
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
            <div class="irisx-field" style="position:relative">
              <label for="accountAddressLine">${langText("Via e numero civico", "Street and number")}</label>
              <input id="accountAddressLine" type="text" autocomplete="off" placeholder="${langText("Es: Via Pavese 11", "E.g. Via Pavese 11")}" oninput="irisAddressAutocomplete(this.value)">
              <div id="irisAddressDrop" class="irisx-addr-drop"></div>
            </div>
            <div class="irisx-account-row">
              <div class="irisx-field"><label for="accountAddressCity">${langText("Città", "City")}</label><input id="accountAddressCity" type="text" placeholder="Es: Milano"></div>
              <div class="irisx-field"><label for="accountAddressZip">${langText("CAP", "Postal code")}</label><input id="accountAddressZip" type="text" maxlength="10" placeholder="Es: 30172"></div>
            </div>
            <div class="irisx-account-row">
              <div class="irisx-field"><label for="accountAddressProvince">${langText("Provincia", "Province")}</label><input id="accountAddressProvince" type="text" placeholder="${langText("Es: Treviso", "E.g. Treviso")}"></div>
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
      const connectMeta = getStripeConnectStatusMeta(user.payoutSettings);
      const connectState = getStripeConnectState(user.payoutSettings);
      return `<div class="irisx-card-stack">
        <div class="irisx-workspace-card">
          <div class="irisx-section-head"><h3>${langText("Checkout buyer", "Buyer checkout")}</h3><span>${langText("Carte e wallet vengono raccolti in Stripe Checkout nel passaggio finale sicuro.", "Cards and wallets are collected in Stripe Checkout during the final secure step.")}</span></div>
          <div class="irisx-card-stack">
            <div class="irisx-inline-card"><div><strong>${langText("Pagamento protetto", "Protected payment")}</strong><span>${langText("3D Secure, wallet e conferma pagamento gestiti da Stripe.", "3D Secure, wallets, and payment confirmation are handled by Stripe.")}</span></div><span class="irisx-badge">${langText("Stripe", "Stripe")}</span></div>
            <div class="irisx-inline-card"><div><strong>${langText("Offerte con pre-autorizzazione", "Offers with pre-authorization")}</strong><span>${langText("Le offerte bloccano l'importo con manual capture e rilascio automatico se rifiutate o scadute.", "Offers place a manual-capture hold and release it automatically if declined or expired.")}</span></div></div>
          </div>
          <div class="irisx-actions"><button class="irisx-secondary" onclick="addPrototypePaymentMethod()">${langText("Come funziona", "How it works")}</button></div>
        </div>
        <div class="irisx-workspace-card">
          <div class="irisx-section-head"><h3>${langText("Stripe Connect seller", "Seller Stripe Connect")}</h3><span>${langText("Onboarding Express, stato account e payout automatici del seller.", "Express onboarding, account status, and automatic seller payouts.")}</span></div>
          <div class="irisx-card-stack">
            <div class="irisx-inline-card"><div><strong>${escapeHtml(connectMeta.label)}</strong><span>${escapeHtml(connectMeta.copy)}</span></div><span class="irisx-badge">${connectState.accountId ? escapeHtml(connectState.accountId.slice(-8)) : langText("Non collegato", "Not connected")}</span></div>
            <div class="irisx-inline-card"><div><strong>${langText("Payout automatici", "Automatic payouts")}</strong><span>${connectState.payoutsEnabled ? langText("Abilitati dopo consegna o conferma ordine.", "Enabled after delivery or order confirmation.") : langText("Disponibili appena completi onboarding e verifiche Stripe.", "Available as soon as Stripe onboarding and verification are completed.")}</span></div><span class="irisx-badge">${connectState.payoutsEnabled ? langText("Ready", "Ready") : langText("Pending", "Pending")}</span></div>
          </div>
          <div class="irisx-actions">
            <button class="irisx-primary" onclick="openStripeConnectOnboarding('${connectState.accountId ? "update" : "onboarding"}')">${connectState.accountId ? langText("Apri Stripe Connect", "Open Stripe Connect") : langText("Collega Stripe", "Connect Stripe")}</button>
            <button class="irisx-secondary" onclick="refreshStripeConnectStatus()">${langText("Aggiorna stato", "Refresh status")}</button>
          </div>
          <div class="irisx-form-grid">
            <div class="irisx-account-row">
              <div class="irisx-field"><label for="payoutMethod">${langText("Metodo", "Method")}</label><input id="payoutMethod" type="text" value="${escapeHtml(user.payoutSettings.method || "stripe_connect")}"></div>
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
    const order = getAccessibleOrderById(state.activeOrderId, state.activeOrderScope || "any");
    const activeTab = state.activeOrderModalTab === "tracking" ? "tracking" : "detail";
    if (!modal) {
      return;
    }
    if (!order) {
      modal.innerHTML = "";
      return;
    }
    const tabButtons = `<div class="irisx-actions irisx-actions--compact">
        <button class="${activeTab === "detail" ? "irisx-primary" : "irisx-secondary"}" onclick="setOrderModalTab('detail')">${langText("Dettaglio", "Detail")}</button>
        <button class="${activeTab === "tracking" ? "irisx-primary" : "irisx-secondary"}" onclick="setOrderModalTab('tracking')">${langText("Tracking", "Tracking")}</button>
      </div>`;
    const bodyMarkup = activeTab === "tracking"
      ? renderOrderTrackingPanel(order, state.activeOrderScope || "buyer", "modal")
      : renderOrderSummaryCard(order, state.activeOrderScope || "buyer", "modal");
    modal.innerHTML = `<div class="irisx-modal-backdrop"></div><div class="irisx-modal-card irisx-modal-card--wide">
      <div class="irisx-card-head">
        <div>
          <div class="irisx-kicker">${langText("Order lifecycle", "Order lifecycle")}</div>
          <div class="irisx-title">${escapeHtml(order.number)}</div>
          <div class="irisx-subtitle">${escapeHtml(getOrderStatusLabel(order))}</div>
        </div>
        <button class="irisx-close" onclick="closeOrderDetail()">✕</button>
      </div>
      <div class="irisx-card-body">${tabButtons}${bodyMarkup}</div>
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
    renderChatComposerNote();
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
      renderChatActionArea(null);
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
        <div class="cl-av cl-av--product">${getChatThreadAvatarMarkup(thread)}</div>
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
    const hadUnread = Number(conversation.unreadCount || 0) > 0;
    conversation.unreadCount = 0;
    chats[threadIndex] = conversation;
    persistChats();
    if (hadUnread && isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      saveConversationToSupabase(conversation).catch(function (error) {
        console.warn("[IRIS] Unable to sync chat read state to Supabase", error);
      });
    }
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
      preview.innerHTML = getChatProductPreviewMarkup(conversation);
    }
    renderChatActionArea(conversation);
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
    const input = qs("#chatInput");
    if (input && window.innerWidth > 700) {
      input.focus();
    }
    renderChatComposerNote();
    renderNotifications();
  };

  sendChat = async function () {
    if (!curChat) {
      return;
    }
    const input = qs("#chatInput");
    if (!input || !input.value.trim()) {
      showToast(langText("Scrivi un messaggio prima di inviare.", "Write a message before sending."));
      return;
    }
    if (isChatSuspended()) {
      openChatModerationModal("chat_banned");
      renderChatComposerNote();
      return;
    }
    const conversationIndex = chats.findIndex(function (thread) { return thread.id === curChat; });
    if (conversationIndex === -1) {
      return;
    }
    const conversation = normalizeChatThread(chats[conversationIndex]);
    const messageText = input.value.trim();
    state.chatSendPending = true;
    renderChatComposerNote();
    try {
      const moderationApi = await getChatModerationApi();
      const localModeration = moderationApi.moderateChatMessage(messageText, {
        channel: "chat",
        actorRole: getChatConversationScope(conversation) === "selling" ? "seller" : "buyer",
      });
      const serverResponse = await appendChatMessageToSupabase(conversation, messageText);
      if (serverResponse && serverResponse.moderationState) {
        applyChatModerationState(serverResponse.moderationState);
      }
      if (!serverResponse || serverResponse.allowed === false) {
        recordAuditEvent("chat_message_blocked", conversation.id, {
          violationType: serverResponse && serverResponse.moderation && serverResponse.moderation.violationType || localModeration.violationType,
          matchedRules: serverResponse && serverResponse.moderation && serverResponse.moderation.matchedRules || localModeration.matchedRules,
        });
        openChatModerationModal(
          serverResponse && serverResponse.action ? serverResponse.action : (localModeration.shouldBan ? "chat_banned" : "warning_1"),
          {
            fragments: serverResponse && serverResponse.moderation && serverResponse.moderation.matchedFragments || localModeration.matchedFragments,
          }
        );
        return;
      }

      input.value = "";
      try {
        await refreshSupabaseChats();
        openChatById(serverResponse.conversationId || conversation.id);
      } catch (syncError) {
        console.warn("[IRIS] Unable to refresh chat after send", syncError);
        const freshConversation = normalizeChatThread(Object.assign({}, conversation, {
          msgs: (conversation.msgs || []).concat(normalizeChatMessageRecord({
            id: serverResponse.message && serverResponse.message.id ? serverResponse.message.id : createId("msg"),
            from: "me",
            text: messageText,
            time: langText("Ora", "Now"),
            at: serverResponse.message && serverResponse.message.sent_at_ms ? Number(serverResponse.message.sent_at_ms) : Date.now(),
          })),
          updatedAt: serverResponse.message && serverResponse.message.sent_at_ms ? Number(serverResponse.message.sent_at_ms) : Date.now(),
        }));
        const existingIndex = chats.findIndex(function (thread) { return String(thread.id) === String(freshConversation.id); });
        if (existingIndex > -1) {
          chats.splice(existingIndex, 1);
        }
        chats.unshift(freshConversation);
        persistChats();
        openChatById(freshConversation.id);
      }
      recordAuditEvent("chat_message_sent", conversation.id, {
        messageId: serverResponse.message && serverResponse.message.id ? serverResponse.message.id : "",
      });
      if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
        await refreshChatModerationState(true);
      }
    } catch (error) {
      console.warn("[IRIS] Unable to send chat message", error);
      showToast(error && error.message ? error.message : langText("Impossibile inviare il messaggio.", "Unable to send the message."));
      return;
    } finally {
      state.chatSendPending = false;
      renderChatComposerNote();
    }
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
  window.renderChats = renderChats;
  window.openChatById = openChatById;
  window.openChat = openChat;
  window.backToChats = backToChats;
  window.sendChat = sendChat;
  window.closeChatModerationModal = closeChatModerationModal;
  window.__irisModernChatFlow = {
    render: renderChats,
    openById: openChatById,
    open: openChat,
    back: backToChats,
    send: sendChat
  };

  function buildCheckoutDraft() {
    const user = state.currentUser || {};
    const defaultAddress = (user.addresses || []).find(function (address) { return address.isDefault; }) || (user.addresses || [])[0] || {};
    const defaultPayment = (user.paymentMethods || []).find(function (method) { return method.isDefault; }) || (user.paymentMethods || [])[0] || {};
    return normalizeCheckoutDraftState(Object.assign({
      name: defaultAddress.name || user.name || "",
      address: defaultAddress.address || user.address || "",
      city: defaultAddress.city || user.city || "",
      country: defaultAddress.country || user.country || getWorkspaceDefaultCountry(),
      note: "",
      shippingMethod: resolveCheckoutShippingMethod(),
      shippingFee: SHIPPING_COST,
      paymentMethodId: defaultPayment.id || "stripe-checkout",
      paymentLabel: defaultPayment.id ? `${defaultPayment.brand} •••• ${defaultPayment.last4}` : langText("Stripe Checkout protetto", "Protected Stripe Checkout")
    }, state.checkoutDraft || {}));
  }

  function saveCheckoutDraftFromFields() {
    const nextDraft = Object.assign({}, state.checkoutDraft || {}, {
      name: qs("#checkoutName") ? qs("#checkoutName").value.trim() : state.checkoutDraft.name,
      address: qs("#checkoutAddress") ? qs("#checkoutAddress").value.trim() : state.checkoutDraft.address,
      city: qs("#checkoutCity") ? qs("#checkoutCity").value.trim() : state.checkoutDraft.city,
      country: qs("#checkoutCountry") ? qs("#checkoutCountry").value.trim() : state.checkoutDraft.country,
      note: qs("#checkoutNote") ? qs("#checkoutNote").value.trim() : state.checkoutDraft.note,
      shippingMethod: qs("#checkoutShippingMethod") ? qs("#checkoutShippingMethod").value : state.checkoutDraft.shippingMethod,
      paymentLabel: qs("#checkoutPaymentLabel") ? qs("#checkoutPaymentLabel").value.trim() : state.checkoutDraft.paymentLabel
    });
    state.checkoutDraft = normalizeCheckoutDraftState(nextDraft);
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

  function buildCheckoutStripePayload() {
    const draft = buildCheckoutDraft();
    const items = (state.checkoutItems || []).map(function (entry) {
      const product = normalizeListingRecord(entry.product || {});
      const seller = product.seller || {};
      ensureSellerEmail(seller);
      return {
        listingId: product.id,
        quantity: Number(entry.qty || 1),
        unitAmount: Number(product.price || 0),
        brand: product.brand || "",
        name: product.name || "",
        sellerId: product.ownerId || product.sellerId || seller.id || "",
        sellerEmail: normalizeEmail(product.ownerEmail || seller.email || "")
      };
    });
    return {
      source: state.checkoutSource || "cart",
      currency: getLocaleConfig().currency,
      locale: getLocaleConfig().locale,
      items: items,
      shipping: {
        name: draft.name || "",
        address: draft.address || "",
        city: draft.city || "",
        country: draft.country || "",
        phone: normalizePhoneNumber((state.currentUser && state.currentUser.phone) || ""),
        note: draft.note || "",
        method: draft.shippingMethod || langText("Spedizione assicurata", "Insured shipping")
      },
      shippingFee: Number(draft.shippingFee || SHIPPING_COST),
      returnUrl: buildAppReturnUrl({})
    };
  }

  async function beginStripeCheckout() {
    saveCheckoutDraftFromFields();
    if (!state.checkoutDraft.name || !state.checkoutDraft.address || !state.checkoutDraft.city || !state.checkoutDraft.country) {
      showToast(langText("Completa i dati di spedizione prima di continuare.", "Complete your shipping details before continuing."));
      state.checkoutStep = "address";
      renderCheckoutModal();
      return;
    }
    if (!canUseBackendPayments()) {
      showToast(langText("Backend pagamenti non disponibile.", "Payments backend unavailable."));
      return;
    }
    try {
      state.checkoutSubmitting = true;
      renderCheckoutModal();
      const result = await invokeSupabaseFunction("create-checkout-session", buildCheckoutStripePayload());
      if (!result || !result.checkoutUrl) {
        throw new Error(langText("Sessione checkout non disponibile.", "Checkout session unavailable."));
      }
      if (result.orderId) {
        state.activeOrderId = result.orderId;
      }
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      console.error("[IRIS] Unable to start Stripe checkout", error);
      state.checkoutSubmitting = false;
      showToast(error && error.message ? error.message : langText("Impossibile aprire il checkout Stripe.", "Unable to open Stripe checkout."));
      renderCheckoutModal();
    }
  }

  function finalizeCheckout(success) {
    saveCheckoutDraftFromFields();
    state.checkoutSubmitting = false;
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
    if (isSupabaseEnabled() && getCurrentSupabaseUserId()) {
      saveOrderToSupabase(order).then(function (remoteOrder) {
        state.orders = state.orders.map(function (candidate) {
          return candidate.id === order.id ? remoteOrder : candidate;
        });
        persistOrders();
        syncInventoryFromOrders();
        renderProfilePanel();
        renderOpsView();
        renderNotifications();
      }).catch(function (error) {
        console.warn("[IRIS] Unable to save checkout order to Supabase", error);
      });
    }
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
    state.checkoutSubmitting = false;
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
        <div class="irisx-field"><label for="checkoutShippingMethod">${langText("Metodo di spedizione", "Shipping method")}</label><select id="checkoutShippingMethod" onchange="handleCheckoutShippingMethodChange()"><option ${draft.shippingMethod === resolveCheckoutShippingMethod() ? "selected" : ""}>${resolveCheckoutShippingMethod()}</option><option ${draft.shippingMethod === resolveCheckoutShippingMethod("express_insured") ? "selected" : ""}>${resolveCheckoutShippingMethod("express_insured")}</option></select></div>
        <div class="irisx-field"><label for="checkoutShippingFee">${langText("Costo spedizione", "Shipping fee")}</label><input id="checkoutShippingFee" type="number" value="${escapeHtml(String(shippingFee))}" readonly aria-readonly="true"></div>
        <div class="irisx-note">${langText("Seleziona il metodo di spedizione preferito.", "Select your preferred shipping method.")}</div>
      </div>`;
    } else if (state.checkoutStep === "payment") {
      body = `<div class="irisx-card-stack">
        <div class="irisx-inline-card">
          <div>
            <strong>${langText("Checkout Stripe protetto", "Protected Stripe Checkout")}</strong>
            <span>${escapeHtml(langText("Carta, wallet e autenticazione 3D Secure gestiti nel passaggio finale ospitato da Stripe.", "Card, wallet, and 3D Secure authentication are handled in the final Stripe-hosted step."))}</span>
          </div>
        </div>
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
      const highValueNote = total >= 1000
        ? `<div class="irisx-note" style="margin-top:.75rem;border-left:3px solid var(--gold);padding-left:.75rem;">${langText(
            "\u26a0\ufe0f Ordine di alto valore (\u20ac" + total.toFixed(0) + "): verifica l\u2019identit\u00e0 del seller e l\u2019autenticit\u00e0 del prodotto prima di confermare. IRIS applica autenticazione obbligatoria.",
            "\u26a0\ufe0f High-value order (\u20ac" + total.toFixed(0) + "): verify seller identity and product authenticity before confirming. IRIS applies mandatory authentication."
          )}</div>`
        : "";
      body = `<div class="irisx-state-panel">
        <strong>${langText("Conferma ordine", "Order confirmation")}</strong>
        <span>${langText("Rivedi i dettagli e conferma il tuo acquisto.", "Review the details and confirm your purchase.")}</span>
        ${highValueNote}
      </div>`;
    }

    const primaryAction = state.checkoutStatus
      ? ""
      : state.checkoutStep === "confirmation"
        ? `<button class="irisx-primary" ${state.checkoutSubmitting ? "disabled" : ""} onclick="submitCheckout()">${state.checkoutSubmitting ? langText("Reindirizzamento a Stripe...", "Redirecting to Stripe...") : langText("Conferma e paga", "Confirm and pay")}</button>`
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
    syncDialogFocus("irisxCheckoutModal", modal.classList.contains("open"), ["#checkoutName", "#checkoutShippingMethod", ".irisx-primary", ".irisx-close"]);
  };

  submitCheckout = function () {
    if (state.checkoutStep !== "confirmation") {
      nextCheckoutStep();
      return;
    }
    if (canUseBackendPayments()) {
      beginStripeCheckout();
      return;
    }
    finalizeCheckout(true);
  };

  window.handleCheckoutShippingMethodChange = function () {
    state.checkoutDraft = normalizeCheckoutDraftState(Object.assign({}, state.checkoutDraft || {}, {
      shippingMethod: qs("#checkoutShippingMethod") ? qs("#checkoutShippingMethod").value : resolveCheckoutShippingMethod()
    }));
    renderCheckoutModal();
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
    const issue = getIssueOptions().concat(getChatReportOptions()).find(function (option) { return option.id === issueId; });
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
    const opts = options || {};
    const requestedRole = opts.role || "any";
    const order = getAccessibleOrderById(orderId, requestedRole);
    if (!order) {
      return null;
    }
    const currentEmail = normalizeEmail((state.currentUser && state.currentUser.email) || "");
    const role = opts.role || (normalizeEmail(order.buyerEmail) === currentEmail ? "buyer" : getCurrentUserOrderScope(order) || "seller");
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

  async function reportListing(productId) {
    const product = getListingById(productId);
    if (!product) {
      return;
    }
    const seller = buildListingSeller(product);
    const now = Date.now();
    const requesterEmail = normalizeEmail((state.currentUser && state.currentUser.email) || "");
    const ticket = normalizeSupportTicketRecord({
      id: createId("tkt"),
      orderId: "",
      orderNumber: "LIST-" + String(product.id || "").slice(-6).toUpperCase(),
      productId: product.id,
      productTitle: `${product.brand} ${product.name}`.trim(),
      buyerEmail: requesterEmail,
      sellerEmail: normalizeEmail((seller && seller.email) || product.sellerEmail || ""),
      requesterId: (state.currentUser && state.currentUser.id) || "",
      requesterEmail: requesterEmail,
      requesterRole: state.currentUser ? "buyer" : "guest",
      severity: "support",
      status: "open",
      reason: "listing_report",
      message: langText("Segnalazione annuncio dal dettaglio prodotto.", "Listing reported from product detail."),
      contextSnapshot: {
        source: "listing_report",
        listingId: product.id,
        listingTitle: `${product.brand} ${product.name}`.trim(),
        sellerId: seller && seller.id ? seller.id : "",
        sellerName: seller && seller.name ? seller.name : "",
        price: Number(product.price || 0),
        urlPath: window.location ? window.location.pathname : ""
      },
      createdAt: now,
      updatedAt: now
    });
    state.supportTickets.unshift(ticket);
    persistSupportTickets();
    try {
      const remoteTicket = await saveSupportTicketToSupabase(ticket);
      state.supportTickets = state.supportTickets.map(function (candidate) {
        return candidate.id === ticket.id ? remoteTicket : candidate;
      });
      persistSupportTickets();
    } catch (error) {
      console.warn("[IRIS] Unable to save listing report to Supabase", error);
    }
    enqueueEmail("support-request", PLATFORM_CONFIG.supportEmail, {
      preview: `${ticket.orderNumber} - ${ticket.productTitle}`
    });
    createNotification({
      audience: "admin",
      kind: "support",
      title: langText("Segnalazione annuncio", "Listing report"),
      body: `${product.brand} ${product.name}`,
      recipientEmail: PLATFORM_CONFIG.ownerEmail,
      productId: product.id
    });
    recordAuditEvent("listing_report_opened", ticket.productTitle, {
      ticketId: ticket.id,
      listingId: product.id
    });
    showToast(langText("Segnalazione ricevuta: la trovi in Assistenza.", "Report received: you can find it in Support."));
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
      <div class="irisx-detail-utility-actions irisx-detail-utility-actions--balanced">
        <button class="det-fav irisx-detail-fav-pill" onclick="toggleFav(${productIdExpr},null)"><span>${favoriteIcon}</span><span>${favoriteLabel}</span></button>
        <button class="irisx-secondary" onclick="openChat(${sellerIdExpr},${productIdExpr})">${t("chat")}</button>
      </div>
      <div class="irisx-note irisx-note--offer">${offerNote}</div>
      <button class="irisx-link-btn irisx-link-btn--quiet" onclick="reportListing(${productIdExpr})">${langText("Segnala annuncio", "Report listing")}</button>
    </div>`;
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
    const sizePresentation = getListingSizePresentation(product);
    const sizeDisplay = sizePresentation.displayLabel;
    const sizeOriginalMarkup = sizePresentation.originalValue
      ? `<div class="det-fit-item"><div class="det-fit-label">${langText("Taglia originale", "Original size")}</div><div class="det-fit-value">${escapeHtml(sizePresentation.originalValue)}</div></div>`
      : "";
    const sizeStandardMarkup = sizePresentation.standardEquivalent
      ? `<div class="det-fit-item"><div class="det-fit-label">${langText("Fit standard", "Standard fit")}</div><div class="det-fit-value">${escapeHtml(sizePresentation.standardEquivalent)}</div></div>`
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
            <div class="irisx-detail-header">
              <div class="irisx-detail-breadcrumb"><button type="button" onclick="closeDetail()">${langText("Home", "Home")}</button><span>/</span><button type="button" onclick="showBuyView('shop')">${langText("Shop", "Shop")}</button><span>/</span><strong>${escapeHtml(product.brand)}</strong></div>
              <button type="button" class="det-back" onclick="closeDetail()">${t("back_shop")}</button>
              <div class="det-brand">${escapeHtml(product.brand)}</div>
              <div class="det-name">${escapeHtml(product.name)}</div>
              <div class="det-prices"><span class="det-price">${formatCurrency(product.price)}</span><span class="det-orig">${formatCurrency(originalPrice)}</span>${discount ? `<span class="det-save">-${discount}%</span>` : ""}</div>
            </div>
            ${getDetailActionsMarkup(product, liked)}
            <div class="det-section det-section--seller"><div class="det-section-title">${viewerOwnsListing ? langText("Gestione annuncio", "Listing management") : t("seller")}</div><div class="seller-card seller-card--elevated" onclick="${sellerCardClick}"><div class="seller-av">${escapeHtml(seller.avatar)}</div><div class="seller-info"><div class="seller-name">${escapeHtml(seller.name)}</div><div class="seller-meta">${escapeHtml(seller.city)} · ${escapeHtml(langText("Risposta premium IRIS", "Premium IRIS support"))}</div><div class="irisx-seller-badges">${sellerTrustBadges}</div></div>${sellerPrimaryAction}</div>${!viewerOwnsListing ? `<button class="irisx-link-btn irisx-link-btn--quiet" onclick="event.stopPropagation();reportListing(${productIdExpr})">${langText("Segnala annuncio", "Report listing")}</button>` : ""}</div>
          </section>
        </div>
      </section>
      <section class="irisx-detail-lower">
        <div class="irisx-detail-lower-grid">
          <div class="irisx-detail-lower-main">
            <div class="det-section"><div class="det-section-title">${t("details")}</div><div class="det-chips">${chips.map(function (chip) { return `<span class="det-chip">${escapeHtml(chip)}</span>`; }).join("")}</div></div>
            <div class="det-section"><div class="det-section-title">${t("fit_dims")}</div><div class="det-fit"><div class="det-fit-item"><div class="det-fit-label">${t("size")}</div><div class="det-fit-value">${escapeHtml(sizeDisplay)}</div></div>${sizeOriginalMarkup}${sizeStandardMarkup}<div class="det-fit-item"><div class="det-fit-label">${t("fit_label")}</div><div class="det-fit-value">${escapeHtml(product.fit === "—" ? t("not_available") : fitLabel)}</div></div><div class="det-fit-item"><div class="det-fit-label">${t("color")}</div><div class="det-fit-value">${escapeHtml(colorLabel)}</div></div><div class="det-fit-item"><div class="det-fit-label">${t("dimensions")}</div><div class="det-fit-value">${escapeHtml(product.dims)}</div></div><div class="det-fit-item"><div class="det-fit-label">${t("material")}</div><div class="det-fit-value">${escapeHtml(product.material)}</div></div><div class="det-fit-item"><div class="det-fit-label">${t("condition")}</div><div class="det-fit-value">${escapeHtml(conditionLabel)}</div></div></div></div>
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
    syncDetailImageFit(product);
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
      sellSub.textContent = langText(`Vendi in autonomia al ${selfFee}% · Oppure affidaci la gestione completa al ${conciergeFee}%`, `Sell independently at ${selfFee}% · Or let us handle full management at ${conciergeFee}%`);
    }
    const diyCommission = qsa(".sp-commission")[0];
    if (diyCommission) {
      diyCommission.innerHTML = `${selfFee}<span>%</span>`;
    }
    const conciergeCommission = qsa(".sp-commission")[1];
    if (conciergeCommission) {
      conciergeCommission.innerHTML = `${conciergeFee}<span>%</span>`;
    }
    const diyRadio = qs("#lbl-diy > div:first-of-type");
    if (diyRadio) {
      diyRadio.textContent = `${langText("Autonomo", "Self-serve")} · ${selfFee}%`;
    }
    const conciergeRadio = qs("#lbl-concierge > div:first-of-type");
    if (conciergeRadio) {
      conciergeRadio.textContent = `★ ${langText("Concierge", "Concierge")} · ${conciergeFee}%`;
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

  function showSeller(sellerId) {
    if (!sellerId) return;
    var sid = String(sellerId);
    var allListings = Array.isArray(state.listings) ? state.listings : [];
    var sellerListings = allListings.filter(function (l) {
      var directMatch =
        String(l.owner_id || l.seller_id || l.ownerId || l.sellerId || "") === sid;
      if (directMatch) return true;
      try {
        return String(buildListingSeller(l).id) === sid;
      } catch (e) {
        return false;
      }
    });

    var seller = {};
    if (sellerListings.length > 0) {
      seller = buildListingSeller(sellerListings[0]);
    } else {
      seller = { id: sid, name: sid, avatar: "👤", rating: 5, sales: 0, city: "", verified: false };
    }

    var memberYear = "";
    if (sellerListings.length > 0 && sellerListings[0].created_at) {
      var d = new Date(sellerListings[0].created_at);
      if (!isNaN(d.getFullYear())) memberYear = String(d.getFullYear());
    }

    var listingsHtml = sellerListings.map(function (listing) {
      var imgHtml = listing.images && listing.images[0]
        ? '<img src="' + escapeHtml(listing.images[0]) + '" style="width:100%;height:100%;object-fit:cover">'
        : '<div class="pi-emoji">' + escapeHtml(listing.emoji || "👜") + "</div>";
      return (
        '<div class="pc" onclick="showDetail(\'' + listing.id + '\')">' +
          '<div class="pi"><div class="pi-bg">' + imgHtml + "</div></div>" +
          '<div class="pinfo">' +
            '<div class="p-brand">' + escapeHtml(listing.brand || "") + "</div>" +
            '<div class="p-name">' + escapeHtml(listing.name || "") + "</div>" +
            '<div class="p-price">' + escapeHtml(formatCurrency(listing.price || 0)) + "</div>" +
          "</div>" +
        "</div>"
      );
    }).join("");

    var verifiedBadge = seller.verified
      ? '<span style="background:#6D28D9;color:#fff;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600;">Verificato</span>'
      : "";

    var html =
      '<div class="irisx-public-seller">' +
        '<button style="margin-bottom:24px;background:none;border:none;cursor:pointer;color:inherit;font-size:.9rem;opacity:.7;padding:0;" onclick="showBuyView(\'shop\')">' +
          "&#8592; Torna allo shop" +
        "</button>" +
        '<div class="irisx-seller-hero">' +
          '<div class="irisx-seller-avatar">' + escapeHtml(seller.avatar || "👤") + "</div>" +
          "<div>" +
            "<h1>" + escapeHtml(seller.name || "") + "</h1>" +
            '<div class="irisx-seller-meta">' +
              (seller.city ? '<span>📍 ' + escapeHtml(seller.city) + "</span>" : "") +
              '<span>★ ' + escapeHtml(String(Number(seller.rating || 5).toFixed(1))) + "</span>" +
              '<span>' + escapeHtml(String(seller.sales || 0)) + " vendite</span>" +
              verifiedBadge +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="irisx-seller-listings">' +
          "<h2>Articoli in vendita (" + sellerListings.length + ")</h2>" +
          '<div class="pgrid">' + (listingsHtml || '<p style="opacity:.5">Nessun articolo disponibile.</p>') + "</div>" +
        "</div>" +
        '<div class="irisx-seller-info-section">' +
          (seller.city
            ? '<div class="irisx-seller-info-card"><strong>' + escapeHtml(seller.city) + '</strong><span>Città</span></div>'
            : "") +
          (memberYear
            ? '<div class="irisx-seller-info-card"><strong>' + escapeHtml(memberYear) + '</strong><span>Membro dal</span></div>'
            : "") +
          '<div class="irisx-seller-info-card"><strong>⚡</strong><span>Risposta rapida</span></div>' +
        "</div>" +
      "</div>";

    showBuyView("seller");
    var sellerView = document.getElementById("seller-view");
    if (sellerView) {
      sellerView.innerHTML = html;
      enhanceInteractiveSurfaces(sellerView);
    }
  }

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
  window.showMobileTabView = showMobileTabView;
  window.syncMobileAppShell = syncMobileAppShell;
  window.saveAddressBook = saveAddressBook;
    window.irisAddressAutocomplete = irisAddressAutocomplete;
    window.irisAddressSelect = irisAddressSelect;
  window.setDefaultAddress = setDefaultAddress;
  window.addPrototypePaymentMethod = addPrototypePaymentMethod;
  window.refreshStripeConnectStatus = refreshStripeConnectStatus;
  window.openStripeConnectOnboarding = openStripeConnectOnboarding;
  window.savePayoutWorkspace = savePayoutWorkspace;
  window.saveNotificationPreferences = saveNotificationPreferences;
  window.saveSecurityWorkspace = saveSecurityWorkspace;
  window.saveAccountSettings = saveAccountSettings;
  window.handleAssistanceClick = function () {
    if (state.currentUser) {
      showBuyView("profile");
      setProfileArea("account", "help_contact");
      return;
    }
    openStatic("faq");
  };
  window.requestVerificationCode = requestVerificationCode;
  window.confirmVerificationCode = confirmVerificationCode;
  window.banIdentityIdentifiers = banIdentityIdentifiers;
  window.adminQuickBanUser = adminQuickBanUser;
  window.adminRestoreUserAccount = adminRestoreUserAccount;
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
  window.markOrderInAuthentication = markOrderInAuthentication;
  window.respondToOffer = respondToOffer;
  window.renderOrderDetailModal = renderOrderDetailModal;
  window.openOrderDetail = openOrderDetail;
  window.closeOrderDetail = closeOrderDetail;
  window.openCheckout = openCheckout;
  window.closeCheckout = closeCheckout;
  window.renderCheckoutModal = renderCheckoutModal;
  window.submitCheckout = submitCheckout;
  window.nextCheckoutStep = nextCheckoutStep;
  window.prevCheckoutStep = prevCheckoutStep;
  window.setCheckoutStep = setCheckoutStep;
  window.finalizeCheckout = finalizeCheckout;
  window.backToChats = backToChats;
  window.openChatOfferFlow = openChatOfferFlow;
  window.respondToOfferFromChat = respondToOfferFromChat;
  window.openChatReportModal = openChatReportModal;
  window.reportListing = reportListing;
  window.toggleProfileMenu = toggleProfileMenu;
  window.closeProfileMenu = closeProfileMenu;
  window.toggleLocaleMenu = toggleLocaleMenu;
  window.closeLocaleMenu = closeLocaleMenu;
  window.toggleMobileNav = toggleMobileNav;
  window.closeMobileNav = closeMobileNav;
  window.syncMobileSearchDraft = syncMobileSearchDraft;
  window.syncMobileSearch = syncMobileSearch;
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
  applyChatModerationState(state.chatModeration);
  renderChats();
  getChatModerationApi().catch(function (error) {
    console.warn("[IRIS] Unable to load chat moderation engine", error);
  });

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
