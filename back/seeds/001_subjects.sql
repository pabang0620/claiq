-- 수능 과목 시드 데이터
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
-- 향후 확장용 (비활성)
('HISTORY_KOR',    '한국사',        '한국사',   12, false),
('SOC_ETHICS',     '생활과 윤리',   '사회탐구', 13, false),
('SOC_CULTURE',    '사회·문화',     '사회탐구', 14, false),
('SCI_BIO1',       '생명과학 I',    '과학탐구', 15, false),
('SCI_EARTH1',     '지구과학 I',    '과학탐구', 16, false),
('SCI_CHEM1',      '화학 I',        '과학탐구', 17, false),
('SCI_PHYSICS1',   '물리학 I',      '과학탐구', 18, false)
ON CONFLICT (code) DO NOTHING;
