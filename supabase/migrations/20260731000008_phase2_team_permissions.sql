-- BidPower — Phase 2: Team & Permissions
--
-- * Individual permissions per member (on top of owner / manager / employee)
-- * Permission audit trail
-- * Employees only see assigned projects (and only their own expenses / POs unless allowed)
-- * Owner-only invitations through secure tokens (no email provider required)
-- * Hardening: owner membership cannot be removed/downgraded, and self-service
--   company/owner inserts are closed now that create_company_with_owner exists.
--
-- RLS stays enabled everywhere. Nothing here disables or bypasses it.

-- =====================================================
-- MEMBER PERMISSIONS
-- =====================================================

CREATE TABLE member_permissions (
  member_id UUID PRIMARY KEY REFERENCES company_members(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  can_request_material BOOLEAN NOT NULL DEFAULT true,
  can_upload_documents BOOLEAN NOT NULL DEFAULT true,
  can_manage_library BOOLEAN NOT NULL DEFAULT false,
  can_create_pricing_request BOOLEAN NOT NULL DEFAULT false,
  can_create_po BOOLEAN NOT NULL DEFAULT false,
  can_send_po BOOLEAN NOT NULL DEFAULT false,
  -- NULL = no limit. 0 = every PO is above the limit (owner must create it).
  po_limit NUMERIC(12,2),
  can_view_costs BOOLEAN NOT NULL DEFAULT false,
  can_view_profit BOOLEAN NOT NULL DEFAULT false,
  can_create_proposal BOOLEAN NOT NULL DEFAULT false,
  template TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (po_limit IS NULL OR po_limit >= 0)
);
CREATE INDEX idx_member_permissions_company ON member_permissions(company_id);

CREATE TABLE permission_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES profiles(id),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_permission_audit_member ON permission_audit(member_id, created_at DESC);

ALTER TABLE member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit ENABLE ROW LEVEL SECURITY;

-- Permission templates (single source of truth).
CREATE OR REPLACE FUNCTION permission_template(p_template TEXT)
RETURNS JSONB
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_template
    WHEN 'owner' THEN jsonb_build_object(
      'can_request_material', true, 'can_upload_documents', true, 'can_manage_library', true,
      'can_create_pricing_request', true, 'can_create_po', true, 'can_send_po', true, 'po_limit', NULL,
      'can_view_costs', true, 'can_view_profit', true, 'can_create_proposal', true)
    WHEN 'manager' THEN jsonb_build_object(
      'can_request_material', true, 'can_upload_documents', true, 'can_manage_library', true,
      'can_create_pricing_request', true, 'can_create_po', true, 'can_send_po', true, 'po_limit', NULL,
      'can_view_costs', true, 'can_view_profit', false, 'can_create_proposal', true)
    WHEN 'employee_purchasing' THEN jsonb_build_object(
      'can_request_material', true, 'can_upload_documents', true, 'can_manage_library', false,
      'can_create_pricing_request', false, 'can_create_po', true, 'can_send_po', false, 'po_limit', 500,
      'can_view_costs', false, 'can_view_profit', false, 'can_create_proposal', false)
    ELSE jsonb_build_object(  -- employee_basic
      'can_request_material', true, 'can_upload_documents', true, 'can_manage_library', false,
      'can_create_pricing_request', false, 'can_create_po', false, 'can_send_po', false, 'po_limit', NULL,
      'can_view_costs', false, 'can_view_profit', false, 'can_create_proposal', false)
  END;
$$;

CREATE OR REPLACE FUNCTION apply_permission_template(p_member UUID, p_template TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t JSONB := permission_template(p_template);
  v_company UUID;
BEGIN
  SELECT company_id INTO v_company FROM company_members WHERE id = p_member;
  IF v_company IS NULL THEN RETURN; END IF;
  INSERT INTO member_permissions (
    member_id, company_id, can_request_material, can_upload_documents, can_manage_library,
    can_create_pricing_request, can_create_po, can_send_po, po_limit,
    can_view_costs, can_view_profit, can_create_proposal, template, updated_by
  ) VALUES (
    p_member, v_company,
    (t->>'can_request_material')::boolean, (t->>'can_upload_documents')::boolean, (t->>'can_manage_library')::boolean,
    (t->>'can_create_pricing_request')::boolean, (t->>'can_create_po')::boolean, (t->>'can_send_po')::boolean,
    NULLIF(t->>'po_limit', '')::numeric,
    (t->>'can_view_costs')::boolean, (t->>'can_view_profit')::boolean, (t->>'can_create_proposal')::boolean,
    p_template, auth.uid()
  )
  ON CONFLICT (member_id) DO UPDATE SET
    can_request_material = EXCLUDED.can_request_material,
    can_upload_documents = EXCLUDED.can_upload_documents,
    can_manage_library = EXCLUDED.can_manage_library,
    can_create_pricing_request = EXCLUDED.can_create_pricing_request,
    can_create_po = EXCLUDED.can_create_po,
    can_send_po = EXCLUDED.can_send_po,
    po_limit = EXCLUDED.po_limit,
    can_view_costs = EXCLUDED.can_view_costs,
    can_view_profit = EXCLUDED.can_view_profit,
    can_create_proposal = EXCLUDED.can_create_proposal,
    template = EXCLUDED.template,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();
END;
$$;
REVOKE ALL ON FUNCTION apply_permission_template(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- Every new membership gets permissions from its role's template.
CREATE OR REPLACE FUNCTION trg_member_default_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM apply_permission_template(
    NEW.id,
    CASE NEW.role WHEN 'owner' THEN 'owner' WHEN 'manager' THEN 'manager' ELSE 'employee_basic' END
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER company_members_default_permissions
  AFTER INSERT ON company_members
  FOR EACH ROW EXECUTE FUNCTION trg_member_default_permissions();

-- Backfill for members that already exist.
INSERT INTO member_permissions (member_id, company_id)
SELECT id, company_id FROM company_members ON CONFLICT DO NOTHING;
UPDATE member_permissions mp SET
  can_manage_library = m.role IN ('owner', 'manager'),
  can_create_pricing_request = m.role IN ('owner', 'manager'),
  can_create_po = m.role IN ('owner', 'manager'),
  can_send_po = m.role IN ('owner', 'manager'),
  can_view_costs = m.role IN ('owner', 'manager'),
  can_view_profit = m.role = 'owner',
  can_create_proposal = m.role IN ('owner', 'manager'),
  template = CASE m.role WHEN 'owner' THEN 'owner' WHEN 'manager' THEN 'manager' ELSE 'employee_basic' END
FROM company_members m WHERE m.id = mp.member_id;

-- Owner keeps owner rights: cannot be downgraded or deactivated.
CREATE OR REPLACE FUNCTION trg_protect_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role = 'owner' AND (NEW.role <> 'owner' OR NEW.is_active = false) THEN
    RAISE EXCEPTION 'owner_membership_protected';
  END IF;
  IF NEW.role = 'owner' AND OLD.role <> 'owner' THEN
    RAISE EXCEPTION 'owner_role_cannot_be_granted';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER company_members_protect_owner
  BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION trg_protect_owner_membership();

-- Audit every permission change.
CREATE OR REPLACE FUNCTION trg_audit_member_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_jsonb(OLD) - 'updated_at' - 'updated_by' IS DISTINCT FROM to_jsonb(NEW) - 'updated_at' - 'updated_by' THEN
    INSERT INTO permission_audit (company_id, member_id, changed_by, old_values, new_values)
    VALUES (NEW.company_id, NEW.member_id, auth.uid(),
            to_jsonb(OLD) - 'updated_at' - 'updated_by',
            to_jsonb(NEW) - 'updated_at' - 'updated_by');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER member_permissions_audit
  AFTER UPDATE ON member_permissions
  FOR EACH ROW EXECUTE FUNCTION trg_audit_member_permissions();

-- Permission check used by RLS and by the app.
-- Owners always pass. Managers/employees pass only if their row says so.
CREATE OR REPLACE FUNCTION has_permission(p_company UUID, p_perm TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT CASE
        WHEN m.role = 'owner' THEN true
        ELSE COALESCE((to_jsonb(mp) ->> p_perm)::boolean, false)
      END
     FROM company_members m
     LEFT JOIN member_permissions mp ON mp.member_id = m.id
     WHERE m.user_id = auth.uid() AND m.company_id = p_company AND m.is_active = true
     LIMIT 1),
    false);
$$;

-- PO creation gate: permission + amount limit. An unknown amount never bypasses a limit.
CREATE OR REPLACE FUNCTION po_within_limit(p_company UUID, p_amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT CASE
        WHEN m.role = 'owner' THEN true
        WHEN NOT COALESCE(mp.can_create_po, false) THEN false
        WHEN mp.po_limit IS NULL THEN true
        WHEN p_amount IS NULL THEN false
        ELSE p_amount <= mp.po_limit
      END
     FROM company_members m
     LEFT JOIN member_permissions mp ON mp.member_id = m.id
     WHERE m.user_id = auth.uid() AND m.company_id = p_company AND m.is_active = true
     LIMIT 1),
    false);
$$;

GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION po_within_limit(UUID, NUMERIC) TO authenticated;
REVOKE ALL ON FUNCTION has_permission(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION po_within_limit(UUID, NUMERIC) FROM PUBLIC, anon;

-- Policies for the new tables
CREATE POLICY "Members read own permissions, owners read all"
  ON member_permissions FOR SELECT
  USING (
    member_id IN (SELECT id FROM company_members WHERE user_id = auth.uid())
    OR get_user_role(company_id) = 'owner'
  );

CREATE POLICY "Owners update non-owner permissions"
  ON member_permissions FOR UPDATE
  USING (
    get_user_role(company_id) = 'owner'
    AND member_id IN (SELECT id FROM company_members WHERE role <> 'owner')
  )
  WITH CHECK (
    get_user_role(company_id) = 'owner'
    AND member_id IN (SELECT id FROM company_members WHERE role <> 'owner')
  );

CREATE POLICY "Owners read permission audit"
  ON permission_audit FOR SELECT
  USING (get_user_role(company_id) = 'owner');

-- =====================================================
-- PROJECT ACCESS: employees only see assigned projects
-- =====================================================

-- Helpers are SECURITY DEFINER so policies on projects and project_members can
-- consult each other without recursing through RLS. They only return booleans.
CREATE OR REPLACE FUNCTION is_project_assigned(p_project UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM project_members WHERE project_id = p_project AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_project_manager(p_project UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN company_members m ON m.company_id = p.company_id
    WHERE p.id = p_project AND m.user_id = auth.uid() AND m.is_active = true
      AND m.role IN ('owner', 'manager'));
$$;

CREATE OR REPLACE FUNCTION is_active_member_of_project_company(p_project UUID, p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN company_members m ON m.company_id = p.company_id
    WHERE p.id = p_project AND m.user_id = p_user AND m.is_active = true);
$$;

REVOKE ALL ON FUNCTION is_project_assigned(UUID), is_project_manager(UUID),
  is_active_member_of_project_company(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_project_assigned(UUID), is_project_manager(UUID),
  is_active_member_of_project_company(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Members can view projects" ON projects;
CREATE POLICY "Members view accessible projects"
  ON projects FOR SELECT
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (
      get_user_role(company_id) IN ('owner', 'manager')
      OR is_project_assigned(id)
    )
  );

DROP POLICY IF EXISTS "Members can manage project members" ON project_members;
CREATE POLICY "View project assignments"
  ON project_members FOR SELECT
  USING (user_id = auth.uid() OR is_project_manager(project_id));
CREATE POLICY "Managers assign project members"
  ON project_members FOR INSERT
  WITH CHECK (
    is_project_manager(project_id)
    AND is_active_member_of_project_company(project_id, user_id)
  );
CREATE POLICY "Managers unassign project members"
  ON project_members FOR DELETE
  USING (is_project_manager(project_id));

-- =====================================================
-- COST / PRICE VISIBILITY AND PURCHASING GATES
-- =====================================================

-- Expenses: managers see all; employees see their own, plus assigned projects if they may view costs.
DROP POLICY IF EXISTS "Members can view expenses" ON expenses;
CREATE POLICY "View expenses by permission"
  ON expenses FOR SELECT
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (
      get_user_role(company_id) IN ('owner', 'manager')
      OR created_by = auth.uid()
      OR (has_permission(company_id, 'can_view_costs')
          AND project_id IN (SELECT id FROM projects))
    )
  );

DROP POLICY IF EXISTS "Members can create expenses" ON expenses;
CREATE POLICY "Create expenses with upload permission"
  ON expenses FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND created_by = auth.uid()
    AND has_permission(company_id, 'can_upload_documents')
    AND (project_id IS NULL OR project_id IN (SELECT id FROM projects))
  );

-- Purchase orders
DROP POLICY IF EXISTS "Members can view POs" ON purchase_orders;
CREATE POLICY "View POs by permission"
  ON purchase_orders FOR SELECT
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (
      get_user_role(company_id) IN ('owner', 'manager')
      OR created_by = auth.uid()
      OR (has_permission(company_id, 'can_view_costs')
          AND project_id IN (SELECT id FROM projects))
    )
  );

DROP POLICY IF EXISTS "Members can create POs" ON purchase_orders;
CREATE POLICY "Create POs within permission and limit"
  ON purchase_orders FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND created_by = auth.uid()
    AND po_within_limit(company_id, estimated_amount)
    AND project_id IN (SELECT id FROM projects)
  );

-- Documents
DROP POLICY IF EXISTS "Members can upload documents" ON documents;
CREATE POLICY "Upload documents with permission"
  ON documents FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND has_permission(company_id, 'can_upload_documents')
  );

