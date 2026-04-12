# CLAIQ — 수능 학원을 위한 AI 파트너

> 강의 녹음 하나로 수능 문제 자동 생성 · 개인 맞춤 로드맵 · 24시간 RAG Q&A

CLAIQ는 **바이브코딩(AI와 인간이 함께 빠르게 만드는 방식)** 을 개발 과정과 제품 모두에 구현한 교육 플랫폼입니다. Claude Code 멀티 에이전트로 2인 팀이 17일→5일(71% 단축)로 엔터프라이즈급 서비스를 구현하고, 제품 안에서는 5단계 자율 에이전트 파이프라인이 강의 녹음을 수능 문제로 변환합니다.

<div align="center">

**🔗 [라이브 데모 바로 가기 → claiq.vercel.app](https://claiq.vercel.app)**

로그인 화면 하단 **"데모 계정으로 빠른 시작"** 클릭 — 비밀번호 없이 즉시 체험

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--412991?logo=openai&logoColor=white)](https://openai.com)
[![Vercel](https://img.shields.io/badge/배포-Vercel-000000?logo=vercel&logoColor=white)](https://claiq.vercel.app)

</div>

---

## 🚀 빠른 시작 — 데모 체험

> 회원가입 없이 아래 계정으로 바로 로그인하거나, 로그인 화면의 **데모 버튼**을 클릭하면 자동 입력됩니다.

| 역할 | 이메일 | 비밀번호 | 체험 포인트 |
|------|--------|---------|------------|
| 🏫 운영자 (원장) | admin@claiq.kr | claiq1234 | 이탈 예측 대시보드, 성취 리포트 발송 |
| 👨‍🏫 교강사 | teacher@claiq.kr | claiq1234 | 강의 업로드 → AI 문제 자동생성, 검수 |
| 🎓 수강생 | student@claiq.kr | claiq1234 | AI Q&A, 학습 로드맵, 미니 모의고사 |

**라이브 데모**: https://claiq.vercel.app

---

## 이 서비스가 필요한 이유

수능 준비 중소 학원(강사 3~10명, 수강생 50~300명)은 **교강사·수강생·운영자 사이의 정보 단절**로 인해 교육의 악순환이 반복됩니다.

> **근거**: Python 크롤러로 교육 커뮤니티·뉴스 **70건** 수집·분석 → 역할별 페인포인트 데이터 기반 기획

| 역할 | 현재 고통 | CLAIQ 해결 |
|------|----------|-----------|
| 교강사 | 수업 후 문제 제작 2~3시간 소요. 개별 질문 응대 번아웃 | 녹음 → 수능 문제 자동생성. AI가 반복 질문 처리 |
| 수강생 | 취약 유형 파악 불가. 질문 심리적 부담. D-day 관리 혼자 못 함 | 수능 유형 단위 약점 분석 + 24시간 AI Q&A + 역산 로드맵 |
| 운영자 | 이탈 통보 받아야만 인지. 강사 품질 정량 평가 불가 | 이탈 예측 대시보드 + 강의별 이해도 통계 |
| 학부모 | 자녀 학습 현황을 학원에 물어봐야만 앎 | 성취 리포트 자동 생성 후 운영자가 SMS 발송 버튼 클릭 → Solapi API 연동 (데모: 시뮬레이션 모드) |

---

## 핵심 AI 파이프라인 (5단계 자율 에이전트 파이프라인)

```
[교강사] 강의 녹음 업로드
         │
         ▼
①  Whisper-1 STT          → 음성 → 강의 트랜스크립트
②  text-embedding-3-small  → 청크 벡터화 → pgvector 저장  ← RAG 지식 베이스
③  gpt-4o 수능 유형 매핑 → 강의 내용 → 수능 출제 유형 자동 태깅
④  gpt-4o 문제 자동 생성 → 난이도 A/B/C · 5지선다 · 단답형
⑤  교강사 Human-in-the-Loop → 승인 / 수정 / 반려
         │
         ▼ 승인된 문제만 수강생에게 출제

[수강생] 질문 입력
         │
         ▼
⑥  text-embedding-3-small  → 질문 벡터화
⑦  pgvector 코사인 유사도  → 해당 강사 강의 범위 내 상위 K청크 검색
⑧  gpt-4o RAG 답변 생성 → SSE 스트리밍으로 실시간 반환
         │ AI 처리 불가
         └──→ 교강사 에스컬레이션 알림
```

> **SSE(Server-Sent Events)**: AI 처리 진행상황과 Q&A 답변을 WebSocket 없이 실시간 스트리밍

---

## 수능 D-day 역산 로드맵 — 핵심 차별점

수능은 날짜가 고정된 시험입니다. 일반적인 "약점 보완 추천"이 아닌, **남은 일수에서 역산**해 우선순위를 결정합니다.

```
우선순위 점수 = (1 - 정답률) × 수능 빈출도 가중치
커버 가능 횟수 = D-day ÷ 권장 복습 주기

→ 시간이 부족할수록 정답률 낮고 빈출도 높은 유형이 최우선
```

매주 월요일 오전 2시 자동 재계산 (node-cron) — 수강생의 학습 진도에 따라 로드맵이 매주 갱신됩니다.

---

## 역할별 주요 기능

| 기능 | 운영자 | 교강사 | 수강생 |
|------|:------:|:------:|:------:|
| 이탈 예측 대시보드 (at_risk / inactive) | ✅ | | |
| 강의별 통계 (출석·문제·정답률) | ✅ | ✅ | |
| 성취 리포트 자동 생성 + SMS 발송 (Solapi API 연동, 데모: 시뮬레이션 모드) | ✅ | | |
| 강의 녹음 업로드 (STT + 임베딩) | | ✅ | |
| AI 문제 자동생성 (수능 유형 매핑) | | ✅ | |
| 문제 검수 (pending/approved/rejected) | | ✅ | |
| 출결 관리 · QA 에스컬레이션 | | ✅ | |
| AI Q&A (RAG + 스트리밍) | | | ✅ |
| 수능 유형별 약점 분석 | | | ✅ |
| D-day 역산 학습 로드맵 (주간 재계산) | | | ✅ |
| 미니 모의고사 (약점 70% + 기타 30%, 20분 타이머) | | | ✅ |
| 포인트 · 뱃지(7종) · 스트릭 | | | ✅ |

---

## 💰 AI 운영 비용 투명성

> 모델: OpenAI gpt-4o 기준 (기본값). 고품질 모드(GPT-4o) 전환 시 문제생성 품질 향상, 비용 약 15배 증가.

### 강의 1편 처리 비용 (30분 녹음 기준)

| 단계 | API | 토큰/단위 | 비용 |
|------|-----|---------|------|
| ① STT (Whisper-1) | Whisper | 30분 오디오 | ~$0.18 |
| ② 임베딩 (text-embedding-3-small) | Embedding | ~20청크 × 500토큰 = 10K tokens | ~$0.0002 |
| ③ 수능 유형 매핑 (gpt-4o) | gpt-4o | 입력 2K + 출력 500 tokens | ~$0.0006 |
| ④ 문제 생성 3난이도 (gpt-4o) | gpt-4o | 입력 6K + 출력 3K tokens × 3 | ~$0.0063 |
| **강의 1편 합계** | | | **~$0.19** |

> 비용 대부분은 STT(Whisper-1)에서 발생. gpt-4o 단가: $0.15/$0.60 per M tokens.

### 수강생 세션 비용 (1회 기준)

| 기능 | API | 토큰 | 비용 |
|------|-----|------|------|
| AI Q&A 1회 (RAG) | gpt-4o | 입력 2K + 출력 500 tokens | ~$0.0006 |
| 미니 모의고사 생성 | gpt-4o | 입력 3K + 출력 2K tokens | ~$0.0017 |
| D-day 로드맵 생성 | gpt-4o | 입력 2K + 출력 1K tokens | ~$0.0009 |

### 학원 규모별 월 예상 비용

| 학원 규모 | 강의/월 | 수강생 Q&A/일 | 예상 월 AI 비용 |
|----------|---------|-------------|--------------|
| 소규모 (강사 3명, 수강생 50명) | 30편 | 50회 | **~$8** |
| 중규모 (강사 7명, 수강생 150명) | 70편 | 150회 | **~$18** |
| 대규모 (강사 10명, 수강생 300명) | 100편 | 300회 | **~$30** |

> SaaS 구독료(월 5~15만원) 대비 AI 비용은 최대 30% 수준 — 마진 구조 건전함.

---

## 🤖 AI를 3가지 레이어로 활용한 개발 방식

CLAIQ는 **제품 안의 AI**뿐 아니라 **개발 과정 전체에 AI를 적용**한 것이 핵심 차별점입니다.

### Layer 1 — 시장 리서치: AI + Playwright 크롤링

기획 단계에서 추측 없이 데이터로 페인포인트를 수집했습니다.

```
Python + Playwright + asyncio.gather
├─ 교육 커뮤니티·뉴스 70건 수집 (research/crawl_pain_points.py)
│   └─ 역할별 불만 분류 → 기능 1:1 대응
└─ 공모전 경쟁작 GitHub 10개 병렬 크롤링 (research/crawl_competitors.py)
    └─ README·기술스택·의존성 자동 추출
       → CLAIQ 차별점 및 보완 전략 도출
```

- 크롤링으로 **학부모 SMS 발송** 기능을 발굴 (초기 기획에 없었음)
- 경쟁작 분석으로 **이탈 예측 우선순위 상향** 결정

### Layer 2 — 제품 개발: Claude Code 멀티 에이전트

10개 전문 에이전트를 역할별로 병렬 실행해 2인 팀이 엔터프라이즈급 구현을 달성했습니다.

```
architect        → DB 27테이블, RAG 파이프라인 설계
express-engineer → 12개 도메인 API, AI 모듈 7개 구현
react-specialist → 32개 페이지, 9개 Zustand 스토어
database-reviewer→ 마이그레이션 검증, 쿼리 최적화
security-reviewer→ JWT 인증, SQL 인젝션 방지
tdd-guide        → 역할별 E2E 테스트 자동화
```

`CLAUDE.md` + `AGENTS.md`로 프로젝트 컨텍스트를 AI에게 사전 주입해 일관된 코딩 컨벤션 유지.

### Layer 3 — QA: Playwright MCP 자동화 테스트

Playwright MCP로 실제 배포 환경에서 역할별 전체 플로우 자동 검증.

```
운영자 플로우: 학원 등록 → 멤버 초대 → 이탈 대시보드 → 리포트 → SMS
교강사 플로우: 강의 업로드 → STT → 문제생성 → 검수 → 출결
수강생 플로우: 문제풀기 → 약점분석 → AI Q&A → 로드맵 → 모의고사
```

**11개 버그 자동 발견·수정** — 단위 테스트로는 잡기 어려운 API 연동 버그, 토큰 갱신 타이밍, SSE 연결 이슈를 실 사용자 동선에서 검증.

> 상세 협업 기록: [AI_협업_기록.md](./AI_협업_기록.md) | AI 전략 전문: [CLAIQ_AI리포트.md](./CLAIQ_AI리포트.md)

---

## 기존 서비스와의 차이

| | 콴다 | 클래스팅 | **CLAIQ** |
|---|---|---|---|
| 대상 | 학생 개인 | 학교 | **수능 학원 생태계 (3-role)** |
| AI 역할 | 문제 풀이 해설 | 학습 추천 | **강의 → 문제생성 + RAG Q&A** |
| 교강사 관여 | 없음 | 부분 | **Human-in-the-Loop 검수 필수** |
| 운영자 기능 | 없음 | 기본 통계 | **이탈 예측 + 강의별 분석** |
| 수능 D-day | 없음 | 없음 | **역산 우선순위 로드맵** |
| 배포 | SaaS | SaaS | **실 배포 완료** |

---

## 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| Frontend | React 19, Vite 7 | Concurrent 렌더링, 초고속 HMR |
| 상태관리 | Zustand v5 | 보일러플레이트 최소화, 선택적 구독 |
| Backend | Node.js, Express (ESM) | 논블로킹 I/O — 비동기 AI 파이프라인 최적 |
| 유효성 검증 | Zod | 런타임 타입 안전성 |
| 인증 | JWT Access(1h) + Refresh(30d) | Refresh Token Rotation, httpOnly 쿠키 |
| DB | PostgreSQL + pgvector (Supabase) | 관계형 + 벡터 검색을 단일 DB에서 |
| STT | OpenAI Whisper-1 | 한국어 수능 전문용어 인식 정확도 |
| LLM | OpenAI gpt-4o (기본) / gpt-4o (환경변수 전환) | 수능 문체 생성 · 비용 효율 최적 |
| 임베딩 | text-embedding-3-small | 고차원 의미론적 유사도, 비용 효율 |
| 실시간 | SSE (Server-Sent Events) | AI 처리 진행상황 · 스트리밍 답변 |
| 스케줄러 | node-cron | 주간 로드맵 재계산, 이탈 감지 크론 |
| 배포 | Vercel + Render | 무료 플랜에서 실 서비스 URL 확보 |

---

## 빠른 시작 (로컬)

```bash
# 백엔드
cd back && npm install && npm run dev   # http://localhost:5000

# 프론트엔드
cd front && npm install && npm run dev  # http://localhost:5173
```

**환경변수** (`back/.env`):
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
OPENAI_MODEL_CHAT=gpt-4o
JWT_SECRET=...
CORS_ORIGIN=http://localhost:5173
```

**데모 계정** (비밀번호: `claiq1234`):

| 역할 | 이메일 |
|------|--------|
| 운영자 | admin@claiq.kr |
| 교강사 | teacher@claiq.kr |
| 수강생 | student@claiq.kr ~ student5@claiq.kr |

---

## 문서

| 문서 | 내용 |
|------|------|
| [CLAIQ_심사자_데모가이드.md](./CLAIQ_심사자_데모가이드.md) | 10분 탐색 순서 · 핵심 체크포인트 |
| [CLAIQ_AI리포트.md](./CLAIQ_AI리포트.md) | AI 전략 · 토큰 비용 · 프롬프트 설계 |
| [AI_협업_기록.md](./AI_협업_기록.md) | Claude Code 협업 전 과정 로그 |
| [CLAIQ_기획안.md](./CLAIQ_기획안.md) | 서비스 기획 전문 |
| [CLAIQ_플랜_데이터베이스.md](./CLAIQ_플랜_데이터베이스.md) | DB 스키마 · pgvector 설계 |
| [CLAIQ_테스트_체크리스트.md](./CLAIQ_테스트_체크리스트.md) | 역할별 E2E 체크리스트 |
| [docs/adr/ADR-001](./docs/adr/ADR-001-ai-model-selection.md) | AI 모델 선택 근거 (gpt-4o 채택) |
| [docs/adr/ADR-002](./docs/adr/ADR-002-rag-architecture.md) | RAG 아키텍처 설계 결정 |
| [docs/adr/ADR-003](./docs/adr/ADR-003-human-in-the-loop.md) | Human-in-the-Loop 검수 구조 |
| [docs/adr/ADR-004](./docs/adr/ADR-004-sse-vs-websocket.md) | SSE vs WebSocket 선택 |
| [docs/adr/ADR-005](./docs/adr/ADR-005-db-connection-strategy.md) | DB 연결 전략 |
| [docs/adr/ADR-006](./docs/adr/ADR-006-frontend-state-management.md) | 프론트엔드 상태관리 |
| [docs/competitive_analysis.md](./docs/competitive_analysis.md) | 경쟁사 분석 — 수능 학원 AI 도구 시장 포지셔닝 |

---

## 배포

| 환경 | URL |
|------|-----|
| 프론트엔드 | https://claiq.vercel.app |
| 백엔드 API | https://claiq.onrender.com |
| 헬스체크 | https://claiq.onrender.com/api/health |

---

## 공모전 정보

**2026 KIT 바이브코딩 공모전** | 팀명: 네코랩 | 2인 팀

| 심사 기준 | CLAIQ 대응 |
|----------|-----------|
| 기술적 완성도 | 5단계 자율 에이전트 파이프라인(에이전트 체인 구조) · SSE · pgvector RAG · 실 배포 |
| AI 활용 능력 | 리서치(크롤링) · 개발(멀티 에이전트) · QA(Playwright) 3레이어 |
| 기획력 및 실무 접합성 | 크롤링 데이터 기반 페인포인트 → 기능 1:1 대응 · 비즈니스 모델 |
| 창의성 | 수능 D-day 역산 우선순위 · 3-role B2B 생태계 · 이탈 예측 |

<div align="center">

**CLAIQ** — 강의 녹음 한 번으로 수능 학원 전체가 달라집니다

</div>
