-- 수능 과목 마스터
CREATE TABLE IF NOT EXISTS subjects (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         VARCHAR(50)  NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  area         VARCHAR(50)  NOT NULL,
  display_order INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 수능 문제 유형 마스터
CREATE TABLE IF NOT EXISTS question_types (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id      UUID        NOT NULL REFERENCES subjects(id),
  code            VARCHAR(100) NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  frequency_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  display_order   INTEGER      NOT NULL DEFAULT 0,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_types_subject ON question_types(subject_id);
