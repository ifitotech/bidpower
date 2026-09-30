-- BidPower — Phase 8: Electrical Intelligence (manual takeoff, PRELIMINARY)
--
-- No plan is "read" by software here and nothing is inferred by AI. A person uploads plans and enters what
-- they count or measure: fixture/device/gear counts by type, panel schedules with circuits and breakers,
-- feeders with lengths. BidPower only adds it up (breaker counts, wire/conduit lengths with an editable
-- waste factor) into a preliminary material list, always marked PRELIMINARY until an Owner/Manager marks it
-- verified. Any edit after verification returns it to draft. Prices never appear here.
-- RLS: Owner/Manager, or people allowed to create Pricing Requests, on projects they can see.

-- Plans are stored as documents related to the takeoff.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_related_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_related_type_check CHECK (related_type IN (
  'project', 'quote', 'purchase_order', 'expense', 'client', 'company', 'takeoff'
));

CREATE TABLE IF NOT EXISTS takeoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  notes TEXT,
  waste_pct NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (waste_pct >= 0 AND waste_pct <= 100),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified')),
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  material_request_id UUID REFERENCES material_requests(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, number)
);
CREATE INDEX IF NOT EXISTS idx_takeoffs_project ON takeoffs(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS takeoff_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  takeoff_id UUID NOT NULL REFERENCES takeoffs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('lighting', 'devices', 'gear', 'other')),
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 200),
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  plan_ref TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_takeoff_counts_takeoff ON takeoff_counts(takeoff_id, sort_order);

CREATE TABLE IF NOT EXISTS takeoff_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  takeoff_id UUID NOT NULL REFERENCES takeoffs(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  voltage TEXT,
  phases SMALLINT NOT NULL DEFAULT 1 CHECK (phases IN (1, 3)),
  bus_amps INTEGER CHECK (bus_amps IS NULL OR bus_amps > 0),
  main_breaker_amps INTEGER CHECK (main_breaker_amps IS NULL OR main_breaker_amps > 0),
  location TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_takeoff_panels_takeoff ON takeoff_panels(takeoff_id, sort_order);

CREATE TABLE IF NOT EXISTS takeoff_circuits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  panel_id UUID NOT NULL REFERENCES takeoff_panels(id) ON DELETE CASCADE,
  circuit_no TEXT NOT NULL CHECK (char_length(circuit_no) BETWEEN 1 AND 20),
  description TEXT,
  breaker_amps INTEGER NOT NULL CHECK (breaker_amps > 0),
  poles SMALLINT NOT NULL DEFAULT 1 CHECK (poles IN (1, 2, 3)),
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_takeoff_circuits_panel ON takeoff_circuits(panel_id, sort_order);

CREATE TABLE IF NOT EXISTS takeoff_feeders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  takeoff_id UUID NOT NULL REFERENCES takeoffs(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  from_label TEXT,
  to_label TEXT,
  length_ft NUMERIC(10,1) NOT NULL CHECK (length_ft > 0),
  conductor_size TEXT,
  conductors SMALLINT CHECK (conductors IS NULL OR conductors BETWEEN 1 AND 12),
  ground_size TEXT,
  conduit_size TEXT,
  conduit_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_takeoff_feeders_takeoff ON takeoff_feeders(takeoff_id, sort_order);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['takeoffs', 'takeoff_counts', 'takeoff_panels', 'takeoff_circuits', 'takeoff_feeders'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Owner/Manager, or Pricing Request permission, on a project the person can see.
DROP POLICY IF EXISTS "Takeoffs by permission" ON takeoffs;
CREATE POLICY "Takeoffs by permission" ON takeoffs FOR ALL
  USING (company_id IN (SELECT get_user_company_ids())
         AND (get_user_role(company_id) IN ('owner', 'manager') OR has_permission(company_id, 'can_create_pricing_request'))
         AND project_id IN (SELECT id FROM projects))
  WITH CHECK (company_id IN (SELECT get_user_company_ids())
         AND (get_user_role(company_id) IN ('owner', 'manager') OR has_permission(company_id, 'can_create_pricing_request'))
         AND project_id IN (SELECT id FROM projects));

-- Children follow the takeoff's own visibility (RLS on takeoffs applies inside the subquery).
DROP POLICY IF EXISTS "Takeoff counts follow takeoff" ON takeoff_counts;
CREATE POLICY "Takeoff counts follow takeoff" ON takeoff_counts FOR ALL
  USING (takeoff_id IN (SELECT id FROM takeoffs))
  WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND takeoff_id IN (SELECT id FROM takeoffs WHERE company_id = takeoff_counts.company_id));
DROP POLICY IF EXISTS "Takeoff panels follow takeoff" ON takeoff_panels;
CREATE POLICY "Takeoff panels follow takeoff" ON takeoff_panels FOR ALL
  USING (takeoff_id IN (SELECT id FROM takeoffs))
  WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND takeoff_id IN (SELECT id FROM takeoffs WHERE company_id = takeoff_panels.company_id));
DROP POLICY IF EXISTS "Takeoff circuits follow panel" ON takeoff_circuits;
CREATE POLICY "Takeoff circuits follow panel" ON takeoff_circuits FOR ALL
  USING (panel_id IN (SELECT id FROM takeoff_panels))
  WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND panel_id IN (SELECT id FROM takeoff_panels WHERE company_id = takeoff_circuits.company_id));
