import * as questionRepository from './questionRepository.js'
import * as pointService from '../point/pointService.js'
import { findUserAcademies } from '../academy/academyRepository.js'
import { env } from '../../config/env.js'
import { checkAndAwardBadges } from '../badge/badgeService.js'

export const getPendingQuestions = async ({ academy_id, teacher_id, page = 1, limit = 20, status = 'pending' }) => {
  const offset = (page - 1) * limit
  const { rows, total } = await questionRepository.findPendingQuestions({ academy_id, teacher_id, limit, offset, status })
  return { data: rows, meta: { total, page, limit } }
}

export const reviewQuestion = async ({ id, status, content, correct_answer, explanation, reviewedBy }) => {
  const question = await questionRepository.findQuestionById(id)
  if (!question) {
    const err = new Error('문제를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  return questionRepository.reviewQuestion({ id, status, content, correct_answer, explanation, reviewedBy })
}

export const getStudentQuestions = async ({ academy_id, type_code, difficulty, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit
  return questionRepository.findApprovedQuestions({ academy_id, type_code, difficulty, limit, offset })
}

export const submitAnswer = async ({ questionId, studentId, academyId, submitted }) => {
  // academy_id가 없으면 DB에서 수강생의 소속 학원 자동 조회
  let resolvedAcademyId = academyId
  if (!resolvedAcademyId) {
    const academies = await findUserAcademies(studentId)
    if (academies.length > 0) {
      resolvedAcademyId = academies[0].id
    }
  }

  const question = await questionRepository.findQuestionById(questionId)
  if (!question) {
    const err = new Error('문제를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  if (question.status !== 'approved') {
    const err = new Error('아직 검증되지 않은 문제입니다')
    err.status = 400
    throw err
  }

  const is_correct = submitted.trim() === question.correct_answer.trim()

  const pointMap = { A: env.points.correctA, B: env.points.correctB, C: env.points.correctC }
  const points_earned = is_correct ? (pointMap[question.difficulty] || 0) : 0

  const submission = await questionRepository.submitAnswer({
    student_id: studentId,
    question_id: questionId,
    academy_id: resolvedAcademyId,
    submitted,
    is_correct,
    points_earned,
  })

  // 유형별 통계 업데이트
  if (question.type_code) {
    await questionRepository.upsertTypeStats({
      student_id: studentId,
      academy_id: resolvedAcademyId,
      type_code: question.type_code,
      subject_id: question.subject_id,
      is_correct,
    })
  }

  // 포인트 지급 (중복 방지 idempotency key)
  if (is_correct && points_earned > 0) {
    const idempotencyKey = `correct:${studentId}:${questionId}`
    await pointService.addPoints({
      userId: studentId,
      academyId: resolvedAcademyId,
      type: `correct_${question.difficulty.toLowerCase()}`,
      amount: points_earned,
      referenceId: submission.id,
      idempotencyKey,
    })
  }

  // 뱃지 조건 확인 (fire-and-forget — 실패해도 답안 제출은 영향 없음)
  checkAndAwardBadges({ userId: studentId, academyId: resolvedAcademyId }).catch(() => {})

  return {
    submission,
    is_correct,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    points_earned,
  }
}

export const getQuestionById = async (id) => {
  return questionRepository.findQuestionById(id)
}

export const getTypeStats = async (studentId, academyId, subject) => {
  return questionRepository.findTypeStats(studentId, academyId, subject)
}
