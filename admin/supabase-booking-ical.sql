-- ─────────────────────────────────────────────────────────────
-- Table : booking_ical
-- Stocke les URLs iCal Booking.com par villa
-- À exécuter une seule fois dans l'éditeur SQL de Supabase
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_ical (
  villa_id   text        PRIMARY KEY,
  ical_url   text,
  last_sync  timestamptz
);

-- Activer Row Level Security
ALTER TABLE booking_ical ENABLE ROW LEVEL SECURITY;

-- Politique : accès réservé aux utilisateurs authentifiés
CREATE POLICY "auth_only" ON booking_ical
  USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- NOTE : La colonne source dans blocked_dates doit déjà
-- accepter la valeur 'booking'. Si vous avez une contrainte
-- CHECK, ajoutez 'booking' à la liste autorisée :
--
-- ALTER TABLE blocked_dates
--   DROP CONSTRAINT IF EXISTS blocked_dates_source_check;
-- ALTER TABLE blocked_dates
--   ADD CONSTRAINT blocked_dates_source_check
--   CHECK (source IN ('admin', 'airbnb', 'booking'));
-- ─────────────────────────────────────────────────────────────
