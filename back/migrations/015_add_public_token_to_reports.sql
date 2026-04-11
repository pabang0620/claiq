-- 학부모 공개 리포트 링크용 public_token 컬럼 추가
ALTER TABLE achievement_reports
  ADD COLUMN IF NOT EXISTS public_token UUID UNIQUE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_achievement_reports_public_token
  ON achievement_reports(public_token)
  WHERE public_token IS NOT NULL;
