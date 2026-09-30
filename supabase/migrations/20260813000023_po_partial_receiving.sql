-- BidPower — PO logistics: partial receiving.
-- People on site record how much of each line arrived (received_quantity). The PO status is unchanged; "Mark as received"
-- stays the decision that closes the delivery. Lines are otherwise read-only: a trigger blocks any change except received_quantity.

ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS received_quantity NUMERIC(12,2) NOT NULL DEFAULT 0;
DO $$ BEGIN
  ALTER TABLE purchase_order_items ADD CONSTRAINT po_items_received_range CHECK (received_quantity >= 0 AND received_quantity <= quantity);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION trg_po_items_receive_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.company_id IS DISTINCT FROM OLD.company_id OR NEW.purchase_order_id IS DISTINCT FROM OLD.purchase_order_id
     OR NEW.request_item_id IS DISTINCT FROM OLD.request_item_id OR NEW.material_id IS DISTINCT FROM OLD.material_id OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.quantity IS DISTINCT FROM OLD.quantity OR NEW.unit IS DISTINCT FROM OLD.unit OR NEW.unit_price IS DISTINCT FROM OLD.unit_price
     OR NEW.lead_time IS DISTINCT FROM OLD.lead_time OR NEW.sort_order IS DISTINCT FROM OLD.sort_order THEN
    RAISE EXCEPTION 'po_items_locked';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trg_po_items_receive_only() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS po_items_receive_only ON purchase_order_items;
CREATE TRIGGER po_items_receive_only BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION trg_po_items_receive_only();

-- Whoever can see the PO can record what arrived, only while the PO waits for delivery.
DROP POLICY IF EXISTS "Record received quantities" ON purchase_order_items;
CREATE POLICY "Record received quantities" ON purchase_order_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM purchase_orders p WHERE p.id = purchase_order_items.purchase_order_id AND p.company_id = purchase_order_items.company_id AND p.status IN ('approved', 'sent')))
  WITH CHECK (EXISTS (SELECT 1 FROM purchase_orders p WHERE p.id = purchase_order_items.purchase_order_id AND p.company_id = purchase_order_items.company_id AND p.status IN ('approved', 'sent')));
