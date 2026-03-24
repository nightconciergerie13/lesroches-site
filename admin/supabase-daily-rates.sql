-- ══════════════════════════════════════════════════════════════════
-- LES ROCHES — Table des tarifs journaliers
-- Exécuter dans Supabase → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════════════════

-- Table : un prix par villa par jour
CREATE TABLE IF NOT EXISTS daily_rates (
  villa_id        TEXT    REFERENCES villas(id) ON DELETE CASCADE,
  date            DATE    NOT NULL,
  price_per_night INTEGER NOT NULL,
  min_nights      INTEGER DEFAULT 3,
  PRIMARY KEY (villa_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_rates_villa ON daily_rates(villa_id);
CREATE INDEX IF NOT EXISTS idx_daily_rates_date  ON daily_rates(date);

-- Sécurité : lecture publique, écriture admin uniquement
ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_daily_rates" ON daily_rates;
DROP POLICY IF EXISTS "admin_write_daily_rates"  ON daily_rates;

CREATE POLICY "public_read_daily_rates" ON daily_rates
  FOR SELECT USING (true);

CREATE POLICY "admin_write_daily_rates" ON daily_rates
  FOR ALL USING (auth.role() = 'authenticated');
