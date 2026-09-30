-- BidPower — Phase 6: Customer (Proposal, secure link, approval, Request Change, versions, Change Order)
--
-- The existing customer `quotes` table is the Proposal (kept separate from Supply Requests / Pricing Requests).
-- Added: waiting_on, versions, secure links (hash only, revocable, expiring), the customer's real actions
-- (name, date/time, IP as reported by the app server — no drawn/fabricated signatures), Change Requests
-- (customer -> contractor) and Change Orders (contractor -> customer). The customer never gets a database
-- session: SECURITY DEFINER functions check the token and return only what was shared. Customers never see
-- supplier pricing, POs, costs or profit. RLS stays enabled everywhere.

-- =====================================================
-- PROPOSAL (quotes): versions, waiting on, approval trace
-- =====================================================
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS waiting_on TEXT NOT NULL DEFAULT 'owner' CHECK (waiting_on IN ('owner', 'employee', 'supplier', 'customer', 'none')),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  ADD COLUMN IF NOT EXISTS supersedes_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by_name TEXT;

UPDATE quotes SET waiting_on = CASE status WHEN 'sent' THEN 'customer' WHEN 'pending' THEN 'customer' WHEN 'draft' THEN 'owner' ELSE 'none' END
 WHERE waiting_on = 'owner' AND status <> 'draft';

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check CHECK (status IN (
  'draft', 'sent', 'pending', 'changes_requested', 'approved', 'rejected', 'expired', 'cancelled', 'superseded'
));

-- Same number for every version of a Proposal (QT-2026-0001 v1, v2...).
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_company_id_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_number_version ON quotes(company_id, number, version);
CREATE INDEX IF NOT EXISTS idx_quotes_supersedes ON quotes(supersedes_id);

-- A sent Proposal is a record of what the customer saw: prices and lines only change in a new version.
CREATE OR REPLACE FUNCTION trg_quote_lock_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF OLD.status <> 'draft' AND (
       NEW.subtotal IS DISTINCT FROM OLD.subtotal OR NEW.tax_amount IS DISTINCT FROM OLD.tax_amount
    OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount OR NEW.total IS DISTINCT FROM OLD.total
    OR NEW.terms IS DISTINCT FROM OLD.terms OR NEW.notes IS DISTINCT FROM OLD.notes) THEN
    RAISE EXCEPTION 'quote_locked';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trg_quote_lock_amounts() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS quote_lock_amounts ON quotes;
CREATE TRIGGER quote_lock_amounts BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION trg_quote_lock_amounts();

CREATE OR REPLACE FUNCTION trg_quote_items_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT status INTO v_status FROM quotes WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  IF v_status IS NOT NULL AND v_status <> 'draft' THEN RAISE EXCEPTION 'quote_locked'; END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION trg_quote_items_lock() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS quote_items_lock ON quote_items;
CREATE TRIGGER quote_items_lock BEFORE INSERT OR UPDATE OR DELETE ON quote_items FOR EACH ROW EXECUTE FUNCTION trg_quote_items_lock();

