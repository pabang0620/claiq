import * as examService from './examService.js'
import { successResponse } from '../../utils/response.js'

export const generateExam = async (req, res, next) => {
  try {
    const { academy_id, subject_id, area, lecture_ids } = req.body
    const exam = await examService.generateStudentExam({
      studentId: req.user.id,
      academyId: academy_id,
      subjectId: subject_id,
      area,
      lectureIds: lecture_ids,
    })
    return successResponse(res, exam, '모의고사가 생성되었습니다', 201)
  } catch (err) {
    next(err)
  }
}

export const submitExam = async (req, res, next) => {
  try {
    const result = await examService.submitExam({
      examId: req.params.id,
      studentId: req.user.id,
      answers: req.body.answers,
    })
    return successResponse(res, result, '모의고사 제출이 완료되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getExamReport = async (req, res, next) => {
  try {
    const report = await examService.getExamReport({
      examId: req.params.id,
      userId: req.user.id,
    })
    return successResponse(res, report)
  } catch (err) {
    next(err)
  }
}

export const getExamStatus = async (req, res, next) => {
  try {
    const status = await examService.getExamStatus(req.params.id, req.user.id)
    return successResponse(res, status)
  } catch (err) {
    next(err)
  }
}

export const getMyHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const history = await examService.getMyHistory({
      userId: req.user.id,
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    })
    return successResponse(res, history)
  } catch (err) {
    next(err)
  }
}
