# CLAIQ 프론트엔드 구현 플랜

---

## 1. 프로젝트 구조

```
frontend/
├── src/
│   ├── main.jsx                        # React 19 진입점
│   ├── App.jsx                         # 라우터 설정
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx           # 로그인
│   │   │   ├── SignupPage.jsx          # 회원가입 (역할 선택: 교강사/수강생/운영자)
│   │   │   └── JoinAcademyPage.jsx     # 학원 코드 입력 가입
│   │   ├── teacher/
│   │   │   ├── TeacherDashboardPage.jsx       # 교강사 홈
│   │   │   ├── LectureUploadPage.jsx          # 수업 녹음 업로드
│   │   │   ├── QuestionReviewPage.jsx         # AI 생성 문제 검증 (Human-in-the-Loop)
│   │   │   ├── QuestionReviewDetailPage.jsx   # 문제 개별 수정
│   │   │   ├── AttendancePage.jsx             # 출결 관리
│   │   │   ├── QAEscalationPage.jsx           # 에스컬레이션 질문 답변
│   │   │   └── LectureMaterialPage.jsx        # 강의 정리자료 업로드
│   │   ├── student/
│   │   │   ├── StudentDashboardPage.jsx       # 수강생 홈 (D-day + 로드맵 + 추천)
│   │   │   ├── RoadmapPage.jsx                # D-day 역산 학습 로드맵
│   │   │   ├── QuizPage.jsx                   # 오늘의 문제 풀기
│   │   │   ├── QuizResultPage.jsx             # 문제 풀이 결과 및 리뷰
│   │   │   ├── MiniExamPage.jsx               # 미니 모의고사
│   │   │   ├── MiniExamResultPage.jsx         # 모의고사 결과 리포트
│   │   │   ├── QAPage.jsx                     # AI Q&A (RAG 챗봇)
│   │   │   ├── WeakPointPage.jsx              # 수능 유형별 약점 분석
│   │   │   ├── MaterialPage.jsx               # 강의 정리자료 열람
│   │   │   ├── PointPage.jsx                  # 포인트 현황 및 교환
│   │   │   └── BadgePage.jsx                  # 뱃지 및 스트릭 현황
│   │   ├── operator/
│   │   │   ├── OperatorDashboardPage.jsx      # 운영자 홈
│   │   │   ├── ChurnRiskPage.jsx              # 이탈 위험 수강생 대시보드
│   │   │   ├── LectureStatsPage.jsx           # 강의별 이해도 통계
│   │   │   ├── ReportPage.jsx                 # 성취 리포트 생성 및 발송
│   │   │   ├── AcademySettingPage.jsx         # 학원 설정 (쿠폰, 포인트 조건)
│   │   │   └── MemberManagePage.jsx           # 멤버 관리 (초대/강퇴)
│   │   └── common/
│   │       ├── NotFoundPage.jsx
│   │       └── UnauthorizedPage.jsx
│   ├── components/
│   │   ├── ui/                         # 공통 UI 원자 컴포넌트
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Textarea.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Avatar.jsx
│   │   │   └── Tooltip.jsx
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx           # 사이드바 + 헤더 레이아웃
│   │   │   ├── Sidebar.jsx             # 역할별 사이드바 메뉴
│   │   │   ├── Header.jsx              # 상단 바 (유저 정보, 알림)
│   │   │   └── AuthLayout.jsx          # 로그인/회원가입 레이아웃
│   │   ├── teacher/
│   │   │   ├── UploadDropzone.jsx      # 드래그앤드랍 음성/파일 업로드
│   │   │   ├── UploadProgressSSE.jsx   # 업로드 진행 상태 (SSE 수신)
│   │   │   ├── QuestionCard.jsx        # 문제 검증 카드 (승인/수정/반려)
│   │   │   ├── AttendanceTable.jsx     # 출결 표기 테이블
│   │   │   └── EscalationItem.jsx      # 에스컬레이션 질문 목록 아이템
│   │   ├── student/
│   │   │   ├── RoadmapTimeline.jsx     # D-day 로드맵 타임라인 시각화
│   │   │   ├── DdayCounter.jsx         # 수능 D-day 카운터
│   │   │   ├── WeakTypeChart.jsx       # 수능 유형별 약점 레이더 차트
│   │   │   ├── QuizCard.jsx            # 문제 카드 (5지선다/단답형)
│   │   │   ├── QuizTimer.jsx           # 모의고사 타이머
│   │   │   ├── ChatBubble.jsx          # Q&A 채팅 말풍선
│   │   │   ├── StreamingText.jsx       # SSE 스트리밍 텍스트 렌더링
│   │   │   ├── StreakBadge.jsx         # 연속 출석 스트릭 표시
│   │   │   ├── PointSummary.jsx        # 포인트 요약 카드
│   │   │   └── RecommendCard.jsx       # 추천 강의/문제 카드
│   │   └── operator/
│   │       ├── ChurnRiskTable.jsx      # 이탈 위험 수강생 테이블
│   │       ├── LectureStatChart.jsx    # 강의별 정답률 차트
│   │       └── ReportPreview.jsx       # 성취 리포트 미리보기
│   ├── stores/                         # Zustand 상태 관리
│   │   ├── authStore.js
│   │   ├── academyStore.js
│   │   ├── lectureStore.js
│   │   ├── questionStore.js
│   │   ├── qaStore.js
│   │   ├── roadmapStore.js
│   │   ├── examStore.js
│   │   ├── pointStore.js
│   │   └── uiStore.js
│   ├── hooks/                          # 커스텀 훅
│   │   ├── useAuth.js
│   │   ├── useSSE.js                   # SSE 연결/구독 훅
│   │   ├── usePolling.js               # 폴링 훅
│   │   ├── useUpload.js                # 파일 업로드 + 진행 추적
│   │   ├── useQAStream.js              # RAG Q&A SSE 스트리밍
│   │   ├── useRoadmap.js
│   │   ├── useWeakPoint.js
│   │   └── useDebounce.js
│   ├── api/
│   │   ├── axios.js                    # Axios 인스턴스 설정
│   │   ├── auth.api.js
│   │   ├── academy.api.js
│   │   ├── lecture.api.js
│   │   ├── question.api.js
│   │   ├── qa.api.js
│   │   ├── roadmap.api.js
│   │   ├── exam.api.js
│   │   ├── attendance.api.js
│   │   ├── point.api.js
│   │   ├── report.api.js
│   │   └── dashboard.api.js
│   ├── router/
│   │   ├── index.jsx                   # React Router v7 설정
│   │   ├── PrivateRoute.jsx            # 인증 보호 라우트
│   │   └── RoleRoute.jsx               # 역할 기반 보호 라우트
│   ├── constants/
│   │   ├── roles.js                    # TEACHER, STUDENT, OPERATOR
│   │   ├── subjects.js                 # 수능 과목 목록
│   │   ├── questionTypes.js            # 문제 유형 (5지선다/단답형/혼합)
│   │   └── points.js                   # 포인트 적립 기준 상수
│   └── utils/
│       ├── formatDate.js
│       ├── formatPoint.js
│       ├── calcDday.js                 # 수능 D-day 계산
│       └── roleGuard.js
├── public/
│   └── assets/
├── index.html
├── vite.config.js
├── .env
└── .env.example
```

