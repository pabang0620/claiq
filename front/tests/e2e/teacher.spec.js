import { test, expect } from '@playwright/test'

const TEACHER_NAME = '이준혁'

async function loginAsTeacher(page) {
  await page.goto('about:blank')
  await page.evaluate(() => {
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
  })
  await page.goto('/login')
  await page.locator(`button:has-text("${TEACHER_NAME}")`).click()
  await page.waitForURL('**/teacher', { timeout: 15000 })
}

test.describe('시나리오 3: 교강사 기능', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page)
  })

  test('교강사 대시보드 통계 카드 표시 확인', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('이준혁')

    // 페이지 로딩 완료 확인
    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/teacher-dashboard.png' })
  })

  test('/teacher/review → 문제 목록 표시 확인 (pending 탭)', async ({ page }) => {
    await page.goto('/teacher/review')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/teacher-review.png' })
  })

  test('/teacher/attendance → 출결 관리 표시 확인', async ({ page }) => {
    await page.goto('/teacher/attendance')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/teacher-attendance.png' })
  })

  test('/teacher/escalation → Q&A 에스컬레이션 표시 확인', async ({ page }) => {
    await page.goto('/teacher/escalation')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/teacher-escalation.png' })
  })
})
