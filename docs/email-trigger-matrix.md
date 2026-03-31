# IRIS Email Trigger Matrix

| Template key | Trigger | Recipient | Subject | Base content | Backend send point |
| --- | --- | --- | --- | --- | --- |
| `welcome-user` | successful registration | end user | `Benvenuta su IRIS` | welcome, account summary, next steps | `POST /api/auth/register` after user insert |
| `verify-account` | registration | end user | `Verifica il tuo account IRIS` | verification CTA and expiry | `POST /api/auth/register` after token creation |
| `order-buyer` | paid checkout | buyer | `Ordine ricevuto {order_number}` | order received, items, shipping address | `POST /api/orders` after DB commit |
| `payment-confirmed` | payment capture succeeded | buyer | `Pagamento confermato {order_number}` | payment success, receipt number | Stripe webhook handler |
| `order-receipt` | payment capture succeeded | buyer | `Ricevuta ordine {order_number}` | order summary, amounts, legal info | Stripe webhook handler |
| `order-admin` | new paid order | owner/admin | `Nuovo ordine marketplace` | buyer, total, seller breakdown | Stripe webhook handler |
| `item-sold-seller` | new paid order | seller | `Articolo venduto su IRIS` | sold item, ship-by deadline | Stripe webhook handler |
| `new-message` | new conversation message | counterparty | `Nuovo messaggio su IRIS` | message preview, CTA to inbox | `POST /api/conversations/:id/messages` |
| `new-offer` | new offer created | seller | `Nuova offerta ricevuta` | offer amount, item, CTA | `POST /api/offers` |
| `item-shipped` | seller ships order | buyer | `Ordine spedito {order_number}` | carrier, tracking, delivery ETA | `POST /api/orders/:id/ship` |
| `support-request` | support/dispute ticket opened | support/admin | `Nuova richiesta supporto` | order id, buyer, reason, message | `POST /api/support/tickets` |
| `issue-reported` | support/dispute ticket opened | buyer | `Segnalazione problema ordine` | ticket created, SLA, next steps | `POST /api/support/tickets` |
| `admin-new-user` | new registration | owner/admin | `Nuovo utente registrato` | email, role, acquisition source | `POST /api/auth/register` |
| `admin-new-listing` | listing published | owner/admin | `Nuovo annuncio creato` | seller, brand, price, moderation link | `POST /api/listings/:id/publish` |
| `admin-new-dispute` | dispute flagged | owner/admin | `Nuova disputa da gestire` | order, parties, severity, link | `POST /api/support/tickets` when reason is dispute |

## Template file paths to create server-side

- `emails/welcome-user.html`
- `emails/verify-account.html`
- `emails/order-buyer.html`
- `emails/payment-confirmed.html`
- `emails/order-receipt.html`
- `emails/order-admin.html`
- `emails/item-sold-seller.html`
- `emails/new-message.html`
- `emails/new-offer.html`
- `emails/item-shipped.html`
- `emails/support-request.html`
- `emails/issue-reported.html`
- `emails/admin-new-user.html`
- `emails/admin-new-listing.html`
- `emails/admin-new-dispute.html`
