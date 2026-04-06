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
import { requireRole } from '../middleware/roleMiddleware.js'
import * as lectureService from '../domains/lecture/lectureService.js'
import { successResponse } from '../utils/response.js'

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

// 수강생용: 내 강의 자료 목록
router.get('/materials/me', authMiddleware, requireRole('student'), async (req, res, next) => {
  try {
    const materials = await lectureService.getMyMaterials(req.user.id)
    return successResponse(res, materials)
  } catch (err) {
    next(err)
  }
})

export default router
