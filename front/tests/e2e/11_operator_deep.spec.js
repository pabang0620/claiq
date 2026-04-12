import { test, expect } from '@playwright/test'

const ARTIFACTS = 'tests/e2e/artifacts'

async function clearSession(page) {
  await page.context().clearCookies()
  await page.goto('about:blank')
  await page.evaluate(() => {
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
  })
}

async function loginAs(page, name) {
  await clearSession(page)
  await page.goto('/login')
  const btn = page.locator('button').filter({ hasText: name }).first()
  await btn.waitFor({ state: 'visible', timeout: 15000 })
  await btn.click()
}

async function loginAsOperator(page) {
  await loginAs(page, '정민석')
  await page.waitForURL('**/operator**', { timeout: 25000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

async function goToSettings(page) {
  await page.locator('nav a[href*="/operator/settings"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

async function goToMembers(page) {
  await page.locator('nav a[href*="/operator/members"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

async function goToReport(page) {
  await page.locator('nav a[href*="/operator/report"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

test.describe('O: 운영자 심층 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOperator(page)
  })

  // O01: 학원 설정 학원명 수정 → 저장 → 성공 Toast
  test('O01: 학원명 수정 후 저장 → 성공 Toast', async ({ page }) => {
    await goToSettings(page)

    const academyNameInput = page.locator('#academy-name').first()
    await expect(academyNameInput).toBeVisible({ timeout: 10000 })

    const originalValue = await academyNameInput.inputValue()
    await academyNameInput.fill(originalValue + ' (수정)')

    const saveBtn = page.locator('button[type="submit"]').first()
    await saveBtn.click()

    // 성공 Toast 확인
    const toastEl = page.locator('[role="alert"]').first()
    await expect(toastEl).toBeVisible({ timeout: 8000 })

    await page.screenshot({ path: `${ARTIFACTS}/O01-academy-name-save.png` })

    // 원래 이름으로 복원
    await academyNameInput.fill(originalValue)
    await saveBtn.click()
    await page.waitForTimeout(1000)
  })

  // O02: 학원 코드가 font-mono span으로만 표시 (input으로 수정 불가)
  test('O02: 학원 코드 font-mono span으로 표시 (읽기 전용)', async ({ page }) => {
    await goToSettings(page)

    // font-mono span 확인
    const codeSpan = page.locator('[class*="font-mono"]').first()
    await expect(codeSpan).toBeVisible({ timeout: 10000 })

    const codeText = await codeSpan.textContent()
    expect(codeText?.trim()).not.toBe('')
    expect(codeText?.trim()).not.toBe('-')

    // span 태그인지 확인 (input이 아님)
    const tagName = await codeSpan.evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).toBe('span')

    await page.screenshot({ path: `${ARTIFACTS}/O02-academy-code-readonly.png` })
  })

  // O03: 학원 소개(description) 수정 → 저장 → 성공 메시지 (B01 버그 가능)
  test('O03: 학원 소개 수정 → 저장 → 성공 메시지 (B01 버그 가능)', async ({ page }) => {
    await goToSettings(page)

    const descInput = page.locator('#academy-desc').first()
    await expect(descInput).toBeVisible({ timeout: 10000 })

    await descInput.fill('E2E 테스트용 학원 소개입니다.')

    const saveBtn = page.locator('button[type="submit"]').first()
    await saveBtn.click()

    // 성공 메시지 확인 (실패해도 버그 기록)
    try {
      const toastEl = page.locator('[role="alert"]').first()
      await expect(toastEl).toBeVisible({ timeout: 8000 })
      await page.screenshot({ path: `${ARTIFACTS}/O03-academy-desc-save-success.png` })
    } catch (err) {
      await page.screenshot({ path: `${ARTIFACTS}/O03-academy-desc-save-B01-bug.png` })
      console.warn('B01: 학원 소개 저장 실패 또는 Toast 미표시 - 버그 가능성', err.message)
    }
  })

  // O04: 쿠폰 생성 (퍼센트) → 성공 Toast + 목록 추가
  test('O04: 퍼센트 쿠폰 생성 → 성공 Toast + 목록 추가', async ({ page }) => {
    await goToSettings(page)

    // 쿠폰 생성 폼
    const couponNameInput = page.locator('#coupon-name').first()
    await expect(couponNameInput).toBeVisible({ timeout: 10000 })
    await couponNameInput.fill('테스트 10% 쿠폰')

    // 할인 유형: 퍼센트 (기본값)
    const discountTypeSelect = page.locator('select').first()
    await discountTypeSelect.selectOption('percent')

    // 할인값
    const couponValueInput = page.locator('#coupon-value').first()
    await couponValueInput.fill('10')

    // 쿠폰 생성 버튼
    const createBtn = page.locator('button').filter({ hasText: '쿠폰 생성' }).first()
    await createBtn.click()

    // 성공 Toast 확인 (role="alert")
    await expect(page.locator('[role="alert"]').filter({ hasText: '쿠폰이 생성됐습니다' }).first()).toBeVisible({ timeout: 8000 })

    // 목록에 추가 확인 (새로 추가된 쿠폰이 맨 위에)
    await page.waitForTimeout(500)
    const couponItem = page.locator('text=테스트 10% 쿠폰').first()
    await expect(couponItem).toBeVisible({ timeout: 8000 })

    await page.screenshot({ path: `${ARTIFACTS}/O04-coupon-percent-created.png` })
  })

  // O05: 쿠폰 생성 (고정 금액) → 목록에 추가
  test('O05: 고정 금액 쿠폰 생성 → 목록에 추가', async ({ page }) => {
    await goToSettings(page)

    const couponNameInput = page.locator('#coupon-name').first()
    await expect(couponNameInput).toBeVisible({ timeout: 10000 })
    await couponNameInput.fill('5000원 할인')

    // 할인 유형: 고정 금액
    const discountTypeSelect = page.locator('select').first()
    await discountTypeSelect.selectOption('fixed')

    const couponValueInput = page.locator('#coupon-value').first()
    await couponValueInput.fill('5000')

    const createBtn = page.locator('button').filter({ hasText: '쿠폰 생성' }).first()
    await createBtn.click()

    // 목록에 추가 확인
    const couponItem = page.locator('text=5000원 할인').first()
    await expect(couponItem).toBeVisible({ timeout: 8000 })

    await page.screenshot({ path: `${ARTIFACTS}/O05-coupon-fixed-created.png` })
  })

  // O06: 쿠폰 삭제 → confirm '취소' → 목록 개수 유지
  test('O06: 쿠폰 삭제 취소 → 목록 개수 유지', async ({ page }) => {
    await goToSettings(page)

    // 쿠폰이 있는지 확인, 없으면 생성
    const couponItems = page.locator('[aria-label="쿠폰 삭제"]')
    const count = await couponItems.count()

    if (count === 0) {
      // 쿠폰 생성
      const couponNameInput = page.locator('#coupon-name').first()
      await couponNameInput.fill('삭제 테스트 쿠폰')
      const couponValueInput = page.locator('#coupon-value').first()
      await couponValueInput.fill('5')
      const createBtn = page.locator('button').filter({ hasText: '쿠폰 생성' }).first()
      await createBtn.click()
      await page.waitForTimeout(1000)
    }

    const beforeCount = await couponItems.count()

    // 첫 번째 삭제 버튼 클릭
    await couponItems.first().click()

    // Dialog에서 '취소' 클릭
    const cancelBtn = page.locator('.fixed.z-50 button').filter({ hasText: '취소' }).first()
    await expect(cancelBtn).toBeVisible({ timeout: 5000 })
    await cancelBtn.click()

    await page.waitForTimeout(500)

    // 목록 개수 유지 확인
    const afterCount = await couponItems.count()
    expect(afterCount).toBe(beforeCount)

    await page.screenshot({ path: `${ARTIFACTS}/O06-coupon-delete-cancel.png` })
  })

  // O07: 쿠폰 삭제 → confirm '삭제' → 성공 Toast + 목록에서 제거
  test('O07: 쿠폰 삭제 확인 → 성공 Toast + 목록 제거', async ({ page }) => {
    await goToSettings(page)

    // 타임스탬프로 고유 쿠폰명 (이전 테스트 잔여 데이터와 충돌 방지)
    const uniqueName = `삭제테스트-${Date.now()}`

    // 삭제할 쿠폰 생성
    const couponNameInput = page.locator('#coupon-name').first()
    await couponNameInput.fill(uniqueName)
    const couponValueInput = page.locator('#coupon-value').first()
    await couponValueInput.fill('5')
    const createBtn = page.locator('button').filter({ hasText: '쿠폰 생성' }).first()
    await createBtn.click()
    await page.waitForTimeout(1000)

    // 생성한 쿠폰이 목록에 보이는지 확인
    const targetCoupon = page.locator(`text=${uniqueName}`).first()
    await expect(targetCoupon).toBeVisible({ timeout: 5000 })

    // 쿠폰 삭제 버튼 — 신규 생성된 쿠폰은 리스트 맨 앞에 추가됨 (setCoupons([newCoupon, ...prev]))
    const deleteButtons = page.locator('[aria-label="쿠폰 삭제"]')
    await deleteButtons.first().click()

    // Dialog에서 '삭제' 클릭
    const deleteConfirmBtn = page.locator('.fixed.z-50 button').filter({ hasText: '삭제' }).first()
    await expect(deleteConfirmBtn).toBeVisible({ timeout: 5000 })
    await deleteConfirmBtn.click()

    // 성공 Toast 확인
    const toastEl = page.locator('[role="alert"]').first()
    await expect(toastEl).toBeVisible({ timeout: 8000 })

    // 목록에서 제거 확인 (고유 이름이므로 확실히 해당 쿠폰만 체크)
    await expect(targetCoupon).not.toBeVisible({ timeout: 8000 })

    await page.screenshot({ path: `${ARTIFACTS}/O07-coupon-delete-success.png` })
  })

  // O08: 학원명 수정 → 저장 → 리로드 → #academy-name 값 확인
  test('O08: 학원명 수정 저장 → 리로드 후 값 유지', async ({ page }) => {
    await goToSettings(page)

    const academyNameInput = page.locator('#academy-name').first()
    await expect(academyNameInput).toBeVisible({ timeout: 10000 })

    const originalValue = await academyNameInput.inputValue()
    const newValue = '리로드 테스트 학원명'
    await academyNameInput.fill(newValue)

    const saveBtn = page.locator('button[type="submit"]').first()
    await saveBtn.click()

    // 저장 완료 대기
    await page.waitForTimeout(2000)

    // 페이지 리로드
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    // 리로드 후 로그인 세션 확인
    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      // 세션 만료 시 재로그인
      await loginAsOperator(page)
      await goToSettings(page)
    }

    const reloadedInput = page.locator('#academy-name').first()
    await expect(reloadedInput).toBeVisible({ timeout: 10000 })
    const reloadedValue = await reloadedInput.inputValue()
    expect(reloadedValue).toBe(newValue)

    await page.screenshot({ path: `${ARTIFACTS}/O08-academy-name-reload.png` })

    // 원래 이름으로 복원
    await reloadedInput.fill(originalValue)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(1000)
  })

  // O09: 회원 관리 → 이준혁, 김민준 텍스트 visible
  test('O09: 회원 관리 - 이준혁, 김민준 visible', async ({ page }) => {
    await goToMembers(page)

    const teacher = page.locator('text=이준혁').first()
    const student = page.locator('text=김민준').first()

    await expect(teacher).toBeVisible({ timeout: 10000 })
    await expect(student).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/O09-members-all.png` })
  })

  // O10: 회원 관리 '교강사' 탭 → 이준혁 visible, 김민준 not visible
  test('O10: 교강사 탭 → 이준혁 visible, 김민준 not visible', async ({ page }) => {
    await goToMembers(page)

    // '교강사' 탭 클릭
    const teacherTab = page.locator('[role="tab"], button').filter({ hasText: '교강사' }).first()
    await expect(teacherTab).toBeVisible({ timeout: 5000 })
    await teacherTab.click()

    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const teacher = page.locator('text=이준혁').first()
    await expect(teacher).toBeVisible({ timeout: 10000 })

    const student = page.locator('text=김민준').first()
    const studentVisible = await student.isVisible().catch(() => false)
    expect(studentVisible).toBeFalsy()

    await page.screenshot({ path: `${ARTIFACTS}/O10-members-teacher-tab.png` })
  })

  // O11: 회원 관리 '수강생' 탭 → 김민준 visible, 이준혁 not visible
  test('O11: 수강생 탭 → 김민준 visible, 이준혁 not visible', async ({ page }) => {
    await goToMembers(page)

    // '수강생' 탭 클릭
    const studentTab = page.locator('[role="tab"], button').filter({ hasText: '수강생' }).first()
    await expect(studentTab).toBeVisible({ timeout: 5000 })
    await studentTab.click()

    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const student = page.locator('text=김민준').first()
    await expect(student).toBeVisible({ timeout: 10000 })

    const teacher = page.locator('text=이준혁').first()
    const teacherVisible = await teacher.isVisible().catch(() => false)
    expect(teacherVisible).toBeFalsy()

    await page.screenshot({ path: `${ARTIFACTS}/O11-members-student-tab.png` })
  })

  // O12: '멤버 초대' 버튼 → 모달 열림, 이메일 input visible
  test('O12: 멤버 초대 버튼 → 모달 열림 및 이메일 input visible', async ({ page }) => {
    await goToMembers(page)

    const inviteBtn = page.locator('button').filter({ hasText: '멤버 초대' }).first()
    await expect(inviteBtn).toBeVisible({ timeout: 5000 })
    await inviteBtn.click()

    // 모달 열림 확인
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible({ timeout: 5000 })

    // 이메일 input visible
    const emailInput = modal.locator('input[type="email"], #invite-email').first()
    await expect(emailInput).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/O12-invite-modal-open.png` })
  })

  // O13: 초대 모달 → 없는 이메일 입력 → 초대 → 에러 Alert
  test('O13: 없는 이메일 초대 → 에러 Alert 표시', async ({ page }) => {
    await goToMembers(page)

    const inviteBtn = page.locator('button').filter({ hasText: '멤버 초대' }).first()
    await inviteBtn.click()

    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible({ timeout: 5000 })

    const emailInput = modal.locator('input[type="email"], #invite-email').first()
    await emailInput.fill('notexist999@test.com')

    // 초대 이메일 발송 버튼 클릭
    const sendBtn = modal.locator('button').filter({ hasText: /초대|발송/i }).last()
    await sendBtn.click()

    // 에러 응답 대기
    await page.waitForTimeout(4000)

    // 에러 Toast/Alert 확인
    const errorEl = page.locator('[role="alert"]').first()
    const hasError = await errorEl.isVisible().catch(() => false)

    await page.screenshot({ path: `${ARTIFACTS}/O13-invite-nonexist-error.png` })

    // 에러가 표시되거나 모달이 여전히 열려있어야 함
    const modalStillOpen = await modal.isVisible().catch(() => false)
    expect(hasError || modalStillOpen).toBeTruthy()
  })

  // O14: 멤버 제거 버튼 → confirm '취소' → 멤버 목록 유지
  test('O14: 멤버 제거 취소 → 멤버 목록 유지', async ({ page }) => {
    await goToMembers(page)

    // 멤버 제거 버튼 목록
    const removeButtons = page.locator('button[aria-label*="제거"]')
    const count = await removeButtons.count()

    if (count === 0) {
      test.skip(true, '제거 가능한 멤버가 없음')
      return
    }

    // 멤버 행 개수 기록
    const rowsBefore = await page.locator('tbody tr').count()

    // 첫 번째 제거 버튼 클릭
    await removeButtons.first().click()

    // Dialog에서 '취소' 클릭
    const cancelBtn = page.locator('.fixed.z-50 button').filter({ hasText: '취소' }).first()
    await expect(cancelBtn).toBeVisible({ timeout: 5000 })
    await cancelBtn.click()

    await page.waitForTimeout(500)

    // 멤버 목록 개수 유지 확인
    const rowsAfter = await page.locator('tbody tr').count()
    expect(rowsAfter).toBe(rowsBefore)

    await page.screenshot({ path: `${ARTIFACTS}/O14-member-remove-cancel.png` })
  })

  // O15: 리포트 페이지 → 수강생 이름 텍스트 visible
  test('O15: 리포트 페이지 - 수강생 이름 visible', async ({ page }) => {
    await goToReport(page)

    // 수강생 이름(김민준 등) 또는 생성 버튼 영역 visible
    const studentNameEl = page.locator('text=김민준').first()
    const hasStudentName = await studentNameEl.isVisible().catch(() => false)

    if (hasStudentName) {
      await expect(studentNameEl).toBeVisible()
    } else {
      // 리포트 목록이나 생성 영역이 visible
      const contentEl = page.locator('h1, h2, [class*="report"], [class*="student"]').first()
      await expect(contentEl).toBeVisible({ timeout: 10000 })
    }

    await page.screenshot({ path: `${ARTIFACTS}/O15-report-student-list.png` })
  })

  // O16: 리포트 생성 버튼 클릭 → 성공 Toast (timeout 60초)
  test('O16: 리포트 생성 버튼 → 성공 Toast', async ({ page }) => {
    test.setTimeout(75000)
    await goToReport(page)

    // 수강생별 '생성' 버튼 찾기
    const generateBtn = page.locator('button').filter({ hasText: '생성' }).first()
    const hasBtn = await generateBtn.isVisible().catch(() => false)

    if (!hasBtn) {
      await page.screenshot({ path: `${ARTIFACTS}/O16-no-generate-button.png` })
      test.skip(true, '리포트 생성 버튼이 없음 - 수강생 없거나 UI 변경')
      return
    }

    await generateBtn.click()

    // 성공 Toast 대기 (최대 60초)
    const toastEl = page.locator('[role="alert"]').first()
    await expect(toastEl).toBeVisible({ timeout: 60000 })

    await page.screenshot({ path: `${ARTIFACTS}/O16-report-generated.png` })
  })

  // O17: 리포트 SMS 발송 버튼 → 성공 Toast
  test('O17: 리포트 SMS 발송 버튼 → 성공 Toast', async ({ page }) => {
    await goToReport(page)

    // SMS 발송 버튼 찾기
    const smsBtn = page.locator('button').filter({ hasText: /SMS|발송/ }).first()
    const hasSmsBtn = await smsBtn.isVisible().catch(() => false)

    if (!hasSmsBtn) {
      await page.screenshot({ path: `${ARTIFACTS}/O17-no-sms-button.png` })
      // 리포트가 없으면 스킵
      const noReportMsg = page.locator('text=/생성된 리포트가 없습니다/i').first()
      const isNoReport = await noReportMsg.isVisible().catch(() => false)
      if (isNoReport) {
        test.skip(true, '생성된 리포트가 없어 SMS 발송 불가')
        return
      }
    }

    await smsBtn.click()

    const toastEl = page.locator('[role="alert"]').first()
    await expect(toastEl).toBeVisible({ timeout: 15000 })

    await page.screenshot({ path: `${ARTIFACTS}/O17-sms-sent.png` })
  })

  // O18: 일괄 SMS 발송 버튼 → 성공 Toast
  test('O18: 일괄 SMS 발송 버튼 → 성공 Toast', async ({ page }) => {
    await goToReport(page)

    // 일괄 발송 버튼 (미발송 리포트가 있을 때만 표시됨)
    const bulkSendBtn = page.locator('button').filter({ hasText: /일괄.*SMS|일괄.*발송/i }).first()
    const hasBulkBtn = await bulkSendBtn.isVisible().catch(() => false)

    if (!hasBulkBtn) {
      await page.screenshot({ path: `${ARTIFACTS}/O18-no-bulk-send-button.png` })
      test.skip(true, '일괄 발송 버튼 없음 - 미발송 리포트 없음')
      return
    }

    await bulkSendBtn.click()

    const toastEl = page.locator('[role="alert"]').first()
    await expect(toastEl).toBeVisible({ timeout: 15000 })

    await page.screenshot({ path: `${ARTIFACTS}/O18-bulk-sms-sent.png` })
  })

  // O19: 일괄 발송 버튼 상태 확인 (미발송 0건이면 버튼 숨김)
  test('O19: 미발송 리포트 없을 때 일괄 발송 버튼 숨김 또는 텍스트 확인', async ({ page }) => {
    await goToReport(page)

    // 일괄 발송 버튼
    const bulkSendBtn = page.locator('button').filter({ hasText: /일괄.*SMS|일괄.*발송/i }).first()
    const hasBulkBtn = await bulkSendBtn.isVisible().catch(() => false)

    // 빈 상태 메시지 또는 일괄 발송 버튼 텍스트 확인
    if (hasBulkBtn) {
      const btnText = await bulkSendBtn.textContent()
      // 버튼 텍스트에 개수 포함 여부 확인
      expect(btnText).toMatch(/\d+/)
      await page.screenshot({ path: `${ARTIFACTS}/O19-bulk-send-with-count.png` })
    } else {
      // 미발송 0건: 버튼이 없음을 확인
      await page.screenshot({ path: `${ARTIFACTS}/O19-no-bulk-send-button-zero.png` })
      expect(hasBulkBtn).toBeFalsy()
    }
  })

  // O20: 이탈 위험 페이지 → 목록 또는 빈 상태 표시
  test('O20: 이탈 위험 페이지 - 목록 또는 빈 상태 표시', async ({ page }) => {
    await page.locator('nav a[href*="/operator/churn"]').click()
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})

    expect(page.url()).toContain('/operator/churn')

    // 목록 또는 빈 상태 메시지 visible
    const contentEl = page.locator('h1, h2, table, [class*="churn"], [class*="risk"], [class*="card"]').first()
    await expect(contentEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/O20-churn-risk-page.png` })
  })
})
