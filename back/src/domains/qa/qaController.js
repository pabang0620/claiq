import * as qaService from './qaService.js'
import { successResponse } from '../../utils/response.js'

export const ask = async (req, res, next) => {
  try {
    const { question, academy_id, lecture_id, teacher_id, session_id } = req.body
    await qaService.askQuestion({
      question,
      studentId: req.user.id,
      academyId: academy_id,
      lectureId: lecture_id,
      teacherId: teacher_id,
      sessionId: session_id,
      res,
    })
  } catch (err) {
    // SSE가 시작된 경우 에러를 SSE로 전송
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
      res.end()
    } else {
      next(err)
    }
  }
}

export const createSession = async (req, res, next) => {
  try {
    const { academy_id, teacher_id, lecture_id } = req.body
    const session = await qaService.createSession({
      studentId: req.user.id,
      teacherId: teacher_id,
      academyId: academy_id,
      lectureId: lecture_id,
    })
    return successResponse(res, session, '세션이 생성되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const sessions = await qaService.getSessions(req.user.id, Number(page), Number(limit))
    return successResponse(res, sessions)
  } catch (err) {
    next(err)
  }
}

export const getSessionMessages = async (req, res, next) => {
  try {
    const messages = await qaService.getSessionMessages(req.params.id, req.user.id)
    return successResponse(res, messages)
  } catch (err) {
    next(err)
  }
}

export const getEscalations = async (req, res, next) => {
  try {
    const { academy_id, page = 1, limit = 20 } = req.query
    const escalations = await qaService.getEscalations({
      teacherId: req.user.id,
      academyId: academy_id,
      page: Number(page),
      limit: Number(limit),
    })
    return successResponse(res, escalations)
  } catch (err) {
    next(err)
  }
}

export const replyEscalation = async (req, res, next) => {
  try {
    const result = await qaService.replyEscalation({
      messageId: req.params.id,
      response: req.body.response,
      teacherId: req.user.id,
    })
    return successResponse(res, result, '답변이 등록되었습니다')
  } catch (err) {
    next(err)
  }
}
