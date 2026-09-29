-- BidPower — Phase 9: Supply Premium
--
-- A Supply house gets an account of its own (companies.kind = 'supply') next to the secure link that already
-- works without an account. A supply account is connected to a contractor by a single-use code the supply
-- shares; the contractor redeems it and the supplier record becomes "connected". From then on a Pricing Request
-- can be sent inside the app: it lands in the supply's inbox with its Bid Date, plans/specs are readable, the
-- supply answers or asks questions, and sees which quotes it sent and their outcome. It reuses the exact same
-- response/question logic as the secure link (one implementation), so the contractor's screens do not change.
--
-- Isolation: contractor and supply are different companies. The supply never gets table access to contractor
-- data: it only calls SECURITY DEFINER functions that check membership + an active connection + the invitation,
-- and return the same fields the secure link shows (never project, customer, other suppliers or prices charged).
-- No AI plan analysis: the supply can open the files the contractor attached, nothing more.

-- =====================================================
-- ACCOUNT TYPE
-- =====================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'contractor' CHECK (kind IN ('contractor', 'supply'));
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supply_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_supply_company ON suppliers(supply_company_id) WHERE supply_company_id IS NOT NULL;

DROP FUNCTION IF EXISTS public.create_company_with_owner(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_company_name TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_kind TEXT DEFAULT 'contractor'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_email TEXT;
  v_company UUID;
  v_plan UUID;
  v_name TEXT := btrim(coalesce(p_company_name, ''));
  v_kind TEXT := CASE WHEN p_kind = 'supply' THEN 'supply' ELSE 'contractor' END;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF v_name = '' THEN RAISE EXCEPTION 'company_name_required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_user::text));

  SELECT company_id INTO v_company FROM company_members WHERE user_id = v_user AND is_active = true ORDER BY created_at LIMIT 1;
  IF v_company IS NOT NULL THEN RETURN v_company; END IF;
  IF EXISTS (SELECT 1 FROM company_members WHERE user_id = v_user) THEN RAISE EXCEPTION 'membership_inactive'; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user;
  INSERT INTO profiles (id, full_name, email, phone)
  VALUES (v_user, NULLIF(btrim(coalesce(p_full_name, '')), ''), v_email, NULLIF(btrim(coalesce(p_phone, '')), ''))
  ON CONFLICT (id) DO UPDATE SET
    full_name = coalesce(EXCLUDED.full_name, profiles.full_name),
    email = coalesce(EXCLUDED.email, profiles.email),
    phone = coalesce(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  INSERT INTO companies (name, email, phone, kind) VALUES (v_name, v_email, NULLIF(btrim(coalesce(p_phone, '')), ''), v_kind) RETURNING id INTO v_company;
  INSERT INTO company_members (company_id, user_id, role, is_active, joined_at) VALUES (v_company, v_user, 'owner', true, NOW());
  INSERT INTO company_settings (company_id) VALUES (v_company);
  SELECT id INTO v_plan FROM plans WHERE name = 'free';
  IF v_plan IS NOT NULL THEN INSERT INTO subscriptions (company_id, plan_id, status) VALUES (v_company, v_plan, 'active'); END IF;
  INSERT INTO expense_categories (company_id, name, is_system, is_active, sort_order)
  SELECT v_company, name, true, true, ord - 1
  FROM unnest(ARRAY['Materiales', 'Herramientas', 'Combustible', 'Permisos', 'Subcontratistas', 'Equipos', 'Alquiler', 'Comidas', 'Transporte', 'Oficina', 'Otros']) WITH ORDINALITY AS c(name, ord);
  RETURN v_company;
END;
$$;
REVOKE ALL ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- CONNECTION CODES AND CONNECTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS supply_connect_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS supply_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contractor_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (supply_company_id, contractor_company_id)
);
CREATE INDEX IF NOT EXISTS idx_supply_connections_contractor ON supply_connections(contractor_company_id, status);
ALTER TABLE supply_connect_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supply managers see their codes" ON supply_connect_codes;
CREATE POLICY "Supply managers see their codes" ON supply_connect_codes FOR SELECT
  USING (supply_company_id IN (SELECT get_user_company_ids()) AND get_user_role(supply_company_id) IN ('owner', 'manager'));

DROP POLICY IF EXISTS "Either side sees the connection" ON supply_connections;
CREATE POLICY "Either side sees the connection" ON supply_connections FOR SELECT
  USING (
    (supply_company_id IN (SELECT get_user_company_ids()) AND get_user_role(supply_company_id) IN ('owner', 'manager'))
    OR (contractor_company_id IN (SELECT get_user_company_ids()) AND get_user_role(contractor_company_id) IN ('owner', 'manager'))
  );

-- The supply generates a single-use code (shown once, only its hash is stored).
CREATE OR REPLACE FUNCTION create_supply_connect_code(p_company UUID, p_label TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := encode(gen_random_bytes(12), 'hex');
BEGIN
  IF auth.uid() IS NULL OR p_company NOT IN (SELECT get_user_company_ids()) OR get_user_role(p_company) NOT IN ('owner', 'manager') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company AND kind = 'supply') THEN RAISE EXCEPTION 'not_supply'; END IF;
  INSERT INTO supply_connect_codes (supply_company_id, code_hash, label, expires_at, created_by)
  VALUES (p_company, encode(sha256(convert_to(v_code, 'UTF8')), 'hex'), left(p_label, 80), NOW() + INTERVAL '14 days', auth.uid());
  RETURN v_code;
END;
$$;
REVOKE ALL ON FUNCTION create_supply_connect_code(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_supply_connect_code(UUID, TEXT) TO authenticated;

-- The contractor redeems it: the supplier record becomes connected to that supply account.
CREATE OR REPLACE FUNCTION redeem_supply_code(p_company UUID, p_code TEXT, p_supplier_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code supply_connect_codes%ROWTYPE;
  v_supply_name TEXT;
  v_supplier UUID;
  v_conn UUID;
BEGIN
  IF auth.uid() IS NULL OR p_company NOT IN (SELECT get_user_company_ids()) OR get_user_role(p_company) NOT IN ('owner', 'manager') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company AND kind = 'contractor') THEN RAISE EXCEPTION 'not_contractor'; END IF;
  SELECT * INTO v_code FROM supply_connect_codes
   WHERE p_code ~ '^[a-f0-9]{24}$' AND code_hash = encode(sha256(convert_to(p_code, 'UTF8')), 'hex') AND used_at IS NULL AND expires_at > NOW() FOR UPDATE;
  IF v_code.id IS NULL THEN RAISE EXCEPTION 'code_invalid'; END IF;
  SELECT name INTO v_supply_name FROM companies WHERE id = v_code.supply_company_id;

  IF p_supplier_id IS NOT NULL THEN
    SELECT id INTO v_supplier FROM suppliers WHERE id = p_supplier_id AND company_id = p_company;
    IF v_supplier IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
    UPDATE suppliers SET supply_company_id = v_code.supply_company_id, updated_at = NOW() WHERE id = v_supplier;
  ELSE
    INSERT INTO suppliers (company_id, created_by, name, supply_company_id) VALUES (p_company, auth.uid(), v_supply_name, v_code.supply_company_id) RETURNING id INTO v_supplier;
  END IF;

  INSERT INTO supply_connections (supply_company_id, contractor_company_id, supplier_id, status)
  VALUES (v_code.supply_company_id, p_company, v_supplier, 'active')
  ON CONFLICT (supply_company_id, contractor_company_id) DO UPDATE SET status = 'active', revoked_at = NULL, supplier_id = EXCLUDED.supplier_id
  RETURNING id INTO v_conn;
  UPDATE supply_connect_codes SET used_at = NOW(), used_by_company_id = p_company WHERE id = v_code.id;
  RETURN v_conn;
END;
$$;
REVOKE ALL ON FUNCTION redeem_supply_code(UUID, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION redeem_supply_code(UUID, TEXT, UUID) TO authenticated;

-- Either side can end the connection; already-sent requests stay in the contractor's history.
CREATE OR REPLACE FUNCTION revoke_supply_connection(p_connection UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c supply_connections%ROWTYPE;
BEGIN
  SELECT * INTO v_c FROM supply_connections WHERE id = p_connection FOR UPDATE;
  IF v_c.id IS NULL OR auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT ((v_c.supply_company_id IN (SELECT get_user_company_ids()) AND get_user_role(v_c.supply_company_id) IN ('owner', 'manager'))
       OR (v_c.contractor_company_id IN (SELECT get_user_company_ids()) AND get_user_role(v_c.contractor_company_id) IN ('owner', 'manager'))) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE supply_connections SET status = 'revoked', revoked_at = NOW() WHERE id = p_connection;
  UPDATE suppliers SET supply_company_id = NULL WHERE id = v_c.supplier_id AND supply_company_id = v_c.supply_company_id;
END;
$$;
REVOKE ALL ON FUNCTION revoke_supply_connection(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION revoke_supply_connection(UUID) TO authenticated;

-- =====================================================
-- IN-APP INVITATIONS (no token: the supply account is the recipient)
-- =====================================================
ALTER TABLE supplier_quote_invitations ADD COLUMN IF NOT EXISTS supply_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_invitations_supply ON supplier_quote_invitations(supply_company_id, created_at DESC) WHERE supply_company_id IS NOT NULL;

CREATE OR REPLACE FUNCTION trg_invitation_supply_connection()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.supply_company_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM supply_connections c WHERE c.contractor_company_id = NEW.company_id AND c.supply_company_id = NEW.supply_company_id AND c.status = 'active'
  ) THEN
    RAISE EXCEPTION 'supply_not_connected';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trg_invitation_supply_connection() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS invitation_supply_connection ON supplier_quote_invitations;
CREATE TRIGGER invitation_supply_connection BEFORE INSERT OR UPDATE OF supply_company_id ON supplier_quote_invitations FOR EACH ROW EXECUTE FUNCTION trg_invitation_supply_connection();

ALTER TABLE supplier_quote_responses DROP CONSTRAINT IF EXISTS supplier_quote_responses_source_check;
ALTER TABLE supplier_quote_responses ADD CONSTRAINT supplier_quote_responses_source_check CHECK (source IN ('manual', 'link', 'pdf', 'supply'));

-- =====================================================
-- ONE IMPLEMENTATION FOR LINK AND ACCOUNT
-- =====================================================
CREATE OR REPLACE FUNCTION _supplier_view(v_inv supplier_quote_invitations, p_authed BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req supply_quote_requests%ROWTYPE;
  v_company TEXT;
  v_resp supplier_quote_responses%ROWTYPE;
BEGIN
  SELECT * INTO v_req FROM supply_quote_requests WHERE id = v_inv.request_id;
  SELECT name INTO v_company FROM companies WHERE id = v_req.company_id;

  UPDATE supplier_quote_invitations SET first_opened_at = COALESCE(first_opened_at, NOW()), last_opened_at = NOW() WHERE id = v_inv.id;
  IF v_inv.first_opened_at IS NULL THEN
    INSERT INTO quote_activity_log (company_id, request_id, event, metadata) VALUES (v_req.company_id, v_req.id, 'supplier_opened', jsonb_build_object('supplier', v_inv.supplier_name));
  END IF;
  SELECT * INTO v_resp FROM supplier_quote_responses WHERE invitation_id = v_inv.id ORDER BY created_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'company', v_company,
    'supplier_name', v_inv.supplier_name,
    'open', v_req.status IN ('sent', 'viewed', 'response_started', 'question_open', 'responded') AND COALESCE(v_resp.status, 'submitted') = 'submitted',
    'request', jsonb_build_object(
      'number', v_req.number, 'type', v_req.request_type, 'title', v_req.title, 'bid_date', v_req.response_due_date,
      'notes', v_req.notes, 'links', v_req.links, 'delivery_method', v_req.delivery_method, 'delivery_address', v_req.delivery_address),
    'items', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'description', i.description, 'quantity', i.quantity, 'unit', i.unit, 'manufacturer', i.manufacturer,
        'catalog_number', i.catalog_number, 'notes', i.notes, 'allow_substitution', i.allow_substitution) ORDER BY i.sort_order)
      FROM supply_quote_request_items i WHERE i.request_id = v_req.id), '[]'::jsonb),
    'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object('author', q.author, 'body', q.body, 'created_at', q.created_at) ORDER BY q.created_at)
      FROM pricing_request_questions q WHERE q.invitation_id = v_inv.id), '[]'::jsonb),
    'files', CASE WHEN p_authed THEN COALESCE((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'mime_type', a.mime_type, 'path', a.storage_path) ORDER BY a.created_at)
      FROM supplier_quote_attachments a WHERE a.request_id = v_req.id AND a.response_id IS NULL), '[]'::jsonb) ELSE '[]'::jsonb END,
    'response', CASE WHEN v_resp.id IS NULL THEN NULL ELSE jsonb_build_object(
      'quote_number', v_resp.quote_number, 'total_amount', v_resp.total_amount, 'freight', v_resp.freight,
      'tax_amount', v_resp.tax_amount, 'expires_on', v_resp.expires_on, 'notes', v_resp.notes, 'status', v_resp.status,
      'lines', COALESCE((SELECT jsonb_agg(jsonb_build_object('request_item_id', l.request_item_id, 'unit_price', l.unit_price, 'availability', l.availability, 'lead_time', l.lead_time, 'notes', l.notes))
        FROM supplier_quote_response_items l WHERE l.response_id = v_resp.id), '[]'::jsonb)) END
  );
