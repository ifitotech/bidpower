-- Project Harbor — Phase 1: atomic company bootstrap
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
