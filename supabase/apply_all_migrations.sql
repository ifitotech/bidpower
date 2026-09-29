-- Bidpower — todas las migraciones en orden (generado; la fuente de verdad es supabase/migrations/).
-- Pega TODO este archivo en Supabase → SQL Editor y ejecútalo UNA sola vez en un proyecto nuevo.
-- Si ya aplicaste algunas migraciones antes, no lo uses: ejecuta solo las que falten.

-- ===== supabase/migrations/20260728000000_initial_schema.sql =====
-- Bidpower Initial Schema
-- Multi-tenant SaaS foundation
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMPANIES & SETTINGS
-- =====================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  default_tax_rate NUMERIC(5,2) DEFAULT 0,
  quote_terms TEXT,
  po_number_format TEXT DEFAULT 'PO-{YEAR}-{NUMBER}',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id)
);

-- =====================================================
-- PROFILES & MEMBERSHIP
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'employee')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- =====================================================
-- PLANS & SUBSCRIPTIONS
-- =====================================================

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('free', 'pro', 'ultra')),
  display_name TEXT NOT NULL,
  price_monthly NUMERIC(10,2) DEFAULT 0,
  price_yearly NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE plan_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value INTEGER NOT NULL, -- -1 = unlimited
  UNIQUE(plan_id, key)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id)
);

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  UNIQUE(company_id, key, period_start)
);

-- =====================================================
-- CLIENTS
-- =====================================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_company ON clients(company_id);

-- =====================================================
-- PROJECTS
-- =====================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  number TEXT,
  description TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN (
    'lead', 'quoted', 'approved', 'active', 'on_hold', 'completed', 'cancelled'
  )),
  start_date DATE,
  estimated_end_date DATE,
  contract_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_materials NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_labor NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_subcontractors NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_other NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(company_id, status);

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- =====================================================
-- QUOTES
-- =====================================================

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'pending', 'approved', 'rejected', 'expired', 'cancelled'
  )),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  terms TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE quote_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PURCHASE ORDERS
-- =====================================================

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  estimated_amount NUMERIC(12,2),
  final_amount NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'pending_document', 'document_uploaded', 'pending_review',
    'completed', 'cancelled', 'exception_requested', 'exception_approved', 'exception_rejected'
  )),
  exception_reason TEXT,
  document_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

CREATE INDEX idx_po_company ON purchase_orders(company_id);
CREATE INDEX idx_po_status ON purchase_orders(company_id, status);

