# CLAIQ - Claude 협업 지침서

## 프로젝트 개요
수능 준비 중소 학원을 위한 AI 통합 교육 플랫폼.
강의 녹음 → Whisper STT → GPT-4o 문제 자동 생성 → 학생 맞춤 학습 로드맵까지 제공.

**팀 구성**: 2인 (기획·개발)
**공모전**: 2026 KIT 바이브코딩 공모전

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19, Vite 7, Tailwind v4, Zustand v5, React Router DOM v7 |
| Backend | Node.js, Express (ESM), Zod, JWT |
| Database | PostgreSQL + pgvector (Supabase, `claiq` schema) |
| AI | OpenAI GPT-4o, Whisper-1, text-embedding-3-small |
| 배포 | Vercel (프론트) / Render (백엔드) |

---

## 프로젝트 구조

```
award/
├── front/          # React 19 + Vite 7
│   ├── src/
│   │   ├── pages/           # operator / teacher / student / auth / common / legal / report
│   │   ├── api/             # axios 기반 API 클라이언트
│   │   ├── store/           # Zustand v5 스토어 (uiStore, authStore, academyStore, ...)
│   │   ├── components/      # 공통(ui, layout) 및 역할별 컴포넌트
│   │   │   ├── ui/          # Dialog, Input, Button, Avatar, Card, Spinner, ...
│   │   │   ├── layout/      # AppLayout, Header, Sidebar, ...
│   │   │   ├── student/     # ChatBubble, QuizCard, RoadmapTimeline, WeakTypeChart, ...
│   │   │   ├── teacher/     # QuestionCard, EscalationItem, UploadDropzone, ...
│   │   │   └── operator/    # ReportPreview, ...
│   │   ├── hooks/           # useAuth, useSSE, useQAStream, useRoadmap, ...
│   │   ├── constants/       # roles, points, 상수 정의
│   │   ├── styles/          # index.css (Tailwind v4 + 커스텀 애니메이션)
│   │   ├── utils/           # formatDate, formatPoint, 유틸리티 함수
│   │   └── main.jsx
│   └── index.html
├── back/           # Node.js + Express (ESM)
│   ├── src/
│   │   ├── domains/
│   │   │   ├── auth/        # JWT 인증, Refresh Token Rotation
│   │   │   ├── academy/     # 학원·수강생·쿠폰 관리
│   │   │   ├── lecture/     # 강의 업로드, STT, 자료 관리
│   │   │   ├── question/    # 문제 생성·검수·퀴즈
│   │   │   ├── qa/          # RAG 챗봇, 에스컬레이션
│   │   │   ├── roadmap/     # AI 학습 로드맵
│   │   │   ├── exam/        # 모의고사
│   │   │   ├── attendance/  # 출석 체크, 이탈 감지
│   │   │   ├── point/       # 포인트·뱃지·쿠폰 교환
│   │   │   ├── badge/       # 뱃지 정의·수여
│   │   │   ├── report/      # 학원 리포트
│   │   │   └── dashboard/   # 대시보드 집계
│   │   ├── ai/              # whisper.js, questionGenerator.js, ragQA.js,
│   │   │                    # embedding.js, roadmapGenerator.js, examGenerator.js, typeMapper.js
│   │   ├── config/          # db.js, env.js, supabase.js
│   │   ├── middleware/      # authMiddleware, roleMiddleware, validate, rateLimiter, ...
│   │   └── server.js
│   ├── migrations/          # SQL 마이그레이션 파일 (001 ~ 017)
│   └── seeds/               # 데모 데이터 SQL
├── .claude/
│   └── agents/              # 프로젝트 전용 Claude 에이전트 정의
│       ├── claiq-bug-hunter.md
│       ├── claiq-api-linker.md
│       ├── claiq-e2e-tester.md
│       ├── claiq-seed-generator.md
│       ├── competition-writer.md
│       └── error-handler-fix.md
├── docs/
│   ├── planning/            # 기획 초안, 질문리스트, 경쟁 레퍼런스
│   ├── dev/                 # AI 협업 기록, ADR, 에이전트 가이드
│   └── submission/          # 공모전 제출 서류, 심사자 데모가이드
├── submissions/             # 공모전 제출 파일 (gitignored)
└── CLAUDE.md
```

---

## 주요 설계 결정

- **DB 스키마**: `claiq` 스키마 분리 (public과 충돌 방지)
- **인증**: JWT Access Token (1h) + Refresh Token Rotation (30d, httpOnly cookie)
- **AI 처리**: 강의 업로드 → 비동기 파이프라인 → SSE로 실시간 진행상황 전달
- **RAG Q&A**: pgvector 유사도 검색 → GPT 컨텍스트 주입 → 스트리밍 응답
- **이탈 예측**: 출석 데이터 기반 at_risk / inactive 분류
- **포인트 시스템**: 출석·문제풀이·스트릭·주간목표 달성 시 자동 지급

---

## CLAUDE.md의 역할 — 오케스트레이터 시스템 프롬프트

