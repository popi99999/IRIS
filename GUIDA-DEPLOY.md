# IRIS — Guida Deploy Completo
## Fai queste cose nell'ordine esatto. Ogni step dura 5 minuti.

---

## STEP 1 — Applica il database (2 minuti)
1. Vai su: https://supabase.com/dashboard/project/xzhgyamzfthqrcaljdqv/sql/new
2. Apri il file `APPLY-IN-SUPABASE-EDITOR.sql` (è nella cartella IRIS)
3. Copia tutto il contenuto e incollalo nell'editor
4. Clicca **Run**
5. Dovresti vedere: `IRIS DB setup completato ✓`

---

## STEP 2 — Compila le chiavi (5 minuti)
Apri il file `.env.local` nella cartella IRIS e sostituisci i `REPLACE_ME`:

| Variabile | Dove trovarla |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | https://supabase.com/dashboard/project/xzhgyamzfthqrcaljdqv/settings/api → "service_role" |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys → "Secret key" |
| `STRIPE_PUBLISHABLE_KEY` | https://dashboard.stripe.com/apikeys → "Publishable key" |
| `STRIPE_CONNECT_CLIENT_ID` | https://dashboard.stripe.com/settings/connect → "client_id" |
| `RESEND_API_KEY` | https://resend.com → crea account gratis → API Keys |
| `OWNER_EMAIL` | la tua email |
| `ADMIN_EMAILS` | la tua email |

**Non toccare** `STRIPE_WEBHOOK_SECRET` per ora — lo ottieni al prossimo step.

---

## STEP 3 — Deploy funzioni (3 minuti, da Terminale)
```bash
cd /Users/brandocaregnato/Desktop/IRIS
/tmp/supabase login
# Si apre il browser → Authorize → torna al terminale
bash scripts/backend-go-live.sh
```
Lo script fa tutto: deploya le 10 funzioni, imposta i secrets, registra il webhook Stripe.

Alla fine stampa l'URL del webhook. Copialo.

---

## STEP 4 — Webhook secret (2 minuti)
1. Vai su: https://dashboard.stripe.com/webhooks
2. Trovi il webhook appena creato → clicca → "Reveal signing secret"
3. Copia il valore (inizia con `whsec_`)
4. Apri `.env.local`, sostituisci `REPLACE_ME` su `STRIPE_WEBHOOK_SECRET`
5. Riesegui solo i secrets:
   ```bash
   bash scripts/supabase-set-secrets.sh
   ```

---

## STEP 5 — Bucket Storage (1 minuto)
1. Vai su: https://supabase.com/dashboard/project/xzhgyamzfthqrcaljdqv/storage/buckets
2. Clicca **New bucket**
3. Nome: `listing-images`
4. Spunta **Public bucket** → Save

---

## STEP 6 — Verifica Resend (5 minuti)
1. Vai su: https://resend.com/domains
2. Clicca **Add Domain** → inserisci `iris-fashion.it`
3. Aggiungi i record DNS che ti mostra (TXT e MX) nel tuo registrar
4. Aspetta la verifica (di solito 5-10 minuti)

---

## TEST FINALE
1. Apri https://popi99999.github.io/IRIS/
2. Crea un account
3. Aggiungi un prodotto di test
4. Fai un acquisto con carta Stripe di test: `4242 4242 4242 4242`
5. Controlla che arrivi l'email di conferma

**Sei live. 🎉**