CREATE TABLE purchase_order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- EXPENSES & CATEGORIES
-- =====================================================

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  vendor_name TEXT,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  amount NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  document_id UUID,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN (
    'draft', 'pending_review', 'approved', 'rejected', 'reimbursed', 'cancelled'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_expenses_project ON expenses(project_id);

-- =====================================================
-- DOCUMENTS
-- =====================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  related_type TEXT NOT NULL CHECK (related_type IN (
    'project', 'quote', 'purchase_order', 'expense', 'client', 'company'
  )),
  related_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_related ON documents(related_type, related_id);

-- =====================================================
-- NOTIFICATIONS & ACTIVITY
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  related_type TEXT,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_company ON activity_logs(company_id);

-- =====================================================
-- SEED DEFAULT PLANS
-- =====================================================

INSERT INTO plans (name, display_name, price_monthly, price_yearly) VALUES
  ('free', 'Free', 0, 0),
  ('pro', 'Pro', 49, 490),
  ('ultra', 'Ultra', 99, 990);

-- Free limits
INSERT INTO plan_limits (plan_id, key, value)
SELECT id, key, value FROM plans, (VALUES
  ('active_projects', 3),
  ('employees', 3),
  ('quotes_per_month', 3),
  ('expenses_per_month', 50),
  ('pos_per_month', 20)
) AS limits(key, value)
WHERE plans.name = 'free';

-- Pro limits (unlimited = -1)
INSERT INTO plan_limits (plan_id, key, value)
SELECT id, key, value FROM plans, (VALUES
  ('active_projects', -1),
  ('employees', -1),
  ('quotes_per_month', -1),
  ('expenses_per_month', -1),
  ('pos_per_month', -1)
) AS limits(key, value)
WHERE plans.name = 'pro';

-- =====================================================
-- ROW LEVEL SECURITY (basic foundation)
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: get companies of current user
CREATE OR REPLACE FUNCTION get_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id FROM company_members
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Basic policies (expand later)
CREATE POLICY "Users can view their companies"
  ON companies FOR SELECT
  USING (id IN (SELECT get_user_company_ids()));

CREATE POLICY "Members can view company data"
  ON clients FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Members can view projects"
  ON projects FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

-- More policies will be added in later phases

-- ===== supabase/migrations/20260728000001_rls_and_storage.sql =====
-- Bidpower — RLS policies completas + Storage bucket
-- Ejecutar después de la migración inicial

-- =====================================================
-- HELPER: current user's company IDs
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id FROM company_members
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role(p_company_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM company_members
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- PROFILES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- =====================================================
-- COMPANIES
-- =====================================================
CREATE POLICY "Members can view their companies"
  ON companies FOR SELECT
  USING (id IN (SELECT get_user_company_ids()));

CREATE POLICY "Owners can update company"
  ON companies FOR UPDATE
  USING (get_user_role(id) = 'owner');

-- =====================================================
-- COMPANY MEMBERS
-- =====================================================
CREATE POLICY "Members can view company members"
  ON company_members FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Owners can manage members"
  ON company_members FOR ALL
  USING (get_user_role(company_id) = 'owner');

-- =====================================================
-- COMPANY SETTINGS
-- =====================================================
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view settings"
  ON company_settings FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Owners can update settings"
  ON company_settings FOR UPDATE
  USING (get_user_role(company_id) = 'owner');

-- =====================================================
-- CLIENTS
-- =====================================================
CREATE POLICY "Members can view clients"
  ON clients FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Managers can insert clients"
  ON clients FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_company_ids())
    AND get_user_role(company_id) IN ('owner', 'manager')
  );

CREATE POLICY "Managers can update clients"
  ON clients FOR UPDATE
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND get_user_role(company_id) IN ('owner', 'manager')
  );

-- =====================================================
-- PROJECTS
-- =====================================================
-- The initial schema already defines a policy with this name; replace it so this
-- migration can run on a fresh database.
DROP POLICY IF EXISTS "Members can view projects" ON projects;
CREATE POLICY "Members can view projects"
  ON projects FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Managers can manage projects"
  ON projects FOR ALL
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND get_user_role(company_id) IN ('owner', 'manager')
  );

-- =====================================================
-- QUOTES
-- =====================================================
CREATE POLICY "Members can view quotes"
  ON quotes FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Managers can manage quotes"
  ON quotes FOR ALL
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND get_user_role(company_id) IN ('owner', 'manager')
  );

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view quote items"
  ON quote_items FOR SELECT
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id IN (SELECT get_user_company_ids())
    )
  );

CREATE POLICY "Managers can manage quote items"
  ON quote_items FOR ALL
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE company_id IN (SELECT get_user_company_ids())
      AND get_user_role(company_id) IN ('owner', 'manager')
    )
  );

-- =====================================================
-- PURCHASE ORDERS
-- =====================================================
CREATE POLICY "Members can view POs"
  ON purchase_orders FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Members can create POs"
  ON purchase_orders FOR INSERT
  WITH CHECK (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Members can update own or managers all POs"
  ON purchase_orders FOR UPDATE
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND (
      created_by = auth.uid()
      OR get_user_role(company_id) IN ('owner', 'manager')
    )
  );

-- =====================================================
-- EXPENSES
-- =====================================================
CREATE POLICY "Members can view expenses"
  ON expenses FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Members can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Managers can update expenses"
  ON expenses FOR UPDATE
  USING (
    company_id IN (SELECT get_user_company_ids())
    AND get_user_role(company_id) IN ('owner', 'manager')
  );

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view categories"
  ON expense_categories FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Owners can manage categories"
  ON expense_categories FOR ALL
  USING (get_user_role(company_id) = 'owner');

