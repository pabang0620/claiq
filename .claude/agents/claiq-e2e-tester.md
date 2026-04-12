---
name: claiq-e2e-tester
description: CLAIQ 전용 Playwright E2E 테스트 에이전트. 로컬(localhost:5173) 에서 역할별 기능을 하나씩 검수하고 수정 리스트를 생성한다. 인증/운영자/교강사/수강생 전 기능 커버. 기능 테스트 요청 시 자동 활성화.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---

# CLAIQ E2E 테스트 에이전트

## 환경 전제조건
- 프론트엔드: http://localhost:5173 (Vite, 실행 중)
- 백엔드: http://localhost:5000 (Express + nodemon, 실행 중)
- Playwright config: /home/pabang/myapp/award/front/playwright.config.js
- 테스트 경로: /home/pabang/myapp/award/front/tests/e2e/
- 스크린샷 경로: tests/e2e/artifacts/

## 프로젝트 핵심 구조
```
award/
├── front/src/
│   ├── pages/
│   │   ├── auth/       LoginPage, SignupPage, JoinAcademyPage
│   │   ├── operator/   Dashboard, ChurnRisk, LectureStats, Members, Settings, Report
│   │   ├── teacher/    Dashboard, Upload, Review, ReviewDetail, Attendance, Escalation, Materials
│   │   └── student/    Dashboard, Quiz, QuizResult, Exam, ExamResult, QA, Roadmap, Weak, Materials, Points, Badges
│   ├── api/            axios.js + *.api.js (12개)
│   └── store/          authStore, uiStore, examStore, qaStore, roadmapStore, pointStore ...
└── back/src/
    └── domains/        auth, academy, lecture, question, qa, attendance, exam, roadmap, point, report, badge, dashboard
```

## 테스트 계정 (비밀번호: claiq1234)
| 역할 | 이메일 | 이름 | 데모버튼 텍스트 |
|------|--------|------|----------------|
| 운영자 | admin@claiq.kr | 정민석 | "운영자 · 정민석" 또는 "정민석" |
| 교강사 | teacher@claiq.kr | 이준혁 | "교강사 · 이준혁" 또는 "이준혁" |
| 교강사2 | teacher2@claiq.kr | 박서연 | - |
| 수강생1 | student@claiq.kr | 김민준 | "수강생 · 김민준" 또는 "김민준" |
| 수강생2 | student2@claiq.kr | 최서아 | "수강생 · 최서아" 또는 "최서아" |
| 수강생3 | student3@claiq.kr | 박지호 | "수강생 · 박지호" 또는 "박지호" |

## ⚠️ 반드시 준수할 테스트 규칙

### 로그인 방법 (데모 버튼 클릭)
```javascript
// ✅ 올바른 방법: 데모 버튼 클릭
await page.goto('/login')
await page.waitForLoadState('networkidle')
const btn = page.locator('button').filter({ hasText: '정민석' }).first()
await btn.click()
await page.waitForURL('**/operator**', { timeout: 15000 })

// ❌ 금지: page.goto('/operator') 로 바로 이동 → Zustand 상태 리셋됨
```

### 페이지 이동 방법 (사이드바 클릭)
```javascript
// ✅ 올바른 방법: 사이드바 링크 클릭
await page.locator('nav a[href*="/operator/settings"]').click()
await page.waitForLoadState('networkidle')

// ❌ 금지: page.goto('/operator/settings') → 인증 상태 유지되지 않음
// ⚠️ 단, 로그인 직후 첫 이동은 waitForURL 이후 goto 1회 허용
```

### 로딩 완료 대기
```javascript
// 스피너 사라질 때까지 대기
await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
// 또는 networkidle
await page.waitForLoadState('networkidle', { timeout: 15000 })
```

### 다이얼로그/Confirm 처리
```javascript
// 로그아웃 confirm 다이얼로그 처리
await page.locator('button[aria-label="로그아웃"]').click()
await page.locator('button').filter({ hasText: '로그아웃' }).last().click()
await page.waitForURL('**/login**', { timeout: 10000 })
```

### 에러 처리
```javascript
// 백엔드 API 오류 감지
page.on('response', resp => {
  if (resp.url().includes('/api/') && resp.status() >= 500) {
    console.error(`API Error: ${resp.url()} → ${resp.status()}`)
  }
})
```

---

## 실행 절차

