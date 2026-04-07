# CLAIQ 백엔드 구현 플랜

---

## 1. 프로젝트 구조 (폴더/파일 트리)

```
backend/
├── src/
│   ├── app.js                          # Express 앱 설정, 미들웨어 등록
│   ├── server.js                       # HTTP 서버 진입점
│   ├── config/
│   │   ├── db.js                       # pg Pool 설정
│   │   ├── openai.js                   # OpenAI 클라이언트 초기화
│   │   └── env.js                      # 환경변수 검증 및 export
│   ├── routes/
│   │   ├── index.js                    # 라우터 통합
│   │   ├── auth.routes.js              # 인증 라우터
│   │   ├── academy.routes.js           # 학원 관리 라우터
│   │   ├── lecture.routes.js           # 강의 라우터
│   │   ├── question.routes.js          # 문제 라우터
│   │   ├── qa.routes.js                # Q&A 라우터
│   │   ├── roadmap.routes.js           # 로드맵 라우터
│   │   ├── exam.routes.js              # 미니 모의고사 라우터
│   │   ├── attendance.routes.js        # 출결 라우터
│   │   ├── point.routes.js             # 포인트 라우터
│   │   ├── report.routes.js            # 리포트 라우터
│   │   └── dashboard.routes.js         # 운영자 대시보드 라우터
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── academy.controller.js
│   │   ├── lecture.controller.js
│   │   ├── question.controller.js
│   │   ├── qa.controller.js
│   │   ├── roadmap.controller.js
│   │   ├── exam.controller.js
│   │   ├── attendance.controller.js
│   │   ├── point.controller.js
│   │   ├── report.controller.js
│   │   └── dashboard.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── academy.service.js
│   │   ├── lecture.service.js
│   │   ├── question.service.js
│   │   ├── qa.service.js
│   │   ├── roadmap.service.js
│   │   ├── exam.service.js
│   │   ├── attendance.service.js
│   │   ├── point.service.js
│   │   ├── report.service.js
│   │   ├── dashboard.service.js
│   │   └── notification.service.js
│   ├── ai/
│   │   ├── whisper.js                  # Whisper STT 래퍼
│   │   ├── embedding.js                # text-embedding-3-small 래퍼
│   │   ├── questionGenerator.js        # 문제 생성 파이프라인
│   │   ├── typeMapper.js               # 수능 유형 매핑 파이프라인
│   │   ├── ragQA.js                    # RAG Q&A 파이프라인
│   │   ├── roadmapGenerator.js         # 로드맵 생성 파이프라인
│   │   └── examGenerator.js            # 미니 모의고사 생성 파이프라인
│   ├── prompts/
│   │   ├── questionGeneration/
│   │   │   ├── system.txt              # 문제 생성 시스템 프롬프트 (기본)
│   │   │   ├── korean.txt              # 국어 전용 프롬프트 (문학/독서 유형 반영)
│   │   │   ├── math.txt                # 수학 전용 프롬프트 (수열/함수/통계 유형 반영)
│   │   │   └── english.txt             # 영어 전용 프롬프트 (듣기/독해 유형 반영)
│   │   ├── typeMapping/
│   │   │   └── system.txt              # 수능 유형 매핑 시스템 프롬프트
│   │   ├── ragQA/
│   │   │   └── system.txt              # RAG Q&A 시스템 프롬프트
│   │   ├── roadmap/
│   │   │   └── system.txt              # 로드맵 생성 시스템 프롬프트
│   │   └── exam/
│   │       └── system.txt              # 미니 모의고사 생성 시스템 프롬프트
│   ├── data/
│   │   └── suneung_types.json          # 수능 유형 분류 체계 (과목별 세부 유형 코드/명/패턴)
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── academy.repository.js
│   │   ├── lecture.repository.js
│   │   ├── question.repository.js
│   │   ├── qa.repository.js
│   │   ├── roadmap.repository.js
│   │   ├── exam.repository.js
│   │   ├── attendance.repository.js
│   │   ├── point.repository.js
│   │   └── vector.repository.js        # pgvector 유사도 검색 쿼리
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT 검증
│   │   ├── role.middleware.js          # 역할 기반 접근 제어 (RBAC)
│   │   ├── upload.middleware.js        # multer 설정 (음성/PDF 업로드)
│   │   ├── rateLimiter.middleware.js   # API 요청 제한
│   │   ├── validate.middleware.js      # 요청 바디 검증 (Zod)
│   │   └── errorHandler.middleware.js  # 전역 에러 핸들러
│   ├── jobs/
│   │   ├── weeklyRoadmapUpdate.job.js  # 매주 로드맵 자동 재계산 크론
│   │   └── atRiskDetection.job.js      # 이탈 위험 수강생 감지 크론
│   └── utils/
│       ├── jwt.js
│       ├── bcrypt.js
│       ├── textChunker.js              # 강의 텍스트 청킹 유틸
│       ├── academyCode.js              # 학원 고유 코드 생성
│       └── logger.js
├── migrations/                         # SQL 마이그레이션 파일
├── seeds/                              # 시드 데이터 SQL
├── tests/
│   ├── unit/
│   └── integration/
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## 2. 환경변수 목록

```env
# 서버
NODE_ENV=development
PORT=4000

