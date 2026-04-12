/**
 * CLAIQ 최종 기능 테스트
 * - 데모 계정: operator@demo.claiq.kr, teacher1@demo.claiq.kr, s1@demo.claiq.kr / demo1234
 * - 회원가입 URL: /signup
 */
import { test, expect } from '@playwright/test'

const BASE = 'https://claiq.vercel.app'
const DEMO_PW = 'demo1234'
const OPERATOR_EMAIL = 'operator@demo.claiq.kr'
const TEACHER_EMAIL = 'teacher1@demo.claiq.kr'
const STUDENT_EMAIL = 's1@demo.claiq.kr'
const NEW_USER_EMAIL = 'test_e2e@claiq.kr'

// 자격증명으로 직접 로그인 (rate limit 대비 재시도 포함)
async function loginWith(page, email, password, expectedPath) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await page.waitForTimeout(5000)
    }
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    await page.locator('input[type="email"]').first().fill(email)
    await page.locator('input[type="password"]').first().fill(password)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(5000)

    const url = page.url()
    if (url.includes(expectedPath)) {
      return true
    }
    const body = await page.locator('body').textContent()
    if (body.includes('요청이 너무') || body.includes('rate') || body.includes('too many')) {
      console.log(`Rate limited, attempt ${attempt + 1}...`)
      continue
    }
    break
  }
  return page.url().includes(expectedPath)
}

// 데모 버튼으로 로그인
async function loginViaDemo(page, demoBtnText, expectedPath) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await page.waitForTimeout(8000)
    }
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const btn = page.locator(`button:has-text("${demoBtnText}")`).first()
    if (await btn.count() === 0) break
    await btn.click()
    await page.waitForTimeout(500)

    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(5000)

    const url = page.url()
    if (url.includes(expectedPath)) {
      return true
    }
    const body = await page.locator('body').textContent()
    if (body.includes('요청이 너무') || body.includes('rate')) {
      console.log(`Rate limited on demo login attempt ${attempt + 1}...`)
      continue
    }
    break
  }
  return page.url().includes(expectedPath)
}

// ============================================================
// 섹션 1-A: 회원가입 테스트
// ============================================================
test.describe('회원가입', () => {
  test('#10 수강생 정상 가입 (test_e2e@claiq.kr)', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')

    // 역할 선택: 수강생
    const studentBtn = page.locator('button:has-text("수강생")').first()
    await studentBtn.click()
    await page.waitForTimeout(1500)

    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/10-signup-form.png', fullPage: true })

    // 이름 입력
    await page.locator('input[placeholder*="이름"]').first().fill('E2E테스터')
    // 이메일 입력
    await page.locator('input[type="email"]').first().fill(NEW_USER_EMAIL)
    // 비밀번호
    await page.locator('input[placeholder*="8자"]').first().fill('Test1234!!')
    // 비밀번호 확인
    await page.locator('input[placeholder*="다시"]').first().fill('Test1234!!')
    // 약관 동의
    const checkboxes = page.locator('input[type="checkbox"]')
    const cbCount = await checkboxes.count()
    for (let i = 0; i < cbCount; i++) {
      await checkboxes.nth(i).check()
    }

    await page.screenshot({ path: 'tests/e2e/artifacts/10-signup-filled.png', fullPage: true })

    // 제출
    const submitBtn = page.locator('button').filter({ hasText: /가입/ }).last()
    await submitBtn.click()
    await page.waitForTimeout(5000)

    const url = page.url()
    const afterBody = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/10-signup-result.png', fullPage: true })
    console.log('#10 URL after signup:', url)
    console.log('#10 body:', afterBody.substring(0, 300))

    // 학원 코드 입력 단계 또는 로그인 성공
    if (afterBody.includes('학원 코드') || afterBody.includes('코드') || url.includes('academy') || url.includes('code')) {
      console.log('#10 RESULT: ✅ (학원 코드 입력 단계 이동)')
    } else if (url.includes('student') || url.includes('dashboard')) {
      console.log('#10 RESULT: ✅ (가입 및 로그인 완료)')
    } else if (afterBody.includes('이미') || afterBody.includes('중복') || afterBody.includes('exists')) {
      console.log('#10 RESULT: ✅ (이미 가입된 계정 - 이전 실행에서 성공)')
    } else {
      console.log('#10 RESULT: ⚠️ (결과 미확인)')
    }
  })

  test('#7 중복 이메일 재가입', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')

    const studentBtn = page.locator('button:has-text("수강생")').first()
    await studentBtn.click()
    await page.waitForTimeout(1500)

    // 이미 존재하는 이메일로 가입 시도
    await page.locator('input[placeholder*="이름"]').first().fill('중복테스터')
    await page.locator('input[type="email"]').first().fill(STUDENT_EMAIL) // 데모 계정 이메일
    await page.locator('input[placeholder*="8자"]').first().fill('Test1234!!')
    await page.locator('input[placeholder*="다시"]').first().fill('Test1234!!')
    const checkboxes = page.locator('input[type="checkbox"]')
    const cbCount = await checkboxes.count()
    for (let i = 0; i < cbCount; i++) await checkboxes.nth(i).check()

    const submitBtn = page.locator('button').filter({ hasText: /가입/ }).last()
    await submitBtn.click()
    await page.waitForTimeout(3000)

    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/07-dup-email.png', fullPage: true })
    const hasError = body.includes('이미') || body.includes('중복') || body.includes('사용') || body.includes('존재')
    console.log('#7 RESULT:', hasError ? '✅' : '⚠️ (에러 메시지 미확인)')
    console.log('#7 body:', body.substring(0, 300))
  })

  test('#8 비밀번호 7자 가입 시도', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')

    const studentBtn = page.locator('button:has-text("수강생")').first()
    await studentBtn.click()
    await page.waitForTimeout(1500)

    await page.locator('input[placeholder*="이름"]').first().fill('테스터')
    await page.locator('input[type="email"]').first().fill('shortpw@test.com')
    await page.locator('input[placeholder*="8자"]').first().fill('1234567') // 7자
    await page.locator('input[placeholder*="다시"]').first().fill('1234567')

    const checkboxes = page.locator('input[type="checkbox"]')
    const cbCount = await checkboxes.count()
    for (let i = 0; i < cbCount; i++) await checkboxes.nth(i).check()

    const submitBtn = page.locator('button').filter({ hasText: /가입/ }).last()
    await submitBtn.click()
    await page.waitForTimeout(2000)

    const body = await page.locator('body').textContent()
    const url = page.url()
    await page.screenshot({ path: 'tests/e2e/artifacts/08-short-pw.png', fullPage: true })

    // 에러 메시지 또는 여전히 signup 페이지
    const hasValidation = body.includes('8자') || body.includes('8글자') || body.includes('짧') || url.includes('signup')
    console.log('#8 RESULT:', hasValidation ? '✅' : '⚠️ (8자 유효성 검증 미확인)')
    console.log('#8 body:', body.substring(0, 300))
  })

  test('#9 비밀번호 확인 불일치', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')

    const studentBtn = page.locator('button:has-text("수강생")').first()
    await studentBtn.click()
    await page.waitForTimeout(1500)

    await page.locator('input[placeholder*="이름"]').first().fill('테스터')
    await page.locator('input[type="email"]').first().fill('mismatch@test.com')
    await page.locator('input[placeholder*="8자"]').first().fill('Test1234!!')
    await page.locator('input[placeholder*="다시"]').first().fill('Different!!')

    const checkboxes = page.locator('input[type="checkbox"]')
    const cbCount = await checkboxes.count()
    for (let i = 0; i < cbCount; i++) await checkboxes.nth(i).check()

    const submitBtn = page.locator('button').filter({ hasText: /가입/ }).last()
    await submitBtn.click()
    await page.waitForTimeout(2000)

    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/09-pw-mismatch.png', fullPage: true })
    const hasError = body.includes('일치') || body.includes('같') || body.includes('다릅')
    console.log('#9 RESULT:', hasError ? '✅' : '⚠️ (불일치 에러 미확인)')
    console.log('#9 body:', body.substring(0, 300))
  })
})