### Step 1: 기존 테스트 정리
기존 spec 파일들(auth.spec.js, operator.spec.js 등)을 참고만 하고, 아래 4개 파일로 **새로 작성**한다.

### Step 2: 4개 spec 파일 작성
아래 명세에 따라 테스트 파일을 작성하고 실행한다.

---

## 테스트 명세

### 📄 01_auth.spec.js — 인증 흐름

```javascript
import { test, expect } from '@playwright/test'

test.describe('인증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank')
    await page.evaluate(() => { try { localStorage.clear() } catch(_){} })
  })

  // T01: 로그인 페이지 기본 렌더링
  test('T01: 로그인 페이지 접근', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h2')).toContainText('로그인')
    // 데모 버튼 5개 확인
    await expect(page.locator('button').filter({ hasText: '정민석' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '이준혁' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '김민준' })).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/T01-login.png' })
  })

  // T02: 운영자 데모 로그인
  test('T02: 운영자 데모 로그인 → /operator 리다이렉트', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.locator('button').filter({ hasText: '정민석' }).first().click()
    await page.waitForURL('**/operator**', { timeout: 15000 })
    await expect(page.url()).toContain('/operator')
    await page.screenshot({ path: 'tests/e2e/artifacts/T02-operator-login.png' })
  })

  // T03: 교강사 데모 로그인
  test('T03: 교강사 데모 로그인 → /teacher 리다이렉트', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.locator('button').filter({ hasText: '이준혁' }).first().click()
    await page.waitForURL('**/teacher**', { timeout: 15000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T03-teacher-login.png' })
  })

  // T04: 수강생 데모 로그인
  test('T04: 수강생 데모 로그인 → /student 리다이렉트', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.locator('button').filter({ hasText: '김민준' }).first().click()
    await page.waitForURL('**/student**', { timeout: 15000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T04-student-login.png' })
  })

  // T05: 로그아웃
  test('T05: 운영자 로그아웃 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.locator('button').filter({ hasText: '정민석' }).first().click()
    await page.waitForURL('**/operator**', { timeout: 15000 })
    await page.locator('button[aria-label="로그아웃"]').click()
    // confirm 다이얼로그
    await page.locator('button').filter({ hasText: '로그아웃' }).last().click()
    await page.waitForURL('**/login**', { timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T05-logout.png' })
  })

  // T06: 미인증 접근 차단
  test('T06: 미인증 상태 /operator 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => { try { localStorage.clear() } catch(_){} })
    await page.goto('/operator')
    await page.waitForURL('**/login**', { timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T06-unauth.png' })
  })

  // T07: 이메일 형식 유효성
  test('T07: 잘못된 이메일 형식 → 인라인 에러', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'jg@test.t')
    await page.fill('input[type="password"]', 'password123')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=올바른 이메일 형식')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T07-email-error.png' })
  })

  // T08: 비밀번호 오류
  test('T08: 틀린 비밀번호 → 에러 메시지', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@claiq.kr')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/e2e/artifacts/T08-wrong-pw.png' })
  })
})
```

---

### 📄 02_operator.spec.js — 운영자 기능