**이 파일 자체가 Claude Code 오케스트레이터의 행동 지침서다.**

Claude Code를 실행하면 CLAUDE.md가 자동으로 컨텍스트에 주입되어, 메인 Claude가 이 파일에 정의된 규칙과 역할 분담 원칙에 따라 동작한다. 즉, 오케스트레이터(메인 Claude)는 코드를 직접 작성하지 않고 아래 에이전트들에게 위임하는 지휘자 역할을 수행한다.

### 멀티 에이전트 협업 구조

```
사용자 요청
  │
  ├─ [버그] claiq-bug-hunter → 재현·분석 → 전문 에이전트 호출
  │
  ├─ [기능] planner → 구현 계획
  │            ├─ react-specialist  (프론트엔드) ─┐ 독립 작업 병렬 실행
  │            └─ express-engineer  (백엔드)     ─┘
  │                       └─ code-reviewer  (변경 후 항상 자동 실행)
  │
  ├─ [연결] claiq-api-linker → 프론트↔백엔드 API 필드명·타입 정합성 검증
  ├─ [테스트] claiq-e2e-tester → 핵심 사용자 플로우 E2E 검증
  ├─ [데이터] claiq-seed-generator → 데모용 DB 시드 데이터 생성
  └─ [문서] competition-writer → 공모전 제출 문서 작성
```

### 오케스트레이터 원칙
- 오케스트레이터는 분석·판단·위임만 한다. Edit·Write 도구로 코드 파일 직접 수정 금지
- 독립적인 작업은 반드시 병렬로 에이전트를 동시 실행해 속도 최적화
- 에이전트 정의 파일: `.claude/agents/` 디렉토리

---

## AI 기능 설계 원칙

**Human-in-the-Loop 필수**
- AI가 생성한 문제는 반드시 교사 검수(승인·수정·반려) 후 학생에게 노출
- RAG 답변 불가 판단 시 교사 에스컬레이션 — AI 단독 오답 차단

**RAG 파이프라인**
- 강의 전사본 → 청크 분할 → text-embedding-3-small → pgvector 저장
- 질문 벡터화 → 유사 청크 검색 → GPT-4o 컨텍스트 주입 → 출처 인용 응답
- 스트리밍 응답(SSE)으로 체감 대기 시간 최소화

**문제 생성 프롬프트 전략**
- 수능 9종 유형별 시스템 프롬프트 분리 설계
- JSON 구조화 출력 강제 (파싱 실패 재시도 방지)
- 난이도(상/중/하) 명시 → 포인트 차등 지급 연동

---

## API 응답 규격

```js
// 성공
{ success: true, data: T, message?: string }
// 페이지네이션
{ success: true, data: T[], meta: { total, page, limit } }
// 실패
{ success: false, error: string }
```

모든 엔드포인트는 Zod 스키마 validation 미들웨어 적용 필수

---

## 개발 규칙

- 들여쓰기: 2 spaces
- 네이밍: 컴포넌트 PascalCase / 함수·변수 camelCase / 상수 UPPER_SNAKE_CASE
- DB 쿼리: parameterized query 필수 (SQL injection 방지)
- 상태 불변성: 객체 직접 변경 금지, 항상 새 객체 반환
- 환경변수: `.env` 사용, 커밋 금지 (`.env.production` 예외 - 시크릿 없음)
- 타임존: 서버·DB 모두 `Asia/Seoul` (KST)
- 에러 처리: try-catch 필수, 사용자 노출 메시지와 서버 로그 분리

---

## AI 협업 로깅 규칙 (필수)

규모 있는 작업이 완료될 때마다 `AI_협업_기록.md`에 아래 형식으로 기록을 추가한다.

```markdown
## [작업명] - YYYY-MM-DD

### 작업 배경
왜 이 작업이 필요했는가.

### AI와 함께 한 것
- 어떤 결정을 AI와 함께 내렸는가
- 어떤 코드/설계를 AI가 생성했는가

### 핵심 결정 및 근거
주요 기술적 결정과 그 이유.

### 결과
무엇이 만들어졌는가.
```

**규모 있는 작업 기준**: 새 기능 추가, 아키텍처 변경, 버그 수정 (영향 범위 > 3파일), 배포 설정

---

## 테스트 계정 (claiq1234)

| 역할 | 이메일 | 비밀번호 | 이름 |
|------|--------|---------|------|
| 운영자 | admin@claiq.kr | claiq1234 | 정민석 |
| 교강사 | teacher@claiq.kr | claiq1234 | 이준혁 |
| 교강사2 | teacher2@claiq.kr | claiq1234 | 박서연 |
| 수강생 | student@claiq.kr | claiq1234 | 김민준 |
| 수강생2 | student2@claiq.kr | claiq1234 | 최서아 |
| 수강생3 | student3@claiq.kr | claiq1234 | 박지호 |
| 수강생4 | student4@claiq.kr | claiq1234 | 이하은 |
| 수강생5 | student5@claiq.kr | claiq1234 | 정우성 |
