import * as attendanceService from './attendanceService.js'
import { successResponse } from '../../utils/response.js'

export const markAttendance = async (req, res, next) => {
  try {
    const { lecture_id, student_id, academy_id, status } = req.body
    const attendance = await attendanceService.markAttendance({
      lectureId: lecture_id,
      studentId: student_id || req.user.id,
      academyId: academy_id,
      status,
      markedBy: req.user.id,
    })
    return successResponse(res, attendance, '출결이 등록되었습니다', 201)
  } catch (err) {
    next(err)
  }
}

export const getAttendances = async (req, res, next) => {
  try {
    const attendances = await attendanceService.getAttendancesByLecture(req.params.lectureId)
    return successResponse(res, attendances)
  } catch (err) {
    next(err)
  }
}
