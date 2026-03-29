-- ══════════════════════════════════════════════════════════════════
-- LES ROCHES — Table des règles de tarification saisonnière
-- Cascade : daily_rates (override jour) > pricing_rules (saison) > villas.price_per_night (base)
-- Exécuter dans Supabase → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pricing_rules (
  id            BIGSERIAL    PRIMARY KEY,
  name          TEXT         NOT NULL,            -- ex: "Noël 2025", "Haute saison été 2025"
  villa_id      TEXT         REFERENCES villas(id) ON DELETE CASCADE,  -- NULL = toutes les villas
  start_date    DATE         NOT NULL,
  end_date      DATE         NOT NULL,
  price_per_night INTEGER    NOT NULL,
  min_nights    INTEGER      DEFAULT 3,
  priority      INTEGER      DEFAULT 10,          -- plus élevé = prioritaire (10=normal, 50=haute, 99=exceptions)
  active        BOOLEAN      DEFAULT true,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT    chk_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates    ON pricing_rules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_villa    ON pricing_rules(villa_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC);

-- Sécurité
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pricing_rules" ON pricing_rules;
DROP POLICY IF EXISTS "admin_write_pricing_rules"  ON pricing_rules;

CREATE POLICY "public_read_pricing_rules" ON pricing_rules
  FOR SELECT USING (active = true);

CREATE POLICY "admin_write_pricing_rules" ON pricing_rules
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Données initiales : saisons typiques Costa Rica ──────────────────────
-- (Ajuster les dates et prix selon votre calendrier)

INSERT INTO pricing_rules (name, villa_id, start_date, end_date, price_per_night, min_nights, priority) VALUES

-- ── NOËL & NOUVEL AN (toutes villas +30%) ──
('Noël & Nouvel An 2025-26', NULL, '2025-12-20', '2026-01-05', 720, 7, 99),

-- ── HAUTE SAISON : Dry Season Dec-Apr (toutes villas +15%) ──
('Haute saison sèche 2025-26', NULL, '2025-12-06', '2025-12-19', 560, 4, 50),
('Haute saison sèche 2026 Jan-Apr', NULL, '2026-01-06', '2026-04-30', 560, 4, 50),

-- ── SEMAINE SAINTE / EASTER (toutes villas +25%) ──
('Semana Santa 2026', NULL, '2026-03-28', '2026-04-06', 660, 5, 75),

-- ── BASSE SAISON : Green Season May-Nov (toutes villas -10%) ──
('Basse saison 2025', NULL, '2025-05-01', '2025-11-30', 380, 3, 30),
('Basse saison 2026', NULL, '2026-05-01', '2026-11-30', 380, 3, 30)

ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- Table: guests — historique client, fidélité, séjours
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS guests (
  id            BIGSERIAL    PRIMARY KEY,
  email         TEXT         UNIQUE NOT NULL,
  firstname     TEXT,
  lastname      TEXT,
  whatsapp      TEXT,
  stay_count    INTEGER      DEFAULT 0,
  first_stay    DATE,
  last_stay     DATE,
  total_nights  INTEGER      DEFAULT 0,
  total_spent   INTEGER      DEFAULT 0,           -- USD cents
  notes         TEXT,
  vip           BOOLEAN      DEFAULT false,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_email      ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_stay_count ON guests(stay_count DESC);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_guests" ON guests;
CREATE POLICY "admin_all_guests" ON guests
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Trigger : met à jour updated_at automatiquement ──
CREATE OR REPLACE FUNCTION update_guests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guests_updated_at ON guests;
CREATE TRIGGER trg_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_guests_updated_at();

-- ── Trigger : quand une réservation passe en 'confirmed', mettre à jour guests ──
CREATE OR REPLACE FUNCTION sync_guest_from_reservation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only act when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO guests (email, firstname, lastname, whatsapp, stay_count, first_stay, last_stay, total_nights, total_spent)
    VALUES (
      NEW.email,
      NEW.firstname,
      NEW.lastname,
      NEW.whatsapp,
      1,
      NEW.checkin,
      NEW.checkin,
      COALESCE(NEW.nights, 0),
      COALESCE(NEW.total_usd, 0)
    )
    ON CONFLICT (email) DO UPDATE SET
      stay_count   = guests.stay_count + 1,
      last_stay    = GREATEST(guests.last_stay, NEW.checkin),
      first_stay   = LEAST(guests.first_stay, NEW.checkin),
      total_nights = guests.total_nights + COALESCE(NEW.nights, 0),
      total_spent  = guests.total_spent  + COALESCE(NEW.total_usd, 0),
      firstname    = COALESCE(guests.firstname, NEW.firstname),
      lastname     = COALESCE(guests.lastname, NEW.lastname),
      whatsapp     = COALESCE(guests.whatsapp, NEW.whatsapp);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservation_sync_guest ON reservations;
CREATE TRIGGER trg_reservation_sync_guest
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION sync_guest_from_reservation();
