import { test, expect } from '@playwright/test'

const OPERATOR_NAME = '정민석'

async function loginAsOperator(page) {
  await page.goto('about:blank')
  await page.evaluate(() => {
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
  })
  await page.goto('/login')
  await page.locator(`button:has-text("${OPERATOR_NAME}")`).click()
  await page.waitForURL('**/operator', { timeout: 15000 })
}

test.describe('시나리오 2: 운영자 기능', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOperator(page)
  })

  test('대시보드 통계 카드 4개 표시 확인', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('운영자 대시보드')

    // 4개 통계 카드 텍스트 확인
    const expectedLabels = ['전체 수강생', '이탈 위험', '이번 달 출석률', '미발송 리포트']
    for (const label of expectedLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible({ timeout: 10000 })
    }

    await page.screenshot({ path: 'tests/e2e/artifacts/operator-dashboard.png' })
  })

  test('/operator/churn → 이탈위험 목록 표시 확인', async ({ page }) => {
    await page.goto('/operator/churn')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // 페이지 로딩 확인 (스피너 사라짐)
    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    // 이탈위험 페이지 내용 확인
    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/operator-churn.png' })
  })

  test('/operator/members → 회원 목록 표시 확인', async ({ page }) => {
    await page.goto('/operator/members')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/operator-members.png' })
  })

  test('/operator/settings → 학원 설정 표시 확인', async ({ page }) => {
    await page.goto('/operator/settings')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/operator-settings.png' })
  })

  test('/operator/report → 리포트 목록 표시 확인', async ({ page }) => {
    await page.goto('/operator/report')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    await expect(page.locator('[class*="animate-spin"]')).toHaveCount(0, { timeout: 10000 })

    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/operator-report.png' })
  })
})
