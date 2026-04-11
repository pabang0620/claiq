# CLAIQ AI 파이프라인 아키텍처

## 1. 전체 AI 파이프라인 개요

CLAIQ는 수능 교육 플랫폼에 특화된 4개의 AI 파이프라인으로 구성됩니다. 각 파이프라인은 독립적으로 동작하며, 공유 데이터(pgvector 임베딩, 학생 약점 통계)를 통해 서로 연결됩니다.

```
강의 파일 (MP3/MP4/PDF)
        │
        ▼
┌─────────────────────────────────────┐
│  파이프라인 1: 강의 → 문제 생성      │
│  STT → 임베딩 → pgvector → GPT 생성  │
└──────────────────┬──────────────────┘
                   │ 문제 + 임베딩 저장
                   ▼
┌─────────────────────────────────────┐
│  파이프라인 2: RAG Q&A              │
│  질문 임베딩 → 유사도 검색 → GPT 응답│
└──────────────────┬──────────────────┘
                   │ 오답/약점 데이터
                   ▼
┌─────────────────────────────────────┐
│  파이프라인 3: 학습 로드맵 생성      │
│  약점 분석 → D-day 역산 → GPT 계획   │
└──────────────────┬──────────────────┘
                   │ 약점 유형 비율
                   ▼
┌─────────────────────────────────────┐
│  파이프라인 4: 미니 모의고사 생성    │
│  약점 70% + 기타 30% → 자동 구성     │
└─────────────────────────────────────┘
```

---

## 2. 파이프라인 1: 강의 → 문제 생성

교강사가 강의 파일을 업로드하면 자동으로 수능 유형 문제를 생성하는 파이프라인입니다.

### 2.1 Whisper STT 처리

OpenAI Whisper API는 단일 파일 25MB 제한이 있습니다. 업로드 설정(`UPLOAD_MAX_AUDIO_MB`)의 기본값은 25MB로, 파일은 그대로 Whisper API에 전송됩니다.

**처리 흐름:**
```
강의 파일 수신 (오디오 버퍼)
     │
     ▼
임시 파일 저장 (tmpdir)
     │
     ▼
Whisper API 전송 (whisper-1, language: ko)
     │
     ▼
강의 스크립트 완성 → 임시 파일 삭제
```

**SSE 진행상황 전송:**
```
강의 처리 상태는 `lectures.processing_status` 컬럼에 기록되고
SSE로 클라이언트에 전달됩니다.
상태 흐름: 'stt_processing' → 'embedding' → 'type_mapping' → 'question_gen' → 'done' / 'error'
```

### 2.2 임베딩 생성 및 pgvector 저장

강의 스크립트를 의미 단위로 분할하고, 각 청크를 벡터로 변환하여 pgvector에 저장합니다.

**텍스트 청킹 전략:**
- 청크 크기: 500 토큰 (env.rag.chunkSize 기본값, 약 글자 수/4로 추정)
- 오버랩: 50 토큰 (env.rag.chunkOverlap 기본값, 문맥 연속성 확보)
- 분할 기준: 문장 경계 (마침표/느낌표/물음표 뒤 공백)

**임베딩 배치 처리:**

`text-embedding-3-small` 모델을 사용합니다 (1536차원, 비용 효율 최적).

실제 구현 (`back/src/ai/embedding.js`):
- 배치 크기: 20개씩 처리 (BATCH_SIZE=20)
- 배치 간 딜레이: 50ms (BATCH_DELAY_MS=50)
- Rate limit 대응: 429/503 오류 시 exponential backoff 재시도 (1s → 2s → 4s, 최대 3회)

```javascript
// embedding.js — 확인된 구현
const BATCH_SIZE = 20
const BATCH_DELAY_MS = 50

export const embedTexts = async (texts) => {
  const embeddings = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    try {
      const response = await retryWithBackoff(() =>
        openai.embeddings.create({
          model: env.openai.modelEmbedding,  // 기본값: text-embedding-3-small
          input: batch,
        })
      )
      const batchEmbeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding)
      embeddings.push(...batchEmbeddings)

      // 배치 간 rate limit 방지를 위한 delay (마지막 배치 제외)
      if (i + BATCH_SIZE < texts.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
      }
    } catch (err) {
      logger.error('임베딩 오류:', err.message)
      throw err
    }
  }

  return embeddings
}

// 단일 텍스트 임베딩
export const embedText = async (text) => {
  const [embedding] = await embedTexts([text])
  return embedding
}
```

