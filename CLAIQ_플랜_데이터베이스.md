# CLAIQ 데이터베이스 구현 플랜

---

## 1. 전체 테이블 설계 (Phase 1~8)

### Phase 1 — 확장 및 기반 테이블

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 (교강사 / 수강생 / 운영자)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('teacher', 'student', 'operator')),
  phone         VARCHAR(20),
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_users_email     ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role      ON users(role)  WHERE deleted_at IS NULL;

-- 학원
CREATE TABLE academies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  code          VARCHAR(10)  NOT NULL UNIQUE,   -- 학원 고유 코드 (6자리 영숫자)
  address       TEXT,
  owner_id      UUID         NOT NULL REFERENCES users(id),
  suneung_date  DATE,                           -- 수능 시험일 (D-day 기준)
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_academies_code     ON academies(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_academies_owner_id ON academies(owner_id);

-- 학원 멤버 (교강사/수강생 소속)
CREATE TABLE academy_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id  UUID        NOT NULL REFERENCES academies(id),
  user_id     UUID        NOT NULL REFERENCES users(id),
  role        VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student', 'operator')),
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at     TIMESTAMPTZ,
  UNIQUE (academy_id, user_id)
);

CREATE INDEX idx_academy_members_academy ON academy_members(academy_id);
CREATE INDEX idx_academy_members_user    ON academy_members(user_id);

-- JWT 리프레시 토큰
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

### Phase 2 — 과목 및 수능 유형 마스터 데이터

```sql
-- 수능 과목 마스터
CREATE TABLE subjects (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         VARCHAR(50)  NOT NULL UNIQUE,   -- 예: 'KOR_LITERATURE'
  name         VARCHAR(100) NOT NULL,           -- 예: '국어 - 문학'
  area         VARCHAR(50)  NOT NULL,           -- 예: '국어', '수학', '영어'
  display_order INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 수능 문제 유형 마스터 (과목별 세부 유형)
CREATE TABLE question_types (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id      UUID        NOT NULL REFERENCES subjects(id),
  code            VARCHAR(100) NOT NULL UNIQUE,  -- 예: 'KOR_LIT_INFERENCE'
  name            VARCHAR(200) NOT NULL,          -- 예: '추론적 이해'
  description     TEXT,                           -- 출제 패턴 설명
  frequency_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,  -- 수능 출제 빈도 가중치 (0.0~1.0)
  display_order   INTEGER      NOT NULL DEFAULT 0,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_types_subject ON question_types(subject_id);
```

### Phase 3 — 강의 및 벡터 청크

```sql
-- 강의
CREATE TABLE lectures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID         NOT NULL REFERENCES academies(id),
  teacher_id      UUID         NOT NULL REFERENCES users(id),
  subject_id      UUID         NOT NULL REFERENCES subjects(id),
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  audio_url       TEXT,                        -- 업로드된 원본 음성 파일 URL
  material_urls   TEXT[],                      -- 강의 정리자료 파일 URL 배열
  transcript      TEXT,                        -- Whisper STT 변환 텍스트
  type_tags       VARCHAR(100)[],              -- 수능 유형 코드 배열 (GPT-4 매핑 결과)
  processing_status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'stt_processing', 'embedding', 'type_mapping', 'question_gen', 'done', 'error')),
  processing_error TEXT,
  scheduled_at    TIMESTAMPTZ,                 -- 수업 예정일시
  taught_at       TIMESTAMPTZ,                 -- 실제 수업일시
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_lectures_academy     ON lectures(academy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lectures_teacher     ON lectures(teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lectures_subject     ON lectures(subject_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lectures_status      ON lectures(processing_status) WHERE deleted_at IS NULL;

-- 강의 텍스트 청크 (RAG 벡터 저장)
CREATE TABLE lecture_chunks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id      UUID         NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  teacher_id      UUID         NOT NULL REFERENCES users(id),   -- RAG 네임스페이스 필터용
  academy_id      UUID         NOT NULL REFERENCES academies(id),
  chunk_index     INTEGER      NOT NULL,
  content         TEXT         NOT NULL,
  token_count     INTEGER,
  embedding       vector(1536),                -- text-embedding-3-small 차원
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- pgvector IVFFlat 인덱스 (상세: Section 2 참조)
CREATE INDEX idx_lecture_chunks_lecture   ON lecture_chunks(lecture_id);
CREATE INDEX idx_lecture_chunks_teacher   ON lecture_chunks(teacher_id);
CREATE INDEX idx_lecture_chunks_academy   ON lecture_chunks(academy_id);
```

### Phase 4 — 문제 및 선택지

