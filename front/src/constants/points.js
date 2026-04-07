export const POINT_EVENTS = {
  QUIZ_CORRECT: 10,
  QUIZ_PARTICIPATION: 5,
  DAILY_LOGIN: 3,
  MINI_EXAM_COMPLETE: 50,
  STREAK_7: 30,
  STREAK_30: 100,
}

export const POINT_EVENT_LABELS = {
  quiz_correct: '문제 정답',
  quiz_participation: '문제 참여',
  daily_login: '일일 로그인',
  mini_exam_complete: '모의고사 완료',
  streak_7: '7일 연속 출석',
  streak_30: '30일 연속 출석',
  coupon_redeem: '쿠폰 교환',
  manual_grant: '관리자 지급',
  manual_deduct: '관리자 차감',
}

export const BADGE_DEFINITIONS = [
  { id: 'first_quiz', name: '첫 문제 풀이', description: '처음으로 문제를 풀었어요', icon: '🎯' },
  { id: 'streak_7', name: '7일 연속', description: '7일 연속 학습했어요', icon: '🔥' },
  { id: 'streak_30', name: '30일 연속', description: '30일 연속 학습했어요', icon: '💎' },
  { id: 'perfect_quiz', name: '완벽한 풀이', description: '오늘의 문제를 모두 맞혔어요', icon: '⭐' },
  { id: 'exam_ace', name: '모의고사 에이스', description: '모의고사 90점 이상 달성', icon: '🏆' },
  { id: 'qa_explorer', name: 'Q&A 탐험가', description: '질문을 10회 이상 했어요', icon: '💬' },
  { id: 'roadmap_complete', name: '로드맵 완성', description: '학습 로드맵을 완주했어요', icon: '🗺️' },
]