-- Customer prices: quotes and invoices are for owners/managers or people allowed to make proposals.
DROP POLICY IF EXISTS "Members can view quotes" ON quotes;
CREATE POLICY "View quotes by permission"
  ON quotes FOR SELECT
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (get_user_role(company_id) IN ('owner', 'manager') OR has_permission(company_id, 'can_create_proposal'))
  );

DROP POLICY IF EXISTS "Members can view quote items" ON quote_items;
CREATE POLICY "View quote items by permission"
  ON quote_items FOR SELECT
  USING (
    quote_id IN (
      SELECT id FROM quotes
      WHERE company_id IN (SELECT get_user_company_ids())
        AND (get_user_role(company_id) IN ('owner', 'manager') OR has_permission(company_id, 'can_create_proposal'))
    )
  );

DROP POLICY IF EXISTS "Members can manage company invoices" ON invoices;
CREATE POLICY "Managers manage invoices"
  ON invoices FOR ALL TO authenticated
  USING (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager'))
  WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager'));

DROP POLICY IF EXISTS "Members can manage invoice items" ON invoice_items;
CREATE POLICY "Managers manage invoice items"
  ON invoice_items FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager')))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN ('owner', 'manager')));

-- Supplier pricing (private supply data): owners/managers or people allowed to make Pricing Requests.
-- The material library tables (company_materials, material_aliases, ...) stay readable by all members.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'suppliers', 'supplier_contacts', 'supply_quote_requests', 'supply_quote_request_items',
    'supplier_quote_invitations', 'supplier_quote_responses', 'supplier_quote_response_items',
    'supplier_quote_attachments', 'quote_activity_log'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Members can view ' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (company_id IN (SELECT get_user_company_ids()) AND (get_user_role(company_id) IN (''owner'', ''manager'') OR has_permission(company_id, ''can_create_pricing_request'')))',
      'View ' || t || ' by permission', t);
  END LOOP;
