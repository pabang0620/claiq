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

const updateSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'excused']),
})

const bulkSchema = z.object({
  academy_id: z.string().uuid(),
  lecture_id: z.string().uuid(),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    status: z.enum(['present', 'absent', 'late', 'excused']).default('present'),
  })),
})

router.get('/me', authMiddleware, requireRole('student'), attendanceController.getMyAttendance)
router.get('/', authMiddleware, attendanceController.getAttendanceList)
router.post('/', authMiddleware, requireRole('teacher', 'operator'), validate(markSchema), attendanceController.markAttendance)
router.post('/bulk', authMiddleware, requireRole('teacher', 'operator'), validate(bulkSchema), attendanceController.bulkMarkAttendance)
router.patch('/:id', authMiddleware, requireRole('teacher', 'operator'), validate(updateSchema), attendanceController.updateAttendance)
router.get('/:lectureId', authMiddleware, attendanceController.getAttendances)

export default router
