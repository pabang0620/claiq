import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import * as questionController from './questionController.js'

const router = Router()

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'approve', 'reject']),
  content: z.string().optional(),
  correct_answer: z.string().optional(),
  explanation: z.string().optional(),
  options: z.array(z.object({
    label: z.union([z.string(), z.number()]),
    content: z.string(),
  })).optional(),
}).transform((data) => ({
  ...data,
  status: data.status === 'approve' ? 'approved' : data.status === 'reject' ? 'rejected' : data.status,
}))

const submitSchema = z.object({
  submitted: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  academy_id: z.string().uuid('유효하지 않은 학원 ID').optional(),
}).transform((data) => ({
  submitted: data.submitted || data.answer,
  academy_id: data.academy_id,
}))

// 교사용 - status query param 지원 (프론트엔드 호환)
router.get('/', authMiddleware, requireRole('teacher', 'operator'), questionController.getPendingQuestions)
router.get('/pending', authMiddleware, requireRole('teacher', 'operator'), questionController.getPendingQuestions)

// 학생용 — 정적 경로는 동적(:id) 경로보다 먼저 선언
router.get('/today', authMiddleware, requireRole('student'), questionController.getTodayQuiz)
router.get('/student', authMiddleware, requireRole('student'), questionController.getStudentQuestions)

// 통계
router.get('/type-stats/me', authMiddleware, questionController.getTypeStats)

// 단건 조회 — 동적 경로는 정적 경로 이후에 선언
router.get('/:id', authMiddleware, questionController.getQuestionById)
router.patch('/:id/review', authMiddleware, requireRole('teacher', 'operator'), validate(reviewSchema), questionController.reviewQuestion)
router.post('/:id/submit', authMiddleware, requireRole('student'), validate(submitSchema), questionController.submitAnswer)

export default router
