import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import * as reportController from './reportController.js'

const router = Router()

const generateSchema = z.object({
  student_id: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  academy_id: z.string().uuid().optional(),
  academyId: z.string().uuid().optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM 형식으로 입력하세요').optional(),
}).transform((data) => ({
  student_id: data.student_id || data.studentId,
  academy_id: data.academy_id || data.academyId,
  period: data.period,
}))

router.get('/', authMiddleware, requireRole('operator'), reportController.getReports)
router.post('/generate', authMiddleware, requireRole('operator'), validate(generateSchema), reportController.generateReport)
// 정적 경로(/public/:token)는 동적 경로(/:id/...)보다 먼저 선언
router.get('/public/:token', reportController.getPublicReport)
router.post('/:id/send', authMiddleware, requireRole('operator'), reportController.sendReport)
router.post('/:id/send-sms', authMiddleware, requireRole('operator'), reportController.sendReport)
router.post('/:id/public-token', authMiddleware, requireRole('operator'), reportController.issuePublicToken)

export default router
