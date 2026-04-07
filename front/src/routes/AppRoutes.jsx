import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout.jsx'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { PrivateRoute } from './PrivateRoute.jsx'
import { RoleRoute } from './RoleRoute.jsx'
import { PageSpinner } from '../components/ui/Spinner.jsx'
import { ROLES } from '../constants/roles.js'

// Auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'))
const SignupPage = lazy(() => import('../pages/auth/SignupPage.jsx'))
const JoinAcademyPage = lazy(() => import('../pages/auth/JoinAcademyPage.jsx'))

// Teacher pages
const TeacherDashboardPage = lazy(() => import('../pages/teacher/TeacherDashboardPage.jsx'))
const LectureUploadPage = lazy(() => import('../pages/teacher/LectureUploadPage.jsx'))
const QuestionReviewPage = lazy(() => import('../pages/teacher/QuestionReviewPage.jsx'))
const QuestionReviewDetailPage = lazy(() => import('../pages/teacher/QuestionReviewDetailPage.jsx'))
const AttendancePage = lazy(() => import('../pages/teacher/AttendancePage.jsx'))
const QAEscalationPage = lazy(() => import('../pages/teacher/QAEscalationPage.jsx'))
const LectureMaterialPage = lazy(() => import('../pages/teacher/LectureMaterialPage.jsx'))

// Student pages
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage.jsx'))
const RoadmapPage = lazy(() => import('../pages/student/RoadmapPage.jsx'))
const QuizPage = lazy(() => import('../pages/student/QuizPage.jsx'))
const QuizResultPage = lazy(() => import('../pages/student/QuizResultPage.jsx'))
const MiniExamPage = lazy(() => import('../pages/student/MiniExamPage.jsx'))
const MiniExamResultPage = lazy(() => import('../pages/student/MiniExamResultPage.jsx'))
const QAPage = lazy(() => import('../pages/student/QAPage.jsx'))
const WeakPointPage = lazy(() => import('../pages/student/WeakPointPage.jsx'))
const MaterialPage = lazy(() => import('../pages/student/MaterialPage.jsx'))
const PointPage = lazy(() => import('../pages/student/PointPage.jsx'))
const BadgePage = lazy(() => import('../pages/student/BadgePage.jsx'))

// Operator pages
const OperatorDashboardPage = lazy(() => import('../pages/operator/OperatorDashboardPage.jsx'))
const ChurnRiskPage = lazy(() => import('../pages/operator/ChurnRiskPage.jsx'))
const LectureStatsPage = lazy(() => import('../pages/operator/LectureStatsPage.jsx'))
const ReportPage = lazy(() => import('../pages/operator/ReportPage.jsx'))
const AcademySettingPage = lazy(() => import('../pages/operator/AcademySettingPage.jsx'))
const MemberManagePage = lazy(() => import('../pages/operator/MemberManagePage.jsx'))

// Report public page (no auth)
const PublicReportPage = lazy(() => import('../pages/report/PublicReportPage.jsx'))

// Legal pages
const PrivacyPage = lazy(() => import('../pages/legal/PrivacyPage.jsx'))
const TermsPage = lazy(() => import('../pages/legal/TermsPage.jsx'))

// Common pages
const NotFoundPage = lazy(() => import('../pages/common/NotFoundPage.jsx'))
const UnauthorizedPage = lazy(() => import('../pages/common/UnauthorizedPage.jsx'))

function Wrap({ children }) {
  return <Suspense fallback={<PageSpinner />}>{children}</Suspense>
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Wrap><LoginPage /></Wrap>} />
        <Route path="/signup" element={<Wrap><SignupPage /></Wrap>} />
        <Route
          path="/join-academy"
          element={
            <PrivateRoute>
              <Wrap><JoinAcademyPage /></Wrap>
            </PrivateRoute>
          }
        />
      </Route>

      {/* Teacher */}
      <Route
        path="/teacher"
        element={
          <RoleRoute allowedRoles={[ROLES.TEACHER]}>
            <AppLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Wrap><TeacherDashboardPage /></Wrap>} />
        <Route path="upload" element={<Wrap><LectureUploadPage /></Wrap>} />
        <Route path="review" element={<Wrap><QuestionReviewPage /></Wrap>} />
        <Route path="review/:id" element={<Wrap><QuestionReviewDetailPage /></Wrap>} />
        <Route path="attendance" element={<Wrap><AttendancePage /></Wrap>} />
        <Route path="escalation" element={<Wrap><QAEscalationPage /></Wrap>} />
        <Route path="materials" element={<Wrap><LectureMaterialPage /></Wrap>} />
      </Route>

      {/* Student */}
      <Route
        path="/student"
        element={
          <RoleRoute allowedRoles={[ROLES.STUDENT]}>
            <AppLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Wrap><StudentDashboardPage /></Wrap>} />
        <Route path="roadmap" element={<Wrap><RoadmapPage /></Wrap>} />
        <Route path="quiz" element={<Wrap><QuizPage /></Wrap>} />
        <Route path="quiz/result" element={<Wrap><QuizResultPage /></Wrap>} />
        <Route path="exam" element={<Wrap><MiniExamPage /></Wrap>} />
        <Route path="exam/result/:id" element={<Wrap><MiniExamResultPage /></Wrap>} />
        <Route path="qa" element={<Wrap><QAPage /></Wrap>} />
        <Route path="weak" element={<Wrap><WeakPointPage /></Wrap>} />
        <Route path="materials" element={<Wrap><MaterialPage /></Wrap>} />
        <Route path="points" element={<Wrap><PointPage /></Wrap>} />
        <Route path="badges" element={<Wrap><BadgePage /></Wrap>} />
      </Route>

      {/* Operator */}
      <Route
        path="/operator"
        element={
          <RoleRoute allowedRoles={[ROLES.OPERATOR]}>
            <AppLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Wrap><OperatorDashboardPage /></Wrap>} />
        <Route path="churn" element={<Wrap><ChurnRiskPage /></Wrap>} />
        <Route path="stats" element={<Wrap><LectureStatsPage /></Wrap>} />
        <Route path="report" element={<Wrap><ReportPage /></Wrap>} />
        <Route path="members" element={<Wrap><MemberManagePage /></Wrap>} />
        <Route path="settings" element={<Wrap><AcademySettingPage /></Wrap>} />
      </Route>

      {/* Public report — 인증 불필요, 학부모 링크 공유용 */}
      <Route path="/report/public/:token" element={<Wrap><PublicReportPage /></Wrap>} />

      {/* Legal */}
      <Route path="/privacy" element={<Wrap><PrivacyPage /></Wrap>} />
      <Route path="/terms" element={<Wrap><TermsPage /></Wrap>} />

      {/* Common */}
      <Route path="/unauthorized" element={<Wrap><UnauthorizedPage /></Wrap>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Wrap><NotFoundPage /></Wrap>} />
    </Routes>
  )
}