**pgvector 저장 구조:**
```sql
CREATE TABLE IF NOT EXISTS lecture_chunks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id  UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES users(id),
  academy_id  UUID NOT NULL REFERENCES academies(id),
  chunk_index INTEGER NOT NULL,
  content     TEXT NOT NULL,
  token_count INTEGER,
  embedding   vector(1536),           -- text-embedding-3-small 차원
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IVFFlat 인덱스: 데이터가 충분히 쌓인 후 활성화 예정 (현재 주석 처리)
-- CREATE INDEX idx_lecture_chunks_embedding
--   ON lecture_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 2.3 GPT-4o-mini 문제 생성

저장된 임베딩과 원본 텍스트를 기반으로 수능 유형 문제를 생성합니다.

**수능 유형 분류:**

유형 코드는 과목 접두사(KOR/MATH/ENG)와 세부 유형을 조합합니다. 실제 유형 목록은 `back/src/data/suneung_types.json`에 정의되어 있으며, 강의 업로드 시 `typeMapper.js`가 해당 파일을 기반으로 GPT에게 유형 코드를 분류시킵니다.

| 과목 | 유형 코드 예시 |
|------|----------------|
| 국어 | KOR_READ_FACT, KOR_READ_INFER, KOR_LIT_THEME 등 |
| 수학 | MATH_CALC, MATH_PROOF, MATH_APPLY 등 |
| 영어 | ENG_READ_FACT, ENG_READ_VOCAB, ENG_LISTEN 등 |

**난이도 분류:**
- **A (하)**: 직접 언급된 내용 확인
- **B (중)**: 추론 및 맥락 파악 필요
- **C (상)**: 복합적 이해 및 비판적 사고 필요

**문제 형식:**
- 5지선다형 (객관식) — 실제 코드에서 `answer_type: "multiple_choice"`로 반환

**GPT-4o-mini 프롬프트 구조 (확인된 구현):**

시스템 프롬프트는 과목별 외부 파일(`prompts/questionGeneration/korean.txt`, `math.txt`, `english.txt`)에서 로드됩니다. 기본값은 `system.txt`입니다. (`back/src/ai/questionGenerator.js`)

```javascript
const loadPrompt = (area) => {
  const areaMap = { '국어': 'korean', '수학': 'math', '영어': 'english' }
  const filename = areaMap[area] || 'system'
  try {
    return readFileSync(join(__dirname, `../prompts/questionGeneration/${filename}.txt`), 'utf-8')
  } catch {
    return readFileSync(join(__dirname, '../prompts/questionGeneration/system.txt'), 'utf-8')
  }
}
```

유저 프롬프트에 난이도, 유형 코드, 강의 청크(최대 5개)를 주입:

```
System: [과목별 시스템 프롬프트 — 외부 파일에서 로드]

User: 다음 강의 내용을 바탕으로 수능 형식의 문제를 {count}개 생성하세요.

난이도: {difficulty} (A: 하(기본) | B: 중(응용) | C: 상(심화))
관련 수능 유형: {typeCodes.join(', ')}

강의 내용:
{chunks.slice(0, 5).join('\n\n')}

반환 형식 (JSON):
{
  "questions": [
    {
      "content": "문제 본문",
      "answer_type": "multiple_choice",
      "options": [
        {"label": "1", "content": "선택지1"},
        ...
        {"label": "5", "content": "선택지5"}
      ],
      "correct_answer": "3",
      "explanation": "해설",
      "type_code": "KOR_READ_FACT"
    }
  ]
}
```

**Temperature 설정:**
- 문제 생성: `temperature: 0.7` — 다양한 문제 유형 확보
- `response_format: { type: 'json_object' }` — 구조화된 JSON 강제

**실제 생성 로직:**
- `generateQuestions()`: 단일 난이도로 지정된 개수 생성
- `generateAllQuestions()`: A/B/C 난이도 각 5개씩 총 15개 생성 (병렬 처리)

**SSE 실시간 진행상황:**

`broadcastStatus(lectureId, status, extra)` 함수로 단일 `data:` 이벤트를 전송합니다.

```
data: {"status": "question_gen"}

