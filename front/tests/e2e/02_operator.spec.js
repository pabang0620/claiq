import { test, expect } from '@playwright/test'

const ARTIFACTS = 'tests/e2e/artifacts'

async function loginAsOperator(page) {
  await page.goto('about:blank')
  await page.evaluate(() => {
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
  })
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('button').filter({ hasText: '정민석' }).first().click()
  await page.waitForURL('**/operator**', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

test.describe('운영자 기능', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOperator(page)
  })

  // T10: 대시보드 - 통계 요소 visible
  test('T10: 운영자 대시보드 - 통계 요소 visible', async ({ page }) => {
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    // 대시보드에 통계 카드나 숫자 요소가 있는지 확인
    const statsEl = page.locator('[class*="stat"], [class*="card"], [class*="metric"], h1, h2, h3').first()
    await expect(statsEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T10-operator-dashboard.png` })
  })

  // T11: 학원 설정 - 학원명, font-mono 코드 표시, '-' 아님
  test('T11: 학원 설정 - 학원명 및 API 코드 표시', async ({ page }) => {
    await page.locator('nav a[href*="/operator/settings"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    // 학원명 input 확인 (id="academy-name")
    const academyNameEl = page.locator('#academy-name, input[id*="academy"]').first()
    await expect(academyNameEl).toBeVisible({ timeout: 10000 })

    // font-mono 코드 요소 확인 (API 코드, 학원 코드 등)
    const codeEl = page.locator('[class*="font-mono"]').first()
    await expect(codeEl).toBeVisible({ timeout: 5000 })

    // 코드가 '-' 만 표시되지 않는지 확인
    const codeText = await codeEl.textContent()
    expect(codeText?.trim()).not.toBe('-')

    await page.screenshot({ path: `${ARTIFACTS}/T11-operator-settings.png` })
  })

  // T12: 회원 관리 - 목록 visible
  test('T12: 회원 관리 - 목록 visible', async ({ page }) => {
    await page.locator('nav a[href*="/operator/members"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    // 회원 목록 테이블 또는 카드 확인
    const listEl = page.locator('table, [class*="member"], [class*="user"], tr, [class*="list"]').first()
    await expect(listEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T12-operator-members.png` })
  })

  // T13: 이탈 위험 분석 - 페이지 접근
  test('T13: 이탈 위험 분석 - 페이지 접근', async ({ page }) => {
    await page.locator('nav a[href*="/operator/churn"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/operator/churn')
    // 페이지 내 콘텐츠 요소 확인
    const contentEl = page.locator('h1, h2, h3, [class*="churn"], [class*="risk"]').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T13-operator-churn.png` })
  })

  // T14: 강의 통계 - 페이지 접근
  test('T14: 강의 통계 - 페이지 접근', async ({ page }) => {
    await page.locator('nav a[href*="/operator/stats"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/operator/stats')
    const contentEl = page.locator('h1, h2, h3, [class*="stat"], [class*="chart"]').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T14-operator-stats.png` })
  })

  // T15: 성취 리포트 - 목록 visible
  test('T15: 성취 리포트 - 목록 visible', async ({ page }) => {
    await page.locator('nav a[href*="/operator/report"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/operator/report')
    // 리포트 목록 또는 콘텐츠 확인
    const listEl = page.locator('table, [class*="report"], [class*="list"], h1, h2').first()
    await expect(listEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/T15-operator-report.png` })
  })

  // T16: 학원 설정 저장 - 소개 수정 후 저장 버튼 클릭
  test('T16: 학원 설정 저장 - 소개 수정 후 저장', async ({ page }) => {
    await page.locator('nav a[href*="/operator/settings"]').click()
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    // 소개 입력 필드 (id="academy-desc")
    const descInput = page.locator('#academy-desc').first()
    await expect(descInput).toBeVisible({ timeout: 10000 })

    // 기존 내용 지우고 새 내용 입력
    await descInput.fill('E2E 테스트용 학원 소개입니다.')

    // 저장 버튼 클릭
    const saveBtn = page.locator('button').filter({ hasText: /저장|수정|업데이트/i }).first()
    await expect(saveBtn).toBeVisible()
    await saveBtn.click()

    // 저장 완료 대기
    await page.waitForTimeout(2000)

    await page.screenshot({ path: `${ARTIFACTS}/T16-operator-settings-save.png` })
  })
})