# 데이터베이스 (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Supabase (Storage, Auth 연동용)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role 키 (Storage 업로드용)
SUPABASE_STORAGE_BUCKET_AUDIO=claiq-audio      # 녹음 파일 버킷
SUPABASE_STORAGE_BUCKET_MATERIAL=claiq-material # 강의자료 버킷

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRES_IN=30d

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL_CHAT=gpt-4o
OPENAI_MODEL_EMBEDDING=text-embedding-3-small
OPENAI_MODEL_STT=whisper-1
OPENAI_TEMPERATURE=0.7

# RAG 설정
RAG_CHUNK_SIZE=500
RAG_CHUNK_OVERLAP=50
RAG_TOP_K=5

# 파일 업로드 제한
UPLOAD_MAX_AUDIO_MB=25        # Whisper API 제한
UPLOAD_MAX_MATERIAL_MB=20     # PDF/이미지 강의자료
UPLOAD_ALLOWED_AUDIO=audio/mpeg,audio/wav,audio/mp4,audio/m4a,audio/webm
UPLOAD_ALLOWED_DOCS=application/pdf,image/jpeg,image/png

# 포인트 시스템 (확정값)
POINT_DAILY_ATTENDANCE=10
POINT_CORRECT_A=5
POINT_CORRECT_B=10
POINT_CORRECT_C=20
POINT_QA_DAILY_MAX=10         # AI Q&A 하루 최대 (5회 × 2P)
POINT_QA_PER_USE=2
POINT_STREAK_7=30
POINT_STREAK_30=100
POINT_WEEKLY_GOAL=50
POINT_TO_COUPON=100           # 100P = 쿠폰 1장

# 이탈 위험 감지 임계값
CHURN_RISK_DAYS=3             # 3일 이상 미접속 → 위험
CHURN_INACTIVE_DAYS=7         # 7일 이상 미접속 → 이탈

# 크론 스케줄
CRON_ROADMAP_UPDATE=0 2 * * 1    # 매주 월요일 02:00
CRON_CHURN_DETECTION=0 9 * * *   # 매일 09:00

# SMS (솔라피 Solapi)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER=                 # 발신 번호 (사전 등록 필요)

# CORS
CORS_ORIGIN=http://localhost:3000,https://claiq.vercel.app

