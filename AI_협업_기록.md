# CLAIQ AI 협업 기록

> Claude와 함께 진행한 주요 작업의 의사결정 및 결과를 기록합니다.
> 형식은 `CLAUDE.md` 참고.

---

## 프로젝트 기획 및 서비스 설계 — 2026-04-07

### 작업 배경
수능 준비 중소 학원 시장의 페인포인트를 분석하고, AI를 활용한 교육 플랫폼의 핵심 기능을 정의해야 했다. 2인 팀으로 공모전 기간 내에 구현 가능한 범위를 설정하는 것이 중요했다.

### AI와 함께 한 것
- 학원 운영자/교강사/수강생 3개 역할의 페인포인트 도출 및 기능 우선순위 결정
- 수능 유형 분류 체계 설계 (국어독서·문학, 수학미적분·확통·기하, 영어독해·듣기)
- AI 파이프라인 설계: 녹음 → Whisper STT → GPT 문제생성 → RAG Q&A → 로드맵 자동생성
- 역할별 기능 범위 확정 (운영자/교강사/수강생)

### 핵심 결정 및 근거
- **Human-in-the-Loop 문제 검수**: AI가 생성한 문제를 교강사가 승인/수정/반려. 완전 자동화보다 신뢰도 확보가 중요
- **RAG 방식 Q&A**: 강의 전체 지식이 아닌 벡터 유사도 기반 컨텍스트만 주입 → 정확도↑, 비용↓
- **이탈 예측**: 출석 데이터 기반 단순 규칙(3일/7일)으로 시작 → 복잡한 ML 모델 대신 즉시 활용 가능한 방식 선택

### 결과
기획안, 기술 스택, DB 스키마, API 설계, 프론트엔드 구조 문서 완성.

---

## DB 스키마 설계 및 마이그레이션 — 2026-04-07

### 작업 배경
PostgreSQL + pgvector 기반 스키마를 설계하고 Supabase에 적용해야 했다. 10개 도메인(인증, 학원, 강의, 문제, Q&A, 로드맵, 시험, 출석, 포인트, 리포트)을 커버해야 했다.

### AI와 함께 한 것
- 27개 테이블 스키마 설계 (UUID PK, 소프트삭제, created_at/updated_at 자동관리)
- pgvector 벡터 컬럼 설계 (lecture_chunks 테이블, 1536차원 embedding)
- 10개 마이그레이션 파일 생성 및 순서 결정
- `claiq` 스키마 분리 전략 수립

### 핵심 결정 및 근거
- **별도 스키마 분리**: Supabase의 public 스키마와 충돌 방지, 보안 강화
- **PgBouncer 대응**: Transaction mode에서 `SET search_path`가 세션 간 유지되지 않는 문제 → `ALTER DATABASE postgres SET search_path TO claiq, public`으로 영구 설정
- **포인트 멱등성**: `idempotency_key`로 중복 지급 방지

### 결과
10개 마이그레이션 파일, 27개 테이블, pgvector 인덱스 설정 완료.

---

## 백엔드 API 구현 — 2026-04-07

### 작업 배경
12개 도메인의 REST API를 Express + ESM 기반으로 구현해야 했다. AI 파이프라인(Whisper, GPT, Embedding)과 실시간 처리(SSE)도 포함.

### AI와 함께 한 것
- 12개 도메인 구조 설계 (controller / service / repository 3-layer)
- AI 모듈 7개 구현: whisper.js, questionGenerator.js, ragQA.js, embedding.js, typeMapper.js, roadmapGenerator.js, examGenerator.js
- SSE(Server-Sent Events) 기반 실시간 처리 진행상황 전송
- JWT Access + Refresh Token Rotation 인증 구현
- Zod 기반 요청 검증 미들웨어

### 핵심 결정 및 근거
- **비동기 AI 파이프라인**: 강의 업로드 후 즉시 응답 → 백그라운드에서 STT/임베딩/문제생성 → SSE로 진행상황 push. UX와 타임아웃 문제 동시 해결
- **Repository 패턴**: 비즈니스 로직과 DB 쿼리 분리 → 테스트 용이성 + 유지보수성
- **gpt-4o-mini 기본값**: 비용 97% 절감, 수능 문제 생성 품질 충분

### 결과
12개 도메인 API, AI 파이프라인, 인증/보안 미들웨어 구현 완료.

---

## 프론트엔드 구현 — 2026-04-07

### 작업 배경
React 19 + Vite 7 기반으로 3개 역할(운영자/교강사/수강생)의 전체 페이지를 구현해야 했다.