data: {"status": "done", "questionCount": 15}

data: {"status": "error", "error": "에러 메시지"}
```

---

## 3. 파이프라인 2: RAG Q&A

수강생이 강의 내용에 대해 질문하면, 관련 강의 청크를 검색하여 문맥 기반 답변을 제공합니다.

### 3.1 질문 임베딩

`embedding.js`의 `embedText()` 함수를 통해 임베딩합니다.

```javascript
// ragQA.js (back/src/ai/ragQA.js)
const questionEmbedding = await embedText(question)
```

단일 텍스트 임베딩:
```javascript
export const embedText = async (text) => {
  const [embedding] = await embedTexts([text])
  return embedding
}
```

### 3.2 pgvector 유사도 검색 (top-k=5)

```javascript
// ragQA.js (back/src/ai/ragQA.js)
const chunks = await searchSimilarChunks({
  embedding: questionEmbedding,
  teacherId,
  academyId,
  topK: env.rag.topK,  // 기본값: 5
})
```

데이터베이스 쿼리:
```sql
-- 임베딩 벡터는 '[...]'::vector 형식으로 직접 삽입 (pgvector 요구사항)
SELECT lc.id, lc.lecture_id, lc.content,
       1 - (lc.embedding <=> '[...]'::vector) AS similarity
FROM lecture_chunks lc
WHERE lc.teacher_id = $1
  AND lc.academy_id = $2
  AND lc.embedding IS NOT NULL
ORDER BY lc.embedding <=> '[...]'::vector
LIMIT $3;
```

- 연산자 `<=>`: cosine distance (거리 기반 정렬)
- `top-k=5`: 가장 관련성 높은 5개 청크 선택 (env.rag.topK 기본값, `back/src/config/env.js`에서 설정)
- 에스컬레이션 여부는 검색 결과 여부와 응답 내 키워드로 판단

### top-k 선택 근거

실험적 비교를 통해 k=5를 기본값으로 채택:
- k=3: 맥락 청크 부족 → AI가 "강의 내용에서 찾을 수 없음" 에스컬레이션 비율 증가
- k=5: 맥락 충분 + 토큰 비용 적정 (입력 약 2,500 tokens)
- k=10: 품질 향상 미미 + 토큰 비용 2배 → gpt-4o-mini 기준 Q&A당 비용 증가
- 향후 수강생 피드백(도움됨/안됨) 수집 후 A/B 테스트로 최적값 조정 예정

### 3.3 컨텍스트 주입 및 GPT-4o-mini 스트리밍 응답

실제 구현 (`back/src/ai/ragQA.js`):

```javascript
// 컨텍스트 구성
const context = hasRelevantChunks
  ? chunks.map((c, i) => `[강의 내용 ${i + 1}]\n${c.content}`).join('\n\n')
  : ''

// 메시지 구성 (대화 이력 최대 10개 포함)
const messages = [
  {
    role: 'system',
    content: hasRelevantChunks
      ? `${systemPrompt}\n\n참고 강의 내용:\n${context}`
      : `${systemPrompt}\n\n주의: 관련 강의 내용을 찾을 수 없습니다. 강의 범위를 벗어난 질문일 수 있습니다.`,
  },
  ...history.slice(-10).map((m) => ({ 
    role: m.role === 'ai' ? 'assistant' : m.role, 
    content: m.content 
  })),
  { role: 'user', content: question },
]

// GPT 스트리밍 응답
const stream = await openai.chat.completions.create(
  {
    model: env.openai.modelChat,  // 기본값: gpt-4o-mini
    messages,
    stream: true,
    temperature: 0.5,  // 정확성과 자연스러움 균형
  },
  { signal: controller.signal }
)