CREATE OR REPLACE FUNCTION next_quote_number(p_company UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT := to_char(NOW(), 'YYYY');
  v_next INTEGER;
BEGIN
  IF p_company IS NULL OR p_company NOT IN (SELECT get_user_company_ids()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('qt-' || p_company::text));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^QT-' || v_year || '-', ''), number)::INTEGER), 0) + 1
    INTO v_next FROM quotes WHERE company_id = p_company AND number LIKE 'QT-' || v_year || '-%';
  RETURN 'QT-' || v_year || '-' || lpad(v_next::text, 4, '0');
END;
$$;
REVOKE ALL ON FUNCTION next_quote_number(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION next_quote_number(UUID) TO authenticated;

-- =====================================================
-- SECURE LINKS + WHAT THE CUSTOMER DID
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('proposal', 'change_order')),
  object_id UUID NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'approve' CHECK (scope IN ('view', 'approve')),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_links_object ON customer_links(object_type, object_id);

CREATE TABLE IF NOT EXISTS customer_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  link_id UUID REFERENCES customer_links(id) ON DELETE SET NULL,
  object_type TEXT NOT NULL,
  object_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('viewed', 'approved', 'changes_requested', 'declined')),
  customer_name TEXT,
  message TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_actions_object ON customer_actions(object_type, object_id, created_at);

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  link_id UUID REFERENCES customer_links(id) ON DELETE SET NULL,
  requested_by_name TEXT,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'converted_to_change_order', 'declined')),
  waiting_on TEXT NOT NULL DEFAULT 'owner' CHECK (waiting_on IN ('owner', 'employee', 'supplier', 'customer', 'none')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_change_requests_company ON change_requests(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_requests_quote ON change_requests(quote_id);

CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  change_request_id UUID REFERENCES change_requests(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'declined', 'cancelled')),
  waiting_on TEXT NOT NULL DEFAULT 'owner' CHECK (waiting_on IN ('owner', 'employee', 'supplier', 'customer', 'none')),
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by_name TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, number)
);
CREATE INDEX IF NOT EXISTS idx_change_orders_quote ON change_orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS change_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,   -- may be negative (credit)
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_change_order_items_co ON change_order_items(change_order_id, sort_order);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['customer_links', 'customer_actions', 'change_requests', 'change_orders', 'change_order_items'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    -- Customer prices follow the Proposal rules: Owner/Manager, or people allowed to create Proposals.
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'View ' || t || ' by permission', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (company_id IN (SELECT get_user_company_ids()) AND (get_user_role(company_id) IN (''owner'', ''manager'') OR has_permission(company_id, ''can_create_proposal'')))', 'View ' || t || ' by permission', t);
  END LOOP;
  -- Owners/managers write links, requests and change orders. Customer actions are written only by the secure functions.
  FOREACH t IN ARRAY ARRAY['customer_links', 'change_requests', 'change_orders', 'change_order_items'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Managers manage ' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN (''owner'', ''manager'')) WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN (''owner'', ''manager''))', 'Managers manage ' || t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION next_change_order_number(p_company UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT := to_char(NOW(), 'YYYY');
  v_next INTEGER;
BEGIN
  IF p_company IS NULL OR p_company NOT IN (SELECT get_user_company_ids()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('co-' || p_company::text));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^CO-' || v_year || '-', ''), number)::INTEGER), 0) + 1
    INTO v_next FROM change_orders WHERE company_id = p_company AND number LIKE 'CO-' || v_year || '-%';
  RETURN 'CO-' || v_year || '-' || lpad(v_next::text, 4, '0');
END;
$$;
REVOKE ALL ON FUNCTION next_change_order_number(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION next_change_order_number(UUID) TO authenticated;

-- New Proposal version: copies the lines, the old version is superseded and its links stop working.
CREATE OR REPLACE FUNCTION new_proposal_version(p_quote UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q quotes%ROWTYPE;
  v_new UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_q FROM quotes WHERE id = p_quote FOR UPDATE;
  IF NOT FOUND OR v_q.company_id NOT IN (SELECT get_user_company_ids()) OR get_user_role(v_q.company_id) NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_q.status NOT IN ('sent', 'pending', 'changes_requested', 'rejected', 'expired') THEN RAISE EXCEPTION 'quote_not_versionable'; END IF;

  INSERT INTO quotes (company_id, client_id, project_id, number, status, quote_type, issue_date, valid_until, subtotal, tax_amount,
                      discount_amount, total, terms, notes, created_by, version, supersedes_id, waiting_on)
  VALUES (v_q.company_id, v_q.client_id, v_q.project_id, v_q.number, 'draft', v_q.quote_type, CURRENT_DATE, v_q.valid_until, v_q.subtotal, v_q.tax_amount,
          v_q.discount_amount, v_q.total, v_q.terms, v_q.notes, auth.uid(), v_q.version + 1, v_q.id, 'owner')
  RETURNING id INTO v_new;
  INSERT INTO quote_items (quote_id, description, quantity, unit_price, amount, sort_order, part_number)
  SELECT v_new, description, quantity, unit_price, amount, sort_order, part_number FROM quote_items WHERE quote_id = p_quote;

  UPDATE quotes SET status = 'superseded', waiting_on = 'none', updated_at = NOW() WHERE id = p_quote;
  UPDATE customer_links SET revoked_at = NOW() WHERE object_type = 'proposal' AND object_id = p_quote AND revoked_at IS NULL;
  INSERT INTO quote_status_history (quote_id, from_status, to_status, changed_by, notes) VALUES (p_quote, v_q.status, 'superseded', auth.uid(), 'v' || (v_q.version + 1));
  INSERT INTO quote_status_history (quote_id, from_status, to_status, changed_by, notes) VALUES (v_new, NULL, 'draft', auth.uid(), 'v' || (v_q.version + 1));
  RETURN v_new;
END;
$$;
REVOKE ALL ON FUNCTION new_proposal_version(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION new_proposal_version(UUID) TO authenticated;

-- =====================================================
-- PUBLIC (token) FUNCTIONS FOR THE CUSTOMER
-- =====================================================
CREATE OR REPLACE FUNCTION _customer_link(p_token TEXT)
RETURNS customer_links
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT l.* FROM customer_links l
  WHERE p_token ~ '^[a-f0-9]{64}$'
    AND l.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    AND l.revoked_at IS NULL AND l.expires_at > NOW();
$$;
REVOKE ALL ON FUNCTION _customer_link(TEXT) FROM PUBLIC, anon, authenticated;

-- What the customer may see: their document, their project, the company's contact data. Nothing about
-- costs, suppliers, POs, profit or other customers.
CREATE OR REPLACE FUNCTION customer_get(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l customer_links%ROWTYPE;
  q quotes%ROWTYPE;
  co change_orders%ROWTYPE;
  v_company JSONB;
  v_project JSONB;
  v_items JSONB;
  v_doc JSONB;
  v_open BOOLEAN;
  v_can_change BOOLEAN := false;
BEGIN
  SELECT * INTO l FROM _customer_link(p_token);
  IF l.id IS NULL THEN RETURN NULL; END IF;
  UPDATE customer_links SET last_used_at = NOW() WHERE id = l.id;
  SELECT jsonb_build_object('name', c.name, 'phone', c.phone, 'email', c.email) INTO v_company FROM companies c WHERE c.id = l.company_id;

  IF l.object_type = 'proposal' THEN
    SELECT * INTO q FROM quotes WHERE id = l.object_id;
    IF q.id IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_build_object('name', p.name, 'address', p.address) INTO v_project FROM projects p WHERE p.id = q.project_id;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('description', i.description, 'quantity', i.quantity, 'unit_price', i.unit_price, 'amount', i.amount) ORDER BY i.sort_order), '[]'::jsonb)
      INTO v_items FROM quote_items i WHERE i.quote_id = q.id;
    v_open := l.scope = 'approve' AND q.status IN ('sent', 'pending') AND (q.valid_until IS NULL OR q.valid_until >= CURRENT_DATE);
    v_can_change := l.scope = 'approve' AND q.status = 'approved';
    v_doc := jsonb_build_object('number', q.number, 'version', q.version, 'status', q.status, 'issue_date', q.issue_date, 'valid_until', q.valid_until,
      'subtotal', q.subtotal, 'tax_amount', q.tax_amount, 'discount_amount', q.discount_amount, 'total', q.total, 'terms', q.terms, 'notes', q.notes,
      'approved_at', q.approved_at, 'approved_by_name', q.approved_by_name,
      'expired', q.status IN ('sent', 'pending') AND q.valid_until IS NOT NULL AND q.valid_until < CURRENT_DATE);
  ELSE
    SELECT * INTO co FROM change_orders WHERE id = l.object_id;
    IF co.id IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_build_object('name', p.name, 'address', p.address) INTO v_project FROM projects p WHERE p.id = co.project_id;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('description', i.description, 'quantity', i.quantity, 'unit_price', i.unit_price, 'amount', i.amount) ORDER BY i.sort_order), '[]'::jsonb)
      INTO v_items FROM change_order_items i WHERE i.change_order_id = co.id;
    v_open := l.scope = 'approve' AND co.status = 'sent';
    v_doc := jsonb_build_object('number', co.number, 'title', co.title, 'description', co.description, 'status', co.status, 'total', co.total,
      'approved_at', co.approved_at, 'approved_by_name', co.approved_by_name);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM customer_actions WHERE link_id = l.id AND action = 'viewed') THEN
    INSERT INTO customer_actions (company_id, link_id, object_type, object_id, action) VALUES (l.company_id, l.id, l.object_type, l.object_id, 'viewed');
  END IF;

  RETURN jsonb_build_object('kind', l.object_type, 'company', v_company, 'project', v_project, 'recipient', l.recipient_name,
    'open', v_open, 'can_request_change', v_can_change, 'doc', v_doc, 'items', v_items);
END;
$$;
GRANT EXECUTE ON FUNCTION customer_get(TEXT) TO anon, authenticated;

-- The customer acts: approve, request changes or decline. Records name, time and the IP reported by the app server.
CREATE OR REPLACE FUNCTION customer_respond(p_token TEXT, p_action TEXT, p_name TEXT, p_message TEXT, p_ip TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l customer_links%ROWTYPE;
  q quotes%ROWTYPE;
  co change_orders%ROWTYPE;
  v_name TEXT := btrim(COALESCE(p_name, ''));
  v_msg TEXT := btrim(COALESCE(p_message, ''));
  v_ip TEXT := left(NULLIF(btrim(COALESCE(p_ip, '')), ''), 64);
BEGIN
  IF p_action NOT IN ('approve', 'request_changes', 'decline') THEN RAISE EXCEPTION 'invalid_payload'; END IF;
  SELECT * INTO l FROM _customer_link(p_token);
  IF l.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;
  IF l.scope <> 'approve' THEN RAISE EXCEPTION 'view_only'; END IF;
  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN RAISE EXCEPTION 'name_required'; END IF;
  IF char_length(v_msg) > 2000 THEN RAISE EXCEPTION 'invalid_payload'; END IF;
  IF p_action = 'request_changes' AND char_length(v_msg) < 1 THEN RAISE EXCEPTION 'message_required'; END IF;

  IF l.object_type = 'proposal' THEN
    SELECT * INTO q FROM quotes WHERE id = l.object_id FOR UPDATE;
    IF q.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;

    IF p_action = 'request_changes' AND q.status = 'approved' THEN
      -- After approval a request is a Change Request; the approved Proposal stays as approved.
      INSERT INTO change_requests (company_id, project_id, quote_id, link_id, requested_by_name, message)
      VALUES (q.company_id, q.project_id, q.id, l.id, v_name, v_msg);
      INSERT INTO customer_actions (company_id, link_id, object_type, object_id, action, customer_name, message, ip)
      VALUES (q.company_id, l.id, 'proposal', q.id, 'changes_requested', v_name, v_msg, v_ip);
      RETURN;
    END IF;

    IF q.status NOT IN ('sent', 'pending') THEN RAISE EXCEPTION 'not_open'; END IF;
    IF q.valid_until IS NOT NULL AND q.valid_until < CURRENT_DATE THEN RAISE EXCEPTION 'expired'; END IF;

    IF p_action = 'approve' THEN
      UPDATE quotes SET status = 'approved', waiting_on = 'none', approved_at = NOW(), approved_by_name = v_name, updated_at = NOW() WHERE id = q.id;
      INSERT INTO quote_status_history (quote_id, from_status, to_status, changed_by, notes) VALUES (q.id, q.status, 'approved', NULL, 'Customer: ' || v_name);
      -- The approved price becomes the contract value only if none was set; an early-stage project moves to approved.
      IF q.project_id IS NOT NULL THEN
        UPDATE projects SET contract_value = CASE WHEN COALESCE(contract_value, 0) = 0 THEN q.total ELSE contract_value END,
                            status = CASE WHEN status IN ('lead', 'quoted') THEN 'approved' ELSE status END,
                            updated_at = NOW()
         WHERE id = q.project_id AND company_id = q.company_id;
      END IF;
      INSERT INTO customer_actions (company_id, link_id, object_type, object_id, action, customer_name, message, ip)
      VALUES (q.company_id, l.id, 'proposal', q.id, 'approved', v_name, NULLIF(v_msg, ''), v_ip);
    ELSIF p_action = 'request_changes' THEN
      UPDATE quotes SET status = 'changes_requested', waiting_on = 'owner', updated_at = NOW() WHERE id = q.id;
      INSERT INTO quote_status_history (quote_id, from_status, to_status, changed_by, notes) VALUES (q.id, q.status, 'changes_requested', NULL, 'Customer: ' || v_name);
      INSERT INTO change_requests (company_id, project_id, quote_id, link_id, requested_by_name, message) VALUES (q.company_id, q.project_id, q.id, l.id, v_name, v_msg);
      INSERT INTO customer_actions (company_id, link_id, object_type, object_id, action, customer_name, message, ip)
      VALUES (q.company_id, l.id, 'proposal', q.id, 'changes_requested', v_name, v_msg, v_ip);
    ELSE
      UPDATE quotes SET status = 'rejected', waiting_on = 'none', updated_at = NOW() WHERE id = q.id;
      INSERT INTO quote_status_history (quote_id, from_status, to_status, changed_by, notes) VALUES (q.id, q.status, 'rejected', NULL, 'Customer: ' || v_name);
      INSERT INTO customer_actions (company_id, link_id, object_type, object_id, action, customer_name, message, ip)
      VALUES (q.company_id, l.id, 'proposal', q.id, 'declined', v_name, NULLIF(v_msg, ''), v_ip);
    END IF;
  ELSE
    SELECT * INTO co FROM change_orders WHERE id = l.object_id FOR UPDATE;
    IF co.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;
    IF co.status <> 'sent' THEN RAISE EXCEPTION 'not_open'; END IF;
    IF p_action = 'request_changes' THEN RAISE EXCEPTION 'unsupported'; END IF;
    IF p_action = 'approve' THEN
      UPDATE change_orders SET status = 'approved', waiting_on = 'none', approved_at = NOW(), approved_by_name = v_name, updated_at = NOW() WHERE id = co.id;
      -- The approved difference (can be a credit) adjusts the contract value once.
      UPDATE projects SET contract_value = COALESCE(contract_value, 0) + co.total, updated_at = NOW() WHERE id = co.project_id AND company_id = co.company_id;
      INSERT INTO customer_actions (company_id, link_id, object_type, object_id, action, customer_name, message, ip)
      VALUES (co.company_id, l.id, 'change_order', co.id, 'approved', v_name, NULLIF(v_msg, ''), v_ip);
    ELSE
      UPDATE change_orders SET status = 'declined', waiting_on = 'none', updated_at = NOW() WHERE id = co.id;
      INSERT INTO customer_actions (company_id, link_id, object_type, object_id, action, customer_name, message, ip)
      VALUES (co.company_id, l.id, 'change_order', co.id, 'declined', v_name, NULLIF(v_msg, ''), v_ip);
    END IF;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION customer_respond(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
