import cron from 'node-cron'
import { pool } from '../config/db.js'
import { generateStudentRoadmap } from '../domains/roadmap/roadmapService.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const runWeeklyRoadmapUpdate = async () => {
  logger.info('[CRON] 주간 로드맵 업데이트 시작')

  try {
    // 모든 활성 학원의 학생 목록 조회
    const { rows: students } = await pool.query(
      `SELECT DISTINCT am.user_id AS student_id, am.academy_id, u.name
       FROM academy_members am
       JOIN users u ON u.id = am.user_id
       WHERE am.role = 'student' AND am.status = 'active'`
    )

    logger.info(`[CRON] 로드맵 업데이트 대상: ${students.length}명`)

    let success = 0
    let failed = 0

    for (const student of students) {
      try {
        // 타입 통계가 있는 학생만 업데이트
        const { rows: stats } = await pool.query(
          `SELECT COUNT(*) FROM student_type_stats WHERE student_id = $1`,
          [student.student_id]
        )
        if (parseInt(stats[0].count) === 0) continue

        await generateStudentRoadmap({
          studentId: student.student_id,
          academyId: student.academy_id,
          studentName: student.name,
        })
        success++
      } catch (err) {
        logger.error(`[CRON] 학생 ${student.student_id} 로드맵 업데이트 실패:`, err.message)
        failed++
      }
    }

    logger.info(`[CRON] 주간 로드맵 업데이트 완료: 성공 ${success}, 실패 ${failed}`)
  } catch (err) {
    logger.error('[CRON] 주간 로드맵 업데이트 오류:', err.message)
  }
}

export const startWeeklyRoadmapUpdate = () => {
  const schedule = env.cron.roadmapUpdate
  cron.schedule(schedule, runWeeklyRoadmapUpdate, {
    scheduled: true,
    timezone: 'Asia/Seoul',
  })
  logger.info(`[CRON] 주간 로드맵 업데이트 스케줄 등록: ${schedule}`)
}
