# Prompt per creare l'app mobile IRIS

## DOVE USARLO
Vai su **https://bolt.new** (gratuito, preview istantanea nel browser)
oppure **https://expo.dev/snack** (gratuito, funziona anche sul tuo telefono
con l'app Expo Go) e incolla questo prompt.

Per un'app vera da pubblicare su App Store / Google Play usa **Cursor**
(gratis) con questo prompt — poi testi con Expo Go scannerizzando il QR.

---

## IL PROMPT (copia tutto da qui in poi)

Crea un'app mobile in **React Native con Expo** per IRIS, un marketplace
italiano di moda di lusso. L'app deve connettersi al backend Supabase già
esistente e replicare tutte le funzionalità del sito web.

### BACKEND (già pronto, non modificare)
- Supabase URL: `https://xzhgyamzfthqrcaljdqv.supabase.co`
- Usa `@supabase/supabase-js` per auth, database e storage
- Le edge functions sono già deployate su Supabase
- Autenticazione: email+password via `supabase.auth.signInWithPassword()`
- Tutte le chiamate API passano per `supabase.functions.invoke(nome, { body })`

### DESIGN
Tema dark luxury:
- Sfondo: `#060310` (quasi nero viola)
- Viola principale: `#7C3AED`
- Oro: `#C4A06A`
- Testo primario: `rgba(253,250,255,0.9)`
- Testo secondario: `rgba(253,250,255,0.55)`
- Card background: `#110826`
- Border: `rgba(167,139,250,0.08)`
- Font: usa `Playfair Display` per titoli, `Inter` per testo (expo-google-fonts)
- Stile: minimalista lusso, niente icone colorate, tutto dark

### SCHERMATE DA CREARE

**1. Home / Esplora (tab principale)**
- Header con logo IRIS in gold
- Barra ricerca in alto
- Filtri orizzontali scrollabili: categoria, brand, condizione, prezzo
- Griglia prodotti 2 colonne: foto, brand, nome, prezzo
- Tap su prodotto → Schermata Dettaglio

**2. Dettaglio Prodotto**
- Carousel foto prodotto (swipe)
- Brand + nome + prezzo in grande
- Condizione + taglia + colore + materiale
- Info seller (avatar, nome, rating)
- Bottone "Acquista ora" (viola) → checkout
- Bottone "Fai un'offerta" (gold outline)
- Bottone "Contatta il venditore" → chat
- Sezione "Protezione IRIS": autenticazione garantita, reso 14 giorni

**3. Checkout**
- Step 1: Indirizzo spedizione
- Step 2: Riepilogo ordine (prodotto, spedizione €15, totale)
- Step 3: Paga → chiama `supabase.functions.invoke('create-checkout-session', { body: { items, shipping } })` → apri la URL restituita nel browser in-app (WebBrowser.openBrowserAsync)
- Gestisci il ritorno dalla pagina Stripe con deep link

**4. Profilo / Account (tab)**
Mostra stato login. Se non loggato: form email+password con bottone login e registrati.
Se loggato mostra:
- Avatar iniziali del nome, nome, email
- I miei ordini (lista)
- Dettaglio ordine: stato timeline (pending → paid → shipped → delivered → completed), tracking number
- Payout settings (solo per seller): mostra stato Stripe Connect, bottone "Collega conto bancario" → `supabase.functions.invoke('create-connect-account', {})` poi `create-connect-account-link`

**5. Vendi (tab)**
- Solo se loggato
- Form: foto (ImagePicker), brand, nome, categoria, condizione, prezzo
- Bottone pubblica → `supabase.from('listings').insert({...})`
- Lista i miei annunci attivi

**6. Chat / Messaggi (tab)**
- Lista conversazioni
- Schermata chat singola con messaggi in tempo reale via `supabase.channel()`

**7. Notifiche (tab o badge)**
- Lista notifiche da `supabase.from('notifications').select()` dove `recipient_id = user.id`

### TABELLE SUPABASE DA USARE
```
listings: id, name, brand, price, images[], cat, cond, sz, desc, inventory_status, listing_status, seller_id
orders: id, order_number, status, buyer_id, total, created_at, items_json
notifications: id, title, body, unread, recipient_id, created_at_ms
conversations: id, buyer_id, seller_id, listing_id, updated_at
messages: id, conversation_id, sender_id, content, created_at
profiles: id, full_name, avatar_url, payout_settings, seller_rating
```

### FUNZIONALITÀ TECNICHE
- Navigazione: `expo-router` con tab bar in basso (5 tab: Shop, Vendi, Chat, Notifiche, Account)
- Auth state: Context con `supabase.auth.onAuthStateChange()`
- Immagini: `expo-image` per performance
- Upload foto listing: `expo-image-picker` + `supabase.storage.from('listing-images').upload()`
- Pagamenti: `WebBrowser.openBrowserAsync(checkoutUrl)` + deep link per ritorno
- Real-time chat: `supabase.channel('chat').on('INSERT',...)`
- Pull-to-refresh su tutte le liste
- Skeleton loading mentre caricano i dati
- Lingua: italiano di default

### STRUTTURA FILE CONSIGLIATA
```
app/
  (tabs)/
    index.tsx        # Shop/Esplora
    sell.tsx         # Vendi
    chat.tsx         # Messaggi
    notifications.tsx
    profile.tsx
  product/[id].tsx   # Dettaglio
  checkout.tsx
  auth.tsx
components/
  ProductCard.tsx
  ProductGrid.tsx
  OrderTimeline.tsx
  StripeConnectCard.tsx
  ChatBubble.tsx
lib/
  supabase.ts        # client inizializzato
  auth.tsx           # context
constants/
  colors.ts          # palette dark luxury
```

### NOTE IMPORTANTI
- Non inventare API o endpoint: usa solo quelli indicati sopra
- Non usare expo-payments o stripe-react-native: il pagamento avviene sempre
  aprendo la URL Stripe nel browser (già gestito dal backend)
- RLS Supabase è già configurato: le query funzionano automaticamente con
  l'utente loggato
- Testa sempre con account reali Supabase, non mock data
- Il progetto Supabase è: xzhgyamzfthqrcaljdqv
