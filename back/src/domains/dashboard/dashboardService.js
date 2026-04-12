import * as dashboardRepository from './dashboardRepository.js'
import OpenAI from 'openai'
import { env } from '../../config/env.js'
import { logger } from '../../utils/logger.js'

const openai = new OpenAI({ apiKey: env.openai.apiKey })

/**
 * 이탈 위험 학생 목록에 대해 GPT AI 코멘트를 생성한다.
 * @param {Array} students - findChurnRiskStudents 결과 배열
 * @returns {Array} students with aiComment field
 */
export const generateRiskComments = async (students) => {
  if (!students || students.length === 0) return []

  const results = await Promise.all(
    students.map(async (student) => {
      try {
        const inactiveDays = student.inactive_days ?? 0
        const status = student.churn_status ?? 'at_risk'

        const prompt = [
          `학생 이름: ${student.name}`,
          `마지막 접속: ${inactiveDays}일 전`,
          `이탈 위험 상태: ${status === 'inactive' ? '장기 미접속(비활성)' : '이탈 위험'}`,
        ].join('\n')

        const completion = await openai.chat.completions.create({
          model: env.openai.modelChat,
          temperature: 0.7,
          max_tokens: 100,
          messages: [
            {
              role: 'system',
              content:
                '당신은 학원 운영자를 돕는 AI 어시스턴트입니다. 학생의 학습 참여 현황을 보고 운영자가 해당 학생에게 어떻게 접근하면 좋을지 1~2문장으로 간결하게 조언해 주세요. 한국어로 작성하세요.',
            },
            {
              role: 'user',
              content: `다음 학생 현황을 보고 운영자 접근 방법을 조언해 주세요:\n${prompt}`,
            },
          ],
        })

        return {
          ...student,
          aiComment: completion.choices[0]?.message?.content?.trim() ?? null,
        }
      } catch (err) {
        logger.warn(`AI 코멘트 생성 실패 (student: ${student.id}): ${err.message}`)
        return { ...student, aiComment: null }
      }
    })
  )

  return results
}

export const getChurnRisk = async (academy_id) => {
  return dashboardRepository.findChurnRiskStudents(academy_id)
}

export const getLectureStats = async (academy_id, filters = {}) => {
  return dashboardRepository.findLectureStats(academy_id, filters)
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