# 슈퍼어드민 (하드코딩, 공모전 데모용)
SUPER_ADMIN_EMAIL=admin@claiq.kr
SUPER_ADMIN_PASSWORD=
```

---

## 3. DB 스키마 (SQL)

> 전체 스키마는 `CLAIQ_플랜_데이터베이스.md` 파일에 상세 기술되어 있습니다.
> 아래는 백엔드 개발에서 즉시 참조하는 핵심 테이블 요약입니다.

```sql
-- 핵심 테이블 목록
-- users, academies, academy_members
-- subjects, question_types (시드 데이터)
-- lectures, lecture_chunks (pgvector 포함)
-- questions, question_options, answer_submissions
-- qa_sessions, qa_messages
-- learning_roadmaps, roadmap_items
-- mini_exams, mini_exam_questions, mini_exam_submissions
-- attendances
-- points, point_transactions
-- badges, badge_definitions, user_badges
-- achievement_reports
```

---

## 4. 구현 단계 Phase 1~10 (파일 단위 체크리스트)

### Phase 1 — 프로젝트 기반 설정

- [ ] `package.json` — 의존성 정의 (express, pg, jsonwebtoken, bcryptjs, multer, openai, node-cron, zod, cors, dotenv)
- [ ] `.env.example` — 환경변수 템플릿
- [ ] `src/config/env.js` — 환경변수 로드 및 필수 항목 검증
- [ ] `src/config/db.js` — pg Pool 설정, pgvector 확장 활성화 확인
- [ ] `src/config/openai.js` — OpenAI 클라이언트 초기화
- [ ] `src/utils/logger.js` — 로거 설정
- [ ] `src/app.js` — Express 앱, CORS, JSON 파싱, 미들웨어 등록
- [ ] `src/server.js` — HTTP 서버 시작
- [ ] `migrations/001_init_extensions.sql` — pgvector 확장 활성화
- [ ] `migrations/002_create_base_tables.sql` — users, academies, academy_members

### Phase 2 — 인증 시스템

- [ ] `migrations/003_create_auth_tables.sql` — refresh_tokens 테이블
- [ ] `src/utils/jwt.js` — JWT 생성/검증 유틸
- [ ] `src/utils/bcrypt.js` — 비밀번호 해싱 유틸
- [ ] `src/repositories/user.repository.js` — 사용자 CRUD
- [ ] `src/services/auth.service.js` — 회원가입, 로그인, 토큰 갱신, 학원 코드 가입 로직
- [ ] `src/controllers/auth.controller.js` — 요청/응답 처리
- [ ] `src/middleware/auth.middleware.js` — JWT 검증 미들웨어
- [ ] `src/middleware/role.middleware.js` — 역할 기반 접근 제어
- [ ] `src/routes/auth.routes.js` — POST /auth/signup, /auth/login, /auth/refresh, /auth/logout
- [ ] `tests/integration/auth.test.js` — 인증 통합 테스트

### Phase 3 — 학원 관리

- [ ] `src/utils/academyCode.js` — 고유 코드 생성 유틸 (6자리 영숫자)
- [ ] `src/repositories/academy.repository.js` — 학원 CRUD, 멤버 관리
- [ ] `src/services/academy.service.js` — 학원 생성, 코드 발급, 강사/수강생 초대, 학원 코드 가입
- [ ] `src/controllers/academy.controller.js`
- [ ] `src/routes/academy.routes.js` — POST /academies, GET /academies/:id, POST /academies/join, POST /academies/:id/invite
- [ ] `tests/integration/academy.test.js`

### Phase 4 — 강의 업로드 및 AI 파이프라인 (STT + 임베딩)

- [ ] `migrations/004_create_lecture_tables.sql` — lectures, lecture_chunks (vector 컬럼 포함)
- [ ] `src/middleware/upload.middleware.js` — multer memoryStorage 설정 (파일 → Supabase Storage 업로드)
- [ ] `src/utils/textChunker.js` — 강의 텍스트 청킹 (chunk_size, overlap 환경변수 적용)
- [ ] `src/ai/whisper.js` — Whisper API STT 변환 래퍼
- [ ] `src/ai/embedding.js` — text-embedding-3-small 임베딩 래퍼
- [ ] `src/repositories/vector.repository.js` — pgvector 저장/유사도 검색
- [ ] `src/services/lecture.service.js` — 업로드 처리, STT → 청킹 → 임베딩 → DB 저장 오케스트레이션
- [ ] `src/controllers/lecture.controller.js`
- [ ] `src/routes/lecture.routes.js` — POST /lectures (multipart), GET /lectures/:id, GET /lectures
- [ ] `tests/unit/textChunker.test.js`

### Phase 5 — 수능 유형 매핑 + 문제 자동 생성

- [ ] `migrations/005_create_question_tables.sql` — subjects, question_types, questions, question_options
- [ ] `seeds/001_subjects.sql` — 수능 전 과목 시드
- [ ] `seeds/002_question_types.sql` — 과목별 수능 유형 코드 시드
- [ ] `src/data/suneung_types.json` — 유형 분류 체계 JSON (과목코드, 유형코드, 유형명, 출제패턴 설명)
- [ ] `src/prompts/typeMapping/system.txt` — 수능 유형 매핑 시스템 프롬프트
- [ ] `src/prompts/questionGeneration/system.txt` — 문제 생성 기본 시스템 프롬프트
- [ ] `src/prompts/questionGeneration/korean.txt` — 국어 전용 (문학/독서 유형)
- [ ] `src/prompts/questionGeneration/math.txt` — 수학 전용 (수열/함수/통계 유형)
- [ ] `src/prompts/questionGeneration/english.txt` — 영어 전용 (듣기/독해 유형)
- [ ] `src/ai/typeMapper.js` — GPT-4 수능 유형 매핑 파이프라인
- [ ] `src/ai/questionGenerator.js` — GPT-4 문제 생성 파이프라인 (난이도 A/B/C, 스트리밍)
- [ ] `src/repositories/question.repository.js` — 문제 CRUD, 상태(pending/approved/rejected) 관리
- [ ] `src/services/question.service.js` — 생성 오케스트레이션, Human-in-the-Loop 검증 흐름
- [ ] `src/controllers/question.controller.js`
- [ ] `src/routes/question.routes.js` — POST /questions/generate, GET /questions (검증 대기 목록), PATCH /questions/:id/review
- [ ] `tests/unit/questionGenerator.test.js`

### Phase 6 — RAG 기반 Q&A

- [ ] `migrations/006_create_qa_tables.sql` — qa_sessions, qa_messages
- [ ] `src/prompts/ragQA/system.txt` — RAG Q&A 시스템 프롬프트
- [ ] `src/ai/ragQA.js` — 질문 임베딩 → pgvector 검색 → GPT-4 응답 생성 (SSE 스트리밍)
- [ ] `src/services/qa.service.js` — Q&A 세션 관리, 에스컬레이션 처리
- [ ] `src/controllers/qa.controller.js`
- [ ] `src/routes/qa.routes.js` — POST /qa/ask (SSE), GET /qa/sessions, GET /qa/sessions/:id/messages
- [ ] `tests/unit/ragQA.test.js`

### Phase 7 — 문제 풀이 및 약점 분석

- [ ] `migrations/007_create_submission_tables.sql` — answer_submissions, student_type_stats
- [ ] `src/repositories/question.repository.js` — 제출 저장, 유형별 통계 집계 (upsert)
- [ ] `src/services/question.service.js` — 제출 처리, 포인트 지급, 유형별 정답률 갱신
- [ ] `src/routes/question.routes.js` — POST /questions/:id/submit, GET /students/:id/type-stats

### Phase 8 — 수능 D-day 로드맵 생성

- [ ] `migrations/008_create_roadmap_tables.sql` — learning_roadmaps, roadmap_items
- [ ] `src/prompts/roadmap/system.txt` — 로드맵 생성 시스템 프롬프트
- [ ] `src/ai/roadmapGenerator.js` — GPT-4 로드맵 생성 파이프라인
- [ ] `src/services/roadmap.service.js` — D-day 계산, 취약 유형 우선순위 산출, 로드맵 생성/갱신
- [ ] `src/controllers/roadmap.controller.js`
- [ ] `src/routes/roadmap.routes.js` — GET /roadmap/me, POST /roadmap/regenerate
- [ ] `src/jobs/weeklyRoadmapUpdate.job.js` — 매주 월요일 02:00 로드맵 재계산 크론
- [ ] `tests/unit/roadmapGenerator.test.js`

### Phase 9 — 개인별 미니 모의고사

- [ ] `migrations/009_create_exam_tables.sql` — mini_exams, mini_exam_questions, mini_exam_submissions
- [ ] `src/prompts/exam/system.txt` — 미니 모의고사 생성 시스템 프롬프트
- [ ] `src/ai/examGenerator.js` — 취약 유형 집중 편성 (70%+), 15문항, 수능 형식 적용
- [ ] `src/services/exam.service.js` — 모의고사 생성, 풀이 처리, 유형별 분석 리포트 생성
- [ ] `src/controllers/exam.controller.js`
- [ ] `src/routes/exam.routes.js` — POST /exams/generate, POST /exams/:id/submit, GET /exams/:id/report

### Phase 10 — 운영자 대시보드 및 포인트/뱃지/리포트

- [ ] `migrations/010_create_engagement_tables.sql` — attendances, points, point_transactions, badge_definitions, user_badges, achievement_reports
- [ ] `seeds/003_badge_definitions.sql` — 뱃지 7종 시드 (하단 시드 데이터 섹션 참조)
- [ ] `seeds/004_demo_data.sql` — 데모용 학원/교강사/수강생 시드 (정상수능학원)
- [ ] `src/services/attendance.service.js` — 출결 등록, 미출석 자동 식별
- [ ] `src/services/point.service.js` — 포인트 적립/차감, 교환 처리
- [ ] `src/services/report.service.js` — 성취 리포트 자동 생성, 문자 발송
- [ ] `src/services/dashboard.service.js` — 이탈 위험도 산출, 강의별 이해도 집계
- [ ] `src/jobs/atRiskDetection.job.js` — 매일 09:00 이탈 위험 수강생 감지 크론
- [ ] `src/routes/attendance.routes.js` — POST /attendance, GET /attendance/:lectureId
- [ ] `src/routes/point.routes.js` — GET /points/me, POST /points/redeem
- [ ] `src/routes/report.routes.js` — POST /reports/generate, POST /reports/:id/send
- [ ] `src/routes/dashboard.routes.js` — GET /dashboard/churn-risk, GET /dashboard/lecture-stats
- [ ] `tests/integration/dashboard.test.js`

---

## 5. AI 파이프라인 구현 순서

### Pipeline 1 — STT + 임베딩 (강의 업로드 시)

```
1. multer → 음성 파일 수신 (최대 100MB)
2. whisper.js → OpenAI Whisper API 호출 → transcript 텍스트 반환
3. textChunker.js → 500토큰 단위 청킹, 50토큰 오버랩 적용
4. embedding.js → 청크별 text-embedding-3-small 임베딩 (배치 처리)
5. vector.repository.js → lecture_chunks 테이블에 청크 + 벡터 저장
6. typeMapper.js → transcript를 GPT-4로 분석, 수능 유형 태그 반환
7. lectures 테이블 type_tags 컬럼 업데이트
8. questionGenerator.js → 백그라운드 비동기 실행 (문제 생성)
9. questions 테이블에 pending 상태로 저장
10. 교강사에게 문제 생성 완료 SSE 이벤트 Push
```

### Pipeline 2 — RAG Q&A (수강생 질문 시)

```
1. 수강생 질문 텍스트 수신
2. embedding.js → 질문 임베딩 변환
3. vector.repository.js → pgvector 코사인 유사도 검색
   - WHERE lecture_id IN (수강생이 속한 교강사 강의 목록)
   - ORDER BY 유사도 DESC LIMIT 5
