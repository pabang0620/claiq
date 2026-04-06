import * as reportService from './reportService.js'
import { successResponse } from '../../utils/response.js'

export const generateReport = async (req, res, next) => {
  try {
    const { student_id, academy_id, period } = req.body
    const report = await reportService.generateReport({
      studentId: student_id,
      academyId: academy_id,
      period,
      operatorId: req.user.id,
    })
    return successResponse(res, report, '리포트가 생성되었습니다', 201)
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
