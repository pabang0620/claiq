ALTER TABLE claiq.academy_coupons
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed'));
