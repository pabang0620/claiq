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
강의 처리 상태는 lectureRepository.updateLectureStatus()로 DB에 기록하고
broadcastStatus()를 통해 SSE로 클라이언트에 전달됩니다.
예: 'stt_processing' → 'embedding_processing' → 'question_generating' → 'done'
```

### 2.2 임베딩 생성 및 pgvector 저장

강의 스크립트를 의미 단위로 분할하고, 각 청크를 벡터로 변환하여 pgvector에 저장합니다.

**텍스트 청킹 전략:**
- 청크 크기: 500 토큰 (env.rag.chunkSize 기본값, 약 글자 수/4로 추정)
- 오버랩: 50 토큰 (env.rag.chunkOverlap 기본값, 문맥 연속성 확보)
- 분할 기준: 문장 경계 (마침표/느낌표/물음표 뒤 공백)

**임베딩 배치 처리:**

`text-embedding-3-small` 모델을 사용합니다 (1536차원, 비용 효율 최적).

```javascript
// rate limit 대응: 배치 크기 20, 요청 간 50ms 딜레이
const BATCH_SIZE = 20
const BATCH_DELAY_MS = 50

async function embedBatch(chunks) {
  const batches = splitIntoBatches(chunks, BATCH_SIZE)
  const results = []

  for (const batch of batches) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch.map(c => c.text)
    })
    results.push(...response.data)
    await sleep(BATCH_DELAY_MS)  // rate limit 대응
  }

  return results
}
```

**pgvector 저장 구조:**
```sql
CREATE TABLE lecture_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id  UUID NOT NULL REFERENCES lectures(id),
  teacher_id  UUID NOT NULL,
  academy_id  UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  content     TEXT NOT NULL,
  token_count INTEGER,
  embedding   vector(1536),           -- text-embedding-3-small 차원
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- cosine similarity 검색을 위한 IVFFlat 인덱스
CREATE INDEX idx_lecture_chunks_vector
  ON lecture_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### 2.3 GPT-4o-mini 문제 생성

저장된 임베딩과 원본 텍스트를 기반으로 수능 유형 문제를 생성합니다.

**수능 유형 분류:**
| 유형 코드 | 설명 |
|-----------|------|
| TYPE_A | 사실적 이해 (내용 일치/불일치) |
| TYPE_B | 추론적 이해 (빈칸 추론, 함의 파악) |
| TYPE_C | 비판적 사고 (주제/요지 파악) |
| TYPE_D | 어휘/표현 (어법, 어휘) |

**난이도 분류:**
- **A (하)**: 직접 언급된 내용 확인
- **B (중)**: 추론 및 맥락 파악 필요
- **C (상)**: 복합적 이해 및 비판적 사고 필요

**문제 형식:**
- 5지선다형 (객관식)
- 단답형 (주관식)

**GPT-4o-mini 프롬프트 구조:**
```
System: 당신은 수능 출제 전문가입니다. 주어진 강의 내용을 바탕으로
        수능 유형에 맞는 문제를 생성하세요.

User: [강의 청크 텍스트]

문제 생성 조건:
- 유형: {type} ({type_description})
- 난이도: {difficulty} ({difficulty_description})
- 형식: {format} (5지선다/단답형)
- 정답 근거가 본문에 명확히 존재해야 함
- 오답 선지는 그럴듯하지만 명확히 오답이어야 함

JSON 형식으로 반환:
{
  "question": "문제 텍스트",
  "choices": ["①", "②", "③", "④", "⑤"],  // 5지선다의 경우
  "answer": 2,  // 정답 번호 (1-5)
  "explanation": "해설 텍스트",
  "source_chunk": "근거 본문"
}
```

**SSE 실시간 진행상황:**
```
event: question_generated
data: {"step": "generation", "progress": 60, "generated": 12, "total": 20}

event: generation_complete
data: {"step": "generation", "progress": 100, "questions": [...], "review_required": true}
```

---

## 3. 파이프라인 2: RAG Q&A

수강생이 강의 내용에 대해 질문하면, 관련 강의 청크를 검색하여 문맥 기반 답변을 제공합니다.

### 3.1 질문 임베딩

```javascript
const questionEmbedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: userQuestion
})
```

### 3.2 pgvector 유사도 검색 (top-k=5)

```sql
SELECT lc.id, lc.lecture_id, lc.content,
       1 - (lc.embedding <=> $1) AS similarity
FROM lecture_chunks lc
WHERE lc.teacher_id = $1
  AND lc.academy_id = $2
  AND lc.embedding IS NOT NULL
ORDER BY lc.embedding <=> $1
LIMIT $3;
```

- 연산자 `<=>`: cosine distance (1 - similarity)
- `top-k=5`: 가장 관련성 높은 5개 청크 선택 (env.rag.topK 기본값)
- 에스컬레이션 여부는 검색 결과가 없거나 응답 내 키워드로 판단 (고정 임계값 없음)

### 3.3 컨텍스트 주입 및 GPT-4o-mini 스트리밍 응답

```javascript
const context = topChunks.map(c => c.chunk_text).join('\n\n---\n\n')

const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  stream: true,
  messages: [
    {
      role: 'system',
      content: `당신은 ${lectureName} 강의의 AI 튜터입니다.
                아래 강의 내용만을 근거로 답변하세요.
                근거가 없으면 "강의 내용에서 찾을 수 없습니다"라고 답하세요.

                [강의 내용]
                ${context}`
    },
    { role: 'user', content: userQuestion }
  ]
})
```