4. 상위 5개 청크 추출 (context window 구성)
5. ragQA.js → GPT-4 스트리밍 호출 (SSE 응답)
6. 강의 범위 외 질문 감지 → 에스컬레이션 플래그 설정
7. qa_messages 테이블에 질문/응답 저장
8. 에스컬레이션 시 교강사 알림 트리거
```

### Pipeline 3 — 수능 유형 매핑 (강의 업로드 시)

```
1. transcript 텍스트 입력
2. suneung_types.json 로드 (해당 과목의 유형 목록)
3. typeMapper.js → GPT-4 호출
   - 시스템 프롬프트: 수능 유형 분류 체계 주입
   - 유저 프롬프트: "이 강의 내용에서 해당되는 수능 유형을 JSON 배열로 반환하라"
4. 반환된 유형 코드 배열 파싱 및 유효성 검증
5. lectures.type_tags 컬럼 업데이트
6. questions 테이블 생성 시 type_code 메타데이터 포함 저장
```

### Pipeline 4 — 로드맵 생성 (주간 크론 + 수동 요청)

```
1. 학생 ID 기준 student_type_stats 조회 (수능 유형별 정답률)
2. 향후 수업 일정 조회 (lectureSchedules)
3. 수능 D-day 계산 (현재 날짜 → 수능일)
4. roadmapGenerator.js → GPT-4 호출
   - 취약 유형 우선순위: 정답률 낮은 순 + 수능 출제 빈도 가중치
   - 남은 일수 대비 커버 가능한 유형 수 계산
   - 수업 일정 연계 학습 순서 배치
