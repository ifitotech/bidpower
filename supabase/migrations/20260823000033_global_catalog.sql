-- BidPower — Standard materials catalog, kept on the server and shared by every company.
-- Contractors never get a copy: they search it (only what they type is shown) and an item joins a company's own library the first time it is used.
-- Only a platform admin can load or replace the catalog (through catalog_import); everybody signed in can read it.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
  ELSE
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;  -- no policies: read only through is_platform_admin()

CREATE OR REPLACE FUNCTION is_platform_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = (SELECT auth.uid()))
$$;
REVOKE ALL ON FUNCTION is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS catalog_materials (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 300),
  unit TEXT NOT NULL DEFAULT 'EA' CHECK (unit IN ('EA','FT','ROLL','BOX','BAG','SET','PAIR','LOT','CT','PKG')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('conduit','wire','boxes','fittings','devices','breakers','panels','lighting','gear','other')),
  manufacturer TEXT,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  -- Lowercase, normalized text of the name and aliases (built by the app with the same rules the search uses).
  search_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  import_batch UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_catalog_materials_search ON catalog_materials USING gin (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_catalog_materials_active ON catalog_materials(is_active);

ALTER TABLE catalog_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read the catalog" ON catalog_materials FOR SELECT TO authenticated USING (is_active);
-- No insert/update/delete policies: changes only go through catalog_import / catalog_prune below.

-- Search: every pattern must match (regular expressions the app builds from what was typed). Capped so it stays cheap.
CREATE OR REPLACE FUNCTION catalog_search(p_patterns TEXT[], p_query TEXT, p_limit INTEGER DEFAULT 200)
RETURNS TABLE (id UUID, name TEXT, unit TEXT, category TEXT, manufacturer TEXT, aliases TEXT[])
LANGUAGE plpgsql STABLE SET search_path = public AS $$
BEGIN
  IF p_patterns IS NULL OR array_length(p_patterns, 1) IS NULL OR array_length(p_patterns, 1) > 8 THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_patterns) p WHERE length(p) > 120) THEN RETURN; END IF;
  RETURN QUERY
    SELECT c.id, c.name, c.unit, c.category, c.manufacturer, c.aliases
    FROM catalog_materials c
    WHERE c.is_active AND c.search_text ~ ALL (p_patterns)
    ORDER BY word_similarity(COALESCE(p_query, ''), c.search_text) DESC, length(c.name), c.name
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 300);
END $$;
REVOKE ALL ON FUNCTION catalog_search(TEXT[], TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION catalog_search(TEXT[], TEXT, INTEGER) TO authenticated;

-- Load or update rows (platform admin only). Rows are an array of {id,name,unit,category,manufacturer,aliases,search_text}.
CREATE OR REPLACE FUNCTION catalog_import(p_rows JSONB, p_batch UUID) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  IF NOT is_platform_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) > 1000 THEN RAISE EXCEPTION 'invalid_rows'; END IF;
  INSERT INTO catalog_materials (id, name, unit, category, manufacturer, aliases, search_text, is_active, import_batch)
  SELECT (r->>'id')::uuid, left(r->>'name', 300), COALESCE(NULLIF(r->>'unit',''), 'EA'), COALESCE(NULLIF(r->>'category',''), 'other'),
         NULLIF(r->>'manufacturer',''), COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(r->'aliases','[]'::jsonb))), '{}'),
         lower(r->>'search_text'), TRUE, p_batch
  FROM jsonb_array_elements(p_rows) r
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, unit = EXCLUDED.unit, category = EXCLUDED.category, manufacturer = EXCLUDED.manufacturer,
    aliases = EXCLUDED.aliases, search_text = EXCLUDED.search_text, is_active = TRUE, import_batch = EXCLUDED.import_batch, updated_at = NOW();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION catalog_import(JSONB, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION catalog_import(JSONB, UUID) TO authenticated;

-- After a full load: hide what the new file no longer has (kept in the table so earlier ids stay valid).
CREATE OR REPLACE FUNCTION catalog_prune(p_batch UUID) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  IF NOT is_platform_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE catalog_materials SET is_active = FALSE, updated_at = NOW() WHERE is_active AND import_batch IS DISTINCT FROM p_batch;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION catalog_prune(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION catalog_prune(UUID) TO authenticated;
