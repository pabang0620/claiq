-- 출결
CREATE TABLE IF NOT EXISTS attendances (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id  UUID        NOT NULL REFERENCES lectures(id),
  student_id  UUID        NOT NULL REFERENCES users(id),
  academy_id  UUID        NOT NULL REFERENCES academies(id),
  status      VARCHAR(20) NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by   UUID        NOT NULL REFERENCES users(id),
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lecture_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendances_lecture ON attendances(lecture_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_academy ON attendances(academy_id);

-- 포인트 잔액
CREATE TABLE IF NOT EXISTS points (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID    NOT NULL REFERENCES users(id) UNIQUE,
  balance     INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 포인트 거래 내역
CREATE TABLE IF NOT EXISTS point_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID         NOT NULL REFERENCES users(id),
  academy_id      UUID         NOT NULL REFERENCES academies(id),
  type            VARCHAR(50)  NOT NULL,
  amount          INTEGER      NOT NULL,
  balance_after   INTEGER      NOT NULL,
  reference_id    UUID,
  idempotency_key VARCHAR(255) UNIQUE,
  note            TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user    ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_academy ON point_transactions(academy_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_date    ON point_transactions(created_at);

-- 뱃지 정의 마스터
CREATE TABLE IF NOT EXISTS badge_definitions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(100) NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  icon_url        TEXT,
  condition_type  VARCHAR(50)  NOT NULL,
  condition_value INTEGER      NOT NULL,
  points_reward   INTEGER      NOT NULL DEFAULT 50,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 수강생 획득 뱃지
CREATE TABLE IF NOT EXISTS user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID        NOT NULL REFERENCES users(id),
  badge_id  UUID        NOT NULL REFERENCES badge_definitions(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- 학습 스트릭
CREATE TABLE IF NOT EXISTS learning_streaks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID    NOT NULL REFERENCES users(id) UNIQUE,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 성취 리포트
CREATE TABLE IF NOT EXISTS achievement_reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID        NOT NULL REFERENCES users(id),
  academy_id    UUID        NOT NULL REFERENCES academies(id),
  report_period VARCHAR(20) NOT NULL,
  content_json  JSONB       NOT NULL,
  sent_to_phone VARCHAR(20),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievement_reports_student ON achievement_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_achievement_reports_academy ON achievement_reports(academy_id);
