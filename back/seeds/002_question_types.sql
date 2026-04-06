-- 국어 독서 유형
INSERT INTO question_types (subject_id, code, name, description, frequency_weight, display_order)
SELECT s.id, v.code, v.name, v.description, v.weight, v.ord
FROM subjects s
CROSS JOIN (VALUES
  ('KOR_READ_FACT',       '사실적 이해',   '글에서 직접 확인할 수 있는 정보를 정확히 파악하는 유형', 0.90, 1),
  ('KOR_READ_INFERENCE',  '추론적 이해',   '직접 언급되지 않은 내용을 추론하거나 전제를 파악하는 유형', 0.95, 2),
  ('KOR_READ_BLANK',      '빈칸 추론',     '문맥에 맞는 표현이나 개념을 추론하여 빈칸을 채우는 유형', 0.85, 3),
  ('KOR_READ_APPLY',      '적용·감상',     '제시된 관점·원리·사례를 다른 상황에 적용하는 유형', 0.80, 4),
  ('KOR_READ_CRITICAL',   '비판적 이해',   '글의 논리적 타당성, 주장·근거 관계를 분석·평가하는 유형', 0.75, 5),
  ('KOR_READ_VOCAB',      '어휘·어법',     '문맥상 단어의 의미, 문법적 기능을 파악하는 유형', 0.70, 6)
) AS v(code, name, description, weight, ord)
WHERE s.code = 'KOR_READING'
ON CONFLICT (code) DO NOTHING;

-- 국어 문학 유형
INSERT INTO question_types (subject_id, code, name, description, frequency_weight, display_order)
SELECT s.id, v.code, v.name, v.description, v.weight, v.ord
FROM subjects s
CROSS JOIN (VALUES
  ('KOR_LIT_THEME',       '주제·의미 파악',   '작품의 주제, 중심 의미를 파악하는 유형', 0.90, 1),
  ('KOR_LIT_EXPRESSION',  '표현법·서술방식',  '표현 기법, 서술 방식의 특징을 분석하는 유형', 0.85, 2),
  ('KOR_LIT_CHARACTER',   '인물·심리 분석',   '인물의 심리, 태도, 관계를 분석하는 유형', 0.80, 3),
  ('KOR_LIT_MODERN_POETRY','현대시 감상',     '현대시의 의미와 표현을 감상하는 유형', 0.85, 4),
  ('KOR_LIT_MODERN_PROSE', '현대소설 감상',   '현대소설의 서사 구조와 의미를 감상하는 유형', 0.85, 5),
  ('KOR_LIT_CLASSIC',     '고전문학 감상',    '고전시가·고전소설의 의미와 맥락을 파악하는 유형', 0.80, 6)
) AS v(code, name, description, weight, ord)
WHERE s.code = 'KOR_LITERATURE'
ON CONFLICT (code) DO NOTHING;

-- 수학 미적분 유형
INSERT INTO question_types (subject_id, code, name, description, frequency_weight, display_order)
SELECT s.id, v.code, v.name, v.description, v.weight, v.ord
FROM subjects s
CROSS JOIN (VALUES
  ('MATH_CALC_LIMIT',    '극한',       '함수의 극한값 계산 및 극한의 성질 적용', 0.90, 1),
  ('MATH_CALC_DERIV',    '미분',       '도함수 계산, 극값·최댓값·최솟값 분석', 0.95, 2),
  ('MATH_CALC_INTEG',    '적분',       '부정적분·정적분 계산 및 활용', 0.90, 3),
  ('MATH_CALC_EXTREMUM', '극값 분석',  '함수의 증감표 작성, 극대·극소 판별', 0.85, 4),
  ('MATH_CALC_AREA',     '넓이·부피',  '정적분으로 넓이·부피를 계산하는 활용 유형', 0.80, 5)
) AS v(code, name, description, weight, ord)
WHERE s.code = 'MATH_CALC'
ON CONFLICT (code) DO NOTHING;

-- 수학 확률과 통계 유형
INSERT INTO question_types (subject_id, code, name, description, frequency_weight, display_order)
SELECT s.id, v.code, v.name, v.description, v.weight, v.ord
FROM subjects s
CROSS JOIN (VALUES
  ('MATH_STAT_COMBI',    '경우의 수·순열조합', '경우의 수를 체계적으로 세는 유형', 0.85, 1),
  ('MATH_STAT_PROB',     '확률',               '확률 계산, 독립·배반사건 관련 유형', 0.90, 2),
  ('MATH_STAT_DISTRIB',  '확률분포',           '이항분포·정규분포 관련 유형', 0.85, 3),
  ('MATH_STAT_ESTIMATE', '통계적 추정',        '신뢰구간, 가설검정 관련 유형', 0.80, 4)
) AS v(code, name, description, weight, ord)
WHERE s.code = 'MATH_STAT'
ON CONFLICT (code) DO NOTHING;

-- 영어 독해 유형
INSERT INTO question_types (subject_id, code, name, description, frequency_weight, display_order)
SELECT s.id, v.code, v.name, v.description, v.weight, v.ord
FROM subjects s
CROSS JOIN (VALUES
  ('ENG_READ_MAIN',        '주제·제목·요지',    '글의 중심 내용, 주제를 파악하는 유형', 0.95, 1),
  ('ENG_READ_DETAIL',      '세부 정보 파악',    '내용 일치·불일치를 판단하는 유형', 0.85, 2),
  ('ENG_READ_INFER_BLANK', '빈칸 추론',         '문맥에 맞는 표현을 추론하는 유형', 1.00, 3),
  ('ENG_READ_VOCAB',       '어휘 의미 파악',    '낱말의 문맥적 의미를 파악하는 유형', 0.80, 4),
  ('ENG_READ_FLOW_ORDER',  '글의 순서 배열',    '논리적 흐름에 맞게 순서를 배열하는 유형', 0.90, 5),
  ('ENG_READ_FLOW_INSERT', '문장 삽입 위치',    '주어진 문장의 적절한 위치를 찾는 유형', 0.90, 6),
  ('ENG_GRAMMAR_ERROR',    '어법 오류 찾기',    '문법적으로 잘못된 부분을 찾는 유형', 0.85, 7)
) AS v(code, name, description, weight, ord)
WHERE s.code = 'ENG_READING'
ON CONFLICT (code) DO NOTHING;
