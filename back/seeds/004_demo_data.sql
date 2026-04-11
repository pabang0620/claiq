-- 데모 시드 데이터 (비밀번호: claiq1234)
-- bcrypt hash of 'claiq1234' with 12 rounds (bcryptjs)

-- 데모 운영자 (학원장)
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '정민석', 'operator', '010-1234-5678')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name;

-- 데모 교강사
INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000002',
   'teacher@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '이준혁', 'teacher', '010-2345-6789'),
  ('00000000-0000-0000-0000-000000000003',
   'teacher2@claiq.kr',
   '$2a$12$fZeBmxSVJxL.N7I.xhLLJurnNhKZGe/tisyCwGjZIS6ndn2kJ9Cny',
   '박서연', 'teacher', '010-3456-7890')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name;

-- 데모 수강생 5명
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
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name;

-- 데모 학원 (수능일: 2026-11-19)
INSERT INTO academies (id, name, code, owner_id, suneung_date, address) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '정상수능학원', 'STAR01',
   '00000000-0000-0000-0000-000000000001',
   '2026-11-19',
   '서울시 강남구 대치동 123-45')
ON CONFLICT (code) DO NOTHING;

-- 학원 멤버 등록
INSERT INTO academy_members (academy_id, user_id, role) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'operator'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 'teacher'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', 'teacher'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000010', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000011', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000012', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000013', 'student'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000014', 'student')
ON CONFLICT (academy_id, user_id) DO NOTHING;

-- 포인트 잔액 초기화 (데모 수강생)
INSERT INTO points (user_id, balance, total_earned) VALUES
  ('00000000-0000-0000-0000-000000000010', 150, 150),
  ('00000000-0000-0000-0000-000000000011', 80,  80),
  ('00000000-0000-0000-0000-000000000012', 230, 230),
  ('00000000-0000-0000-0000-000000000013', 60,  60),
  ('00000000-0000-0000-0000-000000000014', 20,  20)
ON CONFLICT (user_id) DO NOTHING;

-- 학습 스트릭 초기화
INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_active_date) VALUES
  ('00000000-0000-0000-0000-000000000010', 7,  7,  CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000011', 3,  5,  CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000012', 15, 15, CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000013', 1,  3,  CURRENT_DATE - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000014', 0,  1,  CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (user_id) DO NOTHING;
