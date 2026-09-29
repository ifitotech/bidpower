-- BidPower — Phase 4 follow-up: a supplier's quote PDF shows prices, so files attached to a
-- supplier response follow "view costs". Files attached to the request itself (plans, specs) stay
-- visible to everyone who can see the Pricing Request.
DROP POLICY IF EXISTS "View supplier_quote_attachments by permission" ON supplier_quote_attachments;
CREATE POLICY "View supplier_quote_attachments by permission"
  ON supplier_quote_attachments FOR SELECT
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (
      get_user_role(company_id) IN ('owner', 'manager')
      OR (
        has_permission(company_id, 'can_create_pricing_request')
        AND (response_id IS NULL OR has_permission(company_id, 'can_view_costs'))
      )
    )
  );