---

## 2. 공통 UI 컴포넌트 Props 인터페이스

```typescript
// Button.jsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  className?: string
}

// Input.jsx
interface InputProps {
  id: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

// Card.jsx
interface CardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  onClick?: () => void
}

// Modal.jsx
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  footer?: React.ReactNode
}

// ProgressBar.jsx
interface ProgressBarProps {
  value: number           // 0~100
  label?: string
  color?: 'primary' | 'success' | 'warning' | 'danger'
  showPercent?: boolean
  animated?: boolean
}

// Badge.jsx
interface BadgeProps {
  label: string
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

// Toast.jsx (uiStore에서 트리거)
interface ToastProps {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number       // ms, 기본 3000
}

// StreamingText.jsx (SSE 스트리밍 텍스트)
interface StreamingTextProps {
  text: string            // 현재까지 누적된 텍스트
  isStreaming: boolean
  className?: string
}

// QuizCard.jsx
interface QuizCardProps {
  question: {
    id: string
    content: string
    type: 'multiple_choice' | 'short_answer'
    options?: { label: string; text: string }[]
    difficulty: 'A' | 'B' | 'C'
    typeCode: string
    typeName: string
  }
  selectedAnswer?: string
  onAnswer: (answer: string) => void
  isSubmitted?: boolean
  correctAnswer?: string
  explanation?: string
}

// RoadmapTimeline.jsx
interface RoadmapTimelineProps {
  items: {
    id: string
    week: number
    typeCode: string
    typeName: string
    status: 'completed' | 'in_progress' | 'pending'
    lectureTitle?: string
  }[]
  ddayCount: number
}

// WeakTypeChart.jsx
interface WeakTypeChartProps {
  data: {
    typeCode: string
    typeName: string
    correctRate: number   // 0~1
    totalAttempts: number
  }[]
  subject: string
}

// ChurnRiskTable.jsx
interface ChurnRiskTableProps {
  students: {
    id: string
    name: string
    churnScore: number    // 0~1 (높을수록 위험)
    attendanceRate: number
    quizParticipationRate: number
    lastActiveAt: string
  }[]
  onContact: (studentId: string) => void
}
```

