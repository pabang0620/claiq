-- 개인 학습 로드맵
CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID         NOT NULL REFERENCES users(id),
  academy_id    UUID         NOT NULL REFERENCES academies(id),
  dday_count    INTEGER      NOT NULL,
  suneung_date  DATE         NOT NULL,
  summary       TEXT,
  is_current    BOOLEAN      NOT NULL DEFAULT true,
  generated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_student ON learning_roadmaps(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_current ON learning_roadmaps(student_id) WHERE is_current = true;

-- 로드맵 세부 항목
CREATE TABLE IF NOT EXISTS roadmap_items (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id             UUID         NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  week_number            INTEGER      NOT NULL,
  type_code              VARCHAR(100) NOT NULL,
  type_name              VARCHAR(200) NOT NULL,
  priority_rank          INTEGER      NOT NULL,
  status                 VARCHAR(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  recommended_lecture_id UUID         REFERENCES lectures(id),
  note                   TEXT,
  completed_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap ON roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_week    ON roadmap_items(roadmap_id, week_number);
