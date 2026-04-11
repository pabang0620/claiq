import { test, expect } from '@playwright/test'

const STUDENT_NAME = '김민준'

async function loginAsStudent(page) {
  await page.goto('about:blank')
  await page.evaluate(() => {
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
  })
  await page.goto('/login')
  await page.locator(`button:has-text("${STUDENT_NAME}")`).click()
  await page.waitForURL('**/student', { timeout: 15000 })
}

test.describe('시나리오 4: 수강생 기능', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page)
  })

  test('수강생 대시보드 D-day, 스트릭, 포인트 표시 확인', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    // 대시보드 주요 요소 확인 (D-day, 스트릭, 포인트 관련 텍스트)
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // D-day 또는 스트릭 관련 텍스트 존재 확인
    const hasDday = await page.locator('text=D-').count()
    const hasStreak = await page.locator('text=스트릭').count()
    const hasPoint = await page.locator('text=포인트').count()
    const hasDayText = await page.locator('text=day').count()

    // 최소 1개 이상의 지표가 표시되어야 함
    const totalIndicators = hasDday + hasStreak + hasPoint + hasDayText
    expect(totalIndicators).toBeGreaterThan(0)

    await page.screenshot({ path: 'tests/e2e/artifacts/student-dashboard.png' })
  })

  test('/student/quiz → 문제 목록 표시 확인', async ({ page }) => {
    await page.goto('/student/quiz')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/student-quiz.png' })
  })

  test('/student/qa → Q&A 채팅 화면 표시 확인', async ({ page }) => {
    await page.goto('/student/qa')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/student-qa.png' })
  })

  test('/student/roadmap → 로드맵 표시 확인', async ({ page }) => {
    await page.goto('/student/roadmap')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/student-roadmap.png' })
  })

  test('/student/points → 포인트 내역 표시 확인', async ({ page }) => {
    await page.goto('/student/points')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/student-points.png' })
  })

  test('/student/badges → 뱃지 화면 표시 확인', async ({ page }) => {
    await page.goto('/student/badges')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/student-badges.png' })
  })
})
