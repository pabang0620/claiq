import * as reportRepository from './reportRepository.js'
import { logger } from '../../utils/logger.js'

const sendSms = async (to, message) => {
  logger.info(`[SMS 시뮬레이션] 수신: ${to}\n${message}`)
  return { success: true, mock: true, message }
}

export const getReports = async ({ academyId, studentId, page, limit }) => {
  return reportRepository.findReports({
    academy_id: academyId,
    student_id: studentId,
    page,
    limit,
  })
}

export const generateReport = async ({ studentId, academyId, period, operatorId }) => {
  const currentPeriod = period || new Date().toISOString().slice(0, 7)

  const stats = await reportRepository.findStudentStatsForReport(studentId, academyId, currentPeriod)

  const content_json = {
    period: currentPeriod,
    attendance: {
      total: parseInt(stats.attendance.total) || 0,
      present: parseInt(stats.attendance.present_count) || 0,
      rate: parseInt(stats.attendance.total) > 0
        ? Math.round((parseInt(stats.attendance.present_count) / parseInt(stats.attendance.total)) * 100)
        : 0,
    },
    quiz: {
      total: parseInt(stats.submissions.total) || 0,
      correct: parseInt(stats.submissions.correct_count) || 0,
      rate: parseInt(stats.submissions.total) > 0
        ? Math.round((parseInt(stats.submissions.correct_count) / parseInt(stats.submissions.total)) * 100)
        : 0,
    },
    weakTypes: stats.weakTypes.map((t) => ({ type_code: t.type_code, type_name: t.type_name || t.type_code })),
    pointsEarned: parseInt(stats.pointsEarned) || 0,
    generatedAt: new Date().toISOString(),
  }

  return reportRepository.createReport({
    student_id: studentId,
    academy_id: academyId,
    report_period: currentPeriod,
    content_json,
  })
}

export const getPublicReport = async ({ token }) => {
  const report = await reportRepository.findReportByPublicToken(token)
  if (!report) {
    const err = new Error('리포트를 찾을 수 없거나 공개 링크가 유효하지 않습니다')
    err.status = 404
    throw err
  }
  return report
}

export const issuePublicToken = async ({ reportId }) => {
  const token = await reportRepository.issuePublicToken(reportId)
  if (!token) {
    const err = new Error('리포트를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  return { public_token: token }
}

export const sendReport = async ({ reportId }) => {
  const report = await reportRepository.findReportById(reportId)
  if (!report) {
    const err = new Error('리포트를 찾을 수 없습니다')
    err.status = 404
    throw err
  }

  if (!report.student_phone) {
    const err = new Error('학생 전화번호가 등록되지 않았습니다')
    err.status = 400
    throw err
  }

  const content = report.content_json
  const message = [
    `[CLAIQ] ${content.period} 학습 성취 리포트`,
    `출석률: ${content.attendance?.rate || 0}%`,
    `문제풀이: ${content.quiz?.correct || 0}/${content.quiz?.total || 0}문제 정답`,
    `획득 포인트: ${content.pointsEarned || 0}P`,
  ].join('\n')

  const smsResult = await sendSms(report.student_phone, message)
  const updated = await reportRepository.markReportSent(reportId, report.student_phone)
  return { ...updated, simulatedMessage: smsResult.message }
}
