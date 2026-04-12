import * as dashboardService from './dashboardService.js'
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

export const getChurnRisk = async (req, res, next) => {
  try {
    const academyId = await resolveAcademyId(req.query.academy_id, req.user.id)
    const students = await dashboardService.getChurnRisk(academyId)
    return successResponse(res, students)
  } catch (err) {
    next(err)
  }
}

export const getLectureStats = async (req, res, next) => {
  try {
    const { subject, period } = req.query
    const academyId = await resolveAcademyId(req.query.academy_id, req.user.id)
    const stats = await dashboardService.getLectureStats(academyId, { subject, period })
    return successResponse(res, stats)
  } catch (err) {
    next(err)
  }
}

export const getTeacherDashboard = async (req, res, next) => {
  try {
    const academyId = await resolveAcademyId(req.query.academy_id, req.user.id)
    const data = await dashboardService.getTeacherDashboard({ teacherId: req.user.id, academyId })
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const getStudentDashboard = async (req, res, next) => {
  try {
    const academyId = await resolveAcademyId(req.query.academy_id, req.user.id)
    const data = await dashboardService.getStudentDashboard({ studentId: req.user.id, academyId })
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const getOperatorDashboard = async (req, res, next) => {
  try {
    const academyId = await resolveAcademyId(req.query.academy_id, req.user.id)
    const data = await dashboardService.getOperatorDashboard(academyId)
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const getAttendanceStats = async (req, res, next) => {
  try {
    const { academy_id, lecture_id } = req.query
    const data = await dashboardService.getAttendanceStats({ academyId: academy_id, lectureId: lecture_id })
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const generateRiskComments = async (req, res, next) => {
  try {
    const { academy_id } = req.body
    const academyId = await resolveAcademyId(academy_id, req.user.id)
    const students = await dashboardService.getChurnRisk(academyId)
    const withComments = await dashboardService.generateRiskComments(students)
    return successResponse(res, withComments, 'AI 코멘트 생성 완료')
  } catch (err) {
    next(err)
  }
}
