import * as dashboardRepository from './dashboardRepository.js'

export const getChurnRisk = async (academy_id) => {
  return dashboardRepository.findChurnRiskStudents(academy_id)
}

export const getLectureStats = async (academy_id) => {
  return dashboardRepository.findLectureStats(academy_id)
}

export const getTeacherDashboard = async ({ teacherId, academyId }) => {
  return dashboardRepository.findTeacherDashboard({ teacherId, academyId })
}

export const getStudentDashboard = async ({ studentId, academyId }) => {
  return dashboardRepository.findStudentDashboard({ studentId, academyId })
}

export const getOperatorDashboard = async (academyId) => {
  return dashboardRepository.findOperatorDashboard(academyId)
}

export const getAttendanceStats = async ({ academyId, lectureId }) => {
  return dashboardRepository.findAttendanceStats({ academyId, lectureId })
}
