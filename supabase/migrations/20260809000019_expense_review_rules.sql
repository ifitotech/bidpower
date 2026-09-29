-- BidPower — Expense integrity (feeds project actual cost)
--
-- Project actual cost only counts approved/reimbursed expenses. An Employee's expense therefore starts as
-- "pending_review" and an Owner/Manager approves or rejects it; Owner/Manager expenses are approved on entry.
-- The rules live in the database so they cannot be skipped from the client. The cost of a completed PO
-- (complete_purchase_order) is already approved because it went through the PO approval/limit rules.

DROP POLICY IF EXISTS "Creators edit own pending expenses" ON expenses;
CREATE POLICY "Creators edit own pending expenses"
  ON expenses FOR UPDATE
  USING (created_by = auth.uid() AND status = 'pending_review')
  WITH CHECK (created_by = auth.uid() AND status IN ('pending_review', 'cancelled'));

CREATE OR REPLACE FUNCTION trg_expense_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_manager BOOLEAN;
  v_po_flow BOOLEAN := COALESCE(current_setting('bidpower.po_complete', true), '') = 'on';
BEGIN
  IF auth.uid() IS NULL OR v_po_flow THEN RETURN NEW; END IF;
  v_manager := get_user_role(NEW.company_id) IN ('owner', 'manager');
  IF TG_OP = 'INSERT' THEN
    IF NOT v_manager THEN NEW.status := 'pending_review'; END IF;
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN RAISE EXCEPTION 'expense_invalid_amount'; END IF;
    RETURN NEW;
  END IF;
  IF NOT v_manager THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT (OLD.status = 'pending_review' AND NEW.status = 'cancelled') THEN
      RAISE EXCEPTION 'expense_needs_manager';
    END IF;
    IF OLD.status <> 'pending_review' AND (NEW.amount IS DISTINCT FROM OLD.amount OR NEW.project_id IS DISTINCT FROM OLD.project_id) THEN
      RAISE EXCEPTION 'expense_locked';
    END IF;
  END IF;
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN RAISE EXCEPTION 'expense_invalid_amount'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trg_expense_rules() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS expense_rules ON expenses;
CREATE TRIGGER expense_rules BEFORE INSERT OR UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION trg_expense_rules();

-- The PO cost expense is inserted while the completion flag is still on (so it stays approved), then the flag is cleared.
CREATE OR REPLACE FUNCTION complete_purchase_order(p_po UUID, p_final NUMERIC, p_tax NUMERIC DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_manager BOOLEAN;
  v_category UUID;
  v_expense UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po FOR UPDATE;
  IF NOT FOUND OR v_po.company_id NOT IN (SELECT get_user_company_ids()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  v_manager := get_user_role(v_po.company_id) IN ('owner', 'manager');
  IF NOT v_manager AND NOT (v_po.created_by = auth.uid() AND po_within_limit(v_po.company_id, p_final)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_po.status NOT IN ('document_uploaded', 'pending_review') THEN RAISE EXCEPTION 'po_transition_invalid'; END IF;
  IF p_final IS NULL OR p_final < 0 OR p_final > 100000000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF p_tax IS NOT NULL AND (p_tax < 0 OR p_tax > p_final) THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF NOT EXISTS (SELECT 1 FROM documents d WHERE d.related_type = 'purchase_order' AND d.related_id = p_po) THEN
    RAISE EXCEPTION 'po_needs_document';
  END IF;

  SELECT id INTO v_category FROM expense_categories
   WHERE company_id = v_po.company_id AND is_active
   ORDER BY (lower(name) = lower(COALESCE(v_po.category, ''))) DESC,
            (lower(name) IN ('materiales', 'materials')) DESC, sort_order, name
   LIMIT 1;
  IF v_category IS NULL THEN RAISE EXCEPTION 'no_expense_category'; END IF;

  PERFORM set_config('bidpower.po_complete', 'on', true);
  UPDATE purchase_orders
     SET status = 'completed', final_amount = p_final, tax_amount = COALESCE(p_tax, tax_amount),
         completed_at = NOW(), updated_at = NOW(), waiting_on = 'none'
   WHERE id = p_po;

  INSERT INTO expenses (company_id, project_id, purchase_order_id, created_by, vendor_name, category_id, amount, tax_amount, notes, status)
  VALUES (v_po.company_id, v_po.project_id, p_po, auth.uid(), v_po.vendor_name, v_category, p_final, COALESCE(p_tax, 0), 'PO ' || v_po.number, 'approved')
  RETURNING id INTO v_expense;
  PERFORM set_config('bidpower.po_complete', 'off', true);

  INSERT INTO purchase_order_status_history (purchase_order_id, from_status, to_status, changed_by, notes)
  VALUES (p_po, v_po.status, 'completed', auth.uid(), NULL);
  RETURN v_expense;
END;
$$;
REVOKE ALL ON FUNCTION complete_purchase_order(UUID, NUMERIC, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION complete_purchase_order(UUID, NUMERIC, NUMERIC) TO authenticated;
