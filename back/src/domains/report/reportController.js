import * as reportService from './reportService.js'
import { successResponse } from '../../utils/response.js'
import { pool } from '../../config/db.js'

async function resolveAcademyId(queryAcademyId, userId) {
  if (queryAcademyId) return queryAcademyId
  const { rows } = await pool.query(
    `SELECT academy_id FROM academy_members WHERE user_id = $1 AND status = 'active' LIMIT 1`,
    [userId]
  )
  return rows[0]?.academy_id || null
}

export const generateReport = async (req, res, next) => {
  try {
    const { student_id, academy_id, period } = req.body
    const academyId = await resolveAcademyId(academy_id, req.user.id)
    const report = await reportService.generateReport({
      studentId: student_id,
      academyId,
      period,
      operatorId: req.user.id,
    })
    return successResponse(res, report, '리포트가 생성되었습니다', 201)
  } catch (err) {
    next(err)
  }
}

export const getReports = async (req, res, next) => {
  try {
    const { academy_id, student_id, page = 1, limit = 20 } = req.query
    const academyId = await resolveAcademyId(academy_id, req.user.id)
    const reports = await reportService.getReports({
      academyId,
      studentId: student_id,
      page: Number(page),
      limit: Number(limit),
    })
    return successResponse(res, reports)
  } catch (err) {
    next(err)
  }
}

export const sendReport = async (req, res, next) => {
  try {
    const report = await reportService.sendReport({ reportId: req.params.id })
    return successResponse(res, report, 'SMS 발송이 완료되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getPublicReport = async (req, res, next) => {
  try {
    const { token } = req.params
    const report = await reportService.getPublicReport({ token })
    return successResponse(res, report)
  } catch (err) {
    next(err)
  }
}

export const issuePublicToken = async (req, res, next) => {
  try {
    const result = await reportService.issuePublicToken({ reportId: req.params.id })
    return successResponse(res, result, '공개 링크가 생성되었습니다')
  } catch (err) {
    next(err)
  }
}
