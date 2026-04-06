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

router.post('/', authMiddleware, requireRole('operator'), validate(createSchema), academyController.createAcademy)
router.get('/:id', authMiddleware, academyController.getAcademy)
router.post('/join', authMiddleware, validate(joinSchema), academyController.joinAcademy)
router.get('/:id/members', authMiddleware, academyController.getMembers)

export default router
