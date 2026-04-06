-- Q&A 세션
CREATE TABLE IF NOT EXISTS qa_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID        NOT NULL REFERENCES users(id),
  teacher_id  UUID        NOT NULL REFERENCES users(id),
  academy_id  UUID        NOT NULL REFERENCES academies(id),
  lecture_id  UUID        REFERENCES lectures(id),
  title       VARCHAR(300),
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_sessions_student ON qa_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_teacher ON qa_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_academy ON qa_sessions(academy_id);

-- Q&A 메시지
CREATE TABLE IF NOT EXISTS qa_messages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID        NOT NULL REFERENCES qa_sessions(id) ON DELETE CASCADE,
  role                VARCHAR(10) NOT NULL CHECK (role IN ('user', 'ai', 'teacher')),
  content             TEXT        NOT NULL,
  is_escalated        BOOLEAN     NOT NULL DEFAULT false,
  escalated_at        TIMESTAMPTZ,
  escalation_response TEXT,
  source_chunks       UUID[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_messages_session   ON qa_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_messages_escalated ON qa_messages(is_escalated) WHERE is_escalated = true;
