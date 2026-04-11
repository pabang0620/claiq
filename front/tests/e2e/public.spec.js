import { test, expect } from '@playwright/test'

// 로그인 없이 접근 가능한 공개 페이지 테스트
test.describe('공개 페이지 접근성 테스트', () => {
  test('/login 페이지 정상 렌더링', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // CLAIQ 로그인 페이지 확인
    await expect(page.locator('h1:has-text("CLAIQ")')).toBeVisible()
    await expect(page.locator('h2:has-text("로그인")')).toBeVisible()

    // 이메일/비밀번호 입력 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // 데모 버튼 5개 확인 (운영자 1, 교강사 1, 수강생 3)
    const demoButtons = page.locator('button:has-text("정민석"), button:has-text("이준혁"), button:has-text("김민준"), button:has-text("최서아"), button:has-text("박지호")')
    await expect(demoButtons).toHaveCount(5)

    // 운영자/교강사/수강생 라벨 확인
    await expect(page.locator('text=운영자')).toBeVisible()
    await expect(page.locator('text=교강사')).toBeVisible()
    await expect(page.locator('text=수강생').first()).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/artifacts/public-login-page.png' })
  })

  test('/unauthorized 페이지 정상 렌더링', async ({ page }) => {
    await page.goto('/unauthorized')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('접근 권한이 없어요')
    await expect(page.locator('text=이 페이지에 접근할 권한이 없습니다')).toBeVisible()
    await expect(page.locator('text=홈으로 돌아가기')).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/artifacts/public-unauthorized-page.png' })
  })

  test('/ 루트 경로 → /login 리다이렉트 확인', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/login', { timeout: 10000 })
    expect(page.url()).toContain('/login')
    await page.screenshot({ path: 'tests/e2e/artifacts/public-root-redirect.png' })
  })

  test('미인증 상태에서 /operator 접근 → /login 리다이렉트 확인', async ({ page }) => {
    await page.goto('/operator')
    // 미인증이면 /login으로 리다이렉트
    await page.waitForURL('**/login', { timeout: 10000 })
    expect(page.url()).toContain('/login')
    await page.screenshot({ path: 'tests/e2e/artifacts/public-unauthenticated-redirect.png' })
  })

  test('미인증 상태에서 /teacher 접근 → /login 리다이렉트 확인', async ({ page }) => {
    await page.goto('/teacher')
    await page.waitForURL('**/login', { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('미인증 상태에서 /student 접근 → /login 리다이렉트 확인', async ({ page }) => {
    await page.goto('/student')
    await page.waitForURL('**/login', { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('로그인 폼 유효성 검사 - 빈 값 제출 시 에러 표시', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // 빈 상태로 제출
    await page.locator('button[type="submit"]').click()

    // 에러 메시지 표시 확인
    await expect(page.locator('text=이메일을 입력하세요')).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/public-login-validation.png' })
  })

  test('로그인 폼 유효성 검사 - 잘못된 이메일 형식', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.locator('input[type="email"]').fill('notanemail')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=올바른 이메일 형식이 아닙니다')).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/artifacts/public-login-invalid-email.png' })
  })
})
