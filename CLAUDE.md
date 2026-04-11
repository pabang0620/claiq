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
│   │   ├── pages/           # operator / teacher / student / auth / legal
│   │   ├── api/             # axios 기반 API 클라이언트
│   │   ├── store/           # Zustand v5 스토어 (uiStore, authStore, academyStore, ...)
│   │   ├── components/      # 공통(ui, layout) 및 역할별 컴포넌트
│   │   │   ├── ui/          # Dialog, Input, Button, Avatar, Card, Spinner, ...
│   │   │   ├── layout/      # AppLayout, Header, Sidebar, ...
│   │   │   ├── operator/    # ReportPreview, ...
│   │   │   └── ...
│   │   ├── hooks/           # useAuth, useSSE, useDebounce, ...
│   │   ├── constants/       # roles, 상수 정의
│   │   ├── styles/          # index.css (Tailwind v4 + 커스텀 애니메이션)
│   │   ├── utils/           # formatDate, 유틸리티 함수
│   │   └── main.jsx
│   └── index.html
├── back/           # Node.js + Express (ESM)
│   ├── src/
│   │   ├── domains/         # auth, academy, lecture, question, qa, roadmap, exam, attendance, point, report, ...
│   │   │   └── [domain]/    # controller.js, service.js, repository.js
│   │   ├── ai/              # whisper.js, questionGenerator.js, ragQA.js, embedding.js, typeMapper.js, ...
│   │   ├── config/          # db.js, env.js, supabase.js
│   │   ├── middleware/      # auth, validation, errorHandler, ...
│   │   └── server.js
│   ├── migrations/          # SQL 마이그레이션 파일 (001-015)
│   └── tests/fixtures/      # 테스트용 샘플 파일 (test_audio.wav 등)
├── research/                # 기획 단계 리서치 (크롤링 스크립트, 데이터 JSON)
├── submissions/             # 공모전 제출 서류 (gitignored)
├── CLAUDE.md
├── AI_협업_기록.md
└── CLAIQ_테스트_체크리스트.md
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

## 개발 규칙

- 들여쓰기: 2 spaces
- 네이밍: 컴포넌트 PascalCase / 함수·변수 camelCase / 상수 UPPER_SNAKE_CASE
- DB 쿼리: parameterized query 필수 (SQL injection 방지)
- 환경변수: `.env` 사용, 커밋 금지 (`.env.production` 예외 - 시크릿 없음)
- 타임존: 서버·DB 모두 `Asia/Seoul` (KST)

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
