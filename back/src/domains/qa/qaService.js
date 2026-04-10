import * as qaRepository from './qaRepository.js'
import * as academyRepository from '../academy/academyRepository.js'
import { streamQA } from '../../ai/ragQA.js'
import { env } from '../../config/env.js'
import * as pointService from '../point/pointService.js'
import { pool } from '../../config/db.js'

// academy_id, teacher_id가 없을 때 학생 소속 학원 및 첫 번째 교사를 자동 조회
async function resolveAcademyAndTeacher({ studentId, academyId, teacherId }) {
  let resolvedAcademyId = academyId
  let resolvedTeacherId = teacherId

  if (!resolvedAcademyId) {
    const academies = await academyRepository.findUserAcademies(studentId)
    if (academies.length > 0) {
      resolvedAcademyId = academies[0].id
    }
  }

  if (!resolvedTeacherId && resolvedAcademyId) {
    const teachers = await academyRepository.findMembers(resolvedAcademyId, 'teacher')
    if (teachers.length > 0) {
      resolvedTeacherId = teachers[0].id
    }
  }

  return { resolvedAcademyId, resolvedTeacherId }
}

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
    const { resolvedAcademyId, resolvedTeacherId } = await resolveAcademyAndTeacher({
      studentId,
      academyId,
      teacherId,
    })
    session = await qaRepository.createSession({
      student_id: studentId,
      teacher_id: resolvedTeacherId,
      academy_id: resolvedAcademyId,
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

  // RAG Q&A 스트리밍 — session.academy_id 사용 (resolveAcademyAndTeacher로 해결된 값이 세션에 저장됨)
  const { answer, sourceChunkIds, isEscalated } = await streamQA({
    question,
    teacherId: session.teacher_id,
    academyId: session.academy_id,
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

  // Q&A 사용 포인트 지급 — session.academy_id 사용 (원본 academyId는 undefined일 수 있음)
  const today = new Date().toISOString().split('T')[0]
  const idempotencyKey = `qa_use:${studentId}:${today}:${session.id}`
  await pointService.addPoints({
    userId: studentId,
    academyId: session.academy_id,
    type: 'qa_use',
    amount: env.points.qaPerUse,
    referenceId: session.id,
    idempotencyKey,
  }).catch(() => {}) // 포인트 실패는 무시

  res.end()
  return { sessionId: session.id }
}

export const createSession = async ({ studentId, teacherId, academyId, lectureId }) => {
  const { resolvedAcademyId, resolvedTeacherId } = await resolveAcademyAndTeacher({
    studentId,
    academyId,
    teacherId,
  })

  if (!resolvedAcademyId) {
    const err = new Error('소속 학원을 찾을 수 없습니다. 학원에 먼저 가입해주세요.')
    err.status = 400
    throw err
  }
  if (!resolvedTeacherId) {
    const err = new Error('학원에 등록된 교강사가 없습니다.')
    err.status = 400
    throw err
  }

  return qaRepository.createSession({
    student_id: studentId,
    teacher_id: resolvedTeacherId,
    academy_id: resolvedAcademyId,
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
  // 에스컬레이션이 해당 교강사 세션인지 확인 (권한 검증)
  const { rows } = await pool.query(
    `SELECT qm.id FROM qa_messages qm
     JOIN qa_sessions qs ON qs.id = qm.session_id
     WHERE qm.id = $1 AND qs.teacher_id = $2`,
    [messageId, teacherId]
  )
  if (!rows.length) {
    const err = new Error('접근 권한이 없거나 에스컬레이션을 찾을 수 없습니다')
    err.status = 403
    throw err
  }
  return qaRepository.replyEscalation(messageId, response)
}
