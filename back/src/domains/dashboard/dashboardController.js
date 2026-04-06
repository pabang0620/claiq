import * as dashboardService from './dashboardService.js'
import { successResponse } from '../../utils/response.js'

export const getChurnRisk = async (req, res, next) => {
  try {
    const { academy_id } = req.query
    const students = await dashboardService.getChurnRisk(academy_id)
    return successResponse(res, students)
  } catch (err) {
    next(err)
  }
}

export const getLectureStats = async (req, res, next) => {
  try {
    const { academy_id } = req.query
    const stats = await dashboardService.getLectureStats(academy_id)
    return successResponse(res, stats)
  } catch (err) {
    next(err)
  }
}

export const getTeacherDashboard = async (req, res, next) => {
  try {
    const { academy_id } = req.query
    const data = await dashboardService.getTeacherDashboard({ teacherId: req.user.id, academyId: academy_id })
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const getStudentDashboard = async (req, res, next) => {
  try {
    const { academy_id } = req.query
    const data = await dashboardService.getStudentDashboard({ studentId: req.user.id, academyId: academy_id })
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const getOperatorDashboard = async (req, res, next) => {
  try {
    const { academy_id } = req.query
    const data = await dashboardService.getOperatorDashboard(academy_id)
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
