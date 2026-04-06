import { pool } from '../../config/db.js'
import { env } from '../../config/env.js'

export const findChurnRiskStudents = async (academy_id) => {
  const riskDays = env.churn.riskDays
  const inactiveDays = env.churn.inactiveDays

  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone,
            COALESCE(
              EXTRACT(DAYS FROM NOW() - MAX(a.marked_at)),
              999
            )::integer AS inactive_days,
            CASE
              WHEN MAX(a.marked_at) IS NULL THEN 'inactive'
              WHEN EXTRACT(DAYS FROM NOW() - MAX(a.marked_at)) >= $3 THEN 'inactive'
              WHEN EXTRACT(DAYS FROM NOW() - MAX(a.marked_at)) >= $2 THEN 'at_risk'
              ELSE 'active'
            END AS churn_status
     FROM academy_members am
     JOIN users u ON u.id = am.user_id
     LEFT JOIN attendances a ON a.student_id = u.id AND a.academy_id = $1
     WHERE am.academy_id = $1
       AND am.role = 'student'
       AND am.status = 'active'
     GROUP BY u.id, u.name, u.email, u.phone
     HAVING
       MAX(a.marked_at) IS NULL
       OR EXTRACT(DAYS FROM NOW() - MAX(a.marked_at)) >= $2
     ORDER BY inactive_days DESC`,
    [academy_id, riskDays, inactiveDays]
  )
  return rows
}

export const findTeacherDashboard = async ({ teacherId, academyId }) => {
  const conditions = ['l.teacher_id = $1', 'l.deleted_at IS NULL']
  const params = [teacherId]
  let idx = 2
  if (academyId) { conditions.push(`l.academy_id = $${idx++}`); params.push(academyId) }

  const [lectureResult, pendingResult, escalationResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FROM lectures l WHERE ${conditions.join(' AND ')}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*) FROM questions q
       JOIN lectures l ON l.id = q.lecture_id
       WHERE l.teacher_id = $1 AND q.status = 'pending'
       ${academyId ? `AND q.academy_id = $2` : ''}`,
      academyId ? [teacherId, academyId] : [teacherId]
    ),
    pool.query(
      `SELECT COUNT(*) FROM qa_messages qm
       JOIN qa_threads qt ON qt.id = qm.thread_id
       WHERE qt.teacher_id = $1 AND qm.is_escalated = true AND qm.resolved_at IS NULL
       ${academyId ? `AND qt.academy_id = $2` : ''}`,
      academyId ? [teacherId, academyId] : [teacherId]
    ).catch(() => ({ rows: [{ count: '0' }] })),
  ])

  return {
    lecture_count: parseInt(lectureResult.rows[0].count),
    pending_questions: parseInt(pendingResult.rows[0].count),
    escalation_count: parseInt(escalationResult.rows[0].count),
  }
}

export const findStudentDashboard = async ({ studentId, academyId }) => {
  const [pointResult, streakResult, roadmapResult] = await Promise.all([
    pool.query(
      `SELECT balance, total_earned FROM points WHERE user_id = $1`,
      [studentId]
    ),
    pool.query(
      `SELECT current_streak, longest_streak FROM learning_streaks WHERE user_id = $1`,
      [studentId]
    ),
    pool.query(
      `SELECT
         COUNT(ri.id) AS total_items,
         COUNT(CASE WHEN ri.status = 'completed' THEN 1 END) AS completed_items
       FROM learning_roadmaps lr
       LEFT JOIN roadmap_items ri ON ri.roadmap_id = lr.id
       WHERE lr.student_id = $1 AND lr.is_current = true`,
      [studentId]
    ),
  ])

  const point = pointResult.rows[0] || { balance: 0, total_earned: 0 }
  const streak = streakResult.rows[0] || { current_streak: 0, longest_streak: 0 }
  const rm = roadmapResult.rows[0] || { total_items: 0, completed_items: 0 }
  const totalItems = parseInt(rm.total_items) || 0
  const completedItems = parseInt(rm.completed_items) || 0

  return {
    points: { balance: point.balance, total_earned: point.total_earned },
    streak: { current: streak.current_streak, longest: streak.longest_streak },
    roadmap_progress: {
      total: totalItems,
      completed: completedItems,
      rate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    },
  }
}

export const findOperatorDashboard = async (academy_id) => {
  const riskDays = env.churn.riskDays

  const [churnResult, reportResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FROM (
         SELECT u.id
         FROM academy_members am
         JOIN users u ON u.id = am.user_id
         LEFT JOIN attendances a ON a.student_id = u.id AND a.academy_id = $1
         WHERE am.academy_id = $1 AND am.role = 'student' AND am.status = 'active'
         GROUP BY u.id
         HAVING MAX(a.marked_at) IS NULL OR EXTRACT(DAYS FROM NOW() - MAX(a.marked_at)) >= $2
       ) sub`,
      [academy_id, riskDays]
    ),
    pool.query(
      `SELECT COUNT(*) FROM achievement_reports
       WHERE academy_id = $1
       ORDER BY created_at DESC`,
      [academy_id]
    ).catch(() => ({ rows: [{ count: '0' }] })),
  ])

  return {
    churn_risk_count: parseInt(churnResult.rows[0].count),
    achievement_report_count: parseInt(reportResult.rows[0].count),
  }
}

export const findAttendanceStats = async ({ academyId, lectureId }) => {
  const conditions = []
  const params = []
  let idx = 1

  if (academyId) { conditions.push(`a.academy_id = $${idx++}`); params.push(academyId) }
  if (lectureId) { conditions.push(`a.lecture_id = $${idx++}`); params.push(lectureId) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
       COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count,
       COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
       COUNT(CASE WHEN a.status = 'excused' THEN 1 END) AS excused_count,
       ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) AS attendance_rate
     FROM attendances a
     ${where}`,
    params
  )
  return rows[0] || { total: 0, present_count: 0, absent_count: 0, late_count: 0, excused_count: 0, attendance_rate: 0 }
}

export const findLectureStats = async (academy_id) => {
  const { rows } = await pool.query(
    `SELECT l.id, l.title, l.created_at, l.processing_status,
            s.name AS subject_name,
            u.name AS teacher_name,
            COUNT(DISTINCT a.student_id) AS attendance_count,
            COUNT(DISTINCT q.id) AS question_count,
            COUNT(DISTINCT ans.id) AS submission_count,
            ROUND(
              AVG(CASE WHEN ans.is_correct THEN 100.0 ELSE 0 END), 1
            ) AS avg_correct_rate
     FROM lectures l
     JOIN subjects s ON s.id = l.subject_id
     JOIN users u ON u.id = l.teacher_id
     LEFT JOIN attendances a ON a.lecture_id = l.id
     LEFT JOIN questions q ON q.lecture_id = l.id AND q.status = 'approved'
     LEFT JOIN answer_submissions ans ON ans.question_id = q.id
     WHERE l.academy_id = $1 AND l.deleted_at IS NULL
     GROUP BY l.id, l.title, l.created_at, l.processing_status, s.name, u.name
     ORDER BY l.created_at DESC
     LIMIT 20`,
    [academy_id]
  )
  return rows
}