---

## 3. 상태 관리 설계 (Zustand 스토어)

```javascript
// src/stores/authStore.js
const useAuthStore = create((set, get) => ({
  user: null,           // { id, name, email, role, academyId, academyName }
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => { ... },
  signup: async (data) => { ... },
  logout: () => { ... },
  refreshToken: async () => { ... },
  setUser: (user) => set({ user, isAuthenticated: true }),
}))

// src/stores/lectureStore.js
const useLectureStore = create((set, get) => ({
  lectures: [],
  currentLecture: null,
  uploadStatus: 'idle',   // 'idle' | 'uploading' | 'processing' | 'done' | 'error'
  uploadProgress: 0,
  processingStep: null,   // 'stt' | 'embedding' | 'type_mapping' | 'question_gen'

  fetchLectures: async () => { ... },
  uploadLecture: async (formData) => { ... },
  setUploadStatus: (status) => set({ uploadStatus: status }),
  setProcessingStep: (step) => set({ processingStep: step }),
}))

// src/stores/questionStore.js
const useQuestionStore = create((set, get) => ({
  pendingQuestions: [],   // 검증 대기 문제 (교강사)
  approvedQuestions: [],  // 승인된 문제
  todayQuiz: [],          // 오늘의 추천 문제 (수강생)
  currentQuestion: null,
  submissionResult: null,

  fetchPendingQuestions: async () => { ... },
  reviewQuestion: async (id, action, editedData) => { ... },  // action: 'approve'|'edit'|'reject'
  fetchTodayQuiz: async () => { ... },
  submitAnswer: async (questionId, answer) => { ... },
}))

// src/stores/qaStore.js
const useQAStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],           // { id, role: 'user'|'ai', content, isStreaming }
  isAITyping: false,
  streamingText: '',

  fetchSessions: async () => { ... },
  startSession: async () => { ... },
  sendMessage: async (text) => { ... },       // SSE 스트리밍 트리거
  appendStreamChunk: (chunk) => set(state => ({
    streamingText: state.streamingText + chunk
  })),
  finalizeStream: () => { ... },              // 스트리밍 완료 후 messages에 추가
}))

// src/stores/roadmapStore.js
const useRoadmapStore = create((set, get) => ({
  roadmap: null,          // { ddayCount, updatedAt, items: [...] }
  weakTypes: [],          // 수능 유형별 정답률
  isLoading: false,

  fetchRoadmap: async () => { ... },
  regenerateRoadmap: async () => { ... },
  fetchWeakTypes: async (subject) => { ... },
}))

// src/stores/examStore.js
const useExamStore = create((set, get) => ({
  currentExam: null,      // { id, questions, timeLimitSec, totalScore }
  answers: {},            // { questionId: answer }
  remainingTime: 0,
  isSubmitted: false,
  report: null,           // 유형별 분석 리포트

  generateExam: async () => { ... },
  setAnswer: (questionId, answer) => set(state => ({
    answers: { ...state.answers, [questionId]: answer }
  })),
  submitExam: async () => { ... },
  fetchReport: async (examId) => { ... },
  tick: () => set(state => ({ remainingTime: Math.max(0, state.remainingTime - 1) })),
}))

// src/stores/pointStore.js
const usePointStore = create((set, get) => ({
  balance: 0,
  transactions: [],
  badges: [],
  streak: { current: 0, longest: 0 },

  fetchBalance: async () => { ... },
  fetchTransactions: async () => { ... },
  fetchBadges: async () => { ... },
  redeem: async (rewardId, points) => { ... },
}))

// src/stores/uiStore.js
const useUIStore = create((set, get) => ({
  toasts: [],
  sidebarOpen: true,
  theme: 'light',

  addToast: (toast) => set(state => ({ toasts: [...state.toasts, { id: Date.now(), ...toast }] })),
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
}))
```