```sql
-- 문제
CREATE TABLE questions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id        UUID         NOT NULL REFERENCES lectures(id),
  academy_id        UUID         NOT NULL REFERENCES academies(id),
  teacher_id        UUID         NOT NULL REFERENCES users(id),
  subject_id        UUID         NOT NULL REFERENCES subjects(id),
  question_type_id  UUID         REFERENCES question_types(id),
  type_code         VARCHAR(100),              -- 수능 유형 코드 (빠른 참조용)
  content           TEXT         NOT NULL,     -- 문제 본문
  answer_type       VARCHAR(30)  NOT NULL CHECK (answer_type IN ('multiple_choice', 'short_answer')),
  correct_answer    VARCHAR(500) NOT NULL,     -- 객관식: '1'~'5', 단답형: 정답 텍스트
  explanation       TEXT,                      -- 해설
  difficulty        CHAR(1)      NOT NULL CHECK (difficulty IN ('A', 'B', 'C')),
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       UUID         REFERENCES users(id),
  generation_prompt TEXT,                      -- 생성에 사용된 프롬프트 (추적용)
  source_chunks     UUID[],                    -- 사용된 lecture_chunks.id 배열 (추적용)
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_questions_lecture   ON questions(lecture_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_academy   ON questions(academy_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_teacher   ON questions(teacher_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_status    ON questions(status)      WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_type_code ON questions(type_code)   WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_difficulty ON questions(difficulty) WHERE deleted_at IS NULL;

-- 객관식 선택지
CREATE TABLE question_options (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID         NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       CHAR(1)      NOT NULL CHECK (label IN ('1','2','3','4','5')),
  content     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_options_question ON question_options(question_id);

-- 답안 제출
CREATE TABLE answer_submissions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID        NOT NULL REFERENCES users(id),
  question_id  UUID        NOT NULL REFERENCES questions(id),
  academy_id   UUID        NOT NULL REFERENCES academies(id),
  submitted    VARCHAR(500) NOT NULL,
  is_correct   BOOLEAN     NOT NULL,
  points_earned INTEGER    NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answer_submissions_student  ON answer_submissions(student_id);
CREATE INDEX idx_answer_submissions_question ON answer_submissions(question_id);
CREATE INDEX idx_answer_submissions_academy  ON answer_submissions(academy_id);
CREATE INDEX idx_answer_submissions_date     ON answer_submissions(submitted_at);

-- 수강생 수능 유형별 누적 통계 (빠른 조회용 집계 테이블)
CREATE TABLE student_type_stats (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID         NOT NULL REFERENCES users(id),
  academy_id       UUID         NOT NULL REFERENCES academies(id),
  type_code        VARCHAR(100) NOT NULL,
  subject_id       UUID         NOT NULL REFERENCES subjects(id),
  total_attempts   INTEGER      NOT NULL DEFAULT 0,
  correct_count    INTEGER      NOT NULL DEFAULT 0,
  correct_rate     DECIMAL(5,4) NOT NULL DEFAULT 0.0000,  -- 0.0000~1.0000
  last_attempted_at TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, type_code)
);

CREATE INDEX idx_student_type_stats_student ON student_type_stats(student_id);
CREATE INDEX idx_student_type_stats_rate    ON student_type_stats(student_id, correct_rate);
```

### Phase 5 — Q&A (RAG 채팅)

```sql
-- Q&A 세션
CREATE TABLE qa_sessions (
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

CREATE INDEX idx_qa_sessions_student ON qa_sessions(student_id);
CREATE INDEX idx_qa_sessions_teacher ON qa_sessions(teacher_id);
CREATE INDEX idx_qa_sessions_academy ON qa_sessions(academy_id);

-- Q&A 메시지
CREATE TABLE qa_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID        NOT NULL REFERENCES qa_sessions(id) ON DELETE CASCADE,
  role            VARCHAR(10) NOT NULL CHECK (role IN ('user', 'ai', 'teacher')),
  content         TEXT        NOT NULL,
  is_escalated    BOOLEAN     NOT NULL DEFAULT false,
  escalated_at    TIMESTAMPTZ,
  escalation_response TEXT,
  source_chunks   UUID[],                    -- 사용된 lecture_chunks.id
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qa_messages_session    ON qa_messages(session_id);
CREATE INDEX idx_qa_messages_escalated  ON qa_messages(is_escalated) WHERE is_escalated = true;
```

### Phase 6 — 학습 로드맵

```sql
-- 개인 학습 로드맵
CREATE TABLE learning_roadmaps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID         NOT NULL REFERENCES users(id),
  academy_id    UUID         NOT NULL REFERENCES academies(id),
  dday_count    INTEGER      NOT NULL,        -- 생성 시점 수능까지 남은 일수
  suneung_date  DATE         NOT NULL,
  summary       TEXT,                         -- GPT-4 생성 로드맵 요약 텍스트
  is_current    BOOLEAN      NOT NULL DEFAULT true,
  generated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,                  -- 다음 주 갱신 예정 시각
  UNIQUE (student_id, is_current) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_learning_roadmaps_student ON learning_roadmaps(student_id);
CREATE INDEX idx_learning_roadmaps_current ON learning_roadmaps(student_id) WHERE is_current = true;

-- 로드맵 세부 항목
CREATE TABLE roadmap_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id      UUID         NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  week_number     INTEGER      NOT NULL,       -- 1~N주차
  type_code       VARCHAR(100) NOT NULL,
  type_name       VARCHAR(200) NOT NULL,
  priority_rank   INTEGER      NOT NULL,       -- 해당 주 내 우선순위
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  recommended_lecture_id UUID  REFERENCES lectures(id),
  note            TEXT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_items_roadmap ON roadmap_items(roadmap_id);
CREATE INDEX idx_roadmap_items_week    ON roadmap_items(roadmap_id, week_number);
```

### Phase 7 — 미니 모의고사

