# IRIS Marketplace Audit

Date: 2026-03-31

## A. Stato attuale del progetto

IRIS oggi e' una single-page app statica per GitHub Pages. Ha un frontend convincente per catalogo, dettaglio prodotto, preferiti, profilo, chat, offerte, sell form, carrello e checkout, ma quasi tutto il comportamento e' client-side e persiste solo in `localStorage`.

Nel repo non esistono backend, database, API o integrazioni provider. In questa tranche e' stata aggiunta una struttura operativa minima nel frontend:

- ordini con lifecycle, timeline, payment snapshot e inventory lock
- notifiche persistenti per buyer, seller e admin
- email outbox con template key e trigger principali
- seller workflow per spedire e buyer tracking per confermare la consegna
- support/dispute basic flow
- admin ops view con ordini, ticket, utenti recenti ed email outbox

## B. Cose mancanti critiche

- Backend applicativo: non esiste alcuna API reale per auth, ordini, checkout, notifiche, messaggi, ticket o admin.
- Database e schema persistente: mancano tabelle vere per users, listings, orders, order_items, payments, notifications, support_tickets, payouts e reviews.
- Pagamenti reali: nessuna integrazione Stripe o PSP, nessun PaymentIntent, webhook, refund o ledger commissioni.
- Email transazionali reali: esiste solo l'outbox front-end; manca il provider reale e il worker che spedisce.
- Sicurezza: password ancora salvate lato browser per il prototipo; mancano hashing, sessioni firmate, ruoli server-side, rate limiting e validazione server.
- Shipping reale: niente carrier integration, niente label generation, niente tracking provider o costo dinamico.
- Admin governance reale: manca moderazione server-side di listing, ordini e utenti.

## C. Cose mancanti importanti

- Wishlist e chat restano browser-only: non c'e' sync multi-device o multi-user reale.
- Profilo seller incompleto: mancano payout details, tax profile, KYC, tempi payout, performance metrics.
- Buyer area incompleta: niente cancellazione ordine, resi strutturati, download ricevute/PDF, rubriche indirizzi multiple.
- Support flow basilare: ticket senza thread, allegati, SLA o assegnazione.
- Review flow solo buyer->seller nel prototipo; manca seller->buyer e moderazione recensioni.
- Policies statiche ma non collegate a processi reali di cookie, refund, shipping e dispute.

## D. Cose mancanti secondarie

- Empty states e loading states ancora disomogenei.
- SEO avanzata assente: manca sitemap reale, robots, canonicals dinamici e social preview per prodotto.
- Analytics e technical logging non presenti.
- Fallback immagini, quality guardrails e anti-duplicate listing sono ancora deboli.
- Accessibilita' e mobile ops flow migliorabili.

## E. Matrice completa per area

| Area | Stato | Note |
| --- | --- | --- |
| Auth | Broken / risky | Login/register browser-only, nessun server, nessun hashing. |
| Payments | Missing | Solo checkout locale, nessun PSP, webhook o refund. |
| Orders | Partial | Ora esiste lifecycle serio nel frontend, ma non c'e' persistenza server-side. |
| Messaging | Partial | Chat e offerte funzionano in locale ma non su backend. |
| Notifications | Partial | In-app persistenti lato browser; manca delivery reale multi-device. |
| Emails | Partial | Outbox e template key presenti; manca provider reale. |
| Shipping | Partial | Struttura carrier/tracking e seller flow presenti; manca integrazione vera. |
| Seller dashboard | Partial | Seller order management e listing status presenti nel frontend. |
| Buyer dashboard | Partial | Order tracking, support e review base presenti nel frontend. |
| Admin dashboard | Partial | Ops view introdotta; manca backend, moderazione e permessi reali. |
| Policies | Partial | Terms/privacy presenti, cookie/refund/shipping policy ancora da completare. |
| Security | Broken / risky | Nessuna protezione server-side, password browser-side. |
| SEO | Partial | Meta base e PWA presenti; manca infrastruttura SEO completa. |
| Analytics | Missing | Nessun tracking o event pipeline. |

## F. Piano di implementazione

### Fase 1 - indispensabile per andare live

- Portare auth, orders, notifications, support e admin su backend vero.
- Integrare pagamenti reali con Stripe e webhook.
- Salvare ordini, order items, payment state e inventory in database.
- Spedire email transazionali con provider reale.
- Chiudere password browser-side e attivare ruoli server-side.

### Fase 2 - importante subito dopo

- Dashboard seller completa con payout details e payout history.
- Shipping provider e label generation.
- Ticketing con thread, allegati e admin triage.
- Review flow completo e moderato.
- Analytics, error logging e audit log centralizzato.

### Fase 3 - miglioramenti

- Coupon, automation marketing, recommendation engine.
- SEO prodotto avanzato e social preview dinamiche.
- Miglioramento mobile ops, UX supporto e accessibility.

## G. Implementazione concreta fatta in questa tranche

### Codice applicativo

- `iris-plus.js`
  - introdotti `notifications`, `emailOutbox`, `supportTickets`, `auditLog`, `reviews`
  - ordini normalizzati con `number`, `payment`, `timeline`, `supportTicketIds`, `reviewStatus`
  - inventory lock sui prodotti acquistati
  - notifiche persistenti per ordine, messaggio, offerta, spedizione e supporto
  - email outbox con trigger principali
  - seller shipment flow
  - buyer delivery confirmation
  - support ticket flow
  - review flow base
  - admin ops view

### Styling

- `iris-plus.css`
  - aggiunti badge sold, timeline ordini e layout ops/admin

### Blueprint

- `docs/backend-blueprint.md`
  - tabelle, API routes, trigger e env richiesti
- `docs/email-trigger-matrix.md`
  - matrice email con trigger, destinatario, subject e template path
- `.env.example`
  - configurazione minima backend/provider

## Conclusione

IRIS non e' ancora go-live ready. Dopo questa tranche non e' piu' solo "UI finta": ha una base operativa piu' credibile nel frontend, ma il blocco vero resta invariato ed e' chiaro:

- senza backend
- senza database
- senza pagamenti reali
- senza email provider
- senza sicurezza server-side

il marketplace non puo' essere considerato live.
