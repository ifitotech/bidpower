-- BidPower — Phase 4: Supplier Pricing (Pricing Request)
--
-- Builds on the supply_quote_* foundation. A Pricing Request is what the contractor sends to Supply
-- (type Gear / Lighting / Material / Other, Bid Date = response_due_date, files, links, specs, notes).
-- It stays separate from the Customer Quote/Proposal. Supplier pricing is private to the company.
-- This migration: request fields, numbering, Material Request -> Pricing Request hand-off, permission-based
-- creation, and price visibility that follows "view costs". RLS stays enabled everywhere.

-- =====================================================
-- REQUEST FIELDS
-- =====================================================
ALTER TABLE supply_quote_requests
  ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'material'
    CHECK (request_type IN ('gear', 'lighting', 'material', 'other')),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS waiting_on TEXT NOT NULL DEFAULT 'owner'
    CHECK (waiting_on IN ('owner', 'employee', 'supplier', 'customer', 'none')),
  ADD COLUMN IF NOT EXISTS material_request_id UUID REFERENCES material_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE supply_quote_requests DROP CONSTRAINT IF EXISTS supply_quote_requests_status_check;
ALTER TABLE supply_quote_requests ADD CONSTRAINT supply_quote_requests_status_check CHECK (status IN (
  'draft', 'ready_to_send', 'sent', 'viewed', 'response_started', 'question_open', 'responded',
  'pdf_response_pending_review', 'under_review', 'accepted', 'awarded', 'declined',
  'converted_to_po', 'expired', 'cancelled', 'closed'
));

CREATE UNIQUE INDEX IF NOT EXISTS idx_supply_quote_requests_number ON supply_quote_requests(company_id, number) WHERE number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supply_quote_requests_project ON supply_quote_requests(project_id, created_at DESC);

-- Quote data the supplier gives back: quote number, total, PDF (attachment), per-line price/availability/lead time.
ALTER TABLE supplier_quote_responses
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_number TEXT,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) CHECK (total_amount IS NULL OR total_amount >= 0),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'link', 'pdf')),
  ADD COLUMN IF NOT EXISTS entered_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_response_items_unique ON supplier_quote_response_items(response_id, request_item_id);

-- Next pricing request number: PR-<year>-<00001>. Server side so two people never collide.
CREATE OR REPLACE FUNCTION next_pricing_request_number(p_company UUID)
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
  PERFORM pg_advisory_xact_lock(hashtext('pr-' || p_company::text));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^PR-' || v_year || '-', ''), number)::INTEGER), 0) + 1
    INTO v_next
  FROM supply_quote_requests
  WHERE company_id = p_company AND number LIKE 'PR-' || v_year || '-%';
  RETURN 'PR-' || v_year || '-' || lpad(v_next::text, 5, '0');
END;
$$;
REVOKE ALL ON FUNCTION next_pricing_request_number(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION next_pricing_request_number(UUID) TO authenticated;

-- =====================================================
-- CREATION BY PERMISSION (owners/managers already manage everything)
-- =====================================================
DROP POLICY IF EXISTS "Create pricing requests with permission" ON supply_quote_requests;
CREATE POLICY "Create pricing requests with permission"
  ON supply_quote_requests FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND created_by = auth.uid()
    AND status = 'draft'
    AND has_permission(company_id, 'can_create_pricing_request')
    AND (project_id IS NULL OR project_id IN (SELECT id FROM projects))
  );

DROP POLICY IF EXISTS "Edit own draft pricing requests" ON supply_quote_requests;
CREATE POLICY "Edit own draft pricing requests"
  ON supply_quote_requests FOR UPDATE
  USING (created_by = auth.uid() AND status = 'draft' AND has_permission(company_id, 'can_create_pricing_request'))
  WITH CHECK (created_by = auth.uid() AND status IN ('draft', 'cancelled') AND has_permission(company_id, 'can_create_pricing_request'));

DROP POLICY IF EXISTS "Edit lines of own draft pricing requests" ON supply_quote_request_items;
CREATE POLICY "Edit lines of own draft pricing requests"
  ON supply_quote_request_items FOR ALL
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND request_id IN (SELECT id FROM supply_quote_requests WHERE created_by = auth.uid() AND status = 'draft')
    AND has_permission(company_id, 'can_create_pricing_request')
  )
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND request_id IN (SELECT id FROM supply_quote_requests WHERE created_by = auth.uid() AND status = 'draft' AND company_id = supply_quote_request_items.company_id)
    AND has_permission(company_id, 'can_create_pricing_request')
  );

-- Someone who can create pricing requests can add a new supplier while doing it.
DROP POLICY IF EXISTS "Create suppliers with pricing permission" ON suppliers;
CREATE POLICY "Create suppliers with pricing permission"
  ON suppliers FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND created_by = auth.uid()
    AND has_permission(company_id, 'can_create_pricing_request')
  );

-- =====================================================
-- PRICE VISIBILITY: supplier prices follow "view costs"
-- =====================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['supplier_quote_responses', 'supplier_quote_response_items'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'View ' || t || ' by permission', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (company_id IN (SELECT get_user_company_ids()) AND (get_user_role(company_id) IN (''owner'', ''manager'') OR (has_permission(company_id, ''can_create_pricing_request'') AND has_permission(company_id, ''can_view_costs''))))',
      'View ' || t || ' by permission', t);
  END LOOP;
END $$;