```sql
-- 미니 모의고사
CREATE TABLE mini_exams (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID         NOT NULL REFERENCES users(id),
  academy_id        UUID         NOT NULL REFERENCES academies(id),
  subject_id        UUID         NOT NULL REFERENCES subjects(id),
  title             VARCHAR(300) NOT NULL DEFAULT '개인 맞춤 미니 모의고사',
  total_questions   INTEGER      NOT NULL DEFAULT 15,
  time_limit_sec    INTEGER      NOT NULL DEFAULT 1200,  -- 기본 20분
  total_score       INTEGER      NOT NULL DEFAULT 100,
  status            VARCHAR(20)  NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'in_progress', 'submitted', 'graded')),
  started_at        TIMESTAMPTZ,
  submitted_at      TIMESTAMPTZ,
  score             INTEGER,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mini_exams_student ON mini_exams(student_id);
CREATE INDEX idx_mini_exams_academy ON mini_exams(academy_id);

-- 모의고사 문항 (개별 생성)
CREATE TABLE mini_exam_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         UUID         NOT NULL REFERENCES mini_exams(id) ON DELETE CASCADE,
  question_order  INTEGER      NOT NULL,
  content         TEXT         NOT NULL,
  answer_type     VARCHAR(30)  NOT NULL CHECK (answer_type IN ('multiple_choice', 'short_answer')),
  options         JSONB,                       -- 5지선다 선택지 배열 [{label, content}]
  correct_answer  VARCHAR(500) NOT NULL,
  type_code       VARCHAR(100) NOT NULL,
  type_name       VARCHAR(200) NOT NULL,
  difficulty      CHAR(1)      NOT NULL CHECK (difficulty IN ('A', 'B', 'C')),
  score           INTEGER      NOT NULL DEFAULT 5,
  explanation     TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mini_exam_questions_exam ON mini_exam_questions(exam_id);

-- 모의고사 답안 제출
CREATE TABLE mini_exam_submissions (
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

CREATE INDEX idx_mini_exam_submissions_exam    ON mini_exam_submissions(exam_id);
CREATE INDEX idx_mini_exam_submissions_student ON mini_exam_submissions(student_id);
```

### Phase 8 — 출결 / 포인트 / 뱃지 / 리포트

```sql
-- 출결
CREATE TABLE attendances (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id  UUID        NOT NULL REFERENCES lectures(id),
  student_id  UUID        NOT NULL REFERENCES users(id),
  academy_id  UUID        NOT NULL REFERENCES academies(id),
  status      VARCHAR(20) NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by   UUID        NOT NULL REFERENCES users(id),   -- 출결 표기한 교강사
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lecture_id, student_id)
);

CREATE INDEX idx_attendances_lecture  ON attendances(lecture_id);
CREATE INDEX idx_attendances_student  ON attendances(student_id);
CREATE INDEX idx_attendances_academy  ON attendances(academy_id);

-- 포인트 잔액
CREATE TABLE points (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID    NOT NULL REFERENCES users(id) UNIQUE,
  balance     INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 포인트 거래 내역
CREATE TABLE point_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID         NOT NULL REFERENCES users(id),
  academy_id      UUID         NOT NULL REFERENCES academies(id),
  type            VARCHAR(50)  NOT NULL,
    -- 'daily_attendance'(+10), 'correct_a'(+5), 'correct_b'(+10), 'correct_c'(+20),
    -- 'qa_use'(+2, 하루 최대 5회), 'streak_7'(+30), 'streak_30'(+100),
    -- 'weekly_goal'(+50), 'badge_earned', 'redeem'(음수)
  amount          INTEGER      NOT NULL,   -- 양수: 적립, 음수: 차감
  balance_after   INTEGER      NOT NULL,
  reference_id    UUID,                    -- 관련 엔티티 ID (제출 ID, 뱃지 ID 등)
  idempotency_key VARCHAR(255) UNIQUE,     -- 중복 지급 방지
  note            TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_user    ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_academy ON point_transactions(academy_id);
CREATE INDEX idx_point_transactions_date    ON point_transactions(created_at);

-- 뱃지 정의 마스터
CREATE TABLE badge_definitions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          VARCHAR(100) NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  icon_url      TEXT,
  condition_type VARCHAR(50) NOT NULL,
    -- 'streak_days', 'quiz_count', 'correct_rate', 'perfect_count', 'qa_count', 'monthly_attendance'
  condition_value INTEGER    NOT NULL,
  points_reward  INTEGER     NOT NULL DEFAULT 50,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 수강생 획득 뱃지
CREATE TABLE user_badges (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id),
  badge_id      UUID        NOT NULL REFERENCES badge_definitions(id),
  earned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- 학습 스트릭
CREATE TABLE learning_streaks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID    NOT NULL REFERENCES users(id) UNIQUE,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 성취 리포트 (학부모 발송용)
CREATE TABLE achievement_reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID        NOT NULL REFERENCES users(id),
  academy_id    UUID        NOT NULL REFERENCES academies(id),
  report_period VARCHAR(20) NOT NULL,           -- 예: '2026-03' (월 단위)
  content_json  JSONB       NOT NULL,           -- 출결/문제풀이/약점/포인트 요약
  sent_to_phone VARCHAR(20),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievement_reports_student ON achievement_reports(student_id);
CREATE INDEX idx_achievement_reports_academy ON achievement_reports(academy_id);
```

---

## 2. pgvector 인덱스 설계

