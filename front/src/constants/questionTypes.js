export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SHORT_ANSWER: 'short_answer',
}

export const QUESTION_TYPE_LABELS = {
  multiple_choice: '5지선다',
  short_answer: '단답형',
}

export const DIFFICULTY_LEVELS = [
  { code: 'A', label: '상' },
  { code: 'B', label: '중' },
  { code: 'C', label: '하' },
]

export const CSAT_TYPE_CODES = {
  korean: [
    { code: 'K01', name: '화법' },
    { code: 'K02', name: '작문' },
    { code: 'K03', name: '문법' },
    { code: 'K04', name: '독서(인문)' },
    { code: 'K05', name: '독서(사회)' },
    { code: 'K06', name: '독서(과학)' },
    { code: 'K07', name: '독서(기술)' },
    { code: 'K08', name: '문학(현대시)' },
    { code: 'K09', name: '문학(현대소설)' },
    { code: 'K10', name: '문학(고전)' },
  ],
  math: [
    { code: 'M01', name: '수와 연산' },
    { code: 'M02', name: '방정식과 부등식' },
    { code: 'M03', name: '함수' },
    { code: 'M04', name: '미적분' },
    { code: 'M05', name: '확률과 통계' },
    { code: 'M06', name: '수열' },
    { code: 'M07', name: '지수와 로그' },
  ],
  english: [
    { code: 'E01', name: '듣기' },
    { code: 'E02', name: '독해(빈칸)' },
    { code: 'E03', name: '독해(순서)' },
    { code: 'E04', name: '독해(주제/요지)' },
    { code: 'E05', name: '어휘·어법' },
    { code: 'E06', name: '장문 독해' },
  ],
}