5. learning_roadmaps + roadmap_items 테이블 upsert
6. 수강생 대시보드에 로드맵 노출
```

### Pipeline 5 — 미니 모의고사 생성 (수강생 요청 시)

```
1. 학생 취약 수능 유형 상위 5개 조회
2. suneung_types.json에서 유형별 출제 패턴 참조
3. examGenerator.js → GPT-4 호출
   - 취약 유형 70% + 기타 30% 비율 편성
   - 총 15문항, 시간 제한 20분, 난이도 배분 A:B:C = 6:6:3
4. mini_exams + mini_exam_questions 테이블 저장
5. 수강생 풀이 완료 후 결과 수집
6. 유형별 분석 리포트 자동 생성 → mini_exam_submissions 저장
```

---

## 6. API 엔드포인트 전체 목록

| Method | Path | 역할 | 설명 |
|--------|------|------|------|
| POST | /auth/signup | 공개 | 회원가입 (role: teacher/student/operator) |
| POST | /auth/login | 공개 | 로그인 → access/refresh 토큰 반환 |
| POST | /auth/refresh | 공개 | access 토큰 갱신 |
| POST | /auth/logout | 인증 | 로그아웃 (refresh 토큰 폐기) |
| POST | /academies | operator | 학원 생성 → 학원 코드 발급 |
| GET | /academies/:id | 인증 | 학원 정보 조회 |
| POST | /academies/join | 인증 | 학원 코드로 가입 |
| GET | /academies/:id/members | operator/teacher | 멤버 목록 |
| POST | /lectures | teacher | 강의 업로드 (multipart: 음성 + 메타데이터) |
| GET | /lectures | teacher | 내 강의 목록 |
| GET | /lectures/:id | 인증 | 강의 상세 + 처리 상태 |
| GET | /lectures/:id/status | teacher | SSE: 처리 진행 상태 스트리밍 |
| GET | /materials | student | 수강 가능한 강의자료 목록 |
| GET | /questions/pending | teacher | 검증 대기 문제 목록 |
| PATCH | /questions/:id/review | teacher | 문제 승인/수정/반려 |
| GET | /questions/student | student | 풀 수 있는 문제 목록 (과목/난이도 필터) |
| POST | /questions/:id/submit | student | 답안 제출 → 포인트 지급 |
| GET | /students/me/type-stats | student | 수능 유형별 정답률 통계 |
| POST | /qa/ask | student | SSE: RAG Q&A 스트리밍 질문 |
| GET | /qa/sessions | student | 내 Q&A 세션 목록 |
| GET | /qa/sessions/:id/messages | student | 세션 메시지 이력 |
| GET | /qa/escalations | teacher | 에스컬레이션 질문 목록 |
| POST | /qa/escalations/:id/reply | teacher | 에스컬레이션 답변 |
| GET | /roadmap/me | student | 내 학습 로드맵 조회 |
| POST | /roadmap/regenerate | student | 로드맵 수동 재생성 |
| POST | /exams/generate | student | 미니 모의고사 생성 (15문항) |
| POST | /exams/:id/submit | student | 모의고사 답안 제출 |
| GET | /exams/:id/report | student | 모의고사 결과 리포트 |
| POST | /attendance | teacher | 출결 등록 |
| GET | /attendance/:lectureId | teacher | 강의별 출결 현황 |
| GET | /points/me | student | 포인트 내역 |
| POST | /points/redeem | student | 포인트 → 쿠폰 교환 |
| GET | /badges/me | student | 내 뱃지 목록 |
| GET | /dashboard/churn-risk | operator | 이탈 위험 수강생 대시보드 |
| GET | /dashboard/lecture-stats | operator | 강의별 이해도 통계 |
| POST | /reports/generate | operator | 수강생 성취 리포트 생성 |
| POST | /reports/:id/send | operator | 학부모 문자 발송 (솔라피) |
| GET | /health | 공개 | 서버 상태 확인 |

---

## 7. 데모 시드 데이터 명세

```sql
-- seeds/004_demo_data.sql

