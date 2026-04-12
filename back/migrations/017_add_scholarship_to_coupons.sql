ALTER TABLE claiq.academy_coupons
  ADD COLUMN IF NOT EXISTS award_condition TEXT,
  ADD COLUMN IF NOT EXISTS awarded_to UUID REFERENCES claiq.users(id);

CREATE INDEX IF NOT EXISTS idx_academy_coupons_awarded_to
  ON claiq.academy_coupons(awarded_to)
  WHERE awarded_to IS NOT NULL AND deleted_at IS NULL;
