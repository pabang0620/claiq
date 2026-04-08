import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import { aiLimiter } from '../../middleware/rateLimiter.js'
import * as qaController from './qaController.js'

const router = Router()

const createSessionSchema = z.object({
  academy_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  lecture_id: z.string().uuid().optional(),
})

const askSchema = z.object({
  question: z.string().min(1, '질문을 입력하세요').max(2000),
  academy_id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  lecture_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
})

const replySchema = z.object({
  response: z.string().min(1, '답변을 입력하세요'),
})

router.post('/sessions', authMiddleware, requireRole('student'), validate(createSessionSchema), qaController.createSession)
router.post('/ask', authMiddleware, requireRole('student'), aiLimiter, validate(askSchema), qaController.ask)
router.get('/sessions', authMiddleware, qaController.getSessions)
router.get('/sessions/:id/messages', authMiddleware, qaController.getSessionMessages)
router.get('/escalations', authMiddleware, requireRole('teacher'), qaController.getEscalations)
router.post('/escalations/:id/reply', authMiddleware, requireRole('teacher'), validate(replySchema), qaController.replyEscalation)

export default router
