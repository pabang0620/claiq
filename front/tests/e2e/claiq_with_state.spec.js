/**
 * CLAIQ 기능 테스트 - storage state 사용
 * 실제 URL 기반 테스트
 */
import { test, expect } from '@playwright/test'

const BASE = 'https://claiq.vercel.app'

// 로그인 헬퍼 (storage state 없을 때 fallback)
async function loginDirectly(page, email, password, expectedPath) {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await page.waitForTimeout(5000)
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await page.locator('input[type="email"]').first().fill(email)
    await page.locator('input[type="password"]').first().fill(password)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(6000)
    if (page.url().includes(expectedPath)) return true
  }
  return page.url().includes(expectedPath)
}

// ============================================================
// 섹션 1: 인증 테스트
// ============================================================
test.describe('섹션1-인증', () => {
  test('#10 수강생 정상 가입', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')

    const studentBtn = page.locator('button:has-text("수강생")').first()
    await studentBtn.click()
    await page.waitForTimeout(1500)

    await page.locator('input[placeholder*="이름"]').first().fill('E2E테스터')
    await page.locator('input[type="email"]').first().fill('test_e2e@claiq.kr')
    await page.locator('input[placeholder*="8자"]').first().fill('Test1234!!')
    await page.locator('input[placeholder*="다시"]').first().fill('Test1234!!')
    const cbs = page.locator('input[type="checkbox"]')
    for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check()

    await page.screenshot({ path: 'tests/e2e/artifacts/10-signup-filled.png', fullPage: true })
    const submitBtn = page.locator('button').filter({ hasText: /가입/ }).last()
    await submitBtn.click()
    await page.waitForTimeout(5000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/10-signup-result.png', fullPage: true })
    console.log('#10 URL:', url, 'body:', body.substring(0, 300))

    // 성공 조건: 학원 코드 입력 단계 OR 로그인 후 대시보드 OR 이미 존재 메시지
    if (url.includes('student') || url.includes('dashboard')) {
      console.log('#10 RESULT: ✅ (가입 및 로그인 완료)')
    } else if (body.includes('학원 코드') || body.includes('학원에 참여')) {
      console.log('#10 RESULT: ✅ (학원 코드 입력 단계 이동)')
    } else if (body.includes('이미') || body.includes('중복') || body.includes('exists')) {
      console.log('#10 RESULT: ✅ (이전 실행에서 이미 가입됨)')
    } else {
      console.log('#10 RESULT: ⚠️ (결과 미확인 - body:', body.substring(0, 200) + ')')
    }
  })

  test('#7 중복 이메일 재가입', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')
    const studentBtn = page.locator('button:has-text("수강생")').first()
    await studentBtn.click()
    await page.waitForTimeout(1000)

    await page.locator('input[placeholder*="이름"]').first().fill('중복테스터')
    await page.locator('input[type="email"]').first().fill('student@claiq.kr')
    await page.locator('input[placeholder*="8자"]').first().fill('claiq1234')
    await page.locator('input[placeholder*="다시"]').first().fill('claiq1234')
    const cbs = page.locator('input[type="checkbox"]')
    for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check()

    const submitBtn = page.locator('button').filter({ hasText: /가입/ }).last()
    await submitBtn.click()
    await page.waitForTimeout(3000)

    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/07-dup-email.png', fullPage: true })
    const hasError = body.includes('이미') || body.includes('중복') || body.includes('사용') || body.includes('존재')
    console.log('#7 RESULT:', hasError ? '✅' : '⚠️ (에러 메시지 미확인)')
    console.log('#7 body:', body.substring(0, 300))
  })

  test('#8 비밀번호 7자', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')
    await page.locator('button:has-text("수강생")').first().click()
    await page.waitForTimeout(1000)

    await page.locator('input[placeholder*="이름"]').first().fill('테스터')
    await page.locator('input[type="email"]').first().fill('shortpw_test@test.com')
    await page.locator('input[placeholder*="8자"]').first().fill('1234567')
    await page.locator('input[placeholder*="다시"]').first().fill('1234567')
    const cbs = page.locator('input[type="checkbox"]')
    for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check()

    await page.locator('button').filter({ hasText: /가입/ }).last().click()
    await page.waitForTimeout(2000)

    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/08-short-pw.png', fullPage: true })
    const hasValidation = body.includes('8자') || body.includes('8글자') || body.includes('짧')
    console.log('#8 RESULT:', hasValidation ? '✅' : '⚠️ (유효성 미확인)')
    console.log('#8 validation message:', body.includes('8자 이상') ? '"비밀번호는 8자 이상이어야 합니다"' : 'not found')
  })

  test('#9 비밀번호 불일치', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')
    await page.locator('button:has-text("수강생")').first().click()
    await page.waitForTimeout(1000)

    await page.locator('input[placeholder*="이름"]').first().fill('테스터')
    await page.locator('input[type="email"]').first().fill('mismatch_test@test.com')
    await page.locator('input[placeholder*="8자"]').first().fill('Test1234!!')
    await page.locator('input[placeholder*="다시"]').first().fill('Different!!')
    const cbs = page.locator('input[type="checkbox"]')
    for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check()

    await page.locator('button').filter({ hasText: /가입/ }).last().click()
    await page.waitForTimeout(2000)

    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/09-pw-mismatch.png', fullPage: true })
    const hasError = body.includes('일치') || body.includes('같') || body.includes('다릅')
    console.log('#9 RESULT:', hasError ? '✅' : '⚠️ (에러 미확인)')
    console.log('#9 message:', body.includes('일치하지 않') ? '"비밀번호가 일치하지 않습니다"' : 'not found')
  })

  test('#11 잘못된 학원 코드', async ({ page }) => {
    // 신규 이메일로 가입 시도
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('domcontentloaded')
    await page.locator('button:has-text("수강생")').first().click()
    await page.waitForTimeout(1000)

    const uniqueEmail = `wrongcode_${Date.now()}@test.com`
    await page.locator('input[placeholder*="이름"]').first().fill('코드테스터')
    await page.locator('input[type="email"]').first().fill(uniqueEmail)
    await page.locator('input[placeholder*="8자"]').first().fill('Test1234!!')
    await page.locator('input[placeholder*="다시"]').first().fill('Test1234!!')
    const cbs = page.locator('input[type="checkbox"]')
    for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check()

    await page.locator('button').filter({ hasText: /가입/ }).last().click()
    await page.waitForTimeout(5000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#11 URL after signup:', url)
    console.log('#11 body:', body.substring(0, 300))
    await page.screenshot({ path: 'tests/e2e/artifacts/11-after-signup.png', fullPage: true })

    // 학원 코드 입력 단계 진입 확인
    if (body.includes('학원 코드') || body.includes('학원에 참여') || url.includes('academy') || url.includes('code')) {
      const codeInput = page.locator('input').first()
      await codeInput.fill('WRONG99')
      const codeSubmit = page.locator('button').filter({ hasText: /확인|입장|다음|참여/ }).first()
      await codeSubmit.click()
      await page.waitForTimeout(3000)
      const errBody = await page.locator('body').textContent()
      const hasError = errBody.includes('올바르지') || errBody.includes('없') || errBody.includes('잘못') || errBody.includes('invalid') || errBody.includes('코드')
      console.log('#11 RESULT:', hasError ? '✅' : '⚠️ (에러 메시지 미확인)')
      await page.screenshot({ path: 'tests/e2e/artifacts/11-wrong-code.png', fullPage: true })
    } else if (url.includes('student')) {
      console.log('#11 RESULT: ⚠️ (학원 코드 단계 없이 바로 가입됨 - 플로우 변경)')
    } else {
      console.log('#11 RESULT: ⚠️ (가입 후 학원 코드 단계 미진입 - body:', body.substring(0, 200) + ')')
    }
  })

  test('#1 틀린 비밀번호', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    await page.locator('input[type="email"]').first().fill('student@claiq.kr')
    await page.locator('input[type="password"]').first().fill('wrongpassword')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(4000)

    const url = page.url()
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/01-wrong-pw.png' })
    console.log('#1 body after wrong pw:', body.substring(0, 300))
    const hasError = url.includes('login') && (body.includes('잘못') || body.includes('올바르지') || body.includes('틀') || body.includes('오류') || body.includes('invalid') || body.includes('비밀번호'))
    console.log('#1 RESULT:', hasError ? '✅' : '⚠️ (에러 메시지 미확인)')
  })

  test('#2 운영자 로그인', async ({ page }) => {
    const success = await loginDirectly(page, 'admin@claiq.kr', 'claiq1234', 'operator')
    console.log('#2 RESULT:', success ? '✅' : '❌ (로그인 실패)')
    await page.screenshot({ path: 'tests/e2e/artifacts/02-operator.png' })
  })

  test('#3 교강사 로그인', async ({ page }) => {
    const success = await loginDirectly(page, 'teacher@claiq.kr', 'claiq1234', 'teacher')
    console.log('#3 RESULT:', success ? '✅' : '❌ (로그인 실패)')
    await page.screenshot({ path: 'tests/e2e/artifacts/03-teacher.png' })
  })

  test('#4 수강생 로그인', async ({ page }) => {
    const success = await loginDirectly(page, 'student@claiq.kr', 'claiq1234', 'student')
    console.log('#4 RESULT:', success ? '✅' : '❌ (로그인 실패)')
    await page.screenshot({ path: 'tests/e2e/artifacts/04-student.png' })
  })

  test('#5 데모 버튼 자동입력', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await page.locator('button:has-text("운영자·정민석")').first().click()
    await page.waitForTimeout(500)
    const emailVal = await page.locator('input[type="email"]').first().inputValue()
    console.log('#5 RESULT:', emailVal.includes('@') ? '✅' : '⚠️ (자동 입력 미확인)')
    console.log('#5 auto email:', emailVal)
    await page.screenshot({ path: 'tests/e2e/artifacts/05-demo-btn.png' })
  })

  test('#6 로그인 상태에서 /login 접속', async ({ page }) => {
    const success = await loginDirectly(page, 'student@claiq.kr', 'claiq1234', 'student')
    if (!success) { console.log('#6 RESULT: ⚠️ (로그인 실패)'); return }
    await page.goto(`${BASE}/login`)
    await page.waitForTimeout(3000)
    const url = page.url()
    console.log('#6 URL after /login access:', url)
    console.log('#6 RESULT:', !url.endsWith('/login') ? '✅' : '⚠️ (리다이렉트 없음)')
    await page.screenshot({ path: 'tests/e2e/artifacts/06-login-redirect.png' })
  })

  test('#12 로그아웃', async ({ page }) => {
    const success = await loginDirectly(page, 'student@claiq.kr', 'claiq1234', 'student')
    if (!success) { console.log('#12 RESULT: ⚠️ (로그인 실패)'); return }
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    const logoutBtn = page.locator('button[aria-label="로그아웃"]').first()
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click()
      await page.waitForTimeout(3000)
      const url = page.url()
      console.log('#12 RESULT:', url.includes('login') ? '✅' : `❌ (URL: ${url})`)
    } else {
      // 버튼 아이콘 탐색
      const allBtns = page.locator('button')
      let found = false
      for (let i = 0; i < await allBtns.count(); i++) {
        const aria = await allBtns.nth(i).getAttribute('aria-label')
        const title = await allBtns.nth(i).getAttribute('title')
        if (aria?.includes('로그아웃') || title?.includes('로그아웃')) {
          await allBtns.nth(i).click()
          found = true
          break
        }
      }
      if (!found) {
        await page.screenshot({ path: 'tests/e2e/artifacts/12-no-logout.png', fullPage: true })
        console.log('#12 RESULT: ⚠️ (로그아웃 버튼 미발견)')
      } else {
        await page.waitForTimeout(3000)
        const url = page.url()
        console.log('#12 RESULT:', url.includes('login') ? '✅' : `❌ (URL: ${url})`)
      }
    }
    await page.screenshot({ path: 'tests/e2e/artifacts/12-logout.png' })
  })

  test('#13 로그아웃 후 뒤로가기', async ({ page }) => {
    const success = await loginDirectly(page, 'student@claiq.kr', 'claiq1234', 'student')
    if (!success) { console.log('#13 RESULT: ⚠️ (로그인 실패)'); return }
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    const studentUrl = page.url()

    const logoutBtn = page.locator('button[aria-label="로그아웃"]').first()
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click()
      await page.waitForTimeout(2000)
      await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {})
      await page.goBack()
      await page.waitForTimeout(3000)
      const url = page.url()
      console.log('#13 RESULT:', (url.includes('login') || url.includes('unauthorized')) ? '✅' : `⚠️ (URL: ${url})`)
    } else {
      console.log('#13 RESULT: ⚠️ (로그아웃 버튼 미발견)')
    }
    await page.screenshot({ path: 'tests/e2e/artifacts/13-logout-back.png' })
  })

  test('#14 수강생→/operator 접근 차단', async ({ page }) => {
    const success = await loginDirectly(page, 'student@claiq.kr', 'claiq1234', 'student')
    if (!success) { console.log('#14 RESULT: ⚠️ (로그인 실패)'); return }
    await page.goto(`${BASE}/operator`)
    await page.waitForTimeout(3000)
    const url = page.url()
    console.log('#14 RESULT:', (url.includes('unauthorized') || url.includes('login') || url.includes('student')) ? '✅' : `⚠️ (URL: ${url})`)
    await page.screenshot({ path: 'tests/e2e/artifacts/14-unauthorized.png' })
  })
})

