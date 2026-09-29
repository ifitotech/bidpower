-- BidPower — Phase 4 (part 2): secure link for Supply (no account) + questions.
--
-- The contractor creates an invitation (random token, only its sha256 is stored). The supplier opens
-- /supplier/<token> and can read that one Pricing Request, ask questions and submit one response.
-- Everything goes through SECURITY DEFINER functions that check the token; the supplier never gets a
-- database session or table access. The supplier sees only what the contractor sent: no project, no
-- customer, no other supplier's answers, no prices the contractor charges.

ALTER TABLE supplier_quote_invitations
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS supplier_email TEXT;

CREATE TABLE IF NOT EXISTS pricing_request_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES supply_quote_requests(id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES supplier_quote_invitations(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('supplier', 'contractor')),
  author_name TEXT,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pricing_questions_invitation ON pricing_request_questions(invitation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pricing_questions_request ON pricing_request_questions(request_id, created_at);
ALTER TABLE pricing_request_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View pricing questions by permission" ON pricing_request_questions;
CREATE POLICY "View pricing questions by permission"
  ON pricing_request_questions FOR SELECT
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (get_user_role(company_id) IN ('owner', 'manager') OR has_permission(company_id, 'can_create_pricing_request'))
  );

DROP POLICY IF EXISTS "Managers answer pricing questions" ON pricing_request_questions;
CREATE POLICY "Managers answer pricing questions"
  ON pricing_request_questions FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND get_user_role(company_id) IN ('owner', 'manager')
    AND author = 'contractor'
  );

CREATE INDEX IF NOT EXISTS idx_supplier_invitations_hash ON supplier_quote_invitations(token_hash);

-- ---------------------------------------------------------------------------
-- Token check shared by the public functions. Not callable by clients.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _supplier_invitation(p_token TEXT)
RETURNS supplier_quote_invitations
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT i.* FROM supplier_quote_invitations i
  WHERE p_token ~ '^[a-f0-9]{64}$'
    AND i.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    AND i.revoked_at IS NULL AND i.expires_at > NOW();
$$;
REVOKE ALL ON FUNCTION _supplier_invitation(TEXT) FROM PUBLIC, anon, authenticated;

-- What the supplier sees. NULL when the link is invalid, revoked or expired.
CREATE OR REPLACE FUNCTION supplier_get_request(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv supplier_quote_invitations%ROWTYPE;
  v_req supply_quote_requests%ROWTYPE;
  v_company TEXT;
  v_resp supplier_quote_responses%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM _supplier_invitation(p_token);
  IF v_inv.id IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO v_req FROM supply_quote_requests WHERE id = v_inv.request_id;
  SELECT name INTO v_company FROM companies WHERE id = v_req.company_id;

  UPDATE supplier_quote_invitations
     SET first_opened_at = COALESCE(first_opened_at, NOW()), last_opened_at = NOW()
   WHERE id = v_inv.id;
  IF v_inv.first_opened_at IS NULL THEN
    INSERT INTO quote_activity_log (company_id, request_id, event, metadata)
    VALUES (v_req.company_id, v_req.id, 'supplier_opened', jsonb_build_object('supplier', v_inv.supplier_name));
  END IF;

  SELECT * INTO v_resp FROM supplier_quote_responses WHERE invitation_id = v_inv.id ORDER BY created_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'company', v_company,
    'supplier_name', v_inv.supplier_name,
    'open', v_req.status IN ('sent', 'viewed', 'response_started', 'question_open', 'responded')
            AND COALESCE(v_resp.status, 'submitted') = 'submitted',
    'request', jsonb_build_object(
      'number', v_req.number, 'type', v_req.request_type, 'title', v_req.title, 'bid_date', v_req.response_due_date,
      'notes', v_req.notes, 'links', v_req.links, 'delivery_method', v_req.delivery_method, 'delivery_address', v_req.delivery_address),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'description', i.description, 'quantity', i.quantity, 'unit', i.unit, 'manufacturer', i.manufacturer,
        'catalog_number', i.catalog_number, 'notes', i.notes, 'allow_substitution', i.allow_substitution) ORDER BY i.sort_order)
      FROM supply_quote_request_items i WHERE i.request_id = v_req.id), '[]'::jsonb),
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('author', q.author, 'body', q.body, 'created_at', q.created_at) ORDER BY q.created_at)
      FROM pricing_request_questions q WHERE q.invitation_id = v_inv.id), '[]'::jsonb),
    'response', CASE WHEN v_resp.id IS NULL THEN NULL ELSE jsonb_build_object(
      'quote_number', v_resp.quote_number, 'total_amount', v_resp.total_amount, 'freight', v_resp.freight,
      'tax_amount', v_resp.tax_amount, 'expires_on', v_resp.expires_on, 'notes', v_resp.notes, 'status', v_resp.status,
      'lines', COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'request_item_id', l.request_item_id, 'unit_price', l.unit_price, 'availability', l.availability,
          'lead_time', l.lead_time, 'notes', l.notes))
        FROM supplier_quote_response_items l WHERE l.response_id = v_resp.id), '[]'::jsonb)) END
  );
END;
$$;
GRANT EXECUTE ON FUNCTION supplier_get_request(TEXT) TO anon, authenticated;

