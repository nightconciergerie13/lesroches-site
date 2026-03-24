-- ══════════════════════════════════════════════════════════════════
-- LES ROCHES RETREAT — Supabase Database Setup
-- Version "reset-safe" : efface l'existant avant de recréer
-- Exécute ce script dans Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

-- Supprimer les policies existantes si elles existent déjà
DROP POLICY IF EXISTS "public_read_villas"         ON villas;
DROP POLICY IF EXISTS "admin_write_villas"          ON villas;
DROP POLICY IF EXISTS "public_read_blocked"         ON blocked_dates;
DROP POLICY IF EXISTS "admin_write_blocked"         ON blocked_dates;
DROP POLICY IF EXISTS "public_insert_reservations"  ON reservations;
DROP POLICY IF EXISTS "admin_read_reservations"     ON reservations;
DROP POLICY IF EXISTS "admin_update_reservations"   ON reservations;
DROP POLICY IF EXISTS "admin_all_ical"              ON airbnb_ical;

-- ── 1. TABLE VILLAS (prix dynamiques) ──
CREATE TABLE IF NOT EXISTS villas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_night INTEGER NOT NULL,
  min_nights INTEGER DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prix initiaux (ne touche pas aux prix si déjà modifiés)
INSERT INTO villas (id, name, price_per_night, min_nights) VALUES
  ('jade',   'Casa Jade',  450, 3),
  ('topaze', 'Topaze',     420, 3),
  ('onyx',   'Onyx',       550, 3),
  ('agate',  'Agate',      350, 3),
  ('ambre',  'Ambre',      420, 3),
  ('opale',  'Opale',      480, 3)
ON CONFLICT (id) DO NOTHING;

-- ── 2. TABLE DATES BLOQUÉES ──
CREATE TABLE IF NOT EXISTS blocked_dates (
  id BIGSERIAL PRIMARY KEY,
  villa_id TEXT REFERENCES villas(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT DEFAULT 'admin',  -- 'admin' ou 'airbnb'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(villa_id, date)
);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_villa ON blocked_dates(villa_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date  ON blocked_dates(date);

-- ── 3. TABLE RÉSERVATIONS ──
CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  villa_id TEXT REFERENCES villas(id),
  villa_name TEXT,
  checkin DATE,
  checkout DATE,
  nights INTEGER,
  guests INTEGER,
  firstname TEXT,
  lastname TEXT,
  email TEXT,
  whatsapp TEXT,
  total_usd INTEGER,
  deposit_usd INTEGER,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. TABLE CONFIG AIRBNB iCal URLs ──
CREATE TABLE IF NOT EXISTS airbnb_ical (
  villa_id TEXT PRIMARY KEY REFERENCES villas(id),
  ical_url TEXT,
  last_sync TIMESTAMPTZ
);
INSERT INTO airbnb_ical (villa_id) VALUES
  ('jade'),('topaze'),('onyx'),('agate'),('ambre'),('opale')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- 5. ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE villas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbnb_ical   ENABLE ROW LEVEL SECURITY;

-- VILLAS : lecture publique, modification admin seulement
CREATE POLICY "public_read_villas" ON villas
  FOR SELECT USING (true);
CREATE POLICY "admin_write_villas" ON villas
  FOR ALL USING (auth.role() = 'authenticated');

-- BLOCKED_DATES : lecture publique, modification admin
CREATE POLICY "public_read_blocked" ON blocked_dates
  FOR SELECT USING (true);
CREATE POLICY "admin_write_blocked" ON blocked_dates
  FOR ALL USING (auth.role() = 'authenticated');

-- RESERVATIONS : insertion publique (clients), lecture/modif admin
CREATE POLICY "public_insert_reservations" ON reservations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_reservations" ON reservations
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_update_reservations" ON reservations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- AIRBNB ICAL : admin seulement
CREATE POLICY "admin_all_ical" ON airbnb_ical
  FOR ALL USING (auth.role() = 'authenticated');
