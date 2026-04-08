import * as attendanceRepository from './attendanceRepository.js'
import * as pointService from '../point/pointService.js'
import { withTransaction } from '../../config/db.js'
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

export const getAttendanceList = async ({ lectureId, studentId, date }) => {
  return attendanceRepository.findAttendances({ lectureId, studentId, date })
}

export const updateAttendance = async ({ id, status, markedBy }) => {
  return attendanceRepository.updateAttendance(id, status, markedBy)
}

export const bulkMarkAttendance = async ({ academyId, lectureId, records, markedBy }) => {
  return withTransaction(async (client) => {
    const results = []
    for (const record of records) {
      const { rows } = await client.query(
        `INSERT INTO attendances (lecture_id, student_id, academy_id, status, marked_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (lecture_id, student_id) DO UPDATE
           SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, marked_at = NOW()
         RETURNING *`,
        [lectureId, record.student_id, academyId, record.status || 'present', markedBy]
      )
      results.push(rows[0])
    }
    return results
  })
}

export const getMyAttendance = async ({ studentId, academyId }) => {
  return attendanceRepository.findAttendancesByStudent(studentId, academyId)
}
