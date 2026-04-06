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