END $$;

-- =====================================================
-- HARDENING: close self-service bootstrap paths
-- (company creation now goes through create_company_with_owner)
-- =====================================================

DROP POLICY IF EXISTS "Users can create their owner membership" ON company_members;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;

-- =====================================================
-- INVITATIONS (secure token, owner only)
-- =====================================================

CREATE TABLE member_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
  template TEXT NOT NULL DEFAULT 'employee_basic'
    CHECK (template IN ('employee_basic', 'employee_purchasing', 'manager')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_member_invitations_company ON member_invitations(company_id, created_at DESC);
CREATE INDEX idx_member_invitations_email ON member_invitations(lower(email));

ALTER TABLE member_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read invitations"
  ON member_invitations FOR SELECT
  USING (get_user_role(company_id) = 'owner');
CREATE POLICY "Owners revoke invitations"
  ON member_invitations FOR UPDATE
  USING (get_user_role(company_id) = 'owner')
  WITH CHECK (get_user_role(company_id) = 'owner');

-- Creates an invitation and returns the raw token ONCE (only its hash is stored).
CREATE OR REPLACE FUNCTION create_member_invitation(
  p_company UUID, p_email TEXT, p_full_name TEXT, p_role TEXT, p_template TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_email TEXT := lower(btrim(coalesce(p_email, '')));
  v_template TEXT;
BEGIN
  IF auth.uid() IS NULL OR get_user_role(p_company) IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF p_role NOT IN ('manager', 'employee') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;
  v_template := coalesce(p_template, CASE p_role WHEN 'manager' THEN 'manager' ELSE 'employee_basic' END);
  IF v_template NOT IN ('employee_basic', 'employee_purchasing', 'manager') THEN
    RAISE EXCEPTION 'invalid_template';
  END IF;

  -- One live invitation per email and company.
  UPDATE member_invitations SET revoked_at = NOW()
  WHERE company_id = p_company AND lower(email) = v_email AND accepted_at IS NULL AND revoked_at IS NULL;

  INSERT INTO member_invitations (company_id, email, full_name, role, template, token_hash, invited_by)
  VALUES (p_company, v_email, NULLIF(btrim(coalesce(p_full_name, '')), ''), p_role, v_template,
          encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), auth.uid());

  RETURN v_token;
END;
$$;
REVOKE ALL ON FUNCTION create_member_invitation(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_member_invitation(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Public preview for the invitation page (works before the invitee has an account).
CREATE OR REPLACE FUNCTION get_invitation_preview(p_token TEXT)
RETURNS TABLE (company_name TEXT, email TEXT, full_name TEXT, role TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT c.name, i.email, i.full_name, i.role
  FROM member_invitations i
  JOIN companies c ON c.id = i.company_id
  WHERE i.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW();
$$;
GRANT EXECUTE ON FUNCTION get_invitation_preview(TEXT) TO anon, authenticated;

-- Accepts an invitation for the signed-in user. The auth email must match the invitation.
CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_email TEXT;
  v_inv member_invitations%ROWTYPE;
  v_member UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_user;

  SELECT * INTO v_inv FROM member_invitations
  WHERE token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > NOW()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invitation_invalid'; END IF;
  IF lower(v_inv.email) IS DISTINCT FROM v_email THEN RAISE EXCEPTION 'invitation_email_mismatch'; END IF;

  INSERT INTO profiles (id, full_name, email)
  VALUES (v_user, v_inv.full_name, v_email)
  ON CONFLICT (id) DO UPDATE SET full_name = coalesce(profiles.full_name, EXCLUDED.full_name);

  SELECT id INTO v_member FROM company_members WHERE company_id = v_inv.company_id AND user_id = v_user;
  IF v_member IS NULL THEN
    INSERT INTO company_members (company_id, user_id, role, is_active, invited_at, joined_at)
    VALUES (v_inv.company_id, v_user, v_inv.role, true, v_inv.created_at, NOW())
    RETURNING id INTO v_member;
  ELSE
    -- Returning member (previously deactivated): history is preserved, access is restored.
    UPDATE company_members SET is_active = true, role = v_inv.role, joined_at = coalesce(joined_at, NOW())
    WHERE id = v_member;
  END IF;

  PERFORM apply_permission_template(v_member, v_inv.template);
  UPDATE member_invitations SET accepted_at = NOW(), accepted_by = v_user WHERE id = v_inv.id;
  RETURN v_inv.company_id;
END;
$$;
REVOKE ALL ON FUNCTION accept_invitation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION accept_invitation(TEXT) TO authenticated;

-- Owner-only: reactivate a deactivated member (history preserved).
CREATE OR REPLACE FUNCTION set_member_active(p_member UUID, p_active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company UUID;
  v_role TEXT;
BEGIN
  SELECT company_id, role INTO v_company, v_role FROM company_members WHERE id = p_member;
  IF v_company IS NULL OR get_user_role(v_company) IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF v_role = 'owner' THEN RAISE EXCEPTION 'owner_membership_protected'; END IF;
  UPDATE company_members SET is_active = p_active WHERE id = p_member;
  -- Losing access also drops project assignments so a later reactivation starts clean.
  IF NOT p_active THEN
    DELETE FROM project_members pm
    USING company_members cm, projects p
    WHERE cm.id = p_member AND pm.user_id = cm.user_id AND p.id = pm.project_id AND p.company_id = v_company;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION set_member_active(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_member_active(UUID, BOOLEAN) TO authenticated;

-- =====================================================
-- TEAM VISIBILITY: owners/managers can read teammates' profiles
-- (needed to list employees; employees still only see their own profile)
-- =====================================================
CREATE POLICY "Managers view teammate profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT cm.user_id FROM company_members cm
      WHERE cm.company_id IN (SELECT get_user_company_ids())
        AND get_user_role(cm.company_id) IN ('owner', 'manager')
    )
  );
