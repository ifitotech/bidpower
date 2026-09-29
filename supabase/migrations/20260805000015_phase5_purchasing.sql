-- BidPower — Phase 5: Purchasing
--
-- Supplier response -> Purchase Order -> approval -> sent -> received -> receipt/invoice/packing slip
-- (mandatory) -> completed with actual cost. Extends the existing PO status machine (po-status.ts);
-- nothing is rewritten. Rules are enforced in the database so they cannot be skipped from the client:
--   * over the person's PO limit the PO waits for approval (Owner/Manager) instead of being blocked
--   * only Owner/Manager approve; sending needs can_send_po; approving cannot be done by the creator's own update
--   * completing needs a document and goes through complete_purchase_order(), which also records the actual
--     cost as a project expense (one expense per PO)
-- RLS stays enabled everywhere.

-- =====================================================
-- PO FIELDS AND STATUSES
-- =====================================================
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pricing_request_id UUID REFERENCES supply_quote_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_response_id UUID REFERENCES supplier_quote_responses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS waiting_on TEXT NOT NULL DEFAULT 'none'
    CHECK (waiting_on IN ('owner', 'employee', 'supplier', 'customer', 'none')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_note TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS freight NUMERIC(12,2) CHECK (freight IS NULL OR freight >= 0),
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) CHECK (tax_amount IS NULL OR tax_amount >= 0);

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check CHECK (status IN (
  'open', 'pending_approval', 'approved', 'rejected', 'sent', 'received',
  'pending_document', 'document_uploaded', 'pending_review',
  'completed', 'cancelled', 'exception_requested', 'exception_approved', 'exception_rejected'
));

CREATE INDEX IF NOT EXISTS idx_po_project ON purchase_orders(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_po_pricing_request ON purchase_orders(pricing_request_id);

-- One PO per awarded supplier response.
CREATE UNIQUE INDEX IF NOT EXISTS idx_po_one_per_response ON purchase_orders(supplier_response_id)
  WHERE supplier_response_id IS NOT NULL AND status <> 'cancelled';

-- Lines keep the origin (request line) so cost can be traced back to what was asked for.
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  request_item_id UUID REFERENCES supply_quote_request_items(id) ON DELETE SET NULL,
  material_id UUID REFERENCES company_materials(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'EA',
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  lead_time TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id, sort_order);
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Lines follow the PO's own visibility (RLS on purchase_orders applies inside the subquery).
CREATE POLICY "View PO items of visible POs"
  ON purchase_order_items FOR SELECT
  USING (purchase_order_id IN (SELECT id FROM purchase_orders));

CREATE POLICY "Add items to own or managed open PO"
  ON purchase_order_items FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND purchase_order_id IN (
      SELECT id FROM purchase_orders p
      WHERE p.company_id = purchase_order_items.company_id
        AND p.status IN ('pending_approval', 'approved', 'pending_document', 'open')
        AND (p.created_by = auth.uid() OR get_user_role(p.company_id) IN ('owner', 'manager'))
    )
  );

-- Document kind: what the paper is (receipt / invoice / packing slip).
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS document_kind TEXT CHECK (document_kind IN ('receipt', 'invoice', 'packing_slip', 'other'));

-- Receipts of a PO show costs: they follow the visibility of the PO itself.
DROP POLICY IF EXISTS "Members can view documents" ON documents;
CREATE POLICY "View documents by related record"
  ON documents FOR SELECT
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (related_type <> 'purchase_order' OR related_id IN (SELECT id FROM purchase_orders))
  );