---

## 4. API 연동 설계 (Axios 인스턴스)

```javascript
// src/api/axios.js
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터 - Authorization 헤더 자동 주입
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터 - 401 시 토큰 갱신 후 재시도
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await useAuthStore.getState().refreshToken()
        return api(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api

// src/api/auth.api.js
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
}

// src/api/lecture.api.js
export const lectureApi = {
  upload: (formData, onUploadProgress) =>
    api.post('/lectures', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: 300000,    // 5분 (대용량 음성 파일)
    }),
  getList: (params) => api.get('/lectures', { params }),
  getById: (id) => api.get(`/lectures/${id}`),
}

// src/api/question.api.js
export const questionApi = {
  getPending: (params) => api.get('/questions', { params: { status: 'pending', ...params } }),
  review: (id, action, data) => api.patch(`/questions/${id}/review`, { action, ...data }),
  getTodayQuiz: () => api.get('/questions/today'),
  submitAnswer: (id, answer) => api.post(`/questions/${id}/submit`, { answer }),
  getTypeStats: () => api.get('/students/me/type-stats'),
}

// src/api/qa.api.js
export const qaApi = {
  getSessions: () => api.get('/qa/sessions'),
  getMessages: (sessionId) => api.get(`/qa/sessions/${sessionId}/messages`),
  // ask는 SSE이므로 별도 처리 (useQAStream 훅)
}

// src/api/roadmap.api.js
export const roadmapApi = {
  get: () => api.get('/roadmap/me'),
  regenerate: () => api.post('/roadmap/regenerate'),
}

// src/api/exam.api.js
export const examApi = {
  generate: () => api.post('/exams/generate'),
  submit: (id, answers) => api.post(`/exams/${id}/submit`, { answers }),
  getReport: (id) => api.get(`/exams/${id}/report`),
}

// src/api/dashboard.api.js
export const dashboardApi = {
  getChurnRisk: (params) => api.get('/dashboard/churn-risk', { params }),
  getLectureStats: (params) => api.get('/dashboard/lecture-stats', { params }),
}
```

---

## 5. SSE 스트리밍 구현