```sql
-- IVFFlat 인덱스 (코사인 유사도 기준)
-- lists 값: 전체 벡터 수의 제곱근 (예: 10,000개 → lists=100)
-- 초기 설정: lists=100, 운영 중 데이터 증가에 따라 조정

CREATE INDEX idx_lecture_chunks_embedding
  ON lecture_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 인덱스 효과적으로 사용하기 위한 세션 파라미터 설정
-- (벡터 수가 증가하면 probes 값도 함께 조정)
SET ivfflat.probes = 10;  -- 검색 정확도 vs 속도 트레이드오프 (기본 1, 높을수록 정확)

-- 유사도 검색 예시 쿼리
-- teacher_id 필터로 해당 교강사 강의 범위 내에서만 검색
SELECT
  lc.id,
  lc.lecture_id,
  lc.content,
  1 - (lc.embedding <=> $1::vector) AS similarity
FROM lecture_chunks lc
WHERE lc.teacher_id = $2
  AND lc.academy_id = $3
ORDER BY lc.embedding <=> $1::vector
LIMIT 5;

-- 인덱스 상태 확인
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE tablename = 'lecture_chunks';

-- HNSW 인덱스 (데이터 10만 건 이상 시 전환 권장 — 빌드 느리지만 검색 빠름)
-- CREATE INDEX idx_lecture_chunks_embedding_hnsw
--   ON lecture_chunks
--   USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);
```

---

## 3. 마이그레이션 파일 구성

```
migrations/
├── 001_init_extensions.sql          -- pgvector, uuid-ossp 확장
├── 002_create_user_tables.sql       -- users, academies, academy_members, refresh_tokens
├── 003_create_master_tables.sql     -- subjects, question_types
├── 004_create_lecture_tables.sql    -- lectures, lecture_chunks (vector 컬럼 + IVFFlat 인덱스)
├── 005_create_question_tables.sql   -- questions, question_options, answer_submissions, student_type_stats
├── 006_create_qa_tables.sql         -- qa_sessions, qa_messages
├── 007_create_roadmap_tables.sql    -- learning_roadmaps, roadmap_items
├── 008_create_exam_tables.sql       -- mini_exams, mini_exam_questions, mini_exam_submissions
├── 009_create_engagement_tables.sql -- attendances, points, point_transactions,
│                                    -- badge_definitions, user_badges, learning_streaks,
│                                    -- achievement_reports
└── 010_create_indexes.sql           -- 추가 복합 인덱스, 파티셔닝 준비

seeds/
├── 001_subjects.sql                 -- 수능 전 과목 (8개 영역 28개 과목)
├── 002_question_types.sql           -- 과목별 수능 유형 코드 (국어 15종, 수학 20종 등)
├── 003_badge_definitions.sql        -- MVP 뱃지 정의 (7종)
└── 004_demo_data.sql                -- 데모용 학원/교강사/수강생 시드
```

### 마이그레이션 실행 순서 스크립트

```sql
-- run_migrations.sh 에서 아래 순서로 실행
psql $DATABASE_URL -f migrations/001_init_extensions.sql
psql $DATABASE_URL -f migrations/002_create_user_tables.sql
psql $DATABASE_URL -f migrations/003_create_master_tables.sql
psql $DATABASE_URL -f migrations/004_create_lecture_tables.sql
psql $DATABASE_URL -f migrations/005_create_question_tables.sql
psql $DATABASE_URL -f migrations/006_create_qa_tables.sql
psql $DATABASE_URL -f migrations/007_create_roadmap_tables.sql
psql $DATABASE_URL -f migrations/008_create_exam_tables.sql
psql $DATABASE_URL -f migrations/009_create_engagement_tables.sql
psql $DATABASE_URL -f migrations/010_create_indexes.sql

psql $DATABASE_URL -f seeds/001_subjects.sql
psql $DATABASE_URL -f seeds/002_question_types.sql
psql $DATABASE_URL -f seeds/003_badge_definitions.sql
psql $DATABASE_URL -f seeds/004_demo_data.sql
```

---

## 4. 시드 데이터 목록

### subjects (MVP: 국어/수학/영어 3대 과목 활성화)

> MVP에서는 국어/수학/영어만 `is_active = true`로 설정.
> 나머지는 향후 확장을 위해 `is_active = false`로 삽입.

```sql
-- MVP 활성 과목 (국어/수학/영어)
INSERT INTO subjects (code, name, area, display_order, is_active) VALUES
-- 국어 (MVP 활성)
('KOR_READING',    '국어 - 독서',   '국어', 1, true),
('KOR_LITERATURE', '국어 - 문학',   '국어', 2, true),
('KOR_LANGUAGE',   '언어와 매체',   '국어', 3, true),
('KOR_SPEECH',     '화법과 작문',   '국어', 4, true),
-- 수학 (MVP 활성)
('MATH_1',         '수학 I',        '수학', 5, true),
('MATH_2',         '수학 II',       '수학', 6, true),
('MATH_CALC',      '미적분',        '수학', 7, true),
('MATH_STAT',      '확률과 통계',   '수학', 8, true),
('MATH_GEO',       '기하',          '수학', 9, true),
-- 영어 (MVP 활성)
('ENG_READING',    '영어 독해',     '영어', 10, true),
('ENG_LISTENING',  '영어 듣기',     '영어', 11, true),
-- 아래는 향후 확장용 (비활성)
('HISTORY_KOR',    '한국사',        '한국사',  12, false),
('SOC_ETHICS',     '생활과 윤리',   '사회탐구', 13, false),
('SOC_CULTURE',    '사회·문화',     '사회탐구', 14, false),
('SCI_BIO1',       '생명과학 I',    '과학탐구', 15, false),
('SCI_EARTH1',     '지구과학 I',    '과학탐구', 16, false),
('SCI_CHEM1',      '화학 I',        '과학탐구', 17, false),
('SCI_PHYSICS1',   '물리학 I',      '과학탐구', 18, false);
```

### question_types (수능 유형 예시 — 국어 독서 중심)

