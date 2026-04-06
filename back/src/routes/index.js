import { Router } from 'express'
import authRoutes from '../domains/auth/authRoutes.js'
import academyRoutes from '../domains/academy/academyRoutes.js'
import lectureRoutes from '../domains/lecture/lectureRoutes.js'
import questionRoutes from '../domains/question/questionRoutes.js'
import qaRoutes from '../domains/qa/qaRoutes.js'
import roadmapRoutes from '../domains/roadmap/roadmapRoutes.js'
import examRoutes from '../domains/exam/examRoutes.js'
import attendanceRoutes from '../domains/attendance/attendanceRoutes.js'
import pointRoutes from '../domains/point/pointRoutes.js'
import badgeRoutes from '../domains/badge/badgeRoutes.js'
import reportRoutes from '../domains/report/reportRoutes.js'
import dashboardRoutes from '../domains/dashboard/dashboardRoutes.js'
import { getTypeStats } from '../domains/question/questionController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/academies', academyRoutes)
router.use('/lectures', lectureRoutes)
router.use('/questions', questionRoutes)
router.use('/qa', qaRoutes)
router.use('/roadmap', roadmapRoutes)
router.use('/exams', examRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/points', pointRoutes)
router.use('/badges', badgeRoutes)
router.use('/reports', reportRoutes)
router.use('/dashboard', dashboardRoutes)

// 학생 타입 통계 (별도 경로)
router.get('/students/me/type-stats', authMiddleware, getTypeStats)

export default router
