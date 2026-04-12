SET search_path TO claiq, public;

-- ============================================================
-- 데모 시드 데이터 (비밀번호: claiq1234)
-- bcrypt hash of 'claiq1234' with 12 rounds (bcryptjs)
-- ============================================================

-- ------------------------------------------------------------
-- 1. users (8명)
-- ------------------------------------------------------------

-- 운영자 (학원장)
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '정민석', 'operator', '010-1234-5678')
ON CONFLICT (id) DO UPDATE SET
  email         = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name          = EXCLUDED.name,
  role          = EXCLUDED.role,
  phone         = EXCLUDED.phone;

-- 교강사
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000002',
   'teacher@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '이준혁', 'teacher', '010-2345-6789'),
  ('00000000-0000-0000-0000-000000000003',
   'teacher2@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '박서연', 'teacher', '010-3456-7890')
ON CONFLICT (id) DO UPDATE SET
  email         = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name          = EXCLUDED.name,
  role          = EXCLUDED.role,
  phone         = EXCLUDED.phone;

-- 수강생 5명
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000010',
   'student@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '김민준', 'student', '010-4567-8901'),
  ('00000000-0000-0000-0000-000000000011',
   'student2@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '최서아', 'student', '010-5678-9012'),
  ('00000000-0000-0000-0000-000000000012',
   'student3@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '박지호', 'student', '010-6789-0123'),
  ('00000000-0000-0000-0000-000000000013',
   'student4@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '이하은', 'student', '010-7890-1234'),
  ('00000000-0000-0000-0000-000000000014',
   'student5@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '정우성', 'student', '010-8901-2345')
ON CONFLICT (id) DO UPDATE SET
  email         = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name          = EXCLUDED.name,
  role          = EXCLUDED.role,
  phone         = EXCLUDED.phone;

-- ------------------------------------------------------------
-- 2. academies
-- ------------------------------------------------------------
INSERT INTO academies (id, name, code, owner_id, suneung_date, address, description) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '정상수능학원',
   'STAR01',
   '00000000-0000-0000-0000-000000000001',
   '2026-11-19',
   '서울시 강남구 대치동 123-45',
   '수능 전문 입시학원. 국어·수학·영어 전과목 수능 맞춤 커리큘럼 제공.')
ON CONFLICT (code) DO UPDATE SET
  name          = EXCLUDED.name,
  owner_id      = EXCLUDED.owner_id,
  suneung_date  = EXCLUDED.suneung_date,
  address       = EXCLUDED.address,
  description   = EXCLUDED.description;

-- ------------------------------------------------------------
-- 3. academy_members (8명 전원)
-- ------------------------------------------------------------
INSERT INTO academy_members (academy_id, user_id, role) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'operator'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 'teacher'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', 'teacher'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000010', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000011', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000012', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000013', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000014', 'student')
ON CONFLICT (academy_id, user_id) DO UPDATE SET
  role   = EXCLUDED.role,
  status = 'active';

-- ------------------------------------------------------------
-- 4. points (수강생 5명)
-- ------------------------------------------------------------
INSERT INTO points (user_id, balance, total_earned) VALUES
  ('00000000-0000-0000-0000-000000000010', 320, 320),
  ('00000000-0000-0000-0000-000000000011', 150, 150),
  ('00000000-0000-0000-0000-000000000012', 480, 480),
  ('00000000-0000-0000-0000-000000000013',  90,  90),
  ('00000000-0000-0000-0000-000000000014',  40,  40)
ON CONFLICT (user_id) DO UPDATE SET
  balance      = EXCLUDED.balance,
  total_earned = EXCLUDED.total_earned,
  updated_at   = NOW();

-- ------------------------------------------------------------
-- 5. learning_streaks (수강생 5명)
-- ------------------------------------------------------------
INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_active_date) VALUES
  ('00000000-0000-0000-0000-000000000010',  7, 12, CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000011',  3,  5, CURRENT_DATE - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000012', 15, 21, CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000013',  1,  3, CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000014',  0,  2, CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (user_id) DO UPDATE SET
  current_streak   = EXCLUDED.current_streak,
  longest_streak   = EXCLUDED.longest_streak,
  last_active_date = EXCLUDED.last_active_date,
  updated_at       = NOW();

-- ------------------------------------------------------------
-- 6. academy_coupons (3개)
--    컬럼: id, academy_id, name, description, discount_amount,
--          discount_type, expires_at, award_condition, awarded_to,
--          created_at, updated_at, deleted_at
-- ------------------------------------------------------------

-- 쿠폰1: 일반 10% 할인 쿠폰
INSERT INTO academy_coupons
  (id, academy_id, name, description, discount_amount, discount_type, expires_at)
VALUES
  ('00000000-0000-0000-0002-000000000001',
   '00000000-0000-0000-0001-000000000001',
   '10% 수강료 할인 쿠폰',
   '수강료 10% 할인 혜택을 제공하는 일반 할인 쿠폰입니다.',
   10,
   'percent',
   '2026-12-31 23:59:59+09')
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  description     = EXCLUDED.description,
  discount_amount = EXCLUDED.discount_amount,
  discount_type   = EXCLUDED.discount_type,
  expires_at      = EXCLUDED.expires_at,
  updated_at      = NOW();

-- 쿠폰2: 성적 우수자 장학 20% 할인 쿠폰 (박지호에게 수여)
INSERT INTO academy_coupons
  (id, academy_id, name, description, discount_amount, discount_type,
   expires_at, award_condition, awarded_to)
VALUES
  ('00000000-0000-0000-0002-000000000002',
   '00000000-0000-0000-0001-000000000001',
   '성적 우수 장학 쿠폰',
   '수강료 20% 할인 혜택을 제공하는 성적 우수자 대상 장학 쿠폰입니다.',
   20,
   'percent',
   '2026-12-31 23:59:59+09',
   '성적 우수자',
   '00000000-0000-0000-0000-000000000012')
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  description     = EXCLUDED.description,
  discount_amount = EXCLUDED.discount_amount,
  discount_type   = EXCLUDED.discount_type,
  expires_at      = EXCLUDED.expires_at,
  award_condition = EXCLUDED.award_condition,
  awarded_to      = EXCLUDED.awarded_to,
  updated_at      = NOW();

-- 쿠폰3: 만료된 테스트용 쿠폰
INSERT INTO academy_coupons
  (id, academy_id, name, description, discount_amount, discount_type, expires_at)
VALUES
  ('00000000-0000-0000-0002-000000000003',
   '00000000-0000-0000-0001-000000000001',
   '만료 테스트 쿠폰',
   '만료 처리 테스트용 쿠폰입니다.',
   5,
   'percent',
   (CURRENT_DATE - INTERVAL '30 days')::TIMESTAMPTZ)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  description     = EXCLUDED.description,
  discount_amount = EXCLUDED.discount_amount,
  discount_type   = EXCLUDED.discount_type,
  expires_at      = EXCLUDED.expires_at,
  updated_at      = NOW();