-- =====================================================
-- DOCUMENTS
-- =====================================================
CREATE POLICY "Members can view documents"
  ON documents FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Members can upload documents"
  ON documents FOR INSERT
  WITH CHECK (company_id IN (SELECT get_user_company_ids()));

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- ACTIVITY LOGS
-- =====================================================
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view activity"
  ON activity_logs FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

-- =====================================================
-- PLANS (public read)
-- =====================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans"
  ON plans FOR SELECT USING (true);

ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plan limits"
  ON plan_limits FOR SELECT USING (true);

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view subscription"
  ON subscriptions FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

-- =====================================================
-- STORAGE BUCKET
-- =====================================================
-- Run in Supabase dashboard or via storage API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies (run after creating bucket)
-- CREATE POLICY "Company members can upload"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'documents'
--     AND (storage.foldername(name))[1] IN (
--       SELECT company_id::text FROM company_members
--       WHERE user_id = auth.uid() AND is_active = true
--     )
--   );
--
-- CREATE POLICY "Company members can read"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'documents'
--     AND (storage.foldername(name))[1] IN (
--       SELECT company_id::text FROM company_members
--       WHERE user_id = auth.uid() AND is_active = true
--     )
--   );

-- ===== supabase/migrations/20260728000002_signup_insert_policies.sql =====
-- Allow the authenticated user to bootstrap their first company safely.
-- This migration is additive and does not change existing policies.

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their owner membership"
  ON company_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'owner');

CREATE POLICY "Owners can create company settings"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (SELECT get_user_company_ids()));

-- ===== supabase/migrations/20260728000003_quote_item_part_numbers.sql =====
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS part_number TEXT;

-- ===== supabase/migrations/20260728000004_quote_types.sql =====
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_type TEXT NOT NULL DEFAULT 'complete';
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_quote_type_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_quote_type_check CHECK (quote_type IN ('service', 'materials', 'plan_estimate', 'complete'));

-- ===== supabase/migrations/20260728000005_phase2_5_modules.sql =====
-- Bidpower Phase 2-5 supporting modules

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  part_number TEXT
);

CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_company ON calendar_events(company_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_project_activity_project ON project_activity(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(company_id, user_id, clock_in DESC);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can manage company invoices" ON invoices;
DROP POLICY IF EXISTS "Members can manage invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Members can manage client contacts" ON client_contacts;
DROP POLICY IF EXISTS "Members can manage project members" ON project_members;
DROP POLICY IF EXISTS "Members can manage calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Members can manage project activity" ON project_activity;
DROP POLICY IF EXISTS "Members can view company time entries" ON time_entries;
DROP POLICY IF EXISTS "Employees can manage own time entries" ON time_entries;

CREATE POLICY "Members can manage company invoices" ON invoices FOR ALL TO authenticated USING (company_id IN (SELECT get_user_company_ids())) WITH CHECK (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Members can manage invoice items" ON invoice_items FOR ALL TO authenticated USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT get_user_company_ids()))) WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT get_user_company_ids())));
CREATE POLICY "Members can manage client contacts" ON client_contacts FOR ALL TO authenticated USING (company_id IN (SELECT get_user_company_ids())) WITH CHECK (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Members can manage project members" ON project_members FOR ALL TO authenticated USING (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT get_user_company_ids()))) WITH CHECK (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT get_user_company_ids())));
CREATE POLICY "Members can manage calendar events" ON calendar_events FOR ALL TO authenticated USING (company_id IN (SELECT get_user_company_ids())) WITH CHECK (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Members can manage project activity" ON project_activity FOR ALL TO authenticated USING (company_id IN (SELECT get_user_company_ids())) WITH CHECK (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Members can view company time entries" ON time_entries FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Employees can manage own time entries" ON time_entries FOR ALL TO authenticated USING (company_id IN (SELECT get_user_company_ids()) AND user_id = auth.uid()) WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND user_id = auth.uid());

-- ===== supabase/migrations/20260729000006_supply_quotes_foundation.sql =====
-- Bidpower - Supply Quotes foundation
-- Incremental migration. Does not replace or remove existing objects.

-- Ensure the existing multi-tenant helper functions are available even when
-- earlier policy migrations were not run in the same SQL editor session.
CREATE OR REPLACE FUNCTION get_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id FROM company_members
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role(p_company_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM company_members
  WHERE user_id = auth.uid()
    AND company_id = p_company_id
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  department TEXT,
  branch TEXT,
  is_default_quote_contact BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'each',
  manufacturer TEXT,
  catalog_number TEXT,
  supplier_part_number TEXT,
  category TEXT,
  notes TEXT,
  preferred_brand TEXT,
  allow_substitution BOOLEAN NOT NULL DEFAULT false,
  last_unit_price NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES company_materials(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(material_id, alias)
);

CREATE TABLE IF NOT EXISTS material_assemblies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assembly_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assembly_id UUID NOT NULL REFERENCES material_assemblies(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES company_materials(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS supply_quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_contact_id UUID REFERENCES supplier_contacts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'ready_to_send', 'sent', 'viewed', 'response_started', 'responded',
    'pdf_response_pending_review', 'under_review', 'accepted', 'declined',
    'converted_to_po', 'expired', 'cancelled'
  )),
  number TEXT,
  response_due_date DATE,
  delivery_method TEXT CHECK (delivery_method IN ('delivery', 'pickup')),
  delivery_address TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supply_quote_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES supply_quote_requests(id) ON DELETE CASCADE,
  material_id UUID REFERENCES company_materials(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'each',
  manufacturer TEXT,
  catalog_number TEXT,
  supplier_part_number TEXT,
  category TEXT,
  notes TEXT,
  preferred_brand TEXT,
  allow_substitution BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS supplier_quote_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES supply_quote_requests(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_quote_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES supply_quote_requests(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES supplier_quote_invitations(id) ON DELETE SET NULL,
  supplier_name TEXT,
  supplier_contact_name TEXT,
  supplier_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'declined')),
  freight NUMERIC(12,2),
  tax_amount NUMERIC(12,2),
  expires_on DATE,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_quote_response_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES supplier_quote_responses(id) ON DELETE CASCADE,
  request_item_id UUID NOT NULL REFERENCES supply_quote_request_items(id) ON DELETE CASCADE,
  unit_price NUMERIC(12,2),
  availability TEXT CHECK (availability IN ('available', 'partial', 'unavailable')),
  lead_time TEXT,
  manufacturer TEXT,
  substitute_description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_quote_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  response_id UUID REFERENCES supplier_quote_responses(id) ON DELETE CASCADE,
  request_id UUID REFERENCES supply_quote_requests(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (response_id IS NOT NULL OR request_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS quote_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES supply_quote_requests(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier ON supplier_contacts(supplier_id, is_active);
CREATE INDEX IF NOT EXISTS idx_company_materials_company ON company_materials(company_id, description);
CREATE INDEX IF NOT EXISTS idx_material_aliases_company ON material_aliases(company_id, alias);
CREATE INDEX IF NOT EXISTS idx_assemblies_company ON material_assemblies(company_id);
CREATE INDEX IF NOT EXISTS idx_supply_quote_requests_company ON supply_quote_requests(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_quote_items_request ON supply_quote_request_items(request_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_supplier_invitations_request ON supplier_quote_invitations(request_id);
CREATE INDEX IF NOT EXISTS idx_supplier_responses_request ON supplier_quote_responses(request_id, status);
CREATE INDEX IF NOT EXISTS idx_supplier_response_items_response ON supplier_quote_response_items(response_id);
CREATE INDEX IF NOT EXISTS idx_supply_quote_activity_request ON quote_activity_log(request_id, created_at DESC);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'suppliers', 'supplier_contacts', 'company_materials', 'material_aliases',
    'material_assemblies', 'assembly_items', 'supply_quote_requests',
    'supply_quote_request_items', 'supplier_quote_invitations',
    'supplier_quote_responses', 'supplier_quote_response_items',
    'supplier_quote_attachments', 'quote_activity_log'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

-- Company members can read private supply data. Owner/Manager can manage it.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'suppliers', 'supplier_contacts', 'company_materials', 'material_aliases',
    'material_assemblies', 'assembly_items', 'supply_quote_requests',
    'supply_quote_request_items', 'supplier_quote_invitations',
    'supplier_quote_responses', 'supplier_quote_response_items',
    'supplier_quote_attachments', 'quote_activity_log'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Members can view ' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (company_id IN (SELECT get_user_company_ids()))', 'Members can view ' || table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Managers can manage ' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN (''owner'', ''manager'')) WITH CHECK (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) IN (''owner'', ''manager''))', 'Managers can manage ' || table_name, table_name);
  END LOOP;
END $$;

-- ===== supabase/migrations/20260730000007_phase1_company_bootstrap.sql =====
-- Bidpower — Phase 1: atomic company bootstrap
--
-- Signing up must create, in one transaction and without weakening RLS:
--   profile -> company -> owner membership -> company settings -> Free plan -> default categories
--
-- Doing this from the client with several INSERTs fails under RLS
-- (`INSERT ... RETURNING` on companies needs a SELECT policy that only passes
-- once the membership exists, and subscriptions/expense_categories have no
-- INSERT policy for a brand-new owner). This SECURITY DEFINER function keeps RLS
-- enabled everywhere and only ever acts for auth.uid().

CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_company_name TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
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
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_name = '' THEN
    RAISE EXCEPTION 'company_name_required';
  END IF;

  -- Serialise concurrent calls for the same user (double submit / parallel renders).
  PERFORM pg_advisory_xact_lock(hashtext(v_user::text));

  -- Idempotent: an existing membership is returned, never duplicated.
  SELECT company_id INTO v_company
  FROM company_members
  WHERE user_id = v_user AND is_active = true
  ORDER BY created_at
  LIMIT 1;
  IF v_company IS NOT NULL THEN
    RETURN v_company;
  END IF;

  -- A deactivated member must not silently get a new company.
  IF EXISTS (SELECT 1 FROM company_members WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'membership_inactive';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user;

  INSERT INTO profiles (id, full_name, email, phone)
  VALUES (v_user, NULLIF(btrim(coalesce(p_full_name, '')), ''), v_email, NULLIF(btrim(coalesce(p_phone, '')), ''))
  ON CONFLICT (id) DO UPDATE SET
    full_name = coalesce(EXCLUDED.full_name, profiles.full_name),
    email = coalesce(EXCLUDED.email, profiles.email),
    phone = coalesce(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  INSERT INTO companies (name, email, phone)
  VALUES (v_name, v_email, NULLIF(btrim(coalesce(p_phone, '')), ''))
  RETURNING id INTO v_company;

  INSERT INTO company_members (company_id, user_id, role, is_active, joined_at)
  VALUES (v_company, v_user, 'owner', true, NOW());

  INSERT INTO company_settings (company_id) VALUES (v_company);

  SELECT id INTO v_plan FROM plans WHERE name = 'free';
  IF v_plan IS NOT NULL THEN
    INSERT INTO subscriptions (company_id, plan_id, status)
    VALUES (v_company, v_plan, 'active');
  END IF;

  INSERT INTO expense_categories (company_id, name, is_system, is_active, sort_order)
  SELECT v_company, name, true, true, ord - 1
  FROM unnest(ARRAY[
    'Materiales', 'Herramientas', 'Combustible', 'Permisos', 'Subcontratistas',
    'Equipos', 'Alquiler', 'Comidas', 'Transporte', 'Oficina', 'Otros'
  ]) WITH ORDINALITY AS c(name, ord);

  RETURN v_company;
END;
$$;

REVOKE ALL ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT, TEXT) TO authenticated;

-- ===== supabase/migrations/20260731000008_phase2_team_permissions.sql =====
-- Bidpower — Phase 2: Team & Permissions
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