```javascript
// src/hooks/useSSE.js
import { useEffect, useRef, useCallback } from 'react'

/**
 * 범용 SSE 훅
 * @param {string} url - SSE 엔드포인트 (null이면 연결 안 함)
 * @param {object} handlers - { onMessage, onError, onOpen, onClose }
 */
export function useSSE(url, handlers) {
  const esRef = useRef(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const connect = useCallback(() => {
    if (!url) return
    const token = localStorage.getItem('accessToken')
    const fullUrl = `${import.meta.env.VITE_API_URL}${url}?token=${token}`

    esRef.current = new EventSource(fullUrl)

    esRef.current.onopen = () => handlersRef.current.onOpen?.()
    esRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      handlersRef.current.onMessage?.(data)
    }
    esRef.current.onerror = (e) => {
      handlersRef.current.onError?.(e)
      esRef.current?.close()
    }
  }, [url])

  const disconnect = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
  }, [])

  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])

  return { disconnect }
}

// src/hooks/useQAStream.js - RAG Q&A 스트리밍 특화 훅
import { useCallback, useState } from 'react'
import { useQAStore } from '../stores/qaStore'

export function useQAStream() {
  const { appendStreamChunk, finalizeStream } = useQAStore()
  const [isStreaming, setIsStreaming] = useState(false)
  const controllerRef = useRef(null)

  const sendMessage = useCallback(async (sessionId, text) => {
    setIsStreaming(true)
    controllerRef.current = new AbortController()

    const response = await fetch(`${import.meta.env.VITE_API_URL}/qa/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ sessionId, text }),
      signal: controllerRef.current.signal,
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(Boolean)
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'chunk') appendStreamChunk(data.content)
            if (data.type === 'done') finalizeStream()
          }
        }
      }
    } finally {
      setIsStreaming(false)
    }
  }, [appendStreamChunk, finalizeStream])

  const abort = useCallback(() => {
    controllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { sendMessage, isStreaming, abort }
}

// src/components/student/StreamingText.jsx
import { useEffect, useRef } from 'react'

export function StreamingText({ text, isStreaming, className }) {
  const cursorRef = useRef(null)

  return (
    <div className={`streaming-text ${className || ''}`}>
      <span>{text}</span>
      {isStreaming && (
        <span ref={cursorRef} className="streaming-cursor animate-pulse">▌</span>
      )}
    </div>
  )
}
```

### SSE 백엔드 이벤트 형식 (프론트 수신 기준)

```
// RAG Q&A 스트리밍
data: {"type": "chunk", "content": "텍스트 조각"}
data: {"type": "done", "messageId": "uuid", "isEscalated": false}
data: {"type": "error", "message": "오류 메시지"}

// 강의 업로드 처리 진행 상태
data: {"type": "progress", "step": "stt", "progress": 30}
data: {"type": "progress", "step": "embedding", "progress": 60}
data: {"type": "progress", "step": "type_mapping", "progress": 80}
data: {"type": "progress", "step": "question_gen", "progress": 100}
data: {"type": "done", "questionCount": 15}
```

---

## 6. 폴링 구현

```javascript
// src/hooks/usePolling.js
import { useEffect, useRef, useCallback } from 'react'

/**
 * 폴링 훅 - 특정 조건 달성 시 자동 중단
 * @param {Function} fetchFn - 비동기 조회 함수
 * @param {Function} shouldStop - (data) => boolean, true이면 폴링 중단
 * @param {number} interval - 폴링 주기 (ms)
 * @param {boolean} enabled - 폴링 활성화 여부
 */
export function usePolling(fetchFn, shouldStop, interval = 3000, enabled = true) {
  const timerRef = useRef(null)
  const fetchFnRef = useRef(fetchFn)
  const shouldStopRef = useRef(shouldStop)

  fetchFnRef.current = fetchFn
  shouldStopRef.current = shouldStop

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const poll = async () => {
      const data = await fetchFnRef.current()
      if (shouldStopRef.current(data)) {
        stop()
      }
    }

    poll()  // 즉시 1회 실행
    timerRef.current = setInterval(poll, interval)

    return stop
  }, [enabled, interval, stop])

  return { stop }
}

// 사용 예시 - 강의 업로드 처리 상태 폴링 (SSE 불가 환경 폴백)
// LectureUploadPage.jsx 내부
const { stop } = usePolling(
  () => lectureApi.getStatus(lectureId),
  (data) => data.status === 'done' || data.status === 'error',
  3000,
  isPollingEnabled
)

