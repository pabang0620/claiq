import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { validate } from '../../middleware/validate.js'
import * as attendanceController from './attendanceController.js'

const router = Router()

const markSchema = z.object({
  lecture_id: z.string().uuid(),
  student_id: z.string().uuid().optional(),
  academy_id: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late', 'excused']).optional(),
})

router.post('/', authMiddleware, requireRole('teacher', 'operator'), validate(markSchema), attendanceController.markAttendance)
router.get('/:lectureId', authMiddleware, attendanceController.getAttendances)

export default router
