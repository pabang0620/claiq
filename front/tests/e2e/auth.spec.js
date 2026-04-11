import { test, expect } from '@playwright/test'

const OPERATOR_NAME = '정민석'
const TEACHER_NAME = '이준혁'
const STUDENT_NAME = '김민준'

test.describe('시나리오 1: 인증 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank')
    await page.evaluate(() => {
      try { localStorage.clear() } catch (_) {}
      try { sessionStorage.clear() } catch (_) {}
    })
  })

  test('운영자 데모 로그인 → /operator 리다이렉트 확인', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h2')).toContainText('로그인')

    // 운영자 데모 버튼 클릭
    const operatorBtn = page.locator(`button:has-text("${OPERATOR_NAME}")`)
    await expect(operatorBtn).toBeVisible()
    await operatorBtn.click()

    // /operator 리다이렉트 확인
    await page.waitForURL('**/operator', { timeout: 15000 })
    expect(page.url()).toContain('/operator')
    await page.screenshot({ path: 'tests/e2e/artifacts/auth-operator-login.png' })
  })

  test('운영자 로그아웃 → /login 리다이렉트 확인', async ({ page }) => {
    // 운영자 로그인
    await page.goto('/login')
    await page.locator(`button:has-text("${OPERATOR_NAME}")`).click()
    await page.waitForURL('**/operator', { timeout: 15000 })

    // 로그아웃 버튼 클릭 (Header의 LogOut 아이콘)
    const logoutBtn = page.locator('button[aria-label="로그아웃"]')
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    // /login 리다이렉트 확인
    await page.waitForURL('**/login', { timeout: 10000 })
    expect(page.url()).toContain('/login')
    await page.screenshot({ path: 'tests/e2e/artifacts/auth-operator-logout.png' })
  })

  test('교강사 데모 로그인 → /teacher 리다이렉트 확인', async ({ page }) => {
    await page.goto('/login')

    const teacherBtn = page.locator(`button:has-text("${TEACHER_NAME}")`)
    await expect(teacherBtn).toBeVisible()
    await teacherBtn.click()

    await page.waitForURL('**/teacher', { timeout: 15000 })
    expect(page.url()).toContain('/teacher')
    await page.screenshot({ path: 'tests/e2e/artifacts/auth-teacher-login.png' })
  })

  test('교강사 로그아웃 → 수강생 로그인 → /student 리다이렉트 확인', async ({ page }) => {
    // 교강사 로그인 후 로그아웃
    await page.goto('/login')
    await page.locator(`button:has-text("${TEACHER_NAME}")`).click()
    await page.waitForURL('**/teacher', { timeout: 15000 })

    await page.locator('button[aria-label="로그아웃"]').click()
    await page.waitForURL('**/login', { timeout: 10000 })

    // 수강생 데모 버튼 클릭
    const studentBtn = page.locator(`button:has-text("${STUDENT_NAME}")`)
    await expect(studentBtn).toBeVisible()
    await studentBtn.click()

    await page.waitForURL('**/student', { timeout: 15000 })
    expect(page.url()).toContain('/student')
    await page.screenshot({ path: 'tests/e2e/artifacts/auth-student-login.png' })
  })

  test('수강생 상태에서 /operator 직접 접근 → /unauthorized 확인', async ({ page }) => {
    // 수강생 로그인
    await page.goto('/login')
    await page.locator(`button:has-text("${STUDENT_NAME}")`).click()
    await page.waitForURL('**/student', { timeout: 15000 })

    // /operator 직접 접근 시도
    await page.goto('/operator')
    await page.waitForURL('**/unauthorized', { timeout: 10000 })
    expect(page.url()).toContain('/unauthorized')

    // UnauthorizedPage 텍스트 확인
    await expect(page.locator('h1')).toContainText('접근 권한이 없어요')
    await page.screenshot({ path: 'tests/e2e/artifacts/auth-unauthorized.png' })
  })
})
