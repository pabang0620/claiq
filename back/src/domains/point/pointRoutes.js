import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validate } from '../../middleware/validate.js'
import * as pointController from './pointController.js'

const router = Router()

router.get('/me', authMiddleware, pointController.getMyPoints)
router.get('/me/balance', authMiddleware, pointController.getMyBalance)
router.get('/me/transactions', authMiddleware, pointController.getMyTransactions)
router.get('/me/badges', authMiddleware, pointController.getMyBadges)
router.get('/me/streak', authMiddleware, pointController.getMyStreak)
router.post('/me/redeem', authMiddleware, pointController.redeemPoints)
router.post('/redeem', authMiddleware, pointController.redeemPoints)
router.get('/rewards', authMiddleware, pointController.getRewards)

export default router
