-- ============================================================
-- 000_reset.sql  기존 데이터 전체 초기화 (시드 재삽입 전 실행)
-- FK 의존성 역순으로 TRUNCATE
-- ============================================================
SET search_path TO claiq, public;

-- 1. 가장 말단 테이블부터 (FK 참조 없음)
TRUNCATE TABLE
  mini_exam_submissions,
  mini_exam_questions,
  mini_exams,
  roadmap_items,
  learning_roadmaps,
  qa_messages,
  qa_sessions,
  answer_submissions,
  student_type_stats,
  achievement_reports,
  point_transactions,
  user_badges,
  learning_streaks,
  points,
  attendances,
  question_options,
  questions,
  lecture_chunks,
  lecture_materials,
  lectures,
  academy_coupons,
  academy_members,
  refresh_tokens,
  academies
CASCADE;

-- 2. users 마지막 (다른 테이블들의 FK 원천)
TRUNCATE TABLE users CASCADE;

-- 3. 마스터 데이터 초기화 (001~003에서 재삽입)
TRUNCATE TABLE badge_definitions CASCADE;
TRUNCATE TABLE question_types CASCADE;
TRUNCATE TABLE subjects CASCADE;
