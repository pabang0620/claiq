import { test, expect } from '@playwright/test'

const ARTIFACTS = 'tests/e2e/artifacts'

async function clearSession(page) {
  await page.goto('about:blank')
  await page.evaluate(() => {
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
  })
}

async function loginAs(page, name) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('button').filter({ hasText: name }).first().click()
}

test.describe('인증 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  // T01: 로그인 페이지 기본 렌더링
  test('T01: 로그인 페이지 기본 렌더링', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h2').first()).toBeVisible()
    await expect(page.locator('h2').first()).toContainText('로그인')

    // 데모 버튼 3개 확인
    await expect(page.locator('button').filter({ hasText: '정민석' }).first()).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '이준혁' }).first()).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '김민준' }).first()).toBeVisible()

    await page.screenshot({ path: `${ARTIFACTS}/T01-login-page.png` })
  })

  // T02: 운영자 데모 로그인 → /operator 리다이렉트
  test('T02: 운영자 데모 로그인 → /operator 리다이렉트', async ({ page }) => {
    await loginAs(page, '정민석')
    await page.waitForURL('**/operator**', { timeout: 15000 })
    expect(page.url()).toContain('/operator')
    await page.screenshot({ path: `${ARTIFACTS}/T02-operator-login.png` })
  })

  // T03: 교강사 데모 로그인 → /teacher 리다이렉트
  test('T03: 교강사 데모 로그인 → /teacher 리다이렉트', async ({ page }) => {
    await loginAs(page, '이준혁')
    await page.waitForURL('**/teacher**', { timeout: 15000 })
    expect(page.url()).toContain('/teacher')
    await page.screenshot({ path: `${ARTIFACTS}/T03-teacher-login.png` })
  })

  // T04: 수강생 데모 로그인 → /student 리다이렉트
  test('T04: 수강생 데모 로그인 → /student 리다이렉트', async ({ page }) => {
    await loginAs(page, '김민준')
    await page.waitForURL('**/student**', { timeout: 15000 })
    expect(page.url()).toContain('/student')
    await page.screenshot({ path: `${ARTIFACTS}/T04-student-login.png` })
  })

  // T05: 운영자 로그아웃 → /login 리다이렉트
  test('T05: 운영자 로그아웃 → /login 리다이렉트', async ({ page }) => {
    await loginAs(page, '정민석')
    await page.waitForURL('**/operator**', { timeout: 15000 })

    // 로딩 대기
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    // 로그아웃 버튼 클릭
    await page.locator('button[aria-label="로그아웃"]').click()
    // confirm 다이얼로그 확인 버튼
    await page.locator('button').filter({ hasText: '로그아웃' }).last().click()

    await page.waitForURL('**/login**', { timeout: 10000 })
    expect(page.url()).toContain('/login')
    await page.screenshot({ path: `${ARTIFACTS}/T05-operator-logout.png` })
  })

  // T06: 미인증 /operator 접근 → /login 리다이렉트
  test('T06: 미인증 /operator 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/operator')
    await page.waitForURL('**/login**', { timeout: 15000 })
    expect(page.url()).toContain('/login')
    await page.screenshot({ path: `${ARTIFACTS}/T06-unauthenticated-redirect.png` })
  })

  // T07: 잘못된 이메일 형식 → 에러 표시
  test('T07: 잘못된 이메일 형식 → 에러 표시', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="이메일"]').first()
    await emailInput.fill('jg@test.t')

    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('somepassword')

    // 폼 제출
    await page.locator('button[type="submit"]').first().click()

    // 이메일 유효성 에러 메시지 확인
    const errorMsg = page.locator('text=/올바른 이메일 형식/i')
    await expect(errorMsg).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/T07-invalid-email-error.png` })
  })

  // T08: 틀린 비밀번호 로그인 시도 (스크린샷만)
  test('T08: 틀린 비밀번호 로그인 시도', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="이메일"]').first()
    await emailInput.fill('admin@claiq.kr')

    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('wrongpassword123')

    await page.locator('button[type="submit"]').first().click()

    // 에러 응답 대기 (최대 5초)
    await page.waitForTimeout(3000)

    await page.screenshot({ path: `${ARTIFACTS}/T08-wrong-password.png` })
  })
})
