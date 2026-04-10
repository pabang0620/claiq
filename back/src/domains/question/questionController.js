import * as questionService from './questionService.js'
import { successResponse } from '../../utils/response.js'

export const getPendingQuestions = async (req, res, next) => {
  try {
    const { academy_id, page = 1, limit = 20, status } = req.query
    const questions = await questionService.getPendingQuestions({
      academy_id,
      teacher_id: req.user.role === 'teacher' ? req.user.id : undefined,
      page: Number(page),
      limit: Number(limit),
      status: status || 'pending',
    })
    return successResponse(res, questions)
  } catch (err) {
    next(err)
  }
}

export const reviewQuestion = async (req, res, next) => {
  try {
    const question = await questionService.reviewQuestion({
      id: req.params.id,
      ...req.body,
      reviewedBy: req.user.id,
    })
    return successResponse(res, question, '문제 검토가 완료되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getStudentQuestions = async (req, res, next) => {
  try {
    const { academy_id, type_code, difficulty, page = 1, limit = 20 } = req.query
    const questions = await questionService.getStudentQuestions({
      academy_id,
      type_code,
      difficulty,
      page: Number(page),
      limit: Number(limit),
    })
    return successResponse(res, questions)
  } catch (err) {
    next(err)
  }
}

export const submitAnswer = async (req, res, next) => {
  try {
    const result = await questionService.submitAnswer({
      questionId: req.params.id,
      studentId: req.user.id,
      academyId: req.body.academy_id,
      submitted: req.body.submitted,
    })
    return successResponse(res, result, result.is_correct ? '정답입니다!' : '오답입니다')
  } catch (err) {
    next(err)
  }
}

export const getTodayQuiz = async (req, res, next) => {
  try {
    const { academy_id } = req.query
    const questions = await questionService.getStudentQuestions({
      academy_id,
      page: 1,
      limit: 10,
    })
    return successResponse(res, questions)
  } catch (err) {
    next(err)
  }
}

export const getQuestionById = async (req, res, next) => {
  try {
    const question = await questionService.getQuestionById(req.params.id)
    if (!question) {
      const err = new Error('문제를 찾을 수 없습니다')
      err.status = 404
      return next(err)
    }
    return successResponse(res, question)
  } catch (err) {
    next(err)
  }
}

export const getTypeStats = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user.id
    const { academy_id, subject } = req.query
    const stats = await questionService.getTypeStats(studentId, academy_id, subject)
    return successResponse(res, stats)
  } catch (err) {
    next(err)
  }
}
