import * as dashboardRepository from './dashboardRepository.js'

export const getChurnRisk = async (academy_id) => {
  return dashboardRepository.findChurnRiskStudents(academy_id)
}

export const getLectureStats = async (academy_id) => {
  return dashboardRepository.findLectureStats(academy_id)
}
