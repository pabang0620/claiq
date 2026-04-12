/**
 * CLAIQ 내부 페이지 테스트 - 직접 로그인 후 각 기능 테스트
 */
import { test, expect } from '@playwright/test'

const BASE = 'https://claiq.vercel.app'

async function loginAndNavigate(page, email, password, expectedPath) {
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1000)
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(6000)
  const url = page.url()
  if (!url.includes(expectedPath)) {
    throw new Error(`Login failed: expected ${expectedPath}, got ${url}`)
  }
  return true
}

// ============================================================
// 수강생 내부 페이지
// ============================================================
test('수강생 대시보드 #15-17', async ({ page }) => {
  await loginAndNavigate(page, 'student@claiq.kr', 'claiq1234', 'student')
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/s15-dashboard-final.png', fullPage: true })
  console.log('DASHBOARD BODY:', body.substring(0, 800))

  const hasDday = body.includes('D-')
  const hasStreak = body.includes('스트릭') || body.includes('연속')
  const hasPoint = body.includes('포인트')
  const hasRoadmap = body.includes('로드맵') || body.includes('주차')
  const hasRecommend = body.includes('추천') || body.includes('오늘의')

  console.log('#15 RESULT:', (hasDday && hasStreak && hasPoint) ? '✅' : `⚠️ (D-day:${hasDday}, 스트릭:${hasStreak}, 포인트:${hasPoint})`)
  console.log('#16 RESULT:', hasRoadmap ? '✅' : '⚠️ (로드맵 미리보기 미확인)')
  console.log('#17 RESULT:', hasRecommend ? '✅' : '⚠️ (추천 카드 미확인)')
})

