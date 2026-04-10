import { pool } from '../../config/db.js'

export const createReport = async ({ student_id, academy_id, report_period, content_json }) => {
  const { rows } = await pool.query(
    `INSERT INTO achievement_reports (student_id, academy_id, report_period, content_json)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [student_id, academy_id, report_period, JSON.stringify(content_json)]
  )
  return rows[0]
}

export const findReportById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ar.*, u.name AS student_name, u.phone AS student_phone
     FROM achievement_reports ar
     JOIN users u ON u.id = ar.student_id
     WHERE ar.id = $1`,
    [id]
  )
  return rows[0] || null
}

export const markReportSent = async (id, phone) => {
  const { rows } = await pool.query(
    `UPDATE achievement_reports
     SET sent_to_phone = $2, sent_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, phone]
  )
  return rows[0]
}

export const findReports = async ({ academy_id, student_id, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit
  const params = []
  const conditions = []

  if (academy_id) { params.push(academy_id); conditions.push(`ar.academy_id = $${params.length}`) }
  if (student_id) { params.push(student_id); conditions.push(`ar.student_id = $${params.length}`) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  params.push(limit, offset)

  const { rows } = await pool.query(
    `SELECT ar.*, u.name AS student_name
     FROM achievement_reports ar
     JOIN users u ON u.id = ar.student_id
     ${where}
     ORDER BY ar.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
  return rows
}

export const issuePublicToken = async (id) => {
  const { rows } = await pool.query(
    `UPDATE achievement_reports
     SET public_token = uuid_generate_v4()
     WHERE id = $1 AND public_token IS NULL
     RETURNING public_token`,
    [id]
  )
  // 이미 토큰이 있으면 기존 토큰 반환
  if (rows[0]) return rows[0].public_token
  const existing = await pool.query(
    `SELECT public_token FROM achievement_reports WHERE id = $1`,
    [id]
  )
  return existing.rows[0]?.public_token || null
}

export const findReportByPublicToken = async (token) => {
  const { rows } = await pool.query(
    `SELECT ar.id, ar.report_period, ar.content_json, ar.created_at,
            u.name AS student_name,
            a.name AS academy_name
     FROM achievement_reports ar
     JOIN users u ON u.id = ar.student_id
     JOIN academies a ON a.id = ar.academy_id
     WHERE ar.public_token = $1`,
    [token]
  )
  return rows[0] || null
}

export const findStudentStatsForReport = async (student_id, academy_id, period) => {
  const [attendResult, submitResult, typeResult, pointResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count
       FROM attendances
       WHERE student_id = $1 AND academy_id = $2
         AND TO_CHAR(marked_at, 'YYYY-MM') = $3`,
      [student_id, academy_id, period]
    ),
    pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_count
       FROM answer_submissions
       WHERE student_id = $1 AND academy_id = $2
         AND TO_CHAR(submitted_at, 'YYYY-MM') = $3`,
      [student_id, academy_id, period]
    ),
    pool.query(
      `SELECT s.type_code, s.correct_rate, qt.name AS type_name
       FROM student_type_stats s
       LEFT JOIN question_types qt ON qt.code = s.type_code
       WHERE s.student_id = $1 AND s.academy_id = $2
       ORDER BY s.correct_rate ASC LIMIT 5`,
      [student_id, academy_id]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS earned
       FROM point_transactions
       WHERE user_id = $1 AND academy_id = $2 AND amount > 0
         AND TO_CHAR(created_at, 'YYYY-MM') = $3`,
      [student_id, academy_id, period]
    ),
  ])

  return {
    attendance: attendResult.rows[0],
    submissions: submitResult.rows[0],
    weakTypes: typeResult.rows,
    pointsEarned: pointResult.rows[0]?.earned || 0,
  }
}
