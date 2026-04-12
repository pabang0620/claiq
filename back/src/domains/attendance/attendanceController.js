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

export const getAttendanceList = async (req, res, next) => {
  try {
    const { lectureId, lecture_id, studentId, date, academy_id } = req.query
    const resolvedLectureId = lectureId || lecture_id   // 둘 다 지원
    const attendances = await attendanceService.getAttendanceList({
      lectureId: resolvedLectureId,
      studentId,
      date,
      academyId: academy_id,
    })
    return successResponse(res, attendances)
  } catch (err) {
    next(err)
  }
}

export const updateAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.updateAttendance({
      id: req.params.id,
      status: req.body.status,
      markedBy: req.user.id,
    })
    return successResponse(res, attendance, '출결이 수정되었습니다')
  } catch (err) {
    next(err)
  }
}

export const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { academy_id, lecture_id, records } = req.body
    const results = await attendanceService.bulkMarkAttendance({
      academyId: academy_id,
      lectureId: lecture_id,
      records,
      markedBy: req.user.id,
    })
    return successResponse(res, results, '일괄 출결이 처리되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getMyAttendance = async (req, res, next) => {
  try {
    const { academy_id } = req.query
    const attendances = await attendanceService.getMyAttendance({
      studentId: req.user.id,
      academyId: academy_id,
    })
    return successResponse(res, attendances)
  } catch (err) {
    next(err)
  }
}