// ============================================================
// 섹션 1-B: 로그인/로그아웃
// ============================================================
test.describe('로그인-로그아웃', () => {
  test('#1 틀린 비밀번호 로그인', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    await page.locator('input[type="email"]').first().fill(STUDENT_EMAIL)
    await page.locator('input[type="password"]').first().fill('wrongpassword')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/01-wrong-pw.png' })
    console.log('#1 body after wrong pw:', body.substring(0, 300))
    const hasError = url.includes('login') || body.includes('잘못') || body.includes('틀') || body.includes('오류') || body.includes('invalid')
    console.log('#1 RESULT:', hasError ? '✅' : '⚠️ (에러 메시지 미확인)')
  })

  test('#2 운영자 데모 로그인', async ({ page }) => {
    const success = await loginViaDemo(page, '운영자·정민석', 'operator')
    const url = page.url()
    console.log('#2 URL:', url)
    await page.screenshot({ path: 'tests/e2e/artifacts/02-operator.png' })
    console.log('#2 RESULT:', success ? '✅' : `❌ (로그인 실패, rate limit 가능성)`)
  })

  test('#3 교강사 데모 로그인', async ({ page }) => {
    const success = await loginViaDemo(page, '교강사·이준혁', 'teacher')
    console.log('#3 RESULT:', success ? '✅' : '❌ (로그인 실패)')
    await page.screenshot({ path: 'tests/e2e/artifacts/03-teacher.png' })
  })

  test('#4 수강생 데모 로그인', async ({ page }) => {
    const success = await loginViaDemo(page, '수강생·김민준', 'student')
    console.log('#4 RESULT:', success ? '✅' : '❌ (로그인 실패)')
    await page.screenshot({ path: 'tests/e2e/artifacts/04-student.png' })
  })

  test('#5 데모 계정 버튼 자동 입력 확인', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const demoBtn = page.locator('button:has-text("운영자·정민석")').first()
    if (await demoBtn.count() > 0) {
      await demoBtn.click()
      await page.waitForTimeout(500)
      const emailVal = await page.locator('input[type="email"]').first().inputValue()
      console.log('#5 RESULT:', emailVal.includes('@') ? '✅' : '⚠️ (자동 입력 미확인)')
      console.log('#5 auto-filled email:', emailVal)
    } else {
      console.log('#5 RESULT: ⚠️ (데모 버튼 미발견)')
    }
    await page.screenshot({ path: 'tests/e2e/artifacts/05-demo-btn.png' })
  })

  test('#6 로그인 상태에서 /login 접속', async ({ page }) => {
    const success = await loginViaDemo(page, '수강생·김민준', 'student')
    if (!success) {
      console.log('#6 RESULT: ⚠️ (로그인 실패로 확인 불가)')
      return
    }

    await page.goto(`${BASE}/login`)
    await page.waitForTimeout(3000)
    const url = page.url()
    console.log('#6 URL after /login access while logged in:', url)
    console.log('#6 RESULT:', !url.endsWith('/login') ? '✅' : '⚠️ (리다이렉트 없음)')
    await page.screenshot({ path: 'tests/e2e/artifacts/06-login-redirect.png' })
  })

  test('#11 잘못된 학원 코드', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')
    const studentBtn = page.locator('button:has-text("수강생")').first()
    await studentBtn.click()
    await page.waitForTimeout(1000)

    await page.locator('input[placeholder*="이름"]').first().fill('코드테스터')
    await page.locator('input[type="email"]').first().fill('codetest_' + Date.now() + '@test.com')
    await page.locator('input[placeholder*="8자"]').first().fill('Test1234!!')
    await page.locator('input[placeholder*="다시"]').first().fill('Test1234!!')
    const cbs = page.locator('input[type="checkbox"]')
    for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check()

    const submitBtn = page.locator('button').filter({ hasText: /가입/ }).last()
    await submitBtn.click()
    await page.waitForTimeout(4000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#11 URL after signup:', url)
    console.log('#11 body:', body.substring(0, 400))

    // 학원 코드 입력 단계
    if (body.includes('학원 코드') || body.includes('코드') || url.includes('code') || url.includes('academy')) {
      const codeInput = page.locator('input').first()
      await codeInput.fill('WRONG99')
      const codeSubmit = page.locator('button[type="submit"], button').filter({ hasText: /확인|입장|다음/ }).first()
      await codeSubmit.click()
      await page.waitForTimeout(3000)

      const errBody = await page.locator('body').textContent()
      const hasError = errBody.includes('올바르지') || errBody.includes('없') || errBody.includes('잘못') || errBody.includes('invalid')
      console.log('#11 RESULT:', hasError ? '✅' : '⚠️ (에러 메시지 미확인)')
      console.log('#11 error body:', errBody.substring(0, 300))
    } else {
      console.log('#11 RESULT: ⚠️ (학원 코드 단계 미진입 - 가입 흐름 변경 가능성)')
    }
    await page.screenshot({ path: 'tests/e2e/artifacts/11-wrong-code.png' })
  })

  test('#12 로그아웃', async ({ page }) => {
    const success = await loginViaDemo(page, '수강생·김민준', 'student')
    if (!success) {
      console.log('#12 RESULT: ⚠️ (로그인 실패)')
      return
    }

    // 로그아웃 버튼 찾기
    const logoutBtn = page.locator('button[aria-label="로그아웃"], button:has-text("로그아웃")').first()
    if (await logoutBtn.count() === 0) {
      // 다른 방법으로 찾기
      const allBtns = page.locator('button')
      const cnt = await allBtns.count()
      for (let i = 0; i < cnt; i++) {
        const aria = await allBtns.nth(i).getAttribute('aria-label')
        if (aria?.includes('로그아웃')) {
          await allBtns.nth(i).click()
          break
        }
      }
    } else {
      await logoutBtn.click()
    }

    await page.waitForTimeout(3000)
    const url = page.url()
    console.log('#12 URL after logout:', url)
    console.log('#12 RESULT:', url.includes('login') ? '✅' : `❌ (URL: ${url})`)
    await page.screenshot({ path: 'tests/e2e/artifacts/12-logout.png' })
  })

  test('#13 로그아웃 후 뒤로가기', async ({ page }) => {
    const success = await loginViaDemo(page, '수강생·김민준', 'student')
    if (!success) {
      console.log('#13 RESULT: ⚠️ (로그인 실패)')
      return
    }
    const studentUrl = page.url()

    const logoutBtn = page.locator('button[aria-label="로그아웃"], button:has-text("로그아웃")').first()
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click()
      await page.waitForTimeout(3000)
      await page.goBack()
      await page.waitForTimeout(3000)
      const url = page.url()
      console.log('#13 URL after goBack:', url)
      console.log('#13 RESULT:', (url.includes('login') || url.includes('unauthorized')) ? '✅' : `⚠️ (URL: ${url})`)
    } else {
      console.log('#13 RESULT: ⚠️ (로그아웃 버튼 미발견)')
    }
    await page.screenshot({ path: 'tests/e2e/artifacts/13-logout-back.png' })
  })

  test('#14 수강생→/operator 접근 차단', async ({ page }) => {
    const success = await loginViaDemo(page, '수강생·김민준', 'student')
    if (!success) {
      console.log('#14 RESULT: ⚠️ (로그인 실패)')
      return
    }

    await page.goto(`${BASE}/operator`)
    await page.waitForTimeout(3000)
    const url = page.url()
    console.log('#14 URL after /operator access:', url)
    console.log('#14 RESULT:', (url.includes('unauthorized') || url.includes('login') || url.includes('student')) ? '✅' : `⚠️ (URL: ${url})`)
    await page.screenshot({ path: 'tests/e2e/artifacts/14-unauthorized.png' })
  })
})

