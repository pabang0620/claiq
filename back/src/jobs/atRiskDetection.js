import cron from 'node-cron'
import { pool } from '../config/db.js'
import * as dashboardRepository from '../domains/dashboard/dashboardRepository.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const runAtRiskDetection = async () => {
  logger.info('[CRON] 이탈 위험 감지 시작')

  try {
    // 활성 학원 목록
    const { rows: academies } = await pool.query(
      `SELECT id, name FROM academies WHERE is_active = true AND deleted_at IS NULL`
    )

    let totalRisk = 0
    let totalInactive = 0

    for (const academy of academies) {
      const students = await dashboardRepository.findChurnRiskStudents(academy.id)

      const riskStudents = students.filter((s) => s.churn_status === 'at_risk')
      const inactiveStudents = students.filter((s) => s.churn_status === 'inactive')

      totalRisk += riskStudents.length
      totalInactive += inactiveStudents.length

      if (riskStudents.length > 0) {
        logger.warn(`[CRON] ${academy.name}: 이탈 위험 ${riskStudents.length}명, 이탈 ${inactiveStudents.length}명`)
      }
    }

    logger.info(`[CRON] 이탈 위험 감지 완료: 위험 ${totalRisk}명, 이탈 ${totalInactive}명`)
  } catch (err) {
    logger.error('[CRON] 이탈 위험 감지 오류:', err.message)
  }
}

export const startAtRiskDetection = () => {
  const schedule = env.cron.churnDetection
  cron.schedule(schedule, runAtRiskDetection, {
    scheduled: true,
    timezone: 'Asia/Seoul',
  })
  logger.info(`[CRON] 이탈 위험 감지 스케줄 등록: ${schedule}`)
}
