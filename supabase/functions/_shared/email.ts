import { getEnv, normalizeEmail, normalizeString } from "./env.ts";
import { getSupabaseAdmin, tryInsertEmailOutbox } from "./supabase.ts";

type TemplateKey =
  | "checkout-confirmation"
  | "offer-created"
  | "offer-accepted"
  | "offer-declined"
  | "payout-released"
  | "support-ticket"
  | "shipment-notice"
  | "generic";

type EmailContext = Record<string, unknown>;

function renderTemplate(templateKey: TemplateKey, context: EmailContext) {
  const siteUrl = getEnv("PUBLIC_SITE_URL", "https://iris-fashion.it").replace(/\/+$/, "");
  const productTitle = normalizeString(context.productTitle ?? context.title ?? "IRIS");
  const orderNumber = normalizeString(context.orderNumber ?? "");
  const amount = normalizeString(context.amount ?? "");
  const subjectByTemplate: Record<TemplateKey, string> = {
    "checkout-confirmation": `IRIS - Conferma ordine${orderNumber ? ` ${orderNumber}` : ""}`,
    "offer-created": `IRIS - Nuova offerta${productTitle ? `: ${productTitle}` : ""}`,
    "offer-accepted": `IRIS - Offerta accettata${productTitle ? `: ${productTitle}` : ""}`,
    "offer-declined": `IRIS - Offerta rifiutata${productTitle ? `: ${productTitle}` : ""}`,
    "payout-released": `IRIS - Payout rilasciato${amount ? ` ${amount}` : ""}`,
    "support-ticket": `IRIS - Supporto aperto${orderNumber ? ` ${orderNumber}` : ""}`,
    "shipment-notice": `IRIS - Spedizione aggiornata${orderNumber ? ` ${orderNumber}` : ""}`,
    generic: "IRIS",
  };
  const headlineByTemplate: Record<TemplateKey, string> = {
    "checkout-confirmation": "Il tuo ordine è stato creato.",
    "offer-created": "Hai ricevuto una nuova offerta.",
    "offer-accepted": "La tua offerta è stata accettata.",
    "offer-declined": "La tua offerta è stata rifiutata.",
    "payout-released": "Il payout è stato rilasciato.",
    "support-ticket": "Il supporto è stato attivato.",
    "shipment-notice": "La spedizione è stata aggiornata.",
    generic: "IRIS",
  };
  const html = `
    <div style="background:#060310;color:#f5f0eb;font-family:Inter,system-ui,sans-serif;padding:32px">
      <div style="max-width:640px;margin:0 auto;border:1px solid rgba(255,255,255,.08);padding:28px;background:rgba(255,255,255,.03)">
        <div style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#c4a06a;margin-bottom:18px">IRIS</div>
        <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.1;margin:0 0 18px">${headlineByTemplate[templateKey]}</h1>
        <p style="font-size:15px;line-height:1.7;color:rgba(245,240,235,.82);margin:0 0 18px">
          ${renderEmailBody(templateKey, context)}
        </p>
        <p style="margin:0;color:rgba(245,240,235,.75);font-size:13px;line-height:1.6">
          Vai su <a href="${siteUrl}" style="color:#c4a06a">IRIS</a> per controllare lo stato aggiornato.
        </p>
      </div>
    </div>
  `;
  const text = [
    headlineByTemplate[templateKey],
    renderPlainEmailBody(templateKey, context),
    `IRIS: ${siteUrl}`,
  ].join("\n\n");
  return {
    subject: subjectByTemplate[templateKey],
    html,
    text,
  };
}

function renderEmailBody(templateKey: TemplateKey, context: EmailContext): string {
  const productTitle = normalizeString(context.productTitle ?? context.title ?? "");
  const orderNumber = normalizeString(context.orderNumber ?? "");
  const amount = normalizeString(context.amount ?? "");
  switch (templateKey) {
    case "checkout-confirmation":
      return `Il pagamento è stato confermato e l'ordine <strong>${orderNumber || "IRIS"}</strong> è stato creato con successo.`;
    case "offer-created":
      return `Hai ricevuto una nuova offerta per <strong>${productTitle}</strong>${amount ? ` per ${amount}` : ""}.`;
    case "offer-accepted":
      return `La tua offerta per <strong>${productTitle}</strong> è stata accettata e il flusso di pagamento è stato avviato.`;
    case "offer-declined":
      return `La tua offerta per <strong>${productTitle}</strong> non è stata accettata.`;
    case "payout-released":
      return `Il payout di <strong>${amount || "IRIS"}</strong> è stato rilasciato verso il seller collegato.`;
    case "support-ticket":
      return `È stato aperto un ticket di supporto${orderNumber ? ` per l'ordine <strong>${orderNumber}</strong>` : ""}.`;
    case "shipment-notice":
      return `La spedizione per <strong>${orderNumber || productTitle}</strong> è stata aggiornata.`;
    default:
      return normalizeString(context.body ?? context.message ?? "Aggiornamento IRIS.");
  }
}

function renderPlainEmailBody(templateKey: TemplateKey, context: EmailContext): string {
  const productTitle = normalizeString(context.productTitle ?? context.title ?? "");
  const orderNumber = normalizeString(context.orderNumber ?? "");
  const amount = normalizeString(context.amount ?? "");
  switch (templateKey) {
    case "checkout-confirmation":
      return `Il pagamento è stato confermato e l'ordine ${orderNumber || "IRIS"} è stato creato con successo.`;
    case "offer-created":
      return `Hai ricevuto una nuova offerta per ${productTitle}${amount ? ` per ${amount}` : ""}.`;
    case "offer-accepted":
      return `La tua offerta per ${productTitle} è stata accettata e il flusso di pagamento è stato avviato.`;
    case "offer-declined":
      return `La tua offerta per ${productTitle} non è stata accettata.`;
    case "payout-released":
      return `Il payout di ${amount || "IRIS"} è stato rilasciato verso il seller collegato.`;
    case "support-ticket":
      return `È stato aperto un ticket di supporto${orderNumber ? ` per l'ordine ${orderNumber}` : ""}.`;
    case "shipment-notice":
      return `La spedizione per ${orderNumber || productTitle} è stata aggiornata.`;
    default:
      return normalizeString(context.body ?? context.message ?? "Aggiornamento IRIS.");
  }
}

export async function sendTransactionalEmail(
  templateKey: TemplateKey,
  recipientEmail: string,
  context: EmailContext = {},
  overrides: Partial<{ subject: string; html: string; text: string; from: string }> = {},
) {
  const email = normalizeEmail(recipientEmail);
  if (!email) {
    return { ok: false, skipped: true, reason: "missing_recipient" };
  }
  const base = renderTemplate(templateKey, context);
  const subject = overrides.subject ?? base.subject;
  const html = overrides.html ?? base.html;
  const text = overrides.text ?? base.text;
  const from = overrides.from ?? getEnv("EMAIL_FROM", `IRIS <${getEnv("SUPPORT_EMAIL", "support@iris-fashion.it")}>`);
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
    return { ok: true, queued: true, outbox };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      html,
      text,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      error: payload?.message ?? payload?.error ?? "Failed to send email",
      outbox,
    };
  }
  if (outbox?.id) {
    try {
      await getSupabaseAdmin()
        .from("email_outbox")
        .update({
          status: "sent",
          provider_message_id: payload?.id ?? "",
          sent_at: new Date().toISOString(),
        })
        .eq("id", outbox.id);
    } catch {
      // best-effort logging only
    }
  }
  return { ok: true, sent: true, provider: payload?.id ?? null, outbox };
}
