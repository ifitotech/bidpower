-- BidPower — PO logistics: when is the material expected?
-- The Owner/Manager (or whoever may send POs) sets the expected delivery date on an approved or sent PO.
-- It feeds Needs Attention (late / due today / due tomorrow) and the PO screens. No status rule changes.

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery DATE;
CREATE INDEX IF NOT EXISTS idx_po_expected_delivery ON purchase_orders(company_id, expected_delivery) WHERE expected_delivery IS NOT NULL;