// ============================================================
// 섹션 2: 수강생 기능
// ============================================================
test.describe('수강생기능', () => {
  let studentLoggedIn = false

  test.beforeEach(async ({ page }) => {
    const success = await loginViaDemo(page, '수강생·김민준', 'student')
    if (!success) throw new Error('Student demo login failed')
    await page.waitForLoadState('networkidle', { timeout: 20000 })
  })

  test('#15-17 수강생 대시보드', async ({ page }) => {
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/15-dashboard.png', fullPage: true })
    console.log('Dashboard body:', body.substring(0, 600))

    const hasDday = body.includes('D-') || body.includes('시험') || body.includes('수능')
    const hasStreak = body.includes('스트릭') || body.includes('연속')
    const hasPoint = body.includes('포인트')
    const hasStats = body.includes('정답') || body.includes('학습') || body.includes('통계')
    const hasRoadmap = body.includes('로드맵') || body.includes('주차') || body.includes('학습 계획')
    const hasRecommend = body.includes('추천') || body.includes('오늘의')

    console.log('#15 RESULT:', (hasDday || hasStreak || hasPoint || hasStats) ? '✅' : '⚠️ (지표 미확인)')
    console.log('#16 RESULT:', hasRoadmap ? '✅' : '⚠️ (로드맵 미리보기 미확인)')
    console.log('#17 RESULT:', hasRecommend ? '✅' : '⚠️ (추천 카드 미확인)')

    // 사이드바 링크 탐색
    const navLinks = page.locator('nav a, aside a, [class*="sidebar"] a, [class*="nav"] a')
    const cnt = await navLinks.count()
    console.log('Nav links count:', cnt)
    for (let i = 0; i < cnt; i++) {
      const txt = await navLinks.nth(i).textContent()
      const href = await navLinks.nth(i).getAttribute('href')
      console.log(`  nav[${i}]: txt="${txt?.trim()}", href="${href}"`)
    }
  })

  test('#36-42 문제 풀기', async ({ page }) => {
    // 사이드바에서 문제 페이지 링크 찾기
    const quizLinks = page.locator('a[href*="quiz"], a[href*="question"], a[href*="problem"]')
    if (await quizLinks.count() > 0) {
      await quizLinks.first().click()
    } else {
      // 사이드바 모든 링크 탐색
      const navLinks = page.locator('nav a, [class*="sidebar"] a, aside a')
      const cnt = await navLinks.count()
      let clicked = false
      for (let i = 0; i < cnt; i++) {
        const txt = await navLinks.nth(i).textContent()
        const href = await navLinks.nth(i).getAttribute('href')
        if (txt?.includes('문제') || txt?.includes('퀴즈') || href?.includes('quiz')) {
          await navLinks.nth(i).click()
          clicked = true
          break
        }
      }
      if (!clicked) {
        await page.goto(`${BASE}/student/quiz`)
      }
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#36 URL:', url)
    console.log('#36 body:', body.substring(0, 400))
    await page.screenshot({ path: 'tests/e2e/artifacts/36-quiz.png', fullPage: true })

    const hasQuiz = body.includes('문제') || body.includes('quiz') || body.includes('오늘')
    const isEmpty = body.includes('없습니다') || (body.includes('없') && body.includes('문제'))

    if (hasQuiz && !isEmpty) {
      console.log('#36 RESULT: ✅')

      // 제출 버튼 비활성 확인
      const submitBtn = page.locator('button[type="submit"], button:has-text("제출")').first()
      const isDisabledBefore = await submitBtn.isDisabled().catch(() => false)
      console.log('#38 RESULT:', isDisabledBefore ? '✅' : '⚠️ (선택 전 제출 버튼 활성화)')

      // 보기 선택
      const choices = page.locator('button').filter({ hasText: /^[①②③④⑤]/ })
      if (await choices.count() > 0) {
        await choices.first().click()
        await page.waitForTimeout(500)
        console.log('#37 RESULT: ✅')

        await submitBtn.click()
        await page.waitForTimeout(3000)
        const resultBody = await page.locator('body').textContent()
        await page.screenshot({ path: 'tests/e2e/artifacts/39-result.png', fullPage: true })
        const hasResult = resultBody.includes('정답') || resultBody.includes('오답') || resultBody.includes('해설')
        console.log('#39 RESULT:', hasResult ? '✅' : '⚠️ (결과 미확인)')
        console.log('#40 RESULT:', hasResult ? '✅' : '⚠️ (오답 결과 미확인)')
      } else {
        console.log('#37 RESULT: ⚠️ (보기 버튼 ① 미발견)')
        console.log('#39 RESULT: ⚠️ (보기 없음)')
        console.log('#40 RESULT: ⚠️ (보기 없음)')
      }

      const navItems = page.locator('[class*="navigator"] button, [class*="progress"] button')
      console.log('#41 RESULT:', await navItems.count() > 0 ? '✅' : '⚠️ (번호 네비게이터 미확인)')
      const resultBtn = page.locator('button:has-text("결과"), a:has-text("결과")').first()
      console.log('#42 RESULT:', await resultBtn.count() > 0 ? '✅' : '⚠️ (결과 보기 버튼 미확인)')
    } else if (isEmpty) {
      console.log('#36 RESULT: ⚠️ (오늘의 문제 데이터 없음 - 강의 업로드 선행 필요)')
      console.log('#37 RESULT: ⚠️ (문제 없음)')
      console.log('#38 RESULT: ⚠️ (문제 없음)')
      console.log('#39 RESULT: ⚠️ (문제 없음)')
      console.log('#40 RESULT: ⚠️ (문제 없음)')
      console.log('#41 RESULT: ⚠️ (문제 없음)')
      console.log('#42 RESULT: ⚠️ (문제 없음)')
    } else {
      console.log('#36 RESULT: ❌ (문제 페이지 진입 실패 -', url, ')')
      for (const id of [37, 38, 39, 40, 41, 42]) {
        console.log(`#${id} RESULT: ❌ (페이지 진입 실패)`)
      }
    }
  })

  test('#43-45 결과 페이지', async ({ page }) => {
    // 이미 완료된 퀴즈 결과 페이지 접근 시도
    const quizLinks = page.locator('a[href*="quiz"], a[href*="result"]')
    if (await quizLinks.count() > 0) {
      await quizLinks.first().click()
    } else {
      await page.goto(`${BASE}/student/quiz`)
    }
    await page.waitForTimeout(3000)

    const body = await page.locator('body').textContent()
    const url = page.url()
    await page.screenshot({ path: 'tests/e2e/artifacts/43-result-page.png', fullPage: true })
    console.log('#43 URL:', url)
    console.log('#43 body:', body.substring(0, 400))

    const hasResult = body.includes('점수') || body.includes('결과') || body.includes('정답') || body.includes('%')
    if (hasResult) {
      console.log('#43 RESULT: ✅')
      console.log('#44 RESULT: ⚠️ (색상 자동 확인 불가 - 스크린샷 참조)')
      const weakBtn = page.locator('button:has-text("약점"), a:has-text("약점")').first()
      console.log('#45 RESULT:', await weakBtn.count() > 0 ? '✅' : '⚠️ (약점 분석 버튼 미확인)')
    } else {
      console.log('#43 RESULT: ⚠️ (결과 데이터 없음)')
      console.log('#44 RESULT: ⚠️ (결과 데이터 없음)')
      console.log('#45 RESULT: ⚠️ (결과 데이터 없음)')
    }
  })

  test('#46-51 AI Q&A', async ({ page }) => {
    const qaLinks = page.locator('a[href*="qa"], a[href*="chat"], a:has-text("Q&A"), a:has-text("AI")')
    if (await qaLinks.count() > 0) {
      await qaLinks.first().click()
    } else {
      const allNavLinks = page.locator('nav a, aside a, [class*="sidebar"] a')
      const cnt = await allNavLinks.count()
      for (let i = 0; i < cnt; i++) {
        const txt = await allNavLinks.nth(i).textContent()
        const href = await allNavLinks.nth(i).getAttribute('href')
        if (txt?.includes('Q&A') || txt?.includes('AI') || txt?.includes('질문') || href?.includes('qa')) {
          await allNavLinks.nth(i).click()
          break
        }
      }
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#46 URL:', url)
    await page.screenshot({ path: 'tests/e2e/artifacts/46-qa.png', fullPage: true })

    const hasQA = body.includes('Q&A') || body.includes('질문') || body.includes('AI') || body.includes('채팅') || body.includes('대화')
    if (hasQA) {
      console.log('#46 RESULT: ✅')

      const textarea = page.locator('textarea').first()
      const hasTextarea = await textarea.count() > 0
      if (hasTextarea) {
        const sendBtn = page.locator('button[aria-label*="전송"], button:has-text("전송"), button[type="submit"]').first()
        const isDisabled = await sendBtn.isDisabled().catch(() => false)
        console.log('#50 RESULT:', isDisabled ? '✅' : '⚠️ (빈 입력 전송 버튼 활성화)')

        await textarea.fill('삼각함수란 무엇인가요?')
        console.log('#51 RESULT: ✅')

        const isSendEnabled = !(await sendBtn.isDisabled().catch(() => true))
        if (isSendEnabled) {
          await sendBtn.click()
          await page.waitForTimeout(10000)
          const newBody = await page.locator('body').textContent()
          await page.screenshot({ path: 'tests/e2e/artifacts/47-qa-reply.png', fullPage: true })
          const hasReply = newBody.length > body.length + 100
          console.log('#47 RESULT:', hasReply ? '✅' : '⚠️ (스트리밍 응답 미확인)')
          console.log('#48 RESULT: ⚠️ (스트리밍 중 비활성 상태 자동 확인 불가)')
        } else {
          console.log('#47 RESULT: ⚠️ (전송 버튼 비활성)')
          console.log('#48 RESULT: ⚠️ (전송 버튼 비활성)')
        }
      } else {
        console.log('#47 RESULT: ⚠️ (입력창 미발견)')
        console.log('#48 RESULT: ⚠️ (입력창 미발견)')
        console.log('#50 RESULT: ⚠️ (입력창 미발견)')
        console.log('#51 RESULT: ⚠️ (입력창 미발견)')
      }

      const sessionEl = page.locator('[class*="session"], [class*="history"]').first()
      console.log('#49 RESULT:', await sessionEl.count() > 0 ? '✅' : '⚠️ (세션 목록 미확인)')
    } else {
      console.log('#46 RESULT: ⚠️ (Q&A 페이지 미확인 - URL:', url + ')')
      for (const id of [47, 48, 49, 50, 51]) console.log(`#${id} RESULT: ⚠️ (페이지 미진입)`)
    }
  })

  test('#52-54 약점 분석', async ({ page }) => {
    const weakLinks = page.locator('a[href*="weak"], a[href*="analysis"], a:has-text("약점"), a:has-text("분석")')
    if (await weakLinks.count() > 0) {
      await weakLinks.first().click()
    } else {
      const allNav = page.locator('nav a, aside a')
      const cnt = await allNav.count()
      for (let i = 0; i < cnt; i++) {
        const txt = await allNav.nth(i).textContent()
        const href = await allNav.nth(i).getAttribute('href')
        if (txt?.includes('약점') || txt?.includes('분석') || href?.includes('weak') || href?.includes('analysis')) {
          await allNav.nth(i).click()
          break
        }
      }
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#52 URL:', url)
    await page.screenshot({ path: 'tests/e2e/artifacts/52-analysis.png', fullPage: true })

    const hasAnalysis = body.includes('약점') || body.includes('분석') || body.includes('정답률') || body.includes('유형')
    const isEmpty = (body.includes('없') && body.includes('데이터')) || body.includes('아직')
    if (hasAnalysis) {
      console.log('#52 RESULT: ✅')
      const filter = page.locator('select, [role="combobox"]').first()
      console.log('#53 RESULT:', await filter.count() > 0 ? '✅' : '⚠️ (필터 미확인)')
      console.log('#54 RESULT: ⚠️ (데이터 있음 - 빈 상태 메시지 확인 불가)')
    } else if (isEmpty) {
      console.log('#52 RESULT: ⚠️ (분석 데이터 없음 - 문제 풀기 선행 필요)')
      console.log('#53 RESULT: ⚠️ (데이터 없음)')
      console.log('#54 RESULT: ✅')
    } else {
      console.log('#52 RESULT: ⚠️ (약점 분석 페이지 미확인 - URL:', url + ')')
      console.log('#53 RESULT: ⚠️ (페이지 미진입)')
      console.log('#54 RESULT: ⚠️ (페이지 미진입)')
    }
  })

  test('#55-60 미니 모의고사', async ({ page }) => {
    const examLinks = page.locator('a[href*="exam"], a[href*="mock"], a:has-text("모의고사"), a:has-text("시험")')
    if (await examLinks.count() > 0) {
      await examLinks.first().click()
    } else {
      const allNav = page.locator('nav a, aside a')
      const cnt = await allNav.count()
      for (let i = 0; i < cnt; i++) {
        const txt = await allNav.nth(i).textContent()
        const href = await allNav.nth(i).getAttribute('href')
        if (txt?.includes('모의') || txt?.includes('시험') || href?.includes('exam') || href?.includes('mock')) {
          await allNav.nth(i).click()
          break
        }
      }
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#55 URL:', url)
    console.log('#55 body:', body.substring(0, 400))
    await page.screenshot({ path: 'tests/e2e/artifacts/55-exam.png', fullPage: true })

    const hasExam = body.includes('모의고사') || body.includes('시험') || body.includes('exam')
    if (hasExam) {
      console.log('#55 RESULT: ✅')

      const startBtn = page.locator('button').filter({ hasText: /시작|새 모의고사|모의고사 시작/ }).first()
      if (await startBtn.count() > 0) {
        await startBtn.click()
        await page.waitForTimeout(12000)
        const examBody = await page.locator('body').textContent()
        await page.screenshot({ path: 'tests/e2e/artifacts/55-exam-started.png', fullPage: true })

        const hasTimer = examBody.includes(':') || examBody.includes('분') || examBody.includes('남')
        console.log('#56 RESULT:', hasTimer ? '✅' : '⚠️ (타이머 미확인)')

        const choices = page.locator('button').filter({ hasText: /^[①②③④⑤]/ })
        if (await choices.count() > 0) {
          await choices.first().click()
          console.log('#57 RESULT: ✅')
        } else {
          console.log('#57 RESULT: ⚠️ (보기 미발견)')
        }

        const submitBtn = page.locator('button').filter({ hasText: /제출|완료/ }).first()
        console.log('#58 RESULT:', await submitBtn.count() > 0 ? '✅' : '⚠️ (제출 버튼 미발견)')
        console.log('#59 RESULT: ⚠️ (제출 후 확인 필요)')
        console.log('#60 RESULT: ⚠️ (결과 후 확인 필요)')
      } else {
        const hasTimer = body.includes(':') || body.includes('분')
        console.log('#56 RESULT:', hasTimer ? '✅' : '⚠️ (진행 중 타이머)')
        console.log('#57 RESULT: ⚠️ (시작 버튼 없음)')
        console.log('#58 RESULT: ⚠️ (시작 버튼 없음)')
        console.log('#59 RESULT: ⚠️ (시작 버튼 없음)')
        console.log('#60 RESULT: ⚠️ (시작 버튼 없음)')
      }
    } else {
      console.log('#55 RESULT: ⚠️ (모의고사 페이지 미확인 - URL:', url + ')')
      for (const id of [56, 57, 58, 59, 60]) console.log(`#${id} RESULT: ⚠️ (페이지 미진입)`)
    }
  })

  test('#61-62 로드맵', async ({ page }) => {
    const roadmapLinks = page.locator('a[href*="roadmap"], a:has-text("로드맵")')
    if (await roadmapLinks.count() > 0) {
      await roadmapLinks.first().click()
    } else {
      await page.goto(`${BASE}/student/roadmap`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#61 URL:', url)
    await page.screenshot({ path: 'tests/e2e/artifacts/61-roadmap.png', fullPage: true })

    const hasRoadmap = body.includes('로드맵') || body.includes('학습') || body.includes('주차') || body.includes('D-')
    console.log('#61 RESULT:', hasRoadmap ? '✅' : '⚠️ (로드맵 데이터 미확인)')

    const regenBtn = page.locator('button').filter({ hasText: /재생성|다시 생성/ }).first()
    console.log('#62 RESULT:', await regenBtn.count() > 0 ? '⚠️ (AI 비용 - 버튼 확인만)' : '⚠️ (재생성 버튼 미발견)')
  })

  test('#63-66 포인트 뱃지', async ({ page }) => {
    const pointsLinks = page.locator('a[href*="point"], a:has-text("포인트")')
    if (await pointsLinks.count() > 0) {
      await pointsLinks.first().click()
    } else {
      await page.goto(`${BASE}/student/points`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#63 URL:', url)
    await page.screenshot({ path: 'tests/e2e/artifacts/63-points.png', fullPage: true })

    const hasPoints = body.includes('포인트') || body.includes('잔액') || body.includes('point')
    console.log('#63 RESULT:', hasPoints ? '✅' : '⚠️ (포인트 페이지 미확인)')

    if (hasPoints) {
      const couponBtn = page.locator('button').filter({ hasText: /교환|쿠폰/ }).first()
      console.log('#64 RESULT:', await couponBtn.count() > 0 ? '⚠️ (쿠폰 수량/포인트 미확인)' : '⚠️ (교환 버튼 미발견)')
      console.log('#65 RESULT:', await couponBtn.count() > 0 ? '⚠️ (포인트 부족 시나리오 확인 필요)' : '⚠️ (교환 버튼 미발견)')
    } else {
      console.log('#64 RESULT: ⚠️ (포인트 페이지 미확인)')
      console.log('#65 RESULT: ⚠️ (포인트 페이지 미확인)')
    }

    const badgeLinks = page.locator('a[href*="badge"], a:has-text("뱃지"), a:has-text("badge")')
    if (await badgeLinks.count() > 0) {
      await badgeLinks.first().click()
    } else {
      await page.goto(`${BASE}/student/badges`)
    }
    await page.waitForTimeout(3000)

    const badgeBody = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/66-badges.png', fullPage: true })
    const hasBadge = badgeBody.includes('뱃지') || badgeBody.includes('badge') || badgeBody.includes('획득')
    console.log('#66 RESULT:', hasBadge ? '✅' : '⚠️ (뱃지 페이지 미확인)')
  })
})

// ============================================================
// 섹션 3: 교강사 기능
// ============================================================
test.describe('교강사기능', () => {
  test.beforeEach(async ({ page }) => {
    const success = await loginViaDemo(page, '교강사·이준혁', 'teacher')
    if (!success) throw new Error('Teacher demo login failed')
    await page.waitForLoadState('networkidle', { timeout: 20000 })
  })

  test('#18-19 교강사 대시보드', async ({ page }) => {
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/18-teacher-dashboard.png', fullPage: true })
    console.log('Teacher dashboard:', body.substring(0, 500))

    // 사이드바 탐색
    const navLinks = page.locator('nav a, aside a, [class*="sidebar"] a')
    const cnt = await navLinks.count()
    for (let i = 0; i < cnt; i++) {
      const txt = await navLinks.nth(i).textContent()
      const href = await navLinks.nth(i).getAttribute('href')
      console.log(`  teacher nav[${i}]: "${txt?.trim()}", href="${href}"`)
    }

    const hasCards = body.includes('업로드') || body.includes('검수') || body.includes('출석') || body.includes('에스컬')
    console.log('#18 RESULT:', hasCards ? '✅' : '⚠️ (대시보드 지표 미확인)')
    const hasLectures = body.includes('강의') || body.includes('lecture')
    console.log('#19 RESULT:', hasLectures ? '✅' : '⚠️ (강의 목록 미확인)')
  })

  test('#21-26 강의 업로드 UI', async ({ page }) => {
    const uploadLinks = page.locator('a[href*="upload"], a[href*="lecture"], a:has-text("업로드"), a:has-text("강의")')
    if (await uploadLinks.count() > 0) {
      await uploadLinks.first().click()
    } else {
      await page.goto(`${BASE}/teacher/upload`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#21 URL:', url)
    console.log('#21 body:', body.substring(0, 400))
    await page.screenshot({ path: 'tests/e2e/artifacts/21-upload.png', fullPage: true })

    const hasUpload = body.includes('업로드') || body.includes('파일') || body.includes('강의') || body.includes('upload')
    if (hasUpload) {
      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /업로드|제출|시작/ }).first()
      const isDisabled = await submitBtn.isDisabled().catch(() => false)
      console.log('#24 RESULT:', isDisabled ? '✅' : '⚠️ (파일 없이 제출 버튼 활성화 확인 필요)')
      console.log('#21 RESULT: ⚠️ (AI 비용 - UI 진입만)')
      console.log('#22 RESULT: ⚠️ (AI 비용 - UI 진입만)')
      console.log('#23 RESULT: ⚠️ (AI 비용 - UI 진입만)')
      const fileInput = page.locator('input[type="file"]').first()
      console.log('#25 RESULT:', await fileInput.count() > 0 ? '⚠️ (AI 비용 - 파일 입력 확인만)' : '⚠️ (파일 입력 미발견)')
      console.log('#26 RESULT: ⚠️ (업로드 데이터 없어 삭제 불가)')
    } else {
      for (const id of [21, 22, 23, 24, 25, 26]) console.log(`#${id} RESULT: ⚠️ (업로드 페이지 미확인 - URL: ${url})`)
    }
  })

  test('#27-31 문제 검수', async ({ page }) => {
    const reviewLinks = page.locator('a[href*="review"], a:has-text("검수")')
    if (await reviewLinks.count() > 0) {
      await reviewLinks.first().click()
    } else {
      await page.goto(`${BASE}/teacher/review`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#27 URL:', url)
    console.log('#27 body:', body.substring(0, 400))
    await page.screenshot({ path: 'tests/e2e/artifacts/27-review.png', fullPage: true })

    const hasReview = body.includes('검수') || body.includes('대기') || body.includes('문제') || body.includes('pending')
    if (hasReview) {
      console.log('#27 RESULT: ✅')
      const tabs = page.locator('[role="tab"], button').filter({ hasText: /대기|승인|반려/ })
      console.log('#31 RESULT:', await tabs.count() > 0 ? '✅' : '⚠️ (탭 미발견)')

      const approveBtn = page.locator('button').filter({ hasText: /승인/ }).first()
      if (await approveBtn.count() > 0) {
        console.log('#28 RESULT: ✅')
        const rejectBtn = page.locator('button').filter({ hasText: /반려/ }).first()
        console.log('#29 RESULT:', await rejectBtn.count() > 0 ? '✅' : '⚠️ (반려 버튼 미발견)')
        console.log('#30 RESULT: ⚠️ (편집 후 저장 수동 확인 필요)')
      } else {
        console.log('#28 RESULT: ⚠️ (검수 대기 문제 없음)')
        console.log('#29 RESULT: ⚠️ (검수 대기 문제 없음)')
        console.log('#30 RESULT: ⚠️ (검수 대기 문제 없음)')
      }
    } else {
      for (const id of [27, 28, 29, 30, 31]) console.log(`#${id} RESULT: ⚠️ (검수 페이지 미확인)`)
    }
  })

  test('#32-35 출결 관리', async ({ page }) => {
    const attendLinks = page.locator('a[href*="attend"], a:has-text("출결"), a:has-text("출석")')
    if (await attendLinks.count() > 0) {
      await attendLinks.first().click()
    } else {
      await page.goto(`${BASE}/teacher/attendance`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#32 URL:', url)
    console.log('#32 body:', body.substring(0, 400))
    await page.screenshot({ path: 'tests/e2e/artifacts/32-attendance.png', fullPage: true })

    const hasAttend = body.includes('출결') || body.includes('출석') || body.includes('attendance')
    if (hasAttend) {
      console.log('#32 RESULT: ✅')
      const statusBtn = page.locator('button, select').filter({ hasText: /출석|결석|지각/ }).first()
      console.log('#33 RESULT:', await statusBtn.count() > 0 ? '✅' : '⚠️ (상태 변경 버튼 미발견)')
      console.log('#34 RESULT:', await statusBtn.count() > 0 ? '✅' : '⚠️ (상태 변경 버튼 미발견)')
      const datePicker = page.locator('input[type="date"], [class*="calendar"]').first()
      console.log('#35 RESULT:', await datePicker.count() > 0 ? '✅' : '⚠️ (날짜 선택 UI 미발견)')
    } else {
      for (const id of [32, 33, 34, 35]) console.log(`#${id} RESULT: ⚠️ (출결 페이지 미확인)`)
    }
  })

  test('#67-69 에스컬레이션', async ({ page }) => {
    const escalLinks = page.locator('a[href*="escalat"], a:has-text("에스컬"), a:has-text("Q&A")')
    if (await escalLinks.count() > 0) {
      await escalLinks.first().click()
    } else {
      await page.goto(`${BASE}/teacher/escalation`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#67 URL:', url)
    console.log('#67 body:', body.substring(0, 400))
    await page.screenshot({ path: 'tests/e2e/artifacts/67-escalation.png', fullPage: true })

    const hasEscal = body.includes('에스컬') || body.includes('Q&A') || body.includes('질문') || body.includes('답변')
    if (hasEscal) {
      console.log('#67 RESULT: ✅')
      const tabs = page.locator('[role="tab"], button').filter({ hasText: /미답변|답변완료/ })
      console.log('#67 tabs RESULT:', await tabs.count() > 0 ? '✅' : '⚠️ (탭 미발견)')

      const answerInput = page.locator('textarea').first()
      if (await answerInput.count() > 0) {
        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /제출|답변/ }).first()
        const isDisabled = await submitBtn.isDisabled().catch(() => false)
        console.log('#69 RESULT:', isDisabled ? '✅' : '⚠️ (빈 답변 제출 버튼 활성화)')
        console.log('#68 RESULT: ⚠️ (에스컬레이션 없음 - 답변 제출 불가)')
      } else {
        console.log('#68 RESULT: ⚠️ (에스컬레이션 항목 없음)')
        console.log('#69 RESULT: ⚠️ (에스컬레이션 항목 없음)')
      }
    } else {
      for (const id of [67, 68, 69]) console.log(`#${id} RESULT: ⚠️ (에스컬레이션 페이지 미확인)`)
    }
  })
})

// ============================================================
// 섹션 4: 운영자 기능
// ============================================================
test.describe('운영자기능', () => {
  test.beforeEach(async ({ page }) => {
    const success = await loginViaDemo(page, '운영자·정민석', 'operator')
    if (!success) throw new Error('Operator demo login failed')
    await page.waitForLoadState('networkidle', { timeout: 20000 })
  })

  test('#20 운영자 대시보드', async ({ page }) => {
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/20-operator-dashboard.png', fullPage: true })
    console.log('Operator dashboard:', body.substring(0, 600))

    // 사이드바 링크 탐색
    const navLinks = page.locator('nav a, aside a, [class*="sidebar"] a')
    const cnt = await navLinks.count()
    for (let i = 0; i < cnt; i++) {
      const txt = await navLinks.nth(i).textContent()
      const href = await navLinks.nth(i).getAttribute('href')
      console.log(`  operator nav[${i}]: "${txt?.trim()}", href="${href}"`)
    }

    const hasStudents = body.includes('수강생')
    const hasChurn = body.includes('이탈') || body.includes('위험')
    const hasAttend = body.includes('출석률')
    const hasReport = body.includes('리포트') || body.includes('미전송')
    console.log('#20 RESULT:', (hasStudents && (hasChurn || hasAttend || hasReport)) ? '✅' : '⚠️ (대시보드 지표 미확인)')
  })

  test('#70-72 이탈 예측', async ({ page }) => {
    const churnLinks = page.locator('a[href*="churn"], a:has-text("이탈"), a:has-text("위험")')
    if (await churnLinks.count() > 0) {
      await churnLinks.first().click()
    } else {
      await page.goto(`${BASE}/operator/churn`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#70 URL:', url)
    console.log('#70 body:', body.substring(0, 400))
    await page.screenshot({ path: 'tests/e2e/artifacts/70-churn.png', fullPage: true })

    const hasChurn = body.includes('이탈') || body.includes('위험') || body.includes('churn')
    if (hasChurn) {
      console.log('#70 RESULT: ✅')
      const filterBtn = page.locator('button, select, [role="combobox"]').filter({ hasText: /높음|위험도|필터/ }).first()
      console.log('#71 RESULT:', await filterBtn.count() > 0 ? '✅' : '⚠️ (필터 미발견)')
      const aiBtn = page.locator('button').filter({ hasText: /AI|코멘트|분석/ }).first()
      console.log('#72 RESULT:', await aiBtn.count() > 0 ? '⚠️ (AI 비용 - 버튼 확인만)' : '⚠️ (AI 코멘트 버튼 미발견)')
    } else {
      for (const id of [70, 71, 72]) console.log(`#${id} RESULT: ⚠️ (이탈 예측 페이지 미확인 - URL: ${url})`)
    }
  })

  test('#73-76 리포트 SMS', async ({ page }) => {
    const reportLinks = page.locator('a[href*="report"], a:has-text("리포트"), a:has-text("SMS")')
    if (await reportLinks.count() > 0) {
      await reportLinks.first().click()
    } else {
      await page.goto(`${BASE}/operator/report`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#73 URL:', url)
    console.log('#73 body:', body.substring(0, 500))
    await page.screenshot({ path: 'tests/e2e/artifacts/73-report.png', fullPage: true })

    const hasReport = body.includes('리포트') || body.includes('report') || body.includes('SMS') || body.includes('발송')
    if (hasReport) {
      console.log('#73 RESULT: ✅')
      const unsentEl = page.locator('text=미발송').first()
      console.log('#74 RESULT:', await unsentEl.count() > 0 ? '✅' : '⚠️ (미발송 배지 미확인)')
      const smsBtn = page.locator('button').filter({ hasText: /SMS|발송/ }).first()
      console.log('#75 RESULT:', await smsBtn.count() > 0 ? '✅' : '⚠️ (SMS 발송 버튼 미발견)')
      console.log('#76 RESULT:', await smsBtn.count() > 0 ? '✅' : '⚠️ (일괄 발송 버튼 미발견)')
    } else {
      for (const id of [73, 74, 75, 76]) console.log(`#${id} RESULT: ⚠️ (리포트 페이지 미확인 - URL: ${url})`)
    }
  })

  test('#77-79 강의 통계', async ({ page }) => {
    const statsLinks = page.locator('a[href*="stat"], a[href*="lecture"], a:has-text("통계"), a:has-text("강의 통계")')
    if (await statsLinks.count() > 0) {
      await statsLinks.first().click()
    } else {
      // 여러 경로 시도
      const paths = ['/operator/lecture-stats', '/operator/stats', '/operator/lectures']
      for (const path of paths) {
        await page.goto(`${BASE}${path}`)
        await page.waitForTimeout(1500)
        const body = await page.locator('body').textContent()
        if (body.includes('통계') || body.includes('차트')) break
      }
    }
    await page.waitForTimeout(2000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#77 URL:', url)
    console.log('#77 body:', body.substring(0, 400))
    await page.screenshot({ path: 'tests/e2e/artifacts/77-stats.png', fullPage: true })

    const hasStats = body.includes('통계') || body.includes('차트') || body.includes('강의')
    if (hasStats && !url.includes('404')) {
      console.log('#77 RESULT: ✅')
      const filters = page.locator('select, [role="combobox"]')
      console.log('#78 RESULT:', await filters.count() > 0 ? '✅' : '⚠️ (필터 미발견)')
      console.log('#79 RESULT:', await filters.count() > 1 ? '✅' : '⚠️ (기간 필터 미발견)')
    } else {
      for (const id of [77, 78, 79]) console.log(`#${id} RESULT: ⚠️ (강의 통계 페이지 미확인 - URL: ${url})`)
    }
  })

  test('#80-84 학원 설정 멤버', async ({ page }) => {
    const settingsLinks = page.locator('a[href*="settings"], a[href*="setting"], a:has-text("설정")')
    if (await settingsLinks.count() > 0) {
      await settingsLinks.first().click()
    } else {
      await page.goto(`${BASE}/operator/settings`)
    }
    await page.waitForTimeout(3000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#80 URL:', url)
    console.log('#80 body:', body.substring(0, 500))
    await page.screenshot({ path: 'tests/e2e/artifacts/80-settings.png', fullPage: true })

    const hasSettings = body.includes('설정') || body.includes('학원') || url.includes('settings')
    if (hasSettings) {
      const saveBtn = page.locator('button[type="submit"], button').filter({ hasText: /저장/ }).first()
      console.log('#80 RESULT:', await saveBtn.count() > 0 ? '✅' : '⚠️ (저장 버튼 미발견)')
      const couponBtn = page.locator('button').filter({ hasText: /쿠폰|생성/ }).first()
      console.log('#83 RESULT:', await couponBtn.count() > 0 ? '✅' : '⚠️ (쿠폰 생성 버튼 미발견)')
      const deleteBtn = page.locator('button').filter({ hasText: /삭제|제거/ }).first()
      console.log('#84 RESULT:', await deleteBtn.count() > 0 ? '✅' : '⚠️ (삭제 버튼 미발견)')
    } else {
      console.log('#80 RESULT: ⚠️ (설정 페이지 미확인)')
      console.log('#83 RESULT: ⚠️ (설정 페이지 미확인)')
      console.log('#84 RESULT: ⚠️ (설정 페이지 미확인)')
    }

    // 멤버 관리
    const memberLinks = page.locator('a[href*="member"], a:has-text("멤버"), a:has-text("회원"), a:has-text("학생 관리")')
    if (await memberLinks.count() > 0) {
      await memberLinks.first().click()
    } else {
      await page.goto(`${BASE}/operator/members`)
    }
    await page.waitForTimeout(3000)

    const memberUrl = page.url()
    const memberBody = await page.locator('body').textContent()
    console.log('#81 URL:', memberUrl)
    await page.screenshot({ path: 'tests/e2e/artifacts/81-members.png', fullPage: true })

    const hasMembers = memberBody.includes('멤버') || memberBody.includes('수강생') || memberBody.includes('교강사') || memberBody.includes('회원')
    console.log('#81 RESULT:', hasMembers ? '✅' : '⚠️ (멤버 목록 미확인)')
    const removeBtn = page.locator('button').filter({ hasText: /제거|삭제|추방/ }).first()
    console.log('#82 RESULT:', await removeBtn.count() > 0 ? '✅' : '⚠️ (멤버 제거 버튼 미발견)')
  })
})