```sql
-- 국어 독서 유형
INSERT INTO question_types (subject_id, code, name, description, frequency_weight, display_order)
SELECT s.id, v.code, v.name, v.description, v.weight, v.ord
FROM subjects s
CROSS JOIN (VALUES
  ('KOR_READ_FACT',       '사실적 이해',     '글에서 직접 확인할 수 있는 정보를 정확히 파악하는 유형', 0.90, 1),
  ('KOR_READ_INFERENCE',  '추론적 이해',     '직접 언급되지 않은 내용을 추론하거나 전제를 파악하는 유형', 0.95, 2),
  ('KOR_READ_BLANK',      '빈칸 추론',       '문맥에 맞는 표현이나 개념을 추론하여 빈칸을 채우는 유형', 0.85, 3),
  ('KOR_READ_APPLY',      '적용·감상',       '제시된 관점·원리·사례를 다른 상황에 적용하는 유형', 0.80, 4),
  ('KOR_READ_CRITICAL',   '비판적 이해',     '글의 논리적 타당성, 주장·근거 관계를 분석·평가하는 유형', 0.75, 5),
  ('KOR_READ_VOCAB',      '어휘·어법',       '문맥상 단어의 의미, 문법적 기능을 파악하는 유형', 0.70, 6)
) AS v(code, name, description, weight, ord)
WHERE s.code = 'KOR_READING';

-- 수학 미적분 유형 (일부)
INSERT INTO question_types (subject_id, code, name, description, frequency_weight, display_order)
SELECT s.id, v.code, v.name, v.description, v.weight, v.ord
FROM subjects s
CROSS JOIN (VALUES
  ('MATH_CALC_LIMIT',     '극한',            '함수의 극한값 계산 및 극한의 성질 적용', 0.90, 1),
  ('MATH_CALC_DERIV',     '미분',            '도함수 계산, 극값·최댓값·최솟값 분석', 0.95, 2),
  ('MATH_CALC_INTEGRAL',  '적분',            '부정적분·정적분 계산 및 활용', 0.90, 3),
  ('MATH_CALC_EXTREMUM',  '극값 분석',       '함수의 증감표 작성, 극대·극소 판별', 0.85, 4),
  ('MATH_CALC_AREA',      '넓이·부피',       '정적분으로 넓이·부피를 계산하는 활용 유형', 0.80, 5)
) AS v(code, name, description, weight, ord)
WHERE s.code = 'MATH_CALC';
```

### badge_definitions (MVP 뱃지 7종)

```sql
-- seeds/003_badge_definitions.sql
INSERT INTO badge_definitions (code, name, description, condition_type, condition_value, points_reward) VALUES
('QUIZ_FIRST',    '첫 문제 도전',      '첫 번째 문제를 제출했어요!',               'quiz_count',    1,   0),
('STREAK_7',      '7일 연속 학습',     '7일 연속으로 학습했어요!',                 'streak_days',   7,   30),
('STREAK_30',     '30일 연속 학습',    '30일 연속으로 학습했어요!',                'streak_days',   30,  100),
('QUIZ_50',       '문제 50개 돌파',    '문제를 50개 이상 풀었어요!',               'quiz_count',    50,  30),
('QUIZ_100',      '문제 100개 돌파',   '문제를 100개 이상 풀었어요!',              'quiz_count',    100, 50),
('CORRECT_90',    '정답률 90% 달성',   '20문제 이상 풀고 정답률 90%를 달성했어요!', 'correct_rate',  90,  50),
('QA_EXPLORER',   '질문 탐험가',       'AI Q&A를 10회 이상 이용했어요!',           'qa_count',      10,  20);
```

### demo_data (데모용 시드)

```sql
-- seeds/004_demo_data.sql
-- 비밀번호는 'demo1234'의 bcrypt 해시 (실제 실행 전 생성)

-- 운영자 (학원장)
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'operator@demo.claiq.kr', '[bcrypt hash]', '정민석', 'operator', '010-1234-5678');

-- 교강사
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000002',
   'teacher1@demo.claiq.kr', '[bcrypt hash]', '이준혁', 'teacher', '010-2345-6789'),
  ('00000000-0000-0000-0000-000000000003',
   'teacher2@demo.claiq.kr', '[bcrypt hash]', '박서연', 'teacher', '010-3456-7890');

-- 수강생 5명
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000010',
   's1@demo.claiq.kr', '[bcrypt hash]', '김민준', 'student', '010-4567-8901'),
  ('00000000-0000-0000-0000-000000000011',
   's2@demo.claiq.kr', '[bcrypt hash]', '최서아', 'student', '010-5678-9012'),
  ('00000000-0000-0000-0000-000000000012',
   's3@demo.claiq.kr', '[bcrypt hash]', '박지호', 'student', '010-6789-0123'),
  ('00000000-0000-0000-0000-000000000013',
   's4@demo.claiq.kr', '[bcrypt hash]', '이하은', 'student', '010-7890-1234'),
  ('00000000-0000-0000-0000-000000000014',
   's5@demo.claiq.kr', '[bcrypt hash]', '정우성', 'student', '010-8901-2345');

-- 학원 (수능일: 2026-11-19)
INSERT INTO academies (id, name, code, owner_id, suneung_date) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '정상수능학원', 'STAR01',
   '00000000-0000-0000-0000-000000000001',
   '2026-11-19');

-- 멤버 등록
INSERT INTO academy_members (academy_id, user_id, role) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'operator'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 'teacher'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', 'teacher'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000010', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000011', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000012', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000013', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000014', 'student');

-- 포인트 초기 잔액 (수강생)
INSERT INTO points (user_id, balance, total_earned) VALUES
  ('00000000-0000-0000-0000-000000000010', 0, 0),
  ('00000000-0000-0000-0000-000000000011', 0, 0),
  ('00000000-0000-0000-0000-000000000012', 0, 0),
  ('00000000-0000-0000-0000-000000000013', 0, 0),
  ('00000000-0000-0000-0000-000000000014', 0, 0);

-- 학습 스트릭 초기값
INSERT INTO learning_streaks (user_id, current_streak, longest_streak) VALUES
  ('00000000-0000-0000-0000-000000000010', 0, 0),
  ('00000000-0000-0000-0000-000000000011', 0, 0),
  ('00000000-0000-0000-0000-000000000012', 0, 0),
  ('00000000-0000-0000-0000-000000000013', 0, 0),
  ('00000000-0000-0000-0000-000000000014', 0, 0);
```

