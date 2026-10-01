-- BidPower — An employee must hand in the receipt (photo) of what they bought before buying more.
-- Rule: an employee with 2 or more of their own purchase orders still waiting for the receipt cannot create another one.
-- Owners and managers are never blocked. Enforced here so it holds for every client, not only the app.

CREATE OR REPLACE FUNCTION trg_po_block_pending_receipts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending INT;
BEGIN
  IF auth.uid() IS NULL OR NEW.created_by IS DISTINCT FROM auth.uid() THEN RETURN NEW; END IF;
  IF get_user_role(NEW.company_id) IS DISTINCT FROM 'employee' THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_pending FROM purchase_orders
   WHERE company_id = NEW.company_id AND created_by = auth.uid() AND status IN ('pending_document', 'received');
  IF v_pending >= 2 THEN RAISE EXCEPTION 'pending_receipts'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trg_po_block_pending_receipts() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS po_block_pending_receipts ON purchase_orders;
CREATE TRIGGER po_block_pending_receipts BEFORE INSERT ON purchase_orders FOR EACH ROW EXECUTE FUNCTION trg_po_block_pending_receipts();
