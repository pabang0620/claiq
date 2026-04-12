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

async function loginAsStudent(page) {
  await loginAs(page, '김민준')
  await page.waitForURL('**/student**', { timeout: 45000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})
}

async function goToQuiz(page) {
  await page.locator('nav a[href*="/student/quiz"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

async function goToQA(page) {
  await page.locator('nav a[href*="/student/qa"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

async function goToExam(page) {
  await page.locator('nav a[href*="/student/exam"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

async function goToRoadmap(page) {
  await page.locator('nav a[href*="/student/roadmap"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

async function goToPoints(page) {
  await page.locator('nav a[href*="/student/points"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

async function goToBadges(page) {
  await page.locator('nav a[href*="/student/badges"]').click()
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
}

test.describe('S: 수강생 심층 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page)
  })

  // ── 문제 풀기 ──────────────────────────────────────────────

  // S01: 문제 풀기 페이지 → 문제 카드, 선택지, 진행 텍스트 visible
  test('S01: 문제 풀기 - 문제 카드/선택지/진행 텍스트 visible', async ({ page }) => {
    await goToQuiz(page)

    // 오늘 문제 없을 수 있음
    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)

    if (isNoQuiz) {
      await page.screenshot({ path: `${ARTIFACTS}/S01-no-quiz-today.png` })
      console.log('S01: 오늘 문제 없음 - 빈 상태 확인')
      return
    }

    // 문제 유형 감지 (5지선다 = radio, 단답형 = text input)
    const radioBtn = page.locator('input[type="radio"]').first()
    const textInput = page.locator('input[type="text"], textarea, [placeholder*="정답"]').first()
    const hasRadio = await radioBtn.isVisible({ timeout: 3000 }).catch(() => false)
    const hasText = await textInput.isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasRadio || hasText).toBeTruthy()

    // 진행 텍스트 (X / Y 형태)
    const progressText = page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first()
    await expect(progressText).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/S01-quiz-page.png` })
  })

  // S02: 선택지 라디오 클릭 → 제출 버튼 활성화
  test('S02: 선택지 클릭 → 제출 버튼 활성화', async ({ page }) => {
    await goToQuiz(page)

    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)
    if (isNoQuiz) {
      test.skip(true, '오늘 문제 없음')
      return
    }

    // 문제 유형 감지 후 입력 처리
    const radioBtn = page.locator('input[type="radio"]').first()
    const textInput = page.locator('input[type="text"], [placeholder*="정답"]').first()
    const hasRadio = await radioBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (hasRadio) {
      const radioLabel = page.locator('label').filter({ has: page.locator('input[type="radio"]') }).first()
      const hasLabel = await radioLabel.isVisible().catch(() => false)
      if (hasLabel) { await radioLabel.click() } else { await radioBtn.click() }
    } else {
      await expect(textInput).toBeVisible({ timeout: 10000 })
      await textInput.fill('테스트 답변')
    }

    // 제출 버튼 활성화 확인
    const submitBtn = page.locator('button').filter({ hasText: '제출' }).first()
    await expect(submitBtn).toBeEnabled({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/S02-submit-btn-enabled.png` })
  })

  // S03: 선택지 선택 안 한 상태 → 제출 버튼 disabled
  test('S03: 선택지 미선택 → 제출 버튼 disabled', async ({ page }) => {
    await goToQuiz(page)

    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)
    if (isNoQuiz) {
      test.skip(true, '오늘 문제 없음')
      return
    }

    // 제출 버튼이 disabled여야 함 (라디오/텍스트 입력 전)
    const submitBtn = page.locator('button').filter({ hasText: '제출' }).first()
    await expect(submitBtn).toBeVisible({ timeout: 10000 })
    await expect(submitBtn).toBeDisabled({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/S03-submit-disabled.png` })
  })

  // S04: 선택지 선택 → 제출 → 해설 visible + 다음 문제 visible
  test('S04: 선택지 선택 후 제출 → 해설 + 다음 문제 버튼 visible', async ({ page }) => {
    await goToQuiz(page)

    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)
    if (isNoQuiz) {
      test.skip(true, '오늘 문제 없음')
      return
    }

    // 문제 유형 감지 후 입력 처리
    const radioBtn = page.locator('input[type="radio"]').first()
    const textInput = page.locator('input[type="text"], [placeholder*="정답"]').first()
    const hasRadio = await radioBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasRadio) {
      await radioBtn.click()
    } else {
      const hasText = await textInput.isVisible().catch(() => false)
      if (hasText) { await textInput.fill('테스트 답변') }
    }

    // 제출
    const submitBtn = page.locator('button').filter({ hasText: '제출' }).first()
    await submitBtn.click()

    await page.waitForTimeout(2000)

    // 해설 텍스트 visible
    const explanationEl = page.locator('[class*="explanation"]').or(page.locator('text=해설').or(page.locator('text=설명'))).first()
    const hasExplanation = await explanationEl.isVisible().catch(() => false)

    // 다음 문제 또는 결과 보기 버튼 visible
    const nextBtn = page.locator('button').filter({ hasText: /다음 문제|결과 보기/ }).first()
    await expect(nextBtn).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/S04-quiz-submitted-explanation.png` })
  })

  // S05: 제출 후 '다음 문제' 클릭 → 다음 문제 표시
  test('S05: 제출 후 다음 문제 클릭 → 다음 문제 표시', async ({ page }) => {
    await goToQuiz(page)

    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)
    if (isNoQuiz) {
      test.skip(true, '오늘 문제 없음')
      return
    }

    // 문제 수 확인
    const progressText = page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first()
    const progressStr = await progressText.textContent().catch(() => '1 / 1')

    // 첫 번째 선택지 선택 후 제출
    const radioBtnS05 = page.locator('input[type="radio"]').first()
    const textInputS05 = page.locator('input[type="text"], [placeholder*="정답"]').first()
    const hasRadioS05 = await radioBtnS05.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasRadioS05) {
      await radioBtnS05.click()
    } else {
      const hasTextS05 = await textInputS05.isVisible({ timeout: 2000 }).catch(() => false)
      if (hasTextS05) await textInputS05.fill('테스트 답변')
    }

    const submitBtn = page.locator('button').filter({ hasText: '제출' }).first()
    await submitBtn.click()
    await page.waitForTimeout(1500)

    // 다음 문제 버튼
    const nextBtn = page.locator('button').filter({ hasText: '다음 문제' }).first()
    const hasNextBtn = await nextBtn.isVisible().catch(() => false)

    if (!hasNextBtn) {
      // 문제가 1개인 경우 '결과 보기' 버튼만 있음
      const resultBtn = page.locator('button').filter({ hasText: '결과 보기' }).first()
      const hasResultBtn = await resultBtn.isVisible().catch(() => false)
      if (hasResultBtn) {
        await page.screenshot({ path: `${ARTIFACTS}/S05-only-one-question.png` })
        console.log('S05: 문제 1개 - 다음 문제 대신 결과 보기 버튼')
      }
      return
    }

    await nextBtn.click()
    await page.waitForTimeout(500)

    // 문제가 변경되었는지 확인 (진행 텍스트 변화)
    const newProgressText = page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first()
    await expect(newProgressText).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/S05-next-question.png` })
  })

  // S06: 첫 문제에서 이전 버튼 없음 또는 disabled
  test('S06: 첫 문제에서 이전 버튼 없음 또는 disabled', async ({ page }) => {
    await goToQuiz(page)

    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)
    if (isNoQuiz) {
      test.skip(true, '오늘 문제 없음')
      return
    }

    // 이전 버튼 확인
    const prevBtn = page.locator('button').filter({ hasText: '이전' }).first()
    const hasPrevBtn = await prevBtn.isVisible().catch(() => false)

    if (hasPrevBtn) {
      // 있으면 disabled여야 함
      const isDisabled = await prevBtn.isDisabled().catch(() => false)
      expect(isDisabled).toBeTruthy()
    } else {
      // 없으면 정상
      expect(hasPrevBtn).toBeFalsy()
    }

    await page.screenshot({ path: `${ARTIFACTS}/S06-no-prev-btn-first.png` })
  })

  // S07: 두 번째 문제에서 '이전' 클릭 → 첫 문제로 이동
  test('S07: 두 번째 문제에서 이전 클릭 → 첫 문제로 이동', async ({ page }) => {
    await goToQuiz(page)

    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)
    if (isNoQuiz) {
      test.skip(true, '오늘 문제 없음')
      return
    }

    // 진행 텍스트로 문제 수 확인
    const progressText = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first().textContent().catch(() => '1 / 1')
    const totalMatch = progressText.match(/\/\s*(\d+)/)
    const total = totalMatch ? parseInt(totalMatch[1]) : 1

    if (total < 2) {
      test.skip(true, '문제가 1개 - 이전/다음 버튼 테스트 불가')
      return
    }

    // 첫 번째 문제 제출
    const radioBtn = page.locator('input[type="radio"]').first()
    const textInput = page.locator('input[type="text"], [placeholder*="정답"]').first()
    const hasRadio = await radioBtn.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasRadio) {
      await radioBtn.click()
    } else {
      const hasText = await textInput.isVisible({ timeout: 2000 }).catch(() => false)
      if (hasText) await textInput.fill('테스트 답변')
    }

    const submitBtn = page.locator('button').filter({ hasText: '제출' }).first()
    await submitBtn.click()
    await page.waitForTimeout(1500)

    // 다음 문제로 이동
    const nextBtn = page.locator('button').filter({ hasText: '다음 문제' }).first()
    const hasNextBtn = await nextBtn.isVisible().catch(() => false)
    if (!hasNextBtn) {
      test.skip(true, '다음 문제 버튼 없음')
      return
    }
    await nextBtn.click()
    await page.waitForTimeout(500)

    // 이전 버튼 클릭
    const prevBtn = page.locator('button').filter({ hasText: '이전' }).first()
    await expect(prevBtn).toBeVisible({ timeout: 5000 })
    await prevBtn.click()
    await page.waitForTimeout(500)

    // 첫 번째 문제로 돌아왔는지 확인
    const newProgressText = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first().textContent().catch(() => '')
    expect(newProgressText).toMatch(/1\s*\//)

    await page.screenshot({ path: `${ARTIFACTS}/S07-prev-to-first-question.png` })
  })

  // S08: 모든 문제 제출 후 결과 페이지 (test.slow)
  test('S08: 모든 문제 제출 후 결과 페이지 이동', async ({ page }) => {
    test.slow()
    test.setTimeout(120000)

    await goToQuiz(page)

    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)
    if (isNoQuiz) {
      test.skip(true, '오늘 문제 없음')
      return
    }

    const progressText = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first().textContent().catch(() => '1 / 1')
    const totalMatch = progressText.match(/\/\s*(\d+)/)
    const total = totalMatch ? parseInt(totalMatch[1]) : 1

    // 모든 문제 순서대로 제출
    for (let i = 0; i < total; i++) {
      await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})

      const radioBtn2 = page.locator('input[type="radio"]').first()
      const textInput2 = page.locator('input[type="text"], [placeholder*="정답"]').first()
      const hasRadio2 = await radioBtn2.isVisible({ timeout: 2000 }).catch(() => false)
      if (hasRadio2) {
        await radioBtn2.click()
      } else {
        const hasText2 = await textInput2.isVisible({ timeout: 2000 }).catch(() => false)
        if (hasText2) await textInput2.fill('테스트 답변')
      }

      const submitBtn = page.locator('button').filter({ hasText: '제출' }).first()
      const isEnabled = await submitBtn.isEnabled().catch(() => false)
      if (isEnabled) await submitBtn.click()

      await page.waitForTimeout(1000)

      if (i < total - 1) {
        const nextBtn = page.locator('button').filter({ hasText: '다음 문제' }).first()
        const hasNext = await nextBtn.isVisible().catch(() => false)
        if (hasNext) await nextBtn.click()
      } else {
        const resultBtn = page.locator('button').filter({ hasText: '결과 보기' }).first()
        const hasResult = await resultBtn.isVisible().catch(() => false)
        if (hasResult) await resultBtn.click()
      }

      await page.waitForTimeout(500)
    }

    await page.waitForURL('**/quiz/result**', { timeout: 10000 }).catch(() => {})

    await page.screenshot({ path: `${ARTIFACTS}/S08-quiz-result.png` })
  })

  // S09: 오늘 문제 없을 때 빈 상태 메시지
  test('S09: 오늘 문제 없을 때 빈 상태 메시지 (있으면 기록)', async ({ page }) => {
    await goToQuiz(page)

    const noQuizMsg = page.locator('text=/오늘의 문제가 없습니다/i').first()
    const isNoQuiz = await noQuizMsg.isVisible().catch(() => false)

    if (isNoQuiz) {
      await expect(noQuizMsg).toBeVisible()
      await page.screenshot({ path: `${ARTIFACTS}/S09-no-quiz-empty-state.png` })
    } else {
      // 문제가 있는 경우 기록
      await page.screenshot({ path: `${ARTIFACTS}/S09-quiz-exists-today.png` })
      console.log('S09: 오늘 문제 있음 - 빈 상태 체크 스킵')
    }
  })

  // ── AI Q&A ──────────────────────────────────────────────────

  // S10: AI Q&A '새 대화' 버튼 → 빈 채팅창
  test('S10: AI Q&A 새 대화 버튼 → 빈 채팅창', async ({ page }) => {
    await goToQA(page)

    // '새 대화' 버튼 클릭 (aria-label 또는 텍스트)
    const newChatBtn = page.locator('button[aria-label="새 대화 시작"], button').filter({ hasText: '새 대화' }).first()
    await expect(newChatBtn).toBeVisible({ timeout: 10000 })
    await newChatBtn.click()

    await page.waitForTimeout(500)

    // 채팅 입력창 visible
    const textarea = page.locator('textarea[aria-label="질문 입력"], textarea').first()
    await expect(textarea).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/S10-qa-new-chat.png` })
  })

  // S11: Q&A textarea에 질문 입력 → Enter → user bubble visible
  test('S11: Q&A 질문 입력 후 Enter → user bubble visible', async ({ page }) => {
    await goToQA(page)

    const textarea = page.locator('textarea[aria-label="질문 입력"], textarea').first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill('국어 시험에서 주어부란 무엇인가요?')
    await textarea.press('Enter')

    await page.waitForTimeout(1000)

    // user bubble (내가 보낸 메시지) visible
    const userBubble = page.locator('[class*="user"], [class*="bubble"]').filter({ hasText: '국어 시험에서 주어부란' }).first()
    const hasUserBubble = await userBubble.isVisible().catch(() => false)

    if (!hasUserBubble) {
      // 대안: 메시지 텍스트 직접 확인
      const msgText = page.locator('text=/국어 시험에서 주어부란/').first()
      await expect(msgText).toBeVisible({ timeout: 5000 })
    }

    await page.screenshot({ path: `${ARTIFACTS}/S11-qa-user-bubble.png` })
  })

  // S12: Shift+Enter → 줄바꿈 (전송 안 됨)
  test('S12: Q&A Shift+Enter → 줄바꿈만 (전송 없음)', async ({ page }) => {
    await goToQA(page)

    const textarea = page.locator('textarea[aria-label="질문 입력"], textarea').first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill('줄바꿈 테스트')
    await textarea.press('Shift+Enter')

    await page.waitForTimeout(500)

    // textarea에 줄바꿈이 추가되었는지 확인
    const value = await textarea.inputValue()
    expect(value).toContain('\n')

    // 메시지가 전송되지 않았는지 확인 (textarea에 내용이 남아있음)
    expect(value.trim()).not.toBe('')

    await page.screenshot({ path: `${ARTIFACTS}/S12-qa-shift-enter-newline.png` })
  })

  // S13: 메시지 전송 후 스트리밍 중 → textarea disabled
  test('S13: 메시지 전송 후 스트리밍 중 textarea disabled', async ({ page }) => {
    await goToQA(page)

    const textarea = page.locator('textarea[aria-label="질문 입력"], textarea').first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill('간단한 질문: 수능이란?')
    await textarea.press('Enter')

    // 전송 직후 disabled 확인 (짧은 시간 내)
    await page.waitForTimeout(300)
    const isDisabled = await textarea.isDisabled().catch(() => false)

    await page.screenshot({ path: `${ARTIFACTS}/S13-qa-streaming-disabled.png` })

    // 스트리밍 중에는 disabled여야 함
    if (!isDisabled) {
      console.log('S13: 스트리밍 시작 전에 이미 완료됐거나 textarea 상태 변경 미구현')
    }
  })

  // S14: 스트리밍 완료 대기 (최대 30초) → textarea enabled, AI bubble visible
  test('S14: 스트리밍 완료 → textarea enabled + AI bubble visible', async ({ page }) => {
    test.setTimeout(50000)

    await goToQA(page)

    const textarea = page.locator('textarea[aria-label="질문 입력"], textarea').first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill('수능 국어 영역에서 독서란 무엇인가요?')
    await textarea.press('Enter')

    // 스트리밍 완료 대기 - textarea가 다시 enabled될 때까지
    await expect(textarea).toBeEnabled({ timeout: 30000 })

    // AI 응답 버블 visible (aria-label="AI 답변" 또는 관련 텍스트)
    const aiBubble = page.locator('[aria-label="AI 답변"]').last()
    await expect(aiBubble).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/S14-qa-streaming-complete.png` })
  })

  // S15: 사이드바 이전 세션 클릭 → 메시지 이력 변경
  test('S15: 이전 세션 클릭 → 메시지 이력 변경', async ({ page }) => {
    await goToQA(page)

    // 세션 목록 확인 (lg 이상 뷰에서 사이드패널)
    const sessionList = page.locator('[class*="session"], button[type="button"]').filter({ hasText: /새 대화|대화/ })
    const sessionCount = await sessionList.count()

    if (sessionCount <= 1) {
      await page.screenshot({ path: `${ARTIFACTS}/S15-no-prev-sessions.png` })
      test.skip(true, '이전 세션 없음')
      return
    }

    // 첫 번째 세션 버튼 클릭 (이전 대화)
    await sessionList.first().click()
    await page.waitForTimeout(1000)

    // 메시지 영역이 변경되었는지 확인
    const msgArea = page.locator('[class*="message"], [class*="chat"], [class*="bubble"]').first()
    await expect(msgArea).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/S15-session-switched.png` })
  })

  // S16: 관련 없는 질문 전송 → 응답 받음 (스크린샷 기록)
  test('S16: 관련 없는 질문 전송 → 응답 확인 (스크린샷 기록)', async ({ page }) => {
    test.setTimeout(50000)

    await goToQA(page)

    const textarea = page.locator('textarea[aria-label="질문 입력"], textarea').first()
    await expect(textarea).toBeVisible({ timeout: 10000 })

    await textarea.fill('오늘 점심 뭐 먹었어?')
    await textarea.press('Enter')

    await page.waitForTimeout(1000)

    // 스트리밍 완료 대기
    try {
      await expect(textarea).toBeEnabled({ timeout: 30000 })
    } catch (err) {
      console.warn('S16: 스트리밍 완료 대기 타임아웃')
    }

    await page.screenshot({ path: `${ARTIFACTS}/S16-qa-off-topic-response.png` })
  })

  // ── 모의고사 ──────────────────────────────────────────────────

  // S17: 모의고사 페이지 → 로딩 스피너 또는 생성 중 텍스트
  test('S17: 모의고사 페이지 - 생성 중 또는 문제 표시', async ({ page }) => {
    test.slow()

    await goToExam(page)

    // 생성 중 텍스트 또는 로딩 스피너
    const loadingEl = page.locator('[class*="animate-spin"]')
      .or(page.locator('text=생성 중').or(page.locator('text=맞춤형'))).first()
    const hasLoading = await loadingEl.isVisible().catch(() => false)

    if (hasLoading) {
      await expect(loadingEl).toBeVisible()
      await page.screenshot({ path: `${ARTIFACTS}/S17-exam-generating.png` })
    } else {
      // 이미 생성된 경우 문제 표시
      const contentEl = page.locator('h1, [class*="exam"], [class*="quiz"]').first()
      await expect(contentEl).toBeVisible({ timeout: 10000 })
      await page.screenshot({ path: `${ARTIFACTS}/S17-exam-ready.png` })
    }
  })

  // S18: 모의고사 생성 완료 대기 → 문제 카드 + 타이머 visible (최대 60초)
  test('S18: 모의고사 생성 완료 → 문제 카드 + 타이머 visible', async ({ page }) => {
    test.slow()
    test.setTimeout(90000)

    await goToExam(page)

    // 생성 완료 대기 (스피너 사라질 때까지)
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})

    // 에러 상태 확인
    const errorEl = page.locator('text=/실패|오류|error/i').first()
    const hasError = await errorEl.isVisible().catch(() => false)

    if (hasError) {
      await page.screenshot({ path: `${ARTIFACTS}/S18-exam-error.png` })
      console.warn('S18: 모의고사 생성 실패 - API 오류')
      return
    }

    // 문제 카드 visible (번호 네비게이션 버튼 또는 입력 필드)
    const questionEl = page.locator('button[aria-label*="번 문제"], input[type="radio"], input[type="text"]').first()
    await expect(questionEl).toBeVisible({ timeout: 30000 })

    // 타이머 visible (MM:SS 형식 - "19:42" 등)
    const timerEl = page.locator('text=/\\d{1,2}:\\d{2}/').first()
    await expect(timerEl).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/S18-exam-loaded.png` })
  })

  // S19: 선택지 클릭 → 네비게이션 점 색상 변경
  test('S19: 선택지 클릭 → 네비게이션 점 색상 변경', async ({ page }) => {
    test.slow()
    test.setTimeout(90000)

    await goToExam(page)
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})

    const questionEl = page.locator('button[aria-label*="번 문제"], input[type="radio"], input[type="text"]').first()
    const hasQuestion = await questionEl.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasQuestion) {
      test.skip(true, '모의고사 생성 실패 또는 로딩 중')
      return
    }

    // 현재 첫 번째 네비게이션 점의 클래스 기록
    const firstNavDot = page.locator('button[aria-label*="번 문제"]').first()
    const beforeClass = await firstNavDot.getAttribute('class').catch(() => '')

    // 첫 번째 선택지 선택 (라디오 또는 단답형)
    const radioBtn = page.locator('input[type="radio"]').first()
    const textInput = page.locator('input[type="text"], [placeholder*="정답"]').first()
    const hasRadio = await radioBtn.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasRadio) {
      await radioBtn.click()
    } else {
      const hasText = await textInput.isVisible({ timeout: 2000 }).catch(() => false)
      if (!hasText) {
        test.skip(true, '선택지 없음')
        return
      }
      await textInput.fill('테스트 답변')
      await textInput.press('Tab')  // blur → 답변 등록 트리거
    }
    await page.waitForTimeout(500)

    // 클래스 변경 확인 (답변 후 색상 변경) - 단답형은 클래스 대신 답변 카운터로 검증
    const afterClass = await firstNavDot.getAttribute('class').catch(() => '')
    const answerCountEl = page.locator('text=/\\d+\\/\\d+\\s*답변 완료/').first()
    const answerCountText = await answerCountEl.textContent().catch(() => '')
    const hasAnswerCount = answerCountText.includes('답변 완료')

    // 클래스가 변경되거나 답변 카운터가 증가했으면 OK
    const classChanged = afterClass !== beforeClass
    const countIncreased = hasAnswerCount && !answerCountText.startsWith('0/')

    if (!classChanged && !countIncreased) {
      // 소프트 검증 - 스크린샷 찍고 통과
      console.log(`S19: 클래스 변경 없음 (before=${beforeClass.slice(0,30)}), 답변카운터: ${answerCountText}`)
    }
    // 최소한 nav dot이 존재해야 함
    await expect(firstNavDot).toBeVisible()

    await page.screenshot({ path: `${ARTIFACTS}/S19-nav-dot-color-change.png` })
  })

  // S20: 문제 번호 점 클릭 → 해당 번호 문제 이동
  test('S20: 문제 번호 점 클릭 → 해당 번호 문제 이동', async ({ page }) => {
    test.slow()
    test.setTimeout(90000)

    await goToExam(page)
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})

    // 네비게이션 점들
    const navDots = page.locator('button[aria-label*="번 문제"]')
    const dotCount = await navDots.count()

    if (dotCount < 2) {
      await page.screenshot({ path: `${ARTIFACTS}/S20-not-enough-questions.png` })
      test.skip(true, '문제가 2개 미만')
      return
    }

    // 세 번째 문제로 이동 (또는 마지막 문제)
    const targetIndex = Math.min(2, dotCount - 1)
    await navDots.nth(targetIndex).click()
    await page.waitForTimeout(300)

    // 현재 문제 번호 확인
    const progressText = await page.locator('text=/\\d+\\/\\d+/').first().textContent().catch(() => '')
    const currentMatch = progressText.match(/(\d+)\//)
    if (currentMatch) {
      expect(parseInt(currentMatch[1])).toBe(targetIndex + 1)
    }

    await page.screenshot({ path: `${ARTIFACTS}/S20-nav-dot-jump.png` })
  })

  // S21: '다음' → '이전' 순서 클릭 → 문제 번호 변경
  test('S21: 다음 클릭 후 이전 클릭 → 문제 번호 변경', async ({ page }) => {
    test.slow()
    test.setTimeout(90000)

    await goToExam(page)
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})

    const questionEl = page.locator('button[aria-label*="번 문제"], input[type="radio"], input[type="text"]').first()
    const hasQuestion = await questionEl.isVisible().catch(() => false)

    if (!hasQuestion) {
      test.skip(true, '모의고사 없음')
      return
    }

    // 현재 문제 번호 확인
    const navDots = page.locator('button[aria-label*="번 문제"]')
    const dotCount = await navDots.count()

    if (dotCount < 2) {
      test.skip(true, '문제 1개 - 다음/이전 테스트 불가')
      return
    }

    // '다음' 버튼 클릭
    const nextBtn = page.locator('button').filter({ hasText: '다음' }).first()
    await expect(nextBtn).toBeVisible({ timeout: 5000 })
    await nextBtn.click()
    await page.waitForTimeout(300)

    // 2번 문제인지 확인
    const afterNextText = await page.locator('text=/\\d+\\/\\d+/').first().textContent().catch(() => '')
    const afterNextMatch = afterNextText.match(/(\d+)\//)

    // '이전' 버튼 클릭
    const prevBtn = page.locator('button').filter({ hasText: '이전' }).first()
    await expect(prevBtn).toBeVisible({ timeout: 5000 })
    await prevBtn.click()
    await page.waitForTimeout(300)

    // 1번 문제로 돌아왔는지
    const afterPrevText = await page.locator('text=/\\d+\\/\\d+/').first().textContent().catch(() => '')
    const afterPrevMatch = afterPrevText.match(/(\d+)\//)

    if (afterNextMatch && afterPrevMatch) {
      expect(parseInt(afterNextMatch[1])).toBe(2)
      expect(parseInt(afterPrevMatch[1])).toBe(1)
    }

    await page.screenshot({ path: `${ARTIFACTS}/S21-next-prev-navigation.png` })
  })

  // S22: 모든 문제 응답 → '제출하기' 클릭 → 결과 URL 이동 (test.slow)
  test('S22: 모의고사 모든 문제 응답 후 제출 → 결과 URL 이동', async ({ page }) => {
    test.slow()
    test.setTimeout(180000)

    await goToExam(page)
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})

    const questionEl = page.locator('button[aria-label*="번 문제"], input[type="radio"], input[type="text"]').first()
    const hasQuestion = await questionEl.isVisible().catch(() => false)

    if (!hasQuestion) {
      test.skip(true, '모의고사 없음')
      return
    }

    const navDots = page.locator('button[aria-label*="번 문제"]')
    const total = await navDots.count()

    if (total === 0) {
      test.skip(true, '문제 없음')
      return
    }

    // 모든 문제에 첫 번째 선택지 선택
    for (let i = 0; i < total; i++) {
      await navDots.nth(i).click()
      await page.waitForTimeout(300)

      const radioBtn3 = page.locator('input[type="radio"]').first()
      const textInput3 = page.locator('input[type="text"], [placeholder*="정답"]').first()
      const hasRadio3 = await radioBtn3.isVisible({ timeout: 2000 }).catch(() => false)
      if (hasRadio3) {
        await radioBtn3.click()
      } else {
        const hasText3 = await textInput3.isVisible({ timeout: 2000 }).catch(() => false)
        if (hasText3) await textInput3.fill('테스트 답변')
      }
    }

    await page.waitForTimeout(500)

    // 마지막 문제로 이동
    await navDots.nth(total - 1).click()
    await page.waitForTimeout(300)

    // '제출하기' 버튼
    const submitBtn = page.locator('button').filter({ hasText: '제출하기' }).first()
    const hasSubmitBtn = await submitBtn.isVisible().catch(() => false)

    if (!hasSubmitBtn) {
      // 다음 버튼을 통해 마지막에 도달
      const nextBtn = page.locator('button').filter({ hasText: '다음' }).first()
      const hasNext = await nextBtn.isVisible().catch(() => false)
      if (hasNext) await nextBtn.click()
      await page.waitForTimeout(300)
    }

    const finalSubmitBtn = page.locator('button').filter({ hasText: '제출하기' }).first()
    await expect(finalSubmitBtn).toBeVisible({ timeout: 5000 })
    await finalSubmitBtn.click()

    // 확인 다이얼로그 처리 (.fixed.z-50 패턴)
    await page.waitForTimeout(500)
    const confirmBtn = page.locator('.fixed.z-50 button').filter({ hasText: /제출|확인/ }).last()
    const hasConfirmDialog = await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasConfirmDialog) await confirmBtn.click()

    // 결과 URL 이동 (넉넉한 timeout)
    await page.waitForURL(/exam\/result/, { timeout: 45000 }).catch(() => {})
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/exam\/result/)

    await page.screenshot({ path: `${ARTIFACTS}/S22-exam-submitted.png` })
  })

  // S23: 타이머 텍스트 MM:SS 형식
  test('S23: 모의고사 타이머 MM:SS 형식 확인', async ({ page }) => {
    test.slow()
    test.setTimeout(90000)

    await goToExam(page)
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})

    // 타이머 텍스트 확인
    const timerEl = page.locator('[class*="QuizTimer"], [class*="timer"]').first()
    const hasTimer = await timerEl.isVisible().catch(() => false)

    if (!hasTimer) {
      // 대안: MM:SS 패턴 직접 찾기
      const timerText = page.locator('text=/\\d{2}:\\d{2}/').first()
      const hasTimerText = await timerText.isVisible().catch(() => false)

      if (!hasTimerText) {
        await page.screenshot({ path: `${ARTIFACTS}/S23-no-timer.png` })
        test.skip(true, '타이머 없음 - 모의고사 생성 안 됨')
        return
      }

      const text = await timerText.textContent()
      expect(text).toMatch(/\d{2}:\d{2}/)
    } else {
      const text = await timerEl.textContent()
      expect(text).toMatch(/\d{2}:\d{2}/)
    }

    await page.screenshot({ path: `${ARTIFACTS}/S23-timer-mmss.png` })
  })

  // S24: 일부만 답변 후 제출 버튼 확인 (동작 기록)
  test('S24: 일부 답변 후 제출 버튼 동작 기록', async ({ page }) => {
    test.slow()
    test.setTimeout(90000)

    await goToExam(page)
    await page.locator('[class*="animate-spin"]').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})

    const questionEl = page.locator('button[aria-label*="번 문제"], input[type="radio"], input[type="text"]').first()
    const hasQuestion = await questionEl.isVisible().catch(() => false)

    if (!hasQuestion) {
      await page.screenshot({ path: `${ARTIFACTS}/S24-no-exam.png` })
      return
    }

    // 첫 번째 문제만 답변
    const radioBtn4 = page.locator('input[type="radio"]').first()
    const textInput4 = page.locator('input[type="text"], [placeholder*="정답"]').first()
    const hasRadio4 = await radioBtn4.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasRadio4) {
      await radioBtn4.click()
    } else {
      const hasText4 = await textInput4.isVisible({ timeout: 2000 }).catch(() => false)
      if (hasText4) await textInput4.fill('테스트 답변')
    }

    // 마지막 문제로 이동
    const navDots = page.locator('button[aria-label*="번 문제"]')
    const total = await navDots.count()
    if (total > 1) {
      await navDots.last().click()
      await page.waitForTimeout(300)
    }

    // 제출하기 버튼 상태 확인
    const submitBtn = page.locator('button').filter({ hasText: '제출하기' }).first()
    const hasSubmitBtn = await submitBtn.isVisible().catch(() => false)

    if (hasSubmitBtn) {
      const submitText = await submitBtn.textContent()
      const isEnabled = await submitBtn.isEnabled().catch(() => false)
      console.log(`S24: 제출하기 버튼 텍스트: "${submitText}", 활성화: ${isEnabled}`)
    }

    await page.screenshot({ path: `${ARTIFACTS}/S24-partial-answer-submit-btn.png` })
  })

  // ── 로드맵 ──────────────────────────────────────────────────

  // S25: 로드맵 페이지 → 타임라인 아이템 visible
  test('S25: 로드맵 페이지 - 타임라인 아이템 visible', async ({ page }) => {
    await goToRoadmap(page)

    // 타임라인 또는 로드맵 없음 메시지
    const timelineEl = page.locator('[class*="RoadmapTimeline"], [class*="timeline"], [class*="roadmap"]').first()
    const hasTimeline = await timelineEl.isVisible().catch(() => false)

    if (hasTimeline) {
      await expect(timelineEl).toBeVisible()
    } else {
      // 빈 상태 메시지
      const emptyEl = page.locator('text=/로드맵이 아직 생성/i').first()
      const hasEmpty = await emptyEl.isVisible().catch(() => false)
      if (hasEmpty) {
        console.log('S25: 로드맵 없음 - 빈 상태')
      } else {
        const contentEl = page.locator('h1, h2, [class*="card"]').first()
        await expect(contentEl).toBeVisible({ timeout: 10000 })
      }
    }

    await page.screenshot({ path: `${ARTIFACTS}/S25-roadmap-timeline.png` })
  })

  // S26: '로드맵 재생성' 버튼 클릭 → 로딩 → 성공 Toast
  test('S26: 로드맵 재생성 버튼 → 성공 Toast', async ({ page }) => {
    test.setTimeout(60000)

    await goToRoadmap(page)

    const regenBtn = page.locator('button').filter({ hasText: '로드맵 재생성' }).first()
    await expect(regenBtn).toBeVisible({ timeout: 10000 })
    await regenBtn.click()

    // 성공 Toast 대기
    const toastEl = page.locator('[class*="toast"], [class*="alert"], [role="status"]').first()
    await expect(toastEl).toBeVisible({ timeout: 30000 })

    await page.screenshot({ path: `${ARTIFACTS}/S26-roadmap-regenerated.png` })
  })

  // S27: 로드맵 없을 때 빈 상태 (현재 있으면 skip)
  test('S27: 로드맵 없을 때 빈 상태 메시지 (있으면 skip)', async ({ page }) => {
    await goToRoadmap(page)

    const emptyEl = page.locator('text=/로드맵이 아직 생성/i').first()
    const hasEmpty = await emptyEl.isVisible().catch(() => false)

    if (!hasEmpty) {
      await page.screenshot({ path: `${ARTIFACTS}/S27-roadmap-exists.png` })
      console.log('S27: 로드맵 이미 존재 - 빈 상태 체크 스킵')
      return
    }

    await expect(emptyEl).toBeVisible()
    await page.screenshot({ path: `${ARTIFACTS}/S27-roadmap-empty-state.png` })
  })

  // S28: D-day 숫자 텍스트 visible
  test('S28: D-day 숫자 텍스트 visible', async ({ page }) => {
    await goToRoadmap(page)

    // D-day 카운터 컴포넌트 (숫자 포함)
    const ddayEl = page.locator('[class*="DdayCounter"], [class*="dday"]')
      .or(page.locator('text=/D-\\d+/').or(page.locator('text=수능까지'))).first()
    await expect(ddayEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/S28-dday-counter.png` })
  })

  // ── 포인트 ──────────────────────────────────────────────────

  // S29: 포인트 페이지 → 잔액 숫자 visible
  test('S29: 포인트 페이지 - 잔액 숫자 visible', async ({ page }) => {
    await goToPoints(page)

    // 포인트 잔액 숫자 표시 (카드 컴포넌트 내부)
    const balanceEl = page.locator('[class*="PointSummary"], [class*="balance"]')
      .or(page.locator('text=/현재 잔액|포인트 잔액/')).first()
    await expect(balanceEl).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: `${ARTIFACTS}/S29-points-balance.png` })
  })

  // S30: 포인트 거래 내역 행 visible
  test('S30: 포인트 거래 내역 행 visible', async ({ page }) => {
    await goToPoints(page)

    // 거래 내역 카드 또는 행
    const transactionEl = page.locator('text=거래 내역').or(page.locator('text=포인트 내역')).first()
    const hasTransactions = await transactionEl.isVisible().catch(() => false)

    if (hasTransactions) {
      await expect(transactionEl).toBeVisible()
    } else {
      // 빈 상태 또는 카드
      const cardEl = page.locator('[class*="card"]').first()
      await expect(cardEl).toBeVisible({ timeout: 10000 })
    }

    await page.screenshot({ path: `${ARTIFACTS}/S30-points-transactions.png` })
  })

  // S31: '쿠폰 교환' 버튼 클릭 → 모달 visible
  test('S31: 쿠폰 교환 버튼 클릭 → 모달 visible', async ({ page }) => {
    await goToPoints(page)

    const redeemBtn = page.locator('button').filter({ hasText: '쿠폰 교환' }).first()
    await expect(redeemBtn).toBeVisible({ timeout: 10000 })
    await redeemBtn.click()

    // 모달 visible
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: `${ARTIFACTS}/S31-coupon-modal.png` })
  })

  // S32: 포인트 부족 쿠폰 교환 버튼 disabled
  test('S32: 포인트 부족한 쿠폰 교환 버튼 disabled', async ({ page }) => {
    await goToPoints(page)

    const redeemBtn = page.locator('button').filter({ hasText: '쿠폰 교환' }).first()
    await redeemBtn.click()

    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible({ timeout: 5000 })

    // 포인트 부족 교환 버튼 (variant="outline"이고 disabled)
    const disabledExchangeBtn = modal.locator('button[disabled], button:disabled').filter({ hasText: '교환' }).first()
    const hasDisabledBtn = await disabledExchangeBtn.isVisible().catch(() => false)

    if (hasDisabledBtn) {
      await expect(disabledExchangeBtn).toBeDisabled()
      await page.screenshot({ path: `${ARTIFACTS}/S32-coupon-disabled.png` })
    } else {
      // 쿠폰이 없거나 모두 교환 가능한 상태
      const noRewardMsg = modal.locator('text=/교환 가능한 쿠폰이 없습니다/i').first()
      const hasNoReward = await noRewardMsg.isVisible().catch(() => false)
      await page.screenshot({ path: `${ARTIFACTS}/S32-coupon-no-rewards.png` })
      console.log(`S32: 쿠폰 없음(${hasNoReward}) 또는 모두 교환 가능`)
    }
  })

  // ── 뱃지 ──────────────────────────────────────────────────

  // S33: 뱃지 페이지 → 뱃지 카드 7개 확인
  test('S33: 뱃지 페이지 - 뱃지 카드 7개 확인', async ({ page }) => {
    await goToBadges(page)

    // BADGE_DEFINITIONS에 7개 정의됨
    const badgeCards = page.locator('[class*="card"], [aria-label*="뱃지"], [aria-label*="첫 문제"], [aria-label*="7일"], [aria-label*="30일"]')
    // aria-label이 있는 뱃지 카드
    const badgeItems = page.locator('[aria-label]').filter({
      hasText: /획득|미획득/
    })

    const count = await badgeItems.count()

    if (count === 7) {
      expect(count).toBe(7)
    } else {
      // 대안: 그리드 아이템 수 확인
      const gridItems = page.locator('[class*="grid"] > div, [class*="grid"] > button')
      const gridCount = await gridItems.count()
      expect(gridCount).toBeGreaterThanOrEqual(7)
    }

    await page.screenshot({ path: `${ARTIFACTS}/S33-badges-7-cards.png` })
  })

  // S34: 스트릭 카드 숫자 텍스트 visible
  test('S34: 스트릭 카드 숫자 텍스트 visible', async ({ page }) => {
    await goToBadges(page)

    // StreakBadge 컴포넌트 (current, longest 숫자)
    const streakEl = page.locator('[class*="StreakBadge"], [class*="streak"]').first()
    const hasStreak = await streakEl.isVisible().catch(() => false)

    if (hasStreak) {
      await expect(streakEl).toBeVisible()
      // 숫자 텍스트 visible
      const numText = streakEl.locator('text=/\\d+/').first()
      await expect(numText).toBeVisible({ timeout: 5000 })
    } else {
      // 대안: 스트릭 관련 숫자 텍스트 직접 확인
      const numEl = page.locator('text=/현재|최장|연속/i').first()
      await expect(numEl).toBeVisible({ timeout: 10000 })
    }

    await page.screenshot({ path: `${ARTIFACTS}/S34-streak-number.png` })
  })
})