---

## 5. 핵심 쿼리 패턴 6개

### 쿼리 1 — RAG 유사도 검색 (교강사 네임스페이스 필터)

```sql
-- 수강생 질문에 대해 해당 교강사 강의 범위 내에서 상위 K개 청크 검색
-- $1: 질문 임베딩 벡터, $2: teacher_id, $3: academy_id, $4: top_k

SELECT
  lc.id,
  lc.lecture_id,
  lc.chunk_index,
  lc.content,
  1 - (lc.embedding <=> $1::vector) AS similarity
FROM lecture_chunks lc
JOIN lectures l ON l.id = lc.lecture_id AND l.deleted_at IS NULL
WHERE lc.teacher_id = $2
  AND lc.academy_id = $3
ORDER BY lc.embedding <=> $1::vector
LIMIT $4;
```

### 쿼리 2 — 수강생 수능 유형별 약점 집계

```sql
-- 특정 수강생의 과목별 수능 유형 정답률 조회 (낮은 순 정렬)
-- $1: student_id, $2: subject_id (선택적 필터)

SELECT
  sts.type_code,
  qt.name             AS type_name,
  sts.total_attempts,
  sts.correct_count,
  sts.correct_rate,
  qt.frequency_weight,
  -- 로드맵 우선순위 점수: 정답률 낮고 수능 출제빈도 높을수록 높음
  (1.0 - sts.correct_rate) * qt.frequency_weight AS priority_score
FROM student_type_stats sts
JOIN question_types qt ON qt.code = sts.type_code
JOIN subjects s ON s.id = qt.subject_id
WHERE sts.student_id = $1
  AND ($2::UUID IS NULL OR s.id = $2)
  AND sts.total_attempts >= 3   -- 최소 3회 이상 시도한 유형만 집계
ORDER BY priority_score DESC;
```

### 쿼리 3 — 이탈 위험 수강생 탐지

```sql
-- 최근 7일 내 특정 학원 수강생들의 이탈 위험 점수 계산
-- $1: academy_id, $2: 기준 날짜 (CURRENT_DATE - 7)

WITH stats AS (
  SELECT
    u.id         AS student_id,
    u.name       AS student_name,
    u.phone,
    -- 최근 7일 출석률 (해당 기간 수업 수 대비)
    COALESCE(
      COUNT(a.id) FILTER (WHERE a.status = 'present' AND a.marked_at >= $2)
      ::DECIMAL /
      NULLIF(COUNT(DISTINCT l.id) FILTER (WHERE l.taught_at >= $2), 0),
      0
    ) AS attendance_rate_7d,
    -- 최근 7일 문제 풀이 횟수
    COUNT(ans.id) FILTER (WHERE ans.submitted_at >= $2) AS quiz_count_7d,
    -- 마지막 활동일
    GREATEST(
      MAX(a.marked_at),
      MAX(ans.submitted_at),
      MAX(qm.created_at)
    ) AS last_active_at
  FROM users u
  JOIN academy_members am ON am.user_id = u.id AND am.academy_id = $1 AND am.status = 'active'
  LEFT JOIN attendances a     ON a.student_id = u.id AND a.academy_id = $1
  LEFT JOIN answer_submissions ans ON ans.student_id = u.id AND ans.academy_id = $1
  LEFT JOIN qa_sessions qs    ON qs.student_id = u.id AND qs.academy_id = $1
  LEFT JOIN qa_messages qm    ON qm.session_id = qs.id
  LEFT JOIN lectures l        ON l.academy_id = $1 AND l.deleted_at IS NULL
  WHERE u.role = 'student'
  GROUP BY u.id, u.name, u.phone
)
SELECT
  student_id,
  student_name,
  phone,
  attendance_rate_7d,
  quiz_count_7d,
  last_active_at,
  -- 이탈 위험 점수 (0.0~1.0, 높을수록 위험)
  LEAST(1.0,
    (1.0 - attendance_rate_7d) * 0.4 +
    CASE WHEN quiz_count_7d = 0 THEN 0.4
         WHEN quiz_count_7d < 5 THEN 0.2
         ELSE 0.0 END +
    CASE WHEN last_active_at < CURRENT_DATE - 7 THEN 0.2
         WHEN last_active_at < CURRENT_DATE - 3 THEN 0.1
         ELSE 0.0 END
  ) AS churn_score
FROM stats
WHERE (1.0 - attendance_rate_7d) * 0.4 +
      CASE WHEN quiz_count_7d = 0 THEN 0.4 ELSE 0.0 END > 0.3
ORDER BY churn_score DESC;
```