-- 운영자 (학원장)
INSERT INTO users (email, password_hash, name, role, phone) VALUES
  ('operator@demo.claiq.kr', '$2b$10$...', '정민석', 'operator', '010-1234-5678');

-- 교강사
INSERT INTO users (email, password_hash, name, role, phone) VALUES
  ('teacher1@demo.claiq.kr', '$2b$10$...', '이준혁', 'teacher', '010-2345-6789'),  -- 수학 담당
  ('teacher2@demo.claiq.kr', '$2b$10$...', '박서연', 'teacher', '010-3456-7890');  -- 국어 담당

-- 수강생
INSERT INTO users (email, password_hash, name, role, phone) VALUES
  ('s1@demo.claiq.kr', '$2b$10$...', '김민준', 'student', '010-4567-8901'),
  ('s2@demo.claiq.kr', '$2b$10$...', '최서아', 'student', '010-5678-9012'),
  ('s3@demo.claiq.kr', '$2b$10$...', '박지호', 'student', '010-6789-0123'),
  ('s4@demo.claiq.kr', '$2b$10$...', '이하은', 'student', '010-7890-1234'),
  ('s5@demo.claiq.kr', '$2b$10$...', '정우성', 'student', '010-8901-2345');

-- 학원 (수능일: 2026년 11월 19일)
INSERT INTO academies (name, code, owner_id, suneung_date) VALUES
  ('정상수능학원', 'STAR01', [operator_id], '2026-11-19');
