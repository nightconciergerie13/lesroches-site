-- ══════════════════════════════════════════════════════════════════
-- LES ROCHES RETREAT — Analytics Tables
-- Exécute ce script dans Supabase → SQL Editor → New Query → Run
-- (après avoir exécuté supabase-setup.sql)
-- ══════════════════════════════════════════════════════════════════

-- ── TABLE PAGE VIEWS (tracking visiteurs) ──────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id          BIGSERIAL PRIMARY KEY,
  page        TEXT,          -- ex: 'villa-jade.html', 'index.html'
  referrer    TEXT,          -- document.referrer brut
  source      TEXT,          -- 'direct' | 'google' | 'instagram' | 'facebook' | 'other'
  utm_source  TEXT,          -- paramètre utm_source
  utm_medium  TEXT,          -- paramètre utm_medium
  utm_campaign TEXT,         -- paramètre utm_campaign
  country     TEXT,          -- pays en clair ex: 'France'
  country_code TEXT,         -- code ISO ex: 'FR'
  city        TEXT,          -- ville ex: 'Paris'
  device      TEXT,          -- 'mobile' | 'tablet' | 'desktop'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pv_created  ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_country  ON page_views(country_code);
CREATE INDEX IF NOT EXISTS idx_pv_source   ON page_views(source);
CREATE INDEX IF NOT EXISTS idx_pv_page     ON page_views(page);

-- ── RLS : insertion publique (tracker côté client), lecture admin ──
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_pv" ON page_views;
DROP POLICY IF EXISTS "admin_read_pv"    ON page_views;

CREATE POLICY "public_insert_pv" ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_pv" ON page_views
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── Ajouter colonnes nationalité + source dans reservations ────
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS nationality  TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS how_found    TEXT;
