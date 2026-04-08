-- 뱃지 정의 시드 데이터 (프론트엔드 constants/points.js 기준)
INSERT INTO claiq.badge_definitions (code, name, description, icon_url, condition_type, condition_value, points_reward) VALUES
  ('first_quiz', '첫 문제 풀이', '처음으로 문제를 풀었어요', '🎯', 'quiz_count', 1, 50),
  ('streak_7', '7일 연속 학습', '7일 연속으로 학습했어요', '🔥', 'streak_days', 7, 100),
  ('streak_30', '30일 연속 학습', '30일 연속으로 학습했어요', '💎', 'streak_days', 30, 300),
  ('perfect_quiz', '완벽한 풀이', '문제를 100% 정답으로 풀었어요', '⭐', 'correct_rate', 100, 150),
  ('exam_ace', '모의고사 마스터', '미니 모의고사를 완료했어요', '🏆', 'perfect_count', 1, 200),
  ('qa_explorer', 'AI Q&A 탐험가', 'AI Q&A를 5회 이상 활용했어요', '🤖', 'qa_count', 5, 100),
  ('roadmap_complete', '로드맵 달성', '주간 학습 목표를 달성했어요', '🗺️', 'monthly_attendance', 4, 150)
ON CONFLICT (code) DO NOTHING;
