import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import * as questionController from './questionController.js'

const router = Router()

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  content: z.string().optional(),
  correct_answer: z.string().optional(),
  explanation: z.string().optional(),
})

const submitSchema = z.object({
  submitted: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  academy_id: z.string().uuid('유효하지 않은 학원 ID'),
}).transform((data) => ({
  submitted: data.submitted || data.answer,
  academy_id: data.academy_id,
}))

// 교사용
router.get('/pending', authMiddleware, requireRole('teacher', 'operator'), questionController.getPendingQuestions)
router.patch('/:id/review', authMiddleware, requireRole('teacher', 'operator'), validate(reviewSchema), questionController.reviewQuestion)

// 학생용
router.get('/student', authMiddleware, requireRole('student'), questionController.getStudentQuestions)
router.post('/:id/submit', authMiddleware, requireRole('student'), validate(submitSchema), questionController.submitAnswer)

// 통계
router.get('/type-stats/me', authMiddleware, questionController.getTypeStats)

export default router
