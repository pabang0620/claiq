import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import * as dashboardController from './dashboardController.js'

const router = Router()

router.get('/churn-risk', authMiddleware, requireRole('operator'), dashboardController.getChurnRisk)
router.get('/lecture-stats', authMiddleware, requireRole('operator', 'teacher'), dashboardController.getLectureStats)
router.get('/teacher', authMiddleware, requireRole('teacher'), dashboardController.getTeacherDashboard)
router.get('/student', authMiddleware, requireRole('student'), dashboardController.getStudentDashboard)
router.get('/operator', authMiddleware, requireRole('operator'), dashboardController.getOperatorDashboard)
router.get('/attendance-stats', authMiddleware, dashboardController.getAttendanceStats)

export default router