// 사용 예시 - 미니 모의고사 생성 완료 폴링
const { stop } = usePolling(
  () => examApi.getStatus(examId),
  (data) => data.status === 'ready',
  2000,
  isWaiting
)
```

---

## 7. 환경변수 및 Tailwind 설정

### 환경변수 (.env)

```env
VITE_API_URL=http://localhost:4000          # 로컬 개발
# VITE_API_URL=https://claiq-backend.onrender.com  # 배포 시 활성화

VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Tailwind 색상 테마 (tailwind.config.js)

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',   // 메인 브랜드 색상
          800: '#6d28d9',
          900: '#5b21b6',
          950: '#4c1d95',
        },
        surface: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
        },
        danger:  '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info:    '#3b82f6',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

### Pretendard 폰트 설정 (index.html)

```html
<!-- index.html <head> 에 추가 -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
/>
```

### 버튼 컴포넌트 색상 기준

| variant | 배경 | 텍스트 | Hover |
|---------|------|--------|-------|
| primary | primary-700 | white | primary-800 |
| secondary | primary-100 | primary-700 | primary-200 |
| danger | danger | white | red-600 |
| ghost | transparent | primary-700 | primary-50 |
| outline | white | primary-700 | primary-50 (border: primary-300) |

---

## 8. 구현 단계 1~10 (파일 단위 체크리스트)

### 단계 1 - 프로젝트 초기화 및 공통 기반

- [ ] `vite.config.js` - React 19, 경로 별칭(@/) 설정
- [ ] `tailwind.config.js` - 보라색 primary 테마 설정 (위 설정 그대로)
- [ ] `index.html` - Pretendard 폰트 CDN 링크 추가
- [ ] `.env.example` - VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- [ ] `src/main.jsx` - React 19 createRoot 진입점
- [ ] `src/App.jsx` - React Router v7 라우터 구성
- [ ] `src/constants/roles.js` - TEACHER, STUDENT, OPERATOR 상수
- [ ] `src/utils/formatDate.js`, `calcDday.js`, `formatPoint.js`
- [ ] `src/stores/uiStore.js` - Toast, Sidebar 전역 상태
- [ ] `src/components/ui/` - Button, Input, Card, Modal, Spinner, Toast, Badge, ProgressBar (8종)
- [ ] `src/components/layout/AppLayout.jsx`, `Sidebar.jsx`, `Header.jsx`, `AuthLayout.jsx`

### 단계 2 - 인증 및 라우팅

- [ ] `src/api/axios.js` - Axios 인스턴스 (인터셉터 포함)
- [ ] `src/api/auth.api.js`
- [ ] `src/stores/authStore.js`
- [ ] `src/hooks/useAuth.js`
- [ ] `src/router/index.jsx` - 역할별 라우트 구성
- [ ] `src/router/PrivateRoute.jsx` - 인증 보호
- [ ] `src/router/RoleRoute.jsx` - 역할 기반 보호
- [ ] `src/pages/auth/LoginPage.jsx`
- [ ] `src/pages/auth/SignupPage.jsx` - 역할 선택 포함
- [ ] `src/pages/auth/JoinAcademyPage.jsx` - 학원 코드 입력
- [ ] `src/pages/common/NotFoundPage.jsx`, `UnauthorizedPage.jsx`

### 단계 3 - 강의 업로드 (교강사)

- [ ] `src/api/lecture.api.js`
- [ ] `src/stores/lectureStore.js`
- [ ] `src/hooks/useUpload.js` - multipart 업로드 + 진행률
- [ ] `src/hooks/useSSE.js` - 범용 SSE 훅
- [ ] `src/components/teacher/UploadDropzone.jsx`
- [ ] `src/components/teacher/UploadProgressSSE.jsx`
- [ ] `src/pages/teacher/LectureUploadPage.jsx`
- [ ] `src/pages/teacher/TeacherDashboardPage.jsx` (기본 레이아웃)

### 단계 4 - 문제 검증 화면 (Human-in-the-Loop)

