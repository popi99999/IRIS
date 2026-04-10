-- ================================================================
-- IRIS — SQL da incollare nel Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/xzhgyamzfthqrcaljdqv/sql/new
-- Clicca "Run" una volta sola
-- ================================================================

-- 1. QUANTITY su listings (previene overselling)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0);

-- 2. SELLER_PROFILES
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  completed_sales integer NOT NULL DEFAULT 0,
  seller_rating numeric(3,2) DEFAULT NULL,
  payout_status text NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending','active','suspended','closed')),
  stripe_connect_account_id text DEFAULT '',
  payout_settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller_profiles_select_own" ON seller_profiles;
CREATE POLICY "seller_profiles_select_own" ON seller_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "seller_profiles_insert_own" ON seller_profiles;
CREATE POLICY "seller_profiles_insert_own" ON seller_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "seller_profiles_update_own" ON seller_profiles;
CREATE POLICY "seller_profiles_update_own" ON seller_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "seller_profiles_delete_own" ON seller_profiles;
CREATE POLICY "seller_profiles_delete_own" ON seller_profiles FOR DELETE USING (auth.uid() = user_id);

-- 3. DISPUTES
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','escalated')),
  resolution text DEFAULT '',
  evidence jsonb DEFAULT '{}',
  assigned_to uuid REFERENCES auth.users(id),
  stripe_dispute_id text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz
);
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "disputes_buyer_insert" ON disputes;
CREATE POLICY "disputes_buyer_insert" ON disputes FOR INSERT WITH CHECK (
  auth.uid() = opened_by AND
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.buyer_id = auth.uid())
);
DROP POLICY IF EXISTS "disputes_select_involved" ON disputes;
CREATE POLICY "disputes_select_involved" ON disputes FOR SELECT USING (
  auth.uid() = opened_by OR
  EXISTS (SELECT 1 FROM orders o
    JOIN listings l ON l.id::text = ANY(string_to_array(o.items_json::text, ','))
    WHERE o.id = order_id AND l.owner_id = auth.uid())
);

-- 4. CHARGEBACKS
CREATE TABLE IF NOT EXISTS chargebacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  stripe_dispute_id text NOT NULL UNIQUE,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  reason text DEFAULT '',
  status text NOT NULL DEFAULT 'needs_response',
  evidence_due_by timestamptz,
  evidence_submitted jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chargebacks ENABLE ROW LEVEL SECURITY;
-- Solo admin (service_role) può vedere e modificare
DROP POLICY IF EXISTS "chargebacks_service_role" ON chargebacks;
CREATE POLICY "chargebacks_service_role" ON chargebacks USING (false);

-- 5. ORDER_SHIPMENTS
CREATE TABLE IF NOT EXISTS order_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier text DEFAULT '',
  tracking_number text DEFAULT '',
  label_url text DEFAULT '',
  return_label_url text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','label_created','in_transit','delivered','returned','failed')),
  shippo_shipment_id text DEFAULT '',
  shippo_transaction_id text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE order_shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_shipments_select_buyer_seller" ON order_shipments;
CREATE POLICY "order_shipments_select_buyer_seller" ON order_shipments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))
);
DROP POLICY IF EXISTS "order_shipments_insert_seller" ON order_shipments;
CREATE POLICY "order_shipments_insert_seller" ON order_shipments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.seller_id = auth.uid())
);
DROP POLICY IF EXISTS "order_shipments_update_seller" ON order_shipments;
CREATE POLICY "order_shipments_update_seller" ON order_shipments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.seller_id = auth.uid())
);

-- 6. MESSAGES (per la chat)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select_participants" ON messages;
CREATE POLICY "messages_select_participants" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
);
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
);

-- 7. EMAIL_OUTBOX (per retry email transazionali)
CREATE TABLE IF NOT EXISTS email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text DEFAULT '',
  subject text DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  attempts_count integer NOT NULL DEFAULT 0,
  last_error text DEFAULT '',
  provider_message_id text DEFAULT '',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_outbox_service_role" ON email_outbox USING (false);

-- 8. INDICI per performance
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS listings_created_at_idx ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS offers_status_idx ON offers(status);
CREATE INDEX IF NOT EXISTS offers_created_at_idx ON offers(created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS email_outbox_status_idx ON email_outbox(status);
CREATE INDEX IF NOT EXISTS disputes_order_id_idx ON disputes(order_id);

-- 9. FUNZIONE per bloccare overselling (acquisto atomico)
CREATE OR REPLACE FUNCTION reserve_listing_for_purchase(p_listing_id uuid, p_buyer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_listing listings%ROWTYPE;
BEGIN
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Listing not found');
  END IF;
  IF v_listing.inventory_status = 'sold' OR v_listing.listing_status != 'published' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Listing not available');
  END IF;
  IF COALESCE(v_listing.quantity, 1) <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Out of stock');
  END IF;
  UPDATE listings SET
    quantity = GREATEST(0, COALESCE(quantity, 1) - 1),
    inventory_status = CASE WHEN COALESCE(quantity, 1) <= 1 THEN 'sold' ELSE inventory_status END,
    updated_at = now()
  WHERE id = p_listing_id;
  RETURN jsonb_build_object('ok', true, 'listing_id', p_listing_id);
END;
$$;

-- Fine — tutte le tabelle e policy create correttamente
SELECT 'IRIS DB setup completato ✓' AS status;
