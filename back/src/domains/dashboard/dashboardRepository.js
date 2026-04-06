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
