import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validate } from '../../middleware/validate.js'
import * as pointController from './pointController.js'

const router = Router()

const redeemSchema = z.object({
  academy_id: z.string().uuid(),
})

router.get('/me', authMiddleware, pointController.getMyPoints)
router.post('/redeem', authMiddleware, validate(redeemSchema), pointController.redeemPoints)

export default router
