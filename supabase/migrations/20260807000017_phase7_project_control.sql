-- BidPower — Phase 7: Project Control
--
-- One source of truth for project money and history, built from real records only:
--   * project_cost_summary: actual cost (approved/reimbursed expenses, which include completed POs),
--     committed cost (POs approved but not yet completed) and the amount still waiting for approval
--   * project_timeline: a timeline assembled from what actually happened (requests, pricing, POs, proposals,
--     customer actions, expenses, change orders). It carries no amounts.
-- Both are security_invoker views: every underlying table's RLS still applies to the person asking,
-- so nobody sees rows or projects they could not already see. Nothing is stored twice.

CREATE INDEX IF NOT EXISTS idx_expenses_project_status ON expenses(project_id, status);
CREATE INDEX IF NOT EXISTS idx_po_project_status ON purchase_orders(project_id, status);
CREATE INDEX IF NOT EXISTS idx_material_requests_project_created ON material_requests(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_requests_project_created ON supply_quote_requests(project_id, created_at DESC);

CREATE OR REPLACE VIEW project_cost_summary WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  p.company_id,
  COALESCE((SELECT SUM(e.amount) FROM expenses e
             WHERE e.project_id = p.id AND e.status IN ('approved', 'reimbursed')), 0)::NUMERIC(14,2) AS actual_cost,
  COALESCE((SELECT SUM(po.estimated_amount) FROM purchase_orders po
             WHERE po.project_id = p.id
               AND po.status IN ('open', 'approved', 'sent', 'received', 'pending_document', 'document_uploaded', 'pending_review')), 0)::NUMERIC(14,2) AS committed_cost,
  COALESCE((SELECT SUM(po.estimated_amount) FROM purchase_orders po
             WHERE po.project_id = p.id AND po.status = 'pending_approval'), 0)::NUMERIC(14,2) AS pending_approval_cost,
  (SELECT COUNT(*) FROM purchase_orders po
    WHERE po.project_id = p.id
      AND po.status IN ('open', 'approved', 'sent', 'received', 'pending_document', 'document_uploaded', 'pending_review'))::INTEGER AS open_po_count
FROM projects p;

CREATE OR REPLACE VIEW project_timeline WITH (security_invoker = true) AS
  SELECT mr.company_id, mr.project_id, mr.created_at AS occurred_at, 'material_request_created'::TEXT AS kind,
         'material_request'::TEXT AS ref_type, mr.id AS ref_id, mr.number AS label, mr.requested_by AS actor_id, mr.status AS detail
    FROM material_requests mr
  UNION ALL
  SELECT mr.company_id, mr.project_id, mr.reviewed_at, 'material_request_reviewed', 'material_request', mr.id, mr.number, mr.reviewed_by, mr.status
    FROM material_requests mr WHERE mr.reviewed_at IS NOT NULL
  UNION ALL
  SELECT pr.company_id, pr.project_id, pr.created_at, 'pricing_request_created', 'pricing_request', pr.id, pr.number, pr.created_by, pr.status
    FROM supply_quote_requests pr WHERE pr.project_id IS NOT NULL
  UNION ALL
  SELECT pr.company_id, pr.project_id, pr.sent_at, 'pricing_request_sent', 'pricing_request', pr.id, pr.number, pr.created_by, pr.status
    FROM supply_quote_requests pr WHERE pr.project_id IS NOT NULL AND pr.sent_at IS NOT NULL
  UNION ALL
  SELECT pr.company_id, pr.project_id, pr.responded_at, 'pricing_request_responded', 'pricing_request', pr.id, pr.number, NULL::UUID, pr.status
    FROM supply_quote_requests pr WHERE pr.project_id IS NOT NULL AND pr.responded_at IS NOT NULL
  UNION ALL
  SELECT po.company_id, po.project_id, h.created_at, 'purchase_order_status', 'purchase_order', po.id, po.number, h.changed_by, h.to_status
    FROM purchase_order_status_history h JOIN purchase_orders po ON po.id = h.purchase_order_id
  UNION ALL
  SELECT q.company_id, q.project_id, h.created_at, 'proposal_status', 'proposal', q.id, q.number, h.changed_by, h.to_status
    FROM quote_status_history h JOIN quotes q ON q.id = h.quote_id WHERE q.project_id IS NOT NULL
  UNION ALL
  SELECT q.company_id, q.project_id, a.created_at, 'customer_action', 'proposal', q.id, q.number, NULL::UUID, a.action
    FROM customer_actions a JOIN quotes q ON q.id = a.object_id
   WHERE a.object_type = 'proposal' AND q.project_id IS NOT NULL AND a.action <> 'viewed'
  UNION ALL
  SELECT co.company_id, co.project_id, a.created_at, 'customer_action', 'change_order', co.id, co.number, NULL::UUID, a.action
    FROM customer_actions a JOIN change_orders co ON co.id = a.object_id
   WHERE a.object_type = 'change_order' AND a.action <> 'viewed'
  UNION ALL
  SELECT co.company_id, co.project_id, co.created_at, 'change_order_created', 'change_order', co.id, co.number, co.created_by, co.status
    FROM change_orders co
  UNION ALL
  SELECT ex.company_id, ex.project_id, ex.created_at, 'expense_recorded', 'expense', ex.id, COALESCE(ex.vendor_name, ''), ex.created_by, ex.status
    FROM expenses ex WHERE ex.project_id IS NOT NULL;

GRANT SELECT ON project_cost_summary, project_timeline TO authenticated;
REVOKE ALL ON project_cost_summary, project_timeline FROM anon;
