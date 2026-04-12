import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import * as badgeController from './badgeController.js'

const router = Router()

router.get('/me', authMiddleware, badgeController.getMyBadges)
router.post('/all-complete-reward', authMiddleware, badgeController.claimAllCompleteReward)

export default router