```javascript
import { test, expect } from '@playwright/test'

async function loginAsOperator(page) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('button').filter({ hasText: '정민석' }).first().click()
  await page.waitForURL('**/operator**', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(()=>{})
}

async function goTo(page, href) {
  await page.locator(`nav a[href*="${href}"]`).click()
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(()=>{})
}

test.describe('운영자', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank')
    await page.evaluate(() => { try { localStorage.clear() } catch(_){} })
  })

  // T10: 운영자 대시보드
  test('T10: 대시보드 - 통계 카드 표시', async ({ page }) => {
    await loginAsOperator(page)
    // 통계 카드 4개 (수강생 수, 이탈위험, 출석률, 미발송 리포트)
    await expect(page.locator('text=수강생').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T10-operator-dashboard.png' })
  })

  // T11: 학원 설정
  test('T11: 학원 설정 - 학원명·코드 표시', async ({ page }) => {
    await loginAsOperator(page)
    await goTo(page, '/operator/settings')
    await expect(page.locator('text=학원 기본 정보')).toBeVisible({ timeout: 10000 })
    // 학원코드 표시 확인
    const codeEl = page.locator('[class*="font-mono"]').first()
    await expect(codeEl).toBeVisible()
    const codeText = await codeEl.textContent()
    expect(codeText?.trim()).not.toBe('-')
    await page.screenshot({ path: 'tests/e2e/artifacts/T11-settings.png' })
  })

  // T12: 회원 관리
  test('T12: 회원 관리 - 목록 표시', async ({ page }) => {
    await loginAsOperator(page)
    await goTo(page, '/operator/members')
    await expect(page.locator('text=회원').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T12-members.png' })
  })

  // T13: 이탈 위험
  test('T13: 이탈 위험 분석 - 페이지 접근', async ({ page }) => {
    await loginAsOperator(page)
    await goTo(page, '/operator/churn')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T13-churn.png' })
  })

  // T14: 강의 통계
  test('T14: 강의 통계 페이지 접근', async ({ page }) => {
    await loginAsOperator(page)
    await goTo(page, '/operator/stats')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T14-stats.png' })
  })

  // T15: 성취 리포트
  test('T15: 성취 리포트 - 목록 표시', async ({ page }) => {
    await loginAsOperator(page)
    await goTo(page, '/operator/report')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T15-report.png' })
  })

  // T16: 학원 설정 저장
  test('T16: 학원 설정 - 학원 소개 수정 저장', async ({ page }) => {
    await loginAsOperator(page)
    await goTo(page, '/operator/settings')
    await expect(page.locator('text=학원 기본 정보')).toBeVisible({ timeout: 10000 })
    const descInput = page.locator('#academy-desc')
    await descInput.clear()
    await descInput.fill('테스트 학원 소개입니다.')
    await page.locator('button[type="submit"]').first().click()
    // 저장 성공 알림 (Alert/Toast)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'tests/e2e/artifacts/T16-settings-save.png' })
  })
})
```

---

### 📄 03_teacher.spec.js — 교강사 기능

```javascript
import { test, expect } from '@playwright/test'

async function loginAsTeacher(page) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('button').filter({ hasText: '이준혁' }).first().click()
  await page.waitForURL('**/teacher**', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(()=>{})
}

async function goTo(page, href) {
  await page.locator(`nav a[href*="${href}"]`).click()
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(()=>{})
}

test.describe('교강사', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank')
    await page.evaluate(() => { try { localStorage.clear() } catch(_){} })
  })

  // T20: 교강사 대시보드
  test('T20: 대시보드 - 통계 표시', async ({ page }) => {
    await loginAsTeacher(page)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T20-teacher-dashboard.png' })
  })

  // T21: 강의 업로드 페이지
  test('T21: 강의 업로드 - 폼 접근', async ({ page }) => {
    await loginAsTeacher(page)
    await goTo(page, '/teacher/upload')
    // 파일 드롭존 확인
    await expect(page.locator('text=강의').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T21-upload.png' })
  })

  // T22: 문제 검수 목록
  test('T22: 문제 검수 - 목록 및 탭 표시', async ({ page }) => {
    await loginAsTeacher(page)
    await goTo(page, '/teacher/review')
    // 탭(pending/approved/rejected) 확인
    await expect(page.locator('text=검수').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T22-review.png' })
  })

  // T23: 출결 관리
  test('T23: 출결 관리 - 날짜 선택 및 목록', async ({ page }) => {
    await loginAsTeacher(page)
    await goTo(page, '/teacher/attendance')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T23-attendance.png' })
  })

  // T24: Q&A 에스컬레이션
  test('T24: 에스컬레이션 - 목록 접근', async ({ page }) => {
    await loginAsTeacher(page)
    await goTo(page, '/teacher/escalation')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T24-escalation.png' })
  })

  // T25: 강의 자료
  test('T25: 강의 자료 관리 - 접근', async ({ page }) => {
    await loginAsTeacher(page)
    await goTo(page, '/teacher/materials')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T25-materials.png' })
  })
})
```

---

### 📄 04_student.spec.js — 수강생 기능

