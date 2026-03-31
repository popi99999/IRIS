# IRIS Backend Blueprint

## Database tables

### users
- id
- email
- password_hash
- role
- email_verified_at
- full_name
- city
- country
- bio
- created_at
- updated_at

### seller_profiles
- id
- user_id
- display_name
- payout_provider
- payout_account_id
- payout_status
- vat_number
- created_at
- updated_at

### listings
- id
- seller_id
- title
- brand
- category
- condition
- price_amount
- currency
- inventory_status
- moderation_status
- created_at
- updated_at

### listing_images
- id
- listing_id
- storage_path
- width
- height
- sort_order

### orders
- id
- order_number
- buyer_id
- status
- payment_status
- payout_status
- subtotal_amount
- shipping_amount
- total_amount
- currency
- shipping_name
- shipping_address
- shipping_city
- shipping_country
- shipping_note
- carrier
- tracking_number
- shipped_at
- delivered_at
- created_at
- updated_at

### order_items
- id
- order_id
- listing_id
- seller_id
- quantity
- unit_amount
- line_status

### payments
- id
- order_id
- provider
- provider_payment_intent_id
- provider_charge_id
- status
- amount
- fee_amount
- receipt_number
- raw_payload
- created_at

### notifications
- id
- user_id nullable
- audience
- kind
- title
- body
- link
- read_at
- created_at

### email_outbox
- id
- template_key
- recipient_email
- subject
- html_body
- text_body
- status
- provider_message_id
- related_order_id nullable
- related_ticket_id nullable
- attempts_count
- last_error nullable
- created_at
- sent_at nullable

### support_tickets
- id
- order_id nullable
- buyer_id
- seller_id nullable
- status
- reason
- priority
- created_at
- updated_at

### support_messages
- id
- ticket_id
- author_user_id nullable
- author_role
- message
- attachment_url nullable
- created_at

### reviews
- id
- order_id
- seller_id
- buyer_id
- rating
- body
- status
- created_at

## API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`

### Listings
- `GET /api/listings`
- `GET /api/listings/:id`
- `POST /api/listings`
- `PATCH /api/listings/:id`
- `POST /api/listings/:id/images`
- `POST /api/listings/:id/publish`
- `POST /api/listings/:id/archive`

### Checkout / Orders
- `POST /api/checkout/session`
- `POST /api/orders`
- `GET /api/orders/:id`
- `GET /api/me/orders`
- `GET /api/me/seller/orders`
- `POST /api/orders/:id/ship`
- `POST /api/orders/:id/confirm-delivery`
- `POST /api/orders/:id/refund`

### Payments
- `POST /api/payments/webhooks/stripe`
- `POST /api/payments/:id/refund`
- `POST /api/payouts/:sellerId/release`

### Messaging / Offers
- `GET /api/conversations`
- `POST /api/conversations/:id/messages`
- `POST /api/offers`
- `POST /api/offers/:id/accept`
- `POST /api/offers/:id/reject`

### Support
- `POST /api/support/tickets`
- `GET /api/support/tickets`
- `GET /api/support/tickets/:id`
- `POST /api/support/tickets/:id/messages`
- `POST /api/support/tickets/:id/resolve`

### Admin
- `GET /api/admin/orders`
- `GET /api/admin/users`
- `GET /api/admin/listings`
- `GET /api/admin/tickets`
- `PATCH /api/admin/listings/:id/moderation`
- `PATCH /api/admin/settings/fees`

## Required backend triggers

- user registered -> queue welcome + verify email + admin registration alert
- listing published -> queue admin listing alert
- checkout paid -> persist order, reserve inventory, queue buyer/seller/admin emails
- seller shipped order -> update shipping, queue buyer email + notifications
- buyer confirmed delivery -> queue seller payout eligibility
- support ticket opened -> queue admin + buyer emails

## Deployment note

The current GitHub Pages deployment cannot host these APIs. Move runtime to a backend-capable platform before go-live.
