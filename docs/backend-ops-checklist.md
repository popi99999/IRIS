# IRIS backend ops checklist

Questa checklist serve per chiudere il go-live operativo dopo il merge del backend Supabase + Stripe.

## 1. Migrazioni Supabase

Eseguire in SQL Editor oppure via CLI:

- `supabase/migrations/20260408_auth_profiles.sql`
- `supabase/migrations/20260408_listings.sql`
- `supabase/migrations/20260408_offers.sql`
- `supabase/migrations/20260409_orders.sql`
- `supabase/migrations/20260409_support_tickets.sql`
- `supabase/migrations/20260409_storage_listing_images.sql`
- `supabase/migrations/20260409_conversations_messages.sql`
- `supabase/migrations/20260409_user_state_extensions.sql`
- `supabase/migrations/20260409_backend_commerce_core.sql`

In alternativa usare il cumulativo:

- `supabase/migrations/20260409_apply_all.sql`

## 2. Secret Supabase Edge Functions

Impostare questi secret nel progetto:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CONNECT_CLIENT_ID`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `PUBLIC_SITE_URL`
- `CRON_SECRET`

## 3. Deploy Edge Functions

Funzioni da deployare:

- `create-checkout-session`
- `create-offer-authorization`
- `respond-to-offer`
- `create-connect-account`
- `create-connect-account-link`
- `stripe-webhook`
- `release-payout`
- `mark-order-shipped`
- `confirm-order-delivery`
- `run-marketplace-maintenance`

Script pronto:

- `./scripts/supabase-deploy-functions.sh`

## 4. Stripe

Configurare il webhook Stripe verso:

- `/functions/v1/stripe-webhook`

Eventi minimi:

- `checkout.session.completed`
- `payment_intent.canceled`
- `payment_intent.payment_failed`
- `charge.refunded`

Verificare anche:

- Stripe Connect abilitato
- account platform configurato
- branding checkout configurato

## 5. Manutenzione automatica

Schedulare una chiamata periodica a:

- `/functions/v1/run-marketplace-maintenance`

Header richiesto:

- `x-cron-secret: <CRON_SECRET>`

Frequenza consigliata:

- ogni 15 minuti

La funzione:

- chiude offerte scadute
- cancella le pre-autorizzazioni non più valide
- rilascia i payout pronti

Script pronto:

- `./scripts/trigger-maintenance.sh`

## 6. Resend

Verificare:

- dominio email autenticato
- `EMAIL_FROM` coerente col dominio
- recapito verso buyer, seller e supporto

## 7. Controlli end-to-end

Test minimi prima del go-live:

1. Registrazione con email/password
2. Password reset
3. Pubblicazione annuncio con immagini su Storage
4. Compra subito con Stripe Checkout
5. Offerta con pre-autorizzazione manual capture
6. Accettazione seller con capture
7. Rifiuto/scadenza offerta con release
8. Seller Connect onboarding
9. Spedizione ordine
10. Conferma consegna
11. Payout seller
12. Apertura ticket supporto/disputa

## 8. Sicurezza

Dopo la configurazione iniziale:

- ruotare la `SUPABASE_SERVICE_ROLE_KEY` se è stata condivisa fuori dai canali sicuri
- ruotare anche eventuali chiavi Stripe esposte in ambienti non controllati

## 9. Script rapidi

Per ridurre il lavoro manuale:

- `./scripts/supabase-set-secrets.sh .env.local`
- `./scripts/supabase-deploy-functions.sh`
- `./scripts/setup-stripe-webhook.sh .env.local`
- `./scripts/trigger-maintenance.sh .env.local`
- `./scripts/backend-go-live.sh .env.local`