- [ ] `src/api/question.api.js`
- [ ] `src/stores/questionStore.js`
- [ ] `src/components/teacher/QuestionCard.jsx` - 승인/수정/반려 액션
- [ ] `src/components/ui/Tabs.jsx`
- [ ] `src/pages/teacher/QuestionReviewPage.jsx` - 검증 대기 목록
- [ ] `src/pages/teacher/QuestionReviewDetailPage.jsx` - 문제 개별 수정

### 단계 5 - 출결 및 강의 자료 (교강사)

- [ ] `src/api/attendance.api.js`
- [ ] `src/components/teacher/AttendanceTable.jsx`
- [ ] `src/pages/teacher/AttendancePage.jsx`
- [ ] `src/pages/teacher/LectureMaterialPage.jsx` - 파일 업로드 (PDF/이미지)

### 단계 6 - RAG Q&A 챗봇 (수강생)

- [ ] `src/api/qa.api.js`
- [ ] `src/stores/qaStore.js`
- [ ] `src/hooks/useQAStream.js` - Fetch Streaming API 훅
- [ ] `src/components/student/ChatBubble.jsx`
- [ ] `src/components/student/StreamingText.jsx`
- [ ] `src/pages/student/QAPage.jsx`
- [ ] `src/components/teacher/EscalationItem.jsx`
- [ ] `src/pages/teacher/QAEscalationPage.jsx`

### 단계 7 - 문제 풀기 및 약점 분석 (수강생)

- [ ] `src/components/student/QuizCard.jsx` - 5지선다/단답형
- [ ] `src/pages/student/QuizPage.jsx`
- [ ] `src/pages/student/QuizResultPage.jsx`
- [ ] `src/components/student/WeakTypeChart.jsx` - 레이더 차트 (recharts)
- [ ] `src/pages/student/WeakPointPage.jsx`
- [ ] `src/hooks/useWeakPoint.js`

### 단계 8 - D-day 로드맵 및 미니 모의고사 (수강생)

- [ ] `src/api/roadmap.api.js`, `exam.api.js`
- [ ] `src/stores/roadmapStore.js`, `examStore.js`
- [ ] `src/hooks/useRoadmap.js`
- [ ] `src/hooks/usePolling.js` - 모의고사 생성 대기 폴링
- [ ] `src/components/student/DdayCounter.jsx`
- [ ] `src/components/student/RoadmapTimeline.jsx`
- [ ] `src/pages/student/RoadmapPage.jsx`
- [ ] `src/pages/student/StudentDashboardPage.jsx` - D-day + 로드맵 + 추천 통합
- [ ] `src/components/student/QuizTimer.jsx`
- [ ] `src/pages/student/MiniExamPage.jsx`
- [ ] `src/pages/student/MiniExamResultPage.jsx`

### 단계 9 - 포인트·뱃지·스트릭 (수강생)

- [ ] `src/api/point.api.js`
- [ ] `src/stores/pointStore.js`
- [ ] `src/components/student/StreakBadge.jsx`
- [ ] `src/components/student/PointSummary.jsx`
- [ ] `src/components/student/RecommendCard.jsx`
- [ ] `src/pages/student/PointPage.jsx`
- [ ] `src/pages/student/BadgePage.jsx`
- [ ] `src/pages/student/MaterialPage.jsx` - 강의 정리자료 열람

### 단계 10 - 운영자 대시보드

- [ ] `src/api/dashboard.api.js`, `report.api.js`
- [ ] `src/components/operator/ChurnRiskTable.jsx`
- [ ] `src/components/operator/LectureStatChart.jsx` - 정답률 차트 (recharts)
- [ ] `src/components/operator/ReportPreview.jsx`
- [ ] `src/pages/operator/OperatorDashboardPage.jsx`
- [ ] `src/pages/operator/ChurnRiskPage.jsx`
- [ ] `src/pages/operator/LectureStatsPage.jsx`
- [ ] `src/pages/operator/ReportPage.jsx`
- [ ] `src/pages/operator/AcademySettingPage.jsx`
- [ ] `src/pages/operator/MemberManagePage.jsx`

