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
  { id: 'QUIZ_FIRST', name: '첫 문제 도전', description: '처음으로 문제를 풀었어요', icon: '🎯' },
  { id: 'STREAK_7', name: '7일 연속 학습', description: '7일 연속으로 학습했어요', icon: '🔥' },
  { id: 'STREAK_30', name: '30일 연속 학습', description: '30일 연속으로 학습했어요', icon: '💎' },
  { id: 'QUIZ_50', name: '문제 50개 돌파', description: '문제를 50개 이상 풀었어요', icon: '⭐' },
  { id: 'QUIZ_100', name: '문제 100개 돌파', description: '문제를 100개 이상 풀었어요', icon: '🏆' },
  { id: 'CORRECT_90', name: '정답률 90% 달성', description: '정답률 90% 이상을 달성했어요', icon: '💡' },
  { id: 'QA_EXPLORER', name: 'Q&A 탐험가', description: '질문을 10회 이상 했어요', icon: '💬' },
]
