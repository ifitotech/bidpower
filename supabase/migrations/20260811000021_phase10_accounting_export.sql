-- BidPower — Phase 10: Accounting Export / QuickBooks readiness
--
-- BidPower is not accounting software. It captures operational data and hands it to the accounting system.
-- This phase adds the two pieces of plumbing a hand-off needs, nothing more:
--   * accounting_export_log: who exported which dataset, when, with which filters and how many rows
--   * external_refs: the id of a BidPower record in an outside system (e.g. QuickBooks) so a future sync can
--     update instead of duplicate. It stays empty until a live connection exists.
-- Only the Owner, or a Manager who may view costs, can export or read these tables. RLS stays enabled.

CREATE TABLE IF NOT EXISTS accounting_export_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  dataset TEXT NOT NULL CHECK (dataset IN ('customers', 'vendors', 'projects', 'expenses', 'purchase_orders', 'invoices', 'project_costs', 'all')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'json')),
  date_from DATE,
  date_to DATE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  exported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_export_log_company ON accounting_export_log(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS external_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customer', 'vendor', 'project', 'expense', 'purchase_order', 'invoice')),
  entity_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks')),
  external_id TEXT NOT NULL,
  sync_token TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, provider, entity_type, entity_id),
  UNIQUE (company_id, provider, entity_type, external_id)
);

ALTER TABLE accounting_export_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_refs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION can_export_accounting(p_company UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p_company IN (SELECT get_user_company_ids())
     AND (get_user_role(p_company) = 'owner' OR (get_user_role(p_company) = 'manager' AND has_permission(p_company, 'can_view_costs')))
     AND EXISTS (SELECT 1 FROM companies c WHERE c.id = p_company AND c.kind = 'contractor');
$$;
REVOKE ALL ON FUNCTION can_export_accounting(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION can_export_accounting(UUID) TO authenticated;

DROP POLICY IF EXISTS "Export log readable by exporters" ON accounting_export_log;
CREATE POLICY "Export log readable by exporters" ON accounting_export_log FOR SELECT USING (can_export_accounting(company_id));
DROP POLICY IF EXISTS "Exporters log their own exports" ON accounting_export_log;
CREATE POLICY "Exporters log their own exports" ON accounting_export_log FOR INSERT WITH CHECK (can_export_accounting(company_id) AND exported_by = auth.uid());

DROP POLICY IF EXISTS "External refs managed by exporters" ON external_refs;
CREATE POLICY "External refs managed by exporters" ON external_refs FOR ALL USING (can_export_accounting(company_id)) WITH CHECK (can_export_accounting(company_id));
