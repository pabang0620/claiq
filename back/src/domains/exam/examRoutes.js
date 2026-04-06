import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import { aiLimiter } from '../../middleware/rateLimiter.js'
import * as examController from './examController.js'

const router = Router()

const generateSchema = z.object({
  academy_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  area: z.enum(['국어', '수학', '영어']).optional(),
})

const submitSchema = z.object({
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    submitted: z.string(),
  })),
})

router.post('/generate', authMiddleware, requireRole('student'), aiLimiter, validate(generateSchema), examController.generateExam)
router.post('/:id/submit', authMiddleware, requireRole('student'), validate(submitSchema), examController.submitExam)
router.get('/:id/report', authMiddleware, examController.getExamReport)

export default router