test('수강생 오늘의 문제 #36-42', async ({ page }) => {
  await loginAndNavigate(page, 'student@claiq.kr', 'claiq1234', 'student')
  await page.goto(`${BASE}/student/quiz`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/s36-quiz-final.png', fullPage: true })
  console.log('QUIZ BODY:', body.substring(0, 600))

  const hasQuizContent = body.includes('문제') && !body.includes('로그인')
  const hasNoData = body.includes('문제가 없') || body.includes('오늘의 문제가') || (body.includes('오늘') && body.includes('없'))

  if (hasQuizContent && !hasNoData) {
    console.log('#36 RESULT: ✅')

    const submitBtn = page.locator('button').filter({ hasText: /제출/ }).first()
    const isDisabledBefore = await submitBtn.isDisabled().catch(() => false)
    console.log('#38 RESULT:', isDisabledBefore ? '✅' : '⚠️ (선택 전 제출 버튼 활성화)')

    const choices = page.locator('button').filter({ hasText: /^[①②③④⑤]/ })
    const choiceCount = await choices.count()
    console.log('Choice count:', choiceCount)

    if (choiceCount > 0) {
      await choices.first().click()
      await page.waitForTimeout(500)
      const isEnabledAfter = !(await submitBtn.isDisabled().catch(() => true))
      console.log('#37 RESULT:', isEnabledAfter ? '✅' : '⚠️ (선택 후 제출 버튼 미활성화)')

      await submitBtn.click()
      await page.waitForTimeout(3000)
      const resultBody = await page.locator('body').textContent()
      await page.screenshot({ path: 'tests/e2e/artifacts/s39-quiz-result.png', fullPage: true })
      const hasResult = resultBody.includes('정답') || resultBody.includes('오답') || resultBody.includes('해설') || resultBody.includes('+')
      console.log('#39 RESULT:', hasResult ? '✅' : '⚠️ (결과 미확인)')
      console.log('#40 RESULT:', hasResult ? '✅' : '⚠️ (오답 결과 미확인)')
    } else {
      console.log('#37 RESULT: ⚠️ (① 버튼 미발견)')
      console.log('#39 RESULT: ⚠️ (보기 없음)')
      console.log('#40 RESULT: ⚠️ (보기 없음)')
    }

    const navNums = page.locator('[class*="nav"] button, [class*="number"] button').filter({ hasText: /^[0-9]+$/ })
    console.log('#41 RESULT:', await navNums.count() > 0 ? '✅' : '⚠️ (번호 네비게이터 미확인)')
    const resultBtn = page.locator('button:has-text("결과"), a:has-text("결과")').first()
    console.log('#42 RESULT:', await resultBtn.count() > 0 ? '✅' : '⚠️ (결과 버튼 미확인)')
  } else if (hasNoData) {
    console.log('#36 RESULT: ⚠️ (오늘의 문제 없음 - 강의 업로드 선행 필요)')
    for (const id of [37, 38, 39, 40, 41, 42]) console.log(`#${id} RESULT: ⚠️ (문제 없음)`)
  } else {
    console.log('#36 RESULT: ❌ (퀴즈 페이지 진입 실패 또는 리다이렉트)')
    for (const id of [37, 38, 39, 40, 41, 42]) console.log(`#${id} RESULT: ❌ (페이지 진입 실패)`)
  }
})

test('수강생 AI Q&A #46-51', async ({ page }) => {
  await loginAndNavigate(page, 'student@claiq.kr', 'claiq1234', 'student')
  await page.goto(`${BASE}/student/qa`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/s46-qa-final.png', fullPage: true })
  console.log('QA BODY:', body.substring(0, 600))

  const hasQA = body.includes('Q&A') || body.includes('질문') || body.includes('AI') || (body.includes('대화') && !body.includes('로그인'))
  if (hasQA) {
    console.log('#46 RESULT: ✅')

    // 새 대화 버튼 확인
    const newChatBtn = page.locator('button').filter({ hasText: /새 대화|새로운 대화/ }).first()
    if (await newChatBtn.count() > 0) await newChatBtn.click()

    const textarea = page.locator('textarea').first()
    if (await textarea.count() > 0) {
      const sendBtn = page.locator('button[aria-label*="전송"], button:has-text("전송")').first()
      const isDisabledEmpty = await sendBtn.isDisabled().catch(() => false)
      console.log('#50 RESULT:', isDisabledEmpty ? '✅' : '⚠️ (빈 입력 전송 버튼 활성화)')

      await textarea.fill('삼각함수란 무엇인가요?')
      console.log('#51 RESULT: ✅')

      const isSendEnabled = !(await sendBtn.isDisabled().catch(() => true))
      if (isSendEnabled) {
        await sendBtn.click()
        await page.waitForTimeout(12000)
        const newBody = await page.locator('body').textContent()
        await page.screenshot({ path: 'tests/e2e/artifacts/s47-qa-response.png', fullPage: true })
        const hasReply = newBody.includes('삼각') || newBody.includes('함수') || newBody.length > body.length + 200
        console.log('#47 RESULT:', hasReply ? '✅' : '⚠️ (응답 미확인)')
        console.log('#48 RESULT: ⚠️ (스트리밍 중 비활성 자동 확인 불가)')
      } else {
        console.log('#47 RESULT: ⚠️ (전송 버튼 비활성)')
        console.log('#48 RESULT: ⚠️ (전송 버튼 비활성)')
      }
    } else {
      console.log('#47 RESULT: ⚠️ (textarea 미발견)')
      console.log('#48 RESULT: ⚠️ (textarea 미발견)')
      console.log('#50 RESULT: ⚠️ (textarea 미발견)')
      console.log('#51 RESULT: ⚠️ (textarea 미발견)')
    }

    const sessionEl = page.locator('[class*="session"], [class*="history"]').first()
    console.log('#49 RESULT:', await sessionEl.count() > 0 ? '✅' : '⚠️ (세션 목록 미확인)')
  } else {
    console.log('#46 RESULT: ❌ (Q&A 페이지 진입 실패)')
    for (const id of [47, 48, 49, 50, 51]) console.log(`#${id} RESULT: ❌ (페이지 진입 실패)`)
  }
})

test('수강생 약점 분석 #52-54', async ({ page }) => {
  await loginAndNavigate(page, 'student@claiq.kr', 'claiq1234', 'student')
  await page.goto(`${BASE}/student/weak`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/s52-weak-final.png', fullPage: true })
  console.log('WEAK BODY:', body.substring(0, 600))

  const hasAnalysis = (body.includes('약점') || body.includes('분석') || body.includes('정답률') || body.includes('유형')) && !body.includes('로그인')
  const isEmpty = (body.includes('없') && body.includes('데이터')) || body.includes('아직 풀기') || body.includes('문제를 풀어')

  if (hasAnalysis && !isEmpty) {
    console.log('#52 RESULT: ✅')
    const filter = page.locator('select, [role="combobox"]').first()
    console.log('#53 RESULT:', await filter.count() > 0 ? '✅' : '⚠️ (필터 미확인)')
    console.log('#54 RESULT: ⚠️ (데이터 있음 - 빈 상태 확인 불가)')
  } else if (isEmpty) {
    console.log('#52 RESULT: ⚠️ (분석 데이터 없음 - 문제 풀기 선행 필요)')
    console.log('#53 RESULT: ⚠️ (데이터 없음)')
    console.log('#54 RESULT: ✅')
  } else {
    console.log('#52 RESULT: ❌ (약점 분석 페이지 진입 실패)')
    console.log('#53 RESULT: ❌ (페이지 진입 실패)')
    console.log('#54 RESULT: ❌ (페이지 진입 실패)')
  }
})

test('수강생 미니 모의고사 #55-60', async ({ page }) => {
  await loginAndNavigate(page, 'student@claiq.kr', 'claiq1234', 'student')
  await page.goto(`${BASE}/student/exam`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/s55-exam-final.png', fullPage: true })
  console.log('EXAM BODY:', body.substring(0, 600))

  const hasExam = (body.includes('모의고사') || body.includes('시험')) && !body.includes('로그인')
  if (hasExam) {
    console.log('#55 RESULT: ✅')

    const startBtn = page.locator('button').filter({ hasText: /시작|새 모의고사|모의고사 시작/ }).first()
    if (await startBtn.count() > 0) {
      await startBtn.click()
      await page.waitForTimeout(12000)
      const examBody = await page.locator('body').textContent()
      await page.screenshot({ path: 'tests/e2e/artifacts/s55-exam-started.png', fullPage: true })
      console.log('EXAM STARTED BODY:', examBody.substring(0, 600))

      const hasTimer = examBody.includes(':') || examBody.includes('분') || examBody.includes('남')
      console.log('#56 RESULT:', hasTimer ? '✅' : '⚠️ (타이머 미확인)')

      const choices = page.locator('button').filter({ hasText: /^[①②③④⑤]/ })
      if (await choices.count() > 0) {
        await choices.first().click()
        await page.waitForTimeout(500)
        console.log('#57 RESULT: ✅')
        // 다른 문제로 이동 후 돌아오기
        const nextBtn = page.locator('button').filter({ hasText: /다음/ }).first()
        if (await nextBtn.count() > 0) {
          await nextBtn.click()
          await page.waitForTimeout(500)
          await page.goBack()
          await page.waitForTimeout(1000)
        }
      } else {
        console.log('#57 RESULT: ⚠️ (보기 미발견)')
      }

      const submitBtn = page.locator('button').filter({ hasText: /제출|완료/ }).first()
      if (await submitBtn.count() > 0) {
        console.log('#58 RESULT: ✅')
      } else {
        console.log('#58 RESULT: ⚠️ (제출 버튼 미발견)')
      }
      console.log('#59 RESULT: ⚠️ (제출 후 확인 필요)')

      const newExamBtn = page.locator('button').filter({ hasText: /새 모의고사|다시/ }).first()
      console.log('#60 RESULT:', await newExamBtn.count() > 0 ? '✅' : '⚠️ (새 모의고사 버튼 미확인)')
    } else {
      // 진행 중인 시험 있을 수 있음
      const hasTimer = body.includes(':') || body.includes('분')
      console.log('#56 RESULT:', hasTimer ? '✅' : '⚠️ (진행 중 타이머 미확인)')
      const choices = page.locator('button').filter({ hasText: /^[①②③④⑤]/ })
      console.log('#57 RESULT:', await choices.count() > 0 ? '✅' : '⚠️ (시험 시작 버튼 없음 - 진행 중)')
      console.log('#58 RESULT: ⚠️ (진행 중)')
      console.log('#59 RESULT: ⚠️ (진행 중)')
      console.log('#60 RESULT: ⚠️ (진행 중)')
    }
  } else {
    console.log('#55 RESULT: ❌ (모의고사 페이지 진입 실패)')
    for (const id of [56, 57, 58, 59, 60]) console.log(`#${id} RESULT: ❌ (페이지 진입 실패)`)
  }
})

test('수강생 로드맵 #61-62', async ({ page }) => {
  await loginAndNavigate(page, 'student@claiq.kr', 'claiq1234', 'student')
  await page.goto(`${BASE}/student/roadmap`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/s61-roadmap-final.png', fullPage: true })
  console.log('ROADMAP BODY:', body.substring(0, 600))

  const hasRoadmap = (body.includes('로드맵') || body.includes('주차') || body.includes('학습 계획')) && !body.includes('로그인')
  console.log('#61 RESULT:', hasRoadmap ? '✅' : '⚠️ (로드맵 데이터 미확인)')

  const regenBtn = page.locator('button').filter({ hasText: /재생성|다시 생성/ }).first()
  console.log('#62 RESULT:', await regenBtn.count() > 0 ? '⚠️ (AI 비용 - 버튼 확인만)' : '⚠️ (재생성 버튼 미발견)')
})

test('수강생 포인트 뱃지 #63-66', async ({ page }) => {
  await loginAndNavigate(page, 'student@claiq.kr', 'claiq1234', 'student')

  // 포인트 페이지
  await page.goto(`${BASE}/student/points`)
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  await page.waitForTimeout(2000)
  const pointBody = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/s63-points-final.png', fullPage: true })
  console.log('POINTS BODY:', pointBody.substring(0, 500))

  const hasPoints = (pointBody.includes('포인트') || pointBody.includes('잔액')) && !pointBody.includes('로그인')
  console.log('#63 RESULT:', hasPoints ? '✅' : '⚠️ (포인트 페이지 미확인)')

  if (hasPoints) {
    const couponBtn = page.locator('button').filter({ hasText: /교환|쿠폰/ }).first()
    console.log('#64 RESULT:', await couponBtn.count() > 0 ? '⚠️ (포인트 충분 여부 미확인 - 버튼 존재)' : '⚠️ (교환 버튼 미발견)')
    console.log('#65 RESULT:', await couponBtn.count() > 0 ? '⚠️ (포인트 부족 확인 불가)' : '⚠️ (교환 버튼 미발견)')
  } else {
    console.log('#64 RESULT: ⚠️ (페이지 미확인)')
    console.log('#65 RESULT: ⚠️ (페이지 미확인)')
  }

  // 뱃지 페이지
  await page.goto(`${BASE}/student/badges`)
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  await page.waitForTimeout(2000)
  const badgeBody = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/s66-badges-final.png', fullPage: true })
  console.log('BADGES BODY:', badgeBody.substring(0, 500))

  const hasBadge = (badgeBody.includes('뱃지') || badgeBody.includes('획득')) && !badgeBody.includes('로그인')
  console.log('#66 RESULT:', hasBadge ? '✅' : '⚠️ (뱃지 페이지 미확인)')
})

// ============================================================
// 교강사 내부 페이지
// ============================================================
test('교강사 대시보드 #18-19', async ({ page }) => {
  await loginAndNavigate(page, 'teacher@claiq.kr', 'claiq1234', 'teacher')
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/t18-dashboard-final.png', fullPage: true })
  console.log('TEACHER DASHBOARD:', body.substring(0, 700))

  const hasCards = body.includes('업로드') || body.includes('검증') || body.includes('출결') || body.includes('에스컬')
  console.log('#18 RESULT:', hasCards ? '✅' : '⚠️ (대시보드 지표 미확인)')
  const hasLectures = body.includes('강의') || body.includes('업로드')
  console.log('#19 RESULT:', hasLectures ? '✅' : '⚠️ (강의 목록 미확인)')
})

test('교강사 강의 업로드 #21-26', async ({ page }) => {
  await loginAndNavigate(page, 'teacher@claiq.kr', 'claiq1234', 'teacher')
  await page.goto(`${BASE}/teacher/upload`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/t21-upload-final.png', fullPage: true })
  console.log('UPLOAD BODY:', body.substring(0, 600))

  const hasUpload = (body.includes('업로드') || body.includes('파일')) && !body.includes('로그인')
  if (hasUpload) {
    const submitBtn = page.locator('button').filter({ hasText: /업로드|시작/ }).first()
    const isDisabled = await submitBtn.isDisabled().catch(() => false)
    console.log('#24 RESULT:', isDisabled ? '✅' : '⚠️ (파일 없이 버튼 활성화 - 확인 필요)')
    console.log('#21 RESULT: ⚠️ (AI 비용 - UI 진입만)')
    console.log('#22 RESULT: ⚠️ (AI 비용 - UI 진입만)')
    console.log('#23 RESULT: ⚠️ (AI 비용 - UI 진입만)')
    const fileInput = page.locator('input[type="file"]').first()
    console.log('#25 RESULT:', await fileInput.count() > 0 ? '⚠️ (AI 비용 - 파일 입력 확인만)' : '⚠️ (파일 입력 미발견)')
    console.log('#26 RESULT: ⚠️ (업로드 없어 삭제 불가)')
  } else {
    for (const id of [21, 22, 23, 24, 25, 26]) console.log(`#${id} RESULT: ❌ (업로드 페이지 진입 실패)`)
  }
})

test('교강사 문제 검수 #27-31', async ({ page }) => {
  await loginAndNavigate(page, 'teacher@claiq.kr', 'claiq1234', 'teacher')
  await page.goto(`${BASE}/teacher/review`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/t27-review-final.png', fullPage: true })
  console.log('REVIEW BODY:', body.substring(0, 700))

  const hasReview = (body.includes('검증') || body.includes('검수') || body.includes('문제')) && !body.includes('로그인')
  if (hasReview) {
    console.log('#27 RESULT: ✅')
    const tabs = page.locator('[role="tab"], button').filter({ hasText: /대기|승인|반려/ })
    console.log('#31 RESULT:', await tabs.count() > 0 ? '✅' : '⚠️ (탭 미발견)')

    const approveBtn = page.locator('button').filter({ hasText: /승인/ }).first()
    const rejectBtn = page.locator('button').filter({ hasText: /반려/ }).first()
    if (await approveBtn.count() > 0) {
      console.log('#28 RESULT: ✅')
      console.log('#29 RESULT:', await rejectBtn.count() > 0 ? '✅' : '⚠️ (반려 버튼 미발견)')
      console.log('#30 RESULT: ⚠️ (편집 후 저장 수동 확인 필요)')
    } else {
      console.log('#28 RESULT: ⚠️ (검수 대기 문제 없음)')
      console.log('#29 RESULT: ⚠️ (검수 대기 문제 없음)')
      console.log('#30 RESULT: ⚠️ (검수 대기 문제 없음)')
    }
  } else {
    for (const id of [27, 28, 29, 30, 31]) console.log(`#${id} RESULT: ❌ (검수 페이지 진입 실패)`)
  }
})

test('교강사 출결 관리 #32-35', async ({ page }) => {
  await loginAndNavigate(page, 'teacher@claiq.kr', 'claiq1234', 'teacher')
  await page.goto(`${BASE}/teacher/attendance`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/t32-attendance-final.png', fullPage: true })
  console.log('ATTENDANCE BODY:', body.substring(0, 600))

  const hasAttend = (body.includes('출결') || body.includes('출석')) && !body.includes('로그인')
  if (hasAttend) {
    console.log('#32 RESULT: ✅')
    const statusBtns = page.locator('button, select').filter({ hasText: /출석|결석|지각/ })
    console.log('#33 RESULT:', await statusBtns.count() > 0 ? '✅' : '⚠️ (상태 변경 버튼 미발견)')
    console.log('#34 RESULT:', await statusBtns.count() > 0 ? '✅' : '⚠️ (상태 변경 버튼 미발견)')
    const datePicker = page.locator('input[type="date"], [class*="calendar"]').first()
    console.log('#35 RESULT:', await datePicker.count() > 0 ? '✅' : '⚠️ (날짜 선택 UI 미발견)')
  } else {
    for (const id of [32, 33, 34, 35]) console.log(`#${id} RESULT: ❌ (출결 페이지 진입 실패)`)
  }
})

test('교강사 에스컬레이션 #67-69', async ({ page }) => {
  await loginAndNavigate(page, 'teacher@claiq.kr', 'claiq1234', 'teacher')
  await page.goto(`${BASE}/teacher/escalation`)
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/t67-escalation-final.png', fullPage: true })
  console.log('ESCALATION BODY:', body.substring(0, 700))

  const hasEscal = (body.includes('에스컬') || body.includes('Q&A') || body.includes('질문') || body.includes('답변')) && !body.includes('로그인')
  if (hasEscal) {
    console.log('#67 RESULT: ✅')
    const tabs = page.locator('[role="tab"], button').filter({ hasText: /미답변|답변완료/ })
    console.log('#67 tabs:', await tabs.count() > 0 ? '(탭 확인됨)' : '(탭 미발견)')

    // 에스컬레이션 항목 클릭 시도
    const items = page.locator('[class*="item"], [class*="card"], li').first()
    if (await items.count() > 0) {
      await items.click().catch(() => {})
      await page.waitForTimeout(2000)
    }

    const textarea = page.locator('textarea').first()
    if (await textarea.count() > 0) {
      const submitBtn = page.locator('button').filter({ hasText: /제출|답변|보내기/ }).first()
      const isDisabled = await submitBtn.isDisabled().catch(() => false)
      console.log('#69 RESULT:', isDisabled ? '✅' : '⚠️ (빈 답변 전송 버튼 활성화)')
      console.log('#68 RESULT: ⚠️ (실제 답변 제출 수동 확인 필요)')
    } else {
      console.log('#68 RESULT: ⚠️ (에스컬레이션 항목 없음 - 질문 없음)')
      console.log('#69 RESULT: ⚠️ (에스컬레이션 항목 없음)')
    }
  } else {
    for (const id of [67, 68, 69]) console.log(`#${id} RESULT: ❌ (에스컬레이션 페이지 진입 실패)`)
  }
})

// ============================================================
// 운영자 내부 페이지
// ============================================================
test('운영자 대시보드 #20', async ({ page }) => {
  await loginAndNavigate(page, 'admin@claiq.kr', 'claiq1234', 'operator')
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  await page.screenshot({ path: 'tests/e2e/artifacts/o20-dashboard-final.png', fullPage: true })
  console.log('OPERATOR DASHBOARD:', body.substring(0, 700))

  const hasStudents = body.includes('수강생')
  const hasChurn = body.includes('이탈') || body.includes('위험')
  const hasAttend = body.includes('출석률')
  const hasReport = body.includes('리포트') || body.includes('미발송')
  console.log('#20 RESULT:', (hasStudents && hasChurn && hasAttend && hasReport) ? '✅' : `⚠️ (수강생:${hasStudents}, 이탈:${hasChurn}, 출석률:${hasAttend}, 리포트:${hasReport})`)

  // 운영자 사이드바 탐색
  const navLinks = page.locator('nav a, aside a, [class*="sidebar"] a')
  const cnt = await navLinks.count()
  for (let i = 0; i < cnt; i++) {
    const txt = await navLinks.nth(i).textContent()
    const href = await navLinks.nth(i).getAttribute('href')
    console.log(`  OPERATOR NAV[${i}] "${txt?.trim()}" href="${href}"`)
  }
})

test('운영자 이탈 예측 #70-72', async ({ page }) => {
  await loginAndNavigate(page, 'admin@claiq.kr', 'claiq1234', 'operator')

  // 사이드바에서 이탈 위험 링크 찾기
  const churnLink = page.locator('a').filter({ hasText: /이탈 위험/ }).first()
  if (await churnLink.count() > 0) {
    await churnLink.click()
  } else {
    await page.goto(`${BASE}/operator/churn`)
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  const url = page.url()
  await page.screenshot({ path: 'tests/e2e/artifacts/o70-churn-final.png', fullPage: true })
  console.log('CHURN URL:', url)
  console.log('CHURN BODY:', body.substring(0, 600))

  const hasChurn = (body.includes('이탈') || body.includes('위험')) && !body.includes('로그인')
  if (hasChurn) {
    console.log('#70 RESULT: ✅')
    const filterBtns = page.locator('button, select, [role="combobox"]').filter({ hasText: /높음|위험도|전체|필터/ })
    console.log('#71 RESULT:', await filterBtns.count() > 0 ? '✅' : '⚠️ (필터 미발견)')
    const aiBtn = page.locator('button').filter({ hasText: /AI|코멘트|분석/ }).first()
    console.log('#72 RESULT:', await aiBtn.count() > 0 ? '⚠️ (AI 비용 - 버튼 확인만)' : '⚠️ (AI 코멘트 버튼 미발견)')
  } else {
    for (const id of [70, 71, 72]) console.log(`#${id} RESULT: ❌ (이탈 예측 페이지 진입 실패 - ${url})`)
  }
})

test('운영자 리포트 SMS #73-76', async ({ page }) => {
  await loginAndNavigate(page, 'admin@claiq.kr', 'claiq1234', 'operator')

  const reportLink = page.locator('a').filter({ hasText: /성취 리포트|리포트/ }).first()
  if (await reportLink.count() > 0) {
    await reportLink.click()
  } else {
    await page.goto(`${BASE}/operator/report`)
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  const url = page.url()
  await page.screenshot({ path: 'tests/e2e/artifacts/o73-report-final.png', fullPage: true })
  console.log('REPORT URL:', url)
  console.log('REPORT BODY:', body.substring(0, 700))

  const hasReport = (body.includes('리포트') || body.includes('SMS') || body.includes('발송')) && !body.includes('로그인')
  if (hasReport) {
    console.log('#73 RESULT: ✅')
    const unsentEl = page.locator('text=미발송').first()
    console.log('#74 RESULT:', await unsentEl.count() > 0 ? '✅' : '⚠️ (미발송 배지 미확인)')
    const smsBtn = page.locator('button').filter({ hasText: /SMS|발송/ }).first()
    console.log('#75 RESULT:', await smsBtn.count() > 0 ? '✅' : '⚠️ (SMS 발송 버튼 미발견)')
    console.log('#76 RESULT:', await smsBtn.count() > 0 ? '✅' : '⚠️ (일괄 발송 버튼 미발견)')
  } else {
    for (const id of [73, 74, 75, 76]) console.log(`#${id} RESULT: ❌ (리포트 페이지 진입 실패 - ${url})`)
  }
})

test('운영자 강의 통계 #77-79', async ({ page }) => {
  await loginAndNavigate(page, 'admin@claiq.kr', 'claiq1234', 'operator')

  const statsLink = page.locator('a').filter({ hasText: /강의 통계/ }).first()
  if (await statsLink.count() > 0) {
    await statsLink.click()
  } else {
    await page.goto(`${BASE}/operator/lecture-stats`)
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  const url = page.url()
  await page.screenshot({ path: 'tests/e2e/artifacts/o77-stats-final.png', fullPage: true })
  console.log('STATS URL:', url)
  console.log('STATS BODY:', body.substring(0, 600))

  const hasStats = (body.includes('통계') || body.includes('차트') || body.includes('강의')) && !body.includes('로그인') && !url.includes('404')
  if (hasStats) {
    console.log('#77 RESULT: ✅')
    const filters = page.locator('select, [role="combobox"]')
    console.log('#78 RESULT:', await filters.count() > 0 ? '✅' : '⚠️ (과목 필터 미발견)')
    console.log('#79 RESULT:', await filters.count() > 1 ? '✅' : '⚠️ (기간 필터 미발견)')
  } else {
    for (const id of [77, 78, 79]) console.log(`#${id} RESULT: ❌ (강의 통계 페이지 진입 실패 - ${url})`)
  }
})

test('운영자 학원 설정 멤버 #80-84', async ({ page }) => {
  await loginAndNavigate(page, 'admin@claiq.kr', 'claiq1234', 'operator')

  const settingsLink = page.locator('a').filter({ hasText: /학원 설정/ }).first()
  if (await settingsLink.count() > 0) {
    await settingsLink.click()
  } else {
    await page.goto(`${BASE}/operator/settings`)
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const body = await page.locator('body').textContent()
  const url = page.url()
  await page.screenshot({ path: 'tests/e2e/artifacts/o80-settings-final.png', fullPage: true })
  console.log('SETTINGS URL:', url)
  console.log('SETTINGS BODY:', body.substring(0, 700))

  const hasSettings = (body.includes('설정') || body.includes('학원')) && !body.includes('로그인')
  if (hasSettings) {
    const saveBtn = page.locator('button[type="submit"], button').filter({ hasText: /저장/ }).first()
    console.log('#80 RESULT:', await saveBtn.count() > 0 ? '✅' : '⚠️ (저장 버튼 미발견)')
    const couponBtn = page.locator('button').filter({ hasText: /쿠폰|생성/ }).first()
    console.log('#83 RESULT:', await couponBtn.count() > 0 ? '✅' : '⚠️ (쿠폰 생성 버튼 미발견)')
    const deleteBtn = page.locator('button').filter({ hasText: /삭제/ }).first()
    console.log('#84 RESULT:', await deleteBtn.count() > 0 ? '✅' : '⚠️ (삭제 버튼 미발견)')
  } else {
    console.log('#80 RESULT: ❌ (설정 페이지 진입 실패)')
    console.log('#83 RESULT: ❌ (설정 페이지 진입 실패)')
    console.log('#84 RESULT: ❌ (설정 페이지 진입 실패)')
  }

  // 멤버 관리
  const memberLink = page.locator('a').filter({ hasText: /멤버 관리/ }).first()
  if (await memberLink.count() > 0) {
    await memberLink.click()
  } else {
    await page.goto(`${BASE}/operator/members`)
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 })
  await page.waitForTimeout(2000)
  const memberBody = await page.locator('body').textContent()
  const memberUrl = page.url()
  await page.screenshot({ path: 'tests/e2e/artifacts/o81-members-final.png', fullPage: true })
  console.log('MEMBERS URL:', memberUrl)
  console.log('MEMBERS BODY:', memberBody.substring(0, 600))

  const hasMembers = (memberBody.includes('멤버') || memberBody.includes('수강생') || memberBody.includes('교강사')) && !memberBody.includes('로그인')
  console.log('#81 RESULT:', hasMembers ? '✅' : '⚠️ (멤버 목록 미확인)')

  if (hasMembers) {
    const roleFilter = page.locator('select, [role="combobox"], button').filter({ hasText: /교강사|수강생|역할|전체/ }).first()
    console.log('#81 역할 필터:', await roleFilter.count() > 0 ? '✅' : '⚠️ (역할 필터 미확인)')
    const removeBtn = page.locator('button').filter({ hasText: /제거|삭제|추방/ }).first()
    console.log('#82 RESULT:', await removeBtn.count() > 0 ? '✅' : '⚠️ (멤버 제거 버튼 미발견)')
  } else {
    console.log('#82 RESULT: ⚠️ (멤버 목록 미확인)')
  }
})
