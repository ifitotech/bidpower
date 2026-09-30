-- BidPower — security hardening found by the Supabase advisors on a fresh project.
-- RLS stays enabled everywhere; nothing here loosens access.

-- 1) Tables that had no RLS at all.
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_status_history ENABLE ROW LEVEL SECURITY;

-- Usage counters are read by members of the company; writes only happen server-side (service role).
CREATE POLICY "Members view usage records"
  ON usage_records FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

-- History rows follow the visibility of their parent (RLS on quotes / purchase_orders applies inside the subquery).
CREATE POLICY "View quote history of visible quotes"
  ON quote_status_history FOR SELECT
  USING (quote_id IN (SELECT id FROM quotes));
CREATE POLICY "Add quote history as yourself"
  ON quote_status_history FOR INSERT
  WITH CHECK (changed_by = auth.uid() AND quote_id IN (SELECT id FROM quotes));

CREATE POLICY "View PO history of visible POs"
  ON purchase_order_status_history FOR SELECT
  USING (purchase_order_id IN (SELECT id FROM purchase_orders));
CREATE POLICY "Add PO history as yourself"
  ON purchase_order_status_history FOR INSERT
  WITH CHECK (changed_by = auth.uid() AND purchase_order_id IN (SELECT id FROM purchase_orders));

-- 2) Trigger functions are never meant to be called through the API.
REVOKE ALL ON FUNCTION trg_audit_member_permissions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION trg_member_default_permissions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION trg_protect_owner_membership() FROM PUBLIC, anon, authenticated;

-- 3) Helpers used by RLS policies must not be callable without signing in.
--    (Policies run as the signed-in user, so `authenticated` keeps EXECUTE.)
REVOKE ALL ON FUNCTION get_user_company_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION get_user_role(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_user_company_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- 4) Fixed search_path on every function that lacked one.
ALTER FUNCTION get_user_company_ids() SET search_path = public;
ALTER FUNCTION get_user_role(UUID) SET search_path = public;
ALTER FUNCTION permission_template(TEXT) SET search_path = '';
ALTER FUNCTION trg_protect_owner_membership() SET search_path = '';
