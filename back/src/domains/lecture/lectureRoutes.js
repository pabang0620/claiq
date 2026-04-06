import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { uploadAudio, uploadMaterial } from '../../middleware/uploadMiddleware.js'
import * as lectureController from './lectureController.js'

const router = Router()

router.post('/', authMiddleware, requireRole('teacher'), uploadAudio.single('audio'), lectureController.uploadLecture)
router.get('/', authMiddleware, lectureController.getLectures)
router.get('/:id', authMiddleware, lectureController.getLecture)
router.get('/:id/status', authMiddleware, lectureController.getLectureStatus)
router.delete('/:id', authMiddleware, requireRole('teacher'), lectureController.deleteLecture)
router.get('/:lectureId/materials', authMiddleware, lectureController.getMaterials)
router.post('/:lectureId/materials', authMiddleware, requireRole('teacher'), uploadMaterial.single('file'), lectureController.uploadMaterial)
router.delete('/:lectureId/materials/:materialId', authMiddleware, requireRole('teacher'), lectureController.deleteMaterial)

export default router