// 스트리밍 처리 (클라이언트 disconnect 감지)
for await (const chunk of stream) {
  if (aborted) break
  const delta = chunk.choices[0]?.delta?.content || ''
  if (delta) {
    fullAnswer += delta
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`)
  }
}
```

### 3.4 에스컬레이션 조건

AI가 신뢰도 높은 답변을 제공하지 못할 때 교강사에게 자동 에스컬레이션합니다.

**에스컬레이션 트리거 조건 (구현된 로직):**
```javascript
// ragQA.js
if (!hasRelevantChunks || fullAnswer.includes('교강사에게 문의') || fullAnswer.includes('강의 범위를 벗어')) {
  isEscalated = true
}
```

1. 유사한 청크가 검색되지 않은 경우 (`hasRelevantChunks === false`)
2. GPT 응답에 "교강사에게 문의" 또는 "강의 범위를 벗어" 키워드 포함

**에스컬레이션 처리:**
```
에스컬레이션 발생 (isEscalated = true)
     │
     ▼
qa_messages 테이블에 저장
     │
     ▼
교강사가 /api/qa/escalations 엔드포인트로 조회
     │
     ▼
교강사 직접 답변 (escalation_response 저장) → 수강생에게 전달
```

※ 이메일/푸시 자동 알림은 구현되어 있지 않습니다. 교강사가 에스컬레이션 목록을 능동적으로 확인하는 방식입니다.

---

## 4. 파이프라인 3: 학습 로드맵 자동 생성

수강생의 약점 데이터를 분석하여 수능 D-day까지의 맞춤형 학습 계획을 생성합니다.

### 4.1 수강생 약점 데이터 수집

문제 풀이 시 `student_type_stats` 테이블에 유형별 정답률이 실시간으로 누적됩니다. 로드맵 생성 시에는 이 테이블을 직접 조회합니다.

```sql
-- 수강생별 유형별 정답률 조회 (student_type_stats 직접 조회)
SELECT sts.*, s.name AS subject_name, s.area AS subject_area
FROM student_type_stats sts
JOIN subjects s ON s.id = sts.subject_id
WHERE sts.student_id = $1
  AND sts.academy_id = $2
ORDER BY sts.correct_rate ASC;
```

`student_type_stats` 테이블은 문제 풀이 때마다 `ON CONFLICT DO UPDATE`로 갱신됩니다 (`total_attempts`, `correct_count`, `correct_rate` 실시간 업데이트).

### 4.2 수능 D-day 역산 우선순위 결정

`back/src/domains/roadmap/roadmapService.js`에서 `generateRoadmap()` 호출 전 우선순위를 계산합니다.

```javascript
// roadmapService.js (확인된 구현)

// 학원 정보에서 수능일 기준으로 D-day 계산
const suneungDate = academy?.suneung_date ? new Date(academy.suneung_date) : new Date('2026-11-19')
const today = new Date()
const ddayCount = Math.max(1, Math.floor((suneungDate - today) / (1000 * 60 * 60 * 24)))

// suneung_types.json에서 수능 출제빈도 가중치 로드
const typeWeights = getAllTypeWeights()

// priority_score = (1 - correct_rate) * frequency_weight
// correct_rate: 낮을수록 우선순위 높음
// frequency_weight: suneung_types.json의 수능 출제빈도 가중치
const weakTypes = typeStats
  .map((s) => ({
    ...s,
    frequency_weight: typeWeights[s.type_code] || 0.5,
    priority_score: (1 - (s.correct_rate || 0)) * (typeWeights[s.type_code] || 0.5),
  }))
  .sort((a, b) => b.priority_score - a.priority_score)
```

이 정보와 상위 취약 유형을 `generateRoadmap()`에 전달하면 GPT가 주간 계획을 생성합니다.

### 4.3 GPT-4o-mini 맞춤 로드맵 생성

시스템 프롬프트는 외부 파일(`back/src/prompts/roadmap/system.txt`)에서 로드됩니다. 취약 유형은 정답률 낮은 순으로 정렬하여 주입합니다.

```javascript
// roadmapService.js
const { summary, items } = await generateRoadmap({
  weakTypes,     // 우선순위 정렬된 취약 유형
  ddayCount,     // 수능까지 남은 일수
  studentName: studentName || '학생',
})
```

**Temperature 설정:**
- 로드맵 생성: `temperature: 0.6` — 맞춤화와 일관성 균형
- 구조화된 JSON 반환 형식:
```json
{
  "summary": "전체 로드맵 요약 텍스트",
  "weeks": [
    {
      "week_number": 1,
      "items": [
        {
          "type_code": "KOR_READ_FACT",
          "type_name": "사실적 이해",
          "priority_rank": 1,
          "note": "학습 방향 및 핵심 포인트"
        }
      ]
    }
  ]
}
```

**로드맵 저장:**
```javascript
const roadmap = await roadmapRepository.createRoadmap({
  student_id: studentId,
  academy_id: academyId,
  dday_count: ddayCount,
  suneung_date: suneungDate.toISOString().split('T')[0],
  summary,
  items,
  expires_at: nextMonday.toISOString(),  // 매주 월요일 갱신
})
```

---

## 5. 파이프라인 4: 미니 모의고사 자동 생성

수강생의 약점을 반영한 개인 맞춤형 미니 모의고사를 자동으로 구성합니다.

### 5.1 약점 유형 70% + 기타 30% 비율

총 15문항으로 구성됩니다.

```javascript
const TOTAL = 15
const WEAK_COUNT = Math.round(TOTAL * 0.7) // 11문제: 약점 유형
const OTHER_COUNT = TOTAL - WEAK_COUNT     // 4문제: 기타 유형
```

### 5.2 문항 구성 (확인된 구현)

`back/src/domains/exam/examService.js`:

```javascript
// 취약 유형 조회 (정답률 낮은 순)
const typeStats = await questionRepository.findTypeStats(studentId, resolvedAcademyId)
const weakTypes = typeStats.filter((s) => s.subject_area === area || !area)
  .sort((a, b) => a.correct_rate - b.correct_rate)

// 전체 유형 목록 조회 (suneung_types.json에서)
const areaKey = area === '국어' ? 'KOR' : area === '수학' ? 'MATH' : 'ENG'
const allTypes = Object.entries(suneungTypes[areaKey] || {}).map(([code, info]) => ({
  type_code: code,
  type_name: info.name,
}))

// 최근 강의 청크 조회 (참고 자료)
let recentLectures
if (resolvedAcademyId && resolvedSubjectId) {
  // 과목별 최근 3개 강의 조회
  const result = await pool.query(
    `SELECT id FROM lectures
     WHERE academy_id = $1 AND subject_id = $2 AND processing_status = 'done' AND deleted_at IS NULL
     ORDER BY created_at DESC LIMIT 3`,
    [resolvedAcademyId, resolvedSubjectId]
  )
  recentLectures = result.rows
}

// GPT로 미니 모의고사 생성
let questions = await generateExam({
  weakTypes,      // 약점 유형 목록
  allTypes,       // 전체 유형 목록
  area: area || '국어',
  availableChunks,  // 최근 강의 청크들
})
```

**Temperature 설정:**
- 미니 모의고사 생성: `temperature: 0.6` — 맞춤화와 일관성 균형
- GPT는 취약 유형과 기타 유형 목록 및 참고 강의 내용을 기반으로 각 문항의 난이도(`A`/`B`/`C`)를 결정
- 구조화된 JSON 반환 형식 (문제 생성과 동일)

### 성능 제약 및 개선 방향

현재: GPT 동기 생성 방식으로 15문항 생성 시 65~86초 소요 (Playwright 테스트 기준)

개선 방향:
1. **사전 생성 캐싱**: 수강생의 약점 데이터가 변경될 때마다 백그라운드에서 모의고사 사전 생성 후 DB 저장 → 요청 시 즉시 반환
2. **배치 스트리밍**: 문항을 3~5개 묶음으로 스트리밍 생성 → 첫 문항을 빠르게 표시하여 체감 대기시간 단축
3. **로딩 UX**: 현재 생성 중 진행률 표시로 대기 불안 해소 (이미 SSE 구현됨)

---

## 6. 비용 최적화 전략

### 6.1 모델 선택 전략

모든 Chat 작업에 `env.openai.modelChat`(기본값: `gpt-4o-mini`)을 사용합니다. 환경변수 `OPENAI_MODEL_CHAT`으로 모델을 변경할 수 있습니다.

| 작업 | 모델 (env 기본값) | Temperature | 근거 |
|------|------|------|------|
| 문제 생성 | gpt-4o-mini | 0.7 | gpt-4o 대비 비용 절감, 수능 문제 생성 품질 충분, 다양한 문제 유형 확보 |
| Q&A 응답 | gpt-4o-mini | 0.5 | 스트리밍 응답, 정확성과 자연스러움 균형 |
| 로드맵 생성 | gpt-4o-mini | 0.6 | 구조화된 JSON 출력, 맞춤화와 일관성 균형 |
| 미니 모의고사 | gpt-4o-mini | 0.6 | 구조화된 JSON 출력, 맞춤화와 일관성 균형 |
| 유형 매핑 | gpt-4o-mini | 0.3 | 일관된 유형 분류 강제 |
| 임베딩 | text-embedding-3-small | - | OpenAI 권장 소형 임베딩 모델 (1536차원) |
| STT | whisper-1 | - | 한국어 교육 도메인 특화 |

### 6.2 임베딩 배치 처리
- 단건 호출 대신 20개씩 배치 처리 (BATCH_SIZE=20)
- 배치 간 50ms 딜레이로 rate limit 방지 (BATCH_DELAY_MS=50)
- 429/503 오류 시 exponential backoff 재시도 (최대 3회)

### 6.3 월 예상 비용 (추정)

아래 수치는 OpenAI 공식 요금표 기반 추정값이며, 실제 사용량에 따라 달라질 수 있습니다.

| 항목 | 예상 비용 (추정) |
|------|-----------|
| STT (Whisper) | 강의 100시간 기준 약 3,600원 |
| 임베딩 생성 | 강의 100개 기준 약 1,000원 |
| 문제 생성 (gpt-4o-mini) | 강의 100개 × 20문제 약 2,000원 |
| Q&A 응답 (gpt-4o-mini) | 월 1,000건 기준 약 3,000원 |
| **합계** | **약 1~2만원/월 (추정)** |

---

## 7. 에러 처리 및 폴백 전략

### 7.1 단계별 에러 처리

```
각 파이프라인 단계 실행
         │
         ▼
      성공?
   ┌────┴────┐
  YES       NO
   │         │
   ▼         ▼
다음 단계  재시도 (최대 3회, exponential backoff)
            │
         성공?
      ┌────┴────┐
     YES       NO
      │         │
      ▼         ▼
   다음 단계  에러 저장 + SSE 알림
               │
               ▼
          교강사에게 수동 처리 요청
```

### 7.2 OpenAI API 장애 대응
- Rate limit (429): 지수 백오프 재시도 (1s → 2s → 4s, 최대 3회) — `retryWithBackoff()`로 구현
- 서버 에러 (503): 3회 재시도 후 예외 throw → 파이프라인 중단
- API 장애 시: 에러 로그 기록 + SSE로 클라이언트에 오류 알림

### 7.3 SSE 연결 복구
```javascript
// 클라이언트: SSE 자동 재연결
// 엔드포인트: GET /api/lectures/:id/status
const eventSource = new EventSource(`/api/lectures/${id}/status`)
eventSource.onerror = () => {
  // 브라우저가 자동으로 재연결 시도
}
```

### 7.4 데이터 일관성 보장
- 중간 실패 시 해당 단계만 재시도
- 강의 처리 상태를 `lectures.processing_status` 컬럼에 기록 (별도 테이블 아님)
  - 상태값: `pending` → `stt_processing` → `embedding` → `type_mapping` → `question_gen` → `done` / `error`