### 3.4 에스컬레이션 조건

AI가 신뢰도 높은 답변을 제공하지 못할 때 교강사에게 자동 에스컬레이션합니다.

**에스컬레이션 트리거 조건:**
1. 유사한 청크가 검색되지 않은 경우 (관련 강의 내용 없음)
2. GPT 응답에 "교강사에게 문의" 또는 "강의 범위를 벗어" 포함

**에스컬레이션 처리:**
```
에스컬레이션 발생
     │
     ▼
질문 + AI 응답 + 유사도 점수 저장
     │
     ▼
교강사 알림 발송 (인앱 + 이메일)
     │
     ▼
교강사 직접 답변 → 수강생에게 전달
     │
     ▼
해당 Q&A 쌍을 임베딩 DB에 추가 (지식 축적)
```

---

## 4. 파이프라인 3: 학습 로드맵 자동 생성

수강생의 약점 데이터를 분석하여 수능 D-day까지의 맞춤형 학습 계획을 생성합니다.

### 4.1 수강생 약점 데이터 수집

```sql
-- 수강생별 유형별 정답률 집계
SELECT
  student_id,
  question_type,
  difficulty,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) AS accuracy_rate
FROM student_answers sa
JOIN questions q ON sa.question_id = q.id
WHERE sa.student_id = $1
GROUP BY student_id, question_type, difficulty
ORDER BY accuracy_rate ASC;
```

이 데이터는 `student_type_stats` 테이블에 집계되어 주기적으로 갱신됩니다.

### 4.2 수능 D-day 역산 우선순위 결정

```javascript
function calculatePriority(stats, dday) {
  const daysLeft = getDaysUntil(dday)

  return stats.map(stat => ({
    ...stat,
    priority: calculateWeightedPriority({
      accuracyRate: stat.accuracy_rate,  // 낮을수록 우선순위 높음
      daysLeft,                          // 일수 적을수록 고빈출 우선
      frequency: stat.exam_frequency,    // 수능 출제 빈도
      difficulty: stat.difficulty        // 난이도 가중치
    })
  })).sort((a, b) => b.priority - a.priority)
}
```

### 4.3 GPT-4o-mini 맞춤 로드맵 생성

```javascript
const roadmapPrompt = `
수강생 정보:
- 수능 D-day: ${dday} (${daysLeft}일 남음)
- 약점 유형 TOP 3: ${weakTypes.join(', ')}
- 현재 평균 정답률: ${averageAccuracy}%

주간 학습 로드맵을 생성하세요:
- 총 ${weeksLeft}주 계획
- 약점 유형 집중 보완 위주
- 각 주차별 목표 정답률 제시
- 구체적인 학습 방법 포함

JSON 형식으로 반환하세요.
`
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

### 5.2 문항 구성

GPT에게 취약 유형과 기타 유형 목록 및 참고 강의 내용을 제공하면, GPT가 각 문항의 난이도(`A`/`B`/`C`)를 결정하여 JSON으로 반환합니다. 별도의 난이도 조정 로직은 구현되어 있지 않습니다.

---

## 6. 비용 최적화 전략

### 6.1 모델 선택 전략
| 작업 | 모델 | 근거 |
|------|------|------|
| 문제 생성 (기본) | gpt-4o-mini | 비용 97% 절감, 충분한 품질 |
| 문제 생성 (고품질) | gpt-4o | 교강사 요청 시 옵션 |
| Q&A 응답 | gpt-4o-mini | 스트리밍 지연 최소화 |
| 로드맵 생성 | gpt-4o-mini | 구조화된 JSON 출력 |
| 임베딩 | text-embedding-3-small | ada-002 대비 5배 저렴 |

### 6.2 임베딩 배치 처리
- 단건 호출 대신 20개씩 배치 처리 (BATCH_SIZE=20)
- 배치 간 50ms 딜레이로 rate limit 방지 (BATCH_DELAY_MS=50)
- 429/503 오류 시 exponential backoff 재시도 (최대 3회)

### 6.3 월 예상 비용
| 항목 | 예상 비용 |
|------|-----------|
| STT (Whisper) | 강의 100시간 기준 약 3,600원 |
| 임베딩 생성 | 강의 100개 기준 약 1,000원 |
| 문제 생성 (gpt-4o-mini) | 강의 100개 × 20문제 약 2,000원 |
| Q&A 응답 (gpt-4o-mini) | 월 1,000건 기준 약 3,000원 |
| **합계** | **약 1~2만원/월** |

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
- Rate limit (429): 지수 백오프 재시도 (1s → 2s → 4s)
- 서버 에러 (500/503): 3회 재시도 후 파이프라인 일시 중단
- 타임아웃: 30초 초과 시 해당 청크 건너뛰고 계속 진행
- API 장애 시: 기존 생성된 문제 유지, 신규 생성만 보류

### 7.3 SSE 연결 복구
```javascript
// 클라이언트: SSE 자동 재연결
const eventSource = new EventSource(`/api/lectures/${id}/progress`)
eventSource.onerror = () => {
  // 브라우저가 자동으로 재연결 시도
  // Last-Event-ID 헤더로 누락된 이벤트 재수신
}
```

### 7.4 데이터 일관성 보장
- 각 파이프라인 단계는 트랜잭션으로 처리
- 중간 실패 시 해당 단계만 재시도 (멱등성 보장)
- 강의 처리 상태를 `lecture_processing_status` 테이블에 기록