### AI와 함께 한 것
- 역할별 라우팅 구조 설계 (PrivateRoute + RoleRoute)
- 30개+ 페이지 및 50개+ 컴포넌트 구현
- Zustand 스토어 설계 (auth, lecture, question, qa, roadmap, exam, point, ui)
- axios 인터셉터 기반 토큰 자동 갱신 구현
- SSE 훅(useSSE) 및 업로드 진행 컴포넌트 구현

### 핵심 결정 및 근거
- **역할별 레이아웃 분리**: 운영자/교강사/수강생이 완전히 다른 사이드바와 네비게이션을 가짐
- **Zustand v5**: Context API 대비 보일러플레이트 최소화, 선택적 구독으로 리렌더링 최소화
- **Lazy loading**: 페이지 단위 코드 스플리팅으로 초기 로딩 최적화

### 결과
30개 페이지, 역할별 대시보드, AI Q&A 스트리밍, 실시간 업로드 진행 UI 구현 완료.

---

## 시드 데이터 생성 — 2026-04-07

### 작업 배경
실제 수능 유형에 기반한 현실감 있는 데모 데이터가 필요했다. 공모전 심사·데모 시 빈 화면이 아닌 실제 서비스처럼 보여야 했다.

### AI와 함께 한 것
- 실제 수능 기출 유형 크롤링 및 분류 체계 수립
- 실제 수능 지문 스타일의 강의 트랜스크립트 작성 (국어독서, 문학, 수학미적분, 영어독해)
- 수능 5지선다 형식의 문제 7개 + 해설 작성
- 5명 수강생의 현실적인 정답률 차등 설계 (박지호 86% ~ 정우성 29%)

### 핵심 결정 및 근거
- **실제 수능 유형 반영**: 막연한 더미 데이터 대신 실제 수능 출제 유형(EBS 연계, 신경향 등)으로 설득력 확보
- **수강생별 차등 실력**: 모든 학생이 같은 정답률이면 비현실적 → 상위/중위/하위권 분포 반영

### 결과
5개 강의, 7개 수능형 문제, 35개 답변 기록, 출석·포인트·로드맵·Q&A 데이터 완성.

---

## 배포 및 운영 환경 설정 — 2026-04-07

### 작업 배경
로컬 개발 환경에서 실제 서비스 가능한 프로덕션 배포로 전환해야 했다. 공모전 심사에서 실제 URL을 제출해야 하기 때문.

### AI와 함께 한 것
- Vercel CLI로 프론트엔드 배포 자동화 (`vercel --prod`)
- `vercel.json` SPA 라우팅 설정 (모든 경로 → index.html)
- `.env.production` 분리 (로컬: localhost / 프로덕션: claiq.onrender.com)
- Render 백엔드 배포 트러블슈팅 (PgBouncer IPv6 문제 해결)
- 타임존 KST 설정 (서버 TZ=Asia/Seoul, DB SET timezone)
- GitHub 연동 및 `.gitignore` 보안 설정 (API 키 커밋 방지)
- UptimeRobot 모니터링으로 Render free 슬립 방지

### 핵심 결정 및 근거
- **Vercel + Render 무료 플랜**: 공모전 단계에서 비용 없이 실제 서비스 URL 확보
- **Session mode pooler (port 5432)**: Render free 티어의 IPv4 제약 + PgBouncer username 파싱 문제를 동시 해결
- **GitHub Actions 대신 Vercel/Render 자동 배포**: 별도 CI/CD 없이 push → 자동 배포

### 결과
https://claiq.vercel.app (프론트), https://claiq.onrender.com (백엔드) 배포 완료.

---

## 실서비스 요건 적용 — 2026-04-07

### 작업 배경
공모전이지만 "실제 프로덕트를 만든다"는 기준으로 실서비스 요건을 모두 적용하기로 결정.

### AI와 함께 한 것
- 개인정보 처리방침 페이지 작성 (한국 개인정보보호법 PIPA 10개 조항)
- 이용약관 페이지 작성 (12개 조항, 준거법 대한민국, 서울중앙지방법원)
- 회원가입 시 약관 동의 체크박스 구현 (필수)
- OG 태그, Twitter Card, robots.txt, favicon 적용
- 보안 메타태그 (X-Frame-Options, X-Content-Type-Options)

### 핵심 결정 및 근거
- **법적 요건 우선**: 실제 서비스라면 개인정보처리방침 없이 운영 불가 → 공모전이어도 동일 기준 적용
- **SEO/소셜 공유 준비**: 심사위원이 URL 공유 시 카드 미리보기가 올바르게 표시되도록

### 결과
법적 페이지 2개, 약관 동의 UI, SEO/보안 메타태그 전체 적용 완료.