END;
$$;
REVOKE ALL ON FUNCTION _supplier_view(supplier_quote_invitations, BOOLEAN) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _supplier_submit(v_inv supplier_quote_invitations, p_payload JSONB, p_source TEXT, p_default_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req supply_quote_requests%ROWTYPE;
  v_resp UUID;
  v_line JSONB;
  v_item UUID;
  v_lines JSONB := COALESCE(p_payload -> 'lines', '[]'::jsonb);
  v_total NUMERIC; v_freight NUMERIC; v_tax NUMERIC; v_price NUMERIC; v_avail TEXT;
BEGIN
  SELECT * INTO v_req FROM supply_quote_requests WHERE id = v_inv.request_id FOR UPDATE;
  IF v_req.status NOT IN ('sent', 'viewed', 'response_started', 'question_open', 'responded') THEN RAISE EXCEPTION 'request_closed'; END IF;
  IF EXISTS (SELECT 1 FROM supplier_quote_responses WHERE invitation_id = v_inv.id AND status <> 'submitted') THEN RAISE EXCEPTION 'response_locked'; END IF;
  IF jsonb_typeof(v_lines) <> 'array' OR jsonb_array_length(v_lines) > 300 THEN RAISE EXCEPTION 'invalid_payload'; END IF;

  v_total := NULLIF(p_payload ->> 'total_amount', '')::NUMERIC;
  v_freight := NULLIF(p_payload ->> 'freight', '')::NUMERIC;
  v_tax := NULLIF(p_payload ->> 'tax_amount', '')::NUMERIC;
  IF v_total < 0 OR v_total > 100000000 OR v_freight < 0 OR v_freight > 100000000 OR v_tax < 0 OR v_tax > 100000000 THEN RAISE EXCEPTION 'invalid_payload'; END IF;
  IF char_length(COALESCE(p_payload ->> 'notes', '')) > 2000 OR char_length(COALESCE(p_payload ->> 'quote_number', '')) > 60 THEN RAISE EXCEPTION 'invalid_payload'; END IF;
  IF v_total IS NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_lines) e WHERE NULLIF(e ->> 'unit_price', '') IS NOT NULL OR NULLIF(e ->> 'availability', '') IS NOT NULL) THEN RAISE EXCEPTION 'response_empty'; END IF;

  DELETE FROM supplier_quote_responses WHERE invitation_id = v_inv.id AND status = 'submitted';
  INSERT INTO supplier_quote_responses (company_id, request_id, invitation_id, supplier_id, supplier_name, supplier_contact_name, supplier_email,
    status, freight, tax_amount, total_amount, quote_number, expires_on, notes, source, submitted_at)
  VALUES (v_req.company_id, v_req.id, v_inv.id, v_inv.supplier_id,
    COALESCE(NULLIF(left(p_payload ->> 'supplier_name', 120), ''), NULLIF(v_inv.supplier_name, ''), p_default_name, 'Supplier'),
    left(p_payload ->> 'contact_name', 120), left(COALESCE(p_payload ->> 'email', v_inv.supplier_email), 200),
    'submitted', v_freight, v_tax, v_total, NULLIF(left(p_payload ->> 'quote_number', 60), ''),
    NULLIF(p_payload ->> 'expires_on', '')::DATE, NULLIF(left(p_payload ->> 'notes', 2000), ''), p_source, NOW())
  RETURNING id INTO v_resp;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
    v_item := NULLIF(v_line ->> 'request_item_id', '')::UUID;
    IF NOT EXISTS (SELECT 1 FROM supply_quote_request_items WHERE id = v_item AND request_id = v_req.id) THEN RAISE EXCEPTION 'invalid_payload'; END IF;
    v_price := NULLIF(v_line ->> 'unit_price', '')::NUMERIC;
    IF v_price < 0 OR v_price > 100000000 THEN RAISE EXCEPTION 'invalid_payload'; END IF;
    v_avail := NULLIF(v_line ->> 'availability', '');
    IF v_avail IS NOT NULL AND v_avail NOT IN ('available', 'partial', 'unavailable') THEN RAISE EXCEPTION 'invalid_payload'; END IF;
    IF v_price IS NULL AND v_avail IS NULL AND NULLIF(v_line ->> 'lead_time', '') IS NULL AND NULLIF(v_line ->> 'notes', '') IS NULL THEN CONTINUE; END IF;
    INSERT INTO supplier_quote_response_items (company_id, response_id, request_item_id, unit_price, availability, lead_time, notes)
    VALUES (v_req.company_id, v_resp, v_item, v_price, v_avail, NULLIF(left(v_line ->> 'lead_time', 80), ''), NULLIF(left(v_line ->> 'notes', 500), ''))
    ON CONFLICT (response_id, request_item_id) DO UPDATE SET unit_price = EXCLUDED.unit_price, availability = EXCLUDED.availability, lead_time = EXCLUDED.lead_time, notes = EXCLUDED.notes;
  END LOOP;

  UPDATE supply_quote_requests SET status = 'responded', waiting_on = 'owner', responded_at = NOW(), updated_at = NOW() WHERE id = v_req.id;
  INSERT INTO quote_activity_log (company_id, request_id, event, metadata) VALUES (v_req.company_id, v_req.id, 'supplier_responded', jsonb_build_object('supplier', v_inv.supplier_name));