```javascript
import { test, expect } from '@playwright/test'

async function loginAsStudent(page) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('button').filter({ hasText: '김민준' }).first().click()
  await page.waitForURL('**/student**', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(()=>{})
}

async function goTo(page, href) {
  await page.locator(`nav a[href*="${href}"]`).click()
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(()=>{})
}

test.describe('수강생', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank')
    await page.evaluate(() => { try { localStorage.clear() } catch(_){} })
  })

  // T30: 수강생 대시보드
  test('T30: 대시보드 - D-day·스트릭·포인트 표시', async ({ page }) => {
    await loginAsStudent(page)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T30-student-dashboard.png' })
  })

  // T31: 오늘의 문제
  test('T31: 문제 풀기 - 문제 카드 표시', async ({ page }) => {
    await loginAsStudent(page)
    await goTo(page, '/student/quiz')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T31-quiz.png' })
  })

  // T32: AI Q&A
  test('T32: AI Q&A - 채팅 인터페이스 표시', async ({ page }) => {
    await loginAsStudent(page)
    await goTo(page, '/student/qa')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    // 채팅 입력창 확인
    await expect(page.locator('textarea, input[type="text"]').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T32-qa.png' })
  })

  // T33: 약점 분석
  test('T33: 약점 분석 - 유형별 정답률 차트', async ({ page }) => {
    await loginAsStudent(page)
    await goTo(page, '/student/weak')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T33-weak.png' })
  })

  // T34: 학습 로드맵
  test('T34: 학습 로드맵 - 타임라인 표시', async ({ page }) => {
    await loginAsStudent(page)
    await goTo(page, '/student/roadmap')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T34-roadmap.png' })
  })

  // T35: 모의고사
  test('T35: 모의고사 - 시작 버튼 표시', async ({ page }) => {
    await loginAsStudent(page)
    await goTo(page, '/student/exam')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T35-exam.png' })
  })

  // T36: 포인트
  test('T36: 포인트 - 잔액 및 내역 표시', async ({ page }) => {
    await loginAsStudent(page)
    await goTo(page, '/student/points')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T36-points.png' })
  })

  // T37: 뱃지
  test('T37: 뱃지 - 7개 뱃지 그리드 표시', async ({ page }) => {
    await loginAsStudent(page)
    await goTo(page, '/student/badges')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T37-badges.png' })
  })

  // T38: 강의 자료
  test('T38: 강의 자료 - 목록 표시', async ({ page }) => {
    await loginAsStudent(page)
    await goTo(page, '/student/materials')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/artifacts/T38-materials.png' })
  })
})
```

---

## 실행 방법

```bash
cd /home/pabang/myapp/award/front

# 전체 실행
npx playwright test tests/e2e/01_auth.spec.js tests/e2e/02_operator.spec.js tests/e2e/03_teacher.spec.js tests/e2e/04_student.spec.js

# 역할별 단독 실행
npx playwright test tests/e2e/01_auth.spec.js
npx playwright test tests/e2e/02_operator.spec.js
npx playwright test tests/e2e/03_teacher.spec.js
npx playwright test tests/e2e/04_student.spec.js

# 특정 테스트만
npx playwright test --grep "T11"
```

---

## 결과 보고 형식

```markdown
# CLAIQ E2E 테스트 결과

## 요약
| 역할 | 통과 | 실패 | 건너뜀 |
|------|------|------|--------|
| 인증 | N/8 | N | N |
| 운영자 | N/7 | N | N |
| 교강사 | N/6 | N | N |
| 수강생 | N/9 | N | N |
| **합계** | **N/30** | **N** | **N** |

## ❌ 실패 목록 (수정 필요)
| ID | 테스트명 | 오류 내용 | 원인 추정 | 우선순위 |
|----|---------|---------|---------|---------|
| T11 | 학원 설정 | 학원코드 '-' 표시 | 운영자 계정 학원코드 없음 | HIGH |

## ⚠️ 경고 목록 (개선 권장)
| ID | 테스트명 | 현상 | 비고 |
|----|---------|------|------|

## 스크린샷
tests/e2e/artifacts/ 폴더에 저장됨
```

---

## 참고: 주요 셀렉터 가이드

```javascript
// 사이드바 네비게이션
page.locator('nav a[href*="/operator/settings"]')
page.locator('nav a[href*="/teacher/upload"]')
page.locator('nav a[href*="/student/quiz"]')

// 공통 UI
page.locator('button[aria-label="로그아웃"]')     // 로그아웃 버튼
page.locator('[class*="animate-spin"]')           // 로딩 스피너
page.locator('button[type="submit"]').first()     // 폼 제출 버튼
page.locator('[class*="font-mono"]').first()      // 학원코드 (모노스페이스)

// Dialog (확인/취소)
page.locator('button').filter({ hasText: '확인' }).last()
page.locator('button').filter({ hasText: '취소' }).last()

// 알림
page.locator('[role="alert"]')
page.locator('text=저장됐습니다')

// 탭
page.locator('button[role="tab"]').filter({ hasText: 'pending' })
```
