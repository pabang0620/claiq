import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { uploadAudio } from '../../middleware/uploadMiddleware.js'
import * as lectureController from './lectureController.js'

const router = Router()

router.post('/', authMiddleware, requireRole('teacher'), uploadAudio.single('audio'), lectureController.uploadLecture)
router.get('/', authMiddleware, lectureController.getLectures)
router.get('/:id', authMiddleware, lectureController.getLecture)
router.get('/:id/status', authMiddleware, lectureController.getLectureStatus)

export default router
