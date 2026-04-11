import { test, chromium } from '@playwright/test'

const API_URL = 'http://localhost:5000/api'
const BASE_URL = 'http://localhost:5174'
const OUTPUT_DIR = '/home/pabang/myapp/award/docs/screenshots'

const MOBILE_VIEWPORT = { width: 390, height: 844 }

const ACCOUNTS = {
  admin: { email: 'admin@claiq.kr', password: 'claiq1234' },
  teacher: { email: 'teacher@claiq.kr', password: 'claiq1234' },
  student: { email: 'student@claiq.kr', password: 'claiq1234' },
}

/**
 * API 로그인 후 refreshToken 쿠키를 컨텍스트에 주입하고
 * 앱이 /auth/me 로 세션 복원할 수 있도록 준비한다.
 */
async function loginViaApi(context, email, password) {
  // API 직접 호출해서 refreshToken 쿠키 수령
  const apiPage = await context.newPage()
  const response = await apiPage.request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  })
  const body = await response.json()
  await apiPage.close()
  return body.data // { user, accessToken }
}

async function captureScreen({ email, password, targetPath, navigatePath }) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    isMobile: true,
    deviceScaleFactor: 2,
    baseURL: BASE_URL,
  })

  // API 로그인 (쿠키는 context에 자동 저장됨)
  await loginViaApi(context, email, password)

  const page = await context.newPage()

  // 앱 로드 (App.jsx 가 /auth/me 쿠키로 세션 복원)
  await page.goto(BASE_URL + navigatePath, { waitUntil: 'networkidle' })

  // 로그인 페이지로 리다이렉트된 경우 재시도
  if (page.url().includes('/login')) {
    // refreshToken 쿠키가 있어야 /auth/me 성공 → 잠시 대기 후 재시도
    await page.waitForTimeout(2000)
    await page.goto(BASE_URL + navigatePath, { waitUntil: 'networkidle' })
  }

  await page.waitForTimeout(2000)
  await page.screenshot({ path: targetPath, fullPage: false })
  await browser.close()
}

test.describe.configure({ mode: 'serial' })

test('01 - login page mobile', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT)
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: `${OUTPUT_DIR}/01_login_mobile.png`,
    fullPage: false,
  })
})

test('02 - operator dashboard mobile', async () => {
  await captureScreen({
    email: ACCOUNTS.admin.email,
    password: ACCOUNTS.admin.password,
    targetPath: `${OUTPUT_DIR}/02_operator_dashboard_mobile.png`,
    navigatePath: '/operator',
  })
})

test('03 - teacher review mobile', async () => {
  await captureScreen({
    email: ACCOUNTS.teacher.email,
    password: ACCOUNTS.teacher.password,
    targetPath: `${OUTPUT_DIR}/03_teacher_review_mobile.png`,
    navigatePath: '/teacher/review',
  })
})

test('04 - student qa mobile', async () => {
  await captureScreen({
    email: ACCOUNTS.student.email,
    password: ACCOUNTS.student.password,
    targetPath: `${OUTPUT_DIR}/04_student_qa_mobile.png`,
    navigatePath: '/student/qa',
  })
})

test('05 - student roadmap mobile', async () => {
  await captureScreen({
    email: ACCOUNTS.student.email,
    password: ACCOUNTS.student.password,
    targetPath: `${OUTPUT_DIR}/05_student_roadmap_mobile.png`,
    navigatePath: '/student/roadmap',
  })
})

test('06 - student weakpoints mobile', async () => {
  await captureScreen({
    email: ACCOUNTS.student.email,
    password: ACCOUNTS.student.password,
    targetPath: `${OUTPUT_DIR}/06_student_weakpoints_mobile.png`,
    navigatePath: '/student/weak',
  })
})
