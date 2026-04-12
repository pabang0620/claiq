# ADR-004: 실시간 처리 전략 — SSE vs WebSocket

## 상태

**승인됨** - 2026-04-08

---

## 맥락

강의 업로드 후 AI 파이프라인(STT → 임베딩 → 유형 매핑 → 문제 생성)이 완료되기까지 수 분이 소요됩니다.
이 동안 교강사에게 파이프라인 진행상황을 실시간으로 전달할 방법이 필요했습니다.

파이프라인 단계는 다음과 같습니다:

```
강의 업로드 완료
     │
     ▼
stt_processing  (Whisper-1 STT 처리 중)
     │
     ▼
embedding       (text-embedding-3-small 청크 임베딩)
     │
     ▼
type_mapping    (수능 유형 매핑)
     │
     ▼
question_gen    (GPT-4o-mini 문제 생성)
     │
     ▼
done / error
```

### 검토된 선택지

#### 선택지 1: WebSocket

클라이언트와 서버 간 양방향 실시간 통신.

**장점:**
- 양방향 통신 가능 (클라이언트 → 서버 메시지 전송 가능)
- 낮은 레이턴시
- 표준화된 프로토콜

**단점:**
- 별도의 WebSocket 서버 또는 라이브러리(socket.io 등) 추가 필요
- HTTP와 별개 프로토콜이므로 Nginx/Render 배포 설정 별도 필요
- AI 파이프라인 진행상황 전달에는 양방향이 불필요 — 오버엔지니어링
- Render free 티어에서 WebSocket 연결 안정성 불확실

#### 선택지 2: SSE (Server-Sent Events)

HTTP 프로토콜 위에서 서버가 클라이언트로 단방향 이벤트를 push하는 방식.

**장점:**
- HTTP/1.1 표준 기반 — 추가 인프라 없이 Express에서 바로 구현 가능
- 브라우저 `EventSource` API로 클라이언트 구현 단순
- Render 배포 환경에서 HTTP와 동일하게 동작
- heartbeat로 연결 유지 가능
- AI 파이프라인 특성(단방향 push)에 정확히 부합

**단점:**
- 단방향(서버 → 클라이언트)만 가능
- HTTP/2 환경에서 다중 SSE 연결 시 커넥션 제한 고려 필요

#### 선택지 3: Polling (주기적 HTTP 요청)

클라이언트가 주기적으로 서버에 상태를 요청.

**장점:**
- 구현 단순

**단점:**
- 불필요한 HTTP 요청 발생 (파이프라인 완료 전까지 계속 요청)
- 진행상황 업데이트 지연 (폴링 간격만큼 딜레이)
- 서버 부하 증가

---

## 결정

**SSE (Server-Sent Events) 채택**

구체적인 구현:
- 서버: `Content-Type: text/event-stream` 헤더, `res.write()` 로 이벤트 전송
- 클라이언트: 브라우저 `EventSource` API
- 연결 유지: 30초 간격 heartbeat (`': heartbeat\n\n'`)
- 클라이언트 관리: `lectureId` 기준 `Map<string, Set<res>>` 구조

---

## 근거

### 1. AI 파이프라인은 단방향 push만 필요

AI 파이프라인 진행상황 전달은 "서버 → 클라이언트" 단방향입니다.
클라이언트가 파이프라인 도중 서버에 별도 메시지를 보낼 시나리오가 없으므로
WebSocket의 양방향 기능은 필요하지 않습니다.

### 2. 추가 인프라 불필요

Express에 `res.setHeader('Content-Type', 'text/event-stream')`와 `res.write()`만 추가하면 됩니다.
socket.io나 ws 라이브러리 추가, Nginx WebSocket 업그레이드 설정 없이
Render 배포 환경에서 HTTP와 동일한 방식으로 동작합니다.

### 3. 구현 단순성

```javascript
// 서버: lectureService.js
const sseClients = new Map()

export const broadcastStatus = (lectureId, status, extra = {}) => {
  const clients = sseClients.get(lectureId)
  if (!clients) return
  const data = JSON.stringify({ status, ...extra })
  for (const res of clients) {
    res.write(`data: ${data}\n\n`)
  }
}
```

```javascript
// 클라이언트: useSSE.js
esRef.current = new EventSource(fullUrl, { withCredentials: true })
```

---

## 결과

### 구현된 SSE 흐름

```
교강사 강의 업로드
     │
     ▼
GET /lectures/:id/status (SSE 연결 수립)
     │
     ▼
서버 → 클라이언트: { status: 'stt_processing' }
     │
     ▼
서버 → 클라이언트: { status: 'embedding' }
     │
     ▼
서버 → 클라이언트: { status: 'type_mapping' }
     │
     ▼
서버 → 클라이언트: { status: 'question_gen' }
     │
     ▼
서버 → 클라이언트: { status: 'done', questionCount: N }
```

### 구현 파일

- `back/src/domains/lecture/lectureService.js` — `addSseClient()`, `removeSseClient()`, `broadcastStatus()`
- `back/src/domains/lecture/lectureController.js` — `getLectureStatus()` (SSE 엔드포인트)
- `front/src/hooks/useSSE.js` — 범용 SSE 훅, JWT 토큰 쿼리파라미터 전달

---

## 트레이드오프

- 양방향 통신이 필요한 기능(예: 실시간 채팅, 협업 편집)이 추가되면 WebSocket 도입 필요
- 현재 RAG Q&A 스트리밍 응답은 SSE가 아닌 `Transfer-Encoding: chunked` 방식으로 별도 구현
- HTTP/2 환경에서 동일 origin 다중 SSE 연결 시 브라우저의 커넥션 제한(6개)은 HTTP/2 멀티플렉싱으로 해소됨
