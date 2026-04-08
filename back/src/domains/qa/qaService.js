import * as qaRepository from './qaRepository.js'
import * as academyRepository from '../academy/academyRepository.js'
import { streamQA } from '../../ai/ragQA.js'
import { env } from '../../config/env.js'
import * as pointService from '../point/pointService.js'

export const askQuestion = async ({ question, studentId, academyId, lectureId, teacherId, sessionId, res }) => {
  // 세션 처리
  let session
  if (sessionId) {
    session = await qaRepository.findSessionById(sessionId)
    if (!session || session.student_id !== studentId) {
      const err = new Error('세션을 찾을 수 없습니다')
      err.status = 404
      throw err
    }
  } else {
    session = await qaRepository.createSession({
      student_id: studentId,
      teacher_id: teacherId,
      academy_id: academyId,
      lecture_id: lectureId,
      title: question.slice(0, 100),
    })
  }

  // 기존 대화 히스토리
  const history = await qaRepository.findMessages(session.id)

  // 사용자 메시지 저장
  await qaRepository.saveMessage({
    session_id: session.id,
    role: 'user',
    content: question,
  })

  // SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // RAG Q&A 스트리밍
  const { answer, sourceChunkIds, isEscalated } = await streamQA({
    question,
    teacherId: session.teacher_id,
    academyId,
    history,
    res,
  })

  // AI 응답 저장
  await qaRepository.saveMessage({
    session_id: session.id,
    role: 'ai',
    content: answer,
    is_escalated: isEscalated,
    source_chunks: sourceChunkIds,
  })

  // Q&A 사용 포인트 지급
  const today = new Date().toISOString().split('T')[0]
  const idempotencyKey = `qa_use:${studentId}:${today}:${session.id}`
  await pointService.addPoints({
    userId: studentId,
    academyId,
    type: 'qa_use',
    amount: env.points.qaPerUse,
    referenceId: session.id,
    idempotencyKey,
  }).catch(() => {}) // 포인트 실패는 무시

  res.end()
  return { sessionId: session.id }
}

export const createSession = async ({ studentId, teacherId, academyId, lectureId }) => {
  return qaRepository.createSession({
    student_id: studentId,
    teacher_id: teacherId,
    academy_id: academyId,
    lecture_id: lectureId || null,
    title: null,
  })
}

export const getSessions = async (studentId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit
  return qaRepository.findSessionsByStudent(studentId, limit, offset)
}

export const getSessionMessages = async (sessionId, userId) => {
  const session = await qaRepository.findSessionById(sessionId)
  if (!session) {
    const err = new Error('세션을 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  if (session.student_id !== userId && session.teacher_id !== userId) {
    const err = new Error('접근 권한이 없습니다')
    err.status = 403
    throw err
  }
  return qaRepository.findMessages(sessionId)
}

export const getEscalations = async ({ teacherId, academyId, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit
  return qaRepository.findEscalations({ teacher_id: teacherId, academy_id: academyId, limit, offset })
}

export const replyEscalation = async ({ messageId, response, teacherId }) => {
  return qaRepository.replyEscalation(messageId, response)
}