```

---

## 8. 위험 요소 및 완화 방안

| 위험 요소 | 심각도 | 완화 방안 |
|-----------|--------|-----------|
| OpenAI API 레이트 리밋 초과 | 높음 | 요청 큐(node-cron + DB 상태관리) 구현, 지수 백오프 재시도, 배치 처리 |
| Whisper 음성 인식 오류 (한국어 사투리/배경 소음) | 중간 | 교강사 transcript 수동 수정 UI 제공, 품질 점수 계산 후 낮으면 재처리 알림 |
| 문제 생성 품질 저하 (GPT-4 hallucination) | 높음 | Human-in-the-Loop 검증 필수화, 생성에 사용된 청크/프롬프트를 DB에 함께 저장하여 추적 |
| pgvector 검색 성능 저하 (대규모) | 중간 | IVFFlat 인덱스 사용, lists 파라미터 튜닝, 네임스페이스(teacher_id) 필터로 검색 범위 축소 |
| 음성 파일 업로드 용량 초과 / 타임아웃 | 중간 | multer limits 설정, STT를 비동기 백그라운드 작업으로 처리, SSE로 진행 상태 실시간 전달 |
| 포인트 중복 지급 / 레이스 컨디션 | 중간 | 포인트 지급 전 idempotency key 검증, DB 트랜잭션으로 원자성 보장 |
| 학원 코드 충돌 | 낮음 | 생성 시 DB 중복 조회 후 재생성, UUID 기반 내부 식별자 병행 사용 |
| 크론 잡 미실행 (서버 재시작 등) | 중간 | 크론 실행 이력 DB 기록, 실패 시 알림, 재실행 가능한 멱등 설계 |

---

## 7. 성공 기준

### 기능적 성공 기준

- [ ] 음성 파일 업로드 후 10분 이내 문제 생성 완료 (20문항 기준)
- [ ] RAG Q&A 응답 시간 3초 이내 (첫 토큰 기준)
- [ ] 문제 생성 승인 화면에서 승인/수정/반려 모두 정상 동작
- [ ] 수능 유형 매핑 결과 과목별 유형 코드 정확도 90% 이상 (수동 검증 기준)
- [ ] 로드맵 주간 자동 갱신 크론 정상 실행
- [ ] 포인트 적립/차감 트랜잭션 오류 0건
- [ ] 이탈 위험 대시보드 데이터 지연 24시간 이내

### 비기능적 성공 기준

- [ ] API 응답 시간 P95 500ms 이하 (AI 호출 제외)
- [ ] 테스트 커버리지 핵심 서비스 80% 이상
- [ ] 환경변수 없이 서버 시작 시 명확한 에러 메시지 출력
- [ ] 모든 에러 응답이 `{ success: false, error: string }` 형식 준수
- [ ] 역할 미검증 API 접근 시 403 응답 100% 보장
