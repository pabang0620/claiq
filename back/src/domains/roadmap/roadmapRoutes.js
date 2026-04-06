import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import { aiLimiter } from '../../middleware/rateLimiter.js'
import * as roadmapController from './roadmapController.js'

const router = Router()

const regenerateSchema = z.object({
  academy_id: z.string().uuid(),
})

const updateItemSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']),
})

router.get('/me', authMiddleware, requireRole('student'), roadmapController.getMyRoadmap)
router.post('/regenerate', authMiddleware, requireRole('student'), aiLimiter, validate(regenerateSchema), roadmapController.regenerate)
router.patch('/items/:itemId', authMiddleware, validate(updateItemSchema), roadmapController.updateItem)

export default router
