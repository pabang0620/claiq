import * as attendanceRepository from './attendanceRepository.js'
import * as pointService from '../point/pointService.js'
import { env } from '../../config/env.js'

export const markAttendance = async ({ lectureId, studentId, academyId, status, markedBy }) => {
  const attendance = await attendanceRepository.markAttendance({
    lecture_id: lectureId,
    student_id: studentId,
    academy_id: academyId,
    status: status || 'present',
    marked_by: markedBy,
  })

  // 출석 포인트 지급 (오늘 첫 출석인 경우)
  if (status === 'present' || !status) {
    const today = new Date().toISOString().split('T')[0]
    const idempotencyKey = `daily_attendance:${studentId}:${today}`
    await pointService.addPoints({
      userId: studentId,
      academyId,
      type: 'daily_attendance',
      amount: env.points.dailyAttendance,
      referenceId: attendance.id,
      idempotencyKey,
    }).catch(() => {}) // 중복 시 무시
  }

  return attendance
}

export const getAttendancesByLecture = async (lectureId) => {
  return attendanceRepository.findAttendancesByLecture(lectureId)
}
