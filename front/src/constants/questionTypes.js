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

export const TYPE_CODE_NAMES = {
  // 국어
  KOR_READ_FACT: '사실적 이해',
  KOR_READ_INFERENCE: '추론적 이해',
  KOR_READ_APPLY: '비판적 이해 및 적용',
  KOR_READ_VOCAB: '어휘·어구 의미',
  KOR_LIT_THEME: '주제·의미 파악',
  KOR_LIT_EXPRESSION: '표현법·서술방식',
  KOR_LIT_CHARACTER: '인물·심리 분석',
  KOR_LIT_MODERN_POETRY: '현대시 감상',
  KOR_LIT_MODERN_PROSE: '현대소설 감상',
  KOR_LIT_CLASSIC: '고전문학 감상',
  KOR_LANG_GRAMMAR: '문법(음운·형태·통사)',
  KOR_LANG_MEDIA: '매체 언어',
  KOR_SPEECH_ORAL: '화법(말하기·듣기)',
  KOR_SPEECH_WRITE: '작문(쓰기)',
  KOR_INTEGRATED: '통합(독서+문학)',
  // 수학
  MATH_SEQ_ARITH: '등차수열',
  MATH_SEQ_GEO: '등비수열',
  MATH_SEQ_GENERAL: '수열의 합·귀납',
  MATH_FUNC_BASIC: '함수의 정의·역함수',
  MATH_FUNC_POLY: '다항함수 그래프',
  MATH_FUNC_EXP: '지수·로그함수',
  MATH_FUNC_TRIG: '삼각함수',
  MATH_CALC_LIMIT: '극한',
  MATH_CALC_DERIV: '미분',
  MATH_CALC_INTEG: '적분',
  MATH_STAT_COMBI: '경우의 수·순열조합',
  MATH_STAT_PROB: '확률',
  MATH_STAT_DISTRIB: '확률분포(이항·정규)',
  MATH_STAT_ESTIMATE: '통계적 추정',
  MATH_GEO_VECTOR: '벡터',
  MATH_GEO_SPACE: '공간도형·좌표',
  MATH_GEO_CURVE: '이차곡선',
  MATH_KINEMATICS: '수직선 위의 운동·속도',
  // 영어
  ENG_LISTEN_GENERAL: '듣기 일반(내용 파악)',
  ENG_LISTEN_INFER: '듣기 추론(의도·관계)',
  ENG_READ_MAIN: '주제·제목·요지',
  ENG_READ_DETAIL: '세부 정보 파악',
  ENG_READ_INFER_BLANK: '빈칸 추론',
  ENG_READ_INFER_MEANING: '함축 의미 추론',
  ENG_READ_VOCAB: '어휘(낱말의 쓰임)',
  ENG_READ_FLOW_ORDER: '글의 순서 배열',
  ENG_READ_FLOW_INSERT: '문장 삽입 위치',
  ENG_READ_FLOW_UNFIT: '무관한 문장 제거',
  ENG_READ_SUMMARY: '요약문 완성',
  ENG_READ_LONGREADING: '장문 독해(복합)',
  ENG_GRAMMAR_ERROR: '어법(틀린 부분 찾기)',
}

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
