import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import * as academyController from './academyController.js'

const router = Router()

const createSchema = z.object({
  name: z.string().min(1, '학원 이름을 입력하세요').max(200),
  address: z.string().optional(),
  suneung_date: z.string().optional(),
})

const joinSchema = z.object({
  code: z.string().min(1, '학원 코드를 입력하세요'),
})

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().optional(),
  suneung_date: z.string().optional(),
})

const inviteSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  role: z.enum(['teacher', 'student', 'operator']).optional(),
})

const updateMemberRoleSchema = z.object({
  role: z.enum(['teacher', 'student', 'operator']),
})

const couponSchema = z.object({
  name: z.string().min(1, '쿠폰 이름을 입력하세요'),
  description: z.string().optional(),
  discountType: z.enum(['percent', 'fixed']).default('percent'),
  discountValue: z.number().int().min(0).max(100),
  validDays: z.number().int().min(1).default(30),
})

// /me 라우트는 /:id 보다 먼저 선언
router.get('/me', authMiddleware, academyController.getMyAcademy)
router.patch('/me', authMiddleware, requireRole('operator'), validate(updateSchema), academyController.updateMyAcademy)
router.get('/me/members', authMiddleware, academyController.getMyMembers)
router.post('/me/members/invite', authMiddleware, requireRole('operator'), validate(inviteSchema), academyController.inviteMember)
router.patch('/me/members/:userId/role', authMiddleware, requireRole('operator'), validate(updateMemberRoleSchema), academyController.updateMemberRole)
router.delete('/me/members/:userId', authMiddleware, requireRole('operator'), academyController.removeMember)
router.get('/me/coupons', authMiddleware, academyController.getMyCoupons)
router.post('/me/coupons', authMiddleware, requireRole('operator'), validate(couponSchema), academyController.createCoupon)
router.delete('/me/coupons/:id', authMiddleware, requireRole('operator'), academyController.deleteCoupon)

router.post('/', authMiddleware, requireRole('operator'), validate(createSchema), academyController.createAcademy)
router.post('/join', authMiddleware, validate(joinSchema), academyController.joinAcademy)
router.get('/:id', authMiddleware, academyController.getAcademy)
router.get('/:id/members', authMiddleware, academyController.getMembers)

export default router