### 쿼리 4 — 강의별 이해도 집계 (운영자 대시보드)

```sql
-- 특정 학원의 강의별 정답률 및 질문 빈도 집계
-- $1: academy_id, $2: 조회 기간 시작일

SELECT
  l.id                    AS lecture_id,
  l.title                 AS lecture_title,
  u.name                  AS teacher_name,
  s.name                  AS subject_name,
  COUNT(DISTINCT ans.student_id)             AS participating_students,
  COUNT(ans.id)                              AS total_submissions,
  ROUND(AVG(ans.is_correct::INT) * 100, 1)  AS overall_correct_rate,
  -- 난이도별 정답률
  ROUND(AVG(ans.is_correct::INT) FILTER (WHERE q.difficulty = 'A') * 100, 1) AS rate_a,
  ROUND(AVG(ans.is_correct::INT) FILTER (WHERE q.difficulty = 'B') * 100, 1) AS rate_b,
  ROUND(AVG(ans.is_correct::INT) FILTER (WHERE q.difficulty = 'C') * 100, 1) AS rate_c,
  -- Q&A 질문 빈도
  COUNT(DISTINCT qm.id) FILTER (WHERE qm.role = 'user') AS qa_question_count
FROM lectures l
JOIN users u ON u.id = l.teacher_id
JOIN subjects s ON s.id = l.subject_id
LEFT JOIN questions q ON q.lecture_id = l.id AND q.status = 'approved' AND q.deleted_at IS NULL
LEFT JOIN answer_submissions ans ON ans.question_id = q.id AND ans.submitted_at >= $2
LEFT JOIN qa_sessions qs ON qs.lecture_id = l.id
LEFT JOIN qa_messages qm ON qm.session_id = qs.id
WHERE l.academy_id = $1
  AND l.deleted_at IS NULL
  AND l.taught_at >= $2
GROUP BY l.id, l.title, u.name, s.name
ORDER BY l.taught_at DESC;
```

### 쿼리 5 — 포인트 트랜잭션 멱등성 보장 upsert

```sql
-- 포인트 지급 (중복 방지 포함)
-- $1: user_id, $2: academy_id, $3: type, $4: amount, $5: reference_id, $6: idempotency_key

WITH existing AS (
  SELECT id FROM point_transactions WHERE idempotency_key = $6
),
inserted AS (
  INSERT INTO point_transactions (user_id, academy_id, type, amount, balance_after, reference_id, idempotency_key)
  SELECT
    $1, $2, $3, $4,
    (SELECT balance FROM points WHERE user_id = $1 FOR UPDATE) + $4,
    $5, $6
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
)
UPDATE points
SET balance    = balance + $4,
    total_earned = CASE WHEN $4 > 0 THEN total_earned + $4 ELSE total_earned END,
    updated_at = NOW()
WHERE user_id = $1
  AND EXISTS (SELECT 1 FROM inserted);
```

### 쿼리 6 — 개인 D-day 로드맵 생성을 위한 데이터 수집

```sql
-- 로드맵 생성에 필요한 종합 데이터 조회 (단일 쿼리)
-- $1: student_id, $2: academy_id

WITH weak_types AS (
  SELECT
    sts.type_code,
    qt.name         AS type_name,
    s.name          AS subject_name,
    sts.correct_rate,
    qt.frequency_weight,
    (1.0 - sts.correct_rate) * qt.frequency_weight AS priority_score
  FROM student_type_stats sts
  JOIN question_types qt ON qt.code = sts.type_code
  JOIN subjects s ON s.id = qt.subject_id
  WHERE sts.student_id = $1
    AND sts.total_attempts >= 3
  ORDER BY priority_score DESC
  LIMIT 10
),
upcoming_lectures AS (
  SELECT
    l.id,
    l.title,
    l.scheduled_at,
    s.name AS subject_name,
    l.type_tags
  FROM lectures l
  JOIN subjects s ON s.id = l.subject_id
  JOIN academy_members am ON am.academy_id = l.academy_id AND am.user_id = $1
  WHERE l.academy_id = $2
    AND l.scheduled_at >= NOW()
    AND l.deleted_at IS NULL
  ORDER BY l.scheduled_at ASC
  LIMIT 20
),
academy_info AS (
  SELECT suneung_date
  FROM academies
  WHERE id = $2
)
SELECT
  (SELECT suneung_date FROM academy_info)        AS suneung_date,
  (SELECT CURRENT_DATE)                          AS today,
  (SELECT suneung_date - CURRENT_DATE FROM academy_info) AS dday_count,
  (SELECT json_agg(wt.*) FROM weak_types wt)    AS weak_types,
  (SELECT json_agg(ul.*) FROM upcoming_lectures ul) AS upcoming_lectures;
```

---

## 6. RLS 정책 설계

> CLAIQ는 자체 Node.js 백엔드에서 역할 검증을 수행하므로 RLS는 심층 방어(defense in depth) 레이어로 적용합니다.