END;
$$;
REVOKE ALL ON FUNCTION _supplier_submit(supplier_quote_invitations, JSONB, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _supplier_ask(v_inv supplier_quote_invitations, p_body TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req supply_quote_requests%ROWTYPE;
  v_body TEXT := btrim(COALESCE(p_body, ''));
BEGIN
  SELECT * INTO v_req FROM supply_quote_requests WHERE id = v_inv.request_id FOR UPDATE;
  IF v_req.status NOT IN ('sent', 'viewed', 'response_started', 'question_open', 'responded') THEN RAISE EXCEPTION 'request_closed'; END IF;
  IF char_length(v_body) < 1 OR char_length(v_body) > 2000 THEN RAISE EXCEPTION 'invalid_payload'; END IF;
  IF (SELECT count(*) FROM pricing_request_questions WHERE invitation_id = v_inv.id AND author = 'supplier') >= 30 THEN RAISE EXCEPTION 'too_many'; END IF;
  INSERT INTO pricing_request_questions (company_id, request_id, invitation_id, author, author_name, body) VALUES (v_req.company_id, v_req.id, v_inv.id, 'supplier', v_inv.supplier_name, v_body);
  IF v_req.status IN ('sent', 'viewed', 'response_started', 'question_open') THEN
    UPDATE supply_quote_requests SET status = 'question_open', waiting_on = 'owner', updated_at = NOW() WHERE id = v_req.id;
  END IF;
  INSERT INTO quote_activity_log (company_id, request_id, event, metadata) VALUES (v_req.company_id, v_req.id, 'supplier_question', jsonb_build_object('supplier', v_inv.supplier_name));
END;
$$;
REVOKE ALL ON FUNCTION _supplier_ask(supplier_quote_invitations, TEXT) FROM PUBLIC, anon, authenticated;

-- Secure link (unchanged behavior, now a thin wrapper).
CREATE OR REPLACE FUNCTION supplier_get_request(p_token TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv supplier_quote_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM _supplier_invitation(p_token);
  IF v_inv.id IS NULL THEN RETURN NULL; END IF;
  RETURN _supplier_view(v_inv, false);
END; $$;
CREATE OR REPLACE FUNCTION supplier_submit_response(p_token TEXT, p_payload JSONB) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv supplier_quote_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM _supplier_invitation(p_token);
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;
  PERFORM _supplier_submit(v_inv, p_payload, 'link', NULL);
END; $$;
CREATE OR REPLACE FUNCTION supplier_ask_question(p_token TEXT, p_body TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv supplier_quote_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM _supplier_invitation(p_token);
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;
  PERFORM _supplier_ask(v_inv, p_body);
END; $$;
GRANT EXECUTE ON FUNCTION supplier_get_request(TEXT), supplier_submit_response(TEXT, JSONB), supplier_ask_question(TEXT, TEXT) TO anon, authenticated;

-- =====================================================
-- SUPPLY ACCOUNT (authenticated, membership + active connection)
-- =====================================================
CREATE OR REPLACE FUNCTION _supply_invitation(p_invitation UUID)
RETURNS supplier_quote_invitations
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT i.* FROM supplier_quote_invitations i
   WHERE i.id = p_invitation AND i.revoked_at IS NULL AND i.supply_company_id IS NOT NULL AND auth.uid() IS NOT NULL
     AND i.supply_company_id IN (SELECT get_user_company_ids())
     AND get_user_role(i.supply_company_id) IN ('owner', 'manager')
     AND EXISTS (SELECT 1 FROM companies c WHERE c.id = i.supply_company_id AND c.kind = 'supply')
     AND EXISTS (SELECT 1 FROM supply_connections sc WHERE sc.supply_company_id = i.supply_company_id AND sc.contractor_company_id = i.company_id AND sc.status = 'active');
$$;
REVOKE ALL ON FUNCTION _supply_invitation(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION supply_get_request(p_invitation UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv supplier_quote_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM _supply_invitation(p_invitation);
  IF v_inv.id IS NULL THEN RETURN NULL; END IF;
  RETURN _supplier_view(v_inv, true);
END; $$;
CREATE OR REPLACE FUNCTION supply_submit_response(p_invitation UUID, p_payload JSONB) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv supplier_quote_invitations%ROWTYPE; v_name TEXT;
BEGIN
  SELECT * INTO v_inv FROM _supply_invitation(p_invitation);
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;
  SELECT name INTO v_name FROM companies WHERE id = v_inv.supply_company_id;
  PERFORM _supplier_submit(v_inv, p_payload, 'supply', v_name);
END; $$;
CREATE OR REPLACE FUNCTION supply_ask_question(p_invitation UUID, p_body TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv supplier_quote_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM _supply_invitation(p_invitation);
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;
  PERFORM _supplier_ask(v_inv, p_body);
END; $$;
REVOKE ALL ON FUNCTION supply_get_request(UUID), supply_submit_response(UUID, JSONB), supply_ask_question(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION supply_get_request(UUID), supply_submit_response(UUID, JSONB), supply_ask_question(UUID, TEXT) TO authenticated;

-- Inbox: incoming Pricing Requests with Bid Date and the supply's own quote status.
CREATE OR REPLACE FUNCTION supply_inbox(p_company UUID)
RETURNS TABLE (
  invitation_id UUID, contractor_name TEXT, request_number TEXT, title TEXT, request_type TEXT, bid_date DATE, request_status TEXT,
  item_count BIGINT, received_at TIMESTAMPTZ, opened_at TIMESTAMPTZ, response_status TEXT, quote_number TEXT, quote_total NUMERIC, question_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT i.id, c.name, r.number, r.title, r.request_type, r.response_due_date, r.status,
         (SELECT count(*) FROM supply_quote_request_items x WHERE x.request_id = r.id),
         i.created_at, i.first_opened_at,
         resp.status, resp.quote_number, resp.total_amount,
         (SELECT count(*) FROM pricing_request_questions q WHERE q.invitation_id = i.id AND q.author = 'supplier')
    FROM supplier_quote_invitations i
    JOIN supply_quote_requests r ON r.id = i.request_id
    JOIN companies c ON c.id = i.company_id
    LEFT JOIN LATERAL (SELECT s.status, s.quote_number, s.total_amount FROM supplier_quote_responses s WHERE s.invitation_id = i.id ORDER BY s.created_at DESC LIMIT 1) resp ON true
   WHERE i.supply_company_id = p_company AND i.revoked_at IS NULL AND r.status <> 'draft'
     AND auth.uid() IS NOT NULL AND p_company IN (SELECT get_user_company_ids()) AND get_user_role(p_company) IN ('owner', 'manager')
     AND EXISTS (SELECT 1 FROM supply_connections sc WHERE sc.supply_company_id = p_company AND sc.contractor_company_id = i.company_id AND sc.status = 'active')
   ORDER BY (r.response_due_date IS NULL), r.response_due_date, i.created_at DESC;
$$;
REVOKE ALL ON FUNCTION supply_inbox(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION supply_inbox(UUID) TO authenticated;

-- Contractor accounts connected to this supply, with activity counters (no contractor data beyond the name).
CREATE OR REPLACE FUNCTION supply_contractors(p_company UUID)
RETURNS TABLE (connection_id UUID, contractor_name TEXT, status TEXT, connected_at TIMESTAMPTZ, requests_received BIGINT, quotes_sent BIGINT, quotes_awarded BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT sc.id, c.name, sc.status, sc.created_at,
         (SELECT count(*) FROM supplier_quote_invitations i WHERE i.supply_company_id = sc.supply_company_id AND i.company_id = sc.contractor_company_id AND i.revoked_at IS NULL),
         (SELECT count(*) FROM supplier_quote_responses s JOIN supplier_quote_invitations i ON i.id = s.invitation_id WHERE i.supply_company_id = sc.supply_company_id AND i.company_id = sc.contractor_company_id),
         (SELECT count(*) FROM supplier_quote_responses s JOIN supplier_quote_invitations i ON i.id = s.invitation_id WHERE i.supply_company_id = sc.supply_company_id AND i.company_id = sc.contractor_company_id AND s.status = 'accepted')
    FROM supply_connections sc JOIN companies c ON c.id = sc.contractor_company_id
   WHERE sc.supply_company_id = p_company AND auth.uid() IS NOT NULL AND p_company IN (SELECT get_user_company_ids()) AND get_user_role(p_company) IN ('owner', 'manager')
   ORDER BY c.name;
$$;
REVOKE ALL ON FUNCTION supply_contractors(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION supply_contractors(UUID) TO authenticated;

-- Plans/specs the contractor attached to the request are readable by the supply that received it (and nobody else).
CREATE OR REPLACE FUNCTION supply_can_read_file(p_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM supplier_quote_attachments a
      JOIN supplier_quote_invitations i ON i.request_id = a.request_id
     WHERE a.storage_path = p_path AND a.response_id IS NULL
       AND i.revoked_at IS NULL AND i.supply_company_id IS NOT NULL
       AND i.supply_company_id IN (SELECT get_user_company_ids())
       AND get_user_role(i.supply_company_id) IN ('owner', 'manager')
       AND EXISTS (SELECT 1 FROM supply_connections sc WHERE sc.supply_company_id = i.supply_company_id AND sc.contractor_company_id = i.company_id AND sc.status = 'active')
  );
$$;
REVOKE ALL ON FUNCTION supply_can_read_file(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION supply_can_read_file(TEXT) TO authenticated;

DROP POLICY IF EXISTS "Supply reads request files" ON storage.objects;
CREATE POLICY "Supply reads request files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.supply_can_read_file(name));
