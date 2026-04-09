import { getEnv, normalizeEmail, normalizeString } from "./env.ts";
import { getSupabaseAdmin, tryInsertEmailOutbox } from "./supabase.ts";

export type TemplateKey =
  | "welcome"
  | "verify-email"
  | "password-reset"
  | "checkout-confirmation"
  | "payment-received"
  | "payment-receipt"
  | "new-order-admin"
  | "item-sold"
  | "offer-created"
  | "offer-accepted"
  | "offer-declined"
  | "shipment-notice"
  | "payout-released"
  | "support-ticket"
  | "support-reply"
  | "dispute-opened"
  | "dispute-resolved"
  | "new-user-admin"
  | "new-listing-admin"
  | "generic";

type EmailContext = Record<string, unknown>;

function getSiteUrl(): string {
  return getEnv("PUBLIC_SITE_URL", "https://iris-fashion.it").replace(/\/+$/, "");
}

function renderSubject(templateKey: TemplateKey, context: EmailContext): string {
  const site = "IRIS";
  const orderNumber = normalizeString(context.orderNumber ?? "");
  const productTitle = normalizeString(context.productTitle ?? context.title ?? "");
  const amount = normalizeString(context.amount ?? "");

  const map: Record<TemplateKey, string> = {
    "welcome": `Benvenuto su ${site}`,
    "verify-email": `${site} — Verifica la tua email`,
    "password-reset": `${site} — Reimposta la tua password`,
    "checkout-confirmation": `${site} — Conferma ordine${orderNumber ? ` ${orderNumber}` : ""}`,
    "payment-received": `${site} — Pagamento ricevuto${orderNumber ? ` ${orderNumber}` : ""}`,
    "payment-receipt": `${site} — Ricevuta pagamento${orderNumber ? ` ${orderNumber}` : ""}`,
    "new-order-admin": `${site} Admin — Nuovo ordine${orderNumber ? ` ${orderNumber}` : ""}`,
    "item-sold": `${site} — Articolo venduto${productTitle ? `: ${productTitle}` : ""}`,
    "offer-created": `${site} — Nuova offerta${productTitle ? `: ${productTitle}` : ""}`,
    "offer-accepted": `${site} — Offerta accettata${productTitle ? `: ${productTitle}` : ""}`,
    "offer-declined": `${site} — Offerta rifiutata${productTitle ? `: ${productTitle}` : ""}`,
    "shipment-notice": `${site} — Aggiornamento spedizione${orderNumber ? ` ${orderNumber}` : ""}`,
    "payout-released": `${site} — Payout rilasciato${amount ? ` ${amount}` : ""}`,
    "support-ticket": `${site} — Supporto aperto${orderNumber ? ` ${orderNumber}` : ""}`,
    "support-reply": `${site} — Risposta al tuo ticket`,
    "dispute-opened": `${site} — Dispute aperta${orderNumber ? ` ${orderNumber}` : ""}`,
    "dispute-resolved": `${site} — Dispute risolta${orderNumber ? ` ${orderNumber}` : ""}`,
    "new-user-admin": `${site} Admin — Nuovo utente registrato`,
    "new-listing-admin": `${site} Admin — Nuovo listing pubblicato`,
    "generic": site,
  };
  return map[templateKey] ?? site;
}