```sql
-- RLS 활성화
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_chunks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_type_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_roadmaps    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_exams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances          ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions   ENABLE ROW LEVEL SECURITY;

-- 애플리케이션 접속용 역할 생성 (superuser 권한 없는 서비스 계정)
CREATE ROLE claiq_app LOGIN PASSWORD 'app_password';

-- 기본 정책: 본인 데이터만 접근
CREATE POLICY users_self_access ON users
  FOR ALL TO claiq_app
  USING (id = current_setting('app.current_user_id')::UUID);

-- 학원 멤버: 같은 학원 데이터만 접근
CREATE POLICY academy_members_policy ON academy_members
  FOR SELECT TO claiq_app
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_members
      WHERE user_id = current_setting('app.current_user_id')::UUID
        AND status = 'active'
    )
  );

-- 강의: 같은 학원 멤버만 접근 (교강사는 자신의 강의에 쓰기 가능)
CREATE POLICY lectures_read_policy ON lectures
  FOR SELECT TO claiq_app
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_members
      WHERE user_id = current_setting('app.current_user_id')::UUID
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY lectures_write_policy ON lectures
  FOR INSERT TO claiq_app
  WITH CHECK (
    teacher_id = current_setting('app.current_user_id')::UUID
  );

-- 강의 청크: 같은 학원 멤버만 읽기 (직접 쓰기는 서비스 계정만)
CREATE POLICY lecture_chunks_read_policy ON lecture_chunks
  FOR SELECT TO claiq_app
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_members
      WHERE user_id = current_setting('app.current_user_id')::UUID
        AND status = 'active'
    )
  );

-- 답안 제출: 본인이 제출한 데이터만 접근
CREATE POLICY answer_submissions_policy ON answer_submissions
  FOR ALL TO claiq_app
  USING (student_id = current_setting('app.current_user_id')::UUID);

-- Q&A 세션: 본인(수강생) 또는 해당 교강사만 접근
CREATE POLICY qa_sessions_policy ON qa_sessions
  FOR SELECT TO claiq_app
  USING (
    student_id = current_setting('app.current_user_id')::UUID
    OR teacher_id = current_setting('app.current_user_id')::UUID
  );

-- 포인트 트랜잭션: 본인 데이터만 읽기
CREATE POLICY point_transactions_policy ON point_transactions
  FOR SELECT TO claiq_app
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- 애플리케이션에서 RLS 컨텍스트 설정 방법 (Node.js/pg)
-- await client.query(`SET app.current_user_id = '${userId}'`)

-- 슈퍼유저 접근 정책 (관리용 — 모든 행 접근)
CREATE POLICY admin_bypass ON users
  FOR ALL
  USING (current_setting('app.role', true) = 'admin');
```

---

## 7. 위험 요소 및 완화 방안

| 위험 요소 | 심각도 | 완화 방안 |
|-----------|--------|-----------|
| pgvector IVFFlat 인덱스 빌드 전 성능 저하 | 중간 | 초기 데이터 적재 후 인덱스 생성, VACUUM ANALYZE 주기적 실행, 운영 중 CONCURRENTLY 옵션으로 재빌드 |
| student_type_stats upsert 동시성 충돌 | 중간 | INSERT ... ON CONFLICT DO UPDATE 원자 쿼리 사용, 동시 요청 시 직렬화 격리 수준 적용 |
| point_transactions 중복 지급 (레이스 컨디션) | 높음 | idempotency_key UNIQUE 제약 + SELECT FOR UPDATE로 잔액 조회 원자화 |
| lecture_chunks 테이블 대용량 성장 (벡터 데이터) | 높음 | 강의당 청크 수 상한 설정(최대 200개), 오래된 강의 아카이빙 정책 수립, pg_partman으로 월별 파티셔닝 준비 |
| 마이그레이션 실행 순서 오류 | 높음 | 마이그레이션 실행 이력 테이블(schema_migrations) 관리, CI 파이프라인에서 fresh DB 마이그레이션 자동 검증 |
| 소프트 삭제(deleted_at) 인덱스 누락 | 중간 | 모든 WHERE deleted_at IS NULL 조건에 PARTIAL INDEX 적용 (`WHERE deleted_at IS NULL`) |
| RLS 컨텍스트 설정 누락으로 데이터 노출 | 높음 | DB 연결 직후 SET app.current_user_id 미들웨어 강제화, 연결 풀(pg Pool) 사용 시 쿼리 시작 전 반드시 설정 |
| JSONB 컬럼 오용 (mini_exam_questions.options) | 낮음 | options 컬럼은 고정 구조({label, content}[])만 허용, 백엔드 Zod 스키마로 쓰기 전 검증 |

---

## 8. 성공 기준

### 기능적 성공 기준

- [ ] 마이그레이션 001~010 오류 없이 순서대로 실행 완료
- [ ] 시드 데이터: subjects 28개, question_types 과목별 5종 이상, badge_definitions 12종 정상 입력
- [ ] pgvector IVFFlat 인덱스 생성 완료 및 유사도 검색 결과 반환 확인
- [ ] student_type_stats upsert 동시 요청 100건에서 데이터 정합성 유지
- [ ] point_transactions idempotency_key 중복 시 UNIQUE 제약 오류 발생 (정상 방어 동작)
- [ ] RLS 정책 적용 후 타 학원 데이터 접근 시 0건 반환

### 비기능적 성공 기준

- [ ] RAG 유사도 검색 (쿼리 1) P95 응답 시간 100ms 이하 (청크 10만 건 기준)
- [ ] 이탈 위험 집계 쿼리 (쿼리 3) 실행 시간 5초 이하 (수강생 1,000명 기준)
- [ ] 강의별 이해도 집계 쿼리 (쿼리 4) 실행 시간 3초 이하
- [ ] 모든 외래키에 인덱스 100% 적용 확인
- [ ] EXPLAIN ANALYZE로 모든 핵심 쿼리 Seq Scan 없음 검증
- [ ] DB 백업 정책: 일일 자동 백업, 7일 보관 (Render PostgreSQL 기본 정책 활용)
