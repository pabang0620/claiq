# 🎓 CLAIQ - 클레이크

> **AI가 수능을 향해 함께 전략을 짜주는 플랫폼**
> 강의 녹음 한 번으로 수능 문제 자동 생성 · 개인 맞춤 학습 로드맵 · 24시간 AI Q&A

<div align="center">

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)

**🔗 라이브 데모: [https://claiq.vercel.app](https://claiq.vercel.app)**

</div>

---

## 왜 CLAIQ인가 — 기존 서비스와의 차이

> *국내 에듀테크 앱 다운로드 상위 서비스(클래스팅 2천만 가입, 콴다 누적 다운로드 1억+) 및 학교·학원용 학습 플랫폼 대표 서비스 기준*

| | 콴다(매스프레소) | 클래스팅 | 아이스크림 | **CLAIQ** |
|---|---|---|---|---|
| 대상 | 학생 개인 | 학교 | 학교 | **수능 학원 생태계** |
| AI 역할 | 문제 풀이 해설 | 학습 추천 | 콘텐츠 제공 | **강의 → 문제 자동생성 + RAG Q&A** |
| 교강사 관여 | 없음 | 부분 | 없음 | **Human-in-the-Loop 필수** |
| 운영자 기능 | 없음 | 기본 통계 | 없음 | **이탈 예측 대시보드** |
| 수능 D-day 연동 | 없음 | 없음 | 없음 | **시험일 역산 우선순위 로드맵** |

> 기존 AI 교육 앱은 "학생 개인"만 본다. CLAIQ는 **학원이라는 생태계 전체**(교강사·수강생·운영자·학부모)를 하나의 플랫폼으로 연결한다.

---

## 🎯 해결하는 문제

수능 준비 중소 학원(강사 3~10명, 수강생 50~300명 규모)은 우수한 강사진과 열정적인 학생을 보유하고 있음에도, **교육 주체 간 정보 단절**로 잠재 가치를 실현하지 못하고 있습니다.

| 주체 | 현재 고통 | CLAIQ 해결책 |
|------|-----------|-------------|
| **교강사** | 수업 후 문제 제작에 상당한 시간 소요. 개별 카카오톡 질문 응대로 번아웃 | 녹음 업로드 → 수능 문제 자동생성. AI가 반복 질문 자동 처리 |
| **수강생** | 취약 유형을 객관적으로 파악 불가. 강사에게 질문하기 심리적 부담 | 수능 유형 단위 약점 분석 + 24시간 AI Q&A |
| **운영자** | 수강생 퇴원 통보를 받아야만 이탈을 인지. 강사 품질 정량 평가 불가 | 이탈 예측 대시보드 + 강의별 이해도 통계 |
| **학부모** | 자녀 학습 현황을 알 수 없어 불안. 학원 투자 효과 검증 불가 | 자동 생성 성취 리포트 SMS 발송 |

---

## ✨ 핵심 기능

### 🏫 운영자 (Operator)

- **수강생 이탈 예측 대시보드** - 출결률 · 문제풀이 빈도 · Q&A 이용률을 복합 분석해 `at_risk`(3일 미활동) / `inactive`(7일 미활동) 위험군을 자동 분류, 사전 개입 가능

![운영자 이탈 예측 대시보드](docs/screenshots/02_operator_dashboard.png)

- **강의별 이해도 통계** - 난이도 A/B/C별 평균 정답률, 질문 빈도 시각화. 강사 콘텐츠 품질 데이터 기반 평가
- **성취 리포트 SMS 1클릭 발송** - 수강생별 출결·약점 개선 현황을 자동 생성해 학부모에게 문자 발송
- **포인트/쿠폰 시스템 관리** - 교환 기프티콘 브랜드 및 학원비 할인 쿠폰 조건 직접 설정

### 👩‍🏫 교강사 (Teacher)

- **강의 녹음 업로드 → AI 문제 자동생성** - Whisper STT로 음성을 텍스트로 변환, GPT-4o-mini가 수능 스타일 문제(난이도 A/B/C, 5지선다/단답형) 자동 생성

![교강사 문제 검수 화면](docs/screenshots/03_teacher_review.png)

- **수능 유형 자동 매핑** - 강의 내용이 수능 출제 기준 어떤 유형(국어 독서 빈칸추론, 수학 미적분 극값 등)에 해당하는지 AI가 자동 태깅
- **Human-in-the-Loop 검수** - AI 생성 문제를 교강사가 승인 / 수정 / 반려 처리. 검수 통과된 문제만 학생에게 출제
- **QA 에스컬레이션** - AI가 처리 못한 심화 질문만 교강사에게 알림으로 필터링
- **출결 관리** - 웹 인터페이스에서 출결 표기, 미출석 수강생 자동 식별

### 🎒 수강생 (Student)

- **강의 기반 AI Q&A (RAG + 실시간 스트리밍)** - 해당 교강사의 강의 내용 범위 내에서 pgvector 유사도 검색 후 GPT가 SSE 스트리밍으로 실시간 답변

![학생 AI Q&A 실시간 스트리밍 화면](docs/screenshots/04_student_qa.png)

- **수능 유형별 약점 분석** - 문제 풀이 데이터를 수능 유형 단위로 누적 분석. 막연한 "약함"이 아니라 "수학 미적분 극값 유형 정답률 32%" 수준의 정밀 진단 (수치는 출력 예시)

![수능 유형별 약점 분석 화면](docs/screenshots/06_student_weakpoints.png)

- **수능 D-day 역산 개인 학습 로드맵** - 수능까지 남은 일수 + 취약 유형 + 수업 일정을 AI가 종합 분석해 개인별 학습 우선순위 자동 설계. 매주 재계산

![학생 D-day 역산 로드맵 화면](docs/screenshots/05_student_roadmap.png)

- **개인별 맞춤 미니 모의고사** - 약점 유형 70% 이상 집중 편성, 실제 수능 형식(시간 제한·배점) 적용. 풀이 후 유형별 분석 리포트 자동 제공
- **포인트 · 뱃지 · 스트릭** - 출석(10p), 정답(난이도 A 5p / B 10p / C 20p), AI Q&A 이용(2p), 7일 스트릭(30p) / 30일 스트릭(100p), 주간 목표 달성(50p) 누적 → 100p당 기프티콘·학원비 할인 쿠폰 교환

---

## 🤖 AI 파이프라인

### 강의 업로드 → 문제 생성 (비동기 파이프라인)

```
교강사 녹음 파일 업로드
        │
        ▼
[1] Whisper-1 STT
    └─ 음성 → 강의 트랜스크립트 (텍스트)
        │
        ▼
[2] text-embedding-3-small
    └─ 트랜스크립트 청크 → 벡터 → pgvector 저장
       (RAG 지식 베이스 구축)
        │
        ▼
[3] GPT-4o-mini - 수능 유형 자동 매핑
    └─ 강의 내용 → 수능 출제 유형 태그 부착
       (예: 국어독서/빈칸추론, 수학/미적분/극값)
        │
        ▼
[4] GPT-4o-mini - 문제 자동 생성
    ├─ 과목별 수능 출제 패턴 시스템 프롬프트 자동 적용
    ├─ 난이도 A(기본) / B(표준) / C(심화) 각각 생성
    └─ 5지선다 / 단답형 / 혼합 선택 가능
        │
        ▼
[5] Human-in-the-Loop (교강사 검수)
    ├─ 승인 → DB 저장 → 수강생 출제 활성화
    ├─ 수정 → 재저장
    └─ 반려 → 삭제

※ 처리 상태는 SSE(Server-Sent Events)로 프론트에 실시간 전달
```

### RAG Q&A 파이프라인 (실시간 스트리밍)

```
수강생 질문 입력
        │
        ▼
text-embedding-3-small → 질문 벡터화
        │
        ▼
pgvector 코사인 유사도 검색
└─ 해당 교강사 강의 범위 필터 적용
   상위 K개 강의 청크 추출
        │
        ▼
GPT-4o-mini (RAG Augmented Generation)
└─ 검색된 강의 내용 기반 답변 생성
   SSE 스트리밍으로 실시간 반환
        │
        ▼
AI 처리 불가 질문 → 교강사 에스컬레이션 알림
```

### 수능 D-day 역산 개인 로드맵 ← 이것이 핵심 차별점

**왜 "역산"인가?**
수능은 대한민국에서 날짜가 고정된 유일한 시험이다. 남은 일수가 확정되어 있기 때문에, 일반적인 "약점 보완" 추천이 아닌 **"D-day까지 이 유형을 몇 번 반복할 수 있는가"를 역산**해 우선순위를 결정한다.

```
우선순위 점수 = (1 - 정답률) × 수능 빈출도 가중치
남은 학습 가능 횟수 = D-day ÷ 권장 복습 주기
```

배분 가능한 시간이 부족할수록 **정답률이 낮고 빈출도가 높은 유형**이 최우선 순위가 된다.
이는 수능 전문 교강사의 지도 방식을 알고리즘화한 것이다.

```
입력: 수능 D-day + 수능 유형별 정답률 + 향후 수업 일정
        │
        ▼
GPT-4o-mini 전략 분석
├─ 취약 유형 우선순위 산출 (정답률 낮은 순 × 수능 출제 빈도 가중치)
├─ 남은 일수 대비 커버 가능 유형 수 계산
└─ 수업 일정 연계 학습 순서 배치
        │
        ▼
출력 예시: "수능까지 87일 / 이번 주 집중: 수학 극값 유형 / 순서: 강의A → 문제B → 강의C"
        │
        ▼
매주 자동 재계산 (weeklyRoadmapUpdate 크론 잡 — 매주 월요일 오전 2시)
```

### 이탈 예측 (Rule-Based Churn Detection)

```
출석·학습 활동 데이터 분석 (atRiskDetection 크론 잡 — 매일 오전 9시)
├─ 3일 이상 미활동 → at_risk 분류 → 운영자 대시보드 경보
└─ 7일 이상 미활동 → inactive 분류 → 즉시 개입 권고
```

> 기준값(3일 / 7일)은 환경변수 `CHURN_RISK_DAYS` / `CHURN_INACTIVE_DAYS`로 학원별 조정 가능.

---

## 🛠 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| **Frontend** | React 19, Vite 7 | 최신 Concurrent 렌더링, 초고속 HMR |
| **UI** | Tailwind CSS v4, Zustand v5 | 유틸리티 우선 스타일링, 경량 전역 상태관리 |
| **Backend** | Node.js, Express (ESM) | 논블로킹 I/O - 비동기 AI 파이프라인에 최적 |
| **유효성 검증** | Zod | 런타임 타입 안전성, API 스키마 공유 |
| **인증** | JWT (Access 1h + Refresh 30d) | Refresh Token Rotation, httpOnly 쿠키 |
| **DB** | PostgreSQL + pgvector (Supabase) | 관계형 + 벡터 검색을 단일 DB에서 처리 |
| **AI - STT** | OpenAI Whisper-1 | 한국어 수능 전문 용어 인식 정확도 우수 |
| **AI - LLM** | OpenAI GPT-4o-mini | 긴 강의 트랜스크립트 처리 + 비용 효율성 |
| **AI - 임베딩** | text-embedding-3-small | 고차원 의미론적 유사도, pgvector 연동 |
| **실시간 통신** | SSE (Server-Sent Events) | AI 처리 진행상황 · Q&A 스트리밍 실시간 전달 |
| **파일 업로드** | Multer | 음성 파일 (mp3/wav) + 강의 자료 (PDF) |
| **배포 - Front** | Vercel | 글로벌 CDN, 자동 Preview 배포 |
| **배포 - Back** | Render | 무중단 배포, 환경변수 관리 |
| **스케줄링** | node-cron | 주간 로드맵 재계산, 이탈 예측 감지 |

---

## 🤖 AI 협업 개발 전략

CLAIQ는 Claude Code와 10개 전문 에이전트를 분업 활용해 2인 팀이 단기간에 엔터프라이즈급 구현을 달성했다.

| 역할 | 에이전트 | 활용 내용 |
|------|---------|----------|
| 아키텍처 | architect | DB 27테이블 스키마, RAG 파이프라인 설계 |
| 백엔드 | express-engineer | 12개 도메인 API, AI 모듈 7개 구현 |
| 프론트엔드 | react-specialist | 31개 페이지, 9개 Zustand 스토어 |
| 품질 | doc-verifier (프로젝트 전용) | 문서-코드 불일치 4라운드 자동 검증 |
| 기획 리서치 | Python 크롤러 + Claude | 사용자 4개 관점 크롤링, 수상작 8개 분석 |
| 테스트 | Playwright + Claude | 전 기능 API 통합 테스트 자동화 |

> 상세 협업 기록: [AI_협업_기록.md](./AI_협업_기록.md) / [CLAIQ_AI리포트.md](./CLAIQ_AI리포트.md)

---

## 🏗 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     사용자 브라우저                               │
│   [운영자 대시보드]   [교강사 관리]   [수강생 학습]               │
│         React 19 + Vite 7 (Vercel CDN)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API + SSE (HTTPS)
┌─────────────────────────▼───────────────────────────────────────┐
│                   Node.js + Express (Render)                    │
│  ┌────────────┐  ┌───────────────┐  ┌──────────────────────┐   │
│  │  Auth 미들웨어 │  │  RBAC (역할별   │  │   Rate Limiter +     │   │
│  │  JWT 검증   │  │  접근 제어)     │  │   Zod 유효성 검증    │   │
│  └────────────┘  └───────────────┘  └──────────────────────┘   │
│                                                                  │
│  Routes → Controllers → Services → Repositories                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    AI 파이프라인                          │    │
│  │  whisper.js  embedding.js  questionGenerator.js          │    │
│  │  typeMapper.js  ragQA.js  roadmapGenerator.js            │    │
│  │  examGenerator.js                                        │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         │                                        │
│  ┌──────────────────────▼───────────────┐                       │
│  │         node-cron 스케줄러            │                       │
│  │  weeklyRoadmapUpdate / atRiskDetection│                       │
│  └──────────────────────────────────────┘                       │
└──────────┬────────────────────────┬────────────────────────────┘
           │                        │
┌──────────▼──────────┐   ┌─────────▼──────────────────────────┐
│ PostgreSQL (Supabase) │   │         OpenAI API                  │
│  claiq 스키마         │   │  ┌─────────┐ ┌──────────────────┐  │
│  ┌─────────────────┐ │   │  │Whisper-1│ │ GPT-4o-mini      │  │
│  │  관계형 테이블들  │ │   │  │ (STT)   │ │ (문제생성/Q&A    │  │
│  ├─────────────────┤ │   │  └─────────┘ │  로드맵/모의고사) │  │
│  │  pgvector       │ │   │              └──────────────────┘  │
│  │  (임베딩 벡터)   │ │   │  ┌──────────────────────────────┐  │
│  └─────────────────┘ │   │  │text-embedding-3-small (RAG)  │  │
└─────────────────────┘   │  └──────────────────────────────┘  │
                           └────────────────────────────────────┘
```

---

## 👥 역할별 기능 요약

| 기능 | 운영자 | 교강사 | 수강생 |
|------|:------:|:------:|:------:|
| 이탈 예측 대시보드 | ✅ | - | - |
| 강의별 이해도 통계 | ✅ | ✅ | - |
| 성취 리포트 SMS 발송 | ✅ | - | - |
| 포인트/쿠폰 시스템 관리 | ✅ | - | - |
| 강의 녹음 업로드 | - | ✅ | - |
| AI 문제 자동생성 (Whisper+GPT) | - | ✅ | - |
| 수능 유형 자동 매핑 | - | ✅ | - |
| Human-in-the-Loop 검수 | - | ✅ | - |
| QA 에스컬레이션 수신 | - | ✅ | - |
| 출결 관리 | - | ✅ | - |
| 강의 정리자료 업로드 | - | ✅ | - |
| AI Q&A (RAG 스트리밍) | - | - | ✅ |
| 문제 풀기 & 수능 유형 약점분석 | - | - | ✅ |
| D-day 역산 학습 로드맵 | - | - | ✅ |
| 개인별 맞춤 미니 모의고사 | - | - | ✅ |
| 포인트 · 뱃지 · 스트릭 | - | - | ✅ |

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 18 이상
- PostgreSQL (pgvector 확장 활성화)
- OpenAI API 키

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/claiq.git
cd claiq
```

### 2. 환경변수 설정

```bash
# 백엔드
cp back/.env.example back/.env
```

```env
# back/.env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://user:password@host:5432/claiq_db

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret

OPENAI_API_KEY=sk-...

CORS_ORIGIN=http://localhost:5173
```

```bash
# 프론트엔드
cp front/.env.example front/.env
```

```env
# front/.env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 의존성 설치 및 DB 초기화

```bash
# 백엔드
cd back
npm install

# pgvector 확장 활성화 (PostgreSQL에서 1회 실행)
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql $DATABASE_URL -c "CREATE SCHEMA IF NOT EXISTS claiq;"

# 마이그레이션 실행
npm run migrate
```

```bash
# 프론트엔드
cd front
npm install
```

### 4. 개발 서버 실행

```bash
# 백엔드 (터미널 1)
cd back && npm run dev
# → http://localhost:4000

# 프론트엔드 (터미널 2)
cd front && npm run dev
# → http://localhost:5173
```

### 5. 데모 계정으로 로그인

| 역할 | 이메일 | 비밀번호 |
|------|--------|---------|
| 운영자 | operator@demo.claiq.kr | demo1234 |
| 교강사 | teacher1@demo.claiq.kr | demo1234 |
| 수강생 | s1@demo.claiq.kr | demo1234 |

![로그인 화면](docs/screenshots/01_login.png)

---

## 📁 프로젝트 구조

```
claiq/
├── front/                          # React 19 + Vite 7 프론트엔드
│   └── src/
│       ├── pages/
│       │   ├── operator/           # 운영자 대시보드, 통계, 리포트
│       │   ├── teacher/            # 강의 업로드, 문제 검수, 출결 관리
│       │   ├── student/            # Q&A, 문제풀기, 로드맵, 모의고사
│       │   ├── auth/               # 로그인, 회원가입, 학원 코드 입력
│       │   └── legal/              # 이용약관, 개인정보처리방침
│       ├── api/                    # Axios 기반 API 클라이언트
│       ├── store/                  # Zustand v5 전역 상태
│       └── components/             # 공통 UI 컴포넌트
│
├── back/                           # Node.js + Express 백엔드
│   └── src/
│       ├── app.js                  # Express 앱 설정
│       ├── server.js               # HTTP 서버 진입점
│       ├── config/
│       │   ├── db.js               # pg Pool 설정
│       │   ├── openai.js           # OpenAI 클라이언트
│       │   ├── env.js              # 환경변수 검증
│       │   └── supabase.js         # Supabase 클라이언트
│       ├── routes/                 # API 라우터 (auth/lecture/question/qa/...)
│       ├── domains/                # 도메인별 controller + service + repository
│       ├── ai/
│       │   ├── whisper.js          # Whisper STT 래퍼
│       │   ├── embedding.js        # text-embedding-3-small 래퍼
│       │   ├── questionGenerator.js # 문제 생성 파이프라인
│       │   ├── typeMapper.js       # 수능 유형 매핑
│       │   ├── ragQA.js            # RAG Q&A (SSE 스트리밍)
│       │   ├── roadmapGenerator.js # D-day 역산 로드맵 생성
│       │   └── examGenerator.js    # 맞춤 미니 모의고사 생성
│       ├── prompts/
│       │   ├── questionGeneration/ # 과목별 문제생성 시스템 프롬프트
│       │   ├── typeMapping/        # 수능 유형 매핑 프롬프트
│       │   ├── ragQA/              # RAG Q&A 프롬프트
│       │   ├── roadmap/            # 로드맵 생성 프롬프트
│       │   └── exam/               # 모의고사 생성 프롬프트
│       ├── data/
│       │   └── suneung_types.json  # 수능 출제 유형 분류 체계 (과목별 세부 유형)
│       ├── middleware/             # auth / RBAC / upload / rateLimiter / Zod validate
│       ├── jobs/
│       │   ├── weeklyRoadmapUpdate.js  # 주간 로드맵 자동 재계산
│       │   └── atRiskDetection.js      # 이탈 위험 수강생 감지
│       └── utils/                  # jwt, date, suneung type helpers
│
├── CLAIQ_기획안.md                 # 서비스 전체 기획서
├── CLAIQ_플랜_백엔드.md            # 백엔드 구현 플랜
├── CLAIQ_플랜_프론트엔드.md        # 프론트엔드 구현 플랜
├── CLAIQ_플랜_데이터베이스.md      # DB 스키마 설계
├── CLAIQ_AI리포트.md               # AI 활용 상세 기록
├── AI_협업_기록.md                  # Claude Code 협업 로그
└── CLAIQ_테스트_체크리스트.md       # 기능별 테스트 체크리스트
```

---

## 💰 비즈니스 모델

### 수익 구조
| 구분 | 내용 | 단가 |
|------|------|------|
| **SaaS 기본 구독** | 학원당 월 정액 (강사 1~3명 기준) | 월 5만원 |
| **SaaS 스탠다드** | 강사 4~10명 규모 | 월 10만원 |
| **SaaS 프리미엄** | 강사 10명 이상 + 커스텀 기능 | 월 15만원~ |
| **AI 사용량 과금** | 기본 할당량(강의 20개/월) 초과 시 | 강의당 300원 |
| **알림 발송** | 학부모 SMS/카카오 알림톡 | 건당 15원 |

### 목표 시장
- **TAM (전체 시장)**: 전국 사설 학원 약 7만 개 (연 매출 17조 원 규모, 2024 통계청)
- **SAM (서비스 가능 시장)**: 수능 전문 학원 약 1.5만 개
- **SOM (목표 시장)**: 수강생 50~300명 규모 중소 학원 약 5,000개

**5% 침투 시** (250개 학원 × 평균 월 8만원) = **월 2,000만원 MRR**

### B2B 도입 채널
1. **강사 커뮤니티**: 수능 강사 네이버 카페, 오르비 등 커뮤니티를 통한 입소문
2. **학원 박람회**: 한국학원총연합회, 에듀테크 코리아 등 전시회 참가
3. **프리미엄 무료 체험**: 첫 3개월 무제한 무료 → 전환율 기반 과금
4. **교강사 추천 프로그램**: 도입 학원 추천 시 1개월 무료 혜택

---

## 🔗 배포 링크

| 환경 | URL |
|------|-----|
| **프론트엔드 (Vercel)** | https://claiq.vercel.app |
| **백엔드 API (Render)** | https://claiq.onrender.com |
| **API 헬스체크** | https://claiq.onrender.com/api/health |

---

## 📄 문서

| 문서 | 설명 |
|------|------|
| [CLAIQ_기획안.md](./CLAIQ_기획안.md) | 서비스 기획 전문 - 해결 문제, 사용자 여정, 기능 목록, 기대효과 |
| [CLAIQ_플랜_백엔드.md](./CLAIQ_플랜_백엔드.md) | API 엔드포인트 명세, 비즈니스 로직 |
| [CLAIQ_플랜_프론트엔드.md](./CLAIQ_플랜_프론트엔드.md) | 컴포넌트 구조, 페이지별 UI 설계, 상태관리 |
| [CLAIQ_플랜_데이터베이스.md](./CLAIQ_플랜_데이터베이스.md) | DB 스키마 설계, pgvector 인덱스 전략 |
| [CLAIQ_AI리포트.md](./CLAIQ_AI리포트.md) | AI 모델 선택 근거, 프롬프트 전략, 파이프라인 설계 |
| [AI_협업_기록.md](./AI_협업_기록.md) | Claude Code와의 실제 협업 과정 및 주요 결정 기록 |
| [CLAIQ_테스트_체크리스트.md](./CLAIQ_테스트_체크리스트.md) | 역할별 기능 E2E 테스트 체크리스트 |

---

## 🏆 공모전 정보

**2026 KIT 바이브코딩 공모전** 출품작

| 항목 | 내용 |
|------|------|
| 팀 구성 | 2인 |
| 서비스명 | CLAIQ (클레이크) |
| 카테고리 | AI 활용 교육 서비스 |
| 타겟 시장 | 수능 준비 중소 학원 (운영자 · 교강사 · 수강생) |
| 핵심 AI 기술 | Whisper STT + GPT-4o-mini + text-embedding-3-small + pgvector RAG |

---

<div align="center">

**CLAIQ** - AI가 수능을 향해 함께 전략을 짜주는 플랫폼

*강의 녹음 → 수능 문제 자동생성 → 개인 맞춤 로드맵 → 24시간 AI Q&A*

</div>