-- =====================================================
-- NUMBERING (server side, no collisions)
-- =====================================================
CREATE OR REPLACE FUNCTION next_purchase_order_number(p_company UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT := to_char(NOW(), 'YYYY');
  v_next INTEGER;
BEGIN
  IF p_company IS NULL OR p_company NOT IN (SELECT get_user_company_ids()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('po-' || p_company::text));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^PO-' || v_year || '-', ''), number)::INTEGER), 0) + 1
    INTO v_next
  FROM purchase_orders
  WHERE company_id = p_company AND number LIKE 'PO-' || v_year || '-%';
  RETURN 'PO-' || v_year || '-' || lpad(v_next::text, 5, '0');
END;
$$;
REVOKE ALL ON FUNCTION next_purchase_order_number(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION next_purchase_order_number(UUID) TO authenticated;

-- =====================================================
-- CREATION: over the limit means "waits for approval", not "blocked"
-- =====================================================
DROP POLICY IF EXISTS "Create POs within permission and limit" ON purchase_orders;
CREATE POLICY "Create POs within permission and limit"
  ON purchase_orders FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND created_by = auth.uid()
    AND project_id IN (SELECT id FROM projects)
    AND has_permission(company_id, 'can_create_po')
    AND (
      (po_within_limit(company_id, estimated_amount) AND status IN ('open', 'pending_document', 'approved'))
      OR status = 'pending_approval'
    )
  );

-- =====================================================
-- STATUS RULES IN THE DATABASE
-- =====================================================
CREATE OR REPLACE FUNCTION trg_enforce_po_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_manager BOOLEAN;
  v_allowed BOOLEAN;
BEGIN
  -- Server-side maintenance (no signed-in user) is not restricted here; clients always have a user.
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  v_manager := get_user_role(NEW.company_id) IN ('owner', 'manager');

  -- Money fields cannot be edited around the approval: after approval only managers change them.
  IF NOT v_manager AND OLD.status NOT IN ('pending_approval', 'open', 'pending_document') THEN
    IF NEW.estimated_amount IS DISTINCT FROM OLD.estimated_amount OR NEW.vendor_name IS DISTINCT FROM OLD.vendor_name THEN
      RAISE EXCEPTION 'po_locked';
    END IF;
  END IF;
  IF NOT v_manager AND NEW.final_amount IS DISTINCT FROM OLD.final_amount AND COALESCE(current_setting('bidpower.po_complete', true), '') <> 'on' THEN
    RAISE EXCEPTION 'po_locked';
  END IF;
  -- An edit that pushes a waiting PO over the person's limit keeps it waiting for approval.
  IF NOT v_manager AND OLD.status = 'pending_approval' AND NEW.status = 'pending_approval' THEN RETURN NEW; END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  v_allowed := CASE OLD.status
    WHEN 'open' THEN NEW.status IN ('pending_document', 'cancelled')
    WHEN 'pending_approval' THEN NEW.status IN ('approved', 'rejected', 'cancelled')
    WHEN 'rejected' THEN NEW.status IN ('pending_approval', 'cancelled')
    WHEN 'approved' THEN NEW.status IN ('sent', 'received', 'cancelled')
    WHEN 'sent' THEN NEW.status IN ('received', 'cancelled')
    WHEN 'received' THEN NEW.status IN ('pending_document', 'document_uploaded')
    WHEN 'pending_document' THEN NEW.status IN ('document_uploaded', 'exception_requested', 'cancelled')
    WHEN 'document_uploaded' THEN NEW.status IN ('pending_review', 'completed', 'cancelled')
    WHEN 'pending_review' THEN NEW.status IN ('completed', 'pending_document', 'cancelled')
    WHEN 'exception_requested' THEN NEW.status IN ('exception_approved', 'exception_rejected', 'pending_document')
    WHEN 'exception_rejected' THEN NEW.status IN ('pending_document', 'cancelled')
    WHEN 'exception_approved' THEN NEW.status IN ('cancelled')
    ELSE false
  END;
  IF NOT v_allowed THEN RAISE EXCEPTION 'po_transition_invalid'; END IF;

  IF NEW.status IN ('approved', 'rejected', 'exception_approved', 'exception_rejected') AND OLD.status IN ('pending_approval', 'exception_requested') AND NOT v_manager THEN
    RAISE EXCEPTION 'po_needs_manager';
  END IF;
  -- Coming back from a rejection to "waiting" is the creator's resubmission; anything else out of rejected is managers.
  IF NEW.status = 'sent' AND NOT (v_manager OR has_permission(NEW.company_id, 'can_send_po')) THEN
    RAISE EXCEPTION 'po_needs_send_permission';
  END IF;
  IF NEW.status = 'document_uploaded' AND NOT EXISTS (
    SELECT 1 FROM documents d WHERE d.related_type = 'purchase_order' AND d.related_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'po_needs_document';
  END IF;
  IF NEW.status = 'completed' AND COALESCE(current_setting('bidpower.po_complete', true), '') <> 'on' THEN
    RAISE EXCEPTION 'po_complete_via_function';
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status IN ('sent', 'approved') AND NOT v_manager THEN
    RAISE EXCEPTION 'po_needs_manager';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trg_enforce_po_rules() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_po_rules ON purchase_orders;
CREATE TRIGGER enforce_po_rules BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION trg_enforce_po_rules();

-- Completion: requires a receipt/invoice/packing slip, records the actual cost once as a project expense.
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
  -- Managers complete any PO. The creator completes their own only within their PO limit.
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
  PERFORM set_config('bidpower.po_complete', 'off', true);

  INSERT INTO expenses (company_id, project_id, purchase_order_id, created_by, vendor_name, category_id, amount, tax_amount, notes, status)
  VALUES (v_po.company_id, v_po.project_id, p_po, auth.uid(), v_po.vendor_name, v_category, p_final, COALESCE(p_tax, 0), 'PO ' || v_po.number, 'approved')
  RETURNING id INTO v_expense;

  INSERT INTO purchase_order_status_history (purchase_order_id, from_status, to_status, changed_by, notes)
  VALUES (p_po, v_po.status, 'completed', auth.uid(), NULL);
  RETURN v_expense;
END;
$$;
REVOKE ALL ON FUNCTION complete_purchase_order(UUID, NUMERIC, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION complete_purchase_order(UUID, NUMERIC, NUMERIC) TO authenticated;

-- One expense per PO (the actual cost), never two.
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_one_per_po ON expenses(purchase_order_id)
  WHERE purchase_order_id IS NOT NULL AND status <> 'cancelled';
