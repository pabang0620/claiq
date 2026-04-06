-- 추가 복합 인덱스

-- 출결 날짜별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_attendances_student_date
  ON attendances(student_id, marked_at DESC);

-- 포인트 거래 타입별 조회
CREATE INDEX IF NOT EXISTS idx_point_transactions_type
  ON point_transactions(user_id, type, created_at DESC);

-- 강의 청크 벡터 인덱스 (IVFFlat - 데이터 충분 시 활성화)
-- 운영 환경에서 벡터 수 충분할 때 실행:
-- CREATE INDEX idx_lecture_chunks_embedding
--   ON lecture_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Q&A 세션 최근 업데이트 순 조회
CREATE INDEX IF NOT EXISTS idx_qa_sessions_student_updated
  ON qa_sessions(student_id, updated_at DESC);

-- 모의고사 학생별 최근순
CREATE INDEX IF NOT EXISTS idx_mini_exams_student_created
  ON mini_exams(student_id, created_at DESC);

-- 학생 타입 통계 취약 유형 우선순위 (정답률 낮은 순)
CREATE INDEX IF NOT EXISTS idx_student_type_stats_weak
  ON student_type_stats(student_id, academy_id, correct_rate ASC);

-- 문제 pending 빠른 조회
CREATE INDEX IF NOT EXISTS idx_questions_pending_teacher
  ON questions(teacher_id, status, created_at) WHERE status = 'pending' AND deleted_at IS NULL;
