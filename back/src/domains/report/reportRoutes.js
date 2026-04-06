import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import * as reportController from './reportController.js'

const router = Router()

const generateSchema = z.object({
  student_id: z.string().uuid(),
  academy_id: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM 형식으로 입력하세요').optional(),
})

router.post('/generate', authMiddleware, requireRole('operator'), validate(generateSchema), reportController.generateReport)
router.post('/:id/send', authMiddleware, requireRole('operator'), reportController.sendReport)

export default router
