import * as reportRepository from './reportRepository.js'
import { logger } from '../../utils/logger.js'
import { env } from '../../config/env.js'

const sendSms = async (to, message) => {
  // Solapi SMS 발송 (실제 구현)
  if (!env.solapi.apiKey || env.solapi.apiKey === 'placeholder') {
    logger.warn(`SMS 발송 스킵 (개발 환경): ${to} - ${message.slice(0, 50)}`)
    return { success: true, mock: true }
  }

  // TODO: @solapi/message-sdk 설치 후 실제 발송
  logger.info(`SMS 발송 시도: ${to}`)
  return { success: true }
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
      rate: stats.attendance.total > 0
        ? Math.round((stats.attendance.present_count / stats.attendance.total) * 100)
        : 0,
    },
    quiz: {
      total: parseInt(stats.submissions.total) || 0,
      correct: parseInt(stats.submissions.correct_count) || 0,
      rate: stats.submissions.total > 0
        ? Math.round((stats.submissions.correct_count / stats.submissions.total) * 100)
        : 0,
    },
    weakTypes: stats.weakTypes,
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

  await sendSms(report.student_phone, message)
  return reportRepository.markReportSent(reportId, report.student_phone)
}
