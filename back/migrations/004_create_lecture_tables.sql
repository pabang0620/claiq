-- 강의
CREATE TABLE IF NOT EXISTS lectures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id      UUID         NOT NULL REFERENCES academies(id),
  teacher_id      UUID         NOT NULL REFERENCES users(id),
  subject_id      UUID         NOT NULL REFERENCES subjects(id),
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  audio_url       TEXT,
  material_urls   TEXT[],
  transcript      TEXT,
  type_tags       VARCHAR(100)[],
  processing_status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'stt_processing', 'embedding', 'type_mapping', 'question_gen', 'done', 'error')),
  processing_error TEXT,
  scheduled_at    TIMESTAMPTZ,
  taught_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lectures_academy ON lectures(academy_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lectures_teacher ON lectures(teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lectures_subject ON lectures(subject_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lectures_status  ON lectures(processing_status) WHERE deleted_at IS NULL;

-- 강의 텍스트 청크 (RAG 벡터)
CREATE TABLE IF NOT EXISTS lecture_chunks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id      UUID         NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  teacher_id      UUID         NOT NULL REFERENCES users(id),
  academy_id      UUID         NOT NULL REFERENCES academies(id),
  chunk_index     INTEGER      NOT NULL,
  content         TEXT         NOT NULL,
  token_count     INTEGER,
  embedding       vector(1536),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lecture_chunks_lecture ON lecture_chunks(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_chunks_teacher ON lecture_chunks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lecture_chunks_academy ON lecture_chunks(academy_id);

-- pgvector IVFFlat 인덱스 (데이터 충분 시 활성화)
-- CREATE INDEX idx_lecture_chunks_embedding
--   ON lecture_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