---

## 8. 단계 간 종속성 다이어그램

```
단계 1 (공통 기반)
    ↓
단계 2 (인증/라우팅) ← 모든 이후 단계의 전제 조건
    ↓
    ├──────────────────────────────┐
    │                              │
단계 3 (강의 업로드)          단계 6 (Q&A 챗봇)
    ↓                              ↓
단계 4 (문제 검증)            단계 7 (문제 풀기)
    ↓                              ↓
단계 5 (출결/자료)            단계 8 (로드맵/모의고사)
                                   ↓
                              단계 9 (포인트/뱃지)
                                   ↓
                              단계 10 (운영자 대시보드)

병렬 진행 가능:
- 단계 3+6 동시 개발 (교강사/수강생 독립)
- 단계 5+7 동시 개발
- 단계 8+9 일부 동시 개발 (pointStore 완료 후 9 착수)
```

---

## 9. 위험 요소 및 완화 방안

| 위험 요소 | 심각도 | 완화 방안 |
|-----------|--------|-----------|
| SSE 연결 브라우저 호환성 문제 (구형 브라우저) | 중간 | usePolling 훅으로 SSE 폴백 구현, 연결 실패 시 자동 전환 |
| 대용량 음성 파일 업로드 중 페이지 이탈 | 높음 | 업로드 중 beforeunload 이벤트 경고, 재개(resume) 대신 재업로드 유도 |
| GPT-4 응답 지연으로 체감 속도 저하 | 높음 | SSE 스트리밍으로 첫 토큰 즉시 노출, Spinner + StreamingText 조합으로 대기 UX 개선 |
| Zustand 스토어 간 순환 참조 | 중간 | 스토어 간 직접 import 금지, 이벤트 기반 또는 훅 레이어에서 스토어 조합 |
| 미니 모의고사 타이머 탭 비활성화 시 오차 | 중간 | Page Visibility API 활용, 탭 복귀 시 서버 시간 기준으로 재동기화 |
| React 19 concurrent 기능으로 인한 예상치 못한 재렌더링 | 낮음 | useTransition, useDeferredValue 신중 적용, 스트리밍 상태 업데이트는 startTransition 외부 유지 |
| 역할별 라우팅 보안 우회 (URL 직접 접근) | 높음 | RoleRoute에서 accessToken 디코딩 후 역할 검증, 서버에서도 이중 검증 |
| recharts 번들 크기 (차트 라이브러리) | 낮음 | 차트 컴포넌트 lazy import, 운영자 대시보드 페이지만 번들 분리 |

---

## 10. 성공 기준

### 기능적 성공 기준

- [ ] 역할별 (교강사/수강생/운영자) 로그인 후 전용 대시보드 정상 렌더링
- [ ] 음성 파일 드래그앤드랍 업로드 + SSE 진행 상태 실시간 표시
- [ ] Human-in-the-Loop 검증 화면에서 승인/수정/반려 액션 정상 동작
- [ ] RAG Q&A SSE 스트리밍 응답 첫 토큰 3초 이내 노출
- [ ] 미니 모의고사 타이머 정확도 ±1초 이내
- [ ] D-day 로드맵 타임라인 시각화 정상 렌더링
- [ ] 수능 유형별 약점 레이더 차트 데이터 정확 표시
- [ ] 포인트 적립/차감 실시간 반영 (제출 즉시 balance 갱신)

### 비기능적 성공 기준

- [ ] Lighthouse 성능 점수 80점 이상 (초기 로드 기준)
- [ ] Core Web Vitals: LCP 2.5초 이하, CLS 0.1 이하
- [ ] 모바일 반응형 레이아웃 (375px~1440px 모든 해상도 대응)
- [ ] 빌드 번들 크기 초기 청크 300KB 이하 (gzip 기준)
- [ ] 모든 비동기 상태에 로딩/에러 UI 100% 처리
- [ ] 역할 미검증 라우트 접근 시 UnauthorizedPage 리다이렉트 100% 보장
