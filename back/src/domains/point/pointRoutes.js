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
router.get('/me/balance', authMiddleware, pointController.getMyBalance)
router.get('/me/transactions', authMiddleware, pointController.getMyTransactions)
router.get('/me/badges', authMiddleware, pointController.getMyBadges)
router.get('/me/streak', authMiddleware, pointController.getMyStreak)
router.post('/me/redeem', authMiddleware, validate(redeemSchema), pointController.redeemPoints)
router.post('/redeem', authMiddleware, validate(redeemSchema), pointController.redeemPoints)
router.get('/rewards', authMiddleware, pointController.getRewards)

export default router
