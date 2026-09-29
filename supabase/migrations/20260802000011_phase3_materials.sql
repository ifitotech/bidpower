-- BidPower — Phase 3: Materials
--
-- Reuses the existing library tables (company_materials, material_aliases, material_assemblies = saved lists,
-- assembly_items) and adds:
--   * favorites / recents / archive on the item library
--   * Material Request (employee -> owner/manager), always inside a project
--   * library management by permission (can_manage_library), not only by role
-- RLS stays enabled everywhere. Supplier pricing tables are untouched.

-- =====================================================
-- LIBRARY: favorites, recents, archive
-- =====================================================
ALTER TABLE company_materials
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_company_materials_recent
  ON company_materials(company_id, last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_company_materials_favorite
  ON company_materials(company_id) WHERE is_favorite;

-- Library management follows the permission (owner and managers have it by template;
-- an employee only if the owner grants can_manage_library).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['company_materials', 'material_aliases', 'material_assemblies', 'assembly_items'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Manage ' || t || ' by permission', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (company_id IN (SELECT get_user_company_ids()) AND has_permission(company_id, ''can_manage_library'')) WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND has_permission(company_id, ''can_manage_library''))',
      'Manage ' || t || ' by permission', t);
  END LOOP;
END $$;

-- Anyone allowed to request material can bump the "recently used" counters of company items,
-- without being able to edit the library.
CREATE OR REPLACE FUNCTION record_material_use(p_material_ids UUID[])
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE company_materials
  SET use_count = use_count + 1, last_used_at = NOW()
  WHERE id = ANY(p_material_ids)
    AND company_id IN (SELECT get_user_company_ids())
    AND has_permission(company_id, 'can_request_material');
$$;
REVOKE ALL ON FUNCTION record_material_use(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION record_material_use(UUID[]) TO authenticated;

-- =====================================================
-- MATERIAL REQUESTS
-- =====================================================
CREATE TABLE material_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'reviewed', 'rejected', 'converted', 'cancelled'
  )),
  -- Who has the next action (blueprint: "Waiting on").
  waiting_on TEXT NOT NULL DEFAULT 'owner' CHECK (waiting_on IN ('owner', 'employee', 'supplier', 'customer', 'none')),
  needed_by DATE,
  notes TEXT,
  review_note TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, number)
);
CREATE INDEX idx_material_requests_project ON material_requests(project_id, created_at DESC);
CREATE INDEX idx_material_requests_company_status ON material_requests(company_id, status);

CREATE TABLE material_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
  -- Optional link to the library. Free-text lines keep this NULL and never touch the library.
  material_id UUID REFERENCES company_materials(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'EA',
  category TEXT,
  manufacturer TEXT,
  catalog_number TEXT,
  allow_substitution BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_material_request_items_request ON material_request_items(request_id, sort_order);

ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_request_items ENABLE ROW LEVEL SECURITY;

-- Owners/managers see every request; everyone else only their own (and only on projects they can see).
CREATE POLICY "View material requests"
  ON material_requests FOR SELECT
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (
      get_user_role(company_id) IN ('owner', 'manager')
      OR (requested_by = auth.uid() AND project_id IN (SELECT id FROM projects))
    )
  );

CREATE POLICY "Create material requests with permission"
  ON material_requests FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND requested_by = auth.uid()
    AND status = 'requested'
    AND has_permission(company_id, 'can_request_material')
    AND project_id IN (SELECT id FROM projects)
  );

CREATE POLICY "Managers review material requests"
  ON material_requests FOR UPDATE
  USING (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager'))
  WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager'));

-- The requester can only cancel their own request while it is still waiting.
CREATE POLICY "Requester cancels own pending request"
  ON material_requests FOR UPDATE
  USING (requested_by = auth.uid() AND status = 'requested')
  WITH CHECK (requested_by = auth.uid() AND status IN ('requested', 'cancelled'));

CREATE POLICY "View material request items"
  ON material_request_items FOR SELECT
  USING (request_id IN (SELECT id FROM material_requests));

CREATE POLICY "Add items to own pending request"
  ON material_request_items FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND request_id IN (
      SELECT id FROM material_requests
      WHERE company_id = material_request_items.company_id
        AND (
          get_user_role(company_id) IN ('owner', 'manager')
          OR (requested_by = auth.uid() AND status = 'requested')
        )
    )
  );

CREATE POLICY "Managers edit request items"
  ON material_request_items FOR UPDATE
  USING (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager'))
  WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager'));

CREATE POLICY "Managers delete request items"
  ON material_request_items FOR DELETE
  USING (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager'));

-- Next request number for the company: MR-<year>-<00001>. Server-side so two people never collide.
CREATE OR REPLACE FUNCTION next_material_request_number(p_company UUID)
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
  PERFORM pg_advisory_xact_lock(hashtext('mr-' || p_company::text));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^MR-' || v_year || '-', ''), number)::INTEGER), 0) + 1
    INTO v_next
  FROM material_requests
  WHERE company_id = p_company AND number LIKE 'MR-' || v_year || '-%';
  RETURN 'MR-' || v_year || '-' || lpad(v_next::text, 5, '0');
END;
$$;
REVOKE ALL ON FUNCTION next_material_request_number(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION next_material_request_number(UUID) TO authenticated;