-- The supplier answers (replaces their earlier answer while it is still only "submitted").
CREATE OR REPLACE FUNCTION supplier_submit_response(p_token TEXT, p_payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv supplier_quote_invitations%ROWTYPE;
  v_req supply_quote_requests%ROWTYPE;
  v_resp UUID;
  v_line JSONB;
  v_item UUID;
  v_lines JSONB := COALESCE(p_payload -> 'lines', '[]'::jsonb);
  v_n INTEGER := 0;
  v_total NUMERIC;
  v_freight NUMERIC;
  v_tax NUMERIC;
  v_price NUMERIC;
  v_avail TEXT;
BEGIN
  SELECT * INTO v_inv FROM _supplier_invitation(p_token);
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;
  SELECT * INTO v_req FROM supply_quote_requests WHERE id = v_inv.request_id FOR UPDATE;
  IF v_req.status NOT IN ('sent', 'viewed', 'response_started', 'question_open', 'responded') THEN RAISE EXCEPTION 'request_closed'; END IF;
  IF EXISTS (SELECT 1 FROM supplier_quote_responses WHERE invitation_id = v_inv.id AND status <> 'submitted') THEN RAISE EXCEPTION 'response_locked'; END IF;
  IF jsonb_typeof(v_lines) <> 'array' OR jsonb_array_length(v_lines) > 300 THEN RAISE EXCEPTION 'invalid_payload'; END IF;

  v_total := NULLIF(p_payload ->> 'total_amount', '')::NUMERIC;
  v_freight := NULLIF(p_payload ->> 'freight', '')::NUMERIC;
  v_tax := NULLIF(p_payload ->> 'tax_amount', '')::NUMERIC;
  IF v_total < 0 OR v_total > 100000000 OR v_freight < 0 OR v_freight > 100000000 OR v_tax < 0 OR v_tax > 100000000 THEN RAISE EXCEPTION 'invalid_payload'; END IF;
  IF char_length(COALESCE(p_payload ->> 'notes', '')) > 2000 OR char_length(COALESCE(p_payload ->> 'quote_number', '')) > 60 THEN RAISE EXCEPTION 'invalid_payload'; END IF;

  -- Something must be answered: a total or at least one priced/marked line.
  IF v_total IS NULL AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_lines) e
    WHERE NULLIF(e ->> 'unit_price', '') IS NOT NULL OR NULLIF(e ->> 'availability', '') IS NOT NULL
  ) THEN RAISE EXCEPTION 'response_empty'; END IF;

  DELETE FROM supplier_quote_responses WHERE invitation_id = v_inv.id AND status = 'submitted';
  INSERT INTO supplier_quote_responses (
    company_id, request_id, invitation_id, supplier_id, supplier_name, supplier_contact_name, supplier_email,
    status, freight, tax_amount, total_amount, quote_number, expires_on, notes, source, submitted_at)
  VALUES (
    v_req.company_id, v_req.id, v_inv.id, v_inv.supplier_id,
    COALESCE(NULLIF(left(p_payload ->> 'supplier_name', 120), ''), v_inv.supplier_name, 'Supplier'),
    left(p_payload ->> 'contact_name', 120), left(COALESCE(p_payload ->> 'email', v_inv.supplier_email), 200),
    'submitted', v_freight, v_tax, v_total, NULLIF(left(p_payload ->> 'quote_number', 60), ''),
    NULLIF(p_payload ->> 'expires_on', '')::DATE, NULLIF(left(p_payload ->> 'notes', 2000), ''), 'link', NOW())
  RETURNING id INTO v_resp;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
    v_n := v_n + 1;
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
  INSERT INTO quote_activity_log (company_id, request_id, event, metadata)
  VALUES (v_req.company_id, v_req.id, 'supplier_responded', jsonb_build_object('supplier', v_inv.supplier_name));
END;
$$;
GRANT EXECUTE ON FUNCTION supplier_submit_response(TEXT, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION supplier_ask_question(p_token TEXT, p_body TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv supplier_quote_invitations%ROWTYPE;
  v_req supply_quote_requests%ROWTYPE;
  v_body TEXT := btrim(COALESCE(p_body, ''));
BEGIN
  SELECT * INTO v_inv FROM _supplier_invitation(p_token);
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invalid_link'; END IF;
  SELECT * INTO v_req FROM supply_quote_requests WHERE id = v_inv.request_id FOR UPDATE;
  IF v_req.status NOT IN ('sent', 'viewed', 'response_started', 'question_open', 'responded') THEN RAISE EXCEPTION 'request_closed'; END IF;
  IF char_length(v_body) < 1 OR char_length(v_body) > 2000 THEN RAISE EXCEPTION 'invalid_payload'; END IF;
  IF (SELECT count(*) FROM pricing_request_questions WHERE invitation_id = v_inv.id AND author = 'supplier') >= 30 THEN RAISE EXCEPTION 'too_many'; END IF;

  INSERT INTO pricing_request_questions (company_id, request_id, invitation_id, author, author_name, body)
  VALUES (v_req.company_id, v_req.id, v_inv.id, 'supplier', v_inv.supplier_name, v_body);
  IF v_req.status IN ('sent', 'viewed', 'response_started', 'question_open') THEN
    UPDATE supply_quote_requests SET status = 'question_open', waiting_on = 'owner', updated_at = NOW() WHERE id = v_req.id;
  END IF;
  INSERT INTO quote_activity_log (company_id, request_id, event, metadata)
  VALUES (v_req.company_id, v_req.id, 'supplier_question', jsonb_build_object('supplier', v_inv.supplier_name));
END;
$$;
GRANT EXECUTE ON FUNCTION supplier_ask_question(TEXT, TEXT) TO anon, authenticated;
