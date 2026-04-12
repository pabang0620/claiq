import { test, expect } from '@playwright/test'

const ARTIFACTS = 'tests/e2e/artifacts'

async function loginAsStudent(page) {
  await page.goto('about:blank')
  await page.evaluate(() => {
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
  })
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('button').filter({ hasText: '김민준' }).first().click()
  await page.waitForURL('**/student**', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

test.describe('수강생 기능', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page)
  })

  // T30: 대시보드 - h1/h2 visible
  test('T30: 수강생 대시보드 - 콘텐츠 visible', async ({ page }) => {
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    const contentEl = page.locator('h1, h2').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T30-student-dashboard.png` })
  })

  // T31: 문제 풀기 - 문제 카드 또는 '문제' 텍스트
  test('T31: 문제 풀기 - 문제 카드 또는 텍스트 visible', async ({ page }) => {
    await page.locator('nav a[href*="/student/quiz"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/student/quiz')

    // 문제 카드 또는 '문제' 텍스트 확인
    const quizEl = page.locator('[class*="quiz"], [class*="question"], [class*="card"]').first()
    const hasQuiz = await quizEl.isVisible().catch(() => false)

    if (!hasQuiz) {
      // 대안: '문제' 텍스트 포함 요소 확인
      const textEl = page.locator('text=/문제/i').first()
      await expect(textEl).toBeVisible({ timeout: 5000 })
    }

    await page.screenshot({ path: `${ARTIFACTS}/T31-student-quiz.png` })
  })

  // T32: AI Q&A - textarea 또는 input visible
  test('T32: AI Q&A - 입력창 visible', async ({ page }) => {
    await page.locator('nav a[href*="/student/qa"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/student/qa')

    const inputEl = page.locator('textarea, input[type="text"]').first()
    await expect(inputEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T32-student-qa.png` })
  })

  // T33: 약점 분석 - h1/h2 visible
  test('T33: 약점 분석 - 헤딩 visible', async ({ page }) => {
    await page.locator('nav a[href*="/student/weak"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/student/weak')

    const headingEl = page.locator('h1, h2').first()
    await expect(headingEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T33-student-weak.png` })
  })

  // T34: 학습 로드맵 - h1/h2 visible
  test('T34: 학습 로드맵 - 헤딩 visible', async ({ page }) => {
    await page.locator('nav a[href*="/student/roadmap"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/student/roadmap')

    const headingEl = page.locator('h1, h2').first()
    await expect(headingEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T34-student-roadmap.png` })
  })

  // T35: 모의고사 - h1/h2 또는 버튼 visible
  test('T35: 모의고사 - 콘텐츠 visible', async ({ page }) => {
    await page.locator('nav a[href*="/student/exam"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/student/exam')

    const contentEl = page.locator('h1, h2, button').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T35-student-exam.png` })
  })

  // T36: 포인트 - h1/h2 visible
  test('T36: 포인트 - 헤딩 visible', async ({ page }) => {
    await page.locator('nav a[href*="/student/points"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/student/points')

    const headingEl = page.locator('h1, h2').first()
    await expect(headingEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T36-student-points.png` })
  })

  // T37: 뱃지 - h1/h2 visible
  test('T37: 뱃지 - 헤딩 visible', async ({ page }) => {
    await page.locator('nav a[href*="/student/badges"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/student/badges')

    const headingEl = page.locator('h1, h2').first()
    await expect(headingEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T37-student-badges.png` })
  })

  // T38: 강의 자료 - h1/h2 visible
  test('T38: 강의 자료 - 헤딩 visible', async ({ page }) => {
    await page.locator('nav a[href*="/student/materials"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/student/materials')

    const headingEl = page.locator('h1, h2').first()
    await expect(headingEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T38-student-materials.png` })
  })
})