DROP POLICY IF EXISTS "Takeoff feeders follow takeoff" ON takeoff_feeders;
CREATE POLICY "Takeoff feeders follow takeoff" ON takeoff_feeders FOR ALL
  USING (takeoff_id IN (SELECT id FROM takeoffs))
  WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND takeoff_id IN (SELECT id FROM takeoffs WHERE company_id = takeoff_feeders.company_id));

-- Only Owner/Manager can call a takeoff verified; anything else stays a draft.
CREATE OR REPLACE FUNCTION trg_takeoff_verify_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.status = 'verified' AND (TG_OP = 'INSERT' OR OLD.status <> 'verified') THEN
    IF get_user_role(NEW.company_id) NOT IN ('owner', 'manager') THEN RAISE EXCEPTION 'takeoff_needs_manager'; END IF;
    NEW.verified_by := auth.uid();
    NEW.verified_at := NOW();
  END IF;
  IF NEW.status = 'draft' THEN
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trg_takeoff_verify_rules() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS takeoff_verify_rules ON takeoffs;
CREATE TRIGGER takeoff_verify_rules BEFORE INSERT OR UPDATE ON takeoffs FOR EACH ROW EXECUTE FUNCTION trg_takeoff_verify_rules();

CREATE OR REPLACE FUNCTION next_takeoff_number(p_company UUID)
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
  PERFORM pg_advisory_xact_lock(hashtext('tk-' || p_company::text));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^TK-' || v_year || '-', ''), number)::INTEGER), 0) + 1
    INTO v_next FROM takeoffs WHERE company_id = p_company AND number LIKE 'TK-' || v_year || '-%';
  RETURN 'TK-' || v_year || '-' || lpad(v_next::text, 4, '0');
END;
$$;
REVOKE ALL ON FUNCTION next_takeoff_number(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION next_takeoff_number(UUID) TO authenticated;

-- Any change to the numbers of a verified takeoff sends it back to draft: "verified" always describes
-- exactly what is on screen.
CREATE OR REPLACE FUNCTION trg_takeoff_child_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_takeoff UUID;
BEGIN
  IF TG_TABLE_NAME = 'takeoff_circuits' THEN
    SELECT takeoff_id INTO v_takeoff FROM takeoff_panels WHERE id = COALESCE(NEW.panel_id, OLD.panel_id);
  ELSE
    v_takeoff := COALESCE(NEW.takeoff_id, OLD.takeoff_id);
  END IF;
  IF v_takeoff IS NOT NULL THEN
    UPDATE takeoffs SET status = 'draft', updated_at = NOW() WHERE id = v_takeoff AND status = 'verified';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION trg_takeoff_child_touch() FROM PUBLIC, anon, authenticated;
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['takeoff_counts', 'takeoff_panels', 'takeoff_circuits', 'takeoff_feeders'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS takeoff_child_touch ON %I', t);
    EXECUTE format('CREATE TRIGGER takeoff_child_touch AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION trg_takeoff_child_touch()', t);
  END LOOP;
END $$;
