-- 강의 자료 (파일 첨부)
CREATE TABLE IF NOT EXISTS lecture_materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id  UUID         NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  teacher_id  UUID         NOT NULL REFERENCES users(id),
  title       VARCHAR(300) NOT NULL,
  file_url    TEXT         NOT NULL,
  file_type   VARCHAR(50),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lecture_materials_lecture ON lecture_materials(lecture_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lecture_materials_teacher ON lecture_materials(teacher_id) WHERE deleted_at IS NULL;
