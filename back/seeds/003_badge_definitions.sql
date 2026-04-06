-- 뱃지 정의 시드 (MVP 7종)
INSERT INTO badge_definitions (code, name, description, condition_type, condition_value, points_reward) VALUES
('QUIZ_FIRST',  '첫 문제 도전',    '첫 번째 문제를 제출했어요!',               'quiz_count',       1,   0),
('STREAK_7',    '7일 연속 학습',   '7일 연속으로 학습했어요!',                 'streak_days',      7,   30),
('STREAK_30',   '30일 연속 학습',  '30일 연속으로 학습했어요!',                'streak_days',      30,  100),
('QUIZ_50',     '문제 50개 돌파',  '문제를 50개 이상 풀었어요!',               'quiz_count',       50,  30),
('QUIZ_100',    '문제 100개 돌파', '문제를 100개 이상 풀었어요!',              'quiz_count',       100, 50),
('CORRECT_90',  '정답률 90% 달성', '20문제 이상 풀고 정답률 90%를 달성했어요!', 'correct_rate',    90,  50),
('QA_EXPLORER', '질문 탐험가',     'AI Q&A를 10회 이상 이용했어요!',           'qa_count',        10,  20)
ON CONFLICT (code) DO NOTHING;
