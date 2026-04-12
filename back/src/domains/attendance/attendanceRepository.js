import { pool } from '../../config/db.js'

export const markAttendance = async ({ lecture_id, student_id, academy_id, status, marked_by }) => {
  const { rows } = await pool.query(
    `INSERT INTO attendances (lecture_id, student_id, academy_id, status, marked_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (lecture_id, student_id) DO UPDATE
       SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, marked_at = NOW()
     RETURNING *`,
    [lecture_id, student_id, academy_id, status, marked_by]
  )
  return rows[0]
}

export const findAttendancesByLecture = async (lecture_id) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.name AS student_name, u.email AS student_email
     FROM attendances a
     JOIN users u ON u.id = a.student_id
     WHERE a.lecture_id = $1
     ORDER BY a.marked_at ASC`,
    [lecture_id]
  )
  return rows
}

export const findAttendancesByStudent = async (student_id, academy_id) => {
  const { rows } = await pool.query(
    `SELECT a.*, l.title AS lecture_title, l.scheduled_at
     FROM attendances a
     JOIN lectures l ON l.id = a.lecture_id
     WHERE a.student_id = $1 AND a.academy_id = $2
     ORDER BY a.marked_at DESC`,
    [student_id, academy_id]
  )
  return rows
}

export const findAttendances = async ({ lectureId, studentId, date }) => {
  const conditions = []
  const params = []
  let idx = 1

  if (lectureId) { conditions.push(`a.lecture_id = $${idx++}`); params.push(lectureId) }
  if (studentId) { conditions.push(`a.student_id = $${idx++}`); params.push(studentId) }
  if (date) { conditions.push(`DATE(a.marked_at) = $${idx++}`); params.push(date) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(
    `SELECT a.*, u.name AS student_name, u.email AS student_email
     FROM attendances a
     JOIN users u ON u.id = a.student_id
     ${where}
     ORDER BY a.marked_at DESC`,
    params
  )
  return rows
}

export const updateAttendance = async (id, status, markedBy) => {
  const { rows } = await pool.query(
    `UPDATE attendances SET status = $2, marked_by = $3, marked_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, markedBy]
  )
  return rows[0] || null
}

export const findTodayAttendance = async (student_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM attendances
     WHERE student_id = $1
       AND DATE(marked_at) = CURRENT_DATE`,
    [student_id]
  )
  return rows[0] || null
}

export const findAcademyStudentsWithAttendance = async (academyId, date, lectureId = null) => {
  const { rows } = await pool.query(
    `SELECT
       u.id         AS student_id,
       u.name       AS student_name,
       u.email      AS student_email,
       a.id,
       a.status,
       a.lecture_id,
       a.academy_id,
       a.marked_at
     FROM academy_members am
     JOIN users u ON u.id = am.user_id
     LEFT JOIN attendances a
       ON a.student_id = am.user_id
      AND a.academy_id = am.academy_id
      AND DATE(a.marked_at AT TIME ZONE 'Asia/Seoul') = $2
      AND ($3::uuid IS NULL OR a.lecture_id = $3::uuid)
     WHERE am.academy_id = $1
       AND am.role = 'student'
       AND am.status = 'active'
     ORDER BY u.name ASC`,
    [academyId, date, lectureId || null]
  )
  return rows
}
