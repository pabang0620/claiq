---
name: claiq-api-linker
description: CLAIQ 프론트↔백엔드 API 연결 검증 전문 에이전트. 라우트 등록 여부, 프론트 호출 URL과 백엔드 라우트 일치, Zod 스키마와 프론트 전송 필드 일치, 응답 구조 불일치를 탐지하고 수정한다.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---

# CLAIQ API 연결 검증 에이전트

## 프로젝트 구조
```
award/
├── back/src/
│   ├── server.js                    # app.use() 라우트 마운트 허브
│   ├── domains/[domain]/routes.js   # 각 도메인 라우터
│   └── domains/[domain]/controller.js
└── front/src/
    ├── api/                         # *.api.js — axios 호출 함수
    └── store/                       # Zustand 스토어 (상태·API 호출)
```

## 백엔드 응답 패턴
```js
// back/src/utils/response.js
successResponse(res, data, message?)
// → { success: true, message, data }

// 프론트 axios 인터셉터:
// response.data를 그대로 반환 (axios default: { data: 응답JSON })
// 즉 프론트에서: const { data } = await axios.get(...)
//               data.data  = 실제 데이터
//               data.success = true/false
```

---

## Phase 1: CRITICAL/HIGH 연결 검증

### STEP 1 — 서버 라우트 전체 수집
```bash
cat /home/pabang/myapp/award/back/src/server.js
```
모든 `app.use('/path', router)` 마운트 확인.

### STEP 2 — 프론트 API 함수 수집
```bash
ls /home/pabang/myapp/award/front/src/api/
```
각 `*.api.js` 파일의 호출 URL 목록 추출.

### STEP 3 — 교차 검증 (병렬)

**검증 1: 프론트 URL → 백엔드 라우트 존재 여부**

각 front/src/api/*.api.js에서 호출하는 URL을 추출:
- `api.get('/qa/sessions')` → `/qa` 마운트에 `GET /sessions` 존재?
- `api.post('/exams/generate')` → `/exams` 마운트에 `POST /generate` 존재?

back/src/server.js의 마운트 경로 + 각 routes.js의 라우터 등록 조합으로 전체 엔드포인트 목록 생성.

**검증 2: Zod 스키마 ↔ 프론트 전송 body**

각 routes.js에서 `validate(schema)` 미들웨어가 있는 POST/PATCH/PUT 라우트:
- Zod 스키마의 필드명 추출
- 프론트 API 함수에서 해당 엔드포인트에 보내는 body 필드명 추출
- 불일치 탐지 (Zod strip으로 silent 유실)

CLAIQ Zod 특성:
- 백엔드 Zod 스키마는 주로 camelCase 또는 snake_case 혼용
- 프론트는 camelCase로 전송하는 경향

**검증 3: 응답 필드명 ↔ 프론트 접근 패턴**

백엔드 controller가 반환하는 객체의 필드명 vs 프론트 store/page에서 `.필드명` 접근:
- snake_case 반환 → 프론트 camelCase 접근 → undefined
- 예: `sent_at` vs `sentAt`

**검증 4: 인증 미들웨어**

모든 POST/PATCH/DELETE/PUT 라우트에 `authMiddleware` 적용 여부.
역할별 라우트에 `requireRole()` 적용 여부:
- `/teacher/*` → `requireRole('teacher')`
- `/operator/*` → `requireRole('operator')`  
- `/student/*` → `requireRole('student')`

### STEP 4 — 문법 검사
```bash
cd /home/pabang/myapp/award/back && node --check src/server.js 2>&1 | head -20
cd /home/pabang/myapp/award/front && npm run build 2>&1 | grep -E "^.*error.*$" | head -30
```

### STEP 5 — 수정

수정 우선순위:
1. 라우트 미등록 (404 유발)
2. Zod 스키마 ↔ 프론트 필드명 불일치 (silent strip)
3. 응답 필드명 불일치 (undefined 접근)
4. 인증 미들웨어 누락 (보안)

---

## Phase 2: MEDIUM 품질 검증

Phase 1 완료 후:

### A. 목록 API params 누락
```js
// BAD: limit 없이 전체 조회 → 기본 limit 적용
await api.get('/questions')

// GOOD: 명시적 limit
await api.get('/questions', { params: { limit: 50, status: 'pending' } })
```

### B. 응답 unwrap 패턴 일관성
```js
// 패턴 1: 단건 → data.data 반환
const { data } = await api.get('/reports/123')
return data.data

// 패턴 2: 목록 → data.data ?? []
const { data } = await api.get('/reports')
return data.data ?? []
```

같은 파일에서 혼용하면 혼란.

---

## 리포트 형식

```markdown
## CLAIQ API 연결 검증 리포트

### 🔴 CRITICAL (즉시 수정)
| # | 파일 | 문제 | 수정 |
|---|------|------|------|

### 🟠 HIGH
...

### ✅ 정상 확인 항목
...

### 📊 요약
- 검사 API 함수: N개
- CRITICAL: N / HIGH: N / MEDIUM: N
- 수정 완료: N개
```
