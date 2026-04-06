-- 미니 모의고사
CREATE TABLE IF NOT EXISTS mini_exams (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID         NOT NULL REFERENCES users(id),
  academy_id      UUID         NOT NULL REFERENCES academies(id),
  subject_id      UUID         NOT NULL REFERENCES subjects(id),
  title           VARCHAR(300) NOT NULL DEFAULT '개인 맞춤 미니 모의고사',
  total_questions INTEGER      NOT NULL DEFAULT 15,
  time_limit_sec  INTEGER      NOT NULL DEFAULT 1200,
  total_score     INTEGER      NOT NULL DEFAULT 100,
  status          VARCHAR(20)  NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'in_progress', 'submitted', 'graded')),
  started_at      TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  score           INTEGER,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mini_exams_student ON mini_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_mini_exams_academy ON mini_exams(academy_id);

-- 모의고사 문항
CREATE TABLE IF NOT EXISTS mini_exam_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         UUID         NOT NULL REFERENCES mini_exams(id) ON DELETE CASCADE,
  question_order  INTEGER      NOT NULL,
  content         TEXT         NOT NULL,
  answer_type     VARCHAR(30)  NOT NULL CHECK (answer_type IN ('multiple_choice', 'short_answer')),
  options         JSONB,
  correct_answer  VARCHAR(500) NOT NULL,
  type_code       VARCHAR(100) NOT NULL,
  type_name       VARCHAR(200) NOT NULL,
  difficulty      CHAR(1)      NOT NULL CHECK (difficulty IN ('A', 'B', 'C')),
  score           INTEGER      NOT NULL DEFAULT 5,
  explanation     TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mini_exam_questions_exam ON mini_exam_questions(exam_id);

-- 모의고사 답안
CREATE TABLE IF NOT EXISTS mini_exam_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         UUID         NOT NULL REFERENCES mini_exams(id),
  question_id     UUID         NOT NULL REFERENCES mini_exam_questions(id),
  student_id      UUID         NOT NULL REFERENCES users(id),
  submitted        VARCHAR(500) NOT NULL,
  is_correct      BOOLEAN      NOT NULL,
  score_earned    INTEGER      NOT NULL DEFAULT 0,
  type_code       VARCHAR(100) NOT NULL,
  submitted_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_mini_exam_submissions_exam    ON mini_exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_mini_exam_submissions_student ON mini_exam_submissions(student_id);
