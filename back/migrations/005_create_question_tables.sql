-- 문제
CREATE TABLE IF NOT EXISTS questions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id        UUID         NOT NULL REFERENCES lectures(id),
  academy_id        UUID         NOT NULL REFERENCES academies(id),
  teacher_id        UUID         NOT NULL REFERENCES users(id),
  subject_id        UUID         NOT NULL REFERENCES subjects(id),
  question_type_id  UUID         REFERENCES question_types(id),
  type_code         VARCHAR(100),
  content           TEXT         NOT NULL,
  answer_type       VARCHAR(30)  NOT NULL CHECK (answer_type IN ('multiple_choice', 'short_answer')),
  correct_answer    VARCHAR(500) NOT NULL,
  explanation       TEXT,
  difficulty        CHAR(1)      NOT NULL CHECK (difficulty IN ('A', 'B', 'C')),
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       UUID         REFERENCES users(id),
  generation_prompt TEXT,
  source_chunks     UUID[],
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_questions_lecture    ON questions(lecture_id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_academy    ON questions(academy_id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_teacher    ON questions(teacher_id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_status     ON questions(status)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_type_code  ON questions(type_code)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty)  WHERE deleted_at IS NULL;

-- 객관식 선택지
CREATE TABLE IF NOT EXISTS question_options (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID         NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       CHAR(1)      NOT NULL CHECK (label IN ('1','2','3','4','5')),
  content     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);

-- 답안 제출
CREATE TABLE IF NOT EXISTS answer_submissions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID        NOT NULL REFERENCES users(id),
  question_id  UUID        NOT NULL REFERENCES questions(id),
  academy_id   UUID        NOT NULL REFERENCES academies(id),
  submitted    VARCHAR(500) NOT NULL,
  is_correct   BOOLEAN     NOT NULL,
  points_earned INTEGER    NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answer_submissions_student  ON answer_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_question ON answer_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_academy  ON answer_submissions(academy_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_date     ON answer_submissions(submitted_at);

-- 수강생 수능 유형별 누적 통계
CREATE TABLE IF NOT EXISTS student_type_stats (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID         NOT NULL REFERENCES users(id),
  academy_id        UUID         NOT NULL REFERENCES academies(id),
  type_code         VARCHAR(100) NOT NULL,
  subject_id        UUID         NOT NULL REFERENCES subjects(id),
  total_attempts    INTEGER      NOT NULL DEFAULT 0,
  correct_count     INTEGER      NOT NULL DEFAULT 0,
  correct_rate      DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
  last_attempted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, type_code)
);

CREATE INDEX IF NOT EXISTS idx_student_type_stats_student ON student_type_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_student_type_stats_rate    ON student_type_stats(student_id, correct_rate);