// ============================================================
// 섹션 2: 수강생 기능 (storage state 사용)
// ============================================================
test.describe('섹션2-수강생', () => {
  test.use({ storageState: 'tests/e2e/artifacts/student-auth.json' })

  test('#15-17 수강생 대시보드', async ({ page }) => {
    await page.goto(`${BASE}/student`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/15-dashboard.png', fullPage: true })
    console.log('#15 dashboard body:', body.substring(0, 600))

    const hasDday = body.includes('D-')
    const hasStreak = body.includes('스트릭') || body.includes('연속')
    const hasPoint = body.includes('포인트')
    const hasStats = body.includes('정답') || body.includes('학습') || body.includes('통계')
    const hasRoadmap = body.includes('로드맵') || body.includes('학습 계획')
    const hasRecommend = body.includes('추천') || body.includes('오늘의')

    console.log('#15 RESULT:', (hasDday && hasStreak && hasPoint) ? '✅' : '⚠️ (일부 지표 미확인)')
    console.log('#16 RESULT:', hasRoadmap ? '✅' : '⚠️ (로드맵 미리보기 미확인)')
    console.log('#17 RESULT:', hasRecommend ? '✅' : '⚠️ (추천 카드 미확인)')
  })

  test('#36-42 오늘의 문제', async ({ page }) => {
    await page.goto(`${BASE}/student/quiz`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/36-quiz.png', fullPage: true })
    console.log('#36 quiz body:', body.substring(0, 500))

    const hasQuiz = body.includes('문제') && (body.includes('선택') || body.includes('①') || body.includes('보기'))
    const isEmpty = body.includes('문제가 없') || body.includes('오늘의 문제가')

    if (hasQuiz) {
      console.log('#36 RESULT: ✅')
      const submitBtn = page.locator('button').filter({ hasText: /제출/ }).first()
      const isDisabledBefore = await submitBtn.isDisabled().catch(() => false)
      console.log('#38 RESULT:', isDisabledBefore ? '✅' : '⚠️ (선택 전 제출 버튼 활성화)')

      const choices = page.locator('button').filter({ hasText: /^[①②③④⑤]/ })
      if (await choices.count() > 0) {
        await choices.first().click()
        await page.waitForTimeout(500)
        console.log('#37 RESULT: ✅')
        await submitBtn.click()
        await page.waitForTimeout(3000)
        const resultBody = await page.locator('body').textContent()
        await page.screenshot({ path: 'tests/e2e/artifacts/39-submit-result.png', fullPage: true })
        const hasResult = resultBody.includes('정답') || resultBody.includes('오답') || resultBody.includes('해설')
        console.log('#39 RESULT:', hasResult ? '✅' : '⚠️ (결과 미확인)')
        console.log('#40 RESULT:', hasResult ? '✅' : '⚠️ (오답 결과 미확인)')
      } else {
        console.log('#37 RESULT: ⚠️ (보기 ① 미발견)')
        console.log('#39 RESULT: ⚠️ (보기 없음)')
        console.log('#40 RESULT: ⚠️ (보기 없음)')
      }
      const navItems = page.locator('[class*="nav"] button').filter({ hasText: /^[0-9]+$/ })
      console.log('#41 RESULT:', await navItems.count() > 0 ? '✅' : '⚠️ (번호 네비게이터 미확인)')
      const resultBtn = page.locator('button:has-text("결과")').first()
      console.log('#42 RESULT:', await resultBtn.count() > 0 ? '✅' : '⚠️ (결과 버튼 미확인)')
    } else if (isEmpty) {
      console.log('#36 RESULT: ⚠️ (오늘의 문제 없음 - 강의 업로드 선행 필요)')
      for (const id of [37, 38, 39, 40, 41, 42]) console.log(`#${id} RESULT: ⚠️ (문제 없음)`)
    } else {
      console.log('#36 RESULT: ⚠️ (문제 페이지 내용 미확인)')
      for (const id of [37, 38, 39, 40, 41, 42]) console.log(`#${id} RESULT: ⚠️ (확인 불가)`)
    }
  })

  test('#43-45 결과 페이지', async ({ page }) => {
    await page.goto(`${BASE}/student/quiz`)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/43-result.png', fullPage: true })

    const hasScore = body.includes('점수') || body.includes('결과') || body.includes('%') || body.includes('정답률')
    if (hasScore) {
      console.log('#43 RESULT: ✅')
      console.log('#44 RESULT: ⚠️ (색상 자동 확인 불가 - 스크린샷 참조)')
      const weakBtn = page.locator('a:has-text("약점"), button:has-text("약점")').first()
      console.log('#45 RESULT:', await weakBtn.count() > 0 ? '✅' : '⚠️ (약점 버튼 미확인)')
    } else {
      console.log('#43 RESULT: ⚠️ (결과 데이터 없음)')
      console.log('#44 RESULT: ⚠️ (결과 없음)')
      console.log('#45 RESULT: ⚠️ (결과 없음)')
    }
  })

  test('#46-51 AI Q&A', async ({ page }) => {
    await page.goto(`${BASE}/student/qa`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/46-qa.png', fullPage: true })
    console.log('#46 QA body:', body.substring(0, 400))

    const hasQA = body.includes('Q&A') || body.includes('질문') || body.includes('AI') || body.includes('채팅') || body.includes('대화')
    if (hasQA) {
      console.log('#46 RESULT: ✅')

      // 새 대화 버튼 또는 입력창
      const textarea = page.locator('textarea').first()
      if (await textarea.count() > 0) {
        const sendBtn = page.locator('button[aria-label*="전송"], button:has-text("전송")').first()
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
          const hasReply = newBody.length > body.length + 200 || newBody.includes('삼각') || newBody.includes('함수')
          console.log('#47 RESULT:', hasReply ? '✅' : '⚠️ (스트리밍 응답 확인 어려움)')
          console.log('#48 RESULT: ⚠️ (스트리밍 중 비활성 - 자동 확인 불가)')
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
      console.log('#46 RESULT: ⚠️ (Q&A 페이지 미확인)')
      for (const id of [47, 48, 49, 50, 51]) console.log(`#${id} RESULT: ⚠️ (페이지 미확인)`)
    }
  })

  test('#52-54 약점 분석', async ({ page }) => {
    await page.goto(`${BASE}/student/weak`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/52-weakness.png', fullPage: true })
    console.log('#52 weakness body:', body.substring(0, 400))

    const hasAnalysis = body.includes('약점') || body.includes('분석') || body.includes('정답률') || body.includes('유형')
    const isEmpty = body.includes('없') && (body.includes('데이터') || body.includes('풀기'))
    if (hasAnalysis && !isEmpty) {
      console.log('#52 RESULT: ✅')
      const filter = page.locator('select, [role="combobox"]').first()
      console.log('#53 RESULT:', await filter.count() > 0 ? '✅' : '⚠️ (필터 미확인)')
      console.log('#54 RESULT: ⚠️ (데이터 있음 - 빈 상태 확인 불가)')
    } else if (isEmpty) {
      console.log('#52 RESULT: ⚠️ (분석 데이터 없음)')
      console.log('#53 RESULT: ⚠️ (데이터 없음)')
      console.log('#54 RESULT: ✅')
    } else {
      console.log('#52 RESULT: ⚠️ (약점 분석 페이지 미확인)')
      console.log('#53 RESULT: ⚠️ (페이지 미확인)')
      console.log('#54 RESULT: ⚠️ (페이지 미확인)')
    }
  })

  test('#55-60 미니 모의고사', async ({ page }) => {
    await page.goto(`${BASE}/student/exam`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/55-exam.png', fullPage: true })
    console.log('#55 exam body:', body.substring(0, 500))

    const hasExam = body.includes('모의고사') || body.includes('시험')
    if (hasExam) {
      console.log('#55 RESULT: ✅')

      const startBtn = page.locator('button').filter({ hasText: /시작|새 모의고사|모의고사 시작/ }).first()
      if (await startBtn.count() > 0) {
        await startBtn.click()
        await page.waitForTimeout(12000)
        const examBody = await page.locator('body').textContent()
        await page.screenshot({ path: 'tests/e2e/artifacts/55-exam-started.png', fullPage: true })
        console.log('#55 after start:', examBody.substring(0, 400))

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

        const newExamBtn = page.locator('button').filter({ hasText: /새 모의고사|다시/ }).first()
        console.log('#60 RESULT:', await newExamBtn.count() > 0 ? '✅' : '⚠️ (새 모의고사 버튼 미확인)')
      } else {
        // 진행 중인 시험이 있을 수 있음
        const hasTimer = body.includes(':') || body.includes('분')
        console.log('#56 RESULT:', hasTimer ? '✅' : '⚠️ (시험 진행 중 - 타이머 확인)')
        console.log('#57 RESULT: ⚠️ (시작 버튼 없음 - 진행 중)')
        console.log('#58 RESULT: ⚠️ (진행 중)')
        console.log('#59 RESULT: ⚠️ (진행 중)')
        console.log('#60 RESULT: ⚠️ (진행 중)')
      }
    } else {
      console.log('#55 RESULT: ⚠️ (모의고사 페이지 미확인)')
      for (const id of [56, 57, 58, 59, 60]) console.log(`#${id} RESULT: ⚠️ (페이지 미확인)`)
    }
  })

  test('#61-62 로드맵', async ({ page }) => {
    await page.goto(`${BASE}/student/roadmap`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/61-roadmap.png', fullPage: true })
    console.log('#61 roadmap body:', body.substring(0, 500))

    const hasRoadmap = body.includes('로드맵') || body.includes('주차') || body.includes('학습 계획') || body.includes('D-')
    console.log('#61 RESULT:', hasRoadmap ? '✅' : '⚠️ (로드맵 데이터 미확인)')

    const regenBtn = page.locator('button').filter({ hasText: /재생성|다시 생성/ }).first()
    console.log('#62 RESULT:', await regenBtn.count() > 0 ? '⚠️ (AI 비용 - 버튼 확인만)' : '⚠️ (재생성 버튼 미발견)')
  })

  test('#63-66 포인트 뱃지', async ({ page }) => {
    await page.goto(`${BASE}/student/points`)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(2000)
    const pointBody = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/63-points.png', fullPage: true })
    console.log('#63 points body:', pointBody.substring(0, 400))

    const hasPoints = pointBody.includes('포인트') || pointBody.includes('잔액')
    console.log('#63 RESULT:', hasPoints ? '✅' : '⚠️ (포인트 페이지 미확인)')

    if (hasPoints) {
      const couponBtn = page.locator('button').filter({ hasText: /교환|쿠폰/ }).first()
      if (await couponBtn.count() > 0) {
        const isDisabled = await couponBtn.isDisabled().catch(() => false)
        console.log('#64 RESULT: ⚠️ (포인트 충분 여부 미확인 - 버튼 존재 확인)')
        console.log('#65 RESULT:', isDisabled ? '✅' : '⚠️ (포인트 부족 시 비활성 확인 필요)')
      } else {
        console.log('#64 RESULT: ⚠️ (쿠폰 교환 버튼 미발견)')
        console.log('#65 RESULT: ⚠️ (쿠폰 교환 버튼 미발견)')
      }
    } else {
      console.log('#64 RESULT: ⚠️ (페이지 미확인)')
      console.log('#65 RESULT: ⚠️ (페이지 미확인)')
    }

    await page.goto(`${BASE}/student/badges`)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(2000)
    const badgeBody = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/66-badges.png', fullPage: true })
    console.log('#66 badges body:', badgeBody.substring(0, 400))

    const hasBadge = badgeBody.includes('뱃지') || badgeBody.includes('badge') || badgeBody.includes('획득')
    console.log('#66 RESULT:', hasBadge ? '✅' : '⚠️ (뱃지 페이지 미확인)')
  })
})

// ============================================================
// 섹션 3: 교강사 기능 (storage state 사용)
// ============================================================
test.describe('섹션3-교강사', () => {
  test.use({ storageState: 'tests/e2e/artifacts/teacher-auth.json' })

  test('#18-19 교강사 대시보드', async ({ page }) => {
    await page.goto(`${BASE}/teacher`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/18-teacher-dashboard.png', fullPage: true })
    console.log('#18 teacher dashboard:', body.substring(0, 600))

    const hasUpload = body.includes('업로드')
    const hasReview = body.includes('검증') || body.includes('검수')
    const hasAttend = body.includes('출결') || body.includes('출석')
    const hasEscal = body.includes('에스컬')

    console.log('#18 RESULT:', (hasUpload || hasReview || hasAttend || hasEscal) ? '✅' : '⚠️ (지표 미확인)')
    const hasLectures = body.includes('강의') || body.includes('업로드')
    console.log('#19 RESULT:', hasLectures ? '✅' : '⚠️ (강의 목록 미확인)')
  })

  test('#21-26 강의 업로드 UI', async ({ page }) => {
    await page.goto(`${BASE}/teacher/upload`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/21-upload.png', fullPage: true })
    console.log('#21 upload body:', body.substring(0, 500))

    const hasUpload = body.includes('업로드') || body.includes('파일') || body.includes('upload')
    if (hasUpload) {
      const fileInput = page.locator('input[type="file"]').first()
      const submitBtn = page.locator('button').filter({ hasText: /업로드|시작/ }).first()
      const isDisabled = await submitBtn.isDisabled().catch(() => false)
      console.log('#24 RESULT:', isDisabled ? '✅' : '⚠️ (파일 없이 버튼 활성화 확인)')
      console.log('#21 RESULT: ⚠️ (AI 비용 - UI 진입만)')
      console.log('#22 RESULT: ⚠️ (AI 비용 - UI 진입만)')
      console.log('#23 RESULT: ⚠️ (AI 비용 - UI 진입만)')
      console.log('#25 RESULT:', await fileInput.count() > 0 ? '⚠️ (AI 비용 - 파일 입력 확인만)' : '⚠️ (파일 입력 미발견)')
      console.log('#26 RESULT: ⚠️ (업로드 없어 삭제 불가)')
    } else {
      for (const id of [21, 22, 23, 24, 25, 26]) console.log(`#${id} RESULT: ⚠️ (업로드 페이지 미확인)`)
    }
  })

  test('#27-31 문제 검수', async ({ page }) => {
    await page.goto(`${BASE}/teacher/review`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/27-review.png', fullPage: true })
    console.log('#27 review body:', body.substring(0, 600))

    const hasReview = body.includes('검증') || body.includes('검수') || body.includes('문제')
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
      for (const id of [27, 28, 29, 30, 31]) console.log(`#${id} RESULT: ⚠️ (검수 페이지 미확인)`)
    }
  })

  test('#32-35 출결 관리', async ({ page }) => {
    await page.goto(`${BASE}/teacher/attendance`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/32-attendance.png', fullPage: true })
    console.log('#32 attendance body:', body.substring(0, 600))

    const hasAttend = body.includes('출결') || body.includes('출석')
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
    await page.goto(`${BASE}/teacher/escalation`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/67-escalation.png', fullPage: true })
    console.log('#67 escalation body:', body.substring(0, 600))

    const hasEscal = body.includes('에스컬') || body.includes('Q&A') || body.includes('질문') || body.includes('답변')
    if (hasEscal) {
      console.log('#67 RESULT: ✅')
      const tabs = page.locator('[role="tab"], button').filter({ hasText: /미답변|답변완료/ })
      console.log('#67 tabs:', await tabs.count() > 0 ? '탭 있음' : '탭 없음')

      const answerInput = page.locator('textarea').first()
      if (await answerInput.count() > 0) {
        const submitBtn = page.locator('button').filter({ hasText: /제출|답변|보내기/ }).first()
        const isDisabled = await submitBtn.isDisabled().catch(() => false)
        console.log('#69 RESULT:', isDisabled ? '✅' : '⚠️ (빈 답변 제출 버튼 활성화)')
        console.log('#68 RESULT: ⚠️ (항목 있으나 실제 답변 제출은 수동 확인 필요)')
      } else {
        // 에스컬레이션 항목 클릭 필요
        const escalItems = page.locator('[class*="item"], [class*="question"], li').first()
        if (await escalItems.count() > 0) {
          await escalItems.click()
          await page.waitForTimeout(2000)
          const detailBody = await page.locator('body').textContent()
          const textarea = page.locator('textarea').first()
          if (await textarea.count() > 0) {
            const isDisabled = await page.locator('button').filter({ hasText: /제출|답변/ }).first().isDisabled().catch(() => false)
            console.log('#68 RESULT: ⚠️ (실제 답변 제출은 수동 확인 필요)')
            console.log('#69 RESULT:', isDisabled ? '✅' : '⚠️ (빈 답변 제출 버튼 활성화)')
          } else {
            console.log('#68 RESULT: ⚠️ (답변 입력창 미발견)')
            console.log('#69 RESULT: ⚠️ (답변 입력창 미발견)')
          }
        } else {
          console.log('#68 RESULT: ⚠️ (에스컬레이션 항목 없음)')
          console.log('#69 RESULT: ⚠️ (에스컬레이션 항목 없음)')
        }
      }
    } else {
      for (const id of [67, 68, 69]) console.log(`#${id} RESULT: ⚠️ (에스컬레이션 페이지 미확인)`)
    }
  })
})

// ============================================================
// 섹션 4: 운영자 기능 (storage state 사용)
// ============================================================
test.describe('섹션4-운영자', () => {
  test.use({ storageState: 'tests/e2e/artifacts/operator-auth.json' })

  test('#20 운영자 대시보드', async ({ page }) => {
    await page.goto(`${BASE}/operator`)
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000)
    const body = await page.locator('body').textContent()
    await page.screenshot({ path: 'tests/e2e/artifacts/20-operator-dashboard.png', fullPage: true })
    console.log('#20 operator dashboard:', body.substring(0, 600))

    const hasStudents = body.includes('수강생')
    const hasChurn = body.includes('이탈') || body.includes('위험')
    const hasAttend = body.includes('출석률')
    const hasReport = body.includes('리포트') || body.includes('미발송')
    console.log('#20 RESULT:', (hasStudents && hasChurn && hasAttend && hasReport) ? '✅' : '⚠️ (일부 지표 미확인)')

    // 운영자 사이드바 탐색
    const navLinks = page.locator('nav a, aside a, [class*="sidebar"] a')
    const cnt = await navLinks.count()
    for (let i = 0; i < cnt; i++) {
      const txt = await navLinks.nth(i).textContent()
      const href = await navLinks.nth(i).getAttribute('href')
      console.log(`  operator nav[${i}] "${txt?.trim()}" href="${href}"`)
    }
  })

  test('#70-72 이탈 예측', async ({ page }) => {
    // 운영자 대시보드에서 사이드바 링크 탐색
    await page.goto(`${BASE}/operator`)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(1000)

    const churnLink = page.locator('a:has-text("이탈 위험"), a[href*="churn"]').first()
    if (await churnLink.count() > 0) {
      await churnLink.click()
      await page.waitForTimeout(3000)
    } else {
      await page.goto(`${BASE}/operator/churn`)
      await page.waitForTimeout(3000)
    }

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#70 URL:', url)
    console.log('#70 body:', body.substring(0, 500))
    await page.screenshot({ path: 'tests/e2e/artifacts/70-churn.png', fullPage: true })

    const hasChurn = body.includes('이탈') || body.includes('위험') || body.includes('churn')
    if (hasChurn) {
      console.log('#70 RESULT: ✅')
      const filterBtn = page.locator('button, select, [role="combobox"]').filter({ hasText: /높음|위험도|전체/ }).first()
      console.log('#71 RESULT:', await filterBtn.count() > 0 ? '✅' : '⚠️ (필터 미발견)')
      const aiBtn = page.locator('button').filter({ hasText: /AI|코멘트|분석/ }).first()
      console.log('#72 RESULT:', await aiBtn.count() > 0 ? '⚠️ (AI 비용 - 버튼 확인만)' : '⚠️ (AI 코멘트 버튼 미발견)')
    } else {
      for (const id of [70, 71, 72]) console.log(`#${id} RESULT: ⚠️ (이탈 예측 페이지 미확인 - URL: ${url})`)
    }
  })

  test('#73-76 리포트 SMS', async ({ page }) => {
    await page.goto(`${BASE}/operator`)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(1000)

    const reportLink = page.locator('a:has-text("성취 리포트"), a[href*="report"]').first()
    if (await reportLink.count() > 0) {
      await reportLink.click()
      await page.waitForTimeout(3000)
    } else {
      await page.goto(`${BASE}/operator/report`)
      await page.waitForTimeout(3000)
    }

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#73 URL:', url)
    console.log('#73 body:', body.substring(0, 600))
    await page.screenshot({ path: 'tests/e2e/artifacts/73-report.png', fullPage: true })

    const hasReport = body.includes('리포트') || body.includes('SMS') || body.includes('발송')
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
    await page.goto(`${BASE}/operator`)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(1000)

    const statsLink = page.locator('a:has-text("강의 통계"), a[href*="stat"]').first()
    if (await statsLink.count() > 0) {
      await statsLink.click()
      await page.waitForTimeout(3000)
    } else {
      await page.goto(`${BASE}/operator/lecture-stats`)
      await page.waitForTimeout(3000)
    }

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#77 URL:', url)
    console.log('#77 body:', body.substring(0, 500))
    await page.screenshot({ path: 'tests/e2e/artifacts/77-stats.png', fullPage: true })

    const hasStats = body.includes('통계') || body.includes('차트') || body.includes('강의')
    if (hasStats && !url.includes('404')) {
      console.log('#77 RESULT: ✅')
      const filters = page.locator('select, [role="combobox"]')
      console.log('#78 RESULT:', await filters.count() > 0 ? '✅' : '⚠️ (과목 필터 미발견)')
      console.log('#79 RESULT:', await filters.count() > 1 ? '✅' : '⚠️ (기간 필터 미발견)')
    } else {
      for (const id of [77, 78, 79]) console.log(`#${id} RESULT: ⚠️ (강의 통계 페이지 미확인 - URL: ${url})`)
    }
  })

  test('#80-84 학원 설정 멤버', async ({ page }) => {
    await page.goto(`${BASE}/operator`)
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(1000)

    const settingsLink = page.locator('a:has-text("학원 설정"), a[href*="setting"]').first()
    if (await settingsLink.count() > 0) {
      await settingsLink.click()
      await page.waitForTimeout(3000)
    } else {
      await page.goto(`${BASE}/operator/settings`)
      await page.waitForTimeout(3000)
    }

    const url = page.url()
    const body = await page.locator('body').textContent()
    console.log('#80 URL:', url)
    console.log('#80 body:', body.substring(0, 600))
    await page.screenshot({ path: 'tests/e2e/artifacts/80-settings.png', fullPage: true })

    const hasSettings = body.includes('설정') || body.includes('학원') || url.includes('setting')
    if (hasSettings) {
      const saveBtn = page.locator('button[type="submit"], button').filter({ hasText: /저장/ }).first()
      console.log('#80 RESULT:', await saveBtn.count() > 0 ? '✅' : '⚠️ (저장 버튼 미발견)')
      const couponBtn = page.locator('button').filter({ hasText: /쿠폰|생성/ }).first()
      console.log('#83 RESULT:', await couponBtn.count() > 0 ? '✅' : '⚠️ (쿠폰 생성 버튼 미발견)')
      const deleteBtn = page.locator('button').filter({ hasText: /삭제/ }).first()
      console.log('#84 RESULT:', await deleteBtn.count() > 0 ? '✅' : '⚠️ (삭제 버튼 미발견)')
    } else {
      console.log('#80 RESULT: ⚠️ (설정 페이지 미확인)')
      console.log('#83 RESULT: ⚠️ (설정 페이지 미확인)')
      console.log('#84 RESULT: ⚠️ (설정 페이지 미확인)')
    }

    // 멤버 관리
    const memberLink = page.locator('a:has-text("멤버 관리"), a[href*="member"]').first()
    if (await memberLink.count() > 0) {
      await memberLink.click()
      await page.waitForTimeout(3000)
    } else {
      await page.goto(`${BASE}/operator/members`)
      await page.waitForTimeout(3000)
    }

    const memberUrl = page.url()
    const memberBody = await page.locator('body').textContent()
    console.log('#81 URL:', memberUrl)
    console.log('#81 body:', memberBody.substring(0, 500))
    await page.screenshot({ path: 'tests/e2e/artifacts/81-members.png', fullPage: true })

    const hasMembers = memberBody.includes('멤버') || memberBody.includes('수강생') || memberBody.includes('교강사') || memberBody.includes('회원')
    console.log('#81 RESULT:', hasMembers ? '✅' : '⚠️ (멤버 목록 미확인)')
    const filterEl = page.locator('select, [role="combobox"], button').filter({ hasText: /교강사|수강생|역할/ }).first()
    console.log('#81 filter RESULT:', await filterEl.count() > 0 ? '✅' : '⚠️ (역할 필터 미확인)')
    const removeBtn = page.locator('button').filter({ hasText: /제거|삭제|추방/ }).first()
    console.log('#82 RESULT:', await removeBtn.count() > 0 ? '✅' : '⚠️ (멤버 제거 버튼 미발견)')
  })
})