function renderHtmlBody(templateKey: TemplateKey, context: EmailContext): string {
  const siteUrl = getSiteUrl();
  const productTitle = normalizeString(context.productTitle ?? context.title ?? "");
  const orderNumber = normalizeString(context.orderNumber ?? "");
  const amount = normalizeString(context.amount ?? "");
  const trackingNumber = normalizeString(context.trackingNumber ?? "");
  const carrier = normalizeString(context.carrier ?? "");
  const verifyUrl = normalizeString(context.verifyUrl ?? `${siteUrl}/verify-email`);
  const resetUrl = normalizeString(context.resetUrl ?? `${siteUrl}/reset-password`);
  const code = normalizeString(context.code ?? "");
  const body = normalizeString(context.body ?? context.message ?? "");
  const buyerEmail = normalizeString(context.buyerEmail ?? "");
  const sellerEmail = normalizeString(context.sellerEmail ?? "");
  const transferId = normalizeString(context.transferId ?? "");
  const ticketId = normalizeString(context.ticketId ?? "");
  const disputeId = normalizeString(context.disputeId ?? "");
  const resolution = normalizeString(context.resolution ?? "");
  const userName = normalizeString(context.userName ?? context.name ?? "");

  switch (templateKey) {
    case "welcome":
      return `Benvenuto su <strong>IRIS</strong>, il marketplace italiano per la moda di lusso autenticata.<br><br>
Il tuo account è stato creato con successo. Puoi iniziare a esplorare migliaia di articoli firmati e autenticati.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Vai su IRIS →</a>`;

    case "verify-email":
      return `Per attivare il tuo account IRIS, conferma il tuo indirizzo email.<br><br>
${code ? `Il tuo codice di verifica è: <strong style="font-size:24px;letter-spacing:4px">${code}</strong><br><br>Questo codice scade tra 15 minuti.` : `<a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;background:#7C3AED;color:#fff;border-radius:4px;text-decoration:none">Verifica Email →</a><br><br>Questo link scade tra 24 ore.`}<br><br>
Se non hai creato un account IRIS, ignora questa email.`;

    case "password-reset":
      return `Hai richiesto di reimpostare la password del tuo account IRIS.<br><br>
<a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#7C3AED;color:#fff;border-radius:4px;text-decoration:none">Reimposta Password →</a><br><br>
<strong>Questo link scade tra 1 ora.</strong><br><br>
Se non hai richiesto questo reset, ignora questa email. La tua password non verrà modificata.`;

    case "checkout-confirmation":
      return `Il tuo ordine <strong>${orderNumber || "IRIS"}</strong> è stato confermato e il pagamento è andato a buon fine.<br><br>
${productTitle ? `Articolo: <strong>${productTitle}</strong><br>` : ""}
${amount ? `Totale pagato: <strong>${amount}</strong><br>` : ""}
<br>Il venditore preparerà la spedizione entro 2 giorni lavorativi.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Monitora il tuo ordine →</a>`;

    case "payment-received":
      return `Hai ricevuto un pagamento per l'ordine <strong>${orderNumber || "IRIS"}</strong>.<br><br>
${productTitle ? `Articolo: <strong>${productTitle}</strong><br>` : ""}
${amount ? `Importo: <strong>${amount}</strong><br>` : ""}
${buyerEmail ? `Compratore: ${buyerEmail}<br>` : ""}
<br>Prepara l'articolo per la spedizione entro 2 giorni lavorativi. Il payout ti verrà accreditato dopo la consegna confermata.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Vai ai tuoi ordini →</a>`;

    case "payment-receipt":
      return `Ecco la tua ricevuta per l'ordine <strong>${orderNumber || "IRIS"}</strong>.<br><br>
${productTitle ? `Articolo: <strong>${productTitle}</strong><br>` : ""}
${amount ? `Totale: <strong>${amount}</strong><br>` : ""}
<br>IRIS è il marketplace italiano per la moda di lusso autenticata.<br>
Per domande: <a href="mailto:support@iris-fashion.it" style="color:#c4a06a">support@iris-fashion.it</a>`;

    case "new-order-admin":
      return `Nuovo ordine ricevuto sulla piattaforma.<br><br>
Numero: <strong>${orderNumber || "N/A"}</strong><br>
${productTitle ? `Articolo: ${productTitle}<br>` : ""}
${amount ? `Totale: ${amount}<br>` : ""}
${buyerEmail ? `Compratore: ${buyerEmail}<br>` : ""}
${sellerEmail ? `Venditore: ${sellerEmail}<br>` : ""}
<br><a href="${siteUrl}/admin" style="color:#c4a06a">Vai al pannello admin →</a>`;

    case "item-sold":
      return `Il tuo articolo <strong>${productTitle || "IRIS"}</strong> è stato venduto!<br><br>
Ordine: <strong>${orderNumber || "N/A"}</strong><br>
${amount ? `Ricavi (al lordo delle commissioni): <strong>${amount}</strong><br>` : ""}
${buyerEmail ? `Compratore: ${buyerEmail}<br>` : ""}
<br><strong>Istruzioni spedizione:</strong><br>
1. Imballa accuratamente l'articolo<br>
2. Accedi alla sezione Ordini su IRIS per generare l'etichetta di spedizione<br>
3. Spedisci entro 2 giorni lavorativi<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Gestisci l'ordine →</a>`;

    case "offer-created":
      return `Hai ricevuto una nuova offerta per <strong>${productTitle || "il tuo articolo"}</strong>.<br><br>
${amount ? `Importo offerta: <strong>${amount}</strong><br>` : ""}
${buyerEmail ? `Da: ${buyerEmail}<br>` : ""}
<br>L'offerta scade tra 24 ore. Accetta o rifiuta dall'app.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Rispondi all'offerta →</a>`;

    case "offer-accepted":
      return `La tua offerta per <strong>${productTitle || "l'articolo"}</strong> è stata accettata!<br><br>
${amount ? `Importo: <strong>${amount}</strong><br>` : ""}
<br>Il pagamento sarà completato automaticamente. Riceverai una conferma appena il venditore ha spedito l'articolo.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Vai ai tuoi ordini →</a>`;

    case "offer-declined":
      return `La tua offerta per <strong>${productTitle || "l'articolo"}</strong> non è stata accettata.<br><br>
${amount ? `Offerta proposta: <strong>${amount}</strong><br>` : ""}
<br>L'articolo è ancora disponibile. Puoi fare una nuova offerta o acquistarlo al prezzo pieno.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Sfoglia IRIS →</a>`;

    case "shipment-notice":
      return `Il tuo ordine <strong>${orderNumber || "IRIS"}</strong> è stato spedito.<br><br>
${carrier ? `Corriere: <strong>${carrier}</strong><br>` : ""}
${trackingNumber ? `Tracking: <strong>${trackingNumber}</strong><br>` : ""}
<br>Monitoralo direttamente sul sito del corriere usando il numero di tracking.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Vai ai tuoi ordini →</a>`;

    case "payout-released":
      return `Il tuo payout è stato rilasciato!<br><br>
${amount ? `Importo: <strong>${amount}</strong><br>` : ""}
${transferId ? `ID trasferimento: ${transferId}<br>` : ""}
<br>I fondi arriveranno sul tuo conto bancario collegato entro 2-5 giorni lavorativi, secondo le politiche di Stripe.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Vai ai tuoi guadagni →</a>`;

    case "support-ticket":
      return `Il tuo ticket di supporto è stato aperto con successo.<br><br>
${ticketId ? `ID ticket: <strong>${ticketId}</strong><br>` : ""}
${orderNumber ? `Ordine: <strong>${orderNumber}</strong><br>` : ""}
<br>Un membro del team IRIS ti risponderà entro 24 ore lavorative.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Monitora il ticket →</a>`;

    case "support-reply":
      return `Il tuo ticket di supporto${ticketId ? ` #${ticketId}` : ""} ha ricevuto una risposta.<br><br>
${body ? `<p style="background:rgba(255,255,255,.05);padding:12px;border-left:3px solid #c4a06a">${body}</p><br>` : ""}
<a href="${siteUrl}" style="color:#c4a06a">Rispondi al ticket →</a>`;

    case "dispute-opened":
      return `È stata aperta una dispute per l'ordine <strong>${orderNumber || "IRIS"}</strong>.<br><br>
${disputeId ? `ID dispute: ${disputeId}<br>` : ""}
<br>Il team IRIS esaminerà la situazione e ti contatterà entro 48 ore lavorative.<br>
Il payout è temporaneamente sospeso fino alla risoluzione.<br><br>
<a href="${siteUrl}" style="color:#c4a06a">Vedi i dettagli →</a>`;

    case "dispute-resolved":
      return `La dispute per l'ordine <strong>${orderNumber || "IRIS"}</strong> è stata risolta.<br><br>
${resolution ? `Esito: <strong>${resolution}</strong><br><br>` : ""}
<a href="${siteUrl}" style="color:#c4a06a">Vai ai tuoi ordini →</a>`;

    case "new-user-admin":
      return `Nuovo utente registrato su IRIS.<br><br>
${userName ? `Nome: ${userName}<br>` : ""}
${context.email ? `Email: ${String(context.email)}<br>` : ""}
<br><a href="${siteUrl}/admin" style="color:#c4a06a">Vai al pannello admin →</a>`;

    case "new-listing-admin":
      return `Nuovo listing pubblicato su IRIS.<br><br>
${productTitle ? `Articolo: <strong>${productTitle}</strong><br>` : ""}
${context.listingId ? `ID: ${String(context.listingId)}<br>` : ""}
${sellerEmail ? `Venditore: ${sellerEmail}<br>` : ""}
${amount ? `Prezzo: ${amount}<br>` : ""}
<br><a href="${siteUrl}/admin" style="color:#c4a06a">Vai al pannello admin →</a>`;

    default:
      return body || "Aggiornamento da IRIS.";
  }
}

function renderTemplate(templateKey: TemplateKey, context: EmailContext) {
  const siteUrl = getSiteUrl();
  const subject = renderSubject(templateKey, context);
  const htmlBody = renderHtmlBody(templateKey, context);

  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060310;font-family:Inter,system-ui,sans-serif">
  <div style="max-width:640px;margin:32px auto;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);padding:32px">
    <div style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#c4a06a;margin-bottom:20px">IRIS — Luxury Fashion</div>
    <div style="color:rgba(245,240,235,.9);font-size:15px;line-height:1.75">
      ${htmlBody}
    </div>
    <hr style="margin:28px 0;border:none;border-top:1px solid rgba(255,255,255,.08)">
    <p style="margin:0;color:rgba(245,240,235,.45);font-size:12px;line-height:1.6">
      IRIS Luxury Fashion Marketplace · <a href="${siteUrl}" style="color:#c4a06a">iris-fashion.it</a><br>
      Hai ricevuto questa email perché hai un account su IRIS.<br>
      <a href="${siteUrl}/impostazioni#notifiche" style="color:rgba(245,240,235,.35)">Gestisci notifiche email</a>
    </p>
  </div>
</body>
</html>`;

  const text = [
    "IRIS — Luxury Fashion Marketplace",
    subject,
    "",
    htmlBody.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    "",
    `IRIS: ${siteUrl}`,
  ].join("\n");

  return { subject, html, text };
}

const MAX_RETRY_ATTEMPTS = 3;

export async function sendTransactionalEmail(
  templateKey: TemplateKey,
  recipientEmail: string,
  context: EmailContext = {},
  overrides: Partial<{ subject: string; html: string; text: string; from: string }> = {},
): Promise<{ ok: boolean; sent?: boolean; queued?: boolean; skipped?: boolean; error?: string; provider?: string | null; outbox?: unknown }> {
  const email = normalizeEmail(recipientEmail);
  if (!email) {
    return { ok: false, skipped: true, reason: "missing_recipient" } as never;
  }

  const base = renderTemplate(templateKey, context);
  const subject = overrides.subject ?? base.subject;
  const html = overrides.html ?? base.html;
  const text = overrides.text ?? base.text;
  const from = overrides.from ?? getEnv("EMAIL_FROM", `IRIS <support@iris-fashion.it>`);

  const record = {
    template_key: templateKey,
    recipient_email: email,
    subject,
    html_body: html,
    text_body: text,
    status: "queued",
    provider: "resend",
    provider_message_id: "",
    related_order_id: normalizeString(context.orderId ?? ""),
    related_ticket_id: normalizeString(context.ticketId ?? ""),
    related_offer_id: normalizeString(context.offerId ?? ""),
    payload: context,
  };

  const outbox = await tryInsertEmailOutbox(record);
  const resendKey = getEnv("RESEND_API_KEY", "");

  if (!resendKey) {
    console.warn(`[email] RESEND_API_KEY not set — email queued but not sent: ${templateKey} → ${email}`);
    return { ok: true, queued: true, outbox };
  }

  // Attempt send with exponential backoff retry
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [email], subject, html, text }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        lastError = payload?.message ?? payload?.error ?? `HTTP ${response.status}`;
        if (attempt < MAX_RETRY_ATTEMPTS && response.status >= 500) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
          continue;
        }
        // Update outbox with error
        if (outbox && (outbox as Record<string, unknown>).id) {
          await getSupabaseAdmin()
            .from("email_outbox")
            .update({
              status: "failed",
              attempts_count: attempt,
              last_error: lastError,
            })
            .eq("id", (outbox as Record<string, unknown>).id);
        }
        return { ok: false, error: lastError, outbox };
      }

      // Success
      const providerId = payload?.id ?? null;
      if (outbox && (outbox as Record<string, unknown>).id) {
        await getSupabaseAdmin()
          .from("email_outbox")
          .update({
            status: "sent",
            provider_message_id: providerId ?? "",
            sent_at: new Date().toISOString(),
            attempts_count: attempt,
          })
          .eq("id", (outbox as Record<string, unknown>).id);
      }
      return { ok: true, sent: true, provider: providerId, outbox };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      if (attempt < MAX_RETRY_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  // All retries exhausted
  if (outbox && (outbox as Record<string, unknown>).id) {
    await getSupabaseAdmin()
      .from("email_outbox")
      .update({ status: "failed", last_error: lastError, attempts_count: MAX_RETRY_ATTEMPTS })
      .eq("id", (outbox as Record<string, unknown>).id);
  }
  return { ok: false, error: lastError, outbox };
}
