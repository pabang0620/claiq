import { test, expect } from '@playwright/test'

const ARTIFACTS = 'tests/e2e/artifacts'

async function loginAsTeacher(page) {
  await page.goto('about:blank')
  await page.evaluate(() => {
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
  })
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('button').filter({ hasText: '이준혁' }).first().click()
  await page.waitForURL('**/teacher**', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

test.describe('교강사 기능', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page)
  })

  // T20: 대시보드 - h1 또는 통계 visible
  test('T20: 교강사 대시보드 - 콘텐츠 visible', async ({ page }) => {
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    const contentEl = page.locator('h1, h2, [class*="stat"], [class*="card"], [class*="dashboard"]').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T20-teacher-dashboard.png` })
  })

  // T21: 강의 업로드 - 폼 요소 visible
  test('T21: 강의 업로드 - 폼 요소 visible', async ({ page }) => {
    await page.locator('nav a[href*="/teacher/upload"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/teacher/upload')

    // 업로드 폼 요소 확인 (input file, 버튼, 제목 입력 등)
    const formEl = page.locator('input[type="file"], input[type="text"], textarea, form, button, [class*="upload"], [class*="drop"]').first()
    await expect(formEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T21-teacher-upload.png` })
  })

  // T22: 문제 검수 - 목록 또는 탭 visible
  test('T22: 문제 검수 - 목록 또는 탭 visible', async ({ page }) => {
    await page.locator('nav a[href*="/teacher/review"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/teacher/review')

    // 목록 또는 탭 확인
    const contentEl = page.locator('table, [role="tab"], [class*="tab"], [class*="list"], [class*="review"], h1, h2').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T22-teacher-review.png` })
  })

  // T23: 출결 관리 - 페이지 접근
  test('T23: 출결 관리 - 페이지 접근', async ({ page }) => {
    await page.locator('nav a[href*="/teacher/attendance"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/teacher/attendance')
    const contentEl = page.locator('h1, h2, h3, table, [class*="attend"]').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T23-teacher-attendance.png` })
  })

  // T24: Q&A 에스컬레이션 - 목록 접근
  test('T24: Q&A 에스컬레이션 - 목록 접근', async ({ page }) => {
    await page.locator('nav a[href*="/teacher/escalation"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/teacher/escalation')
    const contentEl = page.locator('h1, h2, h3, [class*="question"], [class*="qa"], [class*="escalat"], table').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T24-teacher-escalation.png` })
  })

  // T25: 강의 자료 - 페이지 접근
  test('T25: 강의 자료 - 페이지 접근', async ({ page }) => {
    await page.locator('nav a[href*="/teacher/materials"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/teacher/materials')
    const contentEl = page.locator('h1, h2, h3, [class*="material"], [class*="file"], [class*="lecture"]').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T25-teacher-materials.png` })
  })
})
