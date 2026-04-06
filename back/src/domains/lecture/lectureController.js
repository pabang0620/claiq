import * as lectureService from './lectureService.js'
import { successResponse, paginatedResponse } from '../../utils/response.js'

export const uploadLecture = async (req, res, next) => {
  try {
    const lecture = await lectureService.uploadLecture({
      file: req.file,
      materialFiles: req.files,
      body: req.body,
      user: req.user,
    })
    return successResponse(res, lecture, '강의가 업로드되었습니다. 처리 중입니다.', 201)
  } catch (err) {
    next(err)
  }
}

export const getLectures = async (req, res, next) => {
  try {
    const { academy_id, teacher_id, subject_id, page = 1, limit = 20 } = req.query
    const result = await lectureService.getLectures({
      academy_id,
      teacher_id,
      subject_id,
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    })
    return paginatedResponse(res, result.data, result.meta)
  } catch (err) {
    next(err)
  }
}

export const getLecture = async (req, res, next) => {
  try {
    const lecture = await lectureService.getLecture(req.params.id)
    return successResponse(res, lecture)
  } catch (err) {
    next(err)
  }
}

export const getLectureStatus = (req, res) => {
  const { id } = req.params

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  lectureService.addSseClient(id, res)

  // 연결 종료 시 클라이언트 제거
  req.on('close', () => {
    lectureService.removeSseClient(id, res)
  })

  // 주기적 heartbeat (연결 유지)
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)

  req.on('close', () => clearInterval(heartbeat))
}
