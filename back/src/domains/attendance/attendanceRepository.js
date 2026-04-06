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

export const findTodayAttendance = async (student_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM attendances
     WHERE student_id = $1
       AND DATE(marked_at) = CURRENT_DATE`,
    [student_id]
  )
  return rows[0] || null
}
